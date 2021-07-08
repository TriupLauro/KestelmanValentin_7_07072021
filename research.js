import {recipes} from "./database/recipes.js";

// Find the keyword in the recipe database


//const recipeAppliances = recipes.map(recipe => `${recipe.id} : ${recipe.appliance}`);
//const recipeUstensils = recipes.map(recipe => `${recipe.id} : ${recipe.ustensils}`);
//const ingredientsArray = recipes.map(recipe => recipe.ingredients.map(ingredient => `${recipe.id} : ${ingredient.ingredient}`));

//console.log(recipeNames);
//console.log(recipeAppliances);
//console.log(recipeUstensils);
//console.log(ingredientsArray);

function getRecipeNames(recipes) {
    const recipeNames = [];
    for(let recipe of recipes) {
        const currentObject = {
            id:recipe.id,
            name:recipe.name.toLowerCase()
        }
        recipeNames.push(currentObject);
    }
    return recipeNames;
}

function searchRecipeNames(keyword, recipeNames) {
    return recipeNames.filter(recipeNameObject => recipeNameObject.name.includes(keyword))
}

const recipeNames = getRecipeNames(recipes);
console.log(searchRecipeNames('tarte', recipeNames));