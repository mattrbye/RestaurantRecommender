"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { BarChart3, Coffee, Database, Heart, MapPin, MousePointerClick, RefreshCw, SkipForward, Sparkles, Utensils } from "lucide-react";
import { actionBreakdown, dailyRewardSeries, regretSeries, rewardBySegment, summarizeEvents, topRestaurants } from "@/lib/analytics";
import { makeEvent, recommendRestaurant } from "@/lib/bandit";
import { categories, neighborhoods, prices, vibes } from "@/lib/options";
import { restaurants } from "@/lib/restaurants";
import { simulateEvents } from "@/lib/simulator";
import type { RecommendationContext, RecommendationEvent, RewardAction } from "@/lib/types";

const initialContext: RecommendationContext = {
  neighborhood: "Fishtown",
  price: "$$",
  category: "Dinner",
  vibe: "Lively"
};

const userId = "demo_user";

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

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

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof BarChart3 }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <Icon className="h-4 w-4 text-basil" />
      </div>
      <p className="mt-3 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-ink">{title}</h2>
      <div className="mt-4 h-64">{children}</div>
    </section>
  );
}

export default function Home() {
  const seededEvents = useMemo(() => simulateEvents(restaurants, 850, 75), []);
  const [events, setEvents] = useState<RecommendationEvent[]>(seededEvents);
  const [context, setContext] = useState<RecommendationContext>(initialContext);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [databaseStatus, setDatabaseStatus] = useState<"demo" | "connected" | "error">("demo");
  const recommendation = recommendRestaurant(restaurants, events, context, excludedIds);

  const summary = summarizeEvents(events);
  const rewardTrend = dailyRewardSeries(events);
  const actions = actionBreakdown(events);
  const top = topRestaurants(events, restaurants);
  const neighborhoodRewards = rewardBySegment(events, "neighborhood").slice(0, 8);
  const regrets = regretSeries(events);

  useEffect(() => {
    let isMounted = true;

    async function loadDatabaseEvents() {
      try {
        const response = await fetch("/api/events");
        const result = (await response.json()) as {
          configured?: boolean;
          events?: RecommendationEvent[];
          error?: string;
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

  function logAction(action: RewardAction) {
    if (!recommendation) return;
    const impression = makeEvent("impression", userId, recommendation.restaurant.id, context, recommendation.score);
    const response = makeEvent(action, userId, recommendation.restaurant.id, context, recommendation.score);
    const newEvents = [impression, response];
    setEvents((current) => [...current, ...newEvents]);
    setExcludedIds((current) => (action === "skip" ? [...current, recommendation.restaurant.id] : []));

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

  function resetRecommendation() {
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
              <p className="text-xs font-medium text-slate-500">Contextual bandit restaurant discovery</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 md:flex">
            <Database className={`h-4 w-4 ${databaseStatus === "error" ? "text-tomato" : "text-basil"}`} />
            {databaseStatus === "connected" ? "Supabase connected" : databaseStatus === "error" ? "Database fallback" : "Demo data mode"}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 xl:grid-cols-[0.95fr_1.25fr]">
        <section className="grid content-start gap-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-basil">Recommendation Engine</p>
            <h1 className="mt-2 text-4xl font-black leading-tight text-ink md:text-5xl">Find the next best Philly table.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Pick a context, get a restaurant, and let each skip, save, or click update the learning loop.
            </p>
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectControl label="Neighborhood" value={context.neighborhood} options={neighborhoods} onChange={(value) => setContext({ ...context, neighborhood: value })} />
              <SelectControl label="Price" value={context.price} options={prices} onChange={(value) => setContext({ ...context, price: value })} />
              <SelectControl label="Category" value={context.category} options={categories} onChange={(value) => setContext({ ...context, category: value })} />
              <SelectControl label="Vibe" value={context.vibe} options={vibes} onChange={(value) => setContext({ ...context, vibe: value })} />
            </div>
          </section>

          {recommendation ? (
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
              <div
                className="min-h-44 p-6 text-white"
                style={{
                  background: `linear-gradient(135deg, ${recommendation.restaurant.imageHue}, #1b1f2a)`
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide opacity-80">{recommendation.restaurant.neighborhood}</p>
                    <h2 className="mt-2 text-3xl font-black">{recommendation.restaurant.name}</h2>
                  </div>
                  <div className="rounded-md bg-white/18 px-3 py-2 text-sm font-bold backdrop-blur">{recommendation.restaurant.price}</div>
                </div>
                <p className="mt-6 max-w-xl text-sm leading-6 opacity-90">{recommendation.restaurant.description}</p>
              </div>

              <div className="grid gap-4 p-5">
                <div className="flex flex-wrap gap-2">
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
                  <button title="Skip" className="flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 font-bold text-slate-700 transition hover:border-tomato hover:text-tomato" onClick={() => logAction("skip")}>
                    <SkipForward className="h-4 w-4" />
                    Skip
                  </button>
                  <button title="View details" className="flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 font-bold text-slate-700 transition hover:border-plum hover:text-plum" onClick={() => logAction("details")}>
                    <MousePointerClick className="h-4 w-4" />
                    Details
                  </button>
                  <button title="Save" className="flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 font-bold text-slate-700 transition hover:border-tomato hover:text-tomato" onClick={() => logAction("save")}>
                    <Heart className="h-4 w-4" />
                    Save
                  </button>
                  <button title="Reserve" className="flex h-11 items-center justify-center gap-2 rounded-md bg-basil font-bold text-white transition hover:bg-ink" onClick={() => logAction("reserve")}>
                    <Sparkles className="h-4 w-4" />
                    Reserve
                  </button>
                  <button title="Order" className="flex h-11 items-center justify-center gap-2 rounded-md bg-marigold font-bold text-ink transition hover:bg-tomato hover:text-white" onClick={() => logAction("order")}>
                    <Coffee className="h-4 w-4" />
                    Order
                  </button>
                </div>

                <button className="flex h-10 items-center justify-center gap-2 rounded-md bg-slatewash text-sm font-bold text-slate-700 transition hover:bg-slate-200" onClick={resetRecommendation}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh recommendation set
                </button>
              </div>
            </section>
          ) : null}
        </section>

        <section className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Impressions" value={summary.impressions.toLocaleString()} icon={BarChart3} />
            <Metric label="Reward Rate" value={formatPercent(summary.rewardRate)} icon={Sparkles} />
            <Metric label="Saves" value={summary.saves.toLocaleString()} icon={Heart} />
            <Metric label="Clicks" value={summary.clicks.toLocaleString()} icon={MousePointerClick} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <ChartPanel title="Reward Rate Over Time">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rewardTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="rewardRate" stroke="#2d6a4f" fill="#2d6a4f" fillOpacity={0.18} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel title="Action Mix">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="action" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#d1493f" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>
          </div>

          <ChartPanel title="Synthetic Regret Curve">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={regrets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="trial" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="regret" stroke="#6d597a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-ink">Top Restaurants</h2>
              <div className="mt-4 grid gap-3">
                {top.map((restaurant, index) => (
                  <div key={restaurant.id} className="flex items-center justify-between gap-4 rounded-md bg-slatewash px-3 py-3">
                    <div>
                      <p className="text-sm font-bold text-ink">
                        {index + 1}. {restaurant.name}
                      </p>
                      <p className="text-xs font-medium text-slate-500">{restaurant.impressions} impressions</p>
                    </div>
                    <p className="text-sm font-black text-basil">{formatPercent(restaurant.rewardRate)}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-ink">Reward By Neighborhood</h2>
              <div className="mt-4 grid gap-3">
                {neighborhoodRewards.map((segment) => (
                  <div key={segment.segment} className="grid gap-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-ink">{segment.segment}</span>
                      <span className="font-black text-basil">{formatPercent(segment.rewardRate)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slatewash">
                      <div className="h-full rounded-full bg-basil" style={{ width: `${Math.max(5, segment.rewardRate * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
