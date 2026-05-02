import type { BanditState, RecommendationContext, RecommendationEvent, Restaurant } from "./types";

export const rewardByAction = {
  impression: 0,
  skip: 0,
  details: 0.2,
  save: 0.7,
  reserve: 1,
  order: 0.9
} as const;

export function contextKey(context: RecommendationContext): string {
  return [context.neighborhood, context.price, context.category, context.vibe, context.restaurantCount].join("|");
}

export function restaurantMatchesContext(restaurant: Restaurant, context: RecommendationContext): boolean {
  return (
    (context.neighborhood === "Any" || restaurant.neighborhood === context.neighborhood) &&
    (context.price === "Any" || restaurant.price === context.price) &&
    (context.category === "Any" || restaurant.category === context.category) &&
    (context.vibe === "Any" || restaurant.vibes.includes(context.vibe))
  );
}

export function filterRestaurants(restaurants: Restaurant[], context: RecommendationContext): Restaurant[] {
  const exact = restaurants.filter((restaurant) => restaurantMatchesContext(restaurant, context));
  if (exact.length > 0) return exact;

  return restaurants.filter((restaurant) => {
    const softMatches = [
      context.neighborhood === "Any" || restaurant.neighborhood === context.neighborhood,
      context.price === "Any" || restaurant.price === context.price,
      context.category === "Any" || restaurant.category === context.category,
      context.vibe === "Any" || restaurant.vibes.includes(context.vibe)
    ].filter(Boolean).length;

    return softMatches >= 2;
  });
}

export function buildBanditState(events: RecommendationEvent[], restaurants: Restaurant[], context: RecommendationContext): BanditState {
  const key = contextKey(context);
  const state: BanditState = {};

  for (const restaurant of restaurants) {
    state[restaurant.id] = {
      restaurantId: restaurant.id,
      alpha: 1,
      beta: 1,
      impressions: 0,
      reward: 0
    };
  }

  for (const event of events) {
    if (contextKey(event.context) !== key || !state[event.restaurantId]) continue;
    const arm = state[event.restaurantId];

    if (event.action === "impression") {
      arm.impressions += 1;
      continue;
    }

    arm.reward += event.reward;
    arm.alpha += event.reward;
    arm.beta += 1 - event.reward;
  }

  return state;
}

function seededNoise(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash % 1000) / 1000;
}

export function recommendRestaurant(
  restaurants: Restaurant[],
  events: RecommendationEvent[],
  context: RecommendationContext,
  excludeIds: string[] = []
) {
  const candidates = filterRestaurants(restaurants, context).filter((restaurant) => !excludeIds.includes(restaurant.id));
  const fallbackCandidates = candidates.length > 0 ? candidates : restaurants.filter((restaurant) => !excludeIds.includes(restaurant.id));
  const state = buildBanditState(events, fallbackCandidates, context);
  const timestampSalt = String(events.length + excludeIds.length);

  const scored = fallbackCandidates.map((restaurant) => {
    const arm = state[restaurant.id];
    const posteriorMean = arm.alpha / (arm.alpha + arm.beta);
    const explorationBonus = 0.22 / Math.sqrt(arm.impressions + 1);
    const qualityPrior = (restaurant.rating - 4) / 5 + Math.min(restaurant.reviewCount, 2200) / 22000;
    const sampleApproximation =
      posteriorMean + explorationBonus + qualityPrior * 0.18 + seededNoise(`${restaurant.id}-${timestampSalt}`) * 0.08;

    return {
      restaurant,
      score: sampleApproximation,
      arm
    };
  });

  return scored.sort((a, b) => b.score - a.score)[0];
}

export function recommendRestaurants(
  restaurants: Restaurant[],
  events: RecommendationEvent[],
  context: RecommendationContext,
  count: number,
  excludeIds: string[] = []
) {
  const picks = [];
  const excluded = [...excludeIds];

  for (let index = 0; index < count; index += 1) {
    const pick = recommendRestaurant(restaurants, events, context, excluded);
    if (!pick) break;
    picks.push(pick);
    excluded.push(pick.restaurant.id);
  }

  return picks;
}

export function makeEvent(
  action: keyof typeof rewardByAction,
  userId: string,
  restaurantId: string,
  context: RecommendationContext,
  modelScore: number
): RecommendationEvent {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    userId,
    restaurantId,
    action,
    reward: rewardByAction[action],
    context,
    modelScore
  };
}
