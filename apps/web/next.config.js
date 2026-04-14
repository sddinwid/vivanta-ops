/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const target = process.env.API_PROXY_TARGET ?? "http://localhost:3001";
    const base = target.replace(/\/+$/, "");
    return [
      {
        source: "/api/v1/:path*",
        destination: `${base}/api/v1/:path*`
      }
    ];
  }
};

module.exports = nextConfig;

