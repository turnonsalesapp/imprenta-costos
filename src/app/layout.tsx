import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Costos y precios de producción",
  description: "Sistema de cotización y producción para imprenta",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-VE">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
