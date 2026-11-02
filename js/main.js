
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

// Escape HTML to prevent unsafe API content from becoming markup
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

// Loading state
function loading() {
  grid.setAttribute("aria-busy", "true");

  grid.innerHTML = `
    <div class="api-message">
      <div class="loading-spinner"></div>
      <p>Finding something delicious...</p>
    </div>
  `;
}

// Render recipe cards
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

  grid.innerHTML = meals.slice(0, 12).map((meal, index) => `
    <article
      class="recipe-card"
      data-id="${escapeHTML(meal.idMeal)}"
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

        <span class="recipe-open">
          Discover recipe ↗
        </span>
      </div>
    </article>
  `).join("");
}

// Load recipes
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

// Open recipe modal
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
            ${escapeHTML(measure)} ${escapeHTML(ingredient)}
          </li>
        `;
      }
    }

    // Prepare instructions
    const instructions = escapeHTML(
      meal.strInstructions || "Instructions unavailable."
    );

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

      <p class="recipe-instructions">${instructions}</p>

      <div class="recipe-links">
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

// Close modal
function closeModal() {
  if (!modal.classList.contains("open")) return;

  ++modalRequestId;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");

  previousFocus?.focus();
}

// Recipe card click
grid.addEventListener("click", (event) => {
  const card = event.target.closest(".recipe-card");

  if (card) {
    openRecipe(card.dataset.id);
  }
});

// Keyboard accessibility for recipe cards
grid.addEventListener("keydown", (event) => {
  if (
    (event.key === "Enter" || event.key === " ") &&
    event.target.matches(".recipe-card")
  ) {
    event.preventDefault();
    openRecipe(event.target.dataset.id);
  }
});

// Recipe search
$("#searchForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const query = $("#searchInput").value.trim();

  loadRecipes(query);
});

// Show all recipes
$("#showAllRecipes").addEventListener("click", () => {
  $("#searchInput").value = "";
  loadRecipes();
});

// Cuisine filtering
document.querySelectorAll(".cuisine-card").forEach((card) => {
  card.addEventListener("click", () => {
    $("#recipes").scrollIntoView({
      behavior: "smooth"
    });

    loadRecipes("", card.dataset.cuisine);
  });
});

// Modal controls
$("#modalClose").addEventListener("click", closeModal);
$("#modalBackdrop").addEventListener("click", closeModal);

// Escape key
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

// Newsletter interaction
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

// Mobile navigation
menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");

  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

// Close mobile navigation after clicking a link
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

// Scroll reveal
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

// Intro animation and Three.js scene
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

// Initialize 3D food scene
try {
  createFoodScene($("#food3d"));
} catch (error) {
  console.error("3D scene initialization failed:", error);
}

// Initial recipe loading
loadRecipes();
