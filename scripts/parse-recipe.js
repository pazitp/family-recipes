// מפרק טקסט מתכון (כותרת + גוף של issue) לאובייקט מתכון בפורמט של האפליקציה.
// מיוצא כפונקציה כדי שאפשר יהיה לבדוק אותו בלי Firebase.
const ALL_UNITS = ['גרם', 'ק"ג', 'מ"ל', 'ליטר', 'כוס', 'כף', 'כפית', 'יחידה', 'חבילה', 'קורט', 'לפי הטעם'];
const UNIT_ALIASES = {
  'ג': 'גרם', 'גר': 'גרם', "ג'": 'גרם', 'קג': 'ק"ג', 'ק״ג': 'ק"ג', 'מל': 'מ"ל', 'מ״ל': 'מ"ל',
  'כוסות': 'כוס', 'כפות': 'כף', 'כפיות': 'כפית', 'יח': 'יחידה', "יח'": 'יחידה', 'יחידות': 'יחידה',
  'חבילות': 'חבילה', 'חופן': 'יחידה', 'לפי טעם': 'לפי הטעם', '': 'יחידה',
};

const KEY_MAP = {
  'מקור': 'source', source: 'source',
  'תגיות': 'tags', tags: 'tags',
  'מנות': 'servings', servings: 'servings',
  'הכנה': 'prepMin', prep: 'prepMin',
  'בישול': 'cookMin', cook: 'cookMin',
  'הערת זמן': 'timeNote', timenote: 'timeNote',
};

function parseAmount(s) {
  s = (s || '').trim().replace(/[¼½¾⅓⅔]/g, c => ({ '¼': '.25', '½': '.5', '¾': '.75', '⅓': '.333', '⅔': '.667' }[c]));
  if (!s) return null;
  const frac = s.match(/^(\d+)?\s*(\d+)\/(\d+)$/); // 1 1/2 או 1/2
  if (frac) return (Number(frac[1] || 0) + Number(frac[2]) / Number(frac[3]));
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function normUnit(u) {
  u = (u || '').trim();
  if (ALL_UNITS.includes(u)) return u;
  if (UNIT_ALIASES[u] !== undefined) return UNIT_ALIASES[u];
  return null;
}

function parseIngredient(line) {
  line = line.replace(/^[-•*]\s*/, '').trim();
  if (!line) return null;
  if (line.includes('|')) {
    const parts = line.split('|').map(p => p.trim());
    const [a, u, ...rest] = parts;
    const name = rest.join(' ').trim() || u;
    let unit = normUnit(u);
    let amount = parseAmount(a);
    if (unit === null) { unit = 'יחידה'; return { amount, unit, name: [u, ...rest].join(' ').trim() }; }
    if (amount === null && a) return { amount: null, unit, name: (a + ' ' + name).trim() };
    return { amount, unit, name };
  }
  // פורמט חופשי: "2 כוסות קמח" / "מלח" / "1/2 כפית כמון"
  const m = line.match(/^(\d+(?:[.,]\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+|[¼½¾⅓⅔])\s+(\S+)\s*(.*)$/u);
  if (m) {
    const unit = normUnit(m[2]);
    if (unit) return { amount: parseAmount(m[1]), unit, name: m[3].trim() || m[2] };
    return { amount: parseAmount(m[1]), unit: 'יחידה', name: (m[2] + ' ' + m[3]).trim() };
  }
  return { amount: null, unit: 'לפי הטעם', name: line };
}

function parseRecipe(title, body) {
  title = (title || '').replace(/^מתכון:\s*/u, '').trim();
  if (!title) throw new Error('כותרת המתכון ריקה אחרי הסרת הקידומת "מתכון:"');
  const r = { title, source: '', tags: [], servings: 4, prepMin: null, cookMin: null, timeNote: '', ingredients: [], steps: [] };
  let section = 'meta';
  for (const raw of (body || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (/^(מצרכים|ingredients)\s*:?\s*$/iu.test(line)) { section = 'ing'; continue; }
    if (/^(שלבים|הוראות|אופן ההכנה|steps)\s*:?\s*$/iu.test(line)) { section = 'steps'; continue; }
    if (section === 'meta') {
      const m = line.match(/^([A-Za-z\u0590-\u05FF ]+?)\s*:\s*(.*)$/u);
      const key = m && KEY_MAP[m[1].trim().toLowerCase()];
      if (!key) continue;
      const v = m[2].trim();
      if (key === 'tags') r.tags = v.split(/[,،]/).map(t => t.trim()).filter(Boolean);
      else if (key === 'servings') r.servings = Math.max(1, parseInt(v, 10) || 1);
      else if (key === 'prepMin' || key === 'cookMin') { const n = parseInt(v, 10); r[key] = Number.isFinite(n) ? n : null; }
      else r[key] = v;
    } else if (section === 'ing') {
      const ing = parseIngredient(line);
      if (ing && ing.name) r.ingredients.push(ing);
    } else {
      r.steps.push(line.replace(/^(\d+[.)]|[-•*])\s*/u, '').trim());
    }
  }
  if (!r.ingredients.length) throw new Error('לא נמצאו מצרכים — צריך כותרת "מצרכים:" ואחריה שורות');
  if (!r.steps.length) throw new Error('לא נמצאו שלבים — צריך כותרת "שלבים:" ואחריה שורות');
  return r;
}

module.exports = { parseRecipe, parseIngredient, ALL_UNITS };
