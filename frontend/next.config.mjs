/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dev server only: allow opening the app from other devices on the LAN.
  // `*` matches one label, so this covers any 192.168.1.x address (DHCP may change it).
  allowedDevOrigins: ["192.168.1.*"],
};

export default nextConfig;
