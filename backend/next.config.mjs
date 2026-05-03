/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/register", destination: "/api/register" },
      { source: "/login", destination: "/api/login" },
    ];
  },
};

export default nextConfig;

