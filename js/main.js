import {
  getRandomMeals,
  searchMeals,
  filterMealsByArea,
  getMealById
} from "./api.js";

import {
  renderRecipes,
  showFavorites
} from "./recipes.js";

import { initScrollAnimations } from "./animations.js";
import { initThreeScene } from "./three-scene.js";

/* =================================
   FOODLY INTRO
================================= */

function initIntro() {
  const intro = document.getElementById("intro-screen");

  if (!intro) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const duration = reducedMotion ? 500 : 1800;

  window.setTimeout(() => {
    intro.classList.add("intro-exit");

    window.setTimeout(() => {
      intro.remove();
    }, 400);

  }, duration);
}

/* =================================
   TOAST
================================= */

function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  window.setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

/* =================================
   RECIPE LOADING
================================= */

let currentOffset = 0;
let isLoading = false;

async function loadTrending(append = false) {
  if (isLoading) return;

  isLoading = true;

  const grid = document.getElementById("recipeGrid");

  if (!append) {
    grid.innerHTML =
      '<div class="loading-message">Finding something delicious...</div>';
  }

  try {
    const meals = await getRandomMeals(6);

    if (!meals.length) {
      throw new Error("No recipes returned");
    }

    currentOffset += meals.length;

    renderRecipes(meals, append);

    // Refresh scroll animations for newly added cards
    initScrollAnimations();

  } catch (error) {
    console.error(error);

    grid.innerHTML =
      '<div class="empty-message">Could not load recipes. Please check your internet and try again.</div>';

  } finally {
    isLoading = false;
  }
}

/* =================================
   SEARCH
================================= */

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const searchStatus = document.getElementById("searchStatus");

searchForm.addEventListener("submit", async event => {
  event.preventDefault();

  const query = searchInput.value.trim();

  if (!query) return;

  searchStatus.textContent = "Searching delicious recipes...";

  try {
    const meals = await searchMeals(query);

    renderRecipes(meals);

    searchStatus.textContent = meals.length
      ? `${meals.length} recipes found for "${query}".`
      : `No recipes found for "${query}".`;

    document.getElementById("trending").scrollIntoView({
      behavior: "smooth"
    });

  } catch (error) {
    searchStatus.textContent =
      "Search failed. Please try again.";
  }
});

/* =================================
   CUISINE FILTER
================================= */

document.querySelectorAll(".cuisine-card").forEach(card => {
  card.addEventListener("click", async () => {
    const area = card.dataset.area;

    const grid = document.getElementById("recipeGrid");

    grid.innerHTML =
      '<div class="loading-message">Exploring this cuisine...</div>';

    document.getElementById("trending").scrollIntoView({
      behavior: "smooth"
    });

    try {
      const meals = await filterMealsByArea(area);

      // The filter endpoint returns basic meal information.
      // Fetch individual details to keep recipe cards consistent.
      const detailedMeals = await Promise.all(
        meals.slice(0, 6).map(meal => getMealById(meal.idMeal))
      );

      renderRecipes(detailedMeals.filter(Boolean));

      searchStatus.textContent = `${area} cuisine selected.`;

      initScrollAnimations();

    } catch (error) {
      grid.innerHTML =
        '<div class="empty-message">Could not load this cuisine. Please try again.</div>';
    }
  });
});

/* =================================
   LOAD MORE
================================= */

document.getElementById("loadMore")
  .addEventListener("click", () => {
    loadTrending(true);
  });

/* =================================
   FAVOURITES
================================= */

document.getElementById("showFavorites")
  .addEventListener("click", () => {
    showFavorites();
  });

/* =================================
   MOBILE NAVIGATION
================================= */

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");

  menuToggle.textContent =
    navLinks.classList.contains("open") ? "×" : "☰";
});

navLinks.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.textContent = "☰";
  });
});

/* =================================
   START WEBSITE
================================= */

// Intro runs independently from network and 3D loading.
initIntro();

// Start the 3D model in the background.
initThreeScene();

// Start scroll animations independently.
initScrollAnimations();

// Load recipes after the first page render.
if ("requestIdleCallback" in window) {
  requestIdleCallback(() => loadTrending(), { timeout: 1000 });
} else {
  window.setTimeout(() => loadTrending(), 150);
}