import { categories, neighborhoods, prices, vibes } from "./options";
import type { Cuisine, Restaurant } from "./types";

const cuisines: Cuisine[] = [
  "Italian",
  "Mexican",
  "Japanese",
  "Thai",
  "Mediterranean",
  "American",
  "Ethiopian",
  "Vietnamese",
  "Indian",
  "French",
  "Korean",
  "Seafood",
  "Cafe",
  "Bar"
];

const nameLeft = [
  "Juniper",
  "River",
  "Market",
  "Lantern",
  "Ember",
  "Ninth",
  "Bainbridge",
  "Cedar",
  "Front",
  "Walnut",
  "Saffron",
  "Mural",
  "Vine",
  "Chestnut",
  "Keystone",
  "Garden",
  "Anchor",
  "Fig",
  "Bluebird",
  "Copper"
];

const nameRight = [
  "Table",
  "Room",
  "House",
  "Kitchen",
  "Bar",
  "Cafe",
  "Counter",
  "Osteria",
  "Cantina",
  "Noodle",
  "Grill",
  "Social",
  "Bistro",
  "Market",
  "Supper",
  "Commons",
  "Diner",
  "Corner",
  "Garden",
  "Exchange"
];

const cuisineDescriptions: Record<Cuisine, string> = {
  Italian: "house pastas, seasonal vegetables, and a wine list built for lingering",
  Mexican: "bright tacos, smoky salsas, and late-night energy",
  Japanese: "precise small plates, bowls, and a calm counter rhythm",
  Thai: "fragrant curries, herbs, and balanced heat",
  Mediterranean: "grilled plates, dips, citrus, herbs, and generous tables",
  American: "comforting classics with a modern neighborhood pulse",
  Ethiopian: "deeply spiced stews, injera, and shareable platters",
  Vietnamese: "noodles, herbs, broths, and crisp sandwiches",
  Indian: "layered spices, tandoor dishes, and rich vegetarian options",
  French: "polished bistro cooking with butter, herbs, and good glassware",
  Korean: "grills, stews, banchan, and a punchy social feel",
  Seafood: "fresh catches, raw bar staples, and coastal cooking",
  Cafe: "espresso, pastries, easy lunches, and laptop-friendly corners",
  Bar: "snacks, cocktails, low lights, and a little noise"
};

const hueByCuisine: Record<Cuisine, string> = {
  Italian: "#c94c3a",
  Mexican: "#e29d35",
  Japanese: "#547f8c",
  Thai: "#5f9b65",
  Mediterranean: "#2f83a0",
  American: "#8a6f4d",
  Ethiopian: "#9f513f",
  Vietnamese: "#3f8d72",
  Indian: "#be6a2f",
  French: "#6d597a",
  Korean: "#b6494a",
  Seafood: "#286f8f",
  Cafe: "#8b6b4f",
  Bar: "#414b64"
};

function pick<T>(items: T[], index: number, offset = 0): T {
  return items[(index + offset) % items.length];
}

export const restaurants: Restaurant[] = Array.from({ length: 100 }, (_, index) => {
  const cuisine = pick(cuisines, index * 3);
  const neighborhood = pick(neighborhoods, index * 7);
  const category = pick(categories, index * 5);
  const price = pick(prices, index + Math.floor(index / 9));
  const primaryVibe = pick(vibes, index * 2);
  const secondaryVibe = pick(vibes, index * 3, 1);
  const name = `${pick(nameLeft, index * 11)} ${pick(nameRight, index * 13)}`;
  const rating = Number((4.05 + ((index * 17) % 86) / 100).toFixed(2));
  const reviewCount = 65 + ((index * 47) % 2200);

  return {
    id: `rest_${String(index + 1).padStart(3, "0")}`,
    name: `${name}${index > 19 ? ` ${Math.floor(index / 20) + 1}` : ""}`,
    neighborhood,
    cuisine,
    category,
    price,
    vibes: primaryVibe === secondaryVibe ? [primaryVibe] : [primaryVibe, secondaryVibe],
    rating,
    reviewCount,
    address: `${100 + ((index * 37) % 1900)} ${pick(["Walnut", "Girard", "Passyunk", "Market", "Frankford", "Spruce"], index)} St`,
    description: `${neighborhood} spot for ${cuisineDescriptions[cuisine]}. Best fit when the brief is ${primaryVibe.toLowerCase()} and ${category.toLowerCase()}.`,
    imageHue: hueByCuisine[cuisine],
    reservationUrl: `https://example.com/reserve/${index + 1}`,
    orderUrl: `https://example.com/order/${index + 1}`,
    googlePlaceId: undefined
  };
});
