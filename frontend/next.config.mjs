// The site is a static export (plain HTML/JS in out/) so it can be hosted on
// GitHub Pages. Everything talks to Supabase from the browser; there is no
// Node server. On Pages it lives under /<repo-name>, so CI sets
// GITHUB_PAGES=true to add that basePath; local dev stays at "/".
const isGitHubPages = process.env.GITHUB_PAGES === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // /gurukul/ → gurukul/index.html, which GitHub Pages serves for /gurukul/.
  trailingSlash: true,
  // No image-optimisation server on a static host.
  images: { unoptimized: true },
  basePath: isGitHubPages ? "/Practice-Project-Gurukul" : "",
  // Dev server only: allow opening the app from other devices on the LAN.
  // `*` matches one label, so this covers any 192.168.1.x address (DHCP may change it).
  allowedDevOrigins: ["192.168.1.*"],
};

export default nextConfig;
