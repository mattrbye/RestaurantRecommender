-- Postgres-ready schema for the production version.
-- The MVP uses in-browser seeded data, but these tables mirror the app's data model.

create table restaurants (
  id text primary key,
  google_place_id text,
  name text not null,
  neighborhood text not null,
  cuisine text not null,
  category text not null,
  price text not null,
  vibes text[] not null,
  rating numeric,
  review_count integer,
  address text,
  description text,
  image_hue text,
  reservation_url text,
  order_url text,
  created_at timestamptz default now()
);

create table recommendation_events (
  id uuid primary key,
  timestamp timestamptz not null default now(),
  user_id text not null,
  restaurant_id text not null references restaurants(id),
  action text not null,
  reward numeric not null,
  context jsonb not null,
  model_score numeric not null
);

create index recommendation_events_user_idx on recommendation_events(user_id);
create index recommendation_events_restaurant_idx on recommendation_events(restaurant_id);
create index recommendation_events_timestamp_idx on recommendation_events(timestamp);
