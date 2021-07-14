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

function ingredientsInventory(recipes) {
    return new Set (recipes.map(recipe => getIngredientArray(recipe)).flat(1));
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
        searchIngredients(keyword,recipes)
    ].flat(1));
}

function clearContainer(container) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

function includeReciteTemplate(recipe, container) {
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

/*function displayRecipe(recipe, container) {
    const recipeCol = document.createElement('div');
    recipeCol.classList.add('col-4');
    const recipeCard = document.createElement('div');
    recipeCard.classList.add('card','rounded','border-0');
    const cardPlaceholder = document.createElement('div');
    cardPlaceholder.classList.add('card-placeholder');

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body','px-0');
    const insideContainer = document.createElement('div');
    insideContainer.classList.add('container-fluid','g-3');
    const upperRow = document.createElement('div');
    upperRow.classList.add('row','lh-1','mb-1');
    const titleCol = document.createElement('div');
    titleCol.classList.add('col-8');
    const cardTitle = document.createElement('h2');
    cardTitle.classList.add('card-title','text-truncate');
    cardTitle.textContent = recipe.name;
    const timeCol = document.createElement('div');
    timeCol.classList.add('col','text-end');
    const clockIcon = document.createElement('i');
    clockIcon.classList.add('bi','bi-clock');
    const timeElt = document.createElement('strong');
    timeElt.classList.add('fs-2');
    timeElt.textContent = ` ${recipe.time} min`;

    const lowerRow = document.createElement('div');
    lowerRow.classList.add('row','fs-6','lh-sm','gx-2');
    const ingredientCol = document.createElement('div');
    ingredientCol.classList.add('col-6','text-truncate');
    for (let ingredient of recipe.ingredients) {
        const item = document.createElement('strong');
        item.textContent = ingredient.ingredient;
        ingredientCol.appendChild(item);
        if ('quantity' in ingredient) {
            item.append(': ')
            ingredientCol.append(ingredient.quantity);
            if ('unit' in ingredient) {
                ingredientCol.append(` ${ingredient.unit}`);
            }
        }
        if (recipe.ingredients.indexOf(ingredient) !== recipe.ingredients.length - 1) {
            ingredientCol.appendChild(document.createElement('br'));
        }
    }

    const descriptionCol = document.createElement('div');
    descriptionCol.classList.add('col-6','lh-1','line-clamp');
    descriptionCol.textContent = recipe.description;

    recipeCol.appendChild(recipeCard);
    recipeCard.appendChild(cardPlaceholder);
    recipeCard.appendChild(cardBody);
    cardBody.appendChild(insideContainer);
    insideContainer.appendChild(upperRow);
    upperRow.appendChild(titleCol);
    titleCol.appendChild(cardTitle);
    upperRow.appendChild(timeCol);
    timeCol.appendChild(clockIcon);
    timeCol.appendChild(timeElt);

    insideContainer.appendChild(lowerRow);
    lowerRow.appendChild(ingredientCol);
    lowerRow.appendChild(descriptionCol);

    container.appendChild(recipeCol);

}

function displayRecipeSet(recipeSet,container) {
    recipeSet.forEach(recipe => displayRecipe(recipe,container));
}*/

function displayTemplateRecipeSet(recipeSet,container) {
    recipeSet.forEach(recipe => includeReciteTemplate(recipe,container));
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
    clearContainer(inventoryElt);
    const inventorySet = ingredientsInventory(recipes);
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

window.addEventListener('load',() => {
    const recipeContainer = document.querySelector('#recipes-container');
    const mainSearch = document.querySelector('#main-search');
    const ingredientsBtn = document.querySelector('#dropdownIngredients');
    clearContainer(recipeContainer);
    displayTemplateRecipeSet(recipes,recipeContainer);
    mainSearch.addEventListener('input',readInput);
    ingredientsBtn.addEventListener('click', clickDropdown);
});