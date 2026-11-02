import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronDown, Plus, X, Trash2, PanelLeft, LogOut, Star, Check, Pencil } from 'lucide-react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logout } from '../firebase';

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

type Role = 'base' | 'protein' | 'vegetable' | 'fruit' | 'crunch' | 'sauce';
type Stock = 'in' | 'low' | 'out';

/** Rough per-serving figures. Good enough to compare bowls against each other,
 *  not a nutrition label — see the caveat rendered in the Bowl Nutrition tab.
 *  Optional because anything the user adds has no data until they supply it. */
interface Macros { kcal: number; protein: number; carbs: number; fat: number }

interface Item {
  id: string;
  name: string;
  /** [0] is primary; the rest secondary. Multi-role items are one node, never
   *  duplicated — Cottage Cheese is Base first, Protein second. */
  roles: Role[];
  stock: Stock;
  macros?: Macros;
  x: number;
  y: number;
}

/** A bowl worth keeping. Stores ingredient ids plus the names at save time, so
 *  a favourite still reads correctly after an ingredient is renamed or deleted
 *  from the pantry — otherwise old favourites would quietly lose entries. */
interface Favorite {
  id: string;
  name: string;
  itemIds: string[];
  itemNames: string[];
  savedAt: number;
}

interface Store {
  items: Item[];
  /** Pairings the rules miss, and pairings they wrongly suggest. */
  extraLinks: [string, string][];
  cutLinks: [string, string][];
  /** The bowl currently being composed. */
  bowl: string[];
  favorites: Favorite[];
}

const ROLES: { id: Role; label: string; short: string; color: string }[] = [
  { id: 'base',      label: 'Bases',               short: 'Base',   color: '#2563eb' },
  { id: 'protein',   label: 'Proteins',            short: 'Protein', color: '#dc2626' },
  { id: 'vegetable', label: 'Vegetables',          short: 'Veg',    color: '#16a34a' },
  { id: 'fruit',     label: 'Fruits',              short: 'Fruit',  color: '#db2777' },
  { id: 'crunch',    label: 'Crunch & Mix-ins',    short: 'Crunch', color: '#7c3aed' },
  { id: 'sauce',     label: 'Sauces & Seasonings', short: 'Sauce',  color: '#d97706' },
];

const ROLE_META = Object.fromEntries(ROLES.map(r => [r.id, r])) as Record<Role, typeof ROLES[number]>;

/** Pushed well apart so the four neighbourhoods read as separate places, with
 *  the bowl sitting in the gap between them. The view auto-fits on mount, so
 *  the extra spread costs nothing on screen. */
// Three down each side with the bowl flanked in the middle. Clusters are
// single-column now (see blobRows) so each is narrow enough that the middle
// pair clears the bowl horizontally.
const ROLE_CENTRES: Record<Role, [number, number]> = {
  base:      [255, 230], protein: [945, 230],
  vegetable: [255, 590], fruit:   [945, 590],
  crunch:    [255, 950], sauce:   [945, 950],
};

const BOWL = { x: 600, y: 590, rx: 206, ry: 88, depth: 120 };

/** Fixed board size. The view fits this rect rather than live item bounds, so
 *  dragging one ingredient never rescales the whole board. */
const WORLD = { w: 1200, h: 1200 };

/** Lay the bowl's contents out inside the rim — one column while it's sparse,
 *  two once it fills up, so a single ingredient doesn't sit lopsided. */
function bowlSlots(n: number): { x: number; y: number }[] {
  // Columns and row height both give way as the bowl fills, so contents stay
  // inside the rim instead of spilling out the top. A 16-ingredient bowl is
  // absurd, but it should look crowded rather than broken.
  const perRow = n <= 3 ? 1 : n <= 8 ? 2 : 3;
  const rows = Math.ceil(n / perRow);
  const rowH = Math.min(31, ((BOWL.ry - 12) * 2) / Math.max(1, rows));
  const colW = perRow === 3 ? 142 : 212;
  const top = BOWL.y - ((rows - 1) * rowH) / 2;
  return Array.from({ length: n }, (_, i) => {
    const r = Math.floor(i / perRow);
    const c = i % perRow;
    const inRow = Math.min(perRow, n - r * perRow);
    return { x: BOWL.x + (c - (inRow - 1) / 2) * colW, y: top + r * rowH };
  });
}

// ─── Pairing rules ───────────────────────────────────────────────────────────

/**
 * Two items pair only if they can occupy different slots in a bowl.
 *
 * This used to also require compatible flavours (sweet / savory / neutral),
 * which is what kept Honey away from Grilled Chicken. That model is gone —
 * role is now the only rule, so anything that fills a different slot pairs.
 * Suggestions are consequently broader and no longer opinionated about taste.
 */
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
      if (rolesDiffer(a, b)) { out.push({ a: a.id, b: b.id, manual: false }); seen.add(k); }
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
  const out: Bowl[] = [];

  // Replaced four hardcoded nested loops, which stopped being workable at six
  // roles. Two bounds matter here, and the first version got both wrong:
  //
  // MAX_PARTS — without it the walk returns maximal bowls, and every
  // suggestion came back with one of everything: rice + yogurt + greens +
  // berries + nuts + honey. A bowl is a base and a few things, not six.
  //
  // PER_BASE — a single global cap let the first base exhaust the budget
  // depth-first, so all nine suggestions shared a base. Budgeting per base
  // is what actually produces variety.
  const MAX_PARTS = 4;
  const PER_BASE = 60;
  const rest = ROLES.map(r => r.id).filter(r => r !== 'base');

  for (const base of avail.filter(i => i.roles.includes('base'))) {
    const found: Bowl[] = [];
    const walk = (from: number, chosen: { item: Item; slot: Role }[]): void => {
      if (found.length >= PER_BASE) return;
      if (chosen.length >= 3) {
        found.push({
          parts: [...chosen],
          score: chosen.length * 10 - chosen.filter(c => c.item.stock === 'low').length * 3,
        });
        if (chosen.length >= MAX_PARTS) return;
      }
      for (let j = from; j < rest.length; j++) {
        const role = rest[j];
        const cands = avail.filter(i =>
          i.roles.includes(role)
          && !chosen.some(c => c.item.id === i.id)
          && chosen.every(c => fits(c.item, i)));
        for (const c of cands) {
          walk(j + 1, [...chosen, { item: c, slot: role }]);
          if (found.length >= PER_BASE) return;
        }
      }
    };
    walk(0, [{ item: base, slot: 'base' as Role }]);
    out.push(...found);
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

// bowlConflicts lived here. It ran the flavour rules backwards to warn that
// e.g. Chili Crisp and Fresh Berries don't belong in the same bowl. With
// flavours gone there is nothing left to disagree about, so the warning and
// its UI went with them.

// ─── Seed pantry ─────────────────────────────────────────────────────────────
// An empty canvas teaches nothing, so first launch lands on a real fridge.

const m = (kcal: number, protein: number, carbs: number, fat: number): Macros => ({ kcal, protein, carbs, fat });

const SEED: Omit<Item, 'x' | 'y'>[] = [
  { id: 'rice',     name: 'Jasmine Rice',    roles: ['base'],            stock: 'in',  macros: m(205, 4, 45, 0.4) },
  { id: 'oats',     name: 'Oats',            roles: ['base'],            stock: 'in',  macros: m(150, 5, 27, 3) },
  { id: 'yogurt',   name: 'Greek Yogurt',    roles: ['base', 'protein'], stock: 'in',  macros: m(100, 17, 6, 0.7) },
  { id: 'cottage',  name: 'Cottage Cheese',  roles: ['base', 'protein'], stock: 'in',  macros: m(110, 12, 5, 4.5) },
  { id: 'greens',   name: 'Greens',          roles: ['base', 'vegetable'], stock: 'in', macros: m(15, 1.5, 3, 0.2) },

  { id: 'chicken',  name: 'Grilled Chicken', roles: ['protein'],         stock: 'in',  macros: m(185, 35, 0, 4) },
  { id: 'eggs',     name: 'Eggs',            roles: ['protein'],         stock: 'in',  macros: m(140, 12, 1, 10) },
  { id: 'paneer',   name: 'Paneer',          roles: ['protein'],         stock: 'low', macros: m(150, 9, 2, 12) },
  { id: 'tofu',     name: 'Tofu',            roles: ['protein'],         stock: 'out', macros: m(76, 8, 2, 4.8) },

  { id: 'cucumber', name: 'Sliced Cucumber', roles: ['vegetable'],       stock: 'in',  macros: m(16, 0.7, 4, 0.1) },
  { id: 'tomatoes', name: 'Cherry Tomatoes', roles: ['vegetable'],       stock: 'in',  macros: m(27, 1.3, 6, 0.3) },
  { id: 'peppers',  name: 'Roasted Peppers', roles: ['vegetable'],       stock: 'low', macros: m(35, 1.2, 7, 0.4) },
  { id: 'sweetpot', name: 'Sweet Potato',    roles: ['vegetable', 'base'], stock: 'in', macros: m(180, 4, 41, 0.3) },

  { id: 'berries',  name: 'Fresh Berries',   roles: ['fruit'],           stock: 'in',  macros: m(40, 0.5, 10, 0.2) },
  { id: 'banana',   name: 'Banana',          roles: ['fruit'],           stock: 'in',  macros: m(105, 1.3, 27, 0.4) },
  { id: 'mango',    name: 'Mango',           roles: ['fruit'],           stock: 'out', macros: m(99, 1.4, 25, 0.6) },

  { id: 'nuts',     name: 'Roasted Nuts',    roles: ['crunch'],          stock: 'in',  macros: m(170, 6, 6, 15) },
  { id: 'granola',  name: 'Granola',         roles: ['crunch'],          stock: 'low', macros: m(120, 3, 18, 5) },
  { id: 'seeds',    name: 'Seeds',           roles: ['crunch'],          stock: 'in',  macros: m(60, 2, 3, 5) },

  { id: 'honey',    name: 'Honey',           roles: ['sauce'],           stock: 'in',  macros: m(64, 0, 17, 0) },
  { id: 'hothoney', name: 'Hot Honey',       roles: ['sauce'],           stock: 'in',  macros: m(60, 0, 16, 0) },
  { id: 'chili',    name: 'Chili Crisp',     roles: ['sauce'],           stock: 'in',  macros: m(80, 1, 2, 8) },
  { id: 'oliveoil', name: 'Olive Oil',       roles: ['sauce'],           stock: 'in',  macros: m(119, 0, 0, 14) },
  { id: 'lemon',    name: 'Lemon Juice',     roles: ['sauce'],           stock: 'in',  macros: m(4, 0, 1, 0) },
];

const NODE_H = 34;
const LANE_Y = 50;   // row pitch, comfortably clear of NODE_H even after jitter
const LANE_X = 268;  // column pitch; must exceed the widest chip + 2*JITTER_X
const PER_COL = 7;
const NODE_W_MAX = 176;  // longest ingredient name we expect to render

const ROW_PITCH = 52;   // vertical gap between rows
const COL_PITCH = 196;  // horizontal gap within a row
const JITTER_X = 9;
const JITTER_Y = 8;
/** How far a whole row can slide sideways. Free of collision risk — rows are
 *  vertically separated — and with one item per row it's the entire reason a
 *  cluster reads as a drifting cloud rather than a column. */
const ROW_SHIFT = 62;

function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) >>> 0;
  return h;
}
const scatter = (id: string, salt: number, span: number) =>
  (((hashId(id + salt) % 1000) / 1000) - 0.5) * 2 * span;

/**
 * How many ingredients sit on each row of a cluster — a tapered profile like
 * [1,2,2,1] rather than a uniform block, so the cluster has a rounded
 * silhouette instead of a rectangular one.
 *
 * Only two fit per row: chips run to 176px and a cluster has roughly 490px
 * of width before it reaches its neighbour. That cap is why jitter alone
 * could never stop this looking like a column — the shape has to come from
 * uneven row lengths and offset rows, not from nudging nodes around.
 */
function blobRows(n: number): number[] {
  // One per row. With six clusters instead of four there isn't room for
  // two-wide rows — the middle pair would run into the bowl. The cloud now
  // comes entirely from shifting each row sideways, which on a single column
  // reads as a meandering stack rather than a ruled line.
  return Array(Math.max(0, n)).fill(1);
}

/**
 * Lay a cluster out as a cloud around its centre.
 *
 * Collision safety rests on one fact: two chips only overlap if they are
 * close in BOTH axes. Rows are kept ROW_PITCH apart, so anything on a
 * different row is safe at any horizontal offset — which is what buys the
 * freedom to shove whole rows sideways. Within a row, COL_PITCH does the work.
 *
 *   rows    ROW_PITCH - 2*JITTER_Y = 36px  > NODE_H 34px
 *   in-row  COL_PITCH - 2*JITTER_X = 178px > NODE_W_MAX 176px
 */
function cloudLayout(ids: string[], cx: number, cy: number): Record<string, { x: number; y: number }> {
  const out: Record<string, { x: number; y: number }> = {};
  const counts = blobRows(ids.length);
  const rows = counts.length;
  let k = 0;
  counts.forEach((c, r) => {
    // Shifting a whole row is free — rows can't collide vertically — and it's
    // the main thing that stops the cluster reading as a straight column.
    const rowShift = scatter(`${ids[k] ?? r}row${r}`, 3, ROW_SHIFT);
    for (let i = 0; i < c; i++, k++) {
      const id = ids[k];
      out[id] = {
        x: cx + rowShift + (i - (c - 1) / 2) * COL_PITCH + scatter(id, 1, JITTER_X),
        y: cy + (r - (rows - 1) / 2) * ROW_PITCH + scatter(id, 2, JITTER_Y),
      };
    }
  });
  return out;
}

/**
 * Cluster each role so the map reads as four neighbourhoods, not a hairball.
 *
 * Arranged in columns rather than on a circle. The circle looked tidier in
 * principle but guaranteed collisions: chips are 78-160px wide and were being
 * placed on a 70px radius, so anything with more than about four items —
 * proteins and toppings especially — stacked on top of itself. A grid with a
 * fixed pitch can't overlap no matter how many items a role holds.
 */
function layoutItems<T extends Omit<Item, 'x' | 'y'>>(items: T[]): (T & { x: number; y: number })[] {
  const seen: Record<string, number> = {};
  return items.map(it => {
    const role = it.roles[0];
    const idx = seen[role] = (seen[role] ?? 0) + 1;
    const i = idx - 1;
    const total = items.filter(x => x.roles[0] === role).length;
    const cols = Math.ceil(total / PER_COL);
    const rows = Math.ceil(total / cols);
    const col = Math.floor(i / rows);
    const rowI = i % rows;
    const inCol = Math.min(rows, total - col * rows);
    const [cx, cy] = ROLE_CENTRES[role];
    return {
      ...it,
      x: cx + (col - (cols - 1) / 2) * LANE_X,
      y: cy + (rowI - (inCol - 1) / 2) * LANE_Y,
    };
  });
}

const seedLayout = (items: Omit<Item, 'x' | 'y'>[]): Item[] => layoutItems(items) as Item[];

// ─── Persistence ─────────────────────────────────────────────────────────────

const KEY = 'slopbowl_v1';

function coerce(p: unknown): Store | null {
  const o = p as Partial<Store> | null;
  if (!o || !Array.isArray(o.items) || !o.items.length) return null;
  return {
    items: o.items,
    extraLinks: o.extraLinks ?? [],
    cutLinks: o.cutLinks ?? [],
    bowl: o.bowl ?? [],
    favorites: o.favorites ?? [],   // absent in stores saved before favourites existed
  };
}

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const s = coerce(JSON.parse(raw)); if (s) return s; }
  } catch { /* fall through to seed */ }
  return { items: seedLayout(SEED), extraLinks: [], cutLinks: [], bowl: [], favorites: [] };
}

/** One doc per user — the whole pantry is a few KB, far short of Firestore's
 *  1MB limit, so splitting it into a collection would buy nothing. */
const userDoc = (uid: string) => doc(db, 'users', uid, 'slopBowl', 'main');

/**
 * Signed out, the pantry lives in localStorage exactly as before. Signed in,
 * Firestore becomes the source of truth and localStorage keeps working as an
 * offline cache.
 *
 * First sign-in adopts whatever you built as a guest rather than overwriting
 * it with a fresh seed — losing a pantry you'd just filled in would be a
 * rotten reward for signing in.
 *
 * Writes are debounced because dragging a node rewrites x/y continuously;
 * sending every frame to Firestore would be thousands of writes per session.
 */
function useSync(store: Store, setStore: React.Dispatch<React.SetStateAction<Store>>) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const loadedFor = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); if (!u) { loadedFor.current = null; setReady(true); } }), []);

  // Pull on sign-in.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setReady(false);
    (async () => {
      try {
        const snap = await getDoc(userDoc(user.uid));
        if (cancelled) return;
        const remote = snap.exists() ? coerce(snap.data()) : null;
        if (remote) setStore(remote);
        else await setDoc(userDoc(user.uid), store);   // adopt the guest pantry
      } catch (e) {
        console.error('[SlopBowl] load failed, staying on local copy', e);
      } finally {
        if (!cancelled) { loadedFor.current = user.uid; setReady(true); }
      }
    })();
    return () => { cancelled = true; };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Push on change, debounced.
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* quota — memory still works */ }
    if (!user || loadedFor.current !== user.uid) return;  // don't echo the pull back
    setSaving(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setDoc(userDoc(user.uid), store)
        .catch(e => console.error('[SlopBowl] save failed', e))
        .finally(() => setSaving(false));
    }, 900);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [store, user]);

  return { user, ready, saving };
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

function GoogleMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 48 48" aria-hidden>
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-2.7-.4-4H24v7.3h12.1c-.2 1.8-1.6 4.6-4.5 6.5l6.9 5.3c4.1-3.8 6.6-9.4 6.6-15.1z" />
      <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.3c-1.8 1.3-4.3 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8 41.2 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.5 28.5c-.5-1.4-.7-2.9-.7-4.5s.3-3.1.7-4.5l-7.1-5.5C2.9 17 2 20.4 2 24s.9 7 2.4 10z" />
      <path fill="#EA4335" d="M24 10.6c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 4.4 29.9 2 24 2 15.4 2 8 6.8 4.4 14l7.1 5.5c1.8-5.3 6.7-8.9 12.5-8.9z" />
    </svg>
  );
}

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

const STOCK_PILL: Record<Stock, { label: string; title: string; cls: string }> = {
  in:  { label: 'In',  title: 'In stock',                             cls: 'border-emerald-600/30 bg-emerald-50 text-emerald-700' },
  low: { label: 'Low', title: 'Running low — still suggested, ranked lower', cls: 'border-amber-600/30 bg-amber-50 text-amber-700' },
  out: { label: 'Out', title: 'Out — left out of suggested bowls',    cls: 'border-neutral-200 bg-neutral-50 text-neutral-400' },
};

/**
 * Shows the current stock state, and opens into all three on hover so you can
 * pick directly. It used to be a single pill that cycled In -> Low -> Out,
 * which meant two taps to reach Out and no way to see the options existed.
 *
 * The open panel is absolutely positioned so widening it doesn't shove the
 * row's other controls around, and it opens on click too — hover alone would
 * leave this unusable on touch.
 */
function StockControl({ value, open, onOpen, onPick }: {
  value: Stock;
  open: boolean;
  onOpen: (open: boolean) => void;
  onPick: (s: Stock) => void;
}) {
  const pill = STOCK_PILL[value];
  return (
    <div
      className="relative shrink-0"
      onMouseEnter={() => onOpen(true)}
      onMouseLeave={() => onOpen(false)}
      onPointerDown={e => e.stopPropagation()}
    >
      <button
        onClick={() => onOpen(!open)}
        title={pill.title}
        className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors ${pill.cls} ${open ? 'opacity-0' : ''}`}
      >
        {pill.label}
      </button>

      {open && (
        <div className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-lg border border-neutral-200 bg-white px-1.5 py-1 shadow-md">
          <div className="mb-0.5 text-center text-[8px] font-medium uppercase tracking-[0.12em] text-neutral-400">Stock</div>
          <div className="flex gap-0.5">
            {(['in', 'low', 'out'] as Stock[]).map(s => {
              const p = STOCK_PILL[s];
              const on = s === value;
              return (
                <button key={s} onClick={() => onPick(s)} title={p.title}
                  className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                    on ? p.cls : 'border-transparent text-neutral-400 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}>
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Drag works on raw pointer events rather than HTML5 drag-and-drop: the drop
 * target is an SVG canvas under a pan/zoom transform, which the native API
 * handles badly on touch. A movement threshold keeps a plain tap meaning
 * "add to bowl", so the rail stays usable without ever dragging.
 */
function PantryRail({ store, setStore, addToBowl, toggleInBowl, onAdd, onEdit, onDragStateChange }: {
  store: Store;
  setStore: React.Dispatch<React.SetStateAction<Store>>;
  addToBowl: (id: string) => void;
  toggleInBowl: (id: string) => void;
  onAdd: () => void;
  onEdit: (it: Item) => void;
  onDragStateChange: (dragging: boolean) => void;
}) {
  const [q, setQ] = useState('');
  // Scale controls. A 50-item pantry is a 2,400px scroll; filtering by role
  // and folding away what you don't have turns that into about nine rows.
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [stockOpen, setStockOpen] = useState<string | null>(null);
  const [ghost, setGhost] = useState<{ name: string; x: number; y: number; over: boolean } | null>(null);
  const press = useRef<{ id: string; name: string; x: number; y: number; dragging: boolean } | null>(null);
  const match = (i: Item) => i.name.toLowerCase().includes(q.trim().toLowerCase());

  useEffect(() => { onDragStateChange(!!ghost); }, [!!ghost]); // eslint-disable-line react-hooks/exhaustive-deps

  const setStock = (id: string, stock: Stock) =>
    setStore(s => ({ ...s, items: s.items.map(i => (i.id === id ? { ...i, stock } : i)) }));

  // Spread first: rebuilding the object field-by-field dropped `favorites`
  // entirely, so deleting one ingredient wiped every saved bowl. Favourites
  // keep the deleted item — they snapshot names and flag what's missing.
  const remove = (id: string) =>
    setStore(s => ({
      ...s,
      items: s.items.filter(i => i.id !== id),
      extraLinks: s.extraLinks.filter(([a, b]) => a !== id && b !== id),
      cutLinks: s.cutLinks.filter(([a, b]) => a !== id && b !== id),
      bowl: s.bowl.filter(b => b !== id),
    }));

  // Out-of-stock items stay in their section. They were folded into a drawer
  // to save scroll, but hiding an ingredient you own just because you've run
  // out makes it feel deleted — and the row is exactly where you go to mark
  // it back in. Role filtering carries the scrolling problem on its own.
  const visible = store.items.filter(i => match(i) && (roleFilter === 'all' || i.roles[0] === roleFilter));

  // Grouped under role headings when showing everything; a flat list once a
  // role is chosen, since repeating the heading you just filtered to is noise.
  const sections: { role: Role | null; rows: Item[] }[] =
    roleFilter === 'all'
      ? ROLES.map(r => ({ role: r.id as Role | null, rows: visible.filter(i => i.roles[0] === r.id) })).filter(s => s.rows.length)
      : [{ role: null, rows: visible }];

  /** The map pane marks itself with data-slopbowl-drop, so hit-testing is a
   *  coordinate lookup and never has to know about the canvas transform. */
  const overDrop = (x: number, y: number) =>
    !!document.elementFromPoint(x, y)?.closest('[data-slopbowl-drop]');

  const onDown = (e: React.PointerEvent, it: Item) => {
    if (it.stock === 'out') return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    press.current = { id: it.id, name: it.name, x: e.clientX, y: e.clientY, dragging: false };
  };

  const onMove = (e: React.PointerEvent) => {
    const p = press.current;
    if (!p) return;
    if (!p.dragging && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 6) return;
    p.dragging = true;
    setGhost({ name: p.name, x: e.clientX, y: e.clientY, over: overDrop(e.clientX, e.clientY) });
  };

  const onUp = (e: React.PointerEvent) => {
    const p = press.current;
    press.current = null;
    setGhost(null);
    if (!p) return;
    // A tap toggles — tapping something already in the bowl takes it back out,
    // so the rail behaves the same way the map nodes do. A drag only ever
    // adds, and only if it finished over the map, so dropping on empty space
    // cancels rather than surprising you.
    if (p.dragging) { if (overDrop(e.clientX, e.clientY)) addToBowl(p.id); }
    else toggleInBowl(p.id);
  };

  /** One row, reused by the in-stock sections and the out-of-stock drawer. */
  const row = (it: Item) => {
    const out = it.stock === 'out';
    const inBowl = store.bowl.includes(it.id);
    const pill = STOCK_PILL[it.stock];
    return (
      <div
        key={it.id}
        onPointerDown={e => onDown(e, it)}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => { press.current = null; setGhost(null); }}
        className={`group relative flex touch-none items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-all ${
          out
            ? 'cursor-not-allowed border-transparent'
            : inBowl
              ? 'cursor-grab border-neutral-900/15 bg-white shadow-sm active:cursor-grabbing'
              : 'cursor-grab border-transparent hover:border-neutral-200 hover:bg-white hover:shadow-sm active:cursor-grabbing'
        }`}
      >
        {inBowl && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-neutral-900" />}

        <div className="min-w-0 flex-1">
          <div className={`truncate text-[13.5px] leading-tight ${out ? 'text-neutral-300 line-through' : 'text-neutral-900'}`}>
            {it.name}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-neutral-400">
            <span>{it.roles.map(r => ROLE_META[r].short).join(' · ')}</span>
            {inBowl && <span className="font-medium text-neutral-900">· In bowl</span>}
          </div>
        </div>

        <StockControl
          value={it.stock}
          open={stockOpen === it.id}
          onOpen={o => setStockOpen(o ? it.id : null)}
          onPick={s => { setStock(it.id, s); setStockOpen(null); }}
        />

        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={() => onEdit(it)} title="Edit"
          className="shrink-0 text-neutral-200 transition-colors hover:text-neutral-900 group-hover:text-neutral-400"
        >
          <Pencil size={13} />
        </button>

        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={() => remove(it.id)} title="Remove"
          className="shrink-0 text-neutral-200 transition-colors hover:text-red-600 group-hover:text-neutral-400"
        >
          <Trash2 size={13} />
        </button>
      </div>
    );
  };

  return (
    // A third of the screen, not a sidebar — the pantry is the part you spend
    // the most time in. Floor keeps the rows usable on a laptop; ceiling stops
    // it becoming absurd on an ultrawide.
    // 42% rather than a third, and the cap raised from 560 — at 1680px wide
    // the old cap meant you got 560px, well under the third that was asked
    // for. @container lets the rows respond to the rail's own width instead
    // of the viewport's, since the rail is what actually changes size.
    <aside className="@container flex h-full w-1/2 min-w-[430px] max-w-[920px] shrink-0 flex-col border-r border-neutral-200 bg-neutral-50/70">
      <div className="shrink-0 border-b border-neutral-200/80 px-4 pb-3 pt-4">
        <div className="mb-0.5 flex items-baseline justify-between">
          <h2 className="text-[17px] font-semibold tracking-tight text-neutral-900">Pantry</h2>
          <span className="text-[11px] tabular-nums text-neutral-400">
            {store.items.filter(i => i.stock !== 'out').length} of {store.items.length}
          </span>
        </div>
        <p className="mb-2 text-[11px] text-neutral-400">Drag an ingredient onto the bowl, or tap to add and remove it.</p>
        {/* What In / Low / Out actually do, because the pills alone don't say. */}
        <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-neutral-400">
          <span><b className="font-medium text-emerald-700">In</b> — plenty</span>
          <span><b className="font-medium text-amber-700">Low</b> — still suggested, ranked lower</span>
          <span><b className="font-medium text-neutral-500">Out</b> — left out of bowls</span>
        </div>
        <input
          value={q} onChange={e => setQ(e.target.value)} placeholder="Search your fridge"
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] outline-none transition-colors placeholder:text-neutral-300 focus:border-neutral-900"
        />

        {/* One tap to narrow to a role, which beats scrolling once the pantry
            is big. Counts are of what's in stock, matching what's listed. */}
        <div className="mt-2 flex flex-wrap gap-1">
          {([['all', 'All'], ...ROLES.map(r => [r.id, r.label] as const)] as [Role | 'all', string][]).map(([id, label]) => {
            const count = id === 'all'
              ? store.items.filter(i => i.stock !== 'out' && match(i)).length
              : store.items.filter(i => i.roles[0] === id && i.stock !== 'out' && match(i)).length;
            const on = roleFilter === id;
            return (
              <button key={id} onClick={() => setRoleFilter(id)}
                className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] transition-colors ${
                  on ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-400'
                }`}>
                {id !== 'all' && <RoleDot role={id} size={5} muted={on} />}
                {label}
                <span className={on ? 'text-white/50' : 'text-neutral-300'}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-3">
        {sections.map(({ role, rows }) => (
          <section key={role ?? 'flat'} className="mb-4">
            {role && (
              <h3 className="sticky top-0 z-10 mb-1.5 flex items-center gap-2 bg-neutral-50/95 px-1.5 py-1 backdrop-blur">
                <RoleDot role={role} size={7} />
                <span className="text-[11px] font-semibold tracking-wide text-neutral-700">{ROLE_META[role].label}</span>
                <span className="text-[10px] tabular-nums text-neutral-300">{rows.length}</span>
              </h3>
            )}
            {/* One column while narrow, two once the rail is wide enough to
                justify it — otherwise the extra width is just dead space to
                the right of every ingredient name. */}
            <div className="grid grid-cols-1 gap-x-2 gap-y-0.5 @[620px]:grid-cols-2">{rows.map(row)}</div>
          </section>
        ))}

        {!visible.length && (
          <p className="px-2 pt-8 text-center text-[12px] text-neutral-400">
            {q.trim() ? `Nothing matching "${q.trim()}".` : 'Nothing here yet.'}
          </p>
        )}
      </div>

      <button onClick={onAdd}
        className="flex shrink-0 items-center justify-center gap-1.5 border-t border-neutral-200 py-3 text-[12px] font-medium text-neutral-600 transition-colors hover:bg-white hover:text-neutral-900">
        <Plus size={14} /> Add Ingredient
      </button>

      {ghost && createPortal(
        <div
          className={`pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-1.5 text-[12.5px] shadow-lg transition-colors ${
            ghost.over ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 bg-white text-neutral-500'
          }`}
          style={{ left: ghost.x, top: ghost.y }}
        >
          {ghost.name}
        </div>,
        document.body
      )}
    </aside>
  );
}

// ─── Map ─────────────────────────────────────────────────────────────────────

/**
 * No edges are drawn. The derived pairings still run — they power "What can I
 * make", the "goes with this" suggestions and the flavour-clash warning — but
 * 125 lines over 19 ingredients is a hairball, and lighting them up on hover
 * made it worse. The map earns its place through spatial grouping and the
 * bowl as a target, not through drawn connections.
 */
function MapCanvas({ store, setStore, addToBowl, incoming, saveFavorite, savedNow }: {
  store: Store;
  setStore: React.Dispatch<React.SetStateAction<Store>>;
  addToBowl: (id: string) => void;
  /** Something is being dragged in from the pantry — light the bowl up. */
  incoming: boolean;
  saveFavorite: () => void;
  savedNow: boolean;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragId, setDragId] = useState<string | null>(null);
  const drag = useRef<{ id: string | null; ox: number; oy: number; px: number; py: number; moved: boolean } | null>(null);

  const byId = useMemo(() => Object.fromEntries(store.items.map(i => [i.id, i])), [store.items]);

  /**
   * Where each node actually draws.
   *
   * Positions are derived, not read straight off the item. Moving an
   * ingredient into the bowl used to leave a hole in its column — Hot Honey
   * going in left a gap above Olive Oil — because the remaining nodes kept
   * their stored coordinates. Each cluster is re-packed from whatever is
   * still resting there, so the column always closes up.
   *
   * Stored x/y survives as the ORDER within a cluster, which is what makes
   * dragging still mean something: drag a node past another and it keeps the
   * new order, it just snaps to a tidy slot. The node under the cursor is
   * exempt so it tracks the pointer rather than fighting it.
   */
  const pos = useMemo(() => {
    const p: Record<string, { x: number; y: number }> = {};
    const inBowl = new Set(store.bowl);

    for (const r of ROLES) {
      const resting = store.items
        .filter(i => i.roles[0] === r.id && !inBowl.has(i.id))
        .sort((a, b) => a.y - b.y || a.x - b.x);
      if (!resting.length) continue;
      const [cx, cy] = ROLE_CENTRES[r.id];
      Object.assign(p, cloudLayout(resting.map(i => i.id), cx, cy));
    }

    const slots = bowlSlots(store.bowl.length);
    store.bowl.forEach((id, i) => { if (byId[id]) p[id] = slots[i]; });

    // Let the dragged node follow the pointer instead of snapping mid-drag.
    if (dragId && byId[dragId] && !inBowl.has(dragId)) {
      p[dragId] = { x: byId[dragId].x, y: byId[dragId].y };
    }
    return p;
  }, [store.items, store.bowl, byId, dragId]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) =>
      setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /**
   * The view is derived, not free. Panning meant the board drifted off-centre
   * and every session started somewhere different — too much optionality for
   * what is really a fixed board. The bowl is pinned to the middle of the
   * viewport and zoom scales around it, so the layout is identical every time
   * you open it.
   *
   * baseFit comes from a fixed world rect rather than live item bounds, so
   * dragging an ingredient can't make the whole board breathe.
   */
  const view = useMemo(() => {
    const base = size.w && size.h ? Math.min(size.w / WORLD.w, size.h / WORLD.h) : 1;
    const k = base * zoom;
    return { k, x: size.w / 2 - BOWL.x * k, y: size.h / 2 - BOWL.y * k };
  }, [size, zoom]);

  const toWorld = useCallback((cx: number, cy: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: (cx - r.left - view.x) / view.k, y: (cy - r.top - view.y) / view.k };
  }, [view]);

  const down = (e: React.PointerEvent, id: string | null) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const w = toWorld(e.clientX, e.clientY);
    // Items in the bowl are positioned by the bowl, so dragging them would
    // fight the layout — they only accept a tap, to come back out.
    const draggable = id !== null && !store.bowl.includes(id);
    drag.current = draggable
      ? { id, ox: w.x - byId[id!].x, oy: w.y - byId[id!].y, px: e.clientX, py: e.clientY, moved: false }
      : { id: null, ox: 0, oy: 0, px: e.clientX, py: e.clientY, moved: false };
    setDragId(draggable ? id : null);
  };

  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (Math.abs(e.clientX - d.px) + Math.abs(e.clientY - d.py) > 4) d.moved = true;
    // Only nodes move. Dragging the background used to pan the board, which
    // is how it kept ending up off-centre.
    if (!d.id) return;
    const w = toWorld(e.clientX, e.clientY);
    setStore(s => ({ ...s, items: s.items.map(i => (i.id === d.id ? { ...i, x: w.x - d.ox, y: w.y - d.oy } : i)) }));
  };

  const up = (id: string | null) => {
    const d = drag.current;
    drag.current = null;
    setDragId(null);
    // A tap on a bowl item never starts a drag, so d.id is null there — only
    // bail on genuine drags and on empty-canvas taps.
    if (!d || (d.moved && d.id) || !id) return;
    // Tap transfers into the bowl, tap again sends it home.
    if (store.bowl.includes(id)) setStore(s => ({ ...s, bowl: s.bowl.filter(b => b !== id) }));
    else if (byId[id].stock !== 'out') addToBowl(id);
  };

  const ZOOM_MIN = 0.65, ZOOM_MAX = 2;
  const nudgeZoom = (f: number) => setZoom(z => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z * f)));
  const wheel = (e: React.WheelEvent) => nudgeZoom(e.deltaY < 0 ? 1.08 : 0.926);

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden bg-white">
      <svg ref={svgRef} className="h-full w-full touch-none select-none"
        onPointerDown={e => down(e, null)} onPointerMove={move} onPointerUp={() => up(null)} onWheel={wheel}>
        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
          {/* The bowl. Drawn under the nodes so transferred ingredients sit in it. */}
          <g pointerEvents="none">
            <path
              d={`M ${BOWL.x - BOWL.rx} ${BOWL.y} C ${BOWL.x - BOWL.rx + 10} ${BOWL.y + BOWL.depth * 1.5},
                  ${BOWL.x + BOWL.rx - 10} ${BOWL.y + BOWL.depth * 1.5}, ${BOWL.x + BOWL.rx} ${BOWL.y} Z`}
              fill="#fafafa" stroke="#d4d4d4" strokeWidth={1.25} strokeLinejoin="round"
            />
            <ellipse cx={BOWL.x} cy={BOWL.y} rx={BOWL.rx} ry={BOWL.ry}
              fill="#ffffff" stroke={incoming ? '#111111' : '#d4d4d4'} strokeWidth={incoming ? 2 : 1.25}
              style={{ transition: 'stroke 160ms ease, stroke-width 160ms ease' }} />
            <ellipse cx={BOWL.x} cy={BOWL.y} rx={BOWL.rx - 11} ry={BOWL.ry - 7}
              fill="none" stroke={incoming ? '#d4d4d4' : '#f0f0f0'} strokeWidth={1}
              strokeDasharray={incoming ? '5 4' : undefined} />
            {store.bowl.length === 0 && (
              <text x={BOWL.x} y={BOWL.y + 4} textAnchor="middle" fontSize={12}
                fill={incoming ? '#111111' : '#c9c9c9'}
                style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                {incoming ? 'Drop it in' : 'Tap or drag an ingredient in'}
              </text>
            )}
            <text x={BOWL.x} y={BOWL.y + BOWL.depth * 1.12 + 22} textAnchor="middle"
              fontSize={10} letterSpacing={2.4} fill="#b5b5b5"
              style={{ fontFamily: 'ui-monospace, monospace' }}>
              {store.bowl.length ? `BOWL · ${store.bowl.length}` : 'BOWL'}
            </text>
          </g>

          {/* With the edges gone, these headings are the only thing telling
              you the map has structure, so they carry their role's colour and
              sit on a tinted chip. Anchored to the cluster's actual top edge
              rather than a fixed offset, so they follow dragged nodes. */}
          {ROLES.map(r => {
            // Must read from `pos`, not from item.x/y. Stored coordinates are
            // only an ordering hint now; nodes render at packed positions, so
            // anchoring to the stale values dropped the heading on top of the
            // first ingredient in the column.
            const mine = store.items
              .filter(i => i.roles[0] === r.id && !store.bowl.includes(i.id) && pos[i.id]);
            if (!mine.length) return null;
            const cx = mine.reduce((a, i) => a + pos[i.id].x, 0) / mine.length;
            const top = Math.min(...mine.map(i => pos[i.id].y));
            // Text starts 25px in (after the dot), so the width has to cover
            // that lead-in plus the label plus a matching right margin. The
            // old formula left short labels like "Bases" almost touching the
            // right edge.
            const w = r.label.length * 7.0 + 48;
            return (
              <g key={r.id} pointerEvents="none" transform={`translate(${cx},${top - 46})`}>
                <rect x={-w / 2} y={-13} width={w} height={26} rx={13}
                  fill={r.color} fillOpacity={0.09} stroke={r.color} strokeOpacity={0.22} strokeWidth={1} />
                <circle cx={-w / 2 + 15} cy={0} r={3.5} fill={r.color} />
                <text x={-w / 2 + 25} y={4} fontSize={11.5} fontWeight={600} letterSpacing={0.9} fill={r.color}
                  style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                  {r.label}
                </text>
              </g>
            );
          })}

          {store.items.map(it => {
            const out = it.stock === 'out';
            const inBowl = store.bowl.includes(it.id);
            const p = pos[it.id];
            const w = Math.max(78, it.name.length * 7.1 + 32);
            return (
              <g key={it.id} transform={`translate(${p.x},${p.y})`}
                style={{
                  cursor: 'pointer',
                  // Glide into and out of the bowl, but never fight a drag.
                  transition: dragId === it.id ? 'none' : 'transform 420ms cubic-bezier(0.22,1,0.36,1)',
                }}
                onPointerDown={e => { e.stopPropagation(); down(e, it.id); }}
                onPointerUp={e => { e.stopPropagation(); up(it.id); }}>
                <rect x={-w / 2} y={-17} width={w} height={34} rx={17}
                  fill={inBowl ? '#111111' : '#ffffff'}
                  stroke={out ? '#d4d4d4' : '#dcdcdc'}
                  strokeWidth={1} strokeDasharray={out ? '5 4' : undefined} />
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

      {/* Sits with the bowl, because that's where the bowl now gets built. */}
      {store.bowl.length > 0 && (
        <div className="absolute bottom-14 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-neutral-200 bg-white/95 px-2 py-1.5 shadow-sm backdrop-blur">
          <span className="pl-1.5 text-[11px] text-neutral-400">
            {store.bowl.length} in bowl
          </span>
          <button onClick={saveFavorite} disabled={savedNow}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] transition-colors ${
              savedNow
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-200 text-neutral-700 hover:border-neutral-900'
            }`}>
            {savedNow ? <><Check size={12} /> Saved</> : <><Star size={12} /> Save to Favorites</>}
          </button>
          <button onClick={() => setStore(s => ({ ...s, bowl: [] }))}
            className="rounded-full px-2 py-1 text-[11px] text-neutral-400 hover:text-neutral-900">
            Empty
          </button>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 left-4 flex flex-wrap gap-x-4 gap-y-1">
        {ROLES.map(r => (
          <span key={r.id} className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-neutral-400">
            <RoleDot role={r.id} size={6} /> {r.short}
          </span>
        ))}
      </div>
      <div className="absolute bottom-3 right-4 flex gap-2">
        {/* Positions are derived, so spacing can't drift — but dragging
            reorders a cluster, and this puts that order back to default. */}
        <button
          onClick={() => setStore(s => ({ ...s, items: layoutItems(s.items) }))}
          title="Put every cluster back in its default order"
          className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[10px] uppercase tracking-wider text-neutral-500 hover:border-neutral-400 hover:text-neutral-900">
          Tidy up
        </button>
        {/* Zoom only — there is no pan to reset, because the bowl is pinned
            to the centre of the viewport at every zoom level. */}
        <div className="flex items-center overflow-hidden rounded-full border border-neutral-200 bg-white">
          <button onClick={() => nudgeZoom(1 / 1.15)} disabled={zoom <= ZOOM_MIN}
            className="px-2.5 py-1.5 text-[13px] leading-none text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 disabled:text-neutral-200">−</button>
          <button onClick={() => setZoom(1)} title="Reset zoom"
            className="border-x border-neutral-200 px-2 py-1.5 text-[10px] tabular-nums text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900">
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={() => nudgeZoom(1.15)} disabled={zoom >= ZOOM_MAX}
            className="px-2.5 py-1.5 text-[13px] leading-none text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 disabled:text-neutral-200">+</button>
        </div>
      </div>
    </div>
  );
}

// ─── Bowl builder ────────────────────────────────────────────────────────────

function BowlView({ store, setStore, addToBowl, saveFavorite, savedNow }: {
  store: Store;
  setStore: React.Dispatch<React.SetStateAction<Store>>;
  addToBowl: (id: string) => void;
  saveFavorite: () => void;
  savedNow: boolean;
}) {
  const byId = useMemo(() => Object.fromEntries(store.items.map(i => [i.id, i])), [store.items]);
  const items = store.bowl.map(id => byId[id]).filter(Boolean);
  const slotted = assignSlots(items);

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


  const totals = items.reduce(
    (t, i) => i.macros
      ? { kcal: t.kcal + i.macros.kcal, protein: t.protein + i.macros.protein, carbs: t.carbs + i.macros.carbs, fat: t.fat + i.macros.fat }
      : t,
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const unknown = items.filter(i => !i.macros);
  // Energy split by macro, not by gram — 4/4/9 kcal per gram.
  const fromP = totals.protein * 4, fromC = totals.carbs * 4, fromF = totals.fat * 9;
  const energy = Math.max(1, fromP + fromC + fromF);
  const split: [string, number, string][] = [
    ['Protein', fromP / energy, '#dc2626'],
    ['Carbs',   fromC / energy, '#2563eb'],
    ['Fat',     fromF / energy, '#d97706'],
  ];
  const r1 = (n: number) => Math.round(n * 10) / 10;

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-xl">
        {items.length === 0 ? (
          <p className="pt-20 text-center text-[13px] text-neutral-400">
            Your bowl is empty. Tap an ingredient on the map, or pick one from the pantry.
          </p>
        ) : (
          <>
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2 className="text-[15px] font-medium">{slotted.map(s => s.item.name).join(' + ')}</h2>
              <div className="flex shrink-0 items-center gap-2">
                <button onClick={saveFavorite} disabled={savedNow}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] transition-colors ${
                    savedNow ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900'
                  }`}>
                  {savedNow ? <><Check size={12} /> Saved</> : <><Star size={12} /> Save Bowl</>}
                </button>
                <button onClick={() => setStore(s => ({ ...s, bowl: [] }))}
                  className="text-[11px] text-neutral-400 hover:text-neutral-900">Empty</button>
              </div>
            </div>

            {/* Nutrition */}
            <div className="mb-5 rounded-xl border border-neutral-200 p-4">
              <div className="mb-3 flex items-end gap-6">
                <div>
                  <div className="text-[26px] leading-none font-medium">{Math.round(totals.kcal)}</div>
                  <div className="mt-1 text-[9.5px] uppercase tracking-wider text-neutral-400">kcal</div>
                </div>
                {([['Protein', totals.protein], ['Carbs', totals.carbs], ['Fat', totals.fat]] as [string, number][]).map(([l, v]) => (
                  <div key={l}>
                    <div className="text-[15px] leading-none">{r1(v)}<span className="text-[10px] text-neutral-400">g</span></div>
                    <div className="mt-1 text-[9.5px] uppercase tracking-wider text-neutral-400">{l}</div>
                  </div>
                ))}
              </div>

              <div className="mb-1.5 flex h-1.5 overflow-hidden rounded-full bg-neutral-100">
                {split.map(([l, frac, c]) => (
                  <div key={l} style={{ width: `${frac * 100}%`, background: c }} title={`${l} ${Math.round(frac * 100)}%`} />
                ))}
              </div>
              <div className="flex gap-3">
                {split.map(([l, frac, c]) => (
                  <span key={l} className="flex items-center gap-1 text-[9.5px] uppercase tracking-wider text-neutral-400">
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: c }} />
                    {l} {Math.round(frac * 100)}%
                  </span>
                ))}
              </div>

              <table className="mt-3.5 w-full border-t border-neutral-100 pt-2 text-[11px]">
                <tbody>
                  {items.map(i => (
                    <tr key={i.id} className="text-neutral-500">
                      <td className="py-0.5">{i.name}</td>
                      <td className="w-14 py-0.5 text-right tabular-nums">{i.macros ? Math.round(i.macros.kcal) : '—'}</td>
                      <td className="w-12 py-0.5 text-right tabular-nums text-neutral-400">{i.macros ? `${r1(i.macros.protein)}p` : ''}</td>
                      <td className="w-12 py-0.5 text-right tabular-nums text-neutral-400">{i.macros ? `${r1(i.macros.carbs)}c` : ''}</td>
                      <td className="w-12 py-0.5 text-right tabular-nums text-neutral-400">{i.macros ? `${r1(i.macros.fat)}f` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="mt-3 border-t border-neutral-100 pt-2 text-[10px] leading-relaxed text-neutral-400">
                Rough per-serving estimates for comparing bowls, not a nutrition label.
                {unknown.length > 0 && ` ${unknown.length} item${unknown.length > 1 ? 's have' : ' has'} no data and ${unknown.length > 1 ? 'are' : 'is'} excluded: ${unknown.map(i => i.name).join(', ')}.`}
              </p>
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

function FavoritesView({ store, setStore, goToBowl }: {
  store: Store;
  setStore: React.Dispatch<React.SetStateAction<Store>>;
  goToBowl: () => void;
}) {
  const have = useMemo(() => new Set(store.items.map(i => i.id)), [store.items]);

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      {store.favorites.length === 0 ? (
        <p className="pt-20 text-center text-[13px] text-neutral-400">
          No saved bowls yet. Build one, then hit Save Bowl in Bowl Nutrition.
        </p>
      ) : (
        <>
          <p className="mb-4 text-[11px] text-neutral-400">
            {store.favorites.length} saved {store.favorites.length === 1 ? 'bowl' : 'bowls'}.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {store.favorites.map(f => {
              // An ingredient can be deleted from the pantry after a bowl was
              // saved. Say so rather than quietly loading a smaller bowl.
              const gone = f.itemIds.filter(id => !have.has(id));
              return (
                <div key={f.id} className="flex flex-col rounded-xl border border-neutral-200 p-4 transition-colors hover:border-neutral-400">
                  <div className="mb-2 text-[13px] font-medium leading-snug">{f.name}</div>
                  <ul className="mb-3 flex-1 space-y-0.5">
                    {f.itemNames.map((n, i) => (
                      <li key={i} className={`text-[11px] ${have.has(f.itemIds[i]) ? 'text-neutral-500' : 'text-neutral-300 line-through'}`}>
                        {n}
                      </li>
                    ))}
                  </ul>
                  {gone.length > 0 && (
                    <p className="mb-2 text-[10px] text-amber-700">
                      {gone.length} ingredient{gone.length > 1 ? 's are' : ' is'} no longer in your pantry.
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => { setStore(s => ({ ...s, bowl: f.itemIds.filter(id => have.has(id)) })); goToBowl(); }}
                      className="text-[10px] uppercase tracking-wider text-neutral-400 hover:text-neutral-900">
                      Load Into Bowl →
                    </button>
                    <button
                      onClick={() => setStore(s => ({ ...s, favorites: s.favorites.filter(x => x.id !== f.id) }))}
                      title="Delete" className="text-neutral-200 hover:text-red-600">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

type Tab = 'map' | 'bowl' | 'favorites' | 'ideas';

export default function SlopBowl() {
  useScopedManifest();
  const [store, setStore] = useState<Store>(loadStore);
  const [tab, setTab] = useState<Tab>('map');
  const [adding, setAdding] = useState(false);
  const [railOpen, setRailOpen] = useState(false);

  const { user, ready, saving } = useSync(store, setStore);

  const ideas = useMemo(() => (tab === 'ideas' ? suggestBowls(store) : []), [tab, store]);

  /** Deliberately does not change tab — the payoff is the ingredient landing in
   *  the bowl on the canvas, so yanking the user to another view hides it. */
  const addToBowl = useCallback((id: string) => {
    setStore(s => (s.bowl.includes(id) ? s : { ...s, bowl: [...s.bowl, id] }));
  }, []);

  const [dragging, setDragging] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);

  const toggleInBowl = useCallback((id: string) => {
    setStore(s => ({ ...s, bowl: s.bowl.includes(id) ? s.bowl.filter(b => b !== id) : [...s.bowl, id] }));
  }, []);

  // Saving lives here rather than inside BowlView because the bowl is composed
  // on the Map now — burying the only save button in another tab meant nobody
  // found it. Both surfaces call the same thing.
  const bowlKey = store.bowl.slice().sort().join('~');
  const alreadySaved = store.favorites.some(f => f.itemIds.slice().sort().join('~') === bowlKey);

  const saveFavorite = useCallback(() => {
    setStore(s => {
      if (!s.bowl.length) return s;
      const k = s.bowl.slice().sort().join('~');
      if (s.favorites.some(f => f.itemIds.slice().sort().join('~') === k)) return s;  // no duplicates
      const named = s.bowl.map(id => s.items.find(i => i.id === id)).filter(Boolean) as Item[];
      const fav: Favorite = {
        id: `${k}-${s.favorites.length}`,
        name: assignSlots(named).map(x => x.item.name).join(' + '),
        itemIds: [...s.bowl],
        itemNames: named.map(i => i.name),   // snapshot, so later renames don't rewrite history
        savedAt: Date.now(),
      };
      return { ...s, favorites: [fav, ...s.favorites] };
    });
  }, []);

  const rail = (
    <PantryRail store={store} setStore={setStore} addToBowl={addToBowl} toggleInBowl={toggleInBowl}
      onAdd={() => { setEditing(null); setAdding(true); }}
      onEdit={it => { setEditing(it); setAdding(true); }}
      onDragStateChange={setDragging} />
  );

  return (
    <div className="flex h-screen flex-col bg-white text-neutral-900">
      <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <button onClick={() => setRailOpen(v => !v)} className="text-neutral-400 hover:text-neutral-900 md:hidden">
            <PanelLeft size={16} />
          </button>
          <h1 className="text-[15px] font-semibold tracking-tight">Slop Bowl</h1>
          <span className="hidden rounded-full border border-neutral-200 px-2 py-0.5 text-[9px] uppercase tracking-wider text-neutral-400 sm:inline">
            Work in progress
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Only a hint, not a spinner — saving shouldn't feel like a wait. */}
          {saving && <span className="hidden text-[10px] text-neutral-300 sm:inline">saving…</span>}

          {user ? (
            <div className="flex items-center gap-2">
              {user.photoURL
                ? <img src={user.photoURL} alt="" className="h-6 w-6 rounded-full" referrerPolicy="no-referrer" />
                : <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-[10px] text-white">
                    {(user.displayName ?? user.email ?? '?').charAt(0).toUpperCase()}
                  </span>}
              <span className="hidden max-w-[130px] truncate text-[11px] text-neutral-500 md:inline">
                {user.displayName ?? user.email}
              </span>
              <button onClick={() => logout()} title="Sign out"
                className="text-neutral-300 hover:text-neutral-900"><LogOut size={14} /></button>
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle().catch(e => console.error('[SlopBowl] sign-in failed', e))}
              className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1 text-[11px] text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900"
            >
              <GoogleMark /> Sign in
            </button>
          )}

          <Link to="/" className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-neutral-400 hover:text-neutral-900">
            <ChevronLeft size={13} /> Portfolio
          </Link>
        </div>
      </header>

      {/* Guests aren't blocked — the app works fully without an account, this
          just says what signing in buys you. */}
      {ready && !user && (
        <div className="shrink-0 border-b border-neutral-100 bg-neutral-50/70 px-4 py-1.5 text-[11px] text-neutral-500">
          Your pantry is saved on this device. Sign in to keep it across your phone and laptop.
        </div>
      )}

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
                { id: 'bowl', label: 'Bowl Nutrition', badge: store.bowl.length || undefined },
                { id: 'favorites', label: 'Favorite Bowls', badge: store.favorites.length || undefined },
                { id: 'ideas', label: 'What can I make' },
              ]}
              value={tab} onChange={setTab}
            />
          </div>

          {tab === 'map' && (
            <div className="shrink-0 border-b border-neutral-100 px-4 py-1.5 text-[11px] text-neutral-400">
              Tap an ingredient to drop it in the bowl, tap it again to put it back. Drag to rearrange.
            </div>
          )}

          {/* Marks the drop zone for pantry drags — hit-tested by coordinate,
              so it works regardless of the canvas pan/zoom transform. */}
          <main data-slopbowl-drop={tab === 'map' ? '' : undefined} className="min-h-0 flex-1 overflow-hidden">
            {tab === 'map' && (
              <MapCanvas store={store} setStore={setStore} addToBowl={addToBowl} incoming={dragging}
                saveFavorite={saveFavorite} savedNow={alreadySaved} />
            )}
            {tab === 'bowl' && (
              <BowlView store={store} setStore={setStore} addToBowl={addToBowl}
                saveFavorite={saveFavorite} savedNow={alreadySaved} />
            )}
            {tab === 'favorites' && <FavoritesView store={store} setStore={setStore} goToBowl={() => setTab('bowl')} />}
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

      {adding && (
        <ItemDialog
          item={editing}
          onClose={() => { setAdding(false); setEditing(null); }}
          onSave={it => setStore(s => ({
            ...s,
            items: s.items.some(x => x.id === it.id)
              ? s.items.map(x => (x.id === it.id ? it : x))
              : [...s.items, it],
          }))}
        />
      )}
    </div>
  );
}

// ─── Add dialog ──────────────────────────────────────────────────────────────

/** One dialog for both add and edit. Editing keeps the item's id, position,
 *  stock and macros — only the fields on screen change, so a rename doesn't
 *  move the node or reset what you had in stock. */
function ItemDialog({ item, onClose, onSave }: {
  item: Item | null;
  onClose: () => void;
  onSave: (it: Item) => void;
}) {
  const [name, setName] = useState(item?.name ?? '');
  // Nothing preselected when adding. Defaulting roles to ['base'] meant every
  // new ingredient arrived as a Base whether you meant it or not, and the old
  // toggle refused to remove the last remaining pick — so tapping Base to
  // clear it did nothing at all and read as broken. Validation moved to the
  // submit button, where it can actually say what's missing.
  const [roles, setRoles] = useState<Role[]>(item?.roles ?? []);

  const toggle = <T,>(arr: T[], v: T, set: (a: T[]) => void) =>
    set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  const missing = !name.trim() ? 'Name it first'
    : !roles.length ? 'Pick at least one role'
    : null;

  const submit = () => {
    const n = name.trim();
    if (missing) return;
    if (item) {
      onSave({ ...item, name: n, roles });
    } else {
      const [cx, cy] = ROLE_CENTRES[roles[0]];
      onSave({
        id: `${n.toLowerCase().replace(/\s+/g, '-')}-${n.length}-${roles.join('')}`,
        name: n, roles, stock: 'in',
        x: cx + (n.length % 7) * 18 - 50,
        y: cy + (n.length % 5) * 22 - 40,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/20 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-2xl border border-neutral-200 bg-white p-5 sm:rounded-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold">{item ? 'Edit Ingredient' : 'Add Ingredient'}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900"><X size={16} /></button>
        </div>

        <input autoFocus value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Cottage cheese"
          className="mb-4 w-full border-b border-neutral-300 pb-2 text-[14px] outline-none placeholder:text-neutral-300 focus:border-neutral-900" />

        <p className="mb-1.5 text-[10px] uppercase tracking-wider text-neutral-400">
          Role <span className="normal-case tracking-normal">— first pick is primary</span>
        </p>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {ROLES.map(r => {
            const i = roles.indexOf(r.id);
            return (
              <button key={r.id} onClick={() => toggle(roles, r.id, setRoles)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                  i > -1 ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'
                }`}>
                <RoleDot role={r.id} size={5} /> {r.short}
                {/* Order is meaningful — [0] is the primary role — so show it
                    rather than just claiming it in the label above. */}
                {i > -1 && (
                  <span className="text-[9px] text-white/60">{i === 0 ? 'primary' : i + 1}</span>
                )}
              </button>
            );
          })}
        </div>

        <button onClick={submit} disabled={!!missing}
          className="w-full rounded-full bg-neutral-900 py-2.5 text-[12px] text-white transition-colors disabled:bg-neutral-100 disabled:text-neutral-400">
          {missing ?? (item ? 'Save Changes' : 'Add to Pantry')}
        </button>
      </div>
    </div>
  );
}
