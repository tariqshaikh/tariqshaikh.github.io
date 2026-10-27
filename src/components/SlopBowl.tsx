import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Plus, X, Trash2, Crosshair, PanelLeft, AlertTriangle } from 'lucide-react';

/**
 * Slop Bowl — map a pantry, then build a bowl out of what you actually have.
 *
 * Two deliberate departures from the PRD:
 *
 * 1. Edges are DERIVED from the taxonomy (different role slot + compatible
 *    flavour) rather than hand-drawn. Drawing them is O(N²) data entry
 *    standing in front of the only feature that pays off — thirty ingredients
 *    is hundreds of lines before "what can I make" returns anything. Manual
 *    links survive as an override for pairings the rules miss, and manual cuts
 *    for ones they wrongly suggest.
 *
 * 2. Those same rules run backwards as a critic while you compose a bowl, so
 *    the taxonomy earns its keep twice: once suggesting, once warning.
 */

// ─── Taxonomy ────────────────────────────────────────────────────────────────

type Role = 'base' | 'protein' | 'topping' | 'accent';
type Flavor = 'sweet' | 'savory' | 'neutral';
type Stock = 'in' | 'low' | 'out';

interface Item {
  id: string;
  name: string;
  /** [0] is primary; the rest secondary. Multi-role items are one node, never
   *  duplicated — Cottage Cheese is Base first, Protein second. */
  roles: Role[];
  flavors: Flavor[];
  stock: Stock;
  x: number;
  y: number;
}

interface Store {
  items: Item[];
  /** Pairings the rules miss, and pairings they wrongly suggest. */
  extraLinks: [string, string][];
  cutLinks: [string, string][];
  /** The bowl currently being composed. */
  bowl: string[];
}

const ROLES: { id: Role; label: string; short: string; color: string }[] = [
  { id: 'base',    label: 'Bases',               short: 'Base',    color: '#2563eb' },
  { id: 'protein', label: 'Proteins',            short: 'Protein', color: '#dc2626' },
  { id: 'topping', label: 'Toppings & Mix-ins',  short: 'Topping', color: '#16a34a' },
  { id: 'accent',  label: 'Accents & Enhancers', short: 'Accent',  color: '#d97706' },
];

const ROLE_META = Object.fromEntries(ROLES.map(r => [r.id, r])) as Record<Role, typeof ROLES[number]>;
const FLAVORS: Flavor[] = ['sweet', 'savory', 'neutral'];
const ROLE_CENTRES: Record<Role, [number, number]> = {
  base: [300, 250], protein: [700, 230], topping: [300, 620], accent: [720, 620],
};

// ─── Pairing rules ───────────────────────────────────────────────────────────

/** Neutral goes with anything; otherwise a shared flavour is required. */
function flavorsAgree(a: Item, b: Item): boolean {
  if (a.flavors.includes('neutral') || b.flavors.includes('neutral')) return true;
  return a.flavors.some(f => b.flavors.includes(f));
}

/** Two items pair only if they can occupy different slots in a bowl. */
function rolesDiffer(a: Item, b: Item): boolean {
  return a.roles.some(r1 => b.roles.some(r2 => r1 !== r2));
}

const linkKey = (a: string, b: string) => [a, b].sort().join('~');

function buildEdges(store: Store): { a: string; b: string; manual: boolean }[] {
  const byId = Object.fromEntries(store.items.map(i => [i.id, i]));
  const cut = new Set(store.cutLinks.map(([a, b]) => linkKey(a, b)));
  const out: { a: string; b: string; manual: boolean }[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < store.items.length; i++) {
    for (let j = i + 1; j < store.items.length; j++) {
      const a = store.items[i], b = store.items[j];
      const k = linkKey(a.id, b.id);
      if (cut.has(k)) continue;
      if (rolesDiffer(a, b) && flavorsAgree(a, b)) { out.push({ a: a.id, b: b.id, manual: false }); seen.add(k); }
    }
  }
  for (const [a, b] of store.extraLinks) {
    const k = linkKey(a, b);
    if (seen.has(k) || cut.has(k) || !byId[a] || !byId[b]) continue;
    out.push({ a, b, manual: true });
    seen.add(k);
  }
  return out;
}

// ─── Bowl assembly ───────────────────────────────────────────────────────────

interface Bowl { parts: { item: Item; slot: Role }[]; score: number }

/**
 * Highlighting neighbours still leaves the user to assemble the thing. Since
 * the rules already exist, build the whole bowl: one item per slot, every pair
 * compatible, nothing out of stock.
 */
function suggestBowls(store: Store, limit = 9): Bowl[] {
  const ok = new Set(buildEdges(store).map(e => linkKey(e.a, e.b)));
  const fits = (a: Item, b: Item) => ok.has(linkKey(a.id, b.id));
  const avail = store.items.filter(i => i.stock !== 'out');
  const forRole = (r: Role) => avail.filter(i => i.roles.includes(r));
  const out: Bowl[] = [];

  for (const base of forRole('base')) {
    const proteins = [...forRole('protein').filter(p => p.id !== base.id && fits(base, p)), null];
    for (const protein of proteins) {
      const toppings = [...forRole('topping').filter(t =>
        t.id !== base.id && t.id !== protein?.id && fits(base, t) && (!protein || fits(protein, t))), null];
      for (const topping of toppings) {
        const accents = [...forRole('accent').filter(c =>
          ![base.id, protein?.id, topping?.id].includes(c.id)
          && fits(base, c) && (!protein || fits(protein, c)) && (!topping || fits(topping, c))), null];
        for (const accent of accents) {
          const parts = [
            { item: base, slot: 'base' as Role },
            protein && { item: protein, slot: 'protein' as Role },
            topping && { item: topping, slot: 'topping' as Role },
            accent && { item: accent, slot: 'accent' as Role },
          ].filter(Boolean) as { item: Item; slot: Role }[];
          if (parts.length < 3) continue;
          out.push({ parts, score: parts.length * 10 - parts.filter(p => p.item.stock === 'low').length * 3 });
        }
      }
    }
  }
  out.sort((a, b) => b.score - a.score);

  // Multi-role items produce the same bowl twice with the slots swapped —
  // "Yogurt(base) + Cottage(protein)" and "Cottage(base) + Yogurt(protein)"
  // are one bowl to a cook. Dedupe on the set of ingredients, not the slotting.
  const bySet = new Set<string>();
  const unique = out.filter(b => {
    const k = b.parts.map(p => p.item.id).sort().join('~');
    if (bySet.has(k)) return false;
    bySet.add(k);
    return true;
  });

  // Spread across bases so the list isn't ten variations on yogurt.
  const used = new Map<string, number>();
  const spread: Bowl[] = [];
  for (const pass of [1, 2, 3]) {
    for (const bowl of unique) {
      if (spread.length >= limit) break;
      const id = bowl.parts[0].item.id;
      if ((used.get(id) ?? 0) >= pass || spread.includes(bowl)) continue;
      used.set(id, (used.get(id) ?? 0) + 1);
      spread.push(bowl);
    }
  }
  return spread.slice(0, limit);
}

/**
 * Assign each item in the working bowl to a slot, letting multi-role items
 * slide into their secondary role when the primary is already filled — so
 * Yogurt + Cottage Cheese reads Base + Protein rather than two Bases.
 */
function assignSlots(items: Item[]): { item: Item; slot: Role }[] {
  const taken = new Set<Role>();
  return items.map(item => {
    const free = item.roles.find(r => !taken.has(r));
    const slot = free ?? item.roles[0];
    taken.add(slot);
    return { item, slot };
  });
}

/** The rules, run backwards: which pairs in this bowl actually clash. */
function bowlConflicts(items: Item[]): [Item, Item][] {
  const bad: [Item, Item][] = [];
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++)
      if (!flavorsAgree(items[i], items[j])) bad.push([items[i], items[j]]);
  return bad;
}

// ─── Seed pantry ─────────────────────────────────────────────────────────────
// An empty canvas teaches nothing, so first launch lands on a real fridge.

const SEED: Omit<Item, 'x' | 'y'>[] = [
  { id: 'rice',     name: 'Jasmine Rice',    roles: ['base'],            flavors: ['neutral'],         stock: 'in' },
  { id: 'oats',     name: 'Oats',            roles: ['base'],            flavors: ['neutral'],         stock: 'in' },
  { id: 'yogurt',   name: 'Greek Yogurt',    roles: ['base', 'protein'], flavors: ['neutral'],         stock: 'in' },
  { id: 'cottage',  name: 'Cottage Cheese',  roles: ['base', 'protein'], flavors: ['neutral'],         stock: 'in' },
  { id: 'greens',   name: 'Greens',          roles: ['base'],            flavors: ['savory'],          stock: 'in' },
  { id: 'chicken',  name: 'Grilled Chicken', roles: ['protein'],         flavors: ['savory'],          stock: 'in' },
  { id: 'eggs',     name: 'Eggs',            roles: ['protein'],         flavors: ['savory'],          stock: 'in' },
  { id: 'paneer',   name: 'Paneer',          roles: ['protein'],         flavors: ['savory'],          stock: 'low' },
  { id: 'tofu',     name: 'Tofu',            roles: ['protein'],         flavors: ['neutral'],         stock: 'out' },
  { id: 'berries',  name: 'Fresh Berries',   roles: ['topping'],         flavors: ['sweet'],           stock: 'in' },
  { id: 'cucumber', name: 'Sliced Cucumber', roles: ['topping'],         flavors: ['savory'],          stock: 'in' },
  { id: 'nuts',     name: 'Roasted Nuts',    roles: ['topping'],         flavors: ['neutral'],         stock: 'in' },
  { id: 'granola',  name: 'Granola',         roles: ['topping'],         flavors: ['sweet'],           stock: 'low' },
  { id: 'seeds',    name: 'Seeds',           roles: ['topping'],         flavors: ['neutral'],         stock: 'in' },
  { id: 'honey',    name: 'Honey',           roles: ['accent'],          flavors: ['sweet'],           stock: 'in' },
  { id: 'hothoney', name: 'Hot Honey',       roles: ['accent'],          flavors: ['sweet', 'savory'], stock: 'in' },
  { id: 'chili',    name: 'Chili Crisp',     roles: ['accent'],          flavors: ['savory'],          stock: 'in' },
  { id: 'oliveoil', name: 'Olive Oil',       roles: ['accent'],          flavors: ['savory'],          stock: 'in' },
  { id: 'lemon',    name: 'Lemon Juice',     roles: ['accent'],          flavors: ['neutral'],         stock: 'in' },
];

/** Cluster each role so the map reads as four neighbourhoods, not a hairball. */
function seedLayout(items: Omit<Item, 'x' | 'y'>[]): Item[] {
  const counts: Record<string, number> = {};
  return items.map(it => {
    const role = it.roles[0];
    const n = counts[role] = (counts[role] ?? 0) + 1;
    const total = items.filter(i => i.roles[0] === role).length;
    const [cx, cy] = ROLE_CENTRES[role];
    const angle = (n / total) * Math.PI * 2;
    const r = 70 + (total > 5 ? 45 : 0);
    return { ...it, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r * 0.8 };
  });
}

// ─── Persistence ─────────────────────────────────────────────────────────────

const KEY = 'slopbowl_v1';

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p?.items) && p.items.length) {
        return { items: p.items, extraLinks: p.extraLinks ?? [], cutLinks: p.cutLinks ?? [], bowl: p.bowl ?? [] };
      }
    }
  } catch { /* fall through to seed */ }
  return { items: seedLayout(SEED), extraLinks: [], cutLinks: [], bowl: [] };
}

// ─── Route-scoped PWA manifest ───────────────────────────────────────────────
/**
 * A manifest in index.html applies to the whole origin, so installing "Slop
 * Bowl" would install the entire portfolio — Prism, Homebase and all.
 * Attaching it only while this route is mounted scopes the install to this
 * app. No service worker yet: with GitHub Pages and the SPA 404-redirect it
 * needs more care than a v1 warrants, and state already survives in
 * localStorage.
 */
function useScopedManifest() {
  useEffect(() => {
    const prev = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    prev?.remove();
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/slopbowl.webmanifest';
    document.head.appendChild(link);
    return () => { link.remove(); if (prev) document.head.appendChild(prev); };
  }, []);
}

// ─── Atoms ───────────────────────────────────────────────────────────────────

const STOCK_NEXT: Record<Stock, Stock> = { in: 'low', low: 'out', out: 'in' };

function RoleDot({ role, size = 7, muted = false }: { role: Role; size?: number; muted?: boolean }) {
  return (
    <span className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: muted ? '#d4d4d4' : ROLE_META[role].color }} />
  );
}

/** Folder tabs: the active one loses its bottom border so it merges with the panel. */
function FolderTabs<T extends string>({ tabs, value, onChange }: {
  tabs: { id: T; label: string; badge?: number }[]; value: T; onChange: (t: T) => void;
}) {
  return (
    <div className="flex shrink-0 items-end gap-1 border-b border-neutral-300 px-3 pt-2">
      {tabs.map(t => {
        const on = t.id === value;
        return (
          <button key={t.id} onClick={() => onChange(t.id)}
            className={`relative -mb-px flex items-center gap-1.5 rounded-t-md border px-3.5 py-1.5 text-[12px] transition-colors ${
              on
                ? 'z-10 border-neutral-300 border-b-white bg-white text-neutral-900'
                : 'border-transparent bg-neutral-50 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700'
            }`}>
            {t.label}
            {t.badge ? (
              <span className={`rounded-full px-1.5 text-[9px] ${on ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                {t.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

// ─── Pantry rail ─────────────────────────────────────────────────────────────

function PantryRail({ store, setStore, addToBowl, setFocus, onAdd }: {
  store: Store;
  setStore: React.Dispatch<React.SetStateAction<Store>>;
  addToBowl: (id: string) => void;
  setFocus: (id: string) => void;
  onAdd: () => void;
}) {
  const [q, setQ] = useState('');
  const match = (i: Item) => i.name.toLowerCase().includes(q.trim().toLowerCase());

  const cycle = (id: string) =>
    setStore(s => ({ ...s, items: s.items.map(i => (i.id === id ? { ...i, stock: STOCK_NEXT[i.stock] } : i)) }));

  const remove = (id: string) =>
    setStore(s => ({
      items: s.items.filter(i => i.id !== id),
      extraLinks: s.extraLinks.filter(([a, b]) => a !== id && b !== id),
      cutLinks: s.cutLinks.filter(([a, b]) => a !== id && b !== id),
      bowl: s.bowl.filter(b => b !== id),
    }));

  return (
    <aside className="flex h-full w-[268px] shrink-0 flex-col border-r border-neutral-200 bg-neutral-50/60">
      <div className="shrink-0 px-4 pt-4">
        <div className="mb-2.5 flex items-baseline justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-900">Pantry</h2>
          <span className="text-[10px] text-neutral-400">
            {store.items.filter(i => i.stock !== 'out').length}/{store.items.length} on hand
          </span>
        </div>
        <input
          value={q} onChange={e => setQ(e.target.value)} placeholder="Search the fridge"
          className="mb-1 w-full rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-[12px] outline-none placeholder:text-neutral-300 focus:border-neutral-900"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {ROLES.map(role => {
          const rows = store.items.filter(i => i.roles[0] === role.id && match(i));
          if (!rows.length) return null;
          return (
            <section key={role.id} className="mb-3">
              <h3 className="mb-1 flex items-center gap-1.5 px-2 text-[9.5px] uppercase tracking-[0.14em] text-neutral-400">
                <RoleDot role={role.id} size={5} /> {role.label}
              </h3>
              {rows.map(it => {
                const out = it.stock === 'out';
                const inBowl = store.bowl.includes(it.id);
                return (
                  <div key={it.id}
                    className={`group flex items-center gap-1.5 rounded-md px-2 py-1 ${inBowl ? 'bg-neutral-900/5' : 'hover:bg-white'}`}>
                    <button
                      onClick={() => cycle(it.id)}
                      title={`${it.stock === 'in' ? 'In stock' : it.stock === 'low' ? 'Low' : 'Out'} — tap to change`}
                      className="shrink-0"
                    >
                      <span className={`block h-2 w-2 rounded-full border ${
                        it.stock === 'in' ? 'border-neutral-900 bg-neutral-900'
                        : it.stock === 'low' ? 'border-neutral-900 bg-white'
                        : 'border-neutral-300 bg-white'}`} />
                    </button>

                    <button
                      onClick={() => !out && addToBowl(it.id)}
                      disabled={out}
                      className={`flex-1 truncate text-left text-[12.5px] ${
                        out ? 'cursor-not-allowed text-neutral-300 line-through' : 'text-neutral-800'
                      }`}
                      title={out ? 'Out of stock' : 'Add to bowl'}
                    >
                      {it.name}
                      {it.roles.length > 1 && (
                        <span className="ml-1.5 text-[9px] uppercase tracking-wider text-neutral-400">
                          +{ROLE_META[it.roles[1]].short}
                        </span>
                      )}
                    </button>

                    <button onClick={() => setFocus(it.id)} title="Show pairings on the map"
                      className="shrink-0 text-neutral-300 opacity-0 transition-opacity hover:text-neutral-900 group-hover:opacity-100">
                      <Crosshair size={12} />
                    </button>
                    <button onClick={() => remove(it.id)} title="Remove"
                      className="shrink-0 text-neutral-300 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100">
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>

      <button onClick={onAdd}
        className="flex shrink-0 items-center justify-center gap-1.5 border-t border-neutral-200 py-2.5 text-[11px] uppercase tracking-wider text-neutral-500 hover:bg-white hover:text-neutral-900">
        <Plus size={13} /> Add ingredient
      </button>
    </aside>
  );
}

// ─── Map ─────────────────────────────────────────────────────────────────────

function MapCanvas({ store, setStore, linkMode, selected, setSelected, focus, addToBowl }: {
  store: Store;
  setStore: React.Dispatch<React.SetStateAction<Store>>;
  linkMode: boolean;
  selected: string | null;
  setSelected: (id: string | null) => void;
  focus: string | null;
  addToBowl: (id: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ id: string | null; ox: number; oy: number; px: number; py: number; moved: boolean } | null>(null);

  const edges = useMemo(() => buildEdges(store), [store]);
  const byId = useMemo(() => Object.fromEntries(store.items.map(i => [i.id, i])), [store.items]);

  const lit = useMemo(() => {
    if (!focus) return null;
    const s = new Set<string>([focus]);
    for (const e of edges) {
      if (e.a === focus && byId[e.b]?.stock !== 'out') s.add(e.b);
      if (e.b === focus && byId[e.a]?.stock !== 'out') s.add(e.a);
    }
    return s;
  }, [focus, edges, byId]);

  const toWorld = useCallback((cx: number, cy: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: (cx - r.left - view.x) / view.k, y: (cy - r.top - view.y) / view.k };
  }, [view]);

  const down = (e: React.PointerEvent, id: string | null) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const w = toWorld(e.clientX, e.clientY);
    drag.current = id
      ? { id, ox: w.x - byId[id].x, oy: w.y - byId[id].y, px: e.clientX, py: e.clientY, moved: false }
      : { id: null, ox: 0, oy: 0, px: e.clientX, py: e.clientY, moved: false };
  };

  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (Math.abs(e.clientX - d.px) + Math.abs(e.clientY - d.py) > 4) d.moved = true;
    if (d.id) {
      const w = toWorld(e.clientX, e.clientY);
      setStore(s => ({ ...s, items: s.items.map(i => (i.id === d.id ? { ...i, x: w.x - d.ox, y: w.y - d.oy } : i)) }));
    } else {
      setView(v => ({ ...v, x: v.x + (e.clientX - d.px), y: v.y + (e.clientY - d.py) }));
      d.px = e.clientX; d.py = e.clientY;
    }
  };

  const up = (id: string | null) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved || !id) return;

    if (linkMode) {
      if (!selected) return setSelected(id);
      if (selected === id) return setSelected(null);
      const k = linkKey(selected, id);
      setStore(s => {
        const derived = buildEdges({ ...s, extraLinks: [], cutLinks: [] }).some(e => linkKey(e.a, e.b) === k);
        const hasCut = s.cutLinks.some(([a, b]) => linkKey(a, b) === k);
        const hasExtra = s.extraLinks.some(([a, b]) => linkKey(a, b) === k);
        if (hasCut) return { ...s, cutLinks: s.cutLinks.filter(([a, b]) => linkKey(a, b) !== k) };
        if (derived) return { ...s, cutLinks: [...s.cutLinks, [selected, id]] };
        if (hasExtra) return { ...s, extraLinks: s.extraLinks.filter(([a, b]) => linkKey(a, b) !== k) };
        return { ...s, extraLinks: [...s.extraLinks, [selected, id]] };
      });
      return setSelected(null);
    }
    if (byId[id].stock !== 'out') addToBowl(id);
  };

  const wheel = (e: React.WheelEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    setView(v => {
      const k = Math.min(2.2, Math.max(0.35, v.k * (e.deltaY < 0 ? 1.08 : 0.926)));
      return { k, x: mx - ((mx - v.x) / v.k) * k, y: my - ((my - v.y) / v.k) * k };
    });
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <svg ref={svgRef} className="h-full w-full touch-none select-none"
        onPointerDown={e => down(e, null)} onPointerMove={move} onPointerUp={() => up(null)} onWheel={wheel}>
        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
          {edges.map(e => {
            const a = byId[e.a], b = byId[e.b];
            if (!a || !b) return null;
            const dim = a.stock === 'out' || b.stock === 'out';
            const on = lit ? lit.has(a.id) && lit.has(b.id) : false;
            return (
              <line key={`${e.a}~${e.b}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={on ? '#111111' : '#ececec'} strokeWidth={on ? 1.4 : 1}
                strokeDasharray={e.manual ? '4 3' : undefined}
                opacity={dim ? 0.3 : on ? 0.9 : 0.75} />
            );
          })}

          {store.items.map(it => {
            const out = it.stock === 'out';
            const faded = lit ? !lit.has(it.id) : false;
            const sel = selected === it.id;
            const inBowl = store.bowl.includes(it.id);
            const w = Math.max(78, it.name.length * 7.1 + 32);
            return (
              <g key={it.id} transform={`translate(${it.x},${it.y})`} opacity={faded ? 0.22 : 1}
                style={{ cursor: 'pointer' }}
                onPointerDown={e => { e.stopPropagation(); down(e, it.id); }}
                onPointerUp={e => { e.stopPropagation(); up(it.id); }}>
                <rect x={-w / 2} y={-17} width={w} height={34} rx={17}
                  fill={inBowl ? '#111111' : '#ffffff'}
                  stroke={sel ? '#111111' : out ? '#d4d4d4' : '#dcdcdc'}
                  strokeWidth={sel ? 1.8 : 1} strokeDasharray={out ? '5 4' : undefined} />
                <circle cx={-w / 2 + 15} cy={0} r={3.5} fill={out ? '#c9c9c9' : ROLE_META[it.roles[0]].color} />
                {it.roles.length > 1 && (
                  <circle cx={-w / 2 + 15} cy={0} r={6.5} fill="none"
                    stroke={out ? '#dcdcdc' : ROLE_META[it.roles[1]].color} strokeWidth={1} opacity={0.65} />
                )}
                <text x={-w / 2 + 26} y={4.5} fontSize={12.5}
                  fill={inBowl ? '#ffffff' : out ? '#a3a3a3' : '#111111'}
                  style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>{it.name}</text>
                {it.stock === 'low' && !inBowl && (
                  <text x={w / 2 - 9} y={4} fontSize={9} textAnchor="end" fill="#a3a3a3"
                    style={{ fontFamily: 'ui-monospace, monospace' }}>low</text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      <div className="pointer-events-none absolute bottom-3 left-4 flex flex-wrap gap-x-4 gap-y-1">
        {ROLES.map(r => (
          <span key={r.id} className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-neutral-400">
            <RoleDot role={r.id} size={6} /> {r.short}
          </span>
        ))}
      </div>
      <button onClick={() => setView({ x: 0, y: 0, k: 1 })}
        className="absolute bottom-3 right-4 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[10px] uppercase tracking-wider text-neutral-500 hover:border-neutral-400 hover:text-neutral-900">
        Reset view
      </button>
    </div>
  );
}

// ─── Bowl builder ────────────────────────────────────────────────────────────

function BowlView({ store, setStore, addToBowl }: {
  store: Store;
  setStore: React.Dispatch<React.SetStateAction<Store>>;
  addToBowl: (id: string) => void;
}) {
  const byId = useMemo(() => Object.fromEntries(store.items.map(i => [i.id, i])), [store.items]);
  const items = store.bowl.map(id => byId[id]).filter(Boolean);
  const slotted = assignSlots(items);
  const clashes = bowlConflicts(items);

  const ok = useMemo(() => new Set(buildEdges(store).map(e => linkKey(e.a, e.b))), [store]);
  const nextUp = useMemo(() => {
    const empty = ROLES.filter(r => !slotted.some(s => s.slot === r.id));
    return empty.flatMap(r =>
      store.items
        .filter(i => i.roles.includes(r.id) && i.stock !== 'out' && !store.bowl.includes(i.id))
        .filter(i => items.every(b => ok.has(linkKey(i.id, b.id))))
        .slice(0, 3)
        .map(i => ({ item: i, slot: r.id }))
    );
  }, [store, slotted, items, ok]);

  const drop = (id: string) => setStore(s => ({ ...s, bowl: s.bowl.filter(b => b !== id) }));

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-xl">
        {items.length === 0 ? (
          <p className="pt-20 text-center text-[13px] text-neutral-400">
            Your bowl is empty. Add something from the pantry on the left, or tap a node on the map.
          </p>
        ) : (
          <>
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="text-[15px] font-medium">{slotted.map(s => s.item.name).join(' + ')}</h2>
              <button onClick={() => setStore(s => ({ ...s, bowl: [] }))}
                className="text-[10px] uppercase tracking-wider text-neutral-400 hover:text-neutral-900">Empty</button>
            </div>

            <div className="mb-5 divide-y divide-neutral-100 rounded-xl border border-neutral-200">
              {ROLES.map(role => {
                const here = slotted.filter(s => s.slot === role.id);
                return (
                  <div key={role.id} className="flex items-start gap-3 px-4 py-2.5">
                    <span className="mt-0.5 flex w-20 shrink-0 items-center gap-1.5 text-[10px] uppercase tracking-wider text-neutral-400">
                      <RoleDot role={role.id} size={5} muted={!here.length} /> {role.short}
                    </span>
                    {here.length === 0 ? (
                      <span className="text-[12.5px] text-neutral-300">—</span>
                    ) : (
                      <div className="flex flex-1 flex-wrap gap-1.5">
                        {here.map(s => (
                          <span key={s.item.id}
                            className="group flex items-center gap-1.5 rounded-full border border-neutral-200 py-0.5 pl-2.5 pr-1.5 text-[12px]">
                            {s.item.name}
                            {s.item.stock === 'low' && <span className="text-[9px] uppercase text-neutral-400">low</span>}
                            <button onClick={() => drop(s.item.id)} className="text-neutral-300 hover:text-neutral-900">
                              <X size={11} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {clashes.length > 0 && (
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-amber-700">
                  <AlertTriangle size={12} /> Flavour clash
                </p>
                {clashes.map(([a, b], i) => (
                  <p key={i} className="text-[12px] text-amber-900/80">
                    {a.name} ({a.flavors.join('/')}) with {b.name} ({b.flavors.join('/')})
                  </p>
                ))}
                <p className="mt-1.5 text-[11px] text-amber-700/70">Not a rule — just worth tasting before you commit.</p>
              </div>
            )}

            {nextUp.length > 0 && (
              <>
                <p className="mb-2 text-[10px] uppercase tracking-wider text-neutral-400">Goes with this</p>
                <div className="flex flex-wrap gap-1.5">
                  {nextUp.map(({ item, slot }) => (
                    <button key={item.id} onClick={() => addToBowl(item.id)}
                      className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-2.5 py-1 text-[12px] text-neutral-600 hover:border-neutral-900 hover:text-neutral-900">
                      <RoleDot role={slot} size={5} /> {item.name}
                      <Plus size={11} className="text-neutral-400" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

type Tab = 'map' | 'bowl' | 'ideas';

export default function SlopBowl() {
  useScopedManifest();
  const [store, setStore] = useState<Store>(loadStore);
  const [tab, setTab] = useState<Tab>('map');
  const [linkMode, setLinkMode] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [railOpen, setRailOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* quota — memory still works */ }
  }, [store]);
  useEffect(() => { if (!linkMode) setSelected(null); }, [linkMode]);

  const ideas = useMemo(() => (tab === 'ideas' ? suggestBowls(store) : []), [tab, store]);

  const addToBowl = useCallback((id: string) => {
    setStore(s => (s.bowl.includes(id) ? s : { ...s, bowl: [...s.bowl, id] }));
    setTab('bowl');
  }, []);

  const rail = (
    <PantryRail
      store={store} setStore={setStore} addToBowl={addToBowl} onAdd={() => setAdding(true)}
      setFocus={id => { setFocus(id); setTab('map'); setRailOpen(false); }}
    />
  );

  return (
    <div className="flex h-screen flex-col bg-white text-neutral-900">
      <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <button onClick={() => setRailOpen(v => !v)} className="text-neutral-400 hover:text-neutral-900 md:hidden">
            <PanelLeft size={16} />
          </button>
          <h1 className="text-[15px] font-semibold tracking-tight">Slop Bowl</h1>
        </div>
        <Link to="/" className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-neutral-400 hover:text-neutral-900">
          <ChevronLeft size={13} /> Portfolio
        </Link>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="hidden md:flex">{rail}</div>
        {railOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden" onClick={() => setRailOpen(false)}>
            <div className="h-full bg-white shadow-xl" onClick={e => e.stopPropagation()}>{rail}</div>
            <div className="flex-1 bg-neutral-900/20" />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-end justify-between border-b border-neutral-300 pr-3">
            <FolderTabs<Tab>
              tabs={[
                { id: 'map', label: 'Map' },
                { id: 'bowl', label: 'Bowl', badge: store.bowl.length || undefined },
                { id: 'ideas', label: 'What can I make' },
              ]}
              value={tab} onChange={t => { setTab(t); setFocus(null); }}
            />
            {tab === 'map' && (
              <div className="flex items-center gap-2 pb-1.5">
                {focus && (
                  <button onClick={() => setFocus(null)}
                    className="rounded-full border border-neutral-900 px-3 py-1 text-[10px] uppercase tracking-wider">Clear focus</button>
                )}
                <button onClick={() => setLinkMode(v => !v)}
                  className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-wider transition-colors ${
                    linkMode ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'
                  }`}>{linkMode ? 'Linking' : 'Link'}</button>
              </div>
            )}
          </div>

          {tab === 'map' && (
            <div className="shrink-0 border-b border-neutral-100 px-4 py-1.5 text-[11px] text-neutral-400">
              {linkMode
                ? selected ? 'Now tap a second ingredient to connect or disconnect them.'
                  : 'Tap two ingredients to force a pairing, or cut one the rules suggested.'
                : 'Tap a node to add it to your bowl. Drag to rearrange. Lines are suggested pairings.'}
            </div>
          )}

          <main className="min-h-0 flex-1 overflow-hidden">
            {tab === 'map' && (
              <MapCanvas store={store} setStore={setStore} linkMode={linkMode}
                selected={selected} setSelected={setSelected} focus={focus} addToBowl={addToBowl} />
            )}
            {tab === 'bowl' && <BowlView store={store} setStore={setStore} addToBowl={addToBowl} />}
            {tab === 'ideas' && (
              <div className="h-full overflow-y-auto px-6 py-5">
                {ideas.length === 0 ? (
                  <p className="pt-20 text-center text-[13px] text-neutral-400">
                    Nothing assembles yet. Mark a base and a couple of others as in stock.
                  </p>
                ) : (
                  <>
                    <p className="mb-4 text-[11px] text-neutral-400">
                      {ideas.length} bowls from what's on hand — every pairing compatible, nothing out of stock.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {ideas.map((b, i) => (
                        <div key={i} className="group rounded-xl border border-neutral-200 p-4 transition-colors hover:border-neutral-400">
                          <div className="mb-2.5 text-[13px] font-medium">{b.parts.map(p => p.item.name).join(' + ')}</div>
                          <ul className="mb-3 space-y-1">
                            {b.parts.map(p => (
                              <li key={p.item.id} className="flex items-center gap-2 text-[11px] text-neutral-500">
                                <RoleDot role={p.slot} size={5} />
                                <span className="w-14 shrink-0 uppercase tracking-wider text-neutral-400">{ROLE_META[p.slot].short}</span>
                                {p.item.name}
                                {p.item.stock === 'low' && <span className="text-neutral-300">· low</span>}
                              </li>
                            ))}
                          </ul>
                          <button
                            onClick={() => { setStore(s => ({ ...s, bowl: b.parts.map(p => p.item.id) })); setTab('bowl'); }}
                            className="text-[10px] uppercase tracking-wider text-neutral-400 hover:text-neutral-900">
                            Load into bowl →
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {adding && <AddDialog onClose={() => setAdding(false)} onAdd={it => setStore(s => ({ ...s, items: [...s.items, it] }))} />}
    </div>
  );
}

// ─── Add dialog ──────────────────────────────────────────────────────────────

function AddDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (it: Item) => void }) {
  const [name, setName] = useState('');
  const [roles, setRoles] = useState<Role[]>(['base']);
  const [flavors, setFlavors] = useState<Flavor[]>(['neutral']);

  const toggle = <T,>(arr: T[], v: T, set: (a: T[]) => void) =>
    set(arr.includes(v) ? (arr.length > 1 ? arr.filter(x => x !== v) : arr) : [...arr, v]);

  const submit = () => {
    const n = name.trim();
    if (!n) return;
    const [cx, cy] = ROLE_CENTRES[roles[0]];
    onAdd({
      id: `${n.toLowerCase().replace(/\s+/g, '-')}-${n.length}-${roles.join('')}`,
      name: n, roles, flavors, stock: 'in',
      x: cx + (n.length % 7) * 18 - 50,
      y: cy + (n.length % 5) * 22 - 40,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/20 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-2xl border border-neutral-200 bg-white p-5 sm:rounded-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold">Add ingredient</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900"><X size={16} /></button>
        </div>

        <input autoFocus value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Cottage cheese"
          className="mb-4 w-full border-b border-neutral-300 pb-2 text-[14px] outline-none placeholder:text-neutral-300 focus:border-neutral-900" />

        <p className="mb-1.5 text-[10px] uppercase tracking-wider text-neutral-400">
          Role <span className="normal-case tracking-normal">— first pick is primary</span>
        </p>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {ROLES.map(r => (
            <button key={r.id} onClick={() => toggle(roles, r.id, setRoles)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                roles.includes(r.id) ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'
              }`}>
              <RoleDot role={r.id} size={5} /> {r.short}
            </button>
          ))}
        </div>

        <p className="mb-1.5 text-[10px] uppercase tracking-wider text-neutral-400">Flavour</p>
        <div className="mb-5 flex flex-wrap gap-1.5">
          {FLAVORS.map(f => (
            <button key={f} onClick={() => toggle(flavors, f, setFlavors)}
              className={`rounded-full border px-2.5 py-1 text-[11px] capitalize transition-colors ${
                flavors.includes(f) ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'
              }`}>{f}</button>
          ))}
        </div>

        <button onClick={submit} disabled={!name.trim()}
          className="w-full rounded-full bg-neutral-900 py-2.5 text-[12px] text-white disabled:bg-neutral-200">
          Add to pantry
        </button>
      </div>
    </div>
  );
}
