import { recipeStandards } from './recipe-standards';
import { NEW_RECIPES } from './new-recipes';

export interface Recipe {
  id: string;
  title: string;
  uzbekName: string;
  subtitle: string;
  time: string;
  servings: string;
  /** Rough kcal estimate for one person; it is not nutrition-label data. */
  caloriesPerServing?: number;
  /** Catalog amounts are per serving unless explicitly specified. */
  ingredientBaseServings?: number;
  ingredientAmounts?: Record<string, { quantity: number | null; unit: string }>;
  difficulty: 'Easy' | 'Moderate' | 'Advanced';
  image: number;
  photoLayout?: 'cutout';
  youtubeUrl?: `https://${string}`;
  optionalIngredients?: string[];
  unverifiedIngredients?: string[];
  recipeSources?: readonly `https://${string}`[];
  ingredientSource?: { label: string; url: `https://${string}` };
  tags: string[];
  primaryTag: string;
  tagColor: string;
  keyIngredients: string[];
}

const catalog: Recipe[] = [
  {
    id: '1',
    title: 'Palov (Pilaf)',
    uzbekName: "O'zbek Oshi",
    subtitle: 'Traditional festive rice pilaf with tender lamb, yellow carrots & cumin',
    time: '60 min',
    servings: '6–8 ppl',
    caloriesPerServing: 720,
    difficulty: 'Moderate',
    image: require('../../assets/meals/plov.webp'),
    tags: ['Uzbek', 'Weekend', 'Traditional'],
    primaryTag: 'Uzbek Special',
    tagColor: '#86868B',
    ingredientAmounts: { 'Oil': { quantity: 25, unit: 'ml' } },
    keyIngredients: ['Oil', 'Devzira Rice', 'Lamb Shoulder', 'Yellow Carrots', 'Zira (Cumin)', 'Chickpeas', 'Garlic'],
  },
  {
    id: '10',
    title: 'Mastava',
    uzbekName: 'Mastava shoʻrva',
    subtitle: 'A hearty Uzbek rice soup with tender meat, vegetables, cumin and fresh herbs',
    time: '90 min',
    servings: '8 ppl',
    caloriesPerServing: 430,
    difficulty: 'Moderate',
    image: require('../../assets/meals/mastava.png'),
    photoLayout: 'cutout',
    tags: ['Uzbek', 'Weekend', 'Traditional'],
    primaryTag: 'Uzbek Rice Soup',
    tagColor: '#86868B',
    ingredientAmounts: { 'Oil': { quantity: 10, unit: 'ml' } },
    keyIngredients: ['Oil', 'Beef or Lamb', 'Short-Grain Rice', 'Onions', 'Carrots', 'Potatoes', 'Bell Peppers', 'Tomatoes', 'Tomato Paste', 'Zira (Cumin)', 'Coriander Seeds', 'Cilantro', 'Raikhon (Basil)'],
    ingredientSource: { label: 'Ingredient basis: Yep.uz', url: 'https://yep.uz/en/2023/06/how-to-cook-uzbek-mastava-recipe-with-step-by-step-photos/' },
  },
  {
    id: '3',
    title: 'Lagman',
    uzbekName: 'Chozma Lagmon',
    subtitle: 'Rich meat and vegetable stew served with handmade hand-pulled noodles',
    time: '40 min',
    servings: '4 ppl',
    caloriesPerServing: 650,
    difficulty: 'Moderate',
    image: require('../../assets/meals/lagman.png'),
    photoLayout: 'cutout',
    tags: ['Uzbek', 'Quick', 'Healthy'],
    primaryTag: 'Pulled Noodles',
    tagColor: '#86868B',
    ingredientAmounts: { 'Oil': { quantity: 15, unit: 'ml' } },
    keyIngredients: ['Oil', 'Hand-Pulled Noodles', 'Beef Shank', 'Bell Peppers', 'Tomatoes', 'Garlic Chives'],
  },
  {
    id: '4',
    title: 'Manti',
    uzbekName: "Qovoqli / Go'shtli Manti",
    subtitle: 'Large handmade steamed dumplings filled with spiced lamb, onion & herbs',
    time: '75 min',
    servings: '6 ppl',
    caloriesPerServing: 560,
    difficulty: 'Advanced',
    image: require('../../assets/meals/manti.png'),
    photoLayout: 'cutout',
    tags: ['Uzbek', 'Healthy', 'Weekend'],
    primaryTag: 'Steamed Feast',
    tagColor: '#86868B',
    keyIngredients: ['Minced Lamb', 'Diced Onions', 'Thin Rolled Dough', 'Black Pepper', 'Suzma / Sour Cream'],
  },
  {
    id: '5',
    title: 'Somsa',
    uzbekName: 'Tandir Somsa',
    subtitle: 'Crispy flaky layered pastries filled with diced meat, onion & black cumin',
    time: '45 min',
    servings: '6 pcs',
    caloriesPerServing: 390,
    difficulty: 'Moderate',
    image: require('../../assets/meals/somsa.png'),
    photoLayout: 'cutout',
    tags: ['Uzbek', 'Quick', 'Traditional'],
    primaryTag: 'Tandir Baked',
    tagColor: '#86868B',
    keyIngredients: ['Layered Pastry Dough', 'Diced Beef / Lamb', 'Onions', 'Black Cumin (Zira)', 'Sesame'],
  },
  {
    id: '6',
    title: 'Shurva',
    uzbekName: "Qaynatma Sho'rva",
    subtitle: 'Fragrant clear lamb broth with whole potatoes, sweet carrots & fresh herbs',
    time: '50 min',
    servings: '4 ppl',
    caloriesPerServing: 480,
    difficulty: 'Easy',
    image: require('../../assets/meals/shurva.png'),
    photoLayout: 'cutout',
    tags: ['Uzbek', 'Quick', 'Healthy'],
    primaryTag: 'Hearty Broth',
    tagColor: '#86868B',
    keyIngredients: ['Bone-in Lamb', 'Baby Potatoes', 'Carrots', 'Sweet Peppers', 'Fresh Dill & Cilantro'],
  },
  {
    id: '2',
    title: 'Shashlik',
    uzbekName: 'Kavob / Shashlik',
    subtitle: 'Tender spiced lamb and beef skewers grilled over glowing charcoal coals',
    time: '35 min',
    servings: '4 ppl',
    caloriesPerServing: 610,
    difficulty: 'Easy',
    image: require('../../assets/meals/shashlik.jpg'),
    tags: ['Uzbek', 'Grilled', 'Weekend'],
    primaryTag: 'Charcoal Grilled',
    tagColor: '#86868B',
    ingredientAmounts: { Oil: { quantity: 5, unit: 'ml' } },
    keyIngredients: ['Oil', 'Lamb Ribs', 'Beef Sirloin', 'Onion Marinade', 'Ground Coriander', 'Tail Fat (Dumba)'],
  },
  { id: '7', title: 'Spaghetti', uzbekName: 'Italian classic', subtitle: 'Spaghetti with a rich beef and tomato sauce, finished with parmesan.', time: '25 min', servings: '2 ppl', caloriesPerServing: 660, difficulty: 'Easy', image: require('../../assets/meals/spaghetti.jpg'), tags: ['Italian', 'Quick'], primaryTag: 'Italian', tagColor: '#86868B', ingredientAmounts: { 'Olive Oil': { quantity: 10, unit: 'ml' } },
    keyIngredients: ['Olive Oil', 'Spaghetti', 'Minced Beef', 'Tomatoes', 'Onions', 'Garlic', 'Parmesan'] },
  { id: '8', title: 'Pizza', uzbekName: 'Italian classic', subtitle: 'A crisp pizza base with tomatoes, mozzarella and basil.', time: '35 min', servings: '2 ppl', caloriesPerServing: 680, difficulty: 'Moderate', image: require('../../assets/meals/pizza.jpg'), tags: ['Italian', 'Weekend'], primaryTag: 'Italian', tagColor: '#86868B', ingredientAmounts: { 'Olive Oil': { quantity: 10, unit: 'ml' } }, keyIngredients: ['Pizza Dough', 'Tomato Sauce', 'Mozzarella', 'Fresh Basil', 'Olive Oil'] },
  { id: '9', title: 'Pasta', uzbekName: 'Italian classic', subtitle: 'Penne with a creamy tomato sauce, parmesan and fresh herbs.', time: '20 min', servings: '2 ppl', caloriesPerServing: 620, difficulty: 'Easy', image: require('../../assets/meals/pasta.jpg'), tags: ['Italian', 'Quick'], primaryTag: 'Italian', tagColor: '#86868B', ingredientAmounts: { 'Olive Oil': { quantity: 10, unit: 'ml' } }, keyIngredients: ['Olive Oil', 'Penne Pasta', 'Tomatoes', 'Cream', 'Parmesan', 'Garlic'] },
  ...NEW_RECIPES,
];

function practicalServingAmount(quantity: number, unit: string) {
  const step = unit === 'pcs' ? 0.01 : unit === 'g' && quantity >= 150 ? 50 : quantity >= 50 ? 5 : quantity >= 10 ? 1 : 0.01;
  return Number(Math.max(step, Math.round(quantity / step) * step).toFixed(2));
}

export const RECIPES: Recipe[] = catalog.map((recipe) => {
  const standard = recipeStandards[recipe.id];
  return {
    ...recipe,
    ingredientBaseServings: 1,
    keyIngredients: standard.ingredients.map(([name]) => name),
    ingredientAmounts: Object.fromEntries(standard.ingredients.map(([name, quantity, unit]) =>
      [name, { quantity: quantity === null ? null : practicalServingAmount(quantity / standard.servings, unit), unit }])),
    optionalIngredients: standard.ingredients.filter(([, , , optional]) => optional).map(([name]) => name),
    unverifiedIngredients: standard.ingredients.filter(([, quantity]) => quantity === null).map(([name]) => name),
    recipeSources: standard.sources,
  };
});

// Retain saved meal IDs for existing dinner plans and deep links.
const removedFromBrowsing = new Set(['10', '3', '4', '6', '7']);
export const BROWSABLE_RECIPES = RECIPES.filter((recipe) => !removedFromBrowsing.has(recipe.id));

export const PHOTO_CREDITS: Record<string, { label: string; source?: `https://${string}` }> = {
 '1': { label: 'Photo selected by you' },
 '2': { label: 'Photo selected by you' },
 '3': { label: 'Photo selected by you' },
 '4': { label: 'Photo selected by you' },
 '5': { label: 'Photo selected by you' },
 '6': { label: 'Photo selected by you' },
 '7': { label: 'Photo selected by you' },
 '8': { label: 'Photo selected by you' },
 '9': { label: 'Photo selected by you' },
 '10': { label: 'Photo selected by you' },
};

export const PHOTO_ASPECT_RATIOS: Record<string, number> = {"1": 0.7560283687943262, "2": 0.8, "3": 0.5626911314984709, "4": 0.6666666666666666, "5": 0.8, "6": 0.7502548419979612, "7": 0.8, "8": 0.66625, "9": 0.7997823721436343, "10": 0.6666666666666666};
