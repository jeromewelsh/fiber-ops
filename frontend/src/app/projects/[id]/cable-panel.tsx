"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/config";

type Cable = {
  id: string;
  name: string;
  type: string;
  fiberCount: number;
};

export default function CablePanel({ projectId }: { projectId: string }) {
  const [cables, setCables] = useState<Cable[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("BACKBONE");
  const [fiberCount, setFiberCount] = useState("144");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/summary`, {
        cache: "no-store",
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message);

      setCables(data.cables ?? []);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, [projectId]);

  async function createCable() {
    setError("");
    if (!name.trim()) return setError("Cable name required");

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/cables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          name,
          type,
          fiberCount: Number(fiberCount),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setName("");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCable(id: string) {
    if (!confirm("Delete cable?")) return;

    await fetch(`${API_BASE}/cables/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="mt-8 rounded border p-4 dark:border-white/20">
      <h2 className="text-xl font-semibold">Cables</h2>

      <div className="mt-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Cable name"
          className="flex-1 rounded border p-2 bg-transparent"
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded border p-2 bg-transparent"
        >
          <option>BACKBONE</option>
          <option>SPUR</option>
          <option>DROP</option>
        </select>

        <input
          type="number"
          value={fiberCount}
          onChange={(e) => setFiberCount(e.target.value)}
          className="w-24 rounded border p-2 bg-transparent"
        />

        <button
          onClick={createCable}
          disabled={saving}
          className="rounded bg-white px-4 py-2 text-black"
        >
          Add
        </button>
      </div>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      <div className="mt-4 space-y-2">
        {cables.map((c) => (
          <div
            key={c.id}
            className="flex justify-between rounded border p-2 dark:border-white/20"
          >
            <div>
              <div>{c.name}</div>
              <div className="text-xs opacity-60">
                {c.type} · {c.fiberCount}F
              </div>
            </div>

            <button
              onClick={() => deleteCable(c.id)}
              className="text-sm opacity-70 hover:opacity-100"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}