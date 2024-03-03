/** @type {import('next').NextConfig} */
import pwa from 'next-pwa'

const withPWA = pwa({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development'
})
const nextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
