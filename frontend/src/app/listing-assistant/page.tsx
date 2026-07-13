import type { Metadata } from "next";

import ListingAssistantClient from "./listing-assistant-client";

export const metadata: Metadata = {
  title: "Listing Assistant",
  description:
    "Create product titles, selling bullets, descriptions, alt text, and customer-ready messages.",
};

export default function ListingAssistantPage() {
  return <ListingAssistantClient />;
}
