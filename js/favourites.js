
/* FOODLY — FAVOURITES */

const STORAGE_KEY = "foodly-favourites";

export function getFavourites() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

export function isFavourite(id) {
    return getFavourites().some(meal => meal.idMeal === id);
}

export function toggleFavourite(meal) {
    const favourites = getFavourites();

    const exists = favourites.some(
        item => item.idMeal === meal.idMeal
    );

    const updated = exists
        ? favourites.filter(item => item.idMeal !== meal.idMeal)
        : [...favourites, meal];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    return !exists;
}
