
const API = "https://www.themealdb.com/api/json/v1/1";

export async function getMeals(query = "") {
  const url = query.trim()
    ? `${API}/search.php?s=${encodeURIComponent(query)}`
    : `${API}/filter.php?c=Vegetarian`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Recipe API failed");
  }

  const data = await response.json();
  return data.meals || [];
}

export async function getMealsByArea(area) {
  const response = await fetch(
    `${API}/filter.php?a=${encodeURIComponent(area)}`
  );

  if (!response.ok) {
    throw new Error("Cuisine API failed");
  }

  const data = await response.json();
  return data.meals || [];
}

export async function getMealDetails(id) {
  const response = await fetch(
    `${API}/lookup.php?i=${encodeURIComponent(id)}`
  );

  if (!response.ok) {
    throw new Error("Recipe details unavailable");
  }

  const data = await response.json();
  return data.meals?.[0] || null;
}
