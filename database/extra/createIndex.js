const fs = require('fs');
const db = require('./recipes');

const object = db.recipes;

const gramMap = new Map();
const gramObject = {};

function processWord(word) {
    res = word.toLocaleLowerCase();
    //Removes the diacritic signs (accents)
    res = res.normalize('NFD').replace(/\p{Diacritic}/gu, '');
    //Removes beginning and ending punctuation
    if (res.endsWith(',')) res = res.slice(0, -1);
    if (res.endsWith('...')) res = res.slice(0, -1);
    if (res.endsWith('..')) res = res.slice(0, -1);
    if (res.endsWith('.')) res = res.slice(0, -1);
    if (res.startsWith('(')) res = res.slice(1);
    if (res.endsWith(')')) res = res.slice(0, -1);
    //Removes the apostrophe and only keeps the part that has at least 3 letters
    if (res.includes("'")) {
        res.split("'").forEach(word => {
            if (word.length >= 3) res = word;
        });
    }
    return res;
}

for (let item of object) {
    let words = [];
    let names = item.name.split(' ');
    names = names.map(word => processWord(word));
    words.push(names);

    let appliance = item.appliance.split(' ');
    appliance = appliance.map(word => processWord(word));
    words.push(appliance);

    let ustensils = item.ustensils.map(u => (u.split(' '))).flat(1);
    ustensils = ustensils.map(word => processWord(word));
    words.push(ustensils)

    let ingredients = item.ingredients.flatMap(item => item.ingredient.split(' '));
    ingredients = ingredients.map(word => processWord(word));
    words.push(ingredients);

    let description = item.description.split(' ');
    description = description.map(word => processWord(word));
    words.push(description);

    words = words.flat(1);

    for (let n = 3; n <= 13; n++) {
        for (let word of words) {
            if (word.length >= n) {
                for (let characterIndex = 0; characterIndex < word.length - n + 1; characterIndex++) {
                    let ngram = word.slice(characterIndex, characterIndex + n);
                    //console.log(ngram);
                    if (gramMap.has(ngram)) {
                        gramMap.get(ngram).add(item.id);
                    } else {
                        gramMap.set(ngram, new Set([item.id]));
                    }
                    //console.log('checking...');
                    if (ngram in gramObject) {
                        //console.log('Checking in existing array');
                        //console.log('Starting array : ', gramObject[ngram]);
                        if (!gramObject[ngram].includes(item.id)) {
                            //console.log('Adding...');
                            gramObject[ngram].push(item.id);
                        }
                    } else {
                        //console.log('Creating');
                        gramObject[ngram] = [item.id];
                    }
                }
            }
        }
    }
}

console.log('Index généré');

const stringData = JSON.stringify(gramObject,null,4);

fs.writeFile('index.js', stringData, (err) => {
    if (err) throw err;
    console.log('Fichier écrit !');
});

//console.log(gramMap);
//console.log(gramMap.size);
