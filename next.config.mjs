/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  // Add the rewrites configuration here
  async rewrites() {
    // This setup assumes your actual backend API is running on http://localhost:8000
    // and also expects requests under the /api/ path.
    // Adjust the destination URL as needed.
    return [
      {
        source: '/api/:path*', // Match any path starting with /api/
        destination: 'https://musings-mr.net/api/:path*', // Proxy it to the backend server
      },
      // You can add other rewrite rules here if necessary
    ];
  },
  // Add other configurations here if needed later
};

export default nextConfig;