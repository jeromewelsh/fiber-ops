import Link from "next/link";
import { API_BASE } from "@/lib/config";

type Project = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

async function getProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to load projects (${res.status})`);
  }

  return res.json();
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export default async function HomePage() {
  const projects = await getProjects();

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
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gap: 20,
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
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
              Fiber Operations Platform
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 32,
                lineHeight: 1.1,
              }}
            >
              Fiber Ops
            </h1>
            <p
              style={{
                margin: "8px 0 0 0",
                color: "#9db2c8",
                maxWidth: 700,
                lineHeight: 1.5,
              }}
            >
              Field-oriented fiber infrastructure tracking for ITS deployments,
              including cabinets, ground boxes, poles, cables, splice topology,
              and GPS-aware asset records.
            </p>
          </div>

          <div
            style={{
              minWidth: 180,
              padding: 16,
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
            <div style={{ fontSize: 18, fontWeight: 700, color: "#7ee787" }}>
              Online
            </div>
            <div style={{ marginTop: 8, color: "#9db2c8", fontSize: 14 }}>
              Projects loaded: {projects.length}
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
              Active Projects
            </div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{projects.length}</div>
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
              Focus
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              Asset Location
            </div>
            <div style={{ marginTop: 6, color: "#9db2c8", fontSize: 14 }}>
              GPS metadata and field findability
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
              Workflow
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              Field → Data → Trace
            </div>
            <div style={{ marginTop: 6, color: "#9db2c8", fontSize: 14 }}>
              Projects, nodes, cables, trays, continuity
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
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 22 }}>Projects</h2>
                <div style={{ marginTop: 4, color: "#9db2c8", fontSize: 14 }}>
                  Select a project to open nodes, cables, and topology.
                </div>
              </div>
            </div>

            <div style={{ padding: 16 }}>
              {projects.length === 0 ? (
                <div
                  style={{
                    padding: 20,
                    borderRadius: 12,
                    border: "1px dashed #35506f",
                    color: "#9db2c8",
                    background: "rgba(13, 25, 39, 0.75)",
                  }}
                >
                  No projects yet.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: 14,
                  }}
                >
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      style={{
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          padding: 16,
                          borderRadius: 14,
                          border: "1px solid #29415c",
                          background:
                            "linear-gradient(180deg, rgba(18,32,49,0.95) 0%, rgba(11,22,35,0.95) 100%)",
                          boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
                          transition: "transform 120ms ease, border-color 120ms ease",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            color: "#7aa2c9",
                            textTransform: "uppercase",
                            letterSpacing: 1,
                            marginBottom: 8,
                          }}
                        >
                          Project
                        </div>

                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                            marginBottom: 12,
                            lineHeight: 1.2,
                          }}
                        >
                          {project.name}
                        </div>

                        <div style={{ fontSize: 13, color: "#9db2c8" }}>
                          Created: {formatDate(project.createdAt)}
                        </div>

                        <div
                          style={{
                            marginTop: 14,
                            color: "#7ee787",
                            fontWeight: 700,
                            fontSize: 14,
                          }}
                        >
                          Open project →
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside
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
                Priority: improve asset findability from rough references like
                exits, crossroads, and corridor notes.
              </div>

              <div
                style={{
                  padding: 12,
                  borderRadius: 12,
                  background: "rgba(15, 28, 43, 0.85)",
                  border: "1px solid #27405f",
                }}
              >
                GPS-ready node records are now supported in the backend.
              </div>

              <div
                style={{
                  padding: 12,
                  borderRadius: 12,
                  background: "rgba(15, 28, 43, 0.85)",
                  border: "1px solid #27405f",
                }}
              >
                Next step: location-focused node UI and map-based project view.
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}