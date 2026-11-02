
import fs from "node:fs/promises";

const API = "https://www.themealdb.com/api/json/v1/1";
const SITE_URL = "https://foodly-seven-eta.vercel.app";
const OUTPUT_DIR = "dist";

const SOURCES = [
  { type: "category", value: "Vegetarian" },
  { type: "area", value: "Italian" },
  { type: "area", value: "Japanese" },
  { type: "area", value: "Chinese" }
];

async function fetchJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} — ${url}`);
  }

  return response.json();
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getIngredients(meal) {
  const ingredients = [];

  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`]?.trim();
    const measure = meal[`strMeasure${i}`]?.trim();

    if (ingredient) {
      ingredients.push({
        ingredient,
        measure: measure || ""
      });
    }
  }

  return ingredients;
}

function makeRecipeSchema(meal, ingredients, url) {
  const instructions = (meal.strInstructions || "")
    .split(/\r?\n/)
    .map((step) => step.trim())
    .filter(Boolean);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": meal.strMeal,
    "image": [meal.strMealThumb],
    "description": `${meal.strMeal} recipe from FOODLY.`,
    "recipeIngredient": ingredients.map((item) =>
      `${item.measure} ${item.ingredient}`.trim()
    ),
    "recipeInstructions": instructions.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "text": step
    })),
    "mainEntityOfPage": url
  };

  if (meal.strCategory) {
    schema.recipeCategory = meal.strCategory;
  }

  if (meal.strArea) {
    schema.recipeCuisine = meal.strArea;
  }

  return JSON.stringify(schema).replace(/</g, "\\u003c");
}

function makeRecipeHTML(meal, ingredients, url) {
  const title = escapeHTML(meal.strMeal);
  const description = escapeHTML(
    `Discover how to make ${meal.strMeal} with ingredients and step-by-step cooking instructions on FOODLY.`
  );

  const ingredientHTML = ingredients.map((item) => `
    <li>
      <span>${escapeHTML(item.ingredient)}</span>
      <span>${escapeHTML(item.measure)}</span>
    </li>
  `).join("");

  const instructions = (meal.strInstructions || "")
    .split(/\r?\n/)
    .map((step) => step.trim())
    .filter(Boolean);

  const instructionHTML = instructions.map((step, index) => `
    <li>
      <span class="step-number">${index + 1}</span>
      <p>${escapeHTML(step)}</p>
    </li>
  `).join("");

  const schema = makeRecipeSchema(meal, ingredients, url);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>${title} Recipe | FOODLY</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${url}">

  <meta property="og:type" content="article">
  <meta property="og:site_name" content="FOODLY">
  <meta property="og:title" content="${title} Recipe | FOODLY">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${escapeHTML(meal.strMealThumb)}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title} Recipe | FOODLY">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${escapeHTML(meal.strMealThumb)}">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">

  <script type="application/ld+json">${schema}</script>

  <style>
    :root {
      --cream: #f8f5ef;
      --ink: #25231f;
      --orange: #d97745;
      --muted: #77736c;
      --line: #e8e1d7;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      background: var(--cream);
      color: var(--ink);
      font-family: "DM Sans", sans-serif;
      line-height: 1.7;
    }

    a { color: inherit; }

    .nav {
      padding: 22px 7%;
      border-bottom: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-size: 25px;
      font-weight: 700;
      letter-spacing: -1.5px;
      text-decoration: none;
    }

    .back {
      color: var(--orange);
      text-decoration: none;
      font-weight: 600;
    }

    main {
      max-width: 1050px;
      margin: 55px auto;
      padding: 0 24px;
    }

    .eyebrow {
      color: var(--orange);
      text-transform: uppercase;
      letter-spacing: 2px;
      font-size: 12px;
      font-weight: 700;
    }

    h1, h2 {
      font-family: "Instrument Serif", serif;
      font-weight: 400;
      line-height: 1.1;
    }

    h1 {
      font-size: clamp(42px, 7vw, 76px);
      margin: 12px 0;
    }

    h2 {
      font-size: 38px;
      margin-bottom: 20px;
    }

    .hero-image {
      width: 100%;
      max-height: 520px;
      object-fit: cover;
      border-radius: 18px;
      margin: 30px 0;
    }

    .meta {
      color: var(--muted);
      font-size: 14px;
    }

    .content {
      display: grid;
      grid-template-columns: 0.8fr 1.2fr;
      gap: 55px;
      margin-top: 45px;
    }

    .panel {
      background: #fffdf9;
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 28px;
    }

    ul, ol { padding: 0; }

    .ingredients {
      list-style: none;
    }

    .ingredients li {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid var(--line);
      font-size: 14px;
    }

    .ingredients li span:last-child {
      color: var(--muted);
      text-align: right;
    }

    .instructions {
      list-style: none;
    }

    .instructions li {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      margin-bottom: 22px;
    }

    .step-number {
      flex: 0 0 32px;
      height: 32px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: #f5e5d9;
      color: var(--orange);
      font-weight: 700;
    }

    .instructions p { margin: 2px 0; }

    .source {
      display: inline-block;
      margin-top: 20px;
      color: var(--orange);
      font-weight: 600;
    }

    footer {
      border-top: 1px solid var(--line);
      padding: 28px 7%;
      color: var(--muted);
      text-align: center;
      font-size: 13px;
    }

    @media (max-width: 700px) {
      .content { grid-template-columns: 1fr; gap: 25px; }
      main { margin: 35px auto; }
      .panel { padding: 20px; }
    }
  </style>
</head>

<body>
  <nav class="nav">
    <a class="logo" href="/">FOODLY.</a>
    <a class="back" href="/">← Back to home</a>
  </nav>

  <main>
    <p class="eyebrow">FOODLY · Recipe</p>
    <h1>${title}</h1>

    <p class="meta">
      ${escapeHTML(meal.strCategory || "Recipe")}
      ${meal.strArea ? ` · ${escapeHTML(meal.strArea)} cuisine` : ""}
    </p>

    <img
      class="hero-image"
      src="${escapeHTML(meal.strMealThumb)}"
      alt="${title}"
      fetchpriority="high"
    >

    <p>${description}</p>

    <div class="content">
      <section class="panel">
        <h2>Ingredients</h2>
        <ul class="ingredients">
          ${ingredientHTML || "<li>Ingredients unavailable.</li>"}
        </ul>
      </section>

      <section class="panel">
        <h2>How to make it</h2>
        <ol class="instructions">
          ${instructionHTML || "<li>Instructions unavailable.</li>"}
        </ol>
      </section>
    </div>

    ${meal.strSource ? `
      <a class="source" href="${escapeHTML(meal.strSource)}"
         target="_blank" rel="noopener noreferrer">
        View original recipe source ↗
      </a>
    ` : ""}
  </main>

  <footer>
    © ${new Date().getFullYear()} FOODLY. Discover delicious food.
  </footer>
</body>
</html>`;
}

async function getMealIDs() {
  const allIDs = new Set();

  for (const source of SOURCES) {
    const endpoint = source.type === "category"
      ? `filter.php?c=${encodeURIComponent(source.value)}`
      : `filter.php?a=${encodeURIComponent(source.value)}`;

    try {
      const data = await fetchJSON(`${API}/${endpoint}`);

      for (const meal of data.meals || []) {
        if (meal.idMeal) allIDs.add(meal.idMeal);
      }
    } catch (error) {
      console.error(`Could not load ${source.value}:`, error.message);
    }
  }

  return [...allIDs].slice(0, 60);
}

async function getAllDetails(ids) {
  const meals = [];

  for (let i = 0; i < ids.length; i += 5) {
    const batch = ids.slice(i, i + 5);

    const results = await Promise.all(
      batch.map(async (id) => {
        try {
          const data = await fetchJSON(`${API}/lookup.php?i=${id}`);
          return data.meals?.[0] || null;
        } catch (error) {
          console.error(`Could not load recipe ${id}:`, error.message);
          return null;
        }
      })
    );

    meals.push(...results.filter(Boolean));
  }

  return meals;
}

async function build() {
  console.log("Building FOODLY...");

  await fs.rm(OUTPUT_DIR, { recursive: true, force: true });

  await fs.cp(".", OUTPUT_DIR, {
    recursive: true,
    filter: (source) => {
      const excluded = [
        "/node_modules",
        "/.git",
        "/.vercel",
        "/dist"
      ];

      return !excluded.some((folder) =>
        source.replaceAll("\\", "/").includes(folder)
      );
    }
  });

  const ids = await getMealIDs();
  console.log(`Found ${ids.length} recipe IDs.`);

  const meals = await getAllDetails(ids);
  const recipeRecords = [];
  const sitemapURLs = [`${SITE_URL}/`];

  for (const meal of meals) {
    if (!meal.strMeal || !meal.idMeal || !meal.strMealThumb) {
      continue;
    }

    const slug = `${slugify(meal.strMeal)}-${meal.idMeal}`;
    const relativePath = `recipes/${slug}/index.html`;
    const outputPath = `${OUTPUT_DIR}/${relativePath}`;
    const url = `${SITE_URL}/recipes/${slug}/`;

    const ingredients = getIngredients(meal);

    await fs.mkdir(`${OUTPUT_DIR}/recipes/${slug}`, {
      recursive: true
    });

    await fs.writeFile(
      outputPath,
      makeRecipeHTML(meal, ingredients, url),
      "utf8"
    );

    recipeRecords.push({
      id: meal.idMeal,
      name: meal.strMeal,
      slug,
      url,
      image: meal.strMealThumb,
      category: meal.strCategory || "",
      area: meal.strArea || ""
    });

    sitemapURLs.push(url);
  }

  await fs.mkdir(`${OUTPUT_DIR}/data`, { recursive: true });

  await fs.writeFile(
    `${OUTPUT_DIR}/data/recipes.json`,
    JSON.stringify(recipeRecords, null, 2),
    "utf8"
  );

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapURLs.map((url) => `  <url><loc>${escapeHTML(url)}</loc></url>`).join("\n")}
</urlset>`;

  await fs.writeFile(`${OUTPUT_DIR}/sitemap.xml`, sitemap, "utf8");

  console.log(`FOODLY build complete! Generated ${recipeRecords.length} recipe pages.`);
}

build().catch((error) => {
  console.error("FOODLY build failed:", error);
  process.exitCode = 1;
});
