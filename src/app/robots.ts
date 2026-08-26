import type { MetadataRoute } from "next";

// Admin-only internal tool — nothing here should ever be indexed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
