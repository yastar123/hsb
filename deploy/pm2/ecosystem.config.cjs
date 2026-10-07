const path = require("node:path");

module.exports = {
  apps: [
    {
      name: "hsb-trading",
      script: "server/index.js",
      cwd: path.resolve(__dirname, "../.."),
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      env_production: {
        NODE_ENV: "production",
        PORT: "5000",
      },
    },
  ],
};
