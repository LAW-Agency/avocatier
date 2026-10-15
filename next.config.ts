import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Indicateur de développement de Next à droite : à gauche, il masquait le compte en bas de la barre latérale de /admin
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;
