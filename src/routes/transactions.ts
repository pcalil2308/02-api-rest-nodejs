import { FastifyInstance } from "fastify";
import { z } from "zod";
import crypto, { randomUUID } from "node:crypto";
import { knex } from "../database";
import { checkSessionIdExists } from "../middleware/check-session-id-exists";
import { request } from "node:http";

export async function transactionsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request, reply) => {
    console.log(`${request.method} ${request.url}`);
  });
  // Lista todas as transações
  app.get(
    "/",
    {
      preHandler: [checkSessionIdExists], // checa o middleware antes do resto da função (handler)
    },
    async (request, reply) => {
      const { sessionId } = request.cookies;
      const transactions = await knex("transactions")
        .where("session_id", sessionId)
        .select();
      return {
        transactions,
      };
    }
  );

  // Lista uma transação específica
  app.get(
    "/:id",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const getTransactionParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = getTransactionParamsSchema.parse(request.params);
      const { sessionId } = request.cookies;
      const transaction = await knex("transactions")
        .where("id", id)
        .andWhere("session_id", sessionId)
        .first();
      return { transaction };
    }
  );

  // Exibe um resumo da conta do usuário (valor contido nela)
  app.get(
    "/summary",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies;
      const summary = await knex("transactions")
        .where("session_id", sessionId)
        .sum("amount", { as: "amount" })
        .first();

      return { summary };
    }
  );

  // Cria uma transação
  app.post("/", async (request, reply) => {
    const createTransactionsBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    });

    const { title, amount, type } = createTransactionsBodySchema.parse(
      request.body
    );

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      // Se o user não tiver um sessionId, ai tem que criar
      sessionId = randomUUID();
      reply.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // Tempo de expiração de 7 dias
      });
    }

    await knex("transactions").insert({
      id: crypto.randomUUID(),
      title,
      amount: type === "credit" ? amount : amount * -1,
      session_id: sessionId,
    });
    return reply.status(201).send();
  });
}
