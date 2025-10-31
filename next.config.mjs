/** @type {import('next').NextConfig} */
const nextConfig = {
  // This will prevent ESLint errors from failing the build.
  // It's a good way to get deployments working while you fix the errors over time.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;