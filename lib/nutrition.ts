import type { Nutrition, ValePost } from "./types";

export function calculateNutritionTotal(posts: Pick<ValePost, keyof Nutrition>[], base: Nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 }): Nutrition {
  return posts.reduce((total, post) => ({
    calories: total.calories + post.calories,
    protein: total.protein + post.protein,
    carbs: total.carbs + post.carbs,
    fat: total.fat + post.fat,
  }), { ...base });
}

export function progressPercent(value: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((value / target) * 100)));
}
