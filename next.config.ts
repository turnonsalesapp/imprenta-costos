import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Railway corre la app como servidor persistente con `next start`,
  // que ya respeta la variable PORT que inyecta Railway.
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    // La página de Migración sube los JSON de Trello (varios MB) por Server Action;
    // el límite por defecto (1 MB) no alcanza.
    serverActions: { bodySizeLimit: "25mb" },
  },
};

export default nextConfig;
