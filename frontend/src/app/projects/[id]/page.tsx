import { API_BASE } from "@/lib/config";
import Link from "next/link";
import NodePanel from "./node-panel";
import CablePanel from "./cable-panel";

type Summary = {
  ok: boolean;
  message?: string;
  project?: {
    id: string;
    name: string;
    createdAt: string;
  };
  counts?: {
    nodes: number;
    cables: number;
    totalFibers: number;
  };
  nodes?: any[];
  cables?: any[];
};

function formatDate(value?: string) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString();
}

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
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #08111b 0%, #0b1623 45%, #0f1b2b 100%)",
        color: "#e6edf3",
        fontFamily: "Arial, sans-serif",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          margin: "0 auto",
          display: "grid",
          gap: 20,
        }}
      >
        <div>
          <Link
            href="/"
            style={{
              color: "#9ecbff",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            ← Back to projects
          </Link>
        </div>

        {error ? (
          <div
            style={{
              padding: 14,
              border: "1px solid #6b1d1d",
              borderRadius: 12,
              background: "#2a1212",
              color: "#ffb4b4",
            }}
          >
            Error: {error}
          </div>
        ) : !data ? (
          <div
            style={{
              padding: 18,
              borderRadius: 12,
              border: "1px solid #1f3147",
              background: "rgba(8, 15, 24, 0.88)",
            }}
          >
            Loading project...
          </div>
        ) : (
          <>
            <header
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: 20,
                padding: "20px 24px",
                border: "1px solid #1f3147",
                borderRadius: 16,
                background: "rgba(8, 15, 24, 0.88)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    color: "#7aa2c9",
                    marginBottom: 6,
                  }}
                >
                  Corridor / Project View
                </div>

                <h1
                  style={{
                    margin: 0,
                    fontSize: 32,
                    lineHeight: 1.1,
                  }}
                >
                  {data.project?.name ?? "Unnamed Project"}
                </h1>

                <p
                  style={{
                    margin: "8px 0 0 0",
                    color: "#9db2c8",
                    maxWidth: 760,
                    lineHeight: 1.5,
                  }}
                >
                  Project-level HUD for nodes, cables, fiber counts, and field
                  location readiness.
                </p>

                <div
                  style={{
                    marginTop: 14,
                    color: "#9db2c8",
                    fontSize: 14,
                  }}
                >
                  Created: {formatDate(data.project?.createdAt)}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 12,
                  alignContent: "start",
                }}
              >
                <div
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    border: "1px solid #27405f",
                    background: "rgba(16, 31, 48, 0.9)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: "#7aa2c9",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 6,
                    }}
                  >
                    Status
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#7ee787",
                    }}
                  >
                    Active
                  </div>
                </div>

                <div
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    border: "1px solid #27405f",
                    background: "rgba(16, 31, 48, 0.9)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: "#7aa2c9",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 6,
                    }}
                  >
                    Focus
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    Field Findability
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      color: "#9db2c8",
                      fontSize: 13,
                    }}
                  >
                    Exit, crossroads, GPS, and asset correlation
                  </div>
                </div>
              </div>
            </header>

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
              }}
            >
              <div
                style={{
                  padding: 18,
                  borderRadius: 14,
                  border: "1px solid #1f3147",
                  background: "rgba(10, 20, 31, 0.85)",
                }}
              >
                <div
                  style={{
                    color: "#7aa2c9",
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  Nodes
                </div>
                <div style={{ fontSize: 30, fontWeight: 700 }}>
                  {data.counts?.nodes ?? 0}
                </div>
              </div>

              <div
                style={{
                  padding: 18,
                  borderRadius: 14,
                  border: "1px solid #1f3147",
                  background: "rgba(10, 20, 31, 0.85)",
                }}
              >
                <div
                  style={{
                    color: "#7aa2c9",
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  Cables
                </div>
                <div style={{ fontSize: 30, fontWeight: 700 }}>
                  {data.counts?.cables ?? 0}
                </div>
              </div>

              <div
                style={{
                  padding: 18,
                  borderRadius: 14,
                  border: "1px solid #1f3147",
                  background: "rgba(10, 20, 31, 0.85)",
                }}
              >
                <div
                  style={{
                    color: "#7aa2c9",
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  Total Fibers
                </div>
                <div style={{ fontSize: 30, fontWeight: 700 }}>
                  {data.counts?.totalFibers ?? 0}
                </div>
              </div>

              <div
                style={{
                  padding: 18,
                  borderRadius: 14,
                  border: "1px solid #1f3147",
                  background: "rgba(10, 20, 31, 0.85)",
                }}
              >
                <div
                  style={{
                    color: "#7aa2c9",
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  Location Readiness
                </div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  GPS-Aware Backend
                </div>
                <div
                  style={{
                    marginTop: 6,
                    color: "#9db2c8",
                    fontSize: 13,
                  }}
                >
                  Node metadata now supports capture fields
                </div>
              </div>
            </section>

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: 20,
                alignItems: "start",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gap: 20,
                }}
              >
                <div
                  style={{
                    border: "1px solid #1f3147",
                    borderRadius: 16,
                    background: "rgba(8, 15, 24, 0.88)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "16px 18px",
                      borderBottom: "1px solid #1f3147",
                    }}
                  >
                    <h2 style={{ margin: 0, fontSize: 22 }}>Nodes</h2>
                    <div
                      style={{
                        marginTop: 4,
                        color: "#9db2c8",
                        fontSize: 14,
                      }}
                    >
                      Cabinets, ground boxes, poles, and other tracked assets.
                    </div>
                  </div>

                  <div style={{ padding: 16 }}>
                    <NodePanel projectId={id} initialNodes={data.nodes ?? []} />
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #1f3147",
                    borderRadius: 16,
                    background: "rgba(8, 15, 24, 0.88)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "16px 18px",
                      borderBottom: "1px solid #1f3147",
                    }}
                  >
                    <h2 style={{ margin: 0, fontSize: 22 }}>Cables</h2>
                    <div
                      style={{
                        marginTop: 4,
                        color: "#9db2c8",
                        fontSize: 14,
                      }}
                    >
                      Backbone, spur, and drop cable inventory for this project.
                    </div>
                  </div>

                  <div style={{ padding: 16 }}>
                    <CablePanel projectId={id} initialCables={data.cables ?? []} />
                  </div>
                </div>
              </div>

              <aside
                style={{
                  display: "grid",
                  gap: 20,
                }}
              >
                <div
                  style={{
                    border: "1px solid #1f3147",
                    borderRadius: 16,
                    background: "rgba(8, 15, 24, 0.88)",
                    padding: 18,
                  }}
                >
                  <h2 style={{ marginTop: 0, fontSize: 20 }}>Field Notes</h2>

                  <div
                    style={{
                      display: "grid",
                      gap: 12,
                      color: "#c7d5e3",
                      fontSize: 14,
                      lineHeight: 1.5,
                    }}
                  >
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        background: "rgba(15, 28, 43, 0.85)",
                        border: "1px solid #27405f",
                      }}
                    >
                      Priority: make it easier to find assets from rough
                      references like exits, crossroads, frontage roads, and
                      corridor notes.
                    </div>

                    <div
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        background: "rgba(15, 28, 43, 0.85)",
                        border: "1px solid #27405f",
                      }}
                    >
                      Next evolution: show which assets already have usable GPS
                      metadata and which still need capture.
                    </div>

                    <div
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        background: "rgba(15, 28, 43, 0.85)",
                        border: "1px solid #27405f",
                      }}
                    >
                      Long-term direction: corridor map view with assets,
                      topology, and location-based lookup.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #1f3147",
                    borderRadius: 16,
                    background: "rgba(8, 15, 24, 0.88)",
                    padding: 18,
                  }}
                >
                  <h2 style={{ marginTop: 0, fontSize: 20 }}>Operational View</h2>

                  <div
                    style={{
                      display: "grid",
                      gap: 10,
                      fontSize: 14,
                      color: "#c7d5e3",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        paddingBottom: 8,
                        borderBottom: "1px solid #1f3147",
                      }}
                    >
                      <span style={{ color: "#8aa4bf" }}>Project ID</span>
                      <span style={{ fontFamily: "monospace" }}>{id}</span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        paddingBottom: 8,
                        borderBottom: "1px solid #1f3147",
                      }}
                    >
                      <span style={{ color: "#8aa4bf" }}>Node inventory</span>
                      <span>{data.counts?.nodes ?? 0}</span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        paddingBottom: 8,
                        borderBottom: "1px solid #1f3147",
                      }}
                    >
                      <span style={{ color: "#8aa4bf" }}>Cable inventory</span>
                      <span>{data.counts?.cables ?? 0}</span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <span style={{ color: "#8aa4bf" }}>Fiber count</span>
                      <span>{data.counts?.totalFibers ?? 0}</span>
                    </div>
                  </div>
                </div>
              </aside>
            </section>
          </>
        )}
      </div>
    </main>
  );
}