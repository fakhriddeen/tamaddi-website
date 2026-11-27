type Unit = 'g' | 'ml' | 'pcs';
type Ingredient = readonly [name: string, quantity: number | null, unit: Unit, optional?: true];
type Standard = {
  servings: number;
  sources: readonly [`https://${string}`, ...`https://${string}`[]];
  ingredients: readonly Ingredient[];
};

// Quantities are for the selected source yield, with metric volume and mass kept distinct.
export const recipeStandards: Record<string, Standard> = {
  '1': { servings: 6, sources: [
    'https://www.eeas.europa.eu/sites/default/files/documents/2025/The%20EEAS%20World%20Cookbook.pdf',
    'https://publications.iom.int/system/files/pdf/recepie_book_2.pdf',
    'https://forkin.io/recipes/uzbek-plov',
  ], ingredients: [
    ['Devzira Rice', 1000, 'g'], ['Lamb Shoulder', 1000, 'g'], ['Yellow Carrots', 1000, 'g'],
    ['Onions', 2, 'pcs'], ['Oil', 150, 'ml'], ['Zira (Cumin)', 6, 'g'],
    ['Garlic Bulbs', 1, 'pcs'], ['Cooked Chickpeas', 240, 'g', true],
  ] },
  '10': { servings: 8, sources: ['https://yep.uz/en/2023/06/how-to-cook-uzbek-mastava-recipe-with-step-by-step-photos/'], ingredients: [
    ['Beef or Lamb', 500, 'g'], ['Short-Grain Rice', 200, 'g'], ['Onions', 300, 'g'],
    ['Carrots', 200, 'g'], ['Potatoes', 200, 'g'], ['Bell Peppers', 200, 'g'], ['Tomatoes', 200, 'g'],
    ['Tomato Paste', 30, 'g'], ['Oil', 100, 'g'], ['Zira (Cumin)', 5, 'g'],
    ['Coriander Seeds', 5, 'g', true], ['Cilantro', 20, 'g', true], ['Raikhon (Basil)', 20, 'g', true],
  ] },
  '3': { servings: 4, sources: ['https://exploreuzbekistan.uz/en/recipes/lagman/', 'https://www.euronews.com/travel/2022/11/03/learn-how-to-cook-chuzma-lagman-with-uzbek-chef-bahriddin-chustiy'], ingredients: [
    ['Flour', 500, 'g'], ['Beef or Lamb', 400, 'g'], ['Tomatoes', 2, 'pcs'], ['Oil', 45, 'ml'],
    ['Onions', 1, 'pcs'], ['Bell Peppers', 2, 'pcs'], ['Carrots', 1, 'pcs'], ['Daikon', 1, 'pcs'],
    ['Garlic Cloves', 3, 'pcs'], ['Zira (Cumin)', 5, 'ml'], ['Meat Stock', 800, 'ml', true],
  ] },
  '4': { servings: 4, sources: ['https://www.sekaigohan.com/en/recipes/east-europe/uzbekistan/manti'], ingredients: [
    ['Flour', 300, 'g'], ['Eggs', 1, 'pcs'], ['Oil', 15, 'ml'], ['Minced Lamb', 300, 'g'],
    ['Onions', 400, 'g'], ['Zira (Cumin)', 5, 'ml'], ['Black Pepper', 2.5, 'ml'], ['Plain Yogurt', 200, 'g', true],
  ] },
  '5': { servings: 6, sources: ['https://exploreuzbekistan.uz/en/recipes/samsa/', 'https://www.tasteofasiaguide.com/recipes/samsa-uzbek/'], ingredients: [
    ['Flour', 500, 'g'], ['Butter', 100, 'g'], ['Lamb', 600, 'g'], ['Onions', 3, 'pcs'],
    ['Zira (Cumin)', 5, 'ml'], ['Eggs', 1, 'pcs', true], ['Sesame', 30, 'g', true],
  ] },
  '6': { servings: 6, sources: ['https://www.tradehou.se/en/uzbek-bazaar/recipes/shurpa-lamb-soup', 'https://sam.uz/en/culture/shorva'], ingredients: [
    ['Bone-in Lamb', 1000, 'g'], ['Potatoes', 2, 'pcs'], ['Carrots', 3, 'pcs'],
    ['Onions', 2, 'pcs'], ['Bell Peppers', 1, 'pcs'], ['Tomatoes', 2, 'pcs'], ['Garlic Bulbs', 1, 'pcs'],
    ['Zira (Cumin)', 8, 'g'], ['Coriander Seeds', 5, 'g', true],
  ] },
  '2': { servings: 4, sources: ['https://exploreuzbekistan.uz/en/recipes/shashlik/'], ingredients: [
    ['Lamb Leg or Lamb Shoulder', 1000, 'g'], ['Onions', 2, 'pcs'], ['Zira (Cumin)', 5, 'ml'],
    ['Ground Coriander', 5, 'ml'], ['Vinegar', 30, 'ml'], ['Tail Fat (Dumba)', 200, 'g', true],
  ] },
  '7': { servings: 6, sources: ['https://www.bbcgoodfood.com/recipes/best-spaghetti-bolognese-recipe'], ingredients: [
    ['Spaghetti', 400, 'g'], ['Minced Beef', 500, 'g'], ['Canned Tomatoes', 800, 'g'],
    ['Onions', 2, 'pcs'], ['Carrots', 2, 'pcs'], ['Celery', 2, 'pcs'], ['Garlic Cloves', 2, 'pcs'],
    ['Tomato Paste', 30, 'ml'], ['Olive Oil', 15, 'ml'], ['Parmesan', 75, 'g', true],
  ] },
  '8': { servings: 4, sources: ['https://www.bbcgoodfood.com/recipes/pizza-margherita-4-easy-steps'], ingredients: [
    ['Bread Flour', 300, 'g'], ['Instant Yeast', 5, 'ml'], ['Olive Oil', 15, 'ml'], ['Passata', 100, 'ml'],
    ['Mozzarella', 125, 'g'],
  ] },
  '9': { servings: 4, sources: ['https://www.bbcgoodfood.com/premium/tomato-courgette-cream-oregano-pasta'], ingredients: [
    ['Penne Pasta', 400, 'g'], ['Canned Tomatoes', 400, 'g'], ['Cream', 150, 'ml'], ['Olive Oil', 60, 'ml'],
    ['Tomato Paste', 30, 'ml'], ['Courgettes', 1, 'pcs'], ['Onions', 1, 'pcs'], ['Garlic Cloves', 3, 'pcs'], ['Grana Padano', 50, 'g', true],
  ] },
  chuchvara: { servings: 4, sources: ['https://exploreuzbekistan.uz/en/recipes/chuchvara/'], ingredients: [
    ['Flour', 400, 'g'], ['Eggs', 1, 'pcs'], ['Minced Beef or Minced Lamb', 400, 'g'],
    ['Onions', 2, 'pcs'], ['Meat Stock', 1500, 'ml'], ['Zira (Cumin)', 2.5, 'ml'],
  ] },
  dimlama: { servings: 6, sources: ['https://exploreuzbekistan.uz/en/recipes/dimlama/', 'https://zira.uz/uz/recipe/dimlama/'], ingredients: [
    ['Bone-in Lamb or Bone-in Beef', 800, 'g'], ['Oil', 60, 'ml'], ['Potatoes', 4, 'pcs'],
    ['Carrots', 3, 'pcs'], ['Onions', 3, 'pcs'], ['Tomatoes', 3, 'pcs'], ['Cabbage', 0.5, 'pcs'],
    ['Bell Peppers', 2, 'pcs'], ['Aubergine', 1, 'pcs'], ['Garlic Bulbs', 1, 'pcs'],
    ['Zira (Cumin)', 5, 'ml'], ['Coriander Seeds', 5, 'ml'],
  ] },
  norin: { servings: 4, sources: ['https://terumimorita.com/journal/naryn', 'https://zira.uz/uz/recipe/norin/'], ingredients: [
    ['Boiled Beef', 300, 'g'], ['Cooked Noodles', 500, 'g'], ['Onions', 1, 'pcs'],
  ] },
  'qozon-kabob': { servings: 4, sources: ['https://world.food/recipes/uzbekistan/qazan-kabab', 'https://zira.uz/ru/recipe/videorecept-kazan-kebab-3/'], ingredients: [
    ['Lamb Ribs or Bone-in Lamb Shoulder', 1000, 'g'], ['Potatoes', 1000, 'g'],
    ['Zira (Cumin)', 10, 'ml'], ['Coriander Seeds', 5, 'ml'], ['Oil', 200, 'ml'],
  ] },
  'fried-lagman': { servings: 2, sources: ['https://cookinero.com/en/recipes/fried-lagman', 'https://www.youtube.com/watch?v=XFK0gJK2Qf4'], ingredients: [
    ['Noodles', 200, 'g'], ['Beef', 300, 'g'], ['Onions', 100, 'g'], ['Potatoes', 300, 'g'],
    ['Carrots', 100, 'g'], ['Aubergine', 200, 'g'], ['Tomatoes', 300, 'g'], ['Bell Peppers', 150, 'g'],
    ['Garlic', 20, 'g'], ['Oil', 68, 'g'], ['Zira (Cumin)', 6, 'g'], ['Ground Coriander', 2, 'g'],
  ] },
  lasagna: { servings: 8, sources: ['https://www.giallozafferano.com/recipes/Lasagne-alla-Bolognese.html'], ingredients: [
    ['Semolina', 350, 'g'], ['Flour', 220, 'g'], ['Spinach', 250, 'g'], ['Eggs', 5, 'pcs'],
    ['Minced Beef', 300, 'g'], ['Pancetta', 150, 'g'], ['Carrots', 50, 'g'], ['Celery', 50, 'g'], ['Onions', 50, 'g'],
    ['Tomato Purée', 300, 'g'], ['Butter', 70, 'g'], ['Milk', 1000, 'ml'], ['Olive Oil', 15, 'ml'], ['Parmesan', 270, 'g'], ['Red Wine', 100, 'g'],
  ] },
  carbonara: { servings: 4, sources: ['https://www.giallozafferano.com/recipes/Spaghetti-Carbonara-Bacon-and-egg-spaghetti.html'], ingredients: [
    ['Spaghetti', 320, 'g'], ['Guanciale', 150, 'g'], ['Eggs', 6, 'pcs'],
    ['Pecorino Romano', 50, 'g'],
  ] },
  risotto: { servings: 4, sources: ['https://www.giallozafferano.com/recipes/porcini-mushroom-risotto.html'], ingredients: [
    ['Risotto Rice', 320, 'g'], ['Porcini Mushrooms', 400, 'g'], ['Butter', 60, 'g'],
    ['Olive Oil', 30, 'ml'], ['Parmesan', 50, 'g'], ['Vegetable Stock', 1000, 'ml'], ['Onions', 1, 'pcs'], ['Garlic Cloves', 1, 'pcs'],
  ] },
  gnocchi: { servings: 4, sources: ['https://www.giallozafferano.com/recipes/Gnocchi-alla-sorrentina.html'], ingredients: [
    ['Potatoes', 1000, 'g'], ['Flour', 300, 'g'], ['Eggs', 1, 'pcs'], ['Tomato Purée', 600, 'g'],
    ['Mozzarella', 250, 'g'], ['Parmesan', 70, 'g'],
  ] },
  bibimbap: { servings: 4, sources: ['https://www.maangchi.com/recipe/Bibimbap', 'https://wpsu.psu.edu/wp-content/uploads/2024/09/WPSU-World-Kitchen-Korea-Bibimbap-Recipe.pdf'], ingredients: [
    ['Short-Grain Rice', 480, 'ml'], ['Bean Sprouts', 340, 'g'], ['Spinach', 227, 'g'], ['Carrots', 1, 'pcs'],
    ['Bell Peppers', 1, 'pcs'], ['Courgettes', 1, 'pcs'], ['Cucumbers', 1, 'pcs'], ['Beef', 227, 'g'],
    ['Eggs', 4, 'pcs'], ['Gochujang', 60, 'ml'], ['Sesame Oil', 15, 'ml'],
  ] },
  'kimchi-fried-rice': { servings: 3, sources: ['https://www.maangchi.com/recipe/kimchi-bokkeumbap'], ingredients: [
    ['Cooked Rice', 720, 'ml'], ['Kimchi', 240, 'ml'], ['Gochujang', 30, 'ml'],
    ['Sesame Oil', 15, 'ml'], ['Oil', 5, 'ml'], ['Spring Onions', 1, 'pcs'],
    ['Eggs', 3, 'pcs', true], ['Sesame', 15, 'ml', true],
  ] },
  bulgogi: { servings: 4, sources: ['https://www.maangchi.com/recipe/easy-bulgogi'], ingredients: [
    ['Beef Sirloin', 454, 'g'], ['Garlic Cloves', 4, 'pcs'], ['Spring Onions', 2, 'pcs'],
    ['Soy Sauce', 30, 'ml'], ['Sugar', 30, 'ml'], ['Sesame Oil', 15, 'ml'], ['Sesame', 15, 'ml', true],
  ] },
  'korean-fried-chicken': { servings: 4, sources: ['https://www.maangchi.com/recipe/yangnyeom-tongdak'], ingredients: [
    ['Chicken Wings', 907, 'g'], ['Potato Starch', 120, 'ml'], ['Flour', 60, 'ml'], ['Eggs', 2, 'pcs'],
    ['Garlic Cloves', 3, 'pcs'], ['Ketchup', 80, 'ml'], ['Rice Syrup', 80, 'ml'], ['Gochujang', 60, 'ml'],
    ['White Vinegar', 10, 'ml'], ['Oil', 10, 'ml'], ['Sesame', 15, 'ml', true],
  ] },
  tteokbokki: { servings: 4, sources: ['https://www.maangchi.com/recipe/tteokbokki'], ingredients: [
    ['Rice Cakes', 450, 'g'], ['Dried Anchovies', 7, 'pcs'], ['Dried Kelp Sheet', 1, 'pcs'],
    ['Gochujang', 80, 'ml'], ['Gochugaru', 15, 'ml'], ['Sugar', 15, 'ml'], ['Spring Onions', 3, 'pcs'],
    ['Eggs', 2, 'pcs', true], ['Fish Cakes', 225, 'g', true],
  ] },
  menemen: { servings: 2, sources: ['https://www.theguardian.com/food/2023/may/24/how-to-cook-the-perfect-menemen-recipe-turkish-eggs-breakfast-peppers-felicity-cloake'], ingredients: [
    ['Eggs', 4, 'pcs'], ['Tomatoes', 200, 'g'], ['Green Peppers', 90, 'g'],
    ['Olive Oil', 30, 'ml'], ['Aleppo Pepper', 5, 'ml', true],
  ] },
  'lentil-soup': { servings: 4, sources: ['https://sekaigohan.com/en/recipes/middle-east/turkey/mercimek-corbasi'], ingredients: [
    ['Red Lentils', 220, 'g'], ['Onions', 180, 'g'], ['Carrots', 120, 'g'], ['Potatoes', 140, 'g'],
    ['Garlic', 6, 'g'], ['Tomato Paste', 25, 'g'], ['Olive Oil', 30, 'ml'],
    ['Butter', 20, 'g', true], ['Lemon', 0.5, 'pcs', true],
  ] },
  'biber-dolmasi': { servings: 6, sources: ['https://www.ktb.gov.tr/EN-98908/stuffed-green-peppers-with-ground-meat.html'], ingredients: [
    ['Green Peppers', 650, 'g'], ['Rice', 75, 'g'], ['Minced Beef', 300, 'g'], ['Onions', 120, 'g'],
    ['Tomatoes', 220, 'g'], ['Tomato Paste', 10, 'g'], ['Parsley', 30, 'g'], ['Dill', 20, 'g', true],
  ] },
  borek: { servings: 3, sources: ['https://www.dizzlesky.co.uk/recipe/spinach-feta-filos/', 'https://history.fnal.gov/documents/NALWO_COOKBOOK.pdf'], ingredients: [
    ['Filo Pastry Sheets', 6, 'pcs'], ['Spinach', 200, 'g'], ['Feta', 200, 'g'], ['Eggs', 1, 'pcs'], ['Butter', 30, 'g'],
  ] },
  // The source's six mini-meatball portions are served as three main meals in Tamaddi.
  // 450 g total meat / 3 = 150 g per person; ingredient ratios stay intact.
  kofte: { servings: 3, sources: ['https://fethiyetimes.com/cooking-with-ozlem-baked-turkish-mini-meatballs-kofte-in-pepper-and-tomato-sauce/'], ingredients: [
    ['Minced Beef', 225, 'g'], ['Minced Lamb', 225, 'g'], ['Onions', 1, 'pcs'],
    ['Eggs', 2, 'pcs'], ['Olive Oil', 30, 'ml'],
  ] },
};
