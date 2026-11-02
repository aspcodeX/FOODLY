
import {
  getMeals,
  getMealsByArea,
  getMealDetails
} from "./recipes.js";

import { createFoodScene } from "./three-scene.js";

const $ = (selector) => document.querySelector(selector);

const grid = $("#recipeGrid");
const modal = $("#recipeModal");
const modalBody = $("#modalBody");

let requestId = 0;

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function loading() {
  grid.innerHTML = `
    <div class="api-message">
      <div class="loading-spinner"></div>
      <p>Finding something delicious...</p>
    </div>`;
}

function renderMeals(meals) {
  if (!meals.length) {
    grid.innerHTML = `
      <div class="api-message">
        No recipes found. Try another search.
      </div>`;
    return;
  }

  grid.innerHTML = meals.slice(0, 12).map((meal, index) => `
    <article class="recipe-card" data-id="${escapeHTML(meal.idMeal)}" tabindex="0">
      <div class="recipe-image">
        <img
          src="${escapeHTML(meal.strMealThumb || "")}"
          alt="${escapeHTML(meal.strMeal)}"
          loading="lazy"
        >
      </div>

      <div class="recipe-info">
        <div class="recipe-meta">
          <span>FOODLY PICK ${index + 1}</span>
          <span>RECIPE ↗</span>
        </div>

        <h3>${escapeHTML(meal.strMeal)}</h3>
        <span class="recipe-open">Discover recipe ↗</span>
      </div>
    </article>
  `).join("");
}

async function loadRecipes(query = "", area = "") {
  const current = ++requestId;

  loading();

  $("#recipeStatus").textContent =
    area ? `${area} favourites` :
    query ? `Search results for ${query}` :
    "A few favourites to get you started.";

  try {
    const meals = area
      ? await getMealsByArea(area)
      : await getMeals(query);

    if (current !== requestId) return;

    renderMeals(meals);

  } catch (error) {
    if (current !== requestId) return;

    grid.innerHTML = `
      <div class="api-message">
        <p>Recipe kitchen is temporarily unavailable.</p>
        <button class="retry-button" id="retryRecipes">Try again</button>
      </div>`;

    $("#retryRecipes")?.addEventListener("click", () =>
      loadRecipes(query, area)
    );
  }
}

async function openRecipe(id) {
  modal.classList.add("open");
  modalBody.innerHTML = "<p>Loading recipe...</p>";

  try {
    const meal = await getMealDetails(id);

    if (!meal) throw new Error("Recipe not found");

    let ingredients = "";

    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`]?.trim();
      const measure = meal[`strMeasure${i}`]?.trim();

      if (ingredient) {
        ingredients += `
          <li>${escapeHTML(measure)} ${escapeHTML(ingredient)}</li>`;
      }
    }

    modalBody.innerHTML = `
      <img class="modal-food-image"
        src="${escapeHTML(meal.strMealThumb)}"
        alt="${escapeHTML(meal.strMeal)}">

      <p class="eyebrow">
        ${escapeHTML(meal.strArea || "FOODLY")}
        / ${escapeHTML(meal.strCategory || "RECIPE")}
      </p>

      <h2>${escapeHTML(meal.strMeal)}</h2>

      <h3>Ingredients</h3>
      <ul>${ingredients}</ul>

      <h3>Let's make it</h3>
      <p>${escapeHTML(meal.strInstructions || "")}</p>

      ${meal.strSource
        ? `<a class="modal-source"
             href="${escapeHTML(meal.strSource)}"
             target="_blank"
             rel="noopener noreferrer">Original recipe ↗</a>`
        : ""}
    `;

  } catch {
    modalBody.innerHTML =
      "<p>Could not load this recipe. Please try again.</p>";
  }
}

grid.addEventListener("click", (event) => {
  const card = event.target.closest(".recipe-card");

  if (card) openRecipe(card.dataset.id);
});

grid.addEventListener("keydown", (event) => {
  if (
    (event.key === "Enter" || event.key === " ") &&
    event.target.matches(".recipe-card")
  ) {
    event.preventDefault();
    openRecipe(event.target.dataset.id);
  }
});

$("#searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  loadRecipes($("#searchInput").value.trim());
});

$("#showAllRecipes").addEventListener("click", () => {
  $("#searchInput").value = "";
  loadRecipes();
});

// Exactly three cuisine options.
document.querySelectorAll(".cuisine-card").forEach((card) => {
  card.addEventListener("click", () => {
    $("#recipes").scrollIntoView({ behavior: "smooth" });
    loadRecipes("", card.dataset.cuisine);
  });
});

function closeModal() {
  modal.classList.remove("open");
}

$("#modalClose").addEventListener("click", closeModal);
$("#modalBackdrop").addEventListener("click", closeModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

$("#newsletterForm").addEventListener("submit", (event) => {
  event.preventDefault();
  event.currentTarget.reset();

  const toast = $("#toast");
  toast.textContent = "You're on the list! Stay hungry. ✳";
  toast.classList.add("show");

  setTimeout(() => toast.classList.remove("show"), 2500);
});

// Mobile navigation
$("#menuToggle").addEventListener("click", () => {
  $("#navLinks").classList.toggle("open");
});

// Scroll reveal
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(element => {
  revealObserver.observe(element);
});

// Intro and 3D scene
window.addEventListener("load", () => {
  setTimeout(() => $("#introScreen")?.remove(), 2200);

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.from(".hero-copy > *", {
      y: 24,
      opacity: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: "power3.out",
      delay: 1.4
    });
  }
});

createFoodScene($("#food3d"));
loadRecipes();
