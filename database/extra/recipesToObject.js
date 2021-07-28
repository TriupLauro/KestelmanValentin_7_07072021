const fs = require('fs');
const db = require('./recipes');

const recipesArray = db.recipes;
const recipesObject = {};

for (let recipe of recipesArray) {
    recipesObject[recipe.id] = recipe;
}

console.dir('Objet de recettes créé');
const stringifiedObject = JSON.stringify(recipesObject);

fs.writeFile('recipesObject.js', stringifiedObject, (err) => {
    if (err) throw err;
    console.log('Fichier écrit !');
});

