
const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

// Supported cuisine filters
export const CUISINES = {
  Indian: "Indian",
  Japanese: "Japanese",
  Italian: "Italian",
  Mexican: "Mexican"
};

// Fetch data from TheMealDB
async function fetchMeals(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.meals || [];

  } catch (error) {
    console.error("FOODLY API Error:", error);
    return [];
  }
}

// Remove duplicate recipes using their meal ID
function removeDuplicates(meals) {
  const uniqueMeals = new Map();

  meals.forEach(meal => {
    if (meal?.idMeal) {
      uniqueMeals.set(meal.idMeal, meal);
    }
  });

  return [...uniqueMeals.values()];
}

// Get random recipes
export async function getRandomMeals(count = 6) {
  const requests = Array.from(
    { length: count },
    () => fetchMeals("random.php")
  );

  const results = await Promise.all(requests);

  return removeDuplicates(results.flat());
}

// Search recipes by name
export async function searchMeals(query) {
  if (!query || !query.trim()) return [];

  const meals = await fetchMeals(
    `search.php?s=${encodeURIComponent(query.trim())}`
  );

  return removeDuplicates(meals);
}

// Get recipes by cuisine
export async function filterMealsByArea(area) {
  const cuisine = Object.keys(CUISINES).find(
    key => key.toLowerCase() === area?.trim().toLowerCase()
  );

  if (!cuisine) {
    console.warn("FOODLY: Unsupported cuisine:", area);
    return [];
  }

  const meals = await fetchMeals(
    `filter.php?a=${encodeURIComponent(CUISINES[cuisine])}`
  );

  return removeDuplicates(meals);
}

// Get recipes by category
export async function filterMealsByCategory(category) {
  if (!category) return [];

  const meals = await fetchMeals(
    `filter.php?c=${encodeURIComponent(category)}`
  );

  return removeDuplicates(meals);
}

// Get full recipe details using meal ID
export async function getMealById(id) {
  if (!id) return null;

  const meals = await fetchMeals(
    `lookup.php?i=${encodeURIComponent(id)}`
  );

  return meals[0] || null;
}

// Get all available cuisine names
export function getAvailableCuisines() {
  return Object.keys(CUISINES);
}
