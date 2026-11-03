import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Reopening a tab within 30 seconds shows it at once. Saving anything still
    // refreshes the pages for the person who saved it.
    staleTimes: { dynamic: 30 },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
