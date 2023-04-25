const PerspectivePlugin = require("@finos/perspective-webpack-plugin");

//{ buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, _) => {
    config.plugins.push(new PerspectivePlugin({ inlineWorker: true }));
    return config
  },
}

module.exports = nextConfig
