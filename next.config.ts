import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Ensure assets are served correctly when accessed via IP addresses
  // Don't use assetPrefix to allow relative paths
  // This ensures CSS and JS load correctly when accessing via IP
  reactStrictMode: true,
  // Ensure webpack doesn't hardcode localhost in dev mode
  // webpack: (config, { dev, isServer }) => {
  //   if (dev && !isServer) {
  //     // Ensure webpack dev server uses relative paths
  //     config.output = {
  //       ...config.output,
  //       publicPath: '/',
  //     };
  //   }
  //   return config;
  // },
};

export default nextConfig;
