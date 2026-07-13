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
    price: "$0",
    imagesPerMonth: 150,
    badge: "5 images/day",
    features: ["Single image upload", "Basic resize/compress", "Watermark"],
  },
  {
    id: "starter",
    name: "Starter",
    price: "$6.99/mo",
    imagesPerMonth: 300,
    badge: "ZIP download",
    features: ["300 source images/month", "No watermark", "Seller ZIP packs"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$14.99/mo",
    imagesPerMonth: 1500,
    badge: "Best for sellers",
    features: ["Batch processing", "All packs", "Priority workflow"],
  },
  {
    id: "agency",
    name: "Agency",
    price: "$34.99/mo",
    imagesPerMonth: 5000,
    badge: "Client work",
    features: ["Branding", "High-volume processing", "Saved client presets"],
  },
];

export function getPlan(planId?: string | null) {
  return PLANS.find((plan) => plan.id === planId) ?? PLANS[0];
}
