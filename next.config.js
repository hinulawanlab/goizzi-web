const path = require("path");

/** @type {import("next").NextConfig} */
const nextConfig = {
  turbopack: {
    // Keep Turbopack anchored to this app even if parent folders contain lockfiles.
    root: path.resolve(__dirname)
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com"
      }
    ]
  }
};

module.exports = nextConfig;
