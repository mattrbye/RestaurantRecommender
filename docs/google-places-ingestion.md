# Google Places Ingestion Plan

Use Google Places as an enrichment source, not as the whole product. The app's unique data should come from recommendation events, saves, skips, order clicks, and reservation clicks.

## Recommended Flow

1. Create a Google Cloud project.
2. Enable the Places API.
3. Create an API key and restrict it to the Places API.
4. Set a billing budget and quota limits before running ingestion.
5. Discover candidate restaurants with Text Search or Nearby Search.
6. Store the returned Google `id` as `google_place_id`.
7. Fetch richer details only for restaurants you decide to keep.
8. Upsert results into the `restaurants` table.

## Discovery Request

Use Text Search when you want queries like `restaurants in Fishtown Philadelphia`:

```bash
curl -X POST "https://places.googleapis.com/v1/places:searchText" \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: $GOOGLE_PLACES_API_KEY" \
  -H "X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types" \
  -d '{
    "textQuery": "restaurants in Fishtown Philadelphia",
    "includedType": "restaurant",
    "maxResultCount": 20
  }'
```

Use Nearby Search when you already have neighborhood map bounds or a center point:

```bash
curl -X POST "https://places.googleapis.com/v1/places:searchNearby" \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: $GOOGLE_PLACES_API_KEY" \
  -H "X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types" \
  -d '{
    "includedTypes": ["restaurant"],
    "maxResultCount": 20,
    "locationRestriction": {
      "circle": {
        "center": {
          "latitude": 39.9706,
          "longitude": -75.1347
        },
        "radius": 1400
      }
    }
  }'
```

## Details Request

Once you have a place ID, call Place Details for only the fields you need:

```bash
curl -X GET "https://places.googleapis.com/v1/places/GOOGLE_PLACE_ID" \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: $GOOGLE_PLACES_API_KEY" \
  -H "X-Goog-FieldMask: id,displayName,formattedAddress,location,priceLevel,rating,userRatingCount,regularOpeningHours,websiteUri,nationalPhoneNumber,primaryType,types"
```

## Fields To Map Into This App

- `id` -> `google_place_id`
- `displayName.text` -> `name`
- `formattedAddress` -> `address`
- `location.latitude`, `location.longitude` -> future map fields
- `priceLevel` or `priceRange` -> `price`
- `rating` -> `rating`
- `userRatingCount` -> `review_count`
- `websiteUri` -> `reservation_url` fallback
- `primaryType`, `types` -> `category` and cuisine/tag features
- `regularOpeningHours` -> future availability filters

## Cost Control

Google requires a FieldMask for Places API (New). Keep field masks narrow because billing depends on the fields/SKUs requested. Do not request reviews, photos, AI summaries, or all fields during production ingestion unless you explicitly want those costs.

## Neighborhood Map Upgrade

For the map selector, add a `neighborhoods` table with:

```sql
create table neighborhoods (
  id text primary key,
  name text not null,
  center_lat numeric not null,
  center_lng numeric not null,
  boundary_geojson jsonb not null
);
```

The frontend can render those GeoJSON polygons with Mapbox, Leaflet, or Google Maps. When a user clicks a polygon, set `context.neighborhood` and filter restaurants by that neighborhood.
