# SignalDeck

SignalDeck is a TinyFish-powered competitive intelligence agent built for the TinyFish $2M Pre-Accelerator Hackathon. It performs real work on the live web by launching TinyFish browser automations against competitor websites, navigating pricing, product, blog, news, and careers pages, and returning sales-ready battlecards that revenue teams can actually use.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Gosula16/TinyFish)

Live App: [https://tinyfish-signaldeck.onrender.com/](https://tinyfish-signaldeck.onrender.com/)

## Hackathon Theme Fit

This project is built specifically for the TinyFish hackathon theme:

`Build an autonomous web agent using the TinyFish API`

SignalDeck fits because it:

- uses TinyFish as core infrastructure, not as a wrapper around another API
- interacts with real live websites instead of mock data or static datasets
- performs multi-step browser work across multiple pages
- handles a real business workflow that normally takes hours of manual labor
- produces a clear business artifact: a competitive battlecard for sales and product marketing teams

## The Problem

Revenue teams constantly need fresh competitor intelligence:

- What changed on a competitor's pricing page?
- What are they launching?
- Are they moving upmarket?
- Are they hiring aggressively in enterprise sales or AI?
- How should we position against them in live deals?

Today, this work is usually manual. A person has to open many websites, click through navigation, read pricing, skim blogs, look at careers, take notes, and turn all of that into something usable by sales. That is slow, repetitive, and difficult to keep updated.

## The Solution

SignalDeck turns that manual workflow into an autonomous web task.

A user enters:

- their market context
- their product positioning
- their ideal customer profile
- the analysis angle they care about
- a list of competitor websites

SignalDeck then:

1. launches concurrent TinyFish web agent runs
2. instructs agents to navigate each competitor website
3. extracts pricing, messaging, product depth, proof points, recent signals, and hiring signals
4. converts the results into structured battlecards
5. generates a portfolio summary across all competitors

## Why This Matters

This is not a chatbot. This is not a basic RAG app. This is not a UI on top of a static database.

SignalDeck requires live browser infrastructure because the value comes from:

- navigating real websites
- following real product and pricing links
- collecting current live information
- handling multi-page discovery
- turning current web state into business intelligence

That is exactly the type of agentic web workflow TinyFish is designed for.

## Core Features

- Concurrent competitor analysis using TinyFish browser runs
- Live web extraction from competitor homepages and supporting pages
- Structured battlecards for each competitor
- Portfolio-level summary for sales leadership
- Progress tracking for each run
- Retry handling for transient TinyFish polling failures
- Demo fallback mode when no API key is configured
- Single full-stack app that serves frontend and backend together

## What SignalDeck Extracts

For each competitor, the app attempts to capture:

- company one-liner
- target customer
- homepage CTA
- public pricing and plan structure
- notable product features
- proof points and social credibility
- recent product or market signals
- hiring signals
- recommended sales angle against that competitor
- confidence notes

## Tech Stack

- React
- Vite
- TypeScript
- Express
- TinyFish Web Agent API

## Architecture

### Frontend

The frontend allows a user to:

- configure product and market context
- choose browser profile
- enter multiple competitor websites
- launch analysis jobs
- watch job progress
- review battlecards and portfolio summaries

### Backend

The backend:

- validates incoming requests
- creates TinyFish automation runs
- polls TinyFish for run completion
- normalizes returned JSON into battlecard objects
- retries around transient upstream 5xx polling failures
- exposes API endpoints for the frontend

### TinyFish Role

TinyFish is the key infrastructure layer. It is responsible for:

- browser execution
- multi-step website navigation
- live web interaction
- task completion using a natural language goal

## API Endpoints

- `GET /api/health`
- `POST /api/analyze`
- `GET /api/jobs`
- `GET /api/jobs/:id`

## Project Structure

```text
.
|-- server/
|   |-- demo-data.ts
|   |-- index.ts
|   |-- jobs.ts
|   |-- summary.ts
|   |-- tinyfish.ts
|   `-- types.ts
|-- src/
|   |-- App.tsx
|   |-- api.ts
|   |-- main.tsx
|   |-- styles.css
|   `-- types.ts
|-- Dockerfile
|-- render.yaml
|-- package.json
`-- README.md
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

```bash
copy .env.example .env
```

Add:

```env
TINYFISH_API_KEY=your_real_tinyfish_key
PORT=8787
```

### 3. Run locally

```bash
npm run dev
```

Open:

- frontend: [http://localhost:5173](http://localhost:5173)
- backend health: [http://localhost:8787/api/health](http://localhost:8787/api/health)

### 4. Build for production

```bash
npm run build
```

## Environment Variables

- `TINYFISH_API_KEY`: required for live TinyFish runs
- `PORT`: backend port, defaults to `8787`

If `TINYFISH_API_KEY` is missing, SignalDeck runs in demo mode with seeded sample data so the product can still be previewed.

## Deployment

This repo includes:

- `Dockerfile`
- `render.yaml`

### Render deployment

1. Open this repo on GitHub
2. Click the `Deploy to Render` button
3. Create the service in your Render account
4. Set `TINYFISH_API_KEY`
5. Deploy

Health check:

- `/api/health`

## Verification Completed

The project has already been validated locally with:

- `npm install`
- `npm run check`
- `npm run build`

A real TinyFish live run was also successfully tested against `https://www.notion.so/` using a live API key, and the application returned a completed structured battlecard.

## Demo Flow

Recommended 2 to 3 minute raw demo:

1. Introduce the problem:
   manual competitive research is slow and stale
2. Show the SignalDeck form
3. Enter your product context and 3 competitor URLs
4. Launch the analysis
5. Show the live run progress
6. Open the resulting battlecards
7. Highlight:
   - pricing visibility
   - feature differentiation
   - recent momentum signals
   - hiring and GTM signals
   - recommended sales positioning
8. Close with the business value:
   revenue teams save time and stay current

Important for the hackathon demo:

- use a raw working demo, not slides
- show the agent doing real web work
- briefly explain what is happening under the hood

## Hackathon Submission Requirements

Based on the hackathon brief, a valid submission should include:

### Build requirements

- a real-world application powered by the TinyFish Web Agent API
- real interaction with live websites
- meaningful multi-step web work
- a solution with real business value

### Demo requirements

- a raw 2 to 3 minute video
- the app working live
- the agent navigating the web in real time
- short narration explaining what the workflow does and why it matters
- no slide-only submissions

### Public launch requirements

- post the demo publicly on X
- tag `@Tiny_fish`
- mention TinyFish clearly in the post

Note:
The hackathon discussion also mentioned LinkedIn posting as a validity requirement in admin comments, so posting on both X and LinkedIn is the safest submission path.

### HackerEarth submission requirements

- project submission on HackerEarth
- link to public X post
- brief write-up of business case
- brief write-up of technical architecture
- screenshots or extra documentation if helpful

## Judging Alignment

SignalDeck is designed around the stated judging criteria:

### 1. Product and technical maturity

- full-stack working product
- live TinyFish integration
- multi-competitor orchestration
- retry logic for transient upstream errors
- deployable architecture

### 2. Business viability

- addresses real pain for revenue and product marketing teams
- replaces repetitive manual competitor research
- can evolve into recurring monitoring and account intelligence

### 3. Market signal and public proof

- easy to demo visually
- clear problem and outcome
- strong narrative for building in public

## Suggested Submission Write-Up

### One-line pitch

SignalDeck is a TinyFish-powered competitive intelligence agent that visits live competitor websites and turns them into sales-ready battlecards in minutes.

### Business case

B2B revenue teams lose time and deals because competitor intelligence is manual, inconsistent, and outdated. SignalDeck automates that workflow by using TinyFish to browse the live web, extract current signals, and generate actionable battlecards for sales and product marketing.

### Technical architecture

The app uses a React frontend and an Express backend. The backend creates concurrent TinyFish automation runs for each competitor URL, polls TinyFish for completion, normalizes the returned JSON, and delivers structured battlecards plus a portfolio-level summary to the UI.

## Future Roadmap

- recurring monitoring for competitor changes
- CRM integration for account-level battlecards
- alerting when pricing or messaging changes
- vertical-specific playbooks
- automatic outbound email and enablement asset generation

## Links

- Live App: [https://tinyfish-signaldeck.onrender.com/](https://tinyfish-signaldeck.onrender.com/)
- GitHub Repo: [https://github.com/Gosula16/TinyFish](https://github.com/Gosula16/TinyFish)
- TinyFish Docs: [https://docs.tinyfish.ai/](https://docs.tinyfish.ai/)
- TinyFish Accelerator: [https://www.tinyfish.ai/accelerator](https://www.tinyfish.ai/accelerator)
- HackerEarth Hackathon: [https://www.hackerearth.com/challenges/hackathon/the-tiny-fish-hackathon-2026/](https://www.hackerearth.com/challenges/hackathon/the-tiny-fish-hackathon-2026/)

## License

This project was built for hackathon submission and demo purposes. Add a license if you want to open-source it formally.
