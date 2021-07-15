import {recipes} from "./database/recipes.js";

// Find the keyword in the recipe database

//To include in benchmark (also include the database)
function searchDescription(keyword, recipes) {
    return recipes.filter(recipe => recipe.description.toLocaleLowerCase().includes(keyword));
}

function searchRecipeNames(keyword, recipes) {
    return recipes.filter(recipe => recipe.name.toLocaleLowerCase().includes(keyword));
}

function searchAppliance(keyword, recipes) {
    return recipes.filter(recipe => recipe.appliance.toLocaleLowerCase().includes(keyword));
}

function searchUstensils(keyword, recipes) {
    return recipes.filter(recipe => {
        return recipe.ustensils
            .map(ustensil => ustensil.toLocaleLowerCase())
            .some(ustensil => ustensil.includes(keyword))
    });
}

function searchIngredients(keyword, recipes) {
    return recipes.filter(recipe => {
        return getIngredientArray(recipe)
            .some(ingredient => ingredient.includes(keyword));
    });
}

function searchAll(keyword, recipes) {
    return new Set([
        searchRecipeNames(keyword,recipes),
        searchUstensils(keyword,recipes),
        searchAppliance(keyword,recipes),
        searchIngredients(keyword,recipes),
        searchDescription(keyword, recipes)
    ].flat(1));
}

function getIngredientArray(recipe) {
    return recipe.ingredients.map(item => item.ingredient.toLocaleLowerCase());
}

//End of code to benchmark

function ingredientsInventory(recipes) {
    return new Set (recipes.map(recipe => getIngredientArray(recipe)).flat(1));
}

function applianceInventory(recipes) {
    return new Set (recipes.map(recipe => recipe.appliance.toLocaleLowerCase()));
}

function ustensilsInventory(recipes) {
    return new Set (recipes.map(recipe => recipe.ustensils
        .map(u => u.toLocaleLowerCase()))
        .flat(1));
}

function clearContainer(container) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

function includeRecipeTemplate(recipe, container) {
    const recipeTemplate = document.querySelector('#js-recipe-card');
    const templateClone = recipeTemplate.content.cloneNode(true);
    const recipeTitle = templateClone.querySelector('.js-recipe-title');
    recipeTitle.textContent = recipe.name;
    const recipeDuration = templateClone.querySelector('.js-recipe-duration');
    recipeDuration.textContent = ` ${recipe.time} min`;

    const recipeIngredientList = templateClone.querySelector('.js-recipe-ingredient-list');
    clearContainer(recipeIngredientList);
    for (let ingredient of recipe.ingredients) {
        const item = document.createElement('li');
        item.classList.add('text-truncate');
        const ingredientNameElt = document.createElement('strong')
        ingredientNameElt.textContent = ingredient.ingredient;
        item.appendChild(ingredientNameElt);
        if ('quantity' in ingredient) {
            item.append(': ')
            item.append(ingredient.quantity);
            if ('unit' in ingredient) {
                item.append(` ${ingredient.unit}`);
            }
        }
        recipeIngredientList.appendChild(item);
    }

    const recipeDescription = templateClone.querySelector('.js-recipe-description');
    recipeDescription.textContent = recipe.description;

    container.appendChild(templateClone);
}

function displayTemplateRecipeSet(recipeSet,container) {
    recipeSet.forEach(recipe => includeRecipeTemplate(recipe,container));
}

let inputTimer;

function updateDisplayedRecipes(recipeSet, container = document.querySelector('#recipes-container')) {
    clearContainer(container);
    displayTemplateRecipeSet(recipeSet,container);
}

function readInput(e) {
    window.clearTimeout(inputTimer);
    if (e.target.value.length >= 3) {
        const resultsSet = searchAll(e.target.value.toLowerCase(),recipes);
        inputTimer = window.setTimeout(updateDisplayedRecipes,500,resultsSet);
    }else{
        inputTimer = window.setTimeout(updateDisplayedRecipes,500,recipes);
    }
}

function clickDropdown(e) {
    const dropDownMenu = e.target.nextSibling.nextSibling;
    const inventoryElt = dropDownMenu.querySelector('.inventory');
    const theme = e.target.dataset.theme;
    const inventoryType = e.target.dataset.inventory;
    const dropDownInput = dropDownMenu.querySelector('input');
    dropDownInput.value = '';
    const inventorySet = inventorySpecified(inventoryType)(recipes);
    updateInventoryDisplay(inventoryElt,inventorySet,theme);
}

function updateInventoryDisplay(inventoryElt,inventoryFiltered,theme) {
    clearContainer(inventoryElt);
    appendFilteredInventory(inventoryFiltered,theme,inventoryElt);
}

function appendFilteredInventory(inventorySet,theme, inventoryElt) {
    let lastRow = addInventoryRow(inventoryElt);
    let index = 0;
    inventorySet.forEach(item => {
        if (index % 3 === 0) lastRow = addInventoryRow(inventoryElt);
        addInventoryItem(item,lastRow,theme);
        index++;
    });
}

function addInventoryItem(inventoryItem,row,theme) {
    const inventoryItemElt = document.createElement('ul');
    inventoryItemElt.classList.add('list-group-item','dropdown-item',`bg-${theme}`, 'text-truncate', 'text-capitalize');
    inventoryItemElt.textContent = inventoryItem;
    row.appendChild(inventoryItemElt);
}

function addInventoryRow(inventoryElt) {
    const listRow = document.createElement('ul');
    listRow.classList.add('list-group','list-group-horizontal');
    inventoryElt.appendChild(listRow);
    return listRow;
}

function typeInventorySearch(e) {
    const keyword = e.target.value;
    const inventoryElt = e.target.nextSibling.nextSibling;
    const parentBtn = e.target.parentElement.previousSibling.previousSibling;
    const theme = parentBtn.dataset.theme;
    const inventoryType = parentBtn.dataset.inventory;
    const filteredInventory = [...inventorySpecified(inventoryType)(recipes)]
        .filter(item => item.includes(keyword.toLocaleLowerCase()));
    updateInventoryDisplay(inventoryElt,filteredInventory,theme);
}

function inventorySpecified(inventoryType) {
    switch (inventoryType) {
        case 'ingredient' :
            return ingredientsInventory;
        case 'appliance' :
            return applianceInventory;
        case 'ustensil' :
            return ustensilsInventory;
    }
}

window.addEventListener('load',() => {
    const recipeContainer = document.querySelector('#recipes-container');
    const mainSearch = document.querySelector('#main-search');
    const dropDownToggle = document.querySelectorAll('.dropdown-toggle');
    clearContainer(recipeContainer);
    displayTemplateRecipeSet(recipes,recipeContainer);
    dropDownToggle.forEach(btn => {
        btn.addEventListener('click',clickDropdown);
    });
    dropDownToggle.forEach(btn => {
        const dropDownMenu = btn.nextSibling.nextSibling;
        dropDownMenu.querySelector('input').addEventListener('input', typeInventorySearch);
    });
    mainSearch.addEventListener('input',readInput);
    /*ingredientsBtn.addEventListener('click', clickDropdown);
    ingredientInput.addEventListener('input', typeInventorySearch);
    applianceBtn.addEventListener('click', clickDropdown);
    applianceInput.addEventListener('input', typeInventorySearch);*/
});