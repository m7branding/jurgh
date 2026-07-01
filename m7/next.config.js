/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Zet dit aan voor een volledig statische export (handig om te embedden
  // op WordPress/Webflow of te hosten op een CDN):
  // output: "export",
};

module.exports = nextConfig;
