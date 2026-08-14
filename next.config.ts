import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Lets the dev server be reached from a phone on the same LAN for testing
  // (e.g. http://<mac-lan-ip>:3000). Update this if the Mac's LAN IP changes.
  allowedDevOrigins: ["10.22.243.79"],
};

export default nextConfig;
