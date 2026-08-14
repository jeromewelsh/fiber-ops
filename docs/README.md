# Fiber Ops Documentation

This folder contains two kinds of documentation:

1. **Living product documentation** used to explain, plan, test, and present Fiber Ops.
2. **Generated API material** used by developers to inspect backend endpoints.

## Living documentation

| Document | Audience | Purpose |
|---|---|---|
| [Stakeholder overview](stakeholder-overview.md) | Leadership, project managers, field teams | Explains the problem, value, scope, and roadmap |
| [Requirements](requirements.md) | Stakeholders, product owner, developers, testers | Records functional and non-functional expectations with traceable IDs |
| [Architecture](architecture.md) | Developers, technical reviewers, operations | Describes system boundaries, components, data flow, and domain model |
| [SDLC workflow](sdlc.md) | Project team and reviewers | Defines how an idea becomes a reviewed and documented release |
| [ADR template](templates/adr-template.md) | Developers and technical stakeholders | Records important technical decisions and their consequences |
| [Release note template](templates/release-note-template.md) | Stakeholders and users | Provides a consistent release summary and validation record |

## Generated API material

- `api.html` contains generated API documentation.
- `openapi.json` is reserved for the generated OpenAPI specification.
- During backend development, Swagger UI is available at `/docs` when the API is running.

Generated files should be regenerated from the application rather than edited manually.

## Documentation rules

- Describe current behavior separately from planned behavior.
- Link requirements, decisions, tests, and releases using stable IDs.
- Prefer diagrams for relationships and workflows, not for single facts.
- Update the relevant document in the same pull request as a behavior change.
- Never put credentials, private project records, customer data, or sensitive infrastructure details in public documentation.

