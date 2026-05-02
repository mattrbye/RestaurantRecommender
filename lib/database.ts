import { createClient } from "@supabase/supabase-js";
import type { RecommendationEvent, Restaurant } from "./types";

type RestaurantRow = {
  id: string;
  google_place_id: string | null;
  name: string;
  neighborhood: Restaurant["neighborhood"];
  cuisine: Restaurant["cuisine"];
  category: Restaurant["category"];
  price: Restaurant["price"];
  vibes: Restaurant["vibes"];
  rating: number;
  review_count: number;
  address: string;
  description: string;
  image_hue: string;
  reservation_url: string;
  order_url: string;
};

type EventRow = {
  id: string;
  timestamp: string;
  user_id: string;
  restaurant_id: string;
  action: RecommendationEvent["action"];
  reward: number;
  context: RecommendationEvent["context"];
  model_score: number;
};

function getSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      persistSession: false
    }
  });
}

export function isDatabaseConfigured() {
  return Boolean(getSupabase());
}

export function toRestaurantRow(restaurant: Restaurant): RestaurantRow {
  return {
    id: restaurant.id,
    google_place_id: restaurant.googlePlaceId ?? null,
    name: restaurant.name,
    neighborhood: restaurant.neighborhood,
    cuisine: restaurant.cuisine,
    category: restaurant.category,
    price: restaurant.price,
    vibes: restaurant.vibes,
    rating: restaurant.rating,
    review_count: restaurant.reviewCount,
    address: restaurant.address,
    description: restaurant.description,
    image_hue: restaurant.imageHue,
    reservation_url: restaurant.reservationUrl,
    order_url: restaurant.orderUrl
  };
}

export function fromRestaurantRow(row: RestaurantRow): Restaurant {
  return {
    id: row.id,
    googlePlaceId: row.google_place_id ?? undefined,
    name: row.name,
    neighborhood: row.neighborhood,
    cuisine: row.cuisine,
    category: row.category,
    price: row.price,
    vibes: row.vibes,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    address: row.address,
    description: row.description,
    imageHue: row.image_hue,
    reservationUrl: row.reservation_url,
    orderUrl: row.order_url
  };
}

export function toEventRow(event: RecommendationEvent): EventRow {
  return {
    id: event.id,
    timestamp: event.timestamp,
    user_id: event.userId,
    restaurant_id: event.restaurantId,
    action: event.action,
    reward: event.reward,
    context: event.context,
    model_score: event.modelScore
  };
}

export function fromEventRow(row: EventRow): RecommendationEvent {
  return {
    id: row.id,
    timestamp: row.timestamp,
    userId: row.user_id,
    restaurantId: row.restaurant_id,
    action: row.action,
    reward: Number(row.reward),
    context: row.context,
    modelScore: Number(row.model_score)
  };
}

export async function fetchDatabaseEvents(limit = 5000) {
  const supabase = getSupabase();
  if (!supabase) return { configured: false, events: [] as RecommendationEvent[] };

  const { data, error } = await supabase
    .from("recommendation_events")
    .select("*")
    .order("timestamp", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return { configured: true, events: (data ?? []).map((row) => fromEventRow(row as EventRow)) };
}

export async function insertDatabaseEvents(events: RecommendationEvent[]) {
  const supabase = getSupabase();
  if (!supabase) return { configured: false };

  const { error } = await supabase.from("recommendation_events").insert(events.map(toEventRow));
  if (error) throw error;
  return { configured: true };
}

export async function upsertDatabaseRestaurants(restaurants: Restaurant[]) {
  const supabase = getSupabase();
  if (!supabase) return { configured: false };

  const { error } = await supabase.from("restaurants").upsert(restaurants.map(toRestaurantRow), {
    onConflict: "id"
  });
  if (error) throw error;
  return { configured: true };
}
