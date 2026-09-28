// מייצא את כל המתכונים מ-Firestore לקובץ data/recipes.json במאגר,
// כדי שקלוד יוכל לקרוא מתכונים קיימים (למשל לפני עדכון או מיזוג).
// מופעל דרך GitHub Actions (export-recipes.yml).
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!sa) { console.error('חסר הסוד FIREBASE_SERVICE_ACCOUNT'); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa)) });
const db = admin.firestore();

// ממיר ערכים מיוחדים של Firestore (תאריכים, הפניות) לטקסט רגיל
function plain(v) {
  if (v === null || v === undefined) return v;
  if (v instanceof admin.firestore.Timestamp) return v.toDate().toISOString();
  if (v instanceof admin.firestore.DocumentReference) return v.path;
  if (Array.isArray(v)) return v.map(plain);
  if (typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = plain(v[k]);
    return out;
  }
  return v;
}

async function main() {
  const snap = await db.collection('recipes').get();
  const recipes = snap.docs
    .map(d => ({ id: d.id, ...plain(d.data()) }))
    .sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'he'));
  const outDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'recipes.json'), JSON.stringify(recipes, null, 2) + '\n');
  console.log(`✔ יוצאו ${recipes.length} מתכונים`);
}

main().catch(e => { console.error(e.message || e); process.exit(1); });
