import { categories, neighborhoods, prices, vibes } from "./options";
import { recommendRestaurant, rewardByAction } from "./bandit";
import type { RecommendationContext, RecommendationEvent, Restaurant, RewardAction } from "./types";

type SyntheticUser = {
  id: string;
  favoriteNeighborhood: RecommendationContext["neighborhood"];
  favoritePrice: RecommendationContext["price"];
  favoriteCategory: RecommendationContext["category"];
  favoriteVibe: RecommendationContext["vibe"];
  adventurousness: number;
};

function pseudoRandom(seed: number): number {
  const value = Math.sin(seed * 9301 + 49297) * 233280;
  return value - Math.floor(value);
}

function makeUsers(count: number): SyntheticUser[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `synthetic_user_${String(index + 1).padStart(3, "0")}`,
    favoriteNeighborhood: neighborhoods[index % neighborhoods.length],
    favoritePrice: prices[(index * 3) % prices.length],
    favoriteCategory: categories[(index * 5) % categories.length],
    favoriteVibe: vibes[(index * 7) % vibes.length],
    adventurousness: 0.15 + pseudoRandom(index + 3) * 0.7
  }));
}

function chooseContext(user: SyntheticUser, step: number): RecommendationContext {
  const explore = pseudoRandom(step + user.id.length) < user.adventurousness;

  return {
    neighborhood: explore ? neighborhoods[step % neighborhoods.length] : user.favoriteNeighborhood,
    price: explore ? prices[(step * 2) % prices.length] : user.favoritePrice,
    category: explore ? categories[(step * 3) % categories.length] : user.favoriteCategory,
    vibe: explore ? vibes[(step * 5) % vibes.length] : user.favoriteVibe
  };
}

function simulateAction(user: SyntheticUser, restaurant: Restaurant, context: RecommendationContext, step: number): RewardAction {
  const fitScore =
    Number(restaurant.neighborhood === context.neighborhood) +
    Number(restaurant.price === context.price) +
    Number(restaurant.category === context.category) +
    Number(context.vibe !== "Any" && restaurant.vibes.includes(context.vibe)) +
    Number(restaurant.neighborhood === user.favoriteNeighborhood) * 0.8 +
    Number(restaurant.price === user.favoritePrice) * 0.5 +
    Number(restaurant.category === user.favoriteCategory) * 0.7;

  const threshold = pseudoRandom(step * 13 + restaurant.reviewCount);

  if (fitScore >= 4.2 && threshold > 0.22) return threshold > 0.72 ? "reserve" : "save";
  if (fitScore >= 3 && threshold > 0.28) return threshold > 0.68 ? "order" : "details";
  if (fitScore >= 2 && threshold > 0.62) return "details";
  return "skip";
}

export function simulateEvents(restaurants: Restaurant[], trials = 900, userCount = 80): RecommendationEvent[] {
  const users = makeUsers(userCount);
  const events: RecommendationEvent[] = [];
  const startedAt = Date.now() - trials * 1000 * 60 * 9;

  for (let step = 0; step < trials; step += 1) {
    const user = users[step % users.length];
    const context = chooseContext(user, step);
    const recommendation = recommendRestaurant(restaurants, events, context);
    if (!recommendation) continue;

    const timestamp = new Date(startedAt + step * 1000 * 60 * 9).toISOString();
    const impression: RecommendationEvent = {
      id: `sim_imp_${step}`,
      timestamp,
      userId: user.id,
      restaurantId: recommendation.restaurant.id,
      action: "impression",
      reward: rewardByAction.impression,
      context,
      modelScore: recommendation.score
    };

    const action = simulateAction(user, recommendation.restaurant, context, step);
    const response: RecommendationEvent = {
      id: `sim_evt_${step}`,
      timestamp,
      userId: user.id,
      restaurantId: recommendation.restaurant.id,
      action,
      reward: rewardByAction[action],
      context,
      modelScore: recommendation.score
    };

    events.push(impression, response);
  }

  return events;
}
