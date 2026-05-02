"use client";

import Link from "next/link";
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
import { ArrowLeft, BarChart3, Heart, MousePointerClick, Sparkles, Utensils } from "lucide-react";
import { actionBreakdown, dailyRewardSeries, regretSeries, rewardBySegment, summarizeEvents, topRestaurants } from "@/lib/analytics";
import { restaurants } from "@/lib/restaurants";
import { simulateEvents } from "@/lib/simulator";
import type { RecommendationEvent } from "@/lib/types";

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
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

export default function DashboardPage() {
  const seededEvents = useMemo(() => simulateEvents(restaurants, 850, 75), []);
  const [events, setEvents] = useState<RecommendationEvent[]>(seededEvents);
  const [databaseStatus, setDatabaseStatus] = useState<"demo" | "connected" | "error">("demo");

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

  const summary = summarizeEvents(events);
  const rewardTrend = dailyRewardSeries(events);
  const actions = actionBreakdown(events);
  const top = topRestaurants(events, restaurants);
  const neighborhoodRewards = rewardBySegment(events, "neighborhood").slice(0, 8);
  const countRewards = rewardBySegment(events, "restaurantCount").sort((a, b) => Number(a.segment) - Number(b.segment));
  const regrets = regretSeries(events);

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
              <p className="text-xs font-medium text-slate-500">{databaseStatus === "connected" ? "Supabase analytics" : "Simulated analytics"}</p>
            </div>
          </div>
          <Link className="flex h-10 items-center gap-2 rounded-md bg-ink px-3 text-sm font-bold text-white transition hover:bg-basil" href="/">
            <ArrowLeft className="h-4 w-4" />
            Recommender
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-8">
        <section>
          <p className="text-sm font-bold uppercase tracking-wide text-basil">Model Dashboard</p>
          <h1 className="mt-2 text-4xl font-black leading-tight text-ink md:text-5xl">Recommendation performance.</h1>
        </section>

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

        <div className="grid gap-5 lg:grid-cols-2">
          <ChartPanel title="Reward By Number Of Picks">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countRewards}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="segment" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="rewardRate" fill="#f5b841" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

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
        </div>

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
      </div>
    </main>
  );
}
