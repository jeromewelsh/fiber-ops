import { API_BASE } from "@/lib/config";
import Link from "next/link";
import NodePanel from "./node-panel";

type Summary = {
  ok: boolean;
  message?: string;
  project?: { id: string; name: string; createdAt: string };
  counts?: { nodes: number; cables: number; totalFibers: number };
  nodes?: any[];
  cables?: any[];
};

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let data: Summary | null = null;
  let error = "";

  try {
    const res = await fetch(`${API_BASE}/projects/${id}/summary`, {
      cache: "no-store",
    });

    const json = (await res.json()) as Summary;

    if (!res.ok || !json.ok) {
      throw new Error(json.message ?? `Load failed (${res.status})`);
    }

    data = json;
  } catch (err: any) {
    error = err?.message ?? "Failed to load project";
  }

  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/">← Back</Link>
      </div>

      {error ? (
        <div
          style={{
            padding: 12,
            border: "1px solid crimson",
            background: "#ffe6e6",
            color: "#900",
          }}
        >
          Error: {error}
        </div>
      ) : !data ? (
        <p>Loading...</p>
      ) : (
        <>
          <h1 style={{ marginBottom: 8 }}>{data.project?.name}</h1>

          <p style={{ color: "#555", marginBottom: 16 }}>
            Nodes: {data.counts?.nodes ?? 0} | Cables: {data.counts?.cables ?? 0}
            {" | "}Total Fibers: {data.counts?.totalFibers ?? 0}
          </p>

          <NodePanel projectId={id} initialNodes={data.nodes ?? []} />

          <section style={{ marginTop: 32 }}>
            <h2>Cables</h2>
            {!data.cables?.length ? (
              <p>No cables yet.</p>
            ) : (
              <ul>
                {data.cables.map((cable: any) => (
                  <li key={cable.id}>
                    <strong>{cable.name}</strong> — {cable.cableType} — {cable.fiberCount}F
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}