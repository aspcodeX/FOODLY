
/* FOODLY — MAIN JAVASCRIPT */

import { recipes } from "./recipes.js";
import { createFoodScene } from "./three-scene.js";

const $ = (selector) => document.querySelector(selector);

const recipeGrid = $("#recipeGrid");
const searchForm = $("#searchForm");
const searchInput = $("#searchInput");
const modal = $("#recipeModal");
const modalBody = $("#modalBody");
const toast = $("#toast");

let activeCuisine = "All";
let toastTimer;

// INTRO
const intro = $("#introScreen");

window.addEventListener("load", () => {
  setTimeout(() => {
    intro?.classList.add("hidden");
  }, 1000);
});

// THREE.JS
const foodContainer = $("#food3d");

if (foodContainer) {
  try {
    createFoodScene(foodContainer);
  } catch (error) {
    console.error("3D scene could not load:", error);
    foodContainer.innerHTML = `
      <div class="fallback-food">🍝</div>
    `;
  }
}

// TOAST
function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// RECIPE CARD TEMPLATE
function recipeTemplate(recipe) {
  return `
    <article class="recipe-card" data-id="${recipe.id}" tabindex="0">
      <div class="recipe-image" style="background:${recipe.color}">
        <span class="recipe-tag">${recipe.category}</span>
        <span class="recipe-emoji">${recipe.emoji}</span>
      </div>

      <div class="recipe-info">
        <div class="recipe-meta">${recipe.time} · ${recipe.difficulty}</div>
        <h3>${recipe.name}</h3>
        <p>${recipe.description}</p>
      </div>
    </article>
  `;
}

// RENDER RECIPES
function renderRecipes(list = recipes) {
  if (!recipeGrid) return;

  if (!list.length) {
    recipeGrid.innerHTML = `
      <p class="no-results">No recipes found. Try another search!</p>
    `;
    return;
  }

  recipeGrid.innerHTML = list.map(recipeTemplate).join("");
}

// FILTER RECIPES
function filterRecipes() {
  const query = searchInput?.value.trim().toLowerCase() || "";

  const filtered = recipes.filter((recipe) => {
    const matchesCuisine =
      activeCuisine === "All" || recipe.category === activeCuisine;

    const matchesSearch =
      recipe.name.toLowerCase().includes(query) ||
      recipe.category.toLowerCase().includes(query) ||
      recipe.description.toLowerCase().includes(query) ||
      recipe.ingredients.some((ingredient) =>
        ingredient.toLowerCase().includes(query)
      );

    return matchesCuisine && matchesSearch;
  });

  renderRecipes(filtered);
}

// OPEN RECIPE DETAILS
function openRecipe(id) {
  const recipe = recipes.find((item) => item.id === Number(id));

  if (!recipe || !modal || !modalBody) return;

  modalBody.innerHTML = `
    <div style="font-size:65px;margin-bottom:15px">${recipe.emoji}</div>
    <p class="eyebrow">${recipe.category} · ${recipe.time}</p>
    <h2>${recipe.name}</h2>
    <p>${recipe.description}</p>

    <h3 style="margin-top:25px">Ingredients</h3>
    <ul>
      ${recipe.ingredients.map((item) => `<li>${item}</li>`).join("")}
    </ul>

    <h3 style="margin-top:25px">Let's make it</h3>
    <ol>
      ${recipe.steps.map((step) => `<li>${step}</li>`).join("")}
    </ol>
  `;

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModal() {
  modal?.classList.remove("active");
  modal?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

// RECIPE CARD CLICK
recipeGrid?.addEventListener("click", (event) => {
  const card = event.target.closest(".recipe-card");
  if (card) openRecipe(card.dataset.id);
});

recipeGrid?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;

  const card = event.target.closest(".recipe-card");
  if (!card) return;

  event.preventDefault();
  openRecipe(card.dataset.id);
});

// MODAL EVENTS
$("#modalClose")?.addEventListener("click", closeModal);

modal?.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

// SEARCH
searchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  activeCuisine = "All";
  filterRecipes();
  $("#recipes")?.scrollIntoView({ behavior: "smooth" });
});

// LIVE SEARCH
searchInput?.addEventListener("input", filterRecipes);

// CUISINE FILTER
document.querySelectorAll("[data-cuisine]").forEach((card) => {
  card.addEventListener("click", () => {
    activeCuisine = card.dataset.cuisine;
    filterRecipes();
  });
});

// MOBILE NAVIGATION
const menuToggle = $("#menuToggle");
const navLinks = $(".nav-links");

menuToggle?.addEventListener("click", () => {
  const isOpen = navLinks?.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
});

navLinks?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

// SCROLL REVEALS
const revealElements = document.querySelectorAll(
  ".section-heading, .section-topline, .cuisine-card, .recipe-card, .editorial-copy, .newsletter-section"
);

revealElements.forEach((element) => element.classList.add("reveal"));

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("visible"));
}

// GSAP ANIMATIONS
if (window.gsap) {
  gsap.registerPlugin(ScrollTrigger);

  gsap.from(".hero-copy > *", {
    y: 30,
    opacity: 0,
    duration: 0.8,
    stagger: 0.1,
    ease: "power3.out",
    delay: 1.1
  });

  gsap.from(".hero-visual", {
    scale: 0.9,
    opacity: 0,
    duration: 1.2,
    ease: "power3.out",
    delay: 1.2
  });

  gsap.utils.toArray(".editorial-image").forEach((element) => {
    gsap.from(element, {
      scrollTrigger: {
        trigger: element,
        start: "top 85%"
      },
      opacity: 0,
      x: -40,
      duration: 1
    });
  });
}

// INITIALIZE
renderRecipes();

console.log("FOODLY is ready! 🍝");
