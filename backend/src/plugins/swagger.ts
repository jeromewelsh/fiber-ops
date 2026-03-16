import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";

export async function registerSwagger(app: FastifyInstance) {
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Fiber Ops API",
        description: "Backend API for Fiber Ops",
        version: "0.1.0",
      },
    },
  });

  await app.register(swaggerUI, {
    routePrefix: "/docs",
  });
}