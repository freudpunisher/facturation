import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  distDir: path.join(__dirname, ".next-local"), // Change the output directory
};

export default nextConfig;


