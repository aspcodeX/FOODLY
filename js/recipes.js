
const API = "https://www.themealdb.com/api/json/v1/1";

// Cache repeated API requests
const cache = new Map();

// Reusable API fetch function
async function fetchMeals(endpoint) {
  if (cache.has(endpoint)) {
    return cache.get(endpoint);
  }

  const request = fetch(`${API}/${endpoint}`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.meals || [];
    })
    .catch((error) => {
      cache.delete(endpoint);
      throw error;
    });

  cache.set(endpoint, request);
  return request;
}

// Search recipes
export async function getMeals(query = "") {
  const search = query.trim();

  const endpoint = search
    ? `search.php?s=${encodeURIComponent(search)}`
    : "filter.php?c=Vegetarian";

  return fetchMeals(endpoint);
}

// Get recipes by cuisine
export async function getMealsByArea(area) {
  if (!area?.trim()) {
    throw new Error("Cuisine name is required");
  }

  return fetchMeals(
    `filter.php?a=${encodeURIComponent(area.trim())}`
  );
}

// Get complete recipe details
export async function getMealDetails(id) {
  if (!id) {
    throw new Error("Recipe ID is required");
  }

  const meals = await fetchMeals(
    `lookup.php?i=${encodeURIComponent(id)}`
  );

  return meals[0] || null;
}

// Format recipe data
export function formatRecipe(meal) {
  if (!meal) return null;

  const ingredients = [];

  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`]?.trim();
    const measure = meal[`strMeasure${i}`]?.trim();

    if (ingredient) {
      ingredients.push({
        name: ingredient,
        quantity: measure || ""
      });
    }
  }

  return {
    id: meal.idMeal,
    name: meal.strMeal,
    image: meal.strMealThumb,
    category: meal.strCategory || "",
    cuisine: meal.strArea || "",
    instructions: meal.strInstructions || "",
    ingredients,
    video: meal.strYoutube || "",
    source: meal.strSource || ""
  };
}

// Generate Google Recipe structured data
export function generateRecipeSchema(meal) {
  const recipe = formatRecipe(meal);

  if (!recipe || !recipe.ingredients.length) {
    return null;
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": recipe.name,
    "image": [recipe.image],
    "recipeIngredient": recipe.ingredients.map(item =>
      `${item.quantity} ${item.name}`.trim()
    ),
    "recipeInstructions": recipe.instructions
      .split(/\r?\n/)
      .map(step => step.trim())
      .filter(Boolean)
      .map((step, index) => ({
        "@type": "HowToStep",
        "position": index + 1,
        "text": step
      }))
  };

  if (recipe.category) {
    schema.recipeCategory = recipe.category;
  }

  if (recipe.cuisine) {
    schema.recipeCuisine = recipe.cuisine;
  }

  return schema;
}
