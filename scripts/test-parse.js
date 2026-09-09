// בדיקה מקומית: node scripts/test-parse.js < recipe.txt  (שורה ראשונה = כותרת)
const { parseRecipe } = require('./parse-recipe');
const txt = require('fs').readFileSync(0, 'utf8');
const [first, ...rest] = txt.split(/\r?\n/);
console.log(JSON.stringify(parseRecipe(first, rest.join('\n')), null, 2));
