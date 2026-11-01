import { getMealById } from "./api.js";

const recipeGrid = document.getElementById("recipeGrid");
const recipeModal = document.getElementById("recipeModal");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");

let currentMeals = [];
let favorites = JSON.parse(localStorage.getItem("foodly-favorites") || "[]");

function saveFavorites() {
  localStorage.setItem(
    "foodly-favorites",
    JSON.stringify(favorites)
  );
}

export function renderRecipes(meals, append = false) {
  if (!recipeGrid) return;

  if (!append) {
    recipeGrid.innerHTML = "";
  }

  if (!meals || meals.length === 0) {
    recipeGrid.innerHTML =
      '<div class="empty-message">No recipes found. Try another search!</div>';
    return;
  }

  currentMeals = append
    ? [...currentMeals, ...meals]
    : meals;

  meals.forEach(meal => {
    const isFavorite = favorites.includes(meal.idMeal);

    const card = document.createElement("article");
    card.className = "recipe-card";

    card.innerHTML = `
      <div class="recipe-image">
        <img
          src="${meal.strMealThumb}"
          alt="${escapeHTML(meal.strMeal)}"
          loading="lazy"
        >
        <button
          class="favorite-btn ${isFavorite ? "active" : ""}"
          aria-label="Toggle favourite"
          data-favorite="${meal.idMeal}"
        >${isFavorite ? "♥" : "♡"}</button>
      </div>

      <div class="recipe-info">
        <span class="recipe-area">
          ${escapeHTML(meal.strArea || "FOODLY PICK")}
        </span>
        <h3>${escapeHTML(meal.strMeal)}</h3>
        <p>Discover the recipe and start cooking ↗</p>
      </div>
    `;

    card.addEventListener("click", event => {
      if (event.target.closest(".favorite-btn")) return;
      openRecipe(meal.idMeal);
    });

    card.querySelector(".favorite-btn")
      .addEventListener("click", event => {
        event.stopPropagation();
        toggleFavorite(meal.idMeal, event.currentTarget);
      });

    recipeGrid.appendChild(card);
  });
}

function toggleFavorite(id, button) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(item => item !== id);
    button.classList.remove("active");
    button.textContent = "♡";
    showToast("Removed from favourites");
  } else {
    favorites.push(id);
    button.classList.add("active");
    button.textContent = "♥";
    showToast("Added to favourites ♥");
  }

  saveFavorites();
}

export async function showFavorites() {
  if (!favorites.length) {
    recipeGrid.innerHTML =
      '<div class="empty-message">You have no favourites yet. Save a recipe you love!</div>';
    return;
  }

  recipeGrid.innerHTML =
    '<div class="loading-message">Loading your favourites...</div>';

  try {
    const meals = await Promise.all(
      favorites.map(id => getMealById(id))
    );

    renderRecipes(meals.filter(Boolean));
  } catch (error) {
    recipeGrid.innerHTML =
      '<div class="empty-message">Could not load favourites. Please try again.</div>';
  }

  document.getElementById("trending").scrollIntoView({
    behavior: "smooth"
  });
}

async function openRecipe(id) {
  modalContent.innerHTML =
    '<p class="loading-message">Preparing your recipe...</p>';

  recipeModal.showModal();

  try {
    const meal = await getMealById(id);

    if (!meal) throw new Error("Recipe not found");

    const ingredients = [];

    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`]?.trim();
      const measure = meal[`strMeasure${i}`]?.trim();

      if (ingredient) {
        ingredients.push(
          `<li>${escapeHTML(measure || "")} ${escapeHTML(ingredient)}</li>`
        );
      }
    }

    modalContent.innerHTML = `
      <img
        class="modal-image"
        src="${meal.strMealThumb}"
        alt="${escapeHTML(meal.strMeal)}"
      >

      <span class="recipe-area">
        ${escapeHTML(meal.strArea || "FOODLY RECIPE")}
      </span>

      <h2 class="modal-title">${escapeHTML(meal.strMeal)}</h2>

      <h3 class="modal-heading">Ingredients</h3>
      <ul class="modal-copy">
        ${ingredients.join("")}
      </ul>

      <h3 class="modal-heading">Instructions</h3>
      <p class="modal-copy">${escapeHTML(meal.strInstructions || "No instructions available.")}</p>

      ${meal.strYoutube ? `
        <a
          class="btn btn-primary"
          href="${meal.strYoutube}"
          target="_blank"
          rel="noopener noreferrer"
        >Watch recipe video ↗</a>
      ` : ""}
    `;
  } catch (error) {
    modalContent.innerHTML =
      '<p class="empty-message">Unable to load this recipe. Please try again.</p>';
  }
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  window.setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

modalClose?.addEventListener("click", () => {
  recipeModal.close();
});

recipeModal?.addEventListener("click", event => {
  if (event.target === recipeModal) {
    recipeModal.close();
  }
});