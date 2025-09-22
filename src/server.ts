import { app } from "./app";
import { env } from "./env";

app
  .listen({
    port: env.PORT, // usa a porta do Render
    host: "0.0.0.0", // obrigatório no Render
  })
  .then(() => {
    console.log(`HTTP server is running on ${env.PORT}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
