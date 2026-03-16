import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
const app = Fastify({ logger: true });

asynch function main(){
	
	await app.register(cors, { origin: true });
	
	app.get("/health", async () => ({ ok: true }));

// --- Projects ---
app.post("/projects", async (req, reply) => {
  const body = z.object({ name: z.string().min(1) }).parse(req.body);
  const project = await prisma.project.create({ data: { name: body.name } });
  reply.code(201).send(project);
});

// --- Nodes ---
app.post("/nodes", async (req, reply) => {
  const body = z
    .object({
      projectId: z.string().uuid(),
      name: z.string().min(1),
      nodeType: z.enum(["CABINET", "SPLICE_CLOSURE", "HANDHOLE", "POLE", "BUILDING"]),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      mileMarker: z.string().optional(),
      notes: z.string().optional(),
    })
    .parse(req.body);

  const node = await prisma.node.create({ data: body });
  reply.code(201).send(node);
});

// --- Cables + auto-generate fibers ---
const fiberColors12 = [
  "Blue",
  "Orange",
  "Green",
  "Brown",
  "Slate",
  "White",
  "Red",
  "Black",
  "Yellow",
  "Violet",
  "Rose",
  "Aqua",
];

function colorForStrand(strandNumber: number) {
  return fiberColors12[(strandNumber - 1) % 12];
}

function bufferForStrand(strandNumber: number) {
  return Math.floor((strandNumber - 1) / 12) + 1;
}

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
      ...body,
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
    include: { fibers: true },
  });

  reply.code(201).send(cable);
});

// --- Trays ---
app.post("/nodes/:nodeId/trays", async (req, reply) => {
  const params = z.object({ nodeId: z.string().uuid() }).parse(req.params);
  const body = z.object({ name: z.string().min(1), notes: z.string().optional() }).parse(req.body);

  const tray = await prisma.spliceTray.create({
    data: { nodeId: params.nodeId, ...body },
  });

  reply.code(201).send(tray);
});

// --- Bulk splices (backbone-to-backbone mapper) ---
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
            // Prisma decimal accepts string/number; keep simple for MVP
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

// --- Trace a fiber through splices (simple graph walk) ---
app.get("/trace/fiber/:fiberId", async (req) => {
  const params = z.object({ fiberId: z.string().uuid() }).parse(req.params);

  const visited = new Set<string>();
  const queue: { fiberId: string; viaSpliceId?: string }[] = [{ fiberId: params.fiberId }];
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
      cable: { id: fiber.cable.id, name: fiber.cable.name, type: fiber.cable.cableType },
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

  return { startFiberId: params.fiberId, hops };
});

const port = Number(process.env.PORT ?? 3001);
app.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
	app.log.error(err);
	process.exit(1);
});
