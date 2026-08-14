# Fiber Ops Architecture and Data Model

## Architectural goals

Fiber Ops uses a conventional web architecture so domain rules remain centralized, data stays relational, and the user interface can evolve independently from persistence.

The architecture prioritizes:

- A domain model that resembles real fiber infrastructure
- Validation at the API boundary
- Traceable relationships between assets, cables, fibers, trays, and splices
- A field-oriented web interface
- Future integration with mapping, testing, and reporting workflows

## System context

```mermaid
flowchart LR
    Tech["Field technician"] --> FiberOps["Fiber Ops"]
    Engineer["Engineer or designer"] --> FiberOps
    PM["Project manager"] --> FiberOps
    FiberOps --> Records["Structured fiber records"]
    FiberOps -. future .-> GIS["GIS and mapping data"]
    FiberOps -. future .-> Test["OTDR and test evidence"]
    FiberOps -. future .-> Report["Handoff and stakeholder reports"]
```

## Application containers

```mermaid
flowchart LR
    Browser["Web browser"] -->|HTTPS / JSON| Frontend["Next.js frontend"]
    Frontend -->|REST API| Backend["Fastify backend"]
    Backend -->|Prisma queries| Database[("PostgreSQL")]
    Backend --> Swagger["OpenAPI / Swagger UI"]
```

| Component | Current responsibility |
|---|---|
| Next.js frontend | Displays projects and project summaries; manages node and cable workflows; displays generated fibers |
| Fastify backend | Exposes REST endpoints, validates input, applies fiber generation and trace rules |
| Prisma | Maps domain entities and relationships to PostgreSQL |
| PostgreSQL | Stores durable project and fiber-topology records |
| Swagger UI | Provides an interactive developer reference for API behavior |

## Domain model

```mermaid
erDiagram
    PROJECT ||--o{ NODE : contains
    PROJECT ||--o{ CABLE : contains
    NODE o|--o{ CABLE : "origin for"
    NODE o|--o{ CABLE : "destination for"
    CABLE ||--|{ FIBER : contains
    NODE ||--o{ SPLICE_TRAY : houses
    SPLICE_TRAY ||--o{ SPLICE : contains
    FIBER ||--o{ SPLICE : "side A"
    FIBER ||--o{ SPLICE : "side B"

    PROJECT {
        uuid id PK
        string name
    }
    NODE {
        uuid id PK
        uuid projectId FK
        enum nodeType
        float latitude
        float longitude
        string mileMarker
    }
    CABLE {
        uuid id PK
        uuid projectId FK
        enum cableType
        int fiberCount
        uuid fromNodeId FK
        uuid toNodeId FK
    }
    FIBER {
        uuid id PK
        uuid cableId FK
        int strandNumber
        int bufferNumber
        string color
        enum status
    }
    SPLICE_TRAY {
        uuid id PK
        uuid nodeId FK
        string name
    }
    SPLICE {
        uuid id PK
        uuid trayId FK
        uuid aFiberId FK
        uuid bFiberId FK
        enum spliceType
        decimal lossDb
    }
```

## Cable creation sequence

Creating a cable also creates its strand inventory. The backend, rather than the browser, owns this rule so every client receives consistent results.

```mermaid
sequenceDiagram
    actor User
    participant UI as Next.js UI
    participant API as Fastify API
    participant DB as PostgreSQL

    User->>UI: Enter cable and fiber count
    UI->>API: POST /cables
    API->>API: Validate request
    API->>API: Calculate strand colors and buffers
    API->>DB: Create cable and fibers
    DB-->>API: Commit records
    API-->>UI: Return created cable
    UI->>API: GET cable fibers
    API-->>UI: Return ordered strand inventory
```

## Fiber continuity trace

The trace endpoint performs a bounded graph traversal. It starts from a fiber, finds splices connected to either splice side, and follows unvisited fibers until the path is exhausted or the safety limit is reached.

This is a useful operational capability, but its accuracy depends entirely on the completeness and correctness of recorded splice relationships.

## Current architectural risks and gaps

| Area | Current gap | Why it matters |
|---|---|---|
| Authentication | No production identity or role model documented | Infrastructure records require controlled access |
| Audit trail | Record-level change history is not yet modeled | As-built changes need accountability |
| Testing | Backend package does not yet define automated tests | Domain rules need repeatable verification |
| Deployment | Production topology and environment controls are not documented | Stakeholders need support and recovery expectations |
| GIS integration | Location data exists without a map integration contract | Spatial workflows remain incomplete |
| Test evidence | OTDR and acceptance results are not modeled | Operational records cannot yet show measured condition |
| API organization | Current routes are concentrated in the main server file | Continued growth will increase maintenance cost |

## Decision records

Use [the ADR template](templates/adr-template.md) for decisions that affect data shape, security, integrations, deployment, or long-term maintenance. ADRs document why a choice was made; they do not replace implementation details or requirements.

