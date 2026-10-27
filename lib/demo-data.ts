import type { ValePost, ValeUser } from "./types";

export const demoUsers: ValeUser[] = [
  { id: "maya", username: "mayamoves", displayName: "Maya Chen", initials: "MC", avatarGradient: "peach", goal: "Performance", mutuals: 12 },
  { id: "leo", username: "leocooks", displayName: "Leo Martins", initials: "LM", avatarGradient: "forest", goal: "Lean bulk", mutuals: 8 },
  { id: "nia", username: "nia.nourished", displayName: "Nia Brooks", initials: "NB", avatarGradient: "berry", goal: "Wellness", mutuals: 5 },
  { id: "ari", username: "ariruns", displayName: "Ari Patel", initials: "AP", avatarGradient: "ocean", goal: "Half marathon", mutuals: 16 },
];

export const demoPosts: ValePost[] = [
  {
    id: "post-bowl", user: demoUsers[0], imageUrl: "/meal-images/turmeric-chicken-bowl.jpg",
    mealName: "Golden chicken power bowl",
    caption: "Post-lift lunch that actually keeps me going. The lemon tahini is non-negotiable 🍋",
    calories: 648, protein: 48, carbs: 62, fat: 23, aiEstimated: true,
    createdAt: "18 min", likes: 284, liked: false, bookmarked: false,
    comments: [
      { id: "c1", username: "ariruns", body: "That char on the sweet potato 👌" },
      { id: "c2", username: "nia.nourished", body: "Saving this for meal prep Sunday." },
    ],
  },
  {
    id: "post-pasta", user: demoUsers[1], imageUrl: "/meal-images/salmon-basil-rigatoni.jpg",
    mealName: "Basil rigatoni + salmon",
    caption: "Thirty-minute dinner, 51g protein. Bright, herby, and exactly what the evening needed.",
    calories: 712, protein: 51, carbs: 74, fat: 25, aiEstimated: true,
    createdAt: "1 hr", likes: 431, liked: true, bookmarked: true,
    comments: [{ id: "c3", username: "mayamoves", body: "Recipe drop please!" }],
  },
  {
    id: "post-oats", user: demoUsers[2], imageUrl: "/meal-images/berry-oats.jpg",
    mealName: "Berry recovery oats",
    caption: "Slow morning fuel after an easy 5K. Add a pinch of salt to the almond butter—trust me.",
    calories: 486, protein: 22, carbs: 68, fat: 17, aiEstimated: true,
    createdAt: "3 hr", likes: 198, liked: false, bookmarked: false, comments: [],
  },
];

export const dailyTrend = [1640, 2030, 1885, 2210, 1970, 1840, 1764];
