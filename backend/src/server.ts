// src/server.ts

import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { z } from "zod";
import { prisma, pool } from "./lib/prisma";
import { colorForStrand, bufferForStrand } from "./lib/fiber";
import { registerSwagger } from "./plugins/swagger";

console.log("SERVER RELOADED", new Date().toISOString());

const app = Fastify({ logger: true });

/** -------------------- ROUTES -------------------- */

app.get(
  "/",
  {
    schema: {
      tags: ["System"],
      summary: "API root",
      response: {
        200: {
          type: "object",
          properties: {
            name: { type: "string" },
            ok: { type: "boolean" },
          },
        },
      },
    },
  },
  async () => {
    return { name: "Fiber Ops API", ok: true };
  }
);

app.get(
  "/health",
  {
    schema: {
      tags: ["System"],
      summary: "Health check",
      response: {
        200: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
          },
        },
      },
    },
  },
  async () => {
    return { ok: true };
  }
);

/** --- Projects --- */
app.post(
  "/projects",
  {
    schema: {
      tags: ["Projects"],
      summary: "Create a new project",
      body: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
        },
      },
      response: {
        201: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
          },
        },
      },
    },
  },
  async (req, reply) => {
    const body = z.object({ name: z.string().min(1) }).parse(req.body);

    const project = await prisma.project.create({
      data: { name: body.name },
    });

    reply.code(201).send(project);
  }
);

app.get(
  "/projects",
  {
    schema: {
      tags: ["Projects"],
      summary: "List projects",
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              createdAt: { type: "string" },
              updatedAt: { type: "string" },
            },
          },
        },
      },
    },
  },
  async () => {
    return prisma.project.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
);

app.delete("/projects/:projectId", async (req, reply) => {
  const params = z.object({ projectId: z.string().uuid() }).parse(req.params);

  try {
    await prisma.project.delete({ where: { id: params.projectId } });
    return reply.code(204).send();
  } catch (err: any) {
    if (err?.code === "P2025") {
      return reply.code(404).send({ ok: false, message: "Project not found" });
    }
    throw err;
  }
});

app.patch("/projects/:projectId", async (req, reply) => {
  const params = z.object({ projectId: z.string().uuid() }).parse(req.params);
  const body = z.object({ name: z.string().min(1) }).parse(req.body);

  try {
    const updated = await prisma.project.update({
      where: { id: params.projectId },
      data: { name: body.name },
    });

    return reply.send(updated);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return reply.code(404).send({ ok: false, message: "Project not found" });
    }
    throw err;
  }
});

app.get("/projects/:projectId/summary", async (req, reply) => {
  const parsed = z.object({ projectId: z.string().uuid() }).safeParse(req.params);

  if (!parsed.success) {
    return reply.code(400).send({ ok: false, message: "Invalid projectId" });
  }

  const { projectId } = parsed.data;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
  });

  if (!project) {
    return reply.code(404).send({ ok: false, message: "Project not found" });
  }

  const [nodes, cables] = await Promise.all([
    prisma.node.findMany({
      where: { projectId },
      orderBy: { name: "asc" },
    }),
    prisma.cable.findMany({
      where: { projectId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        cableType: true,
        fiberCount: true,
        fromNodeId: true,
        toNodeId: true,
        routeNotes: true,
      },
    }),
  ]);

  return reply.send({
    ok: true,
    project,
    nodes,
    cables,
    counts: {
      nodes: nodes.length,
      cables: cables.length,
      totalFibers: cables.reduce((sum, c) => sum + c.fiberCount, 0),
    },
  });
});

/** --- Nodes --- */
const nodeTypeEnum = z.enum([
  "CABINET",
  "SPLICE_CLOSURE",
  "HANDHOLE",
  "POLE",
  "BUILDING",
]);

app.post("/nodes", async (req, reply) => {
  const body = z
    .object({
      projectId: z.string().uuid(),
      name: z.string().min(1),
      nodeType: nodeTypeEnum,
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      mileMarker: z.string().optional(),
      notes: z.string().optional(),
    })
    .parse(req.body);

  const node = await prisma.node.create({
    data: body,
  });

  reply.code(201).send(node);
});

app.get("/nodes", async (req) => {
  const q = z
    .object({
      projectId: z.string().uuid().optional(),
    })
    .safeParse((req as any).query);

  const projectId = q.success ? q.data.projectId : undefined;

  return prisma.node.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { name: "asc" },
  });
});

app.get("/nodes/:nodeId", async (req, reply) => {
  const params = z.object({ nodeId: z.string().uuid() }).parse(req.params);

  const node = await prisma.node.findUnique({
    where: { id: params.nodeId },
  });

  if (!node) {
    return reply.code(404).send({ ok: false, message: "Node not found" });
  }

  const [fromCables, toCables, trays] = await Promise.all([
    prisma.cable.findMany({
      where: { fromNodeId: params.nodeId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        cableType: true,
        fiberCount: true,
        toNodeId: true,
        routeNotes: true,
      },
    }),
    prisma.cable.findMany({
      where: { toNodeId: params.nodeId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        cableType: true,
        fiberCount: true,
        fromNodeId: true,
        routeNotes: true,
      },
    }),
    prisma.spliceTray.findMany({
      where: { nodeId: params.nodeId },
      orderBy: { name: "asc" },
    }),
  ]);

  return reply.send({
    ok: true,
    node,
    trays,
    cables: {
      outgoing: fromCables,
      incoming: toCables,
    },
  });
});

app.patch("/nodes/:nodeId", async (req, reply) => {
  const params = z.object({ nodeId: z.string().uuid() }).parse(req.params);

  const body = z
    .object({
      name: z.string().min(1).optional(),
      nodeType: nodeTypeEnum.optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      mileMarker: z.string().optional(),
      notes: z.string().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, {
      message: "At least one field must be provided",
    })
    .parse(req.body);

  try {
    const updated = await prisma.node.update({
      where: { id: params.nodeId },
      data: body,
    });

    return reply.send(updated);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return reply.code(404).send({ ok: false, message: "Node not found" });
    }
    throw err;
  }
});

app.delete("/nodes/:nodeId", async (req, reply) => {
  const params = z.object({ nodeId: z.string().uuid() }).parse(req.params);

  try {
    await prisma.node.delete({ where: { id: params.nodeId } });
    return reply.code(204).send();
  } catch (err: any) {
    if (err?.code === "P2025") {
      return reply.code(404).send({ ok: false, message: "Node not found" });
    }
    if (err?.code === "P2003") {
      return reply.code(409).send({
        ok: false,
        message:
          "Node is referenced by other records (cables/trays). Remove dependencies first.",
      });
    }
    throw err;
  }
});

/** --- Cables + auto-generate fibers --- */
app.post("/cables", async (req, reply) => {
  const body = z
    .object({
      projectId: z.string().uuid(),
      name: z.string().min(1),
      cableType: z.enum(["BACKBONE", "SPUR", "DROP"]),
      fiberCount: z.number().int().positive(),
      fromNodeId: z.string().uuid().optional(),
      toNodeId: z.string().uuid().optional(),
      routeNotes: z.string().optional(),
    })
    .parse(req.body);

  const cable = await prisma.cable.create({
    data: {
      projectId: body.projectId,
      name: body.name,
      cableType: body.cableType,
      fiberCount: body.fiberCount,
      fromNodeId: body.fromNodeId,
      toNodeId: body.toNodeId,
      routeNotes: body.routeNotes,
      fibers: {
        create: Array.from({ length: body.fiberCount }, (_, i) => {
          const strand = i + 1;
          return {
            strandNumber: strand,
            bufferNumber: bufferForStrand(strand),
            color: colorForStrand(strand),
          };
        }),
      },
    },
    select: {
      id: true,
      projectId: true,
      name: true,
      cableType: true,
      fiberCount: true,
      fromNodeId: true,
      toNodeId: true,
      routeNotes: true,
    },
  });

  reply.code(201).send(cable);
});

app.get("/cables", async (req) => {
  const q = z
    .object({
      projectId: z.string().uuid().optional(),
    })
    .safeParse((req as any).query);

  const projectId = q.success ? q.data.projectId : undefined;

  return prisma.cable.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { name: "asc" },
    include: { fibers: false },
  });
});

app.patch("/cables/:cableId", async (req, reply) => {
  const params = z.object({ cableId: z.string().uuid() }).parse(req.params);

  const body = z
    .object({
      name: z.string().min(1).optional(),
      cableType: z.enum(["BACKBONE", "SPUR", "DROP"]).optional(),
      fromNodeId: z.string().uuid().optional(),
      toNodeId: z.string().uuid().optional(),
      routeNotes: z.string().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, {
      message: "At least one field must be provided",
    })
    .parse(req.body);

  try {
    const updated = await prisma.cable.update({
      where: { id: params.cableId },
      data: body,
      select: {
        id: true,
        projectId: true,
        name: true,
        cableType: true,
        fiberCount: true,
        fromNodeId: true,
        toNodeId: true,
        routeNotes: true,
      },
    });

    return reply.send(updated);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return reply.code(404).send({
        ok: false,
        message: "Cable not found",
      });
    }

    throw err;
  }
});

app.get("/cables/:cableId/fibers", async (req, reply) => {
  const parsed = z.object({ cableId: z.string().uuid() }).safeParse(req.params);

  if (!parsed.success) {
    return reply.code(400).send({ ok: false, message: "Invalid cableId" });
  }

  const { cableId } = parsed.data;

  return prisma.fiber.findMany({
    where: { cableId },
    orderBy: { strandNumber: "asc" },
    select: {
      id: true,
      strandNumber: true,
      bufferNumber: true,
      color: true,
      status: true,
    },
  });
});

app.delete("/cables/:cableId", async (req, reply) => {
  const params = z.object({ cableId: z.string().uuid() }).parse(req.params);

  try {
    await prisma.cable.delete({
      where: { id: params.cableId },
    });

    return reply.code(204).send();
  } catch (err: any) {
    if (err?.code === "P2025") {
      return reply.code(404).send({
        ok: false,
        message: "Cable not found",
      });
    }

    throw err;
  }
});

/** --- Trays (SpliceTray) --- */
app.post("/nodes/:nodeId/trays", async (req, reply) => {
  const params = z.object({ nodeId: z.string().uuid() }).parse(req.params);
  const body = z
    .object({
      name: z.string().min(1),
      notes: z.string().optional(),
    })
    .parse(req.body);

  const tray = await prisma.spliceTray.create({
    data: { nodeId: params.nodeId, ...body },
  });

  reply.code(201).send(tray);
});

app.get("/nodes/:nodeId/trays", async (req, reply) => {
  const parsed = z.object({ nodeId: z.string().uuid() }).safeParse(req.params);
  if (!parsed.success) {
    return reply.code(400).send({ ok: false, message: "Invalid nodeId" });
  }

  const { nodeId } = parsed.data;

  return prisma.spliceTray.findMany({
    where: { nodeId },
    orderBy: { name: "asc" },
  });
});

/** --- Bulk splices --- */
app.post("/trays/:trayId/splices/bulk", async (req, reply) => {
  const params = z.object({ trayId: z.string().uuid() }).parse(req.params);
  const body = z
    .object({
      splices: z
        .array(
          z.object({
            aFiberId: z.string().uuid(),
            bFiberId: z.string().uuid(),
            position: z.string().optional(),
            spliceType: z.enum(["FUSION", "MECH"]).optional(),
            lossDb: z.number().optional(),
            notes: z.string().optional(),
          })
        )
        .min(1),
    })
    .parse(req.body);

  const created = await prisma.$transaction(async (tx) => {
    const rows = [];
    for (const s of body.splices) {
      rows.push(
        await tx.splice.create({
          data: {
            trayId: params.trayId,
            aFiberId: s.aFiberId,
            bFiberId: s.bFiberId,
            position: s.position,
            spliceType: s.spliceType ?? "FUSION",
            lossDb: s.lossDb !== undefined ? (s.lossDb as any) : undefined,
            notes: s.notes,
          },
        })
      );
    }
    return rows;
  });

  reply.code(201).send({ count: created.length, splices: created });
});

/** --- Trace a fiber through splices (simple graph walk) --- */
app.get("/trace/fiber/:fiberId", async (req, reply) => {
  const parsed = z.object({ fiberId: z.string().uuid() }).safeParse(req.params);

  if (!parsed.success) {
    return reply.code(400).send({ ok: false, message: "Invalid fiberId" });
  }

  const { fiberId } = parsed.data;

  const visited = new Set<string>();
  const queue: { fiberId: string; viaSpliceId?: string }[] = [{ fiberId }];
  const hops: any[] = [];

  while (queue.length > 0 && hops.length < 200) {
    const cur = queue.shift()!;
    if (visited.has(cur.fiberId)) continue;
    visited.add(cur.fiberId);

    const fiber = await prisma.fiber.findUnique({
      where: { id: cur.fiberId },
      include: { cable: true },
    });
    if (!fiber) break;

    hops.push({
      fiberId: fiber.id,
      cable: {
        id: fiber.cable.id,
        name: fiber.cable.name,
        type: fiber.cable.cableType,
      },
      strandNumber: fiber.strandNumber,
      bufferNumber: fiber.bufferNumber,
      color: fiber.color,
      viaSpliceId: cur.viaSpliceId ?? null,
    });

    const splices = await prisma.splice.findMany({
      where: { OR: [{ aFiberId: fiber.id }, { bFiberId: fiber.id }] },
      orderBy: { createdAt: "asc" },
    });

    for (const sp of splices) {
      const nextFiberId = sp.aFiberId === fiber.id ? sp.bFiberId : sp.aFiberId;
      if (!visited.has(nextFiberId)) {
        queue.push({ fiberId: nextFiberId, viaSpliceId: sp.id });
      }
    }
  }

  return reply.send({ startFiberId: fiberId, hops });
});

/** -------------------- STARTUP / SHUTDOWN -------------------- */

async function start() {
  await registerSwagger(app);

  const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked origin: ${origin}`), false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  const port = Number(process.env.PORT ?? 3001);

  await app.listen({
    port,
    host: "0.0.0.0",
  });

  app.log.info("🔥 Fiber Ops backend online");
}

function shutdown(signal: string) {
  app.log.info({ signal }, "Shutting down...");
  Promise.resolve()
    .then(() => prisma.$disconnect())
    .then(() => pool.end())
    .then(() => app.close())
    .finally(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start().catch((err) => {
  app.log.error(err);
  process.exit(1);
});