const apiKey = "YOUR_API_KEY";
const apiUrlByName = "https://api.spoonacular.com/recipes/complexSearch";
const apiUrlByIngredients = "https://api.spoonacular.com/recipes/findByIngredients";
/*
 *  Обработчик события для кнопки поиска
*/
document.getElementById("search-button").addEventListener("click", () => {
    const query = document.getElementById("search-input").value;
    const searchType = document.getElementById("search-type").value;

   
    if (query.trim()) {
        
        searchType === "name"
            ? fetchRecipes(apiUrlByName, { query }) 
            : fetchRecipes(apiUrlByIngredients, { ingredients: query }); 

        
        clearAutoSuggest();
    } else {
        alert("Please enter a search term");
    }
});

/*
 *   Очистка поля ввода и результатов при изменении типа поиска
*/
document.getElementById("search-type").addEventListener("change", () => {
    document.getElementById("search-input").value = "";
    document.getElementById("recipe-grid").innerHTML = "";

});
/*
 *  Функция переключения между страницами
*/
const showPage = (page) => {
    document.getElementById("search-page").style.display = page === 'search' ? 'block' : 'none';
    document.getElementById("favorites-page").style.display = page === 'favorites' ? 'block' : 'none';
    document.getElementById("popular-recipes").style.display = page === 'search' ? 'block' : 'none';
    if (page === 'favorites') loadFavorites();
};
/*
 *  Функция запроса к API для поиска рецептов
*/
const fetchRecipes = async (url, params) => {
    try {
        const queryString = new URLSearchParams({ ...params, number: 5, addRecipeInformation: true, apiKey }).toString();
        const response = await fetch(`${url}?${queryString}`);
        const data = await response.json();
        
        if (url === apiUrlByIngredients) {
            const detailedRecipes = await Promise.all(data.map(async (recipe) => {
                const fullRecipe = await fetch(`https://api.spoonacular.com/recipes/${recipe.id}/information?apiKey=${apiKey}`).then(res => res.json());
                return fullRecipe;
            }));
            displayRecipes(detailedRecipes);
        } else {
            displayRecipes(data.results || data);
        }
    } catch (error) {
        console.error("Error:", error);
    }
};
/*
 *  Функция отображения рецептов в сетке
*/
const displayRecipes = (recipes) => {
    const grid = document.getElementById("recipe-grid");
    grid.innerHTML = "";
    recipes.forEach(recipe => grid.appendChild(createRecipeCard(recipe)));
};
/*
 *  Функция создания карточки рецепта
*/
const createRecipeCard = (recipe) => {
    const card = document.createElement("div");
    card.classList.add("recipe-card");

    const readyInMinutes = recipe.readyInMinutes || "N/A";
    
    card.innerHTML = `
        <img src="${recipe.image}" alt="${recipe.title}">
        <h3>${recipe.title}</h3>
        <p>Ready in: ${readyInMinutes} minutes</p>
    `;
    const infoButton = createButton("", "bx bx-info-circle", () => fetchRecipeInformation(recipe.id));
    infoButton.classList.add("info-button", "button-style"); 
    card.appendChild(infoButton);

    const heartButton = createButton("", "bx bx-heart", () => addToFavorites(recipe.id));
    heartButton.classList.add("heart-button", "button-style");
    heartButton.setAttribute("data-id", recipe.id); 
    card.appendChild(heartButton);
    return card;
};
/*
 * Вспомогательная функция для создания кнопок с иконками и обработчиками событий
*/
const createButton = (text, iconClass, onClick) => {
    const button = document.createElement("button");
    button.innerHTML = `<i class="${iconClass}"></i> ${text}`;
    button.onclick = onClick;
    return button;
};
/*
 * Функция для получения и отображения информации о рецепте
*/
const fetchRecipeInformation = async (recipeId) => {
    try {
        const response = await fetch(`https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}`);
        const recipe = await response.json();
        const nutritionLabel = await fetchRecipeNutrition(recipeId);
        displayRecipeInformation(recipe, nutritionLabel);
    } catch (error) {
        console.error("Error fetching recipe information:", error);
    }
};
/*
 *  Функция для получения информации о питательных веществах рецепта
*/
const fetchRecipeNutrition = async (recipeId) => {
    try {
        const response = await fetch(`https://api.spoonacular.com/recipes/${recipeId}/nutritionWidget.json?apiKey=${apiKey}`);
        const nutritionData = await response.json();
        const calories = (nutritionData.bad?.find(nutrient => nutrient.title === "Calories")?.amount ||
                          nutritionData.good?.find(nutrient => nutrient.title === "Calories")?.amount ||
                          "N/A");
        return `<p"><i class="bx bx-dna"></i><strong> Calories:</strong> ${calories} kcal</p>`;
    } catch (error) {
        console.error("Error fetching recipe nutrition:", error);
        return `<p style="color: red;">Nutrition information not available.</p>`;
    }
};
/*
 *  Функция отображения информации о рецепте в модальном окне
*/
const displayRecipeInformation = (recipe, nutritionLabel) => {
    const ingredients = Array.isArray(recipe.extendedIngredients) && recipe.extendedIngredients.length > 0
        ? recipe.extendedIngredients.map(ingredient => `<li>${ingredient.amount} ${ingredient.unit} ${ingredient.name}</li>`).join('')
        : "Ingredients not available.";

    const instructions = recipe.instructions || "Instructions not available.";

    const recipeDetails = document.getElementById("recipe-details");
    recipeDetails.innerHTML = `
        <h3><i class="bx bx-food-menu"></i> ${recipe.title}</h3>
        <img src="${recipe.image}" alt="${recipe.title}">
        <p><i class="bx bx-time"></i> <strong>Ready in:</strong> ${recipe.readyInMinutes} minutes</p>
        <p><i class="bx bx-group"></i> <strong>Servings:</strong> ${recipe.servings}</p>
        <div>${nutritionLabel}</div>
        <p><i class="bx bx-cart"></i> <strong>Ingredients:</strong></p>
        <div class="scroll-container">${ingredients}</div>
        <p><i class="bx bx-receipt"></i> <strong>Instructions:</strong></p>
        <div class="scroll-container">${instructions}</div>`;
    
    openModal();
};
/*
 * Функции для открытия и закрытия модального окна 
*/
const openModal = () => document.getElementById("recipe-info").style.display = "block";
const closeModal = () => document.getElementById("recipe-info").style.display = "none";

/*
 * Функция для добавления рецепта в избранное и изменения иконки сердца 
*/
const addToFavorites = (id) => {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    if (!favorites.includes(id)) {
        favorites.push(id);
        localStorage.setItem("favorites", JSON.stringify(favorites));
        alert("Added to favorites!");
        
        document.querySelector(`.heart-button[data-id="${id}"] i`).classList.replace("bx-heart", "bxs-heart");
    } else {
        alert("Already in favorites!");
    }
};
/*
 *  Загрузка избранных рецептов из localStorage
*/
const loadFavorites = () => {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    if (favorites.length > 0) fetchFavoriteRecipes(favorites);
};
/*
 * Функция получения информации о каждом избранном рецепте
*/
const fetchFavoriteRecipes = async (favorites) => {
    try {
        const recipes = await Promise.all(favorites
            .filter(id => id) 
            .map(id => 
                fetch(`https://api.spoonacular.com/recipes/${id}/information?apiKey=${apiKey}`)
                    .then(res => {
                        if (!res.ok) throw new Error(`Recipe ${id} not found`);
                        return res.json();
                    })
            )
        );
        displayFavorites(recipes);
    } catch (error) {
        console.error("Error fetching favorites:", error);
    }
};
/*
 * Отображение избранных рецептов 
*/
const displayFavorites = async (favorites) => {
    const grid = document.getElementById("favorites-grid");
    grid.innerHTML = "";

    for (const recipe of favorites) {
        const nutritionLabel = await fetchRecipeNutrition(recipe.id);
        const card = createRecipeCard(recipe);
        
        
        const trashButton = createButton("", "bx bx-trash", () => removeFromFavorites(recipe.id));
        trashButton.classList.add("trash-button", "button-style");
        card.appendChild(trashButton);

        grid.appendChild(card);
    }
};
                      
/*
 * Функция удаления рецепта из избранного
*/
const removeFromFavorites = (id) => {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    if (favorites.includes(id)) {
        favorites = favorites.filter(favId => favId !== id);
        localStorage.setItem("favorites", JSON.stringify(favorites));
        alert("Removed from favorites!");
        loadFavorites(); 
    }
};

/*
 * Получение популярных рецептов
*/
const fetchPopularRecipes = async () => {
    try {
        const queryString = new URLSearchParams({
            number: 5, 
            sort: "popularity",
            addRecipeInformation: true, 
            apiKey 
        }).toString();
        const response = await fetch(`${apiUrlByName}?${queryString}`);
        const data = await response.json();
        
        displayPopularRecipes(data.results);
    } catch (error) {
        console.error("Error fetching popular recipes:", error);
    }
};

/*
 * Отображение популярных рецептов
*/
const displayPopularRecipes = (recipes) => {
    const grid = document.getElementById("popular-grids");
    recipes.forEach(recipe => grid.appendChild(createRecipeCard(recipe)));
};

/*
 * Стилизация поля автозаполнения
*/
const style = document.createElement('style');
style.innerHTML = `
    #suggest-box {
        position: absolute;
        background-color: #333;
        color: white;
        border-radius: 4px;
        width: 100%;
        max-width: 400px;
        display: none;
        z-index: 1000;
        top: calc(100% + 5px); 
    }
    .suggestion-item {
        padding: 10px;
        cursor: pointer;
    }
    .suggestion-item:hover {
        background-color: #444;
    }
`;
/*
 * Инициализация при загрузке страницы
*/
document.head.appendChild(style);
window.onload = () => {
    closeModal();
    showPage('search');
    fetchPopularRecipes();
    /*
     * Создание контейнера для автозаполнения
    */
    const searchContainer = document.getElementById("search-container");
    const suggestBox = document.createElement("div");
    suggestBox.id = "suggest-box";
    searchContainer.appendChild(suggestBox);
};
