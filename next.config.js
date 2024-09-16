const path = require("path");

module.exports = {
  webpack(config) {
    config.module.rules.push({
      test: /\.(mov|mp4)$/i,
      use: [
        {
          loader: "file-loader",
          options: {
            publicPath: "/_next",
            name: "static/media/[name].[hash].[ext]",
          },
        },
      ],
    });

    return config;
  },
};
