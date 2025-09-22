import fastify from "fastify";
import cookie from "@fastify/cookie";
import { transactionsRoutes } from "./routes/transactions";

export const app = fastify();

app.register(cookie);
app.register(transactionsRoutes, {
  // Esse register, esta "puxando" as rotas la de transactions.ts
  prefix: "transactions",
});

app.get("/", async () => {
  return { ok: true };
});
