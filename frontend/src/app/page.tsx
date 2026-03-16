"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/config";
import Link from "next/link";

type Project = { id: string; name: string; createdAt: string };

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [renaming, setRenaming] = useState(false);

  async function loadProjects() {
    const res = await fetch(`${API_BASE}/projects`, { cache: "no-store" });
    const data = await res.json();
    setProjects(data);
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function createProject() {
    setError("");
    if (!name.trim()) return setError("Project name required");
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Create failed");
      setName("");
      await loadProjects();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject(id: string) {
    setError("");
    if (!confirm("Delete this project? This cannot be undone.")) return;
    const res = await fetch(`${API_BASE}/projects/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) throw new Error(`Delete failed (${res.status})`);
    await loadProjects();
  }

  function startEdit(p: Project) {
    setEditingId(p.id);
    setEditName(p.name);
  }
  function cancelEdit() {
    setEditingId(null);
    setEditName("");
  }

  async function saveEdit() {
    if (!editingId) return;
    const newName = editName.trim();
    if (!newName) return setError("Project name required");

    setRenaming(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/projects/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) throw new Error(`Rename failed (${res.status})`);
      await loadProjects();
      cancelEdit();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRenaming(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="w-full max-w-3xl p-16">
        <h1 className="text-3xl font-semibold text-black dark:text-white">Fiber Ops</h1>

        <div className="mt-6 flex gap-2">
          <input
            id="projectName"
            name="projectName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New project name"
            className="flex-1 rounded border p-2 bg-transparent"
          />
          <button
            onClick={createProject}
            disabled={saving}
            className="rounded bg-white text-black px-4 py-2"
          >
            {saving ? "Saving..." : "Create"}
          </button>
        </div>

        {error && <p className="text-red-500 mt-2">{error}</p>}

        <div className="mt-10">
          <h2 className="text-xl font-semibold text-black dark:text-white">Projects</h2>

          <ul className="mt-4 space-y-2">
            {projects.map((p) => (
              <li
                key={p.id}
                className="rounded border p-3 dark:border-white/20 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  {editingId === p.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 rounded border p-2 bg-transparent"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                      <button
                        onClick={saveEdit}
                        disabled={renaming}
                        className="rounded bg-white text-black px-3 py-2 text-sm"
                      >
                        {renaming ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={renaming}
                        className="rounded border px-3 py-2 text-sm hover:opacity-80 dark:border-white/20"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <Link
                        href={`/projects/${p.id}`}
                        className="font-semibold truncate hover:underline"
                        title="Open project"
                      >
                        {p.name}
                      </Link>
                      <div className="text-xs opacity-60">
                        {new Date(p.createdAt).toLocaleString()}
                      </div>
                    </>
                  )}
                </div>

                {editingId !== p.id && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(p)}
                      className="rounded border px-3 py-1 text-sm hover:opacity-80 dark:border-white/20"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteProject(p.id)}
                      className="rounded border px-3 py-1 text-sm hover:opacity-80 dark:border-white/20"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}