import {recipes} from "./database/recipes.js";
import {nmgram} from "./database/nmgram.js";
// Do not reassign or modify the keywords array directly
// Instead use the addKeyword, removeKeyword and removeMainKeyword functions
// Then call the searchKeywords function to get the filtered recipes array
let keywords = [{keyword : '', type : 'main'}];


/**
 * Adds a keyword to the keyword array used for the search function
 * @param {string} keyword - The keyword to be added
 * @param {string} type - The type of keyword (ie 'main','ustensil','appliance' or 'ingredient')
 */
function addKeyword(keyword, type) {
    keywords.push({
        keyword,
        type
    })
}


/**
 * Removes a keyword to the keyword array used for the search function
 * (to remove the main keyword use removeMainKeyword instead)
 * @param {string} keyword - The keyword to be removed
 * @param {string} type - The type of keyword (ie 'main','ustensil','appliance' or 'ingredient')
 */
function removeKeyword(keyword, type) {
    const targetIndex = keywords.findIndex(obj => obj.keyword === keyword && obj.type === type);
    if (targetIndex === -1) {
        console.warn('Keyword not found');
        return false;
    }
    keywords.splice(targetIndex, 1);
    //console.log('Keyword removed');
}

/**
 * Removes the main keyword from the keyword array used to search
 * Useful for replacing it immediately after by the new main keyword from the main search bar
 */
function removeMainKeyword() {
    const targetIndex = keywords.findIndex(obj => obj.type === 'main');

    if (targetIndex === -1) {
        console.warn('Main keyword not found');
        return false;
    }
    keywords.splice(targetIndex, 1);
    //console.log('Main keyword removed');
}

/*function logKeywords() {
        console.table(keywords);
}*/

/**
 * Call the adequate search function to search and filter the recipes
 * using the keyword from the array. The keyword array is external to the function.
 * NB : the keyword array being external, this function doesn't take keywords arguments.
 * @param {array} recipes - The database containing all the recipes in an array of object
 * @param {object} index - The nmgram index used for the search by index
 */
function searchKeywords(recipes,index) {
    if (keywords.length === 0) {
        console.warn('No keywords registered');
    }
    for (let wordObj of keywords) {
        // Search from the main search bar
        if (wordObj.type === 'main') {
            const stringLength = wordObj.keyword.length;
            const wordArray = wordObj.keyword.split(' ');
            if (stringLength >= 3 && stringLength < 14) {
                recipes = searchRecipeFromIndex(wordArray,index,recipes);
            }
            if (stringLength >= 14) {
                recipes = searchAllFromArray(wordArray,recipes);
            }
        }

        // Search from the filters tags
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

// To include in benchmark (also include the database and nmgram)
// Search using the nmgram index

/**
 * Returns the array of ids corresponding to the specified keywords
 * if it exists in the generated nmgram index.
 * @param {string} keyword - The keyword to be checked
 * @param {object} index - The index in which to check the keyword
 */
function getIdsFromIndex(keyword, index) {
    return index[keyword.toLocaleLowerCase()];
}

/**
 * Iterate through each keyword of the word array and checks if there is a corresponding
 * array of ids by calling getIdsFromIndex. Only returns the ids that are common
 * to every keyword of the wordArray
 * @param {array} wordArray - The array containing all the keywords to be checked
 * @param {object} index - The index in which to check the keywords
 */
function getIdsIntersection(wordArray,index) {
    let IdsSubArray;
    for (let word of wordArray) {
        if (word.length >= 3) {
            if (!IdsSubArray) {
                IdsSubArray = getIdsFromIndex(word,index);
            }else{
                let nextArray = getIdsFromIndex(word,index);
                if (!nextArray) return [];
                IdsSubArray = IdsSubArray.filter(id => nextArray.includes(id));
            }
            if (!IdsSubArray) return [];
        }
    }
    return IdsSubArray;
}


/**
 * Gets all the ids in common to all the keywords of the word array using the nmgram index.
 * Then filters the recipes database and returns an array of recipes who have
 * their id returned by getsIdsIntersection.
 * @param {array} wordArray - The array containing all the keywords to be checked
 * @param {object} index - The index in which to check the keywords
 * @param {array} recipes - The recipes database (full or filtered)
 */
function searchRecipeFromIndex(wordArray,index,recipes) {
    const IdsArray = getIdsIntersection(wordArray,index);
    return recipes.filter(recipe => IdsArray.includes(recipe.id));
}

// To include in benchmark (also include the database)
// Naive algorithm
/**
 * Use the native JS array methods to search the recipes database by the recipe name
 * Returns an array by filtering the specified database.
 * @param {string} keyword - The keyword to search in the recipes names
 * @param {array} recipes - The recipes database (full or filtered)
 */
function searchRecipeNames(keyword, recipes) {
    return recipes.filter(recipe => recipe.name.toLocaleLowerCase().includes(keyword));
}

/**
 * Use the native JS array methods to search the recipes database by the appliance used in the recipes.
 * Returns an array by filtering the specified database.
 * @param {string} keyword - The keyword to search in the recipes appliances
 * @param {array} recipes - The recipes database (full or filtered)
 */
function searchAppliance(keyword, recipes) {
    return recipes.filter(recipe => recipe.appliance.toLocaleLowerCase().includes(keyword));
}

/**
 * Use the native JS array methods to search the recipes database in the recipe description.
 * Returns an array by filtering the specified database.
 * @param {string} keyword - The keyword to search in the recipes descriptions
 * @param {array} recipes - The recipes database (full or filtered)
 */
function searchDescription(keyword, recipes) {
    return recipes.filter(recipe => recipe.description.toLocaleLowerCase().includes(keyword));
}

/**
 * Use the native JS array methods to search the recipes database in the recipes ustensils.
 * Returns an array by filtering the specified database.
 * @param {string} keyword - The keyword to search in the recipes ustensils
 * @param {array} recipes - The recipes database (full or filtered)
 */
function searchUstensils(keyword, recipes) {
    return recipes.filter(recipe => {
        return recipe.ustensils
            .map(ustensil => ustensil.toLocaleLowerCase())
            .some(ustensil => ustensil.includes(keyword));
    });
}

/**
 * Use the native JS array methods to search the recipes database in the recipes ingredients.
 * Returns an array by filtering the specified database.
 * @param {string} keyword - The keyword to search in the recipes ingredients
 * @param {array} recipes - The recipes database (full or filtered)
 */
function searchIngredients(keyword, recipes) {
    return recipes.filter(recipe => {
        return getIngredientArray(recipe)
            .some(ingredient => ingredient.includes(keyword));
    });
}

/**
 * Combine all the previous search functions and returns an array of filtered recipes.
 * There may be duplicates if more than one of the called functions filter the same recipe.
 * @param {string} keyword - The keyword to search in the recipes database
 * @param {array} recipes - The recipes database (full or fitlered)
 */
function searchAll(keyword, recipes) {
    keyword = keyword.toLocaleLowerCase();
    return [
        searchRecipeNames(keyword,recipes),
        searchUstensils(keyword,recipes),
        searchAppliance(keyword,recipes),
        searchIngredients(keyword,recipes),
        searchDescription(keyword, recipes)
    ].flat(1);
}

/**
 * Iterate through an array of keywords filtering the recipes to the recipes containing all the keywords.
 * To avoid duplicates, before the array is returned, it is made into a set and then back into an array.
 * The array returned can be used by the recipes displaying functions.
 * @param {array} keywords - The array containing the keywords to search in the recipes database
 * @param {array} recipes - The recipes database (full or filtered)
 */
function searchAllFromArray(keywords, recipes) {
    for (let word of keywords) {
        recipes = searchAll(word,recipes)
    }
    return [...new Set (recipes)];
}

/**
 * Returns all the ingredients of the specified recipe in the form of an array of ingredients.
 * @param {object} recipe - The recipe object whose ingredients we want to get
 */
function getIngredientArray(recipe) {
    return recipe.ingredients.map(item => item.ingredient.toLocaleLowerCase());
}

//To run in the benchmark
//Full text
/*
searchAllFromArray(['chocolat'],recipes);
searchAllFromArray(['banane'],recipes);
searchAllFromArray(['sau'],recipes);
searchAllFromArray(['jfghj'],recipes);
*/

//Using index nmgram
/*
searchRecipeFromIndex(['chocolat'],nmgram,recipes);
searchRecipeFromIndex(['banane'],nmgram,recipes);
searchRecipeFromIndex(['sau'],nmgram,recipes);
searchRecipeFromIndex(['jfghj'],nmgram,recipes);
*/

//End of code to benchmark

/**
 * Returns the ingredients of the recipes included in the specified array.
 * Useful for the advanced filters.
 * @param {array} recipes - The filtered recipes from which we want to get the ingredients
 */
function ingredientsInventory(recipes) {
    return new Set (recipes.map(recipe => getIngredientArray(recipe)).flat(1));
}

/**
 * Returns the appliances of the recipes included in the specified array.
 * Useful for the advanced filters.
 * @param {array} recipes - The filtered recipes from which we want to get the appliances
 */
function applianceInventory(recipes) {
    return new Set (recipes.map(recipe => recipe.appliance.toLocaleLowerCase()));
}

/**
 * Returns the ustensils of the recipes included in the specified array.
 * Useful for the advanced filters.
 * @param {array} recipes - The filtered recipes from which we want to get the ustensils
 */
function ustensilsInventory(recipes) {
    return new Set (recipes.map(recipe => recipe.ustensils
        .map(u => u.toLocaleLowerCase()))
        .flat(1));
}

/**
 * Modifies the DOM by clearing all the children of the specified DOM node.
 * Useful for updating the display.
 * @param container - The DOM node to be emptied
 */
function clearContainer(container) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

/**
 * Clone the recipe card template and modify content to fit the recipe
 * passed as an argument and append it in the container.
 * Be careful to not erase the template from the DOM tree.
 * @param {object} recipe - The recipe to be displayed
 * @param container - The container in which to include the recipe
 * @param recipeTemplate - The template of a recipe card present in the html tree
 */
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

/**
 * Iterates through each recipe contained in the recipe set or array and
 * display them in the specified container using the recipe card template.
 * @param recipeSet{array|Set} - Array containing all the recipes to be displayed
 * @param container - The container in which to display all the recipe cards
 * @param template - The template of a recipe card
 */
function displayTemplateRecipeSet(recipeSet,container,template) {
    recipeSet.forEach(recipe => includeRecipeTemplate(recipe,container,template));
}

/**
 * Clears the specified container and display the new recipe cards included
 * in the recipe array or set.
 * @param recipeSet{array|Set} - Array containing all the recipes to be displayed
 * @param container - The container in which to display all the recipe cards
 * @param template - The template of a recipe card
 */
function updateDisplayedRecipes(recipeSet,
                                container = document.querySelector('#recipes-container'),
                                template = document.querySelector('#js-recipe-card')) {
    clearContainer(container);
    displayTemplateRecipeSet(recipeSet,container,template);
}

/**
 * Clears the specified container and display the specified message instead.
 * Useful to communicate with the user when no recipe can be displayed.
 * @param message {string} - Message to be displayed
 * @param container - The container in which to display all the recipe cards
 */
function displaySearchMessage(message, container = document.querySelector('#recipes-container')) {
    const messageElt = document.createElement('div');
    messageElt.classList.add('search-hint');
    messageElt.textContent = message;
    clearContainer(container);
    container.appendChild(messageElt);
}


//let inputTimer;

function readInputIndex(e) {
    //window.clearTimeout(inputTimer);
    inputResponse(e);
}

/**
 * Used as a callback for an event listener. This function controls what happens when the
 * user type in the main search bar. First it updates the main keyword in the global keyword array.
 * Then it checks if there are enough characters to launch a search. If that's the case, it search using
 * all the keywords in the array and display the results. If there are no results, it displays a message instead.
 * If there are not enough characters it displays a message instead.
 */
function inputResponse(e) {
    const characterLength = e.target.value.length;
    removeMainKeyword();
    const keyword = e.target.value;
    addKeyword(keyword,'main');
    if (characterLength >= 3) {
        const resultsSet = searchKeywords(recipes,nmgram);
        if (resultsSet.length === 0) {
            displaySearchMessage('Aucune recette trouvée, essayez de chercher <<brownie>>, <<salade de riz>>...');
        }else{
            updateDisplayedRecipes(resultsSet);
        }
    }else if (characterLength < 3 && characterLength >= 1) {
        displaySearchMessage('Veuillez entrer au moins trois caractères')
    }else if (characterLength === 0) {
        const filteredRecipes = searchKeywords(recipes,nmgram)
        updateDisplayedRecipes(filteredRecipes);
    }
}

/**
 * Used as a callback for an event listener. This function is called when the user click on an advanced filter.
 * Bootstrap manages the open/close state of the dropdown, so this function mainly serve to update the
 * content of the dropdown menu to match with the results of the search using the global keyword array.
 * The dataset variables specified in the DOM controls the background color and the type of inventory
 * (ingredient, appliance or ustensil).
 */
function clickDropdown(e) {
    const dropDownMenu = e.target.nextSibling.nextSibling;
    const inventoryElt = dropDownMenu.querySelector('.inventory');
    const theme = e.target.dataset.theme;
    const inventoryType = e.target.dataset.inventory;
    const dropDownInput = dropDownMenu.querySelector('input');
    dropDownInput.value = '';
    const filteredRecipes = searchKeywords(recipes,nmgram)
    const inventorySet = inventorySpecified(inventoryType,filteredRecipes);
    updateInventoryDisplay(inventoryElt,inventorySet,theme);
}

/**
 * Update the inventory of the advanced filter dropdown.
 * @param inventoryElt - The container of the inventory - the dropdown menu itself
 * @param inventoryFiltered {array|Set} - The results of the search containing only the items of the inventory
 * @param theme {string} - The theme who specify the background color of the dropdown menu
 */
function updateInventoryDisplay(inventoryElt,inventoryFiltered,theme) {
    clearContainer(inventoryElt);
    appendFilteredInventory(inventoryFiltered,theme,inventoryElt);
}

/**
 * Display the item contained in the specified inventory set or array. Uses the background color specified
 * by the theme. Display the items by lists of three columns and the appropriate number of rows.
 * @param inventorySet {array|Set} - The inventory itself
 * @param theme {string} - The theme specifying the background color
 * @param inventoryElt - The container, the dropdown menu itself
 */
function appendFilteredInventory(inventorySet,theme, inventoryElt) {
    let lastRow;
    let index = 0;
    inventorySet.forEach(item => {
        if (index % 3 === 0) lastRow = addInventoryRow(inventoryElt);
        addInventoryItem(item,lastRow,theme);
        index++;
    });
}

/**
 * Add a single inventory item to the specified dropdown menu.
 * @param inventoryItem {string} - The item to be displayed
 * @param theme {string} - The theme specifying the background color
 * @param row - The horizontal list in which to display the item
 */
function addInventoryItem(inventoryItem,row,theme) {
    const inventoryItemElt = document.createElement('li');
    inventoryItemElt.classList.add('list-group-item','dropdown-item',`bg-${theme}`, 'text-truncate');
    inventoryItemElt.textContent = inventoryItem;
    inventoryItemElt.addEventListener('click', clickInventoryItem);
    row.appendChild(inventoryItemElt);
}

/**
 * Adds and returns a new row for the dropdown menu.
 * @param inventoryElt  - The container, the dropdown menu itself
 */
function addInventoryRow(inventoryElt) {
    const listRow = document.createElement('ul');
    listRow.classList.add('list-group','list-group-horizontal');
    inventoryElt.appendChild(listRow);
    return listRow;
}

/**
 * Used as a callback for an event listener. Called when the user removes a keyword tag used as a filter.
 * Removes the corresponding keyword from the keyword array and update the search results accordingly.
 */
function removeAlertTag(e) {
    const item = e.target.previousSibling.previousSibling.textContent;
    const inventoryType = e.target.parentElement.dataset.inventory;

    removeKeyword(item,inventoryType);
    const filteredRecipes = searchKeywords(recipes,nmgram);
    updateDisplayedRecipes(filteredRecipes);
}

/**
 * Function called to update the filters by adding a keyword.
 * Add the keyword as a displayed tag and to the keyword array.
 * @param item {string} - the keyword itself
 * @param theme {string} - the theme controlling the background color
 * @param inventoryType {string} - The type of inventory (useful when removing the keyword)
 * @param alertContainer - The DOM elements containing all the displayed tags
 * @param alertTemplate - The template for a tag
 */
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

/**
 * Used as callback for an event listener. Called when the user click an item of an advanced filter.
 * Bootstrap manages the close of the dropdown. The clicked keyword is then displayed with its corresponding
 * theme background color and added to the keyword array. The results are then filtered and displayed.
 */
function clickInventoryItem(e) {
    const item = e.target.textContent;
    const parentBtn = e.target.parentElement.parentElement.parentElement.previousSibling.previousSibling;
    const theme = parentBtn.dataset.theme;
    const inventoryType = parentBtn.dataset.inventory;
    const alertContainer = document.querySelector('.js-tag-container');
    addKeyword(item,inventoryType);
    addAlertTag(item,theme,inventoryType,alertContainer);
    const filteredRecipes = searchKeywords(recipes,nmgram);
    updateDisplayedRecipes(filteredRecipes);
}

/**
 * Used as a callback for an event listener. Called when the user types in the advanced filter text input.
 * Proceed to filter the displayed inventory to only show items containing the string entered by the user.
 */
function typeInventorySearch(e) {
    const keyword = e.target.value;
    const inventoryElt = e.target.nextSibling.nextSibling;
    const parentBtn = e.target.parentElement.previousSibling.previousSibling;
    const theme = parentBtn.dataset.theme;
    const inventoryType = parentBtn.dataset.inventory;
    const filteredRecipes = searchKeywords(recipes,nmgram);
    const filteredInventory = [...inventorySpecified(inventoryType, filteredRecipes)]
        .filter(item => item.includes(keyword.toLocaleLowerCase()));
    updateInventoryDisplay(inventoryElt,filteredInventory,theme);
}

/**
 * Used the get the appropriate inventory to be displayed in the advanced filter dropdown.
 * @param inventoryType {string} - The type of inventory (ingredient, appliance or ustensil).
 * @param recipes - The recipes already filtered in order to show only relevant items.
 */
function inventorySpecified(inventoryType, recipes) {
    switch (inventoryType) {
        case 'ingredient' :
            return ingredientsInventory(recipes);
        case 'appliance' :
            return applianceInventory(recipes);
        case 'ustensil' :
            return ustensilsInventory(recipes);
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