/**
 * Common bowl ingredients with the section each belongs in.
 *
 * Two jobs from one list: it drives autocomplete in the add field (so typing
 * "ban" offers Banana, already filed under Fruits) and it is the source for
 * the SlopShop browse view. Keeping it in one place means a new ingredient
 * shows up in both without being entered twice.
 *
 * Roles follow the same convention as the pantry: [0] is primary, a second
 * only where an ingredient genuinely serves two.
 */
export type CatalogRole = 'base' | 'protein' | 'vegetable' | 'fruit' | 'crunch' | 'sauce';

export interface CatalogItem { name: string; roles: CatalogRole[] }

export const CATALOG: CatalogItem[] = [
  // ─── Bases ────────────────────────────────────────────────────────────────
  { name: 'Jasmine Rice', roles: ['base'] },
  { name: 'Brown Rice', roles: ['base'] },
  { name: 'Sushi Rice', roles: ['base'] },
  { name: 'Quinoa', roles: ['base', 'protein'] },
  { name: 'Couscous', roles: ['base'] },
  { name: 'Farro', roles: ['base'] },
  { name: 'Bulgur', roles: ['base'] },
  { name: 'Orzo', roles: ['base'] },
  { name: 'Soba Noodles', roles: ['base'] },
  { name: 'Rice Noodles', roles: ['base'] },
  { name: 'Oats', roles: ['base'] },
  { name: 'Overnight Oats', roles: ['base'] },
  { name: 'Polenta', roles: ['base'] },
  { name: 'Cauliflower Rice', roles: ['base', 'vegetable'] },
  { name: 'Greek Yogurt', roles: ['base', 'protein'] },
  { name: 'Skyr', roles: ['base', 'protein'] },
  { name: 'Cottage Cheese', roles: ['base', 'protein'] },
  { name: 'Mixed Greens', roles: ['base', 'vegetable'] },
  { name: 'Spinach', roles: ['base', 'vegetable'] },
  { name: 'Arugula', roles: ['base', 'vegetable'] },
  { name: 'Romaine', roles: ['base', 'vegetable'] },
  { name: 'Kale', roles: ['base', 'vegetable'] },

  // ─── Proteins ─────────────────────────────────────────────────────────────
  { name: 'Grilled Chicken', roles: ['protein'] },
  { name: 'Shredded Chicken', roles: ['protein'] },
  { name: 'Ground Beef', roles: ['protein'] },
  { name: 'Ground Turkey', roles: ['protein'] },
  { name: 'Steak', roles: ['protein'] },
  { name: 'Salmon', roles: ['protein'] },
  { name: 'Smoked Salmon', roles: ['protein'] },
  { name: 'Tuna', roles: ['protein'] },
  { name: 'Shrimp', roles: ['protein'] },
  { name: 'Eggs', roles: ['protein'] },
  { name: 'Hard-Boiled Eggs', roles: ['protein'] },
  { name: 'Tofu', roles: ['protein'] },
  { name: 'Tempeh', roles: ['protein'] },
  { name: 'Paneer', roles: ['protein'] },
  { name: 'Halloumi', roles: ['protein'] },
  { name: 'Feta', roles: ['protein'] },
  { name: 'Goat Cheese', roles: ['protein'] },
  { name: 'Parmesan', roles: ['protein'] },
  { name: 'Chickpeas', roles: ['protein'] },
  { name: 'Black Beans', roles: ['protein'] },
  { name: 'Lentils', roles: ['protein'] },
  { name: 'Edamame', roles: ['protein'] },
  { name: 'Falafel', roles: ['protein'] },
  { name: 'Bacon', roles: ['protein'] },
  { name: 'Prosciutto', roles: ['protein'] },

  // ─── Vegetables ───────────────────────────────────────────────────────────
  { name: 'Sliced Cucumber', roles: ['vegetable'] },
  { name: 'Cherry Tomatoes', roles: ['vegetable'] },
  { name: 'Roasted Peppers', roles: ['vegetable'] },
  { name: 'Red Onion', roles: ['vegetable'] },
  { name: 'Pickled Onion', roles: ['vegetable'] },
  { name: 'Avocado', roles: ['vegetable'] },
  { name: 'Broccoli', roles: ['vegetable'] },
  { name: 'Roasted Carrots', roles: ['vegetable'] },
  { name: 'Zucchini', roles: ['vegetable'] },
  { name: 'Mushrooms', roles: ['vegetable'] },
  { name: 'Roasted Corn', roles: ['vegetable'] },
  { name: 'Peas', roles: ['vegetable'] },
  { name: 'Beets', roles: ['vegetable'] },
  { name: 'Brussels Sprouts', roles: ['vegetable'] },
  { name: 'Asparagus', roles: ['vegetable'] },
  { name: 'Cabbage Slaw', roles: ['vegetable'] },
  { name: 'Butternut Squash', roles: ['vegetable', 'base'] },
  { name: 'Sweet Potato', roles: ['vegetable', 'base'] },
  { name: 'Jalapeños', roles: ['vegetable'] },
  { name: 'Olives', roles: ['vegetable'] },
  { name: 'Sun-Dried Tomatoes', roles: ['vegetable'] },
  { name: 'Artichoke Hearts', roles: ['vegetable'] },
  { name: 'Roasted Cauliflower', roles: ['vegetable'] },
  { name: 'Snap Peas', roles: ['vegetable'] },

  // ─── Fruits ───────────────────────────────────────────────────────────────
  { name: 'Fresh Berries', roles: ['fruit'] },
  { name: 'Strawberries', roles: ['fruit'] },
  { name: 'Blueberries', roles: ['fruit'] },
  { name: 'Raspberries', roles: ['fruit'] },
  { name: 'Blackberries', roles: ['fruit'] },
  { name: 'Banana', roles: ['fruit'] },
  { name: 'Mango', roles: ['fruit'] },
  { name: 'Pineapple', roles: ['fruit'] },
  { name: 'Apple', roles: ['fruit'] },
  { name: 'Pear', roles: ['fruit'] },
  { name: 'Peach', roles: ['fruit'] },
  { name: 'Orange Segments', roles: ['fruit'] },
  { name: 'Grapes', roles: ['fruit'] },
  { name: 'Pomegranate Seeds', roles: ['fruit'] },
  { name: 'Kiwi', roles: ['fruit'] },
  { name: 'Watermelon', roles: ['fruit'] },
  { name: 'Dates', roles: ['fruit'] },
  { name: 'Dried Cranberries', roles: ['fruit'] },
  { name: 'Raisins', roles: ['fruit'] },
  { name: 'Dried Figs', roles: ['fruit'] },

  // ─── Crunch & Mix-ins ─────────────────────────────────────────────────────
  { name: 'Roasted Nuts', roles: ['crunch'] },
  { name: 'Almonds', roles: ['crunch'] },
  { name: 'Walnuts', roles: ['crunch'] },
  { name: 'Pecans', roles: ['crunch'] },
  { name: 'Cashews', roles: ['crunch'] },
  { name: 'Pistachios', roles: ['crunch'] },
  { name: 'Peanuts', roles: ['crunch'] },
  { name: 'Pumpkin Seeds', roles: ['crunch'] },
  { name: 'Sunflower Seeds', roles: ['crunch'] },
  { name: 'Sesame Seeds', roles: ['crunch'] },
  { name: 'Chia Seeds', roles: ['crunch'] },
  { name: 'Flax Seeds', roles: ['crunch'] },
  { name: 'Hemp Hearts', roles: ['crunch'] },
  { name: 'Granola', roles: ['crunch'] },
  { name: 'Cacao Nibs', roles: ['crunch'] },
  { name: 'Shredded Coconut', roles: ['crunch'] },
  { name: 'Crispy Onions', roles: ['crunch'] },
  { name: 'Crispy Chickpeas', roles: ['crunch'] },
  { name: 'Wonton Strips', roles: ['crunch'] },
  { name: 'Tortilla Strips', roles: ['crunch'] },
  { name: 'Croutons', roles: ['crunch'] },
  { name: 'Dark Chocolate Chips', roles: ['crunch'] },

  // ─── Sauces & Seasonings ──────────────────────────────────────────────────
  { name: 'Honey', roles: ['sauce'] },
  { name: 'Hot Honey', roles: ['sauce'] },
  { name: 'Maple Syrup', roles: ['sauce'] },
  { name: 'Olive Oil', roles: ['sauce'] },
  { name: 'Sesame Oil', roles: ['sauce'] },
  { name: 'Chili Crisp', roles: ['sauce'] },
  { name: 'Sriracha', roles: ['sauce'] },
  { name: 'Gochujang', roles: ['sauce'] },
  { name: 'Harissa', roles: ['sauce'] },
  { name: 'Tahini', roles: ['sauce'] },
  { name: 'Hummus', roles: ['sauce', 'protein'] },
  { name: 'Pesto', roles: ['sauce'] },
  { name: 'Soy Sauce', roles: ['sauce'] },
  { name: 'Ponzu', roles: ['sauce'] },
  { name: 'Balsamic Glaze', roles: ['sauce'] },
  { name: 'Lemon Juice', roles: ['sauce'] },
  { name: 'Lime Juice', roles: ['sauce'] },
  { name: 'Ranch', roles: ['sauce'] },
  { name: 'Caesar Dressing', roles: ['sauce'] },
  { name: 'Tzatziki', roles: ['sauce'] },
  { name: 'Salsa', roles: ['sauce'] },
  { name: 'Guacamole', roles: ['sauce'] },
  { name: 'Peanut Sauce', roles: ['sauce'] },
  { name: 'Yogurt Dressing', roles: ['sauce'] },
  { name: 'Everything Bagel Seasoning', roles: ['sauce'] },
  { name: 'Furikake', roles: ['sauce'] },
  { name: "Za'atar", roles: ['sauce'] },
  { name: 'Chili Flakes', roles: ['sauce'] },
  { name: 'Flaky Salt', roles: ['sauce'] },
  { name: 'Nutritional Yeast', roles: ['sauce'] },
];

/**
 * Prefix matches first, then anything containing the query — so "nut" offers
 * Nutritional Yeast before Roasted Nuts, which is what you meant if you
 * started typing at the beginning of a word.
 */
export function searchCatalog(q: string, exclude: string[] = [], limit = 6, extra: CatalogItem[] = []): CatalogItem[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  const taken = new Set(exclude.map(n => n.toLowerCase()));
  const starts: CatalogItem[] = [];
  const contains: CatalogItem[] = [];
  // User additions first: if someone has taken the trouble to add an
  // ingredient to their own shop, it should outrank the stock list.
  for (const it of [...extra, ...CATALOG]) {
    const name = it.name.toLowerCase();
    if (taken.has(name)) continue;
    if (name.startsWith(needle)) starts.push(it);
    else if (name.includes(needle)) contains.push(it);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}
