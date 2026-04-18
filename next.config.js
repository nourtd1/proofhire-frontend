/** @type {import('next').NextConfig} */
const nextConfig = {
  // Autoriser les images externes si nécessaire
  images: {
    domains: [],
  },
  // Variables d'environnement exposées au client
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  // Optimisations production
  swcMinify: true,
  compress: true,
}

module.exports = nextConfig
