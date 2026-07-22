# ClauseIQ v6a developer handover

Open `index.html` directly in a browser for the offline visual guide. The guide uses relative image paths and does not require the prototype to be running.

## Regenerate screenshots

From the repository root, run:

```bash
npm run capture:clauseiq-v6a-handover
```

The command starts an isolated Vite server on port `4173`, replaces `assets/`, and captures the documented desktop states at `1661 × 1181`.

## Source of truth

The handover inventory follows the state-changing behaviors covered by `src/pages/ClauseIQV6A.test.tsx` and `src/components/workflow-v6a/ContractResults.test.tsx`. The prototype uses deterministic mock data; uploads, downloads, AI analysis, supplier matching, and generated files are UI simulations unless a developer connects them to live services.
