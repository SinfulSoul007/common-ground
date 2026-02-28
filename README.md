# Common Ground

**AI-facilitated project scoping between non-profits and AI researchers.**

Common Ground is a collaborative web application that helps **non-profit organizations (NPOs)** and **AI/ML researchers** align on project scope, requirements, and deliverables—despite different vocabularies and goals. An AI facilitator (powered by Claude) translates between plain-language and technical perspectives, guides structured discovery, and produces a dual-view project charter that both parties can sign off on.

---

## The Problem

When NPOs and researchers collaborate on AI or data projects, they often talk past each other: NPOs describe operational pain (“our volunteer data is chaotic”), while researchers think in technical terms (“we need a schema for entity resolution”). Misalignment leads to scope creep, missed expectations, and failed pilots. **Common Ground** creates a shared process and a shared artifact so both sides leave with a clear, mutually understood plan.

---

## How It Works

The app runs a **three-phase, role-based workflow**. The **NPO** creates a session and gets a shareable session ID; the **researcher** joins with that ID. Both progress through the same phases, but each sees role-appropriate language and actions.

### Phase 1 — Discover

- **NPO-led.** The NPO works from a cloud of **seed concepts** (e.g. “volunteers”, “data”, “reporting”, “manual work”) and can:
  - **Combine** two or more concepts; the AI suggests a single, more specific phrase (e.g. “volunteer data” + “chaotic” → “unstructured volunteer tracking”).
  - **Add custom tags** for concepts that aren’t in the seed set.
- After **at least three combinations**, the NPO **finalizes** by selecting which tags matter most. The AI then generates:
  - A **plain-English problem statement** (for the NPO).
  - A **technical interpretation** (for the researcher)—mapping the same problem to domains like NLP, data pipelines, classification, etc.
- The researcher waits in a **waiting room** until the NPO completes Phase 1; then both move to Phase 2.

### Phase 2 — Negotiate

- **Structured Q&A.** The AI generates **scoping questions** from the problem statement. Each question has:
  - An **NPO version** (plain language, with “why this matters” context).
  - A **researcher version** (technical framing and context).
- NPO and researcher **answer in parallel**. When both have answered a question, the AI **synthesizes** their responses and may:
  - Update a shared **requirements sidebar** (agreed requirements, constraints, open questions).
  - Add **follow-up questions**.
- Progress is tracked (e.g. “Question 2 of 5”). When all questions are answered, both parties must **agree** to proceed; only then does the session advance to Phase 3.

### Phase 3 — Charter

- The AI produces a **project charter** with two views:
  - **NPO view:** What we’ll build, what we need from you, timeline, success criteria, responsibilities, next steps—all in everyday language.
  - **Researcher view:** Technical problem spec, data requirements, proposed approach, risks, feasibility, implementation timeline, dependencies.
- A **feasibility check** (also AI) flags risks (timeline, data, scope, ethics, missing info) with severity and recommendations.
- Both parties **sign off** on the charter. The session is complete when NPO and researcher have both confirmed.

---

## Features

- **Role-based flows:** NPO creates and drives discovery; researcher joins and participates in alignment. Each role sees the right level of detail (plain vs technical).
- **AI facilitation throughout:** Concept combination, problem-statement generation, dual-view charter, feasibility flags, and scoping Q&A synthesis all use **Claude** (Anthropic).
- **Shared state:** Session state is kept in sync across tabs (e.g. NPO and researcher in two windows) via **localStorage** and polling/storage events—ideal for demos and single-machine use.
- **Structured artifacts:** Combination history, requirements sidebar, and charter are first-class objects that feed the next phase.
- **Modern stack:** Next.js 16 (App Router), React 19, TypeScript, Zustand, Tailwind CSS, Framer Motion, react-dnd.

---

## Tech Stack

| Layer        | Technology |
|-------------|------------|
| Framework   | Next.js 16 (App Router) |
| UI          | React 19, Tailwind CSS 4, Framer Motion |
| State       | Zustand (client session store) |
| AI          | Anthropic Claude (Haiku) via `@anthropic-ai/sdk` |
| Drag-and-drop | react-dnd (HTML5 backend) |
| IDs         | uuid |

Session state is **client-side** (Zustand + localStorage) for simplicity; the backend exposes REST APIs for session creation, join, and all AI operations (combine tags, generate problem, generate questions, synthesize answers, generate charter, feasibility check).

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (or 20+ recommended)
- **Anthropic API key** for Claude

### Install

```bash
npm install
```

### Environment

Create a `.env.local` in the project root:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

All AI routes (`/api/phase1/*`, `/api/phase2/*`, `/api/phase3/*`) require this key.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

---

## Usage

1. **Landing:** Choose **NPO** (create a session) or **Researcher** (join with a session ID).
2. **NPO:** Clicks “NPO” → a new session is created and you’re taken to Phase 1. Copy the session ID from the URL (e.g. `ABC123`) and share it with the researcher.
3. **Researcher:** Clicks “Researcher”, enters the session ID, and joins. They see the Phase 1 waiting room until the NPO finishes discovery.
4. **Phase 1 (NPO):** Combine concepts, add custom tags, then “Finalize Problem” → select tags → “Generate Problem Statement” → confirm and continue.
5. **Phase 2:** Both answer the AI-generated scoping questions. After each pair of answers, the AI synthesizes and updates the sidebar. When all questions are done, both click “Agree & Proceed to Charter.”
6. **Phase 3:** The charter (and feasibility flags) are generated automatically. Switch between NPO/Researcher view if desired, then both sign off.

**Tip:** Use two browser tabs (or two windows)—one as NPO, one as researcher—to demo the full flow. State syncs across tabs for the same session.

---

## Project Structure (high level)

```
src/
├── app/
│   ├── page.tsx                 # Landing (role select / join)
│   ├── session/[sessionId]/      # Session router → redirects to phase N
│   │   ├── phase1/page.tsx       # Discover (tag cloud, combine, finalize)
│   │   ├── phase2/page.tsx       # Negotiate (scoping Q&A, sidebar)
│   │   └── phase3/page.tsx       # Charter (dual view, feasibility, sign-off)
│   └── api/
│       ├── session/create/       # POST → new session ID
│       ├── session/[sessionId]/join/  # POST → join as role
│       ├── phase1/               # combine-tags, generate-problem
│       ├── phase2/               # generate-questions, synthesize-answers, etc.
│       └── phase3/               # generate-charter, feasibility-check
├── components/
│   ├── landing/                  # RoleSelector, SessionJoinForm
│   ├── phase1/                   # TagCloud, CustomTagInput, WaitingRoom, …
│   ├── phase2/                   # RequirementsSidebar, ChatMessage, …
│   ├── phase3/                   # CharterDocument, FeasibilityFlags, SignOff, …
│   └── ui/                       # Button, Card, Modal, Input, Badge, …
├── lib/
│   ├── types.ts                  # SessionState, Tag, ProblemStatement, Charter, …
│   ├── constants.ts              # SEED_TAGS, PHASE_NAMES, ROLE_LABELS
│   ├── prompts.ts               # All Claude system/user prompts
│   ├── claude.ts                 # callClaude(system, user, options)
│   └── serverStore.ts           # In-memory session map (optional server state)
├── store/
│   └── sessionStore.ts           # Zustand store + localStorage persistence
└── hooks/
    ├── useSession.ts             # Load session by ID, attach polling
    └── usePolling.ts             # Poll localStorage + storage events for cross-tab sync
```

---

## Environment Variables

| Variable           | Required | Description |
|--------------------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes      | Anthropic API key for Claude. Used by all Phase 1–3 AI routes. |

---

## Scripts

| Command       | Description              |
|---------------|--------------------------|
| `npm run dev` | Start dev server (Next.js) |
| `npm run build` | Production build       |
| `npm start`   | Run production server   |
| `npm run lint`| Run ESLint              |

---

## License

Private. See repository settings for terms.

---

*Common Ground — bridging the gap between non-profits and AI researchers, one scoped project at a time.*
