import {recipes} from "./database/recipes.js";
import {nmgram} from "./database/nmgram.js";

// Find the keyword in the recipe database

// To include in benchmark (also include the database and nmgram)
// Search using the nmgram
function getIdsFromIndex(keyword, index) {
    return index[keyword.toLocaleLowerCase()];
}

function getIdsIntersection(wordArray,index) {
    let IdsIntersection = [...Array(51).keys()].slice(1);
    for (let word of wordArray) {
        const IdsSubArray = getIdsFromIndex(word,index);
        if (!IdsSubArray) return [];
        IdsIntersection = IdsIntersection.filter(id => IdsSubArray.includes(id));
    }
    return IdsIntersection;
}

function searchRecipeFromIndex(wordArray,index,recipes) {
    const IdsArray = getIdsIntersection(wordArray,index);
    return recipes.filter(recipe => IdsArray.includes(recipe.id));
}

// To include in benchmark (also include the database)
// Full text search
function searchRecipeNames(keyword, recipes) {
    return recipes.filter(recipe => recipe.name.toLocaleLowerCase().includes(keyword));
}

function searchAppliance(keyword, recipes) {
    return recipes.filter(recipe => recipe.appliance.toLocaleLowerCase().includes(keyword));
}

function searchDescription(keyword, recipes) {
    return recipes.filter(recipe => recipe.description.toLocaleLowerCase().includes(keyword));
}

function searchUstensils(keyword, recipes) {
    return recipes.filter(recipe => {
        return recipe.ustensils
            .map(ustensil => ustensil.toLocaleLowerCase())
            .some(ustensil => ustensil.includes(keyword));
    });
}

function searchIngredients(keyword, recipes) {
    return recipes.filter(recipe => {
        return getIngredientArray(recipe)
            .some(ingredient => ingredient.includes(keyword));
    });
}

function searchAll(keyword, recipes) {
    keyword = keyword.toLocaleLowerCase();
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

//To run in the benchmark
//Full text
/*
searchAll('chocolat',recipes);
searchAll('banane',recipes);
searchAll('sau',recipes);
searchAll('jfghj',recipes);
*/

//Using nmgram nmgram
/*
searchRecipeFromIndex(['chocolat'],nmgram,recipes);
searchRecipeFromIndex(['banane'],nmgram,recipes);
searchRecipeFromIndex(['sau'],nmgram,recipes);
searchRecipeFromIndex(['jfghj'],nmgram,recipes);
*/

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

//Clone the recipe card template and modify content to fit the recipe
//passed as an argument and append it in the container
function includeRecipeTemplate(recipe, container,recipeTemplate) {

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

function displayTemplateRecipeSet(recipeSet,container,template) {
    recipeSet.forEach(recipe => includeRecipeTemplate(recipe,container,template));
}

function updateDisplayedRecipes(recipeSet,
                                container = document.querySelector('#recipes-container'),
                                template = document.querySelector('#js-recipe-card')) {
    clearContainer(container);
    displayTemplateRecipeSet(recipeSet,container,template);
}

function displaySearchMessage(message, container = document.querySelector('#recipes-container')) {
    const messageElt = document.createElement('div');
    messageElt.classList.add('search-hint');
    messageElt.textContent = message;
    clearContainer(container);
    container.appendChild(messageElt);
}

// The promise is just a way of waiting while blocking execution

let inputTimer;

async function readInputIndex(e) {
    window.clearTimeout(inputTimer);
    await new Promise((resolve) => {
        resolve(inputTimer = setTimeout(inputResponse,500,e));
    });
}

async function inputResponse(e) {
    const characterLength = e.target.value.length;
    if (characterLength >= 3 && characterLength <= 13) {
        const wordsArray = e.target.value.split(' ');
        const resultsSet = await searchRecipeFromIndex(wordsArray,nmgram,recipes);
        await new Promise(r => setTimeout(r,500));
        updateDisplayedRecipes(resultsSet);
    }else if (characterLength >= 14) {
        const resultSet = await searchAll(e.target.value, recipes)
        await new Promise(r => setTimeout(r,500));
        updateDisplayedRecipes(resultSet);
    }else if (characterLength < 3 && characterLength >= 1) {
        await new Promise(r => setTimeout(r,500));
        displaySearchMessage('Veuillez entrer au moins trois caractères')
    }else if (characterLength === 0) {
        await new Promise(r => setTimeout(r,500));
        updateDisplayedRecipes(recipes);
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
    let lastRow;
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
    inventoryItemElt.addEventListener('click', clickInventoryItem);
    row.appendChild(inventoryItemElt);
}

function addInventoryRow(inventoryElt) {
    const listRow = document.createElement('ul');
    listRow.classList.add('list-group','list-group-horizontal');
    inventoryElt.appendChild(listRow);
    return listRow;
}

function addAlertTag(item,theme,inventoryType,alertContainer,
                     alertTemplate = document.querySelector('#js-tag')) {
    const templateClone = alertTemplate.content.cloneNode(true);
    const alertElt = templateClone.querySelector('div.alert');
    alertElt.classList.add(`alert-${theme}`);
    const keywordElt = templateClone.querySelector('span.tag-text');
    keywordElt.textContent = item;
    alertContainer.appendChild(templateClone);
}

function clickInventoryItem(e) {
    const item = e.target.textContent;
    const parentBtn = e.target.parentElement.parentElement.parentElement.previousSibling.previousSibling;
    const theme = parentBtn.dataset.theme;
    const inventoryType = parentBtn.dataset.inventory;
    const alertContainer = document.querySelector('.js-tag-container');
    //console.log(item);
    //console.log(theme);
    //console.log(inventoryType);
    addAlertTag(item,theme,inventoryType,alertContainer);
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
    const recipeTemplate = document.querySelector('#js-recipe-card')
    clearContainer(recipeContainer);
    displayTemplateRecipeSet(recipes,recipeContainer,recipeTemplate);
    mainSearch.addEventListener('input',readInputIndex);

    //console.log(getIdsFromIndex('sucre',nmgram));
    //console.log(searchRecipeFromIndex(['poulet','cho','suc'],nmgram,recipes));

    //Event listeners for the advanced filters
    dropDownToggle.forEach(btn => {
        btn.addEventListener('click',clickDropdown);
    });
    dropDownToggle.forEach(btn => {
        const dropDownMenu = btn.nextSibling.nextSibling;
        dropDownMenu.querySelector('input').addEventListener('input', typeInventorySearch);
    });
});