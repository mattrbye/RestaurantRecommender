import { NextResponse } from "next/server";
import { fetchDatabaseEvents, insertDatabaseEvents } from "@/lib/database";
import type { RecommendationEvent } from "@/lib/types";

export async function GET() {
  try {
    const result = await fetchDatabaseEvents();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        configured: true,
        error: error instanceof Error ? error.message : "Unable to fetch recommendation events."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { events?: RecommendationEvent[] };
    const events = body.events ?? [];

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "Expected a non-empty events array." }, { status: 400 });
    }

    const result = await insertDatabaseEvents(events);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        configured: true,
        error: error instanceof Error ? error.message : "Unable to insert recommendation events."
      },
      { status: 500 }
    );
  }
}
