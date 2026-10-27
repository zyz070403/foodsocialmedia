import assert from "node:assert/strict";
import test from "node:test";
import { calculateNutritionTotal, progressPercent } from "../lib/nutrition.ts";

test("calculates nutrition totals from logged meals", () => {
  const total = calculateNutritionTotal([
    { calories: 420, protein: 30, carbs: 45, fat: 12 },
    { calories: 280, protein: 18, carbs: 32, fat: 9 },
  ]);
  assert.deepEqual(total, { calories: 700, protein: 48, carbs: 77, fat: 21 });
});

test("progress stays within a display-safe range", () => {
  assert.equal(progressPercent(550, 2200), 25);
  assert.equal(progressPercent(2500, 2200), 100);
  assert.equal(progressPercent(-10, 2200), 0);
  assert.equal(progressPercent(10, 0), 0);
});
