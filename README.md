# Sphere Loxodrome Demo

This is a minimal Next.js + TypeScript application that renders a 3‑D sphere you can rotate and zoom. A string of text is displayed along a loxodrome path from the north pole to the south pole and can be edited in real time.

## Features

- **Three.js** powered 3‑D globe via `@react-three/fiber`.
- Orbit controls for rotate/zoom.
- Text is split into characters and positioned along a loxodrome curve.
- Live‑editable text through a textarea.

## Setup

```bash
# Clone the repo (or copy the files into a folder)
# Install dependencies
npm install

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
├── components
│   └── Globe.tsx          # 3‑D scene and loxodrome logic
├── pages
│   ├── _app.tsx           # App wrapper
│   └── index.tsx          # Page with textarea + Globe
├── styles
│   └── globals.css        # Basic styling
├── public
│   └── fonts
│       └── helvetiker_regular.typeface.json
├── package.json
├── next.config.js
├── tsconfig.json
└── README.md
```

Enjoy experimenting with the globe!