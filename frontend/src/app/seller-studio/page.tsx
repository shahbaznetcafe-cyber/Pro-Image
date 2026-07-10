import type { Metadata } from "next";

import SellerStudioClient from "./seller-studio-client";

export const metadata: Metadata = {
  title: "Seller Studio",
  description:
    "Clean, center, check, and export product images for Daraz, Google Shopping, TikTok, and marketplaces.",
};

export default function SellerStudioPage() {
  return <SellerStudioClient />;
}
