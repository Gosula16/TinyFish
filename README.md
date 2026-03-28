# SignalDeck

SignalDeck is a TinyFish-powered competitive intelligence app built for the TinyFish pre-accelerator hackathon. It launches concurrent web agents against real competitor websites, lets them navigate pricing, product, careers, and news pages, and turns the result into sales-ready battlecards.

## Why this fits the hackathon

- Uses TinyFish as core browser infrastructure, not as a side feature
- Performs real multi-step work on the live web
- Produces a business artifact a team would actually use: competitive battlecards for sales and product marketing

## Stack

- React + Vite frontend
- Express + TypeScript backend
- TinyFish Web Agent API for live website runs

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Copy the example env file and add your TinyFish API key:

```bash
copy .env.example .env
```

3. Start the app:

```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173)

## Environment

- `TINYFISH_API_KEY`: required for live TinyFish runs
- `PORT`: optional backend port, defaults to `8787`

If `TINYFISH_API_KEY` is missing, the app runs in demo mode with seeded sample outputs so you can still review the UX and prepare your demo flow.

## Suggested demo script

1. Explain that SignalDeck helps revenue teams keep up with competitor moves without manually checking sites.
2. Enter your product context and 3 competitor URLs.
3. Launch the analysis and show the run progress.
4. Open the resulting battlecards and call out:
   - public pricing vs contact-sales only
   - product packaging and messaging
   - recent momentum and hiring signals
   - the recommended sales angle
5. Mention that the same workflow can be extended to more account research and vertical-specific competitor monitoring.
