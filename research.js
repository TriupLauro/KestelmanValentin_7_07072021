import {recipes} from "./database/recipes.js";

// Do not reassign or modify the keywords array directly
// Instead use the addKeyword, removeKeyword and removeMainKeyword functions
// Then call the searchKeywords function to get the filtered recipes array
let keywords = [{keyword : '', type : 'main'}];

function addKeyword(keyword, type) {
    keywords.push({
        keyword,
        type
    })
}

function removeKeyword(keyword, type) {
    const targetIndex = keywords.findIndex(obj => obj.keyword === keyword && obj.type === type);
    if (targetIndex === -1) {
        console.warn('Keyword not found');
        return false;
    }
    keywords.splice(targetIndex, 1);
    //console.log('Keyword removed');
}

function removeMainKeyword() {
    const targetIndex = keywords.findIndex(obj => obj.type === 'main');

    if (targetIndex === -1) {
        console.warn('Main keyword not found');
        return false;
    }
    keywords.splice(targetIndex, 1);
    //console.log('Main keyword removed');
}

function searchKeywords(recipes) {
    if (keywords.length === 0) {
        console.warn('No keywords registered');
    }

    // Research keywords from the main search bar
    const mainKeyword = keywords.find(keywordObj => keywordObj.type === 'main');
    const stringLength = mainKeyword.keyword.length;
    const wordArray = mainKeyword.keyword.split(' ');
    if (localStorage.getItem(mainKeyword.keyword)) {
        recipes = JSON.parse(localStorage.getItem(mainKeyword.keyword));
    }else {
        if (stringLength >= 3) {
            recipes = searchAllFromArray(wordArray, recipes);
        }
        const stringifiedResult = JSON.stringify(recipes);
        localStorage.setItem(mainKeyword.keyword,stringifiedResult);
    }

    for (let wordObj of keywords) {
        //Research filter keywords
        if (wordObj.type === 'ingredient') {
            recipes = searchIngredients(wordObj.keyword,recipes);
        }
        if (wordObj.type === 'appliance') {
            recipes = searchAppliance(wordObj.keyword,recipes);
        }
        if (wordObj.type === 'ustensil') {
            recipes = searchUstensils(wordObj.keyword,recipes);
        }
    }
    return recipes;
}

// Find the keyword in the recipe database
// Naive algorithm
function searchRecipeNames(keyword, recipes) {
    return recipes.filter(recipe => recipe.name.toLocaleLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').includes(keyword));
}

function searchAppliance(keyword, recipes) {
    return recipes.filter(recipe => recipe.appliance.toLocaleLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').includes(keyword));
}

function searchDescription(keyword, recipes) {
    return recipes.filter(recipe => recipe.description.toLocaleLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').includes(keyword));
}

function searchUstensils(keyword, recipes) {
    return recipes.filter(recipe => {
        return recipe.ustensils
            .map(ustensil => ustensil.toLocaleLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''))
            .some(ustensil => ustensil.includes(keyword));
    });
}

function searchIngredients(keyword, recipes) {
    return recipes.filter(recipe => {
        return getIngredientArray(recipe, true)
            .some(ingredient => ingredient.includes(keyword));
    });
}

function searchAll(keyword, recipes) {
    keyword = keyword.toLocaleLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    return [
        searchRecipeNames(keyword,recipes),
        searchUstensils(keyword,recipes),
        searchAppliance(keyword,recipes),
        searchIngredients(keyword,recipes),
        searchDescription(keyword, recipes)
    ].flat(1);
}

function searchAllFromArray(keywords, recipes) {
    for (let word of keywords) {
        recipes = searchAll(word,recipes);
    }
    return [...new Set (recipes)];
}

function getIngredientArray(recipe, normalizeAccents) {
    if (normalizeAccents) {
        return recipe.ingredients.map(item => item.ingredient.toLocaleLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''));
    }else{
        return recipe.ingredients.map(item => item.ingredient);
    }
}

function ingredientsInventory(recipes, normalizeAccents) {
    return new Set (recipes.map(recipe => getIngredientArray(recipe, normalizeAccents)).flat(1));
}

function applianceInventory(recipes, normalizeAccents) {
    if (normalizeAccents) {
        return new Set (recipes.map(recipe => recipe.appliance.toLocaleLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')));
    }else{
        return new Set (recipes.map(recipe => recipe.appliance));
    }
}

function ustensilsInventory(recipes, normalizeAccents) {
    if (normalizeAccents) {
        return new Set (recipes.map(recipe => recipe.ustensils
            .map(u => u.toLocaleLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')))
            .flat(1));
    }else{
        return new Set (recipes.map(recipe => recipe.ustensils
            .map(u => u))
            .flat(1));
    }

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
            ingredientNameElt.append(': ')
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


function readInputIndex(e) {
    inputResponse(e);
}

function inputResponse(e) {
    const characterLength = e.target.value.length;
    removeMainKeyword();
    const keyword = e.target.value;
    addKeyword(keyword,'main');
    if (characterLength >= 3) {
        const resultsSet = searchKeywords(recipes);
        if (resultsSet.length === 0) {
            displaySearchMessage('Aucune recette trouvée, essayez de chercher <<brownie>>, <<salade de riz>>...');
        }else{
            updateDisplayedRecipes(resultsSet);
        }
    }else if (characterLength < 3 && characterLength >= 1) {
        displaySearchMessage('Veuillez entrer au moins trois caractères')
    }else if (characterLength === 0) {
        const filteredRecipes = searchKeywords(recipes)
        updateDisplayedRecipes(filteredRecipes);
    }
}

function clickDropdown(e) {
    const dropDownMenu = e.target.nextSibling.nextSibling;
    const inventoryElt = dropDownMenu.querySelector('.inventory');
    const theme = e.target.dataset.theme;
    const inventoryType = e.target.dataset.inventory;
    const dropDownInput = dropDownMenu.querySelector('input');
    dropDownInput.value = '';
    const filteredRecipes = searchKeywords(recipes);
    const inventorySet = inventorySpecified(inventoryType,filteredRecipes);
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

function clickInventoryItem(e) {
    const item = e.target.textContent;
    const parentBtn = e.target.parentElement.parentElement.parentElement.previousSibling.previousSibling;
    const theme = parentBtn.dataset.theme;
    const inventoryType = parentBtn.dataset.inventory;
    const alertContainer = document.querySelector('.js-tag-container');
    addKeyword(item.toLocaleLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''),inventoryType);
    addAlertTag(item,theme,inventoryType,alertContainer);
    const filteredRecipes = searchKeywords(recipes);
    updateDisplayedRecipes(filteredRecipes);
}

function addAlertTag(item,theme,inventoryType,alertContainer,
                     alertTemplate = document.querySelector('#js-tag')) {
    const templateClone = alertTemplate.content.cloneNode(true);
    const alertElt = templateClone.querySelector('div.alert');
    alertElt.classList.add(`alert-${theme}`);
    alertElt.dataset.inventory = inventoryType;
    const keywordElt = templateClone.querySelector('span.tag-text');
    keywordElt.textContent = item;
    const alertCloseBtn = templateClone.querySelector('button.btn-close');
    alertCloseBtn.addEventListener('click',removeAlertTag);
    alertContainer.appendChild(templateClone);
}

function removeAlertTag(e) {
    const item = e.target.previousSibling.previousSibling.textContent.toLocaleLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const inventoryType = e.target.parentElement.dataset.inventory;

    removeKeyword(item,inventoryType);
    const filteredRecipes = searchKeywords(recipes);
    updateDisplayedRecipes(filteredRecipes);
}

function addInventoryItem(inventoryItem,row,theme) {
    const inventoryItemElt = document.createElement('li');
    inventoryItemElt.classList.add('list-group-item','dropdown-item',`bg-${theme}`, 'text-truncate');
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

function typeInventorySearch(e) {
    const keyword = e.target.value.toLocaleLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const inventoryElt = e.target.nextSibling.nextSibling;
    const parentBtn = e.target.parentElement.previousSibling.previousSibling;
    const theme = parentBtn.dataset.theme;
    const inventoryType = parentBtn.dataset.inventory;
    const filteredRecipes = searchKeywords(recipes);
    const processedInventory = [...inventorySpecified(inventoryType, filteredRecipes)].map(item => {
       return {
           itemRaw : item,
           itemProcessed : item.toLocaleLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
       }
    })
    const filteredInventoryProcessed = processedInventory
        .filter(item => item.itemProcessed.includes(keyword.toLocaleLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')));
    const filteredInventory = filteredInventoryProcessed.map(item => item.itemRaw)
    updateInventoryDisplay(inventoryElt,filteredInventory,theme);
}

function inventorySpecified(inventoryType, recipes, normalizeAccents) {
    switch (inventoryType) {
        case 'ingredient' :
            return ingredientsInventory(recipes, normalizeAccents);
        case 'appliance' :
            return applianceInventory(recipes, normalizeAccents);
        case 'ustensil' :
            return ustensilsInventory(recipes, normalizeAccents);
    }
}

window.addEventListener('load',() => {
    const recipeContainer = document.querySelector('#recipes-container');
    const mainSearch = document.querySelector('#main-search');
    const dropDownToggle = document.querySelectorAll('.dropdown-toggle');
    const recipeTemplate = document.querySelector('#js-recipe-card')
    updateDisplayedRecipes(recipes,recipeContainer,recipeTemplate);
    mainSearch.addEventListener('input',readInputIndex);

    //Event listeners for the advanced filters
    dropDownToggle.forEach(btn => {
        btn.addEventListener('click',clickDropdown);
    });
    dropDownToggle.forEach(btn => {
        const dropDownMenu = btn.nextSibling.nextSibling;
        dropDownMenu.querySelector('input').addEventListener('input', typeInventorySearch);
    });
});