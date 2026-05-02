import { NextResponse } from "next/server";
import { upsertDatabaseRestaurants, insertDatabaseEvents } from "@/lib/database";
import { restaurants } from "@/lib/restaurants";
import { simulateEvents } from "@/lib/simulator";

export async function POST() {
  if (process.env.ALLOW_DATABASE_SEED !== "true") {
    return NextResponse.json(
      {
        error: "Database seeding is disabled. Set ALLOW_DATABASE_SEED=true for local/dev seeding."
      },
      { status: 403 }
    );
  }

  try {
    const restaurantResult = await upsertDatabaseRestaurants(restaurants);
    if (!restaurantResult.configured) {
      return NextResponse.json({ configured: false, seeded: false });
    }

    const events = simulateEvents(restaurants, 850, 75);
    await insertDatabaseEvents(events);

    return NextResponse.json({
      configured: true,
      seeded: true,
      restaurants: restaurants.length,
      events: events.length
    });
  } catch (error) {
    return NextResponse.json(
      {
        configured: true,
        error: error instanceof Error ? error.message : "Unable to seed Supabase."
      },
      { status: 500 }
    );
  }
}
