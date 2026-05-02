import type { RecommendationEvent, Restaurant } from "./types";

export function summarizeEvents(events: RecommendationEvent[]) {
  const responses = events.filter((event) => event.action !== "impression");
  const impressions = events.filter((event) => event.action === "impression").length;
  const totalReward = responses.reduce((sum, event) => sum + event.reward, 0);

  return {
    impressions,
    responses: responses.length,
    skips: responses.filter((event) => event.action === "skip").length,
    saves: responses.filter((event) => event.action === "save").length,
    clicks: responses.filter((event) => event.action === "reserve" || event.action === "order").length,
    rewardRate: responses.length ? totalReward / responses.length : 0
  };
}

export function dailyRewardSeries(events: RecommendationEvent[]) {
  const buckets = new Map<string, { date: string; impressions: number; reward: number; responses: number }>();

  for (const event of events) {
    const date = event.timestamp.slice(5, 10);
    const bucket = buckets.get(date) ?? { date, impressions: 0, reward: 0, responses: 0 };
    if (event.action === "impression") {
      bucket.impressions += 1;
    } else {
      bucket.reward += event.reward;
      bucket.responses += 1;
    }
    buckets.set(date, bucket);
  }

  return Array.from(buckets.values()).map((bucket) => ({
    ...bucket,
    rewardRate: bucket.responses ? Number((bucket.reward / bucket.responses).toFixed(3)) : 0
  }));
}

export function actionBreakdown(events: RecommendationEvent[]) {
  return ["skip", "details", "save", "reserve", "order"].map((action) => ({
    action,
    count: events.filter((event) => event.action === action).length
  }));
}

export function topRestaurants(events: RecommendationEvent[], restaurants: Restaurant[]) {
  const lookup = new Map(restaurants.map((restaurant) => [restaurant.id, restaurant]));
  const buckets = new Map<string, { id: string; name: string; impressions: number; reward: number; responses: number }>();

  for (const event of events) {
    const restaurant = lookup.get(event.restaurantId);
    if (!restaurant) continue;
    const bucket = buckets.get(event.restaurantId) ?? {
      id: event.restaurantId,
      name: restaurant.name,
      impressions: 0,
      reward: 0,
      responses: 0
    };

    if (event.action === "impression") {
      bucket.impressions += 1;
    } else {
      bucket.reward += event.reward;
      bucket.responses += 1;
    }

    buckets.set(event.restaurantId, bucket);
  }

  return Array.from(buckets.values())
    .map((bucket) => ({
      ...bucket,
      rewardRate: bucket.responses ? bucket.reward / bucket.responses : 0
    }))
    .sort((a, b) => b.rewardRate - a.rewardRate || b.impressions - a.impressions)
    .slice(0, 8);
}

export function rewardBySegment(events: RecommendationEvent[], segment: "neighborhood" | "price" | "category" | "vibe" | "restaurantCount") {
  const buckets = new Map<string, { segment: string; reward: number; responses: number }>();

  for (const event of events) {
    if (event.action === "impression") continue;
    const key = String(event.context[segment]);
    const bucket = buckets.get(key) ?? { segment: key, reward: 0, responses: 0 };
    bucket.reward += event.reward;
    bucket.responses += 1;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.values())
    .map((bucket) => ({
      segment: bucket.segment,
      rewardRate: bucket.responses ? Number((bucket.reward / bucket.responses).toFixed(3)) : 0,
      responses: bucket.responses
    }))
    .sort((a, b) => b.rewardRate - a.rewardRate);
}

export function regretSeries(events: RecommendationEvent[]) {
  let cumulativeReward = 0;
  let cumulativeOracle = 0;
  let responseIndex = 0;

  return events
    .filter((event) => event.action !== "impression")
    .map((event) => {
      responseIndex += 1;
      cumulativeReward += event.reward;
      cumulativeOracle += 0.82;
      return {
        trial: responseIndex,
        regret: Number((cumulativeOracle - cumulativeReward).toFixed(2))
      };
    })
    .filter((_, index) => index % 25 === 0);
}
