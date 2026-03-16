// src/app/projects/[id]/page.tsx
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
  params: { id: string };
}) {
  const { id } = params;

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
  } catch (e: any) {
    error = e?.message ?? "Failed to load project";
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="w-full max-w-4xl mx-auto p-12">
        <Link href="/" className="text-sm opacity-70 hover:underline">
          ← Back
        </Link>

        {error && (
          <div className="mt-6 rounded border p-3 text-red-500 dark:border-white/20">
            {error}
          </div>
        )}

        {!error && data?.project && data?.counts && (
          <>
            <h1 className="mt-4 text-3xl font-semibold text-black dark:text-white">
              {data.project.name}
            </h1>

            <div className="mt-2 text-xs opacity-60">
              Created: {new Date(data.project.createdAt).toLocaleString()}
            </div>

            <div className="mt-4 rounded border p-3 dark:border-white/20 text-sm">
              <div>Nodes: {data.counts.nodes}</div>
              <div>Cables: {data.counts.cables}</div>
              <div>Total fibers: {data.counts.totalFibers}</div>
            </div>

            {/* Nodes UI (Create + List + Delete) */}
            <div className="mt-8">
              <NodePanel projectId={data.project.id} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}