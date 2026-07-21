import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Railway corre la app como servidor persistente con `next start`,
  // que ya respeta la variable PORT que inyecta Railway.
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
