import type { MetadataRoute } from "next";

import { SEO_TOOL_PAGES } from "@/lib/seo-pages";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const baseRoutes = ["", "/seller-studio", "/pricing", "/login", "/api-docs", "/launch-checklist"].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.7,
  }));

  const toolRoutes = SEO_TOOL_PAGES.map((page) => ({
    url: `${SITE_URL}/${page.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  return [...baseRoutes, ...toolRoutes];
}
