const port = process.env.PORT || 10000;

module.exports = {
  apps: [
    {
      name: "web",
      script: "node_modules/next/dist/bin/next",
      args: ["start", "-p", String(port)],
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "worker",
      // ts dosyas?n? tsx loader ile direkt ?al??t?r?yoruz
      script: "node",
      args: ["--loader", "tsx", "./worker/src/index.ts"],
      env: {
        NODE_ENV: "production",
        // Render'da ENV'den al; yoksa 5dk
        WORKER_INTERVAL_MS: process.env.WORKER_INTERVAL_MS || "300000"
      }
    }
  ]
};
