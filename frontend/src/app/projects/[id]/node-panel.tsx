// src/app/projects/[id]/node-panel.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE } from "@/lib/config";

type NodeType = "CABINET" | "SPLICE_CLOSURE" | "HANDHOLE" | "POLE" | "BUILDING";
type CableType = "BACKBONE" | "SPUR" | "DROP";
type FiberStatus = "DARK" | "LIT" | "RESERVED" | "BROKEN";

type Node = {
  id: string;
  projectId: string;
  name: string;
  nodeType: NodeType;
  createdAt?: string;
  updatedAt?: string;
};

type Cable = {
  id: string;
  name: string;
  cableType: CableType;
  fiberCount: number;
  fromNodeId: string | null;
  toNodeId: string | null;
  routeNotes: string | null;
};

type Fiber = {
  id: string;
  strandNumber: number;
  bufferNumber: number;
  color: string;
  status: FiberStatus;
};

type Summary = {
  ok: boolean;
  message?: string;
  project: { id: string; name: string; createdAt: string };
  nodes: Node[];
  cables: Cable[];
  counts: { nodes: number; cables: number; totalFibers: number };
};

type NodePanelProps = {
  projectId: string;
  initialNodes: Node[];
};

const NODE_TYPES: NodeType[] = [
  "CABINET",
  "HANDHOLE",
  "POLE",
  "BUILDING",
  "SPLICE_CLOSURE",
];

const CABLE_TYPES: CableType[] = ["BACKBONE", "SPUR", "DROP"];
const FIBER_COUNTS = [12, 24, 48, 96, 144] as const;

export default function NodePanel({
  projectId,
  initialNodes,
}: NodePanelProps) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes ?? []);
  const [cables, setCables] = useState<Cable[]>([]);
  const [counts, setCounts] = useState<Summary["counts"]>({
    nodes: initialNodes?.length ?? 0,
    cables: 0,
    totalFibers: 0,
  });

  const [name, setName] = useState("");
  const [nodeType, setNodeType] = useState<NodeType>("CABINET");
  const [savingNode, setSavingNode] = useState(false);

  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editNodeName, setEditNodeName] = useState("");
  const [editNodeType, setEditNodeType] = useState<NodeType>("CABINET");
  const [savingNodeEdit, setSavingNodeEdit] = useState(false);

  const [showCableUI, setShowCableUI] = useState(false);
  const [cableName, setCableName] = useState("");
  const [cableType, setCableType] = useState<CableType>("BACKBONE");
  const [fiberCount, setFiberCount] = useState<(typeof FIBER_COUNTS)[number]>(144);
  const [fromNodeId, setFromNodeId] = useState("");
  const [toNodeId, setToNodeId] = useState("");
  const [routeNotes, setRouteNotes] = useState("");
  const [savingCable, setSavingCable] = useState(false);

  const [editingCableId, setEditingCableId] = useState<string | null>(null);
  const [editCableName, setEditCableName] = useState("");
  const [editCableType, setEditCableType] = useState<CableType>("BACKBONE");
  const [editFromNodeId, setEditFromNodeId] = useState("");
  const [editToNodeId, setEditToNodeId] = useState("");
  const [editRouteNotes, setEditRouteNotes] = useState("");
  const [savingCableEdit, setSavingCableEdit] = useState(false);

  const [confirmAutogen, setConfirmAutogen] = useState(true);

  const [openCableId, setOpenCableId] = useState<string | null>(null);
  const [loadingFibers, setLoadingFibers] = useState(false);
  const [fibers, setFibers] = useState<Fiber[]>([]);
  const [error, setError] = useState("");

  const refreshMs = 3000;
  const timerRef = useRef<number | null>(null);
  const inflightRef = useRef(false);

  const nodeNameById = useMemo(() => {
    const m = new Map<string, string>();
    nodes.forEach((n) => m.set(n.id, n.name));
    return m;
  }, [nodes]);

  const fibersByBuffer = useMemo(() => {
    const groups = new Map<number, Fiber[]>();

    for (const f of fibers) {
      if (!groups.has(f.bufferNumber)) groups.set(f.bufferNumber, []);
      groups.get(f.bufferNumber)!.push(f);
    }

    for (const [, arr] of groups) {
      arr.sort((a, b) => a.strandNumber - b.strandNumber);
    }

    return Array.from(groups.entries()).sort((a, b) => a[0] - b[0]);
  }, [fibers]);

  async function loadSummary(opts?: { quiet?: boolean }) {
    if (inflightRef.current) return;
    inflightRef.current = true;

    if (!opts?.quiet) setError("");

    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/summary`, {
        cache: "no-store",
      });

      const json = (await res.json()) as Summary;

      if (!res.ok || !json.ok) {
        throw new Error(json.message ?? `Load failed (${res.status})`);
      }

      setNodes(json.nodes);
      setCables(json.cables);
      setCounts(json.counts);

      if (json.nodes.length >= 1 && !fromNodeId) setFromNodeId(json.nodes[0].id);
      if (json.nodes.length >= 2 && !toNodeId) setToNodeId(json.nodes[1].id);
      if (json.nodes.length === 1 && !toNodeId) setToNodeId(json.nodes[0].id);
    } catch (e: any) {
      if (!opts?.quiet) setError(e?.message ?? "Failed to load project");
    } finally {
      inflightRef.current = false;
    }
  }

  useEffect(() => {
    setNodes(initialNodes ?? []);
  }, [initialNodes]);

  useEffect(() => {
    loadSummary().catch(() => {});

    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      loadSummary({ quiet: true }).catch(() => {});
    }, refreshMs);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function createNode() {
    setError("");

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Node name required");
      return;
    }

    setSavingNode(true);
    try {
      const res = await fetch(`${API_BASE}/nodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, name: trimmed, nodeType }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Create node failed (${res.status}) ${text}`);
      }

      setName("");
      setNodeType("CABINET");
      await loadSummary();
    } catch (e: any) {
      setError(e?.message ?? "Create node failed");
    } finally {
      setSavingNode(false);
    }
  }

  async function deleteNode(id: string) {
    setError("");

    const ok = confirm(
      "Delete this node? (If cables/trays reference it, delete will fail.)"
    );
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/nodes/${id}`, {
        method: "DELETE",
      });

      if (!res.ok && res.status !== 204) {
        const text = await res.text().catch(() => "");
        throw new Error(`Delete node failed (${res.status}) ${text}`);
      }

      if (editingNodeId === id) {
        cancelEditNode();
      }

      await loadSummary();
    } catch (e: any) {
      setError(e?.message ?? "Delete node failed");
    }
  }

  function startEditNode(node: Node) {
    setEditingNodeId(node.id);
    setEditNodeName(node.name);
    setEditNodeType(node.nodeType);
    setError("");
  }

  function cancelEditNode() {
    setEditingNodeId(null);
    setEditNodeName("");
    setEditNodeType("CABINET");
  }

  async function saveNodeEdit() {
    if (!editingNodeId) return;

    const trimmed = editNodeName.trim();
    if (!trimmed) {
      setError("Node name required");
      return;
    }

    setSavingNodeEdit(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/nodes/${editingNodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          nodeType: editNodeType,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Update node failed (${res.status}) ${text}`);
      }

      await loadSummary();
      cancelEditNode();
    } catch (e: any) {
      setError(e?.message ?? "Update node failed");
    } finally {
      setSavingNodeEdit(false);
    }
  }

  async function createCable() {
    setError("");

    const nm = cableName.trim();
    if (!nm) {
      setError("Cable name required (must be unique per project)");
      return;
    }

    if (!fromNodeId || !toNodeId) {
      setError("Pick both From and To nodes");
      return;
    }

    if (fromNodeId === toNodeId) {
      setError("From and To nodes must be different");
      return;
    }

    if (confirmAutogen) {
      const ok = confirm(
        `This will create the cable AND auto-generate ${fiberCount} fibers.\n\nProceed?`
      );
      if (!ok) return;
    }

    setSavingCable(true);
    try {
      const res = await fetch(`${API_BASE}/cables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          name: nm,
          cableType,
          fiberCount,
          fromNodeId,
          toNodeId,
          routeNotes: routeNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Create cable failed (${res.status}) ${text}`);
      }

      setCableName("");
      setCableType("BACKBONE");
      setFiberCount(144);
      setRouteNotes("");
      setShowCableUI(false);

      await loadSummary();
    } catch (e: any) {
      setError(e?.message ?? "Create cable failed");
    } finally {
      setSavingCable(false);
    }
  }

  async function deleteCable(id: string) {
    setError("");

    const ok = confirm("Delete this cable?");
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/cables/${id}`, {
        method: "DELETE",
      });

      if (!res.ok && res.status !== 204) {
        const text = await res.text().catch(() => "");
        throw new Error(`Delete cable failed (${res.status}) ${text}`);
      }

      if (openCableId === id) {
        closeFiberPanel();
      }

      if (editingCableId === id) {
        cancelEditCable();
      }

      await loadSummary();
    } catch (e: any) {
      setError(e?.message ?? "Delete cable failed");
    }
  }

  function startEditCable(cable: Cable) {
    setEditingCableId(cable.id);
    setEditCableName(cable.name);
    setEditCableType(cable.cableType);
    setEditFromNodeId(cable.fromNodeId ?? "");
    setEditToNodeId(cable.toNodeId ?? "");
    setEditRouteNotes(cable.routeNotes ?? "");
    setError("");
  }

  function cancelEditCable() {
    setEditingCableId(null);
    setEditCableName("");
    setEditCableType("BACKBONE");
    setEditFromNodeId("");
    setEditToNodeId("");
    setEditRouteNotes("");
  }

  async function saveCableEdit() {
    if (!editingCableId) return;

    const trimmed = editCableName.trim();
    if (!trimmed) {
      setError("Cable name required");
      return;
    }

    if (!editFromNodeId || !editToNodeId) {
      setError("Pick both From and To nodes");
      return;
    }

    if (editFromNodeId === editToNodeId) {
      setError("From and To nodes must be different");
      return;
    }

    setSavingCableEdit(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/cables/${editingCableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          cableType: editCableType,
          fromNodeId: editFromNodeId,
          toNodeId: editToNodeId,
          routeNotes: editRouteNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Update cable failed (${res.status}) ${text}`);
      }

      if (openCableId === editingCableId) {
        closeFiberPanel();
      }

      await loadSummary();
      cancelEditCable();
    } catch (e: any) {
      setError(e?.message ?? "Update cable failed");
    } finally {
      setSavingCableEdit(false);
    }
  }

  async function loadFibers(cableId: string) {
    setLoadingFibers(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/cables/${cableId}/fibers`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Load fibers failed (${res.status}) ${text}`);
      }

      const data = (await res.json()) as Fiber[];
      setFibers(data);
    } catch (e: any) {
      setError(e?.message ?? "Load fibers failed");
      setFibers([]);
    } finally {
      setLoadingFibers(false);
    }
  }

  function closeFiberPanel() {
    setOpenCableId(null);
    setFibers([]);
    setLoadingFibers(false);
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Nodes & Cables
        </h2>

        <div className="flex items-center gap-2">
          <div className="text-xs opacity-60">
            {counts.nodes} nodes • {counts.cables} cables • {counts.totalFibers} fibers •
            refresh {Math.round(refreshMs / 1000)}s
          </div>

          <button
            onClick={() => loadSummary()}
            className="rounded border px-3 py-1 text-sm hover:opacity-80 dark:border-white/20"
          >
            Refresh
          </button>

          <button
            onClick={() => setShowCableUI((v) => !v)}
            disabled={nodes.length < 2}
            className="rounded bg-white px-3 py-1 text-sm text-black disabled:opacity-50"
            title={nodes.length < 2 ? "Add at least two nodes first" : "Create a cable"}
          >
            {showCableUI ? "Close Cable UI" : "Create Cable"}
          </button>
        </div>
      </div>

      <div className="rounded border p-3 dark:border-white/20">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Node name (e.g., CAB-1, HH-3, Splice-Clos-2)"
            className="flex-1 rounded border bg-transparent p-2"
          />

          <select
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value as NodeType)}
            className="rounded border bg-transparent p-2"
          >
            {NODE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <button
            onClick={createNode}
            disabled={savingNode}
            className="rounded bg-white px-4 py-2 text-black disabled:opacity-60"
          >
            {savingNode ? "Saving..." : "Add Node"}
          </button>
        </div>

        {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
      </div>

      {showCableUI && (
        <div className="space-y-3 rounded border p-3 dark:border-white/20">
          <div className="font-semibold">Create Cable</div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="md:col-span-2">
              <div className="mb-1 text-xs opacity-70">Cable Name (unique per project)</div>
              <input
                value={cableName}
                onChange={(e) => setCableName(e.target.value)}
                placeholder="e.g., BB-001, SPUR-HH3-to-CAB1, DROP-01"
                className="w-full rounded border bg-transparent p-2"
              />
            </div>

            <div>
              <div className="mb-1 text-xs opacity-70">From</div>
              <select
                value={fromNodeId}
                onChange={(e) => setFromNodeId(e.target.value)}
                className="w-full rounded border bg-transparent p-2"
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.nodeType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-1 text-xs opacity-70">To</div>
              <select
                value={toNodeId}
                onChange={(e) => setToNodeId(e.target.value)}
                className="w-full rounded border bg-transparent p-2"
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.nodeType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-1 text-xs opacity-70">Cable Type</div>
              <select
                value={cableType}
                onChange={(e) => setCableType(e.target.value as CableType)}
                className="w-full rounded border bg-transparent p-2"
              >
                {CABLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-1 text-xs opacity-70">Fiber Count</div>
              <select
                value={fiberCount}
                onChange={(e) => setFiberCount(Number(e.target.value) as any)}
                className="w-full rounded border bg-transparent p-2"
              >
                {FIBER_COUNTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <div className="mb-1 text-xs opacity-70">Route Notes (optional)</div>
              <input
                value={routeNotes}
                onChange={(e) => setRouteNotes(e.target.value)}
                placeholder="e.g., North shoulder, bore under ramp, etc."
                className="w-full rounded border bg-transparent p-2"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={confirmAutogen}
              onChange={(e) => setConfirmAutogen(e.target.checked)}
            />
            Confirm before auto-generating fibers ({fiberCount})
          </label>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setShowCableUI(false)}
              className="rounded border px-3 py-1 text-sm hover:opacity-80 dark:border-white/20"
            >
              Cancel
            </button>

            <button
              onClick={createCable}
              disabled={savingCable}
              className="rounded bg-white px-3 py-1 text-sm text-black disabled:opacity-60"
            >
              {savingCable ? "Creating..." : "Create Cable"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="font-semibold">Nodes</div>

        <ul className="space-y-2">
          {nodes.map((n) => (
            <li
              key={n.id}
              className="flex items-center justify-between gap-3 rounded border p-3 dark:border-white/20"
            >
              {editingNodeId === n.id ? (
                <>
                  <div className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row md:items-center">
                    <input
                      value={editNodeName}
                      onChange={(e) => setEditNodeName(e.target.value)}
                      className="flex-1 rounded border bg-transparent p-2"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveNodeEdit();
                        if (e.key === "Escape") cancelEditNode();
                      }}
                    />

                    <select
                      value={editNodeType}
                      onChange={(e) => setEditNodeType(e.target.value as NodeType)}
                      className="rounded border bg-transparent p-2"
                    >
                      {NODE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={saveNodeEdit}
                      disabled={savingNodeEdit}
                      className="rounded bg-white px-3 py-1 text-sm text-black disabled:opacity-60"
                    >
                      {savingNodeEdit ? "Saving..." : "Save"}
                    </button>

                    <button
                      onClick={cancelEditNode}
                      disabled={savingNodeEdit}
                      className="rounded border px-3 py-1 text-sm hover:opacity-80 dark:border-white/20"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{n.name}</div>
                    <div className="text-xs opacity-60">{n.nodeType}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEditNode(n)}
                      className="rounded border px-3 py-1 text-sm hover:opacity-80 dark:border-white/20"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteNode(n.id)}
                      className="rounded border px-3 py-1 text-sm hover:opacity-80 dark:border-white/20"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}

          {nodes.length === 0 && (
            <li className="text-sm opacity-60">No nodes yet. Add your first one above.</li>
          )}
        </ul>
      </div>

      <div className="space-y-3">
        <div className="font-semibold">Cables</div>

        <ul className="space-y-2">
          {cables.map((c) => (
            <li key={c.id} className="rounded border p-3 dark:border-white/20">
              {editingCableId === c.id ? (
                <div className="space-y-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <div className="mb-1 text-xs opacity-70">Cable Name</div>
                      <input
                        value={editCableName}
                        onChange={(e) => setEditCableName(e.target.value)}
                        className="w-full rounded border bg-transparent p-2"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveCableEdit();
                          if (e.key === "Escape") cancelEditCable();
                        }}
                      />
                    </div>

                    <div>
                      <div className="mb-1 text-xs opacity-70">From</div>
                      <select
                        value={editFromNodeId}
                        onChange={(e) => setEditFromNodeId(e.target.value)}
                        className="w-full rounded border bg-transparent p-2"
                      >
                        {nodes.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.name} ({n.nodeType})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="mb-1 text-xs opacity-70">To</div>
                      <select
                        value={editToNodeId}
                        onChange={(e) => setEditToNodeId(e.target.value)}
                        className="w-full rounded border bg-transparent p-2"
                      >
                        {nodes.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.name} ({n.nodeType})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="mb-1 text-xs opacity-70">Cable Type</div>
                      <select
                        value={editCableType}
                        onChange={(e) => setEditCableType(e.target.value as CableType)}
                        className="w-full rounded border bg-transparent p-2"
                      >
                        {CABLE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <div className="mb-1 text-xs opacity-70">Route Notes</div>
                      <input
                        value={editRouteNotes}
                        onChange={(e) => setEditRouteNotes(e.target.value)}
                        className="w-full rounded border bg-transparent p-2"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={cancelEditCable}
                      disabled={savingCableEdit}
                      className="rounded border px-3 py-1 text-sm hover:opacity-80 dark:border-white/20"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={saveCableEdit}
                      disabled={savingCableEdit}
                      className="rounded bg-white px-3 py-1 text-sm text-black disabled:opacity-60"
                    >
                      {savingCableEdit ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">
                        {c.name} • {c.cableType} • {c.fiberCount}ct
                      </div>
                      <div className="truncate text-xs opacity-60">
                        {(c.fromNodeId && nodeNameById.get(c.fromNodeId)) ?? "—"}
                        {"  →  "}
                        {(c.toNodeId && nodeNameById.get(c.toNodeId)) ?? "—"}
                      </div>
                      {c.routeNotes && (
                        <div className="truncate text-xs opacity-60">
                          Notes: {c.routeNotes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditCable(c)}
                        className="rounded border px-3 py-1 text-sm hover:opacity-80 dark:border-white/20"
                      >
                        Edit
                      </button>

                      <button
                        className="rounded border px-3 py-1 text-sm hover:opacity-80 dark:border-white/20"
                        onClick={async () => {
                          if (openCableId === c.id) {
                            closeFiberPanel();
                            return;
                          }
                          setOpenCableId(c.id);
                          await loadFibers(c.id);
                        }}
                      >
                        {openCableId === c.id ? "Close" : "Fibers"}
                      </button>

                      <button
                        onClick={() => deleteCable(c.id)}
                        className="rounded border px-3 py-1 text-sm hover:opacity-80 dark:border-white/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {openCableId === c.id && (
                    <div className="mt-3 rounded border p-3 dark:border-white/20">
                      {loadingFibers ? (
                        <div className="text-sm opacity-70">Loading fibers…</div>
                      ) : fibers.length === 0 ? (
                        <div className="text-sm opacity-70">No fibers found.</div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold">
                              Fibers ({fibers.length})
                            </div>
                            <button
                              onClick={() => loadFibers(c.id)}
                              className="rounded border px-3 py-1 text-sm hover:opacity-80 dark:border-white/20"
                            >
                              Refresh fibers
                            </button>
                          </div>

                          <div className="text-xs opacity-60">
                            Grouped by buffer (12 strands per buffer).
                          </div>

                          <div className="max-h-80 space-y-4 overflow-auto">
                            {fibersByBuffer.map(([bufferNo, list]) => (
                              <div key={bufferNo} className="space-y-2">
                                <div className="text-sm font-semibold">
                                  Buffer {bufferNo} ({list.length})
                                </div>

                                <div className="grid grid-cols-4 gap-2 text-xs opacity-70">
                                  <div>Strand</div>
                                  <div>Buffer</div>
                                  <div>Color</div>
                                  <div>Status</div>
                                </div>

                                <div className="space-y-1">
                                  {list.map((f) => (
                                    <div key={f.id} className="grid grid-cols-4 gap-2 text-sm">
                                      <div>{f.strandNumber}</div>
                                      <div>{f.bufferNumber}</div>
                                      <div>{f.color}</div>
                                      <div>{f.status}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </li>
          ))}

          {cables.length === 0 && (
            <li className="text-sm opacity-60">No cables yet. Create one to connect nodes.</li>
          )}
        </ul>
      </div>
    </section>
  );
}