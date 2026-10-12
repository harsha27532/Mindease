# MindEase Frontend

React + Vite frontend prototype for a calm student peer-support network.

## Design
- White-dominant interface, sage green and very light lavender
- Very pale pink (`#FFF5F5`) used only as a small accent
- Responsive student, peer listener and admin portal entry
- Mood check-in and supportive messages
- Listener cards with topics, ratings and profile preview
- Private journal and letter-to-future-self drafts
- Tiny wins checklist with checkboxes
- Mood history
- Oxlint, not ESLint

## Run
Install Node.js 18+ and run:
```bash
npm install
npm run dev
```
Open the Vite URL shown in the terminal, normally http://localhost:5173.

Build and lint:
```bash
npm run build
npm run lint
```

## Important
This is frontend-only. Login is a demo interaction and does not authenticate users. Journal/letter drafts are stored in browser localStorage and are not suitable for real sensitive data until a secure backend is connected. Listener profiles, ratings and reviews are sample data. The chat, matching, listener availability, admin changes, and mood history persistence need Spring Boot/MySQL APIs. Peer listeners are not licensed therapists; supportive text is not crisis detection or professional care.
