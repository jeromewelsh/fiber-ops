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

export default async function HomePage() {
  const projects = await getProjects();

  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>Fiber Ops</h1>

      {projects.length === 0 ? (
        <p>No projects yet.</p>
      ) : (
        <ul>
          {projects.map((p) => (
            <li key={p.id}>
              <Link href={`/projects/${p.id}`}>{p.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}