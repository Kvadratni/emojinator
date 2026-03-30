# Emojinator - Development Guide

## Quick Commands
- `npm run dev` — Start dev server with Turbopack on port 3000
- `npm run build` — Production build
- `npm start` — Start production server

## Architecture
- **Next.js 16** App Router with TypeScript and Tailwind CSS 4
- **react-window 2** for virtualized emoji grid (handles 90k+ items)
- Server-side emoji scanning with module-level caching (invalidates on directory change)
- SSE streaming for upload progress
- All Slack API calls go through server-side API routes (cookie/token never exposed to client beyond localStorage)

## Key Patterns
- Emoji directory is configurable at runtime via `/api/config` — stored in module-level variable (`src/lib/config.ts`)
- Images served through `/api/image/[...path]` proxy route, not static files
- Prefix detection: splits filenames on `-`/`_`, promotes 2-segment prefixes when they dominate (e.g. `ms-teams`)
- Slack auth requires both `xoxc-` token (in form body) AND full cookie with `d=xoxd-` (in Cookie header), plus `Origin` and `User-Agent` headers

## File Layout
- `src/lib/` — Server-side utilities (config, scanning, uploading)
- `src/hooks/` — Client-side React hooks
- `src/components/` — React components
- `src/app/api/` — Next.js API routes
