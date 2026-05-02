export type PriceRange = "$" | "$$" | "$$$" | "$$$$";

export type Neighborhood =
  | "Rittenhouse"
  | "Center City"
  | "Fishtown"
  | "Northern Liberties"
  | "South Philly"
  | "University City"
  | "Old City"
  | "Fairmount"
  | "Passyunk"
  | "Manayunk";

export type Category =
  | "Dinner"
  | "Drinks"
  | "Coffee"
  | "Brunch"
  | "Quick Bite"
  | "Date Night";

export type Vibe =
  | "Cozy"
  | "Lively"
  | "Trendy"
  | "Quiet"
  | "Classic"
  | "Adventurous";

export type Cuisine =
  | "Italian"
  | "Mexican"
  | "Japanese"
  | "Thai"
  | "Mediterranean"
  | "American"
  | "Ethiopian"
  | "Vietnamese"
  | "Indian"
  | "French"
  | "Korean"
  | "Seafood"
  | "Cafe"
  | "Bar";

export type Restaurant = {
  id: string;
  name: string;
  neighborhood: Neighborhood;
  cuisine: Cuisine;
  category: Category;
  price: PriceRange;
  vibes: Vibe[];
  rating: number;
  reviewCount: number;
  address: string;
  description: string;
  imageHue: string;
  reservationUrl: string;
  orderUrl: string;
  googlePlaceId?: string;
};

export type RecommendationContext = {
  neighborhood: Neighborhood | "Any";
  price: PriceRange | "Any";
  category: Category | "Any";
  vibe: Vibe | "Any";
};

export type RewardAction = "impression" | "skip" | "details" | "save" | "reserve" | "order";

export type RecommendationEvent = {
  id: string;
  timestamp: string;
  userId: string;
  restaurantId: string;
  action: RewardAction;
  reward: number;
  context: RecommendationContext;
  modelScore: number;
};

export type BanditArm = {
  restaurantId: string;
  alpha: number;
  beta: number;
  impressions: number;
  reward: number;
};

export type BanditState = Record<string, BanditArm>;
