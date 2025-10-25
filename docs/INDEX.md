# Documentation Index

> Central hub for all project documentation - AI-friendly reference guide

---

## 📚 Quick Navigation

### 🎯 Start Here (For AI & Developers)

1. **[Project Overview](../README.md)** - What this project does
2. **[Quick Start](./guides/quick-start.md)** - Get running in 5 minutes
3. **[Tech Stack](./architecture/tech-stack.md)** - Technologies and scaling strategy
4. **[Current Sprint](./planning/current-sprint.md)** - What we're building now

---

## 📂 Documentation Structure

```
docs/
├── INDEX.md                    # This file - start here
│
├── architecture/               # System design & architecture
│   ├── tech-stack.md          # Tech stack overview & scaling
│   ├── system-design.md       # High-level architecture
│   ├── database-schema.md     # Database design
│   ├── caching-strategy.md    # Multi-tier caching
│   ├── api-design.md          # API endpoints & contracts
│   └── scalability-path.md    # How to scale from 1K to 1M QPS
│
├── guides/                     # How-to guides
│   ├── quick-start.md         # Setup & run the project
│   ├── development.md         # Development workflow
│   ├── testing.md             # Testing guide
│   ├── deployment.md          # Deployment guide
│   └── troubleshooting.md     # Common issues & solutions
│
├── planning/                   # Project planning & roadmap
│   ├── current-sprint.md      # Current sprint focus
│   ├── roadmap.md            # Long-term roadmap
│   ├── sprints/              # Sprint history
│   │   ├── sprint-1.md       # Foundation (COMPLETED)
│   │   ├── sprint-2.md       # Auth & Security (CURRENT)
│   │   └── sprint-3.md       # Caching & Performance
│   └── backlog.md            # Feature backlog
│
├── references/                 # Reference materials
│   ├── kafka-guide.md         # Kafka usage & patterns
│   ├── redis-patterns.md      # Redis caching patterns
│   ├── prisma-tips.md         # Prisma best practices
│   └── nestjs-patterns.md     # NestJS design patterns
│
└── decisions/                  # Architecture Decision Records (ADR)
    ├── 001-monorepo.md        # Why monorepo
    ├── 002-snowflake-ids.md   # Why Snowflake IDs
    ├── 003-multi-tier-cache.md # Why multi-tier caching
    └── 004-event-driven.md    # Why event-driven architecture
```

---

## 🔍 Quick Reference by Topic

### For AI Assistants

When asked about:

| Topic | Reference |
|-------|-----------|
| Project setup | [guides/quick-start.md](./guides/quick-start.md) |
| Technologies used | [architecture/tech-stack.md](./architecture/tech-stack.md) |
| How to scale | [architecture/scalability-path.md](./architecture/scalability-path.md) |
| Current work | [planning/current-sprint.md](./planning/current-sprint.md) |
| Database design | [architecture/database-schema.md](./architecture/database-schema.md) |
| API endpoints | [architecture/api-design.md](./architecture/api-design.md) |
| Caching | [architecture/caching-strategy.md](./architecture/caching-strategy.md) |
| Kafka usage | [references/kafka-guide.md](./references/kafka-guide.md) |
| Why we chose X | [decisions/](./decisions/) |

### For Developers

**First Time Setup:**
1. Read [Quick Start](./guides/quick-start.md)
2. Review [Development Guide](./guides/development.md)
3. Check [Current Sprint](./planning/current-sprint.md)

**Architecture Understanding:**
1. [System Design](./architecture/system-design.md)
2. [Tech Stack](./architecture/tech-stack.md)
3. [Scalability Path](./architecture/scalability-path.md)

**Daily Work:**
1. [Current Sprint](./planning/current-sprint.md)
2. [Development Guide](./guides/development.md)
3. [Testing Guide](./guides/testing.md)

---

## 🎯 Project Status

- **Current Phase:** Sprint 1 Complete, Sprint 2 Planning
- **Tech Stack:** NestJS, PostgreSQL, Redis, Prisma, TypeScript
- **Target Scale:** 100K QPS, <20ms p50 latency
- **Last Updated:** 2025-10-25

---

## 📖 Key Documents

### Must-Read for AI

1. **[Tech Stack Overview](./architecture/tech-stack.md)**
   - All technologies and their roles
   - Scaling strategy for each component
   - Performance targets

2. **[Current Sprint](./planning/current-sprint.md)**
   - What we're building now
   - Priorities and focus areas
   - Acceptance criteria

3. **[System Design](./architecture/system-design.md)**
   - High-level architecture
   - Component interactions
   - Data flow

### Must-Read for Developers

1. **[Quick Start](./guides/quick-start.md)**
   - Setup in 5 minutes
   - First API call
   - Troubleshooting

2. **[Development Guide](./guides/development.md)**
   - Code structure
   - Conventions
   - Best practices

3. **[Testing Guide](./guides/testing.md)**
   - Unit tests
   - Integration tests
   - E2E tests

---

## 🔄 Document Lifecycle

### When to Update

- **INDEX.md** - When adding new major documents
- **current-sprint.md** - Daily/weekly as sprint progresses
- **roadmap.md** - Monthly or when priorities change
- **Tech Stack** - When adding new technologies
- **ADRs** - When making architectural decisions

### How to Contribute

1. Create new doc in appropriate folder
2. Update INDEX.md with link
3. Add to relevant quick reference section
4. Update last modified date

---

## 💡 AI Assistant Instructions

When helping with this project:

1. **Always check** [planning/current-sprint.md](./planning/current-sprint.md) first
2. **Reference** [architecture/tech-stack.md](./architecture/tech-stack.md) for tech decisions
3. **Follow patterns** in [references/](./references/)
4. **Document decisions** in [decisions/](./decisions/)

### Common AI Queries

**"What should I work on?"**
→ See [planning/current-sprint.md](./planning/current-sprint.md)

**"How does X work?"**
→ See [architecture/](./architecture/)

**"Why did we choose X?"**
→ See [decisions/](./decisions/)

**"How do I setup/deploy?"**
→ See [guides/](./guides/)

---

## 📝 Notes

- All paths relative to repository root
- Markdown format for AI readability
- Keep docs updated with code
- Use clear, searchable headings
- Include examples where possible

---

Last Updated: 2025-10-25
