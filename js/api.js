const API_BASE = "https://www.themealdb.com/api/json/v1/1";

async function apiRequest(endpoint) {
  try {
    const response = await fetch(`${API_BASE}/${endpoint}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("FOODLY API error:", error);
    throw error;
  }
}

export async function getRandomMeals(count = 6) {
  const requests = Array.from(
    { length: count },
    () => apiRequest("random.php")
  );

  const results = await Promise.allSettled(requests);

  return results
    .filter(result => result.status === "fulfilled")
    .map(result => result.value.meals?.[0])
    .filter(Boolean);
}

export async function searchMeals(query) {
  const data = await apiRequest(
    `search.php?s=${encodeURIComponent(query)}`
  );

  return data.meals || [];
}

export async function filterMealsByArea(area) {
  const data = await apiRequest(
    `filter.php?a=${encodeURIComponent(area)}`
  );

  return data.meals || [];
}

export async function getMealById(id) {
  const data = await apiRequest(
    `lookup.php?i=${encodeURIComponent(id)}`
  );

  return data.meals?.[0] || null;
}