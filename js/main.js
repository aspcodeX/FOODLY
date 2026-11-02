
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
const menuToggle = $("#menuToggle");
const navLinks = $("#navLinks");

let requestId = 0;
let modalRequestId = 0;
let previousFocus = null;

// ========================================
// GENERATED SEO RECIPE PAGE INDEX
// ========================================

const recipePages = new Map();

async function loadRecipePages() {
  try {
    const response = await fetch("/data/recipes.json");

    if (!response.ok) {
      throw new Error("Recipe page index unavailable");
    }

    const recipes = await response.json();

    recipePages.clear();

    recipes.forEach((recipe) => {
      if (recipe.id && recipe.url) {
        recipePages.set(String(recipe.id), recipe.url);
      }
    });

    console.log(
      `Loaded ${recipePages.size} SEO recipe pages.`
    );

  } catch (error) {
    console.warn(
      "Static recipe links unavailable:",
      error
    );
  }
}

// ========================================
// HTML ESCAPING
// ========================================

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

// ========================================
// LOADING STATE
// ========================================

function loading() {
  grid.setAttribute("aria-busy", "true");

  grid.innerHTML = `
    <div class="api-message">
      <div class="loading-spinner"></div>
      <p>Finding something delicious...</p>
    </div>
  `;
}

// ========================================
// RENDER RECIPE CARDS
// ========================================

function renderMeals(meals) {
  grid.setAttribute("aria-busy", "false");

  if (!meals.length) {
    grid.innerHTML = `
      <div class="api-message">
        No recipes found. Try another search.
      </div>
    `;

    return;
  }

  grid.innerHTML = meals.slice(0, 12).map((meal, index) => {
    const recipeId = String(meal.idMeal);
    const recipeURL = recipePages.get(recipeId);

    const recipeAction = recipeURL
      ? `
        <a
          class="recipe-open recipe-page-link"
          href="${escapeHTML(recipeURL)}"
          aria-label="Read full ${escapeHTML(meal.strMeal)} recipe"
        >
          Read full recipe ↗
        </a>
      `
      : `
        <span class="recipe-open">
          Discover recipe ↗
        </span>
      `;

    return `
      <article
        class="recipe-card"
        data-id="${escapeHTML(recipeId)}"
        tabindex="0"
        role="button"
        aria-label="View recipe: ${escapeHTML(meal.strMeal)}"
      >
        <div class="recipe-image">
          <img
            src="${escapeHTML(meal.strMealThumb || "")}"
            alt="${escapeHTML(meal.strMeal)} recipe"
            loading="lazy"
            decoding="async"
          >
        </div>

        <div class="recipe-info">
          <div class="recipe-meta">
            <span>FOODLY PICK ${index + 1}</span>
            <span>RECIPE ↗</span>
          </div>

          <h3>${escapeHTML(meal.strMeal)}</h3>

          ${recipeAction}
        </div>
      </article>
    `;
  }).join("");
}

// ========================================
// LOAD RECIPES
// ========================================

async function loadRecipes(query = "", area = "") {
  const current = ++requestId;

  loading();

  $("#recipeStatus").textContent =
    area
      ? `${area} favourites`
      : query
        ? `Search results for ${query}`
        : "A few favourites to get you started.";

  try {
    const meals = area
      ? await getMealsByArea(area)
      : await getMeals(query);

    // Ignore outdated requests
    if (current !== requestId) return;

    renderMeals(meals);

  } catch (error) {
    if (current !== requestId) return;

    console.error("Recipe loading error:", error);

    grid.setAttribute("aria-busy", "false");

    grid.innerHTML = `
      <div class="api-message">
        <p>Recipe kitchen is temporarily unavailable.</p>

        <button
          class="retry-button"
          id="retryRecipes"
          type="button"
        >
          Try again
        </button>
      </div>
    `;

    $("#retryRecipes")?.addEventListener("click", () => {
      loadRecipes(query, area);
    });
  }
}

// ========================================
// OPEN RECIPE MODAL
// ========================================

async function openRecipe(id) {
  if (!id) return;

  const current = ++modalRequestId;

  previousFocus = document.activeElement;

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");

  modalBody.innerHTML = `
    <p class="api-message">Loading recipe...</p>
  `;

  $("#modalClose").focus();

  try {
    const meal = await getMealDetails(id);

    if (current !== modalRequestId) return;
    if (!modal.classList.contains("open")) return;

    if (!meal) {
      throw new Error("Recipe not found");
    }

    // Prepare ingredients
    let ingredients = "";

    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`]?.trim();
      const measure = meal[`strMeasure${i}`]?.trim();

      if (ingredient) {
        ingredients += `
          <li>
            ${escapeHTML(measure || "")}
            ${escapeHTML(ingredient)}
          </li>
        `;
      }
    }

    // Prepare instructions
    const instructions = escapeHTML(
      meal.strInstructions || "Instructions unavailable."
    );

    // Original recipe source
    const sourceLink = meal.strSource
      ? `
        <a
          class="modal-source"
          href="${escapeHTML(meal.strSource)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Original recipe ↗
        </a>
      `
      : "";

    // Recipe video
    const videoLink = meal.strYoutube
      ? `
        <a
          class="modal-source"
          href="${escapeHTML(meal.strYoutube)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Watch recipe video ↗
        </a>
      `
      : "";

    // Individual SEO page link
    const recipeURL = recipePages.get(String(meal.idMeal));

    const fullRecipeLink = recipeURL
      ? `
        <a
          class="modal-source"
          href="${escapeHTML(recipeURL)}"
        >
          Open full recipe page ↗
        </a>
      `
      : "";

    modalBody.innerHTML = `
      <img
        class="modal-food-image"
        src="${escapeHTML(meal.strMealThumb || "")}"
        alt="${escapeHTML(meal.strMeal)}"
        decoding="async"
      >

      <p class="eyebrow">
        ${escapeHTML(meal.strArea || "FOODLY")}
        / ${escapeHTML(meal.strCategory || "RECIPE")}
      </p>

      <h2>${escapeHTML(meal.strMeal)}</h2>

      <h3>Ingredients</h3>

      <ul>
        ${ingredients || "<li>Ingredients unavailable.</li>"}
      </ul>

      <h3>Let's make it</h3>

      <p class="recipe-instructions">
        ${instructions}
      </p>

      <div class="recipe-links">
        ${fullRecipeLink}
        ${sourceLink}
        ${videoLink}
      </div>
    `;

  } catch (error) {
    if (current !== modalRequestId) return;

    console.error("Recipe details error:", error);

    modalBody.innerHTML = `
      <p class="api-message">
        Could not load this recipe. Please try again.
      </p>
    `;
  }
}

// ========================================
// CLOSE RECIPE MODAL
// ========================================

function closeModal() {
  if (!modal.classList.contains("open")) return;

  ++modalRequestId;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");

  previousFocus?.focus();
}

// ========================================
// RECIPE CARD CLICK
// ========================================

grid.addEventListener("click", (event) => {
  // Allow actual recipe links to navigate
  if (event.target.closest(".recipe-page-link")) {
    return;
  }

  const card = event.target.closest(".recipe-card");

  if (card) {
    openRecipe(card.dataset.id);
  }
});

// ========================================
// RECIPE CARD KEYBOARD ACCESSIBILITY
// ========================================

grid.addEventListener("keydown", (event) => {
  if (
    (event.key === "Enter" || event.key === " ") &&
    event.target.matches(".recipe-card")
  ) {
    event.preventDefault();

    openRecipe(event.target.dataset.id);
  }
});

// ========================================
// RECIPE SEARCH
// ========================================

$("#searchForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const query = $("#searchInput").value.trim();

  loadRecipes(query);
});

// ========================================
// SHOW ALL RECIPES
// ========================================

$("#showAllRecipes").addEventListener("click", () => {
  $("#searchInput").value = "";

  loadRecipes();
});

// ========================================
// CUISINE FILTERING
// ========================================

document.querySelectorAll(".cuisine-card").forEach((card) => {
  card.addEventListener("click", () => {
    $("#recipes").scrollIntoView({
      behavior: "smooth"
    });

    loadRecipes("", card.dataset.cuisine);
  });
});

// ========================================
// MODAL CONTROLS
// ========================================

$("#modalClose").addEventListener("click", closeModal);

$("#modalBackdrop").addEventListener("click", closeModal);

// Escape key
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

// ========================================
// NEWSLETTER INTERACTION
// ========================================

$("#newsletterForm").addEventListener("submit", (event) => {
  event.preventDefault();

  event.currentTarget.reset();

  const toast = $("#toast");

  toast.textContent =
    "Thanks for your interest in FOODLY! ✳";

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
});

// ========================================
// MOBILE NAVIGATION
// ========================================

menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");

  menuToggle.setAttribute(
    "aria-expanded",
    String(isOpen)
  );
});

// Close mobile navigation after clicking a link
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");

    menuToggle.setAttribute(
      "aria-expanded",
      "false"
    );
  });
});

// ========================================
// SCROLL REVEAL
// ========================================

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");

      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.12
});

document.querySelectorAll(".reveal").forEach((element) => {
  revealObserver.observe(element);
});

// ========================================
// INTRO ANIMATION AND THREE.JS SCENE
// ========================================

window.addEventListener("load", () => {
  setTimeout(() => {
    $("#introScreen")?.remove();
  }, 2200);

  if (window.gsap && window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);

    window.gsap.from(".hero-copy > *", {
      y: 24,
      opacity: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: "power3.out",
      delay: 1.4
    });
  }
});

// ========================================
// INITIALIZE 3D FOOD SCENE
// ========================================

try {
  createFoodScene($("#food3d"));
} catch (error) {
  console.error(
    "3D scene initialization failed:",
    error
  );
}

// ========================================
// INITIALIZE FOODLY
// ========================================

async function initializeFoodly() {
  await loadRecipePages();

  await loadRecipes();
}

initializeFoodly();
