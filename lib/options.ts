import type { Category, Neighborhood, PriceRange, Vibe } from "./types";

export const neighborhoods: Neighborhood[] = [
  "Rittenhouse",
  "Center City",
  "Fishtown",
  "Northern Liberties",
  "South Philly",
  "University City",
  "Old City",
  "Fairmount",
  "Passyunk",
  "Manayunk"
];

export const prices: PriceRange[] = ["$", "$$", "$$$", "$$$$"];

export const categories: Category[] = [
  "Dinner",
  "Drinks",
  "Coffee",
  "Brunch",
  "Quick Bite",
  "Date Night"
];

export const vibes: Vibe[] = ["Cozy", "Lively", "Trendy", "Quiet", "Classic", "Adventurous"];
