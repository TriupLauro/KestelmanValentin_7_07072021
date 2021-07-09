import {recipes} from "./database/recipes.js";

// Find the keyword in the recipe database

function searchRecipeNames(keyword, recipes) {
    return recipes.filter(recipe => recipe.name.toLowerCase().includes(keyword));
}

function searchAppliance(keyword, recipes) {
    return recipes.filter(recipe => recipe.appliance.toLowerCase().includes(keyword));
}

function searchUstensils(keyword, recipes) {
    return recipes.filter(recipe => {
        const ustensilsArray = recipe.ustensils;
        for (let ustensil of ustensilsArray) {
            if (ustensil.toLowerCase().includes(keyword)) {
                return true;
            }
        }
        return false;
    });
}

function getIngredientArray(recipe) {
    return recipe.ingredients.map(item => item.ingredient.toLowerCase());
}

function searchIngredients(keyword, recipes) {
    return recipes.filter(recipe => {
        const ingredientsArray = getIngredientArray(recipe);
        for (let ingredient of ingredientsArray) {
            if (ingredient.includes(keyword)) {
                return true;
            }
        }
        return false;
    });
}

console.log(searchRecipeNames('chocolat',recipes));
console.log(searchAppliance('cas',recipes));
console.log(searchUstensils('cui',recipes));
console.log(searchIngredients('farine',recipes));
