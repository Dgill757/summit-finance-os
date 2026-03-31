/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'plaid-merchant-logos.plaid.com' },
      { protocol: 'https', hostname: 'logo.clearbit.com' },
    ],
  },
  turbopack: {
    root: __dirname,
  },
}

module.exports = nextConfig
