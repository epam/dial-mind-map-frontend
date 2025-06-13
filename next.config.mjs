/** @type {import('next').NextConfig} */
const nextConfig = phase => {
  return {
    output: 'standalone',
    experimental: {
      instrumentationHook: true,
    },
    webpack(config, { isServer }) {
      if (isServer) {
        config.resolve.alias.canvas = false;
      }

      config.experiments = {
        asyncWebAssembly: true,
        layers: true,
      };

      // SVGR config
      const fileLoaderRule = config.module.rules.find(rule => rule.test?.test?.('.svg'));

      config.module.rules.push(
        {
          ...fileLoaderRule,
          test: /\.svg$/i,
          resourceQuery: /url/,
        },
        {
          test: /\.svg$/i,
          issuer: /\.[jt]sx?$/,
          resourceQuery: { not: /url/ },
          use: [
            {
              loader: '@svgr/webpack',
              options: {
                replaceAttrValues: {
                  '#000': 'currentColor',
                },
                typescript: true,
                dimensions: false,
              },
            },
          ],
        },
      );

      fileLoaderRule.exclude = /\.svg$/i;

      config.ignoreWarnings = [
        {
          module: /require-in-the-middle/,
          message:
            /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
        },
      ];

      return config;
    },
  };
};

export default nextConfig;
