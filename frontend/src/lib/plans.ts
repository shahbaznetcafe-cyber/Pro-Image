export type PlanId = "free" | "starter" | "pro" | "agency";

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  imagesPerMonth: number;
  badge: string;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "Rs. 0",
    imagesPerMonth: 150,
    badge: "5 images/day",
    features: ["Single image upload", "Basic resize/compress", "Watermark"],
  },
  {
    id: "starter",
    name: "Starter",
    price: "Rs. 799/mo",
    imagesPerMonth: 500,
    badge: "ZIP download",
    features: ["500 images/month", "No watermark", "Seller ZIP packs"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "Rs. 1499/mo",
    imagesPerMonth: 3000,
    badge: "Best for sellers",
    features: ["Batch processing", "All packs", "Priority workflow"],
  },
  {
    id: "agency",
    name: "Agency",
    price: "Rs. 2999/mo",
    imagesPerMonth: 10000,
    badge: "Client work",
    features: ["Branding", "High limits", "Team features later"],
  },
];

export function getPlan(planId?: string | null) {
  return PLANS.find((plan) => plan.id === planId) ?? PLANS[0];
}
