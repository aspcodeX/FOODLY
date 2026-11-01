
const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

// ======================================
// FOODLY CUISINE DATABASE
// ======================================

export const CUISINES = {
  Indian: "Indian",
  Japanese: "Japanese",
  Italian: "Italian",
  Mexican: "Mexican"
};

// Accept alternate names too
const CUISINE_ALIASES = {
  indian: "Indian",
  india: "Indian",

  japanese: "Japanese",
  japan: "Japanese",

  italian: "Italian",
  italy: "Italian",

  mexican: "Mexican",
  mexico: "Mexican"
};

// ======================================
// API FETCH FUNCTION
// ======================================

async function fetchMeals(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}`);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    return data.meals || [];

  } catch (error) {
    console.error("FOODLY API Error:", error);
    return [];
  }
}

// ======================================
// REMOVE DUPLICATE RECIPES
// ======================================

function removeDuplicates(meals) {
  const uniqueMeals = new Map();

  meals.forEach(meal => {
    if (meal?.idMeal) {
      uniqueMeals.set(meal.idMeal, meal);
    }
  });

  return [...uniqueMeals.values()];
}

// ======================================
// GET RANDOM RECIPES
// ======================================

export async function getRandomMeals(count = 6) {
  const requests = Array.from(
    { length: count },
    () => fetchMeals("random.php")
  );

  const results = await Promise.all(requests);

  return removeDuplicates(results.flat());
}

// ======================================
// SEARCH RECIPES
// ======================================

export async function searchMeals(query) {
  if (!query || !query.trim()) {
    return [];
  }

  const meals = await fetchMeals(
    `search.php?s=${encodeURIComponent(query.trim())}`
  );

  return removeDuplicates(meals);
}

// ======================================
// FILTER BY CUISINE
// ======================================

export async function filterMealsByArea(area) {
  if (!area || typeof area !== "string") {
    return [];
  }

  const normalizedArea = CUISINE_ALIASES[
    area.trim().toLowerCase()
  ];

  if (!normalizedArea) {
    console.warn("FOODLY: Unsupported cuisine:", area);
    return [];
  }

  const meals = await fetchMeals(
    `filter.php?a=${encodeURIComponent(normalizedArea)}`
  );

  return removeDuplicates(meals);
}

// ======================================
// FILTER BY CATEGORY
// ======================================

export async function filterMealsByCategory(category) {
  if (!category || !category.trim()) {
    return [];
  }

  const meals = await fetchMeals(
    `filter.php?c=${encodeURIComponent(category.trim())}`
  );

  return removeDuplicates(meals);
}

// ======================================
// GET FULL RECIPE DETAILS
// ======================================

export async function getMealById(id) {
  if (!id) {
    return null;
  }

  const meals = await fetchMeals(
    `lookup.php?i=${encodeURIComponent(id)}`
  );

  return meals[0] || null;
}

// ======================================
// GET AVAILABLE CUISINES
// ======================================

export function getAvailableCuisines() {
  return Object.keys(CUISINES);
}
