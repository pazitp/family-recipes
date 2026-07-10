/* ============================================================
   המתכונים שלנו — אפליקציית מתכונים משפחתית
   ============================================================ */

/* ---------- יחידות מידה והמרות ---------- */

const VOL_ML = { 'מ"ל': 1, 'ליטר': 1000, 'כוס': 240, 'כף': 15, 'כפית': 5 };
const MASS_G = { 'גרם': 1, 'ק"ג': 1000 };
const COUNT_UNITS = ['יחידה', 'חבילה', 'קורט', 'לפי הטעם'];
const ALL_UNITS = ['גרם', 'ק"ג', 'מ"ל', 'ליטר', 'כוס', 'כף', 'כפית', 'יחידה', 'חבילה', 'קורט', 'לפי הטעם'];

// צפיפות בגרם למ"ל. הסדר חשוב — התאמה ספציפית לפני כללית.
const DENSITIES = [
  { match: ['קמח שקדים'], d: 0.40 },
  { match: ['קמח מלא'], d: 0.50 },
  { match: ['קמח'], d: 0.55 },
  { match: ['אבקת סוכר'], d: 0.50 },
  { match: ['סוכר חום'], d: 0.75 },
  { match: ['סוכר וניל'], d: 0.80 },
  { match: ['סוכר'], d: 0.83 },
  { match: ['חמאה', 'מרגרינה'], d: 0.95 },
  { match: ['שמן'], d: 0.92, liquid: true },
  { match: ['מים', 'קפה'], d: 1.0, liquid: true },
  { match: ['חלב קוקוס'], d: 0.97, liquid: true },
  { match: ['חלב'], d: 1.03, liquid: true },
  { match: ['שמנת'], d: 1.0, liquid: true },
  { match: ['יוגורט'], d: 1.03, liquid: true },
  { match: ['דבש'], d: 1.42, liquid: true },
  { match: ['סילאן'], d: 1.40, liquid: true },
  { match: ['מייפל'], d: 1.32, liquid: true },
  { match: ['טחינה'], d: 1.05, liquid: true },
  { match: ['רסק עגבניות'], d: 1.05 },
  { match: ['קקאו'], d: 0.42 },
  { match: ['קורנפלור'], d: 0.50 },
  { match: ['שיבולת שועל', 'קוואקר'], d: 0.38 },
  { match: ['אורז'], d: 0.77 },
  { match: ['עדשים'], d: 0.80 },
  { match: ['מלח'], d: 1.20 },
  { match: ['אבקת אפייה'], d: 0.90 },
  { match: ['סודה לשתייה'], d: 0.92 },
  { match: ['שמרים'], d: 0.62 },
  { match: ['פירורי לחם'], d: 0.45 },
  { match: ['שוקולד'], d: 0.70 },
  { match: ['אגוזים', 'שקדים', 'פקאן'], d: 0.50 },
  { match: ['צימוקים'], d: 0.60 },
  { match: ['תמצית וניל'], d: 0.88, liquid: true },
  { match: ['מיץ'], d: 1.04, liquid: true },
  { match: ['יין'], d: 0.99, liquid: true },
];

function findDensity(name) {
  if (!name) return null;
  return DENSITIES.find(e => e.match.some(m => name.includes(m))) || null;
}

const FRACTIONS = [
  [0.25, '¼'], [1 / 3, '⅓'], [0.5, '½'], [2 / 3, '⅔'], [0.75, '¾'],
];

// עיגול לשבר "יפה" (רבעים ושלישים) — לכוסות וכפות
function fracStr(n) {
  const whole = Math.floor(n + 0.001);
  const rest = n - whole;
  if (rest < 0.08) return whole === 0 ? '' : String(whole);
  let best = null, bestDiff = 0.09;
  for (const [v, s] of FRACTIONS) {
    const diff = Math.abs(rest - v);
    if (diff < bestDiff) { bestDiff = diff; best = s; }
  }
  if (best === null) {
    const rounded = Math.round(n * 10) / 10;
    return String(rounded);
  }
  return whole === 0 ? best : whole + best;
}

// עיגול כמויות מטריות
function metricStr(n) {
  if (n < 10) return String(Math.round(n * 10) / 10);
  if (n < 100) return String(Math.round(n));
  return String(Math.round(n / 5) * 5);
}

function countStr(n) {
  const r = Math.round(n * 4) / 4;
  if (Number.isInteger(r)) return String(r);
  return fracStr(r) || String(Math.round(n * 10) / 10);
}

// המרת מ"ל לתצוגת כוסות / כפות / כפיות
function mlToSpoons(ml) {
  if (ml >= 55) {
    const cups = ml / 240;
    // מציאת השבר הקרוב ביותר בין רבעים ושלישים
    const quarter = Math.round(cups * 4) / 4;
    const third = Math.round(cups * 3) / 3;
    const best = Math.abs(quarter - cups) <= Math.abs(third - cups) ? quarter : third;
    if (best > 0) return { amount: best, unit: 'כוס' };
  }
  if (ml >= 14) {
    return { amount: Math.round((ml / 15) * 2) / 2, unit: 'כף' };
  }
  const tsp = Math.round((ml / 5) * 4) / 4;
  return { amount: Math.max(tsp, 0.25), unit: 'כפית' };
}

/**
 * המרת מצרך לשיטת המידה המבוקשת.
 * system: 'original' | 'metric' | 'cups'
 * מחזירה {amount, unit} או null אם אין המרה (ואז מציגים את המקור).
 */
function convertIngredient(amount, unit, name, system) {
  if (amount == null || COUNT_UNITS.includes(unit)) return null;
  if (system === 'original') return null;

  if (system === 'metric') {
    if (MASS_G[unit] !== undefined) {
      const g = amount * MASS_G[unit];
      return g >= 1000 ? { amount: g / 1000, unit: 'ק"ג' } : { amount: g, unit: 'גרם' };
    }
    if (VOL_ML[unit] !== undefined) {
      const ml = amount * VOL_ML[unit];
      const dens = findDensity(name);
      if (dens && !dens.liquid) {
        const g = ml * dens.d;
        return g >= 1000 ? { amount: g / 1000, unit: 'ק"ג' } : { amount: g, unit: 'גרם' };
      }
      return ml >= 1000 ? { amount: ml / 1000, unit: 'ליטר' } : { amount: ml, unit: 'מ"ל' };
    }
    return null;
  }

  if (system === 'cups') {
    let ml = null;
    if (VOL_ML[unit] !== undefined) {
      if (unit === 'כוס' || unit === 'כף' || unit === 'כפית') {
        // כבר בכוסות — רק נעגל יפה אחרי שינוי מנות
        return { amount, unit };
      }
      ml = amount * VOL_ML[unit];
    } else if (MASS_G[unit] !== undefined) {
      const dens = findDensity(name);
      if (!dens) return null;
      ml = (amount * MASS_G[unit]) / dens.d;
    }
    if (ml == null) return null;
    return mlToSpoons(ml);
  }
  return null;
}

// טקסט תצוגה של כמות מצרך אחרי שינוי מנות והמרת מידות
function ingredientDisplay(ing, factor, system) {
  const name = ing.name || '';
  if (ing.amount == null || ing.amount === '') {
    return { amount: COUNT_UNITS.includes(ing.unit) && ing.unit !== 'יחידה' ? ing.unit : '', name };
  }
  const scaled = ing.amount * factor;

  if (COUNT_UNITS.includes(ing.unit)) {
    if (ing.unit === 'קורט' || ing.unit === 'לפי הטעם') {
      return { amount: ing.unit, name };
    }
    const unitLabel = ing.unit === 'יחידה' ? '' : ' ' + ing.unit;
    return { amount: ltrNum(countStr(scaled)) + unitLabel, name };
  }

  const conv = convertIngredient(scaled, ing.unit, name, system);
  if (conv) {
    const isSpoon = ['כוס', 'כף', 'כפית'].includes(conv.unit);
    const numStr = isSpoon ? fracStr(conv.amount) : metricStr(conv.amount);
    return { amount: ltrNum(String(numStr || conv.amount)) + ' ' + pluralUnit(conv.unit, conv.amount), name };
  }
  const isSpoonOrig = ['כוס', 'כף', 'כפית'].includes(ing.unit);
  const numStr = isSpoonOrig ? fracStr(scaled) : metricStr(scaled);
  return { amount: ltrNum(String(numStr || scaled)) + ' ' + pluralUnit(ing.unit, scaled), name };
}

function pluralUnit(unit, amount) {
  if (amount <= 1.05) return unit;
  const plurals = { 'כוס': 'כוסות', 'כף': 'כפות', 'כפית': 'כפיות', 'יחידה': 'יחידות', 'חבילה': 'חבילות' };
  return plurals[unit] || unit;
}

// פירוש קלט של כמות: "1.5", "1 1/2", "1/2", "½"
function parseAmount(str) {
  if (str == null) return null;
  str = String(str).trim()
    .replace('½', ' 1/2').replace('¼', ' 1/4').replace('¾', ' 3/4')
    .replace('⅓', ' 1/3').replace('⅔', ' 2/3').trim();
  if (str === '') return null;
  let total = 0, matched = false;
  for (const part of str.split(/\s+/)) {
    const frac = part.match(/^(\d+)\/(\d+)$/);
    if (frac) { total += Number(frac[1]) / Number(frac[2]); matched = true; continue; }
    const num = Number(part.replace(',', '.'));
    if (!Number.isNaN(num)) { total += num; matched = true; }
  }
  return matched ? total : null;
}

/* ---------- שכבת נתונים ---------- */

let store = null;
let state = {
  recipes: [],
  shop: { recipes: [], items: [] },
  search: '',
  activeTag: null,
  viewPrefs: {}, // לכל מתכון: {servings, system}
};

class LocalStore {
  constructor() {
    this.recipes = JSON.parse(localStorage.getItem('fr_recipes') || 'null');
    if (!this.recipes) {
      this.recipes = demoRecipes();
      this._saveRecipes();
    }
    this.shop = JSON.parse(localStorage.getItem('fr_shop') || '{"recipes":[],"items":[]}');
    this.recipeCb = null;
    this.shopCb = null;
  }
  _saveRecipes() { localStorage.setItem('fr_recipes', JSON.stringify(this.recipes)); }
  _saveShop() { localStorage.setItem('fr_shop', JSON.stringify(this.shop)); }
  subscribeRecipes(cb) { this.recipeCb = cb; cb(this.recipes.slice()); }
  subscribeShop(cb) { this.shopCb = cb; cb(structuredClone(this.shop)); }
  async addRecipe(r) {
    r.id = crypto.randomUUID();
    this.recipes.push(r);
    this._saveRecipes();
    this.recipeCb(this.recipes.slice());
    return r.id;
  }
  async updateRecipe(id, r) {
    const i = this.recipes.findIndex(x => x.id === id);
    if (i >= 0) this.recipes[i] = { ...r, id };
    this._saveRecipes();
    this.recipeCb(this.recipes.slice());
  }
  async deleteRecipe(id) {
    this.recipes = this.recipes.filter(x => x.id !== id);
    this._saveRecipes();
    this.recipeCb(this.recipes.slice());
  }
  async setShop(shop) {
    this.shop = shop;
    this._saveShop();
    this.shopCb(structuredClone(this.shop));
  }
}

class FirebaseStore {
  constructor(fb) {
    this.fb = fb; // {db, fns}
  }
  subscribeRecipes(cb) {
    const { db, fns } = this.fb;
    fns.onSnapshot(fns.collection(db, 'recipes'), snap => {
      cb(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
  }
  subscribeShop(cb) {
    const { db, fns } = this.fb;
    fns.onSnapshot(fns.doc(db, 'meta', 'shopping'), snap => {
      cb(snap.exists() ? snap.data() : { recipes: [], items: [] });
    });
  }
  async addRecipe(r) {
    const { db, fns } = this.fb;
    const ref = await fns.addDoc(fns.collection(db, 'recipes'), r);
    return ref.id;
  }
  async updateRecipe(id, r) {
    const { db, fns } = this.fb;
    const { id: _drop, ...data } = r;
    await fns.setDoc(fns.doc(db, 'recipes', id), data);
  }
  async deleteRecipe(id) {
    const { db, fns } = this.fb;
    await fns.deleteDoc(fns.doc(db, 'recipes', id));
  }
  async setShop(shop) {
    const { db, fns } = this.fb;
    await fns.setDoc(fns.doc(db, 'meta', 'shopping'), shop);
  }
}

/* ---------- מתכוני הדגמה ---------- */

function demoRecipes() {
  return [
    {
      id: crypto.randomUUID(),
      title: 'עוגת שוקולד פשוטה',
      source: '',
      tags: ['קינוחים', 'אפייה'],
      servings: 8,
      prepMin: 15,
      cookMin: 35,
      timeNote: 'בהכפלת הכמות לתבנית גדולה — להוסיף כ־10 דקות אפייה ולבדוק עם קיסם.',
      ingredients: [
        { amount: 1.5, unit: 'כוס', name: 'קמח' },
        { amount: 1, unit: 'כוס', name: 'סוכר' },
        { amount: 0.5, unit: 'כוס', name: 'קקאו' },
        { amount: 1, unit: 'כפית', name: 'אבקת אפייה' },
        { amount: 2, unit: 'יחידה', name: 'ביצים' },
        { amount: 0.5, unit: 'כוס', name: 'שמן' },
        { amount: 1, unit: 'כוס', name: 'מים רותחים' },
        { amount: 1, unit: 'כפית', name: 'תמצית וניל' },
      ],
      steps: [
        'מחממים תנור ל־170 מעלות ומשמנים תבנית.',
        'מערבבים בקערה את כל החומרים היבשים.',
        'מוסיפים ביצים, שמן ווניל ומערבבים היטב.',
        'מוזגים את המים הרותחים תוך ערבוב — הבלילה תהיה נוזלית, זה בסדר.',
        'אופים 35 דקות או עד שקיסם יוצא כמעט יבש.',
      ],
    },
    {
      id: crypto.randomUUID(),
      title: 'מרק עדשים כתומות',
      source: '',
      tags: ['מרקים', 'ארוחות צהריים'],
      servings: 6,
      prepMin: 10,
      cookMin: 30,
      timeNote: '',
      ingredients: [
        { amount: 2, unit: 'כוס', name: 'עדשים כתומות' },
        { amount: 1, unit: 'יחידה', name: 'בצל גדול קצוץ' },
        { amount: 2, unit: 'יחידה', name: 'גזר' },
        { amount: 2, unit: 'כף', name: 'שמן זית' },
        { amount: 1.5, unit: 'ליטר', name: 'מים' },
        { amount: 1, unit: 'כפית', name: 'כמון' },
        { amount: null, unit: 'לפי הטעם', name: 'מלח ופלפל' },
      ],
      steps: [
        'מטגנים את הבצל בשמן זית עד הזהבה.',
        'מוסיפים גזר קצוץ ומטגנים עוד 3 דקות.',
        'שוטפים את העדשים ומוסיפים לסיר יחד עם המים והתבלינים.',
        'מביאים לרתיחה ומבשלים על אש נמוכה כ־25 דקות עד שהעדשים מתרככות.',
        'טוחנים חלקית בבלנדר מוט למרקם סמיך, מתקנים תיבול.',
      ],
    },
  ];
}

/* ---------- עזרים ---------- */

const $ = sel => document.querySelector(sel);
// עטיפת מספר בסימוני כיוון (LRI/PDI) כדי ש"1½" לא יתהפך בטקסט עברי
function ltrNum(s) { return '⁦' + s + '⁩'; }
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function normName(name) {
  return (name || '').trim().replace(/\s+/g, ' ');
}

/* ---------- ניווט ---------- */

function navigate(hash) { location.hash = hash; }

function route() {
  const hash = location.hash.replace(/^#\/?/, '');
  closeCookMode();
  if (hash === 'new') return renderEditor(null);
  if (hash.startsWith('edit/')) {
    const r = state.recipes.find(x => x.id === hash.slice(5));
    return r ? renderEditor(r) : renderList();
  }
  if (hash.startsWith('r/')) {
    const r = state.recipes.find(x => x.id === hash.slice(2));
    return r ? renderRecipe(r) : renderList();
  }
  if (hash === 'shop') return renderShop();
  renderList();
}

/* ---------- רשימת מתכונים ---------- */

function allTags() {
  const set = new Set();
  state.recipes.forEach(r => (r.tags || []).forEach(t => set.add(t)));
  return [...set].sort((a, b) => a.localeCompare(b, 'he'));
}

function renderList() {
  const q = state.search.trim();
  let list = state.recipes.slice().sort((a, b) => (a.title || '').localeCompare(b.title || '', 'he'));
  if (state.activeTag) list = list.filter(r => (r.tags || []).includes(state.activeTag));
  if (q) {
    list = list.filter(r =>
      (r.title || '').includes(q) ||
      (r.tags || []).some(t => t.includes(q)) ||
      (r.ingredients || []).some(i => (i.name || '').includes(q))
    );
  }

  const chips = allTags().map(t =>
    `<button class="chip ${state.activeTag === t ? 'active' : ''}" data-tag="${esc(t)}">${esc(t)}</button>`
  ).join('');

  const cards = list.map(r => {
    const total = (r.prepMin || 0) + (r.cookMin || 0);
    return `<a class="recipe-card" href="#/r/${r.id}">
      <h3>${esc(r.title)}</h3>
      <div class="card-meta">${r.servings ? r.servings + ' מנות' : ''}${total ? ' · ' + total + ' דקות' : ''}</div>
      <div class="card-tags">${(r.tags || []).map(t => `<span>${esc(t)}</span>`).join('')}</div>
    </a>`;
  }).join('');

  $('#main').innerHTML = `
    <div class="search-row">
      <input type="search" id="search-input" placeholder="חיפוש מתכון, מצרך או תגית…" value="${esc(state.search)}">
    </div>
    <div class="tag-chips">
      <button class="chip ${state.activeTag === null ? 'active' : ''}" data-tag="">הכל</button>
      ${chips}
    </div>
    ${cards
      ? `<div class="recipe-grid">${cards}</div>`
      : `<div class="empty-note">${state.recipes.length ? 'לא נמצאו מתכונים מתאימים 🤔' : 'עדיין אין מתכונים — לחצי על "מתכון חדש" כדי להתחיל 🍳'}</div>`}
  `;

  $('#search-input').addEventListener('input', e => {
    state.search = e.target.value;
    renderList();
    const inp = $('#search-input');
    inp.focus();
    inp.setSelectionRange(inp.value.length, inp.value.length);
  });
  document.querySelectorAll('.chip').forEach(ch =>
    ch.addEventListener('click', () => {
      state.activeTag = ch.dataset.tag || null;
      renderList();
    }));
}

/* ---------- דף מתכון ---------- */

function getViewPref(r) {
  if (!state.viewPrefs[r.id]) {
    state.viewPrefs[r.id] = { servings: r.servings || 1, system: 'original' };
  }
  return state.viewPrefs[r.id];
}

function renderIngredientsHtml(r, pref) {
  const factor = (pref.servings || 1) / (r.servings || 1);
  return (r.ingredients || []).map(ing => {
    const d = ingredientDisplay(ing, factor, pref.system);
    return `<li><span class="ing-amount">${esc(d.amount)}</span><span>${esc(d.name)}</span></li>`;
  }).join('');
}

function renderRecipe(r) {
  const pref = getViewPref(r);
  const factor = pref.servings / (r.servings || 1);
  const scaledNote = Math.abs(factor - 1) > 0.01;

  $('#main').innerHTML = `
    <div class="recipe-page">
      <div class="recipe-head">
        <div>
          <h1>${esc(r.title)}</h1>
          <div class="recipe-meta">
            ${r.prepMin ? 'הכנה: ' + r.prepMin + ' דק\' · ' : ''}${r.cookMin ? 'בישול/אפייה: ' + r.cookMin + ' דק\' · ' : ''}מקור: ${r.source ? `<a href="${esc(r.source)}" target="_blank" rel="noopener">קישור</a>` : 'שלנו'}
          </div>
          <div class="card-tags">${(r.tags || []).map(t => `<span>${esc(t)}</span>`).join('')}</div>
        </div>
        <div class="recipe-actions">
          <button class="btn" id="btn-cook">👩‍🍳 מצב בישול</button>
          <button class="btn" id="btn-shop-add">🛒 לרשימת הקניות</button>
          <a class="btn" href="#/edit/${r.id}">✏️ עריכה</a>
          <button class="btn btn-danger" id="btn-delete">🗑️</button>
        </div>
      </div>

      <div class="controls-bar">
        <div class="servings-ctl">
          <button id="serv-minus">−</button>
          <span class="servings-num">${pref.servings}</span>
          <span>מנות</span>
          <button id="serv-plus">+</button>
        </div>
        <div class="unit-toggle">
          <button data-sys="original" class="${pref.system === 'original' ? 'active' : ''}">כמו במקור</button>
          <button data-sys="metric" class="${pref.system === 'metric' ? 'active' : ''}">גרם / מ"ל</button>
          <button data-sys="cups" class="${pref.system === 'cups' ? 'active' : ''}">כוסות וכפות</button>
        </div>
      </div>

      ${scaledNote && r.timeNote ? `<div class="time-note">⏱️ ${esc(r.timeNote)}</div>` : ''}

      <h2>מצרכים</h2>
      <ul class="ing-list" id="ing-list">${renderIngredientsHtml(r, pref)}</ul>

      <h2>אופן ההכנה</h2>
      <ol class="step-list">
        ${(r.steps || []).map(s => `<li>${esc(s)}</li>`).join('')}
      </ol>
    </div>
  `;

  const rerender = () => renderRecipe(r);
  $('#serv-minus').addEventListener('click', () => {
    pref.servings = Math.max(1, pref.servings - 1);
    rerender();
  });
  $('#serv-plus').addEventListener('click', () => {
    pref.servings += 1;
    rerender();
  });
  document.querySelectorAll('.unit-toggle button').forEach(b =>
    b.addEventListener('click', () => { pref.system = b.dataset.sys; rerender(); }));

  $('#btn-delete').addEventListener('click', async () => {
    if (confirm(`למחוק את "${r.title}"?`)) {
      await store.deleteRecipe(r.id);
      navigate('#/');
    }
  });
  $('#btn-shop-add').addEventListener('click', () => addToShop(r, pref));
  $('#btn-cook').addEventListener('click', () => openCookMode(r, pref));
}

/* ---------- רשימת קניות ---------- */

function addToShop(r, pref) {
  const factor = pref.servings / (r.servings || 1);
  const shop = structuredClone(state.shop);
  for (const ing of (r.ingredients || [])) {
    if (!ing.name) continue;
    if (ing.unit === 'לפי הטעם' || ing.unit === 'קורט') continue;
    let qty = ing.amount != null ? ing.amount * factor : null;
    let unit = ing.unit;
    // ננסה להמיר למידה מטרית כדי שיהיה קל לאחד כמויות
    if (qty != null) {
      const conv = convertIngredient(qty, unit, ing.name, 'metric');
      if (conv) { qty = conv.amount; unit = conv.unit; }
    }
    const key = normName(ing.name) + '|' + unit;
    const existing = shop.items.find(i => normName(i.name) + '|' + i.unit === key);
    if (existing && existing.qty != null && qty != null) {
      existing.qty += qty;
    } else if (!existing) {
      shop.items.push({ name: normName(ing.name), qty, unit, checked: false });
    }
  }
  if (!shop.recipes.includes(r.title)) shop.recipes.push(r.title);
  store.setShop(shop);
  const btn = $('#btn-shop-add');
  if (btn) { btn.textContent = '✓ נוסף לרשימה'; setTimeout(() => { if ($('#btn-shop-add')) $('#btn-shop-add').textContent = '🛒 לרשימת הקניות'; }, 1500); }
}

function renderShop() {
  const shop = state.shop;
  const items = shop.items.map((it, idx) => {
    let qtyStr = '';
    if (it.qty != null) {
      const isSpoon = ['כוס', 'כף', 'כפית'].includes(it.unit);
      const numStr = isSpoon ? fracStr(it.qty) : metricStr(it.qty);
      const unitLabel = it.unit === 'יחידה' ? '' : ' ' + pluralUnit(it.unit, it.qty);
      qtyStr = ltrNum(numStr) + unitLabel;
    }
    return `<li class="${it.checked ? 'checked' : ''}">
      <input type="checkbox" data-idx="${idx}" ${it.checked ? 'checked' : ''}>
      <span>${esc(it.name)}${qtyStr ? ' — ' + esc(qtyStr) : ''}</span>
    </li>`;
  }).join('');

  $('#main').innerHTML = `
    <div class="shop-page">
      <h1>🛒 רשימת קניות</h1>
      ${shop.recipes.length ? `<div class="shop-recipes">עבור: ${shop.recipes.map(esc).join(', ')}</div>` : ''}
      ${items
        ? `<ul class="shop-list">${items}</ul>`
        : '<div class="empty-note">הרשימה ריקה — היכנסי למתכון ולחצי "לרשימת הקניות" 🛒</div>'}
      <div class="editor-actions">
        ${shop.items.some(i => i.checked) ? '<button class="btn" id="shop-clear-checked">הסרת מה שנקנה</button>' : ''}
        ${items ? '<button class="btn btn-danger" id="shop-clear">ניקוי כל הרשימה</button>' : ''}
        <a class="btn" href="#/">חזרה למתכונים</a>
      </div>
    </div>
  `;

  document.querySelectorAll('.shop-list input[type="checkbox"]').forEach(cb =>
    cb.addEventListener('change', () => {
      const shop2 = structuredClone(state.shop);
      shop2.items[Number(cb.dataset.idx)].checked = cb.checked;
      store.setShop(shop2);
    }));
  const clearBtn = $('#shop-clear');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (confirm('לנקות את כל רשימת הקניות?')) store.setShop({ recipes: [], items: [] });
  });
  const clearChecked = $('#shop-clear-checked');
  if (clearChecked) clearChecked.addEventListener('click', () => {
    const shop2 = structuredClone(state.shop);
    shop2.items = shop2.items.filter(i => !i.checked);
    if (!shop2.items.length) shop2.recipes = [];
    store.setShop(shop2);
  });
}

function updateShopBadge() {
  const badge = $('#shop-count');
  const n = state.shop.items.filter(i => !i.checked).length;
  if (n > 0) { badge.textContent = n; badge.classList.remove('hidden'); }
  else badge.classList.add('hidden');
}

/* ---------- עורך מתכון ---------- */

function ingredientRowHtml(ing = { amount: null, unit: 'יחידה', name: '' }) {
  const opts = ALL_UNITS.map(u => `<option ${u === ing.unit ? 'selected' : ''}>${u}</option>`).join('');
  const amtStr = ing.amount == null ? '' : String(ing.amount);
  return `<div class="ing-row">
    <input class="ing-amt" placeholder="כמות" value="${esc(amtStr)}">
    <select class="ing-unit">${opts}</select>
    <input class="ing-name" placeholder="שם המצרך (למשל: קמח)" value="${esc(ing.name || '')}">
    <button type="button" class="ing-del" title="הסרה">✕</button>
  </div>`;
}

function renderEditor(existing) {
  const r = existing || {
    title: '', source: '', tags: [], servings: 4,
    prepMin: null, cookMin: null, timeNote: '',
    ingredients: [{}, {}, {}].map(() => ({ amount: null, unit: 'יחידה', name: '' })),
    steps: [],
  };

  $('#main').innerHTML = `
    <div class="editor">
      <h1>${existing ? 'עריכת מתכון' : 'מתכון חדש'}</h1>

      <div class="field">
        <label>שם המתכון</label>
        <input id="ed-title" value="${esc(r.title)}" placeholder="למשל: עוגת גבינה של סבתא">
      </div>

      <div class="field-row">
        <div class="field">
          <label>מספר מנות במתכון</label>
          <input id="ed-servings" type="number" min="1" value="${esc(r.servings || 4)}">
        </div>
        <div class="field">
          <label>זמן הכנה (דקות)</label>
          <input id="ed-prep" type="number" min="0" value="${r.prepMin ?? ''}">
        </div>
        <div class="field">
          <label>זמן בישול/אפייה (דקות)</label>
          <input id="ed-cook" type="number" min="0" value="${r.cookMin ?? ''}">
        </div>
      </div>

      <div class="field">
        <label>הערת זמנים לשינוי כמות (לא חובה)</label>
        <input id="ed-timenote" value="${esc(r.timeNote || '')}" placeholder='למשל: "בהכפלת הכמות להוסיף 10 דקות אפייה"'>
        <div class="hint">ההערה תוצג כשמשנים את מספר המנות, כי זמני אפייה לא גדלים ביחס ישר לכמות.</div>
      </div>

      <div class="field">
        <label>תגיות (מופרדות בפסיק)</label>
        <input id="ed-tags" value="${esc((r.tags || []).join(', '))}" placeholder="מרקים, ארוחות צהריים, דברים ששקד אוהבת">
      </div>

      <div class="field">
        <label>מצרכים</label>
        <div class="ing-rows" id="ing-rows">
          ${(r.ingredients || []).map(ingredientRowHtml).join('')}
        </div>
        <button type="button" class="btn btn-small" id="add-ing" style="margin-top:8px">+ מצרך נוסף</button>
        <div class="hint">בכמות אפשר גם שברים: 1/2 או 1 1/2</div>
      </div>

      <div class="field">
        <label>שלבי ההכנה — כל שלב בשורה נפרדת</label>
        <textarea id="ed-steps" placeholder="מחממים תנור ל־180 מעלות&#10;מערבבים את החומרים היבשים&#10;...">${esc((r.steps || []).join('\n'))}</textarea>
      </div>

      <div class="field">
        <label>קישור למקור (לא חובה)</label>
        <input id="ed-source" dir="ltr" value="${esc(r.source || '')}" placeholder="https://...">
      </div>

      <div class="editor-actions">
        <button class="btn btn-primary" id="ed-save">💾 שמירה</button>
        <a class="btn" href="${existing ? '#/r/' + existing.id : '#/'}">ביטול</a>
      </div>
    </div>
  `;

  const rows = $('#ing-rows');
  rows.addEventListener('click', e => {
    if (e.target.classList.contains('ing-del')) {
      e.target.closest('.ing-row').remove();
    }
  });
  $('#add-ing').addEventListener('click', () => {
    rows.insertAdjacentHTML('beforeend', ingredientRowHtml());
    rows.lastElementChild.querySelector('.ing-amt').focus();
  });

  $('#ed-save').addEventListener('click', async () => {
    const title = $('#ed-title').value.trim();
    if (!title) { alert('חסר שם למתכון'); $('#ed-title').focus(); return; }
    const ingredients = [...rows.querySelectorAll('.ing-row')].map(row => ({
      amount: parseAmount(row.querySelector('.ing-amt').value),
      unit: row.querySelector('.ing-unit').value,
      name: row.querySelector('.ing-name').value.trim(),
    })).filter(i => i.name);

    const data = {
      title,
      source: $('#ed-source').value.trim(),
      tags: $('#ed-tags').value.split(',').map(t => t.trim()).filter(Boolean),
      servings: Math.max(1, Number($('#ed-servings').value) || 1),
      prepMin: $('#ed-prep').value === '' ? null : Number($('#ed-prep').value),
      cookMin: $('#ed-cook').value === '' ? null : Number($('#ed-cook').value),
      timeNote: $('#ed-timenote').value.trim(),
      ingredients,
      steps: $('#ed-steps').value.split('\n').map(s => s.trim()).filter(Boolean),
    };

    if (existing) {
      await store.updateRecipe(existing.id, data);
      delete state.viewPrefs[existing.id];
      navigate('#/r/' + existing.id);
    } else {
      const id = await store.addRecipe(data);
      navigate('#/r/' + id);
    }
  });
}

/* ---------- מצב בישול ---------- */

let wakeLock = null;

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch { /* לא נורא — לא בכל דפדפן זה נתמך */ }
}

function openCookMode(r, pref) {
  const el = document.createElement('div');
  el.id = 'cook-mode';
  el.innerHTML = `
    <div class="cook-inner">
      <div class="cook-head">
        <h1>${esc(r.title)}</h1>
        <button class="btn" id="cook-close">✕ סגירה</button>
      </div>
      <p class="recipe-meta">${pref.servings} מנות</p>
      <h2>מצרכים</h2>
      <ul class="ing-list">${renderIngredientsHtml(r, pref)}</ul>
      ${(pref.servings !== (r.servings || 1)) && r.timeNote ? `<div class="time-note">⏱️ ${esc(r.timeNote)}</div>` : ''}
      <h2>שלבים — לחצי על שלב שסיימת</h2>
      <ol class="cook-steps">
        ${(r.steps || []).map((s, i) => `<li data-i="${i}"><span class="step-num">${i + 1}</span><span class="step-text">${esc(s)}</span></li>`).join('')}
      </ol>
      <p class="wake-note">💡 המסך יישאר דלוק כל עוד מצב הבישול פתוח</p>
    </div>
  `;
  document.body.appendChild(el);
  requestWakeLock();
  document.addEventListener('visibilitychange', reWake);

  el.querySelector('#cook-close').addEventListener('click', closeCookMode);
  el.querySelectorAll('.cook-steps li').forEach(li =>
    li.addEventListener('click', () => li.classList.toggle('done')));
}

function reWake() {
  if (document.visibilityState === 'visible' && $('#cook-mode')) requestWakeLock();
}

function closeCookMode() {
  const el = $('#cook-mode');
  if (el) el.remove();
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
  document.removeEventListener('visibilitychange', reWake);
}

/* ---------- אתחול ---------- */

async function initFirebase() {
  const config = window.FIREBASE_CONFIG;
  const [appMod, authMod, fsMod] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'),
  ]);
  const app = appMod.initializeApp(config);
  const auth = authMod.getAuth(app);
  const db = fsMod.getFirestore(app);
  return { auth, authMod, db, fns: fsMod };
}

function startApp() {
  $('#login-screen').classList.add('hidden');
  $('#app').classList.remove('hidden');
  store.subscribeRecipes(recipes => {
    state.recipes = recipes;
    route();
  });
  store.subscribeShop(shop => {
    state.shop = shop || { recipes: [], items: [] };
    updateShopBadge();
    if (location.hash.replace(/^#\/?/, '') === 'shop') renderShop();
  });
  window.addEventListener('hashchange', route);
}

async function main() {
  if (!window.FIREBASE_CONFIG) {
    // מצב הדגמה — בלי התחברות, שמירה מקומית
    store = new LocalStore();
    $('#demo-banner').classList.remove('hidden');
    startApp();
    return;
  }

  const fb = await initFirebase();
  store = new FirebaseStore(fb);

  fb.authMod.onAuthStateChanged(fb.auth, user => {
    if (user) {
      startApp();
    } else {
      $('#app').classList.add('hidden');
      $('#login-screen').classList.remove('hidden');
    }
  });

  $('#login-form').addEventListener('submit', async e => {
    e.preventDefault();
    $('#login-error').classList.add('hidden');
    try {
      await fb.authMod.signInWithEmailAndPassword(
        fb.auth, window.SHARED_EMAIL, $('#login-password').value);
    } catch (err) {
      console.error('Login failed:', err);
      const el = $('#login-error');
      el.textContent = 'הסיסמה לא נכונה, נסי שוב (' + (err.code || err.message || err) + ')';
      el.classList.remove('hidden');
    }
  });
}

main();
