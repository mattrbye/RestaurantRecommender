"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, Coffee, Database, Heart, MapPin, MousePointerClick, RefreshCw, SkipForward, Sparkles, Utensils } from "lucide-react";
import { makeEvent, recommendRestaurants } from "@/lib/bandit";
import { categories, neighborhoods, prices, vibes } from "@/lib/options";
import { restaurants } from "@/lib/restaurants";
import { simulateEvents } from "@/lib/simulator";
import type { RecommendationContext, RecommendationEvent, RewardAction } from "@/lib/types";

const initialContext: RecommendationContext = {
  neighborhood: "Fishtown",
  price: "$$",
  category: "Dinner",
  vibe: "Lively",
  restaurantCount: 1
};

const userId = "demo_user";
const restaurantCountOptions = [1, 2, 3, 5];

function SelectControl<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T | "Any";
  options: T[];
  onChange: (value: T | "Any") => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-ink">
      {label}
      <select
        className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-ink shadow-sm outline-none transition focus:border-basil"
        value={value}
        onChange={(event) => onChange(event.target.value as T | "Any")}
      >
        <option value="Any">Any</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function CountControl({
  value,
  onChange
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid gap-2 text-sm font-semibold text-ink">
      Restaurants
      <div className="grid grid-cols-4 gap-2">
        {restaurantCountOptions.map((count) => (
          <button
            key={count}
            className={`h-11 rounded-md border text-sm font-black transition ${
              value === count ? "border-ink bg-ink text-white" : "border-slate-200 bg-white text-slate-700 hover:border-basil"
            }`}
            onClick={() => onChange(count)}
            type="button"
          >
            {count}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const seededEvents = useMemo(() => simulateEvents(restaurants, 850, 75), []);
  const [events, setEvents] = useState<RecommendationEvent[]>(seededEvents);
  const [context, setContext] = useState<RecommendationContext>(initialContext);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [databaseStatus, setDatabaseStatus] = useState<"demo" | "connected" | "error">("demo");
  const recommendations = recommendRestaurants(restaurants, events, context, context.restaurantCount, excludedIds);

  useEffect(() => {
    let isMounted = true;

    async function loadDatabaseEvents() {
      try {
        const response = await fetch("/api/events");
        const result = (await response.json()) as {
          configured?: boolean;
          events?: RecommendationEvent[];
        };

        if (!isMounted) return;
        if (!response.ok) {
          setDatabaseStatus("error");
          return;
        }

        if (result.configured) {
          setDatabaseStatus("connected");
          setEvents(result.events ?? []);
        } else {
          setDatabaseStatus("demo");
        }
      } catch {
        if (isMounted) setDatabaseStatus("demo");
      }
    }

    loadDatabaseEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  function logAction(action: RewardAction, restaurantId: string, modelScore: number) {
    const impressionEvents = recommendations.map((recommendation) =>
      makeEvent("impression", userId, recommendation.restaurant.id, context, recommendation.score)
    );
    const response = makeEvent(action, userId, restaurantId, context, modelScore);
    const newEvents = [...impressionEvents, response];

    setEvents((current) => [...current, ...newEvents]);
    setExcludedIds((current) => (action === "skip" ? [...current, restaurantId] : []));

    if (databaseStatus === "connected") {
      fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ events: newEvents })
      }).catch(() => setDatabaseStatus("error"));
    }
  }

  function resetRecommendations() {
    setExcludedIds([]);
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/82 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-ink text-white">
              <Utensils className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-black text-ink">Philly Picks Lab</p>
              <p className="text-xs font-medium text-slate-500">Restaurant recommendations that learn</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 md:flex">
              <Database className={`h-4 w-4 ${databaseStatus === "error" ? "text-tomato" : "text-basil"}`} />
              {databaseStatus === "connected" ? "Supabase connected" : databaseStatus === "error" ? "Database fallback" : "Demo mode"}
            </div>
            <Link className="flex h-10 items-center gap-2 rounded-md bg-ink px-3 text-sm font-bold text-white transition hover:bg-basil" href="/dashboard">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[0.82fr_1.18fr]">
        <section className="grid content-start gap-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-basil">Philly Restaurant Recommender</p>
            <h1 className="mt-2 text-4xl font-black leading-tight text-ink md:text-5xl">Tell us the night. We’ll pick the tables.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Choose the neighborhood, price, category, vibe, and how many options you want.
            </p>
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectControl label="Neighborhood" value={context.neighborhood} options={neighborhoods} onChange={(value) => setContext({ ...context, neighborhood: value })} />
              <SelectControl label="Price" value={context.price} options={prices} onChange={(value) => setContext({ ...context, price: value })} />
              <SelectControl label="Category" value={context.category} options={categories} onChange={(value) => setContext({ ...context, category: value })} />
              <SelectControl label="Vibe" value={context.vibe} options={vibes} onChange={(value) => setContext({ ...context, vibe: value })} />
              <div className="sm:col-span-2">
                <CountControl value={context.restaurantCount} onChange={(value) => setContext({ ...context, restaurantCount: value })} />
              </div>
            </div>
          </section>

          <button className="flex h-11 items-center justify-center gap-2 rounded-md bg-slatewash text-sm font-bold text-slate-700 transition hover:bg-slate-200" onClick={resetRecommendations}>
            <RefreshCw className="h-4 w-4" />
            Refresh picks
          </button>
        </section>

        <section className="grid content-start gap-4">
          {recommendations.map((recommendation, index) => (
            <article key={recommendation.restaurant.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
              <div
                className="p-5 text-white"
                style={{
                  background: `linear-gradient(135deg, ${recommendation.restaurant.imageHue}, #1b1f2a)`
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide opacity-80">Pick {index + 1}</p>
                    <h2 className="mt-1 text-2xl font-black">{recommendation.restaurant.name}</h2>
                  </div>
                  <div className="rounded-md bg-white/18 px-3 py-2 text-sm font-bold backdrop-blur">{recommendation.restaurant.price}</div>
                </div>
                <p className="mt-4 max-w-2xl text-sm leading-6 opacity-90">{recommendation.restaurant.description}</p>
              </div>

              <div className="grid gap-4 p-5">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-md bg-slatewash px-3 py-1 text-sm font-semibold text-slate-700">{recommendation.restaurant.neighborhood}</span>
                  <span className="rounded-md bg-slatewash px-3 py-1 text-sm font-semibold text-slate-700">{recommendation.restaurant.cuisine}</span>
                  <span className="rounded-md bg-slatewash px-3 py-1 text-sm font-semibold text-slate-700">{recommendation.restaurant.category}</span>
                  {recommendation.restaurant.vibes.map((vibe) => (
                    <span key={vibe} className="rounded-md bg-slatewash px-3 py-1 text-sm font-semibold text-slate-700">
                      {vibe}
                    </span>
                  ))}
                </div>

                <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                  <p>
                    <span className="font-bold text-ink">{recommendation.restaurant.rating}</span> rating
                  </p>
                  <p>
                    <span className="font-bold text-ink">{recommendation.restaurant.reviewCount.toLocaleString()}</span> reviews
                  </p>
                  <p className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-tomato" />
                    {recommendation.restaurant.address}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <button title="Skip" className="flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 font-bold text-slate-700 transition hover:border-tomato hover:text-tomato" onClick={() => logAction("skip", recommendation.restaurant.id, recommendation.score)}>
                    <SkipForward className="h-4 w-4" />
                    Skip
                  </button>
                  <button title="View details" className="flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 font-bold text-slate-700 transition hover:border-plum hover:text-plum" onClick={() => logAction("details", recommendation.restaurant.id, recommendation.score)}>
                    <MousePointerClick className="h-4 w-4" />
                    Details
                  </button>
                  <button title="Save" className="flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 font-bold text-slate-700 transition hover:border-tomato hover:text-tomato" onClick={() => logAction("save", recommendation.restaurant.id, recommendation.score)}>
                    <Heart className="h-4 w-4" />
                    Save
                  </button>
                  <button title="Reserve" className="flex h-11 items-center justify-center gap-2 rounded-md bg-basil font-bold text-white transition hover:bg-ink" onClick={() => logAction("reserve", recommendation.restaurant.id, recommendation.score)}>
                    <Sparkles className="h-4 w-4" />
                    Reserve
                  </button>
                  <button title="Order" className="flex h-11 items-center justify-center gap-2 rounded-md bg-marigold font-bold text-ink transition hover:bg-tomato hover:text-white" onClick={() => logAction("order", recommendation.restaurant.id, recommendation.score)}>
                    <Coffee className="h-4 w-4" />
                    Order
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
