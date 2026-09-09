// מוסיף מתכון ל-Firestore — מופעל דרך GitHub Actions (add-recipe.yml),
// ידנית או מפתיחת issue שכותרתו מתחילה ב-"מתכון:". כך קלוד יכול להוסיף מתכונים מהצ'אט.
const admin = require('firebase-admin');
const { parseRecipe } = require('./parse-recipe');

const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!sa) { console.error('חסר הסוד FIREBASE_SERVICE_ACCOUNT'); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa)) });
const db = admin.firestore();

async function main() {
  const recipe = parseRecipe(process.env.RECIPE_TITLE, process.env.RECIPE_BODY);
  const dup = (await db.collection('recipes').where('title', '==', recipe.title).limit(1).get());
  if (!dup.empty) { console.error(`כבר קיים מתכון בשם "${recipe.title}" (מזהה ${dup.docs[0].id}) — לא נוסף שוב`); process.exit(1); }
  const ref = await db.collection('recipes').add(recipe);
  console.log(`✔ נוסף מתכון: "${recipe.title}" | ${recipe.ingredients.length} מצרכים, ${recipe.steps.length} שלבים | מזהה: ${ref.id}`);
  console.log('https://pazitp.github.io/family-recipes/#/r/' + ref.id);
}

main().catch(e => { console.error(e.message || e); process.exit(1); });
