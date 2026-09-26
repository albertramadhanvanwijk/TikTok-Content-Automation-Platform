# End-to-End Demoable TikTok Carousel Platform — Design Spec

**Date:** 2026-09-26
**Status:** Approved (5-part design reviewed in chat)
**Approach:** Integrated Demoable with Fallbacks (Pendekatan 2)
**Goal:** Wire all 40+ backend endpoints to UI so the entire flow works end-to-end without Postman, and demo stays green even when `OPENAI_API_KEY` / `NOTION_API_KEY` / `TIKTOK_CLIENT_KEY` are unset.
**Spec owner:** brainstorming → writing-plans handoff

---

## 1. Intent & Success Criteria

### 1.1 What the user said
"Lanjutkan fitur secara keseluruhan" → clarified to **A) end-to-end demoable first** (not B hardening existing pages, not C out-of-roadmap). Agreed to **Pendekatan 2 — Integrated Demoable with Fallbacks**: additive UI layer + backend mock fallbacks so `localhost:3000` + `localhost:3001` demo always works.

### 1.2 What we preserved from audit
- Backend 6 phases complete: 40+ endpoints across auth, content (carousels/slides/templates/metrics), TikTok OAuth + upload-jobs + scheduler, analytics, AI (OpenAI + Notion), upload (`POST /upload/image` + static `/uploads`), `tsc` clean, scheduler `node-cron`.
- Frontend 8 pages complete: `(auth)/login|register`, `(dashboard)/` (stats), `content` (list + `[id]` editor with `@hello-pangea/dnd` reorder + `ImageUpload` + `POST /upload/image`), `schedule`, `analytics` (recharts), `settings`. Stores: `authStore`, `contentStore`, `uiStore`. `npx tsc --noEmit` 0 errors after `c3ee2a8` (`next-auth` removed, `yarn.lock` cleaned, `// @ts-nocheck` removed).
- Missing wiring with no UI yet: AI (6 endpoints), TikTok accounts + jobs (8 endpoints), Templates UI (routes exist but no dedicated page), Socket.io real-time (deferred).

### 1.3 Success criteria (demo must pass)
1. User can `register → login → /ai generate "Trading Psychology" → Save → see carousel in /content → edit slides + upload image + reorder → schedule/publish → /tiktok connect → create upload job → poll status → Process Now → see analytics` entirely via UI.
2. Same flow works **with mock fallbacks** when external keys are empty: banner `Mock mode` shown, but carousel still created in DB and appears in content list.
3. `npm run build` (root `tsc`) + `npx tsc --noEmit` (frontend) green, `npm test` backend 149+ tests still green, no console `404 /api/auth/session` or `Heart is not defined`.
4. All new routes behind `middleware.ts` auth (check `accessToken` cookie), CORS `FRONTEND_URL` with `credentials:true` unchanged.

### 1.4 Non-goals (out of this spec)
- Socket.io real-time push, mobile app, Instagram/YouTube, marketplace, team roles, advanced RBAC, image optimization pipeline beyond existing `sharp`, Jest 70%+ full coverage (target 50% for new stores/components).

---

## 2. Global Constraints

- Node 18+, TypeScript strict, `skipLibCheck:true`.
- Backend `http://localhost:3000`, frontend `http://localhost:3001` (`NEXT_PUBLIC_API_BASE_URL` env). JWT in HTTP-only cookies `accessToken`/`refreshToken` with `withCredentials:true`.
- No secrets in frontend bundle; `axios` single instance with 401 auto-refresh interceptor (`services/api.ts` reused).
- Upload max 10MB, `multer` memoryStorage → `uploads/` static serve (already in `src/index.ts`).
- Git history must stay additive: 3 new pages + 2 stores + toolbar, no DB migrations, no breaking changes to existing 8 pages.

---

## 3. Architecture & Navigation

### 3.1 New structure (additive)
```
apps/frontend/src/
├── app/(dashboard)/
│   ├── ai/page.tsx              NEW — AI Studio (tabs: Generate | Notion | Tools)
│   ├── ai/callback?             not needed (Notion has no OAuth redirect; setup is DB id only)
│   ├── tiktok/page.tsx          NEW — TikTok Hub (Accounts + Jobs)
│   ├── tiktok/callback/page.tsx NEW — OAuth callback handler (?code=&state=)
│   ├── templates/page.tsx       NEW — Templates grid
│   ├── content/[id]/page.tsx    MODIFY — inject AIToolbar (generate/enhance/hashtags/design)
│   └── layout.tsx               untouched (sidebar change only)
├── components/
│   ├── ai/                      NEW — GenerateForm, GenerateResult, NotionPanel, EnhanceModal, DesignCard, HashtagList, ToolsPanel
│   ├── tiktok/                  NEW — ConnectButton, AccountCard, UploadJobForm, JobStatusTable, JobDetailModal
│   ├── templates/               NEW — TemplateCard, TemplateForm, TemplatePreviewModal
│   └── layout/Sidebar.tsx       MODIFY — 4 → 7 nav items
├── store/
│   ├── aiStore.ts               NEW — AI domain
│   ├── tiktokStore.ts           NEW — TikTok domain
│   └── contentStore.ts          reuse fetchTemplates/createTemplate/deleteTemplate (already exists)
├── utils/constants.ts           MODIFY — add API_ENDPOINTS.AI + complete TIKTOK
└── services/api.ts              reused

src/ (backend — tailing only)
├── services/aiIntegrationService.ts  MODIFY — guard each OpenAI/Notion call with key check → mock fallback
├── controllers/AIController.ts       MODIFY — include `mock:true` + `mock_reason` in response when fallback used
├── services/tiktokService.ts         optionally — if TIKTOK_CLIENT_KEY empty, getAuthUrl returns mock URL + connectAccount creates mock account with flag
└── .env.example                     document OPENAI_MODEL, NOTION_API_KEY, TIKTOK_*, FRONTEND_URL, UPLOAD_DIR (most already in PHASE_6_PROGRESS.md)
```

### 3.2 Navigation (Sidebar.tsx)
From 4 to 7, ordered to match demo flow:
```
Dashboard (/)         BarChart3
Content (/content)    FileText
AI Studio (/ai)       Sparkles          NEW
TikTok (/tiktok)      Music/Video       NEW
Templates (/templates) LayoutTemplate   NEW
Schedule (/schedule)  Calendar
Analytics (/analytics) BarChart3? already exists — keep as is or add route; spec keeps existing
Settings (/settings)  Settings
```
Active state via existing `pathname.startsWith(href)` logic. Collapsed `w-20` mode shows icons only.

### 3.3 Constants (utils/constants.ts)
```ts
API_ENDPOINTS.AI = {
  GENERATE_CAROUSEL: '/ai/generate-carousel',
  NOTION_SETUP: '/ai/notion/setup',
  NOTION_SYNC: '/ai/notion/sync',
  ENHANCE: (id: string) => `/ai/carousels/${id}/enhance`,
  DESIGN_SUGGESTION: '/ai/design-suggestion',
  GENERATE_HASHTAGS: '/ai/generate-hashtags',
}
API_ENDPOINTS.TIKTOK += {
  AUTH_URL: '/tiktok/auth-url',
  DISCONNECT: (id: string) => `/tiktok/accounts/${id}/disconnect`,
  CAROUSEL_JOBS: (id: string) => `/tiktok/carousels/${id}/upload-jobs`,
  JOB_STATUS: (id: string) => `/tiktok/upload-jobs/${id}`,
  PROCESS_JOB: (id: string) => `/tiktok/upload-jobs/${id}/process`,
}
API_ENDPOINTS.CONTENT already complete.
```

### 3.4 Backend fallback contract
- Check `process.env.OPENAI_API_KEY`, `NOTION_API_KEY`, `TIKTOK_CLIENT_KEY` at call time in `aiIntegrationService` / `tiktokService`.
- If empty: **do not throw 500**; return mock payload shaped identically to real response plus `meta: { mock: true, reason: "OPENAI_API_KEY not set — returning dummy content" }`. Controller merges `meta.mock` into top-level `data.mock` so frontend can show banner.
- Mock examples:
  - `generateCarouselFromTopic("Trading Psychology", {style:"professional", slides_count:3})` → carousel `{title:"Trading Psychology — Carousel", description:"AI-generated (mock)…", category:"education", tags:["trading","psychology"]}` + slides 1..3 with title `Slide 1: Understanding …` + content_text lorem + `design: {color_scheme:["#030712","#D4AF37"], fonts:["Inter","Segoe UI"], layout:"centered", visual_elements:["charts","icons"], recommended_dimensions:"1080x1920"}` + hashtags `["#TradingPsikologi","#PsikologiTrading",…]`.
  - `setupNotionIntegration` → `{databaseTitle:"Mock Notion — Trading Ideas", properties:["Title","Content","Category"], connected_at: now}`.
  - `syncNotionAndGenerate` → 2 mock carousels as above.
  - `suggestDesign` / `generateHashtags` → static design/hashtags per topic.
- Real path: carousel still created via `ContentRepository` with dummy or real AI content; slides stored with `style_data`. So `/content` list always gets real DB rows even in mock.

---

## 4. Components — Detailed

### 4.1 AI Studio (/ai) — 3 tabs in one page
**Why tabs not 3 pages:** single-screen demo, no route hopping, fast click-through for `generate → notion → tools` in one mental context. Mobile tabs scroll horizontally.

**Generate (Tab 1):**
- `GenerateForm.tsx`: inputs — `topic` (text, required, min 3), `style` (select: professional/educational/casual/minimal), `slides_count` (range 3–10, default 3), `template_id` (select from `useContentStore.templates`, optional, fetched on mount). Button `Generate` disabled while `aiStore.isGenerating`. Validation inline.
- `GenerateResult.tsx`: renders `aiStore.lastResult` (or last mock). Header carousel title/description, grid 3 cards (slide_number badge, title, content_text truncated), `DesignCard` (color swatches hex circles, font pills, layout label), `HashtagList` (chips with copy button). Actions: `Save to My Content` (already saved — just toast + link `/content/:id`), `Edit in Editor` (`router.push(/content/${id})`), `Regenerate`. Mock banner yellow if `result.mock`.
- Data flow: `GenerateForm` → `aiStore.generateCarousel(topic, opts)` → `POST /ai/generate-carousel` → store `lastResult` → `GenerateResult` auto-renders → `useContentStore.fetchCarousels()` to sync list.

**Notion (Tab 2):**
- `NotionPanel.tsx`: input `notion_database_id` (text), `Setup` button → `POST /ai/notion/setup` → show `databaseTitle` + `properties` tags + `connected_at`. `Sync & Generate` button → `POST /ai/notion/sync` → progress `Generating 2/10…` (loop feedback) → list `carousels_generated` cards (title + slide count). Empty state illustration + example ID `abc123…` + docs link. Error: "Ensure NOTION_API_KEY set and database shared with integration."
- Uses same `aiStore` methods `setupNotion`, `syncNotion`.

**Tools (Tab 3):**
- `ToolsPanel.tsx` two mini-forms:
  - Design: inputs `topic`+`style` → `GET /ai/design-suggestion?topic&style` → `DesignCard`.
  - Hashtags: inputs `title`+`topic` → `GET /ai/generate-hashtags?title&topic` → `HashtagList` with copy all.
- `EnhanceModal.tsx` shared: dropdown carousel (from `contentStore.carousels`), textarea `instruction`, `POST /ai/carousels/:id/enhance` → preview `slides_enhanced` count + updated titles. Also opened from `/content/[id]` toolbar.

**Store (store/aiStore.ts):**
```ts
interface AIState {
  isGenerating: boolean; isSyncing: boolean; error: string|null;
  lastResult: GenerateResult | null; lastNotionSetup: NotionSetup | null;
  mock: boolean;
  generateCarousel(topic: string, opts: {style?:string; slides_count?:number; templateId?:string}): Promise<GenerateResult>
  setupNotion(dbId: string): Promise<NotionSetup>
  syncNotion(dbId: string, templateId?: string): Promise<Carousel[]>
  enhance(carouselId: string, instruction: string): Promise<Slide[]>
  suggestDesign(topic: string, style?: string): Promise<Design>
  generateHashtags(title: string, topic: string): Promise<string[]>
  clearError(): void
}
```
Types: `GenerateResult = {carousel: Carousel, slides: Slide[], design: Design, hashtags: string[], mock?:boolean}`, `Design = {color_scheme:string[], fonts:string[], layout:string, visual_elements?:string[], recommended_dimensions?:string}`, `NotionSetup = {databaseTitle:string, properties:string[], connected_at:string, mock?:boolean}`.

### 4.2 TikTok Hub (/tiktok)
**Layout:** two vertical sections: Connected Accounts (top) + Upload Jobs (bottom). Single page, polling inline.

- `ConnectButton.tsx`: calls `tiktokStore.getAuthUrl(redirectUri)` → `GET /tiktok/auth-url?redirect_uri=http://localhost:3001/tiktok/callback` → `window.location.href = url`. State `isConnecting` spinner. If backend returns 400 due to missing `TIKTOK_CLIENT_KEY`, catch and show mock banner + `Add Mock Account` button (creates local dummy account via fallback endpoint or just shows empty with hint).
- `AccountCard.tsx`: maps `tiktokStore.accounts` from `GET /tiktok/accounts`. Fields: avatar placeholder, `username`/`display_name`, `connected_at` formatted, green dot. Action `Disconnect` → confirm modal → `POST /tiktok/accounts/:id/disconnect` → refresh. Empty: illustration + large `Connect TikTok Account` CTA.
- `UploadJobForm.tsx`: `POST /tiktok/upload-jobs` with `carousel_id` (select from `contentStore.carousels`), `tiktok_account_id` (select from `tiktokStore.accounts`), `scheduled_at` optional datetime-local (must be future). Disabled if `accounts.length===0` with hint "Connect account first". On success toast + prepend to table.
- `JobStatusTable.tsx`: table columns — Carousel (title), Account (username), Status badge (pending=gray, uploading=blue, processing=yellow, published=green, failed=red), Scheduled At, Retry Count, Actions (View, Process Now). Data: `GET /tiktok/carousels/:carouselId/upload-jobs` (if carousel selected) or all via `GET /tiktok/upload-jobs/:jobId` per row on demand. Polling: if any job in `pending|uploading|processing`, `setInterval(fetchJobs, 5000)` until all terminal, cleanup on unmount. Failed row shows `last_error` truncated + Retry (re-process).
- `JobDetailModal.tsx`: click row → modal with full job JSON, `tiktok_video_id` link if `published`, timeline of status.
- `callback/page.tsx`: client, reads `searchParams.get('code')` + `state`, calls `tiktokStore.connectAccount(code, redirectUri)` → `POST /tiktok/connect` → toast → `router.replace('/tiktok')` → `fetchAccounts()`.

**Store (store/tiktokStore.ts):** as described, all via `apiClient` with `withCredentials`, reuses 401 interceptor.

### 4.3 Templates (/templates) + Content Editor wiring
**Templates page:**
- `TemplateCard.tsx`: `name`, `description` truncated, `style_name` badge, `style_data` preview (first color dot + font name + layout), `is_public` badge, `created_at`. Actions: `Use` → `router.push(/content/new?template_id=xxx)` (prefill), `Delete` → confirm → `DELETE /content/templates/:id`. Click card → `TemplatePreviewModal` (1 dummy slide styled with `style_data`).
- `TemplateForm.tsx`: modal for `POST /content/templates` with `name` required, `description`, `style_name` select (modern/minimal/bold/elegant/professional), `style_data` textarea JSON default `{"color_scheme":["#030712","#D4AF37"],"fonts":["Inter"],"layout":"centered"}` with helper + `JSON.parse` validation before submit, `is_public` switch. Empty state: illustration + `Create Your First Template`.
- Uses existing `useContentStore.fetchTemplates/createTemplate/deleteTemplate`; no new store.

**Content editor wiring (`content/[id]/page.tsx` modify):**
- Insert `AIToolbar` above carousel form (visible for both `isNew` and existing; if `isNew` without `carouselId`, disable `Enhance/Hashtags/Design` with tooltip "Save carousel first").
- Buttons: `✨ Generate from Topic` (inline topic input + Generate → if `isNew` creates new carousel and redirects to `/content/:id`; if existing offers `Append as slides` vs `Replace`), `✨ Enhance` (opens `EnhanceModal`), `# Hashtags` (`GET /ai/generate-hashtags` with `formData.title` as title → fills `formData.tags`), `🎨 Design` (`GET /ai/design-suggestion` → `DesignCard` + `Apply to slides` loops `updateSlide` with `style_data`).
- All buttons share `aiStore.isGenerating` disabled + spinner; mock banner small if response `mock:true`.

---

## 5. Data Flow (end-to-end)
1. **Generate:** User on `/ai` fills topic → `generateCarousel` → `POST /ai/generate-carousel` → backend branch mock or real OpenAI → create carousel+slides in DB → 201 with `data` → store `lastResult` → `GenerateResult` + `fetchCarousels()` sync → user clicks Edit → `/content/:id` shows new carousel.
2. **Notion:** `/ai` Notion tab → Setup → Sync → loop 10 pages → each `generateCarousel` → array of carousels → list cards → each links to `/content/:id`.
3. **Editor enhance:** `/content/:id` → Enhance → `POST /ai/carousels/:id/enhance` → backend updates slides → `fetchSlides` → UI refresh.
4. **TikTok:** `/tiktok` Connect → OAuth → `/tiktok/callback` → `POST /tiktok/connect` → `fetchAccounts` → Create Job → `POST /tiktok/upload-jobs` → table polling `GET /tiktok/upload-jobs/:jobId` every 5s → `Process Now` → `POST /upload-jobs/:id/process` → `published`.
5. **Templates:** `/templates` Create → `POST /content/templates` → grid → Use → `/content/new?template_id=xxx` → form prefilled with `style_data` → save.

All flows via `apiClient` (axios, `baseURL` from `NEXT_PUBLIC_API_BASE_URL`, `withCredentials`, 30s timeout). Auth via `accessToken` cookie, 401 auto-refresh already in `services/api.ts`.

---

## 6. Error Handling, Loading, Empty States

**Unified pattern for AI, TikTok, Templates:**
- Field validation → inline red message (topic min 3, `scheduled_at` future, JSON valid).
- API 400/429/500 → `toast.error` + inline `Retry` button, no white screen. Network timeout → toast "Network error — retry".
- Mock mode → persistent yellow banner `Mock mode — set OPENAI_API_KEY / TIKTOK_CLIENT_KEY for real results` when `data.mock===true`; flow continues (DB rows real).
- Loading → skeleton shimmer (grid 3 cards, table rows, form disabled + spinner).
- Empty → illustration + CTA (No templates / No accounts / No jobs / No AI result).
- 401 → interceptor redirects to `/login`.
- Polling jobs → abort on unmount or when all `published|failed`; failed shows `last_error` + `Process Now` retry. Backend scheduler handles exponential backoff; frontend does not auto-retry beyond manual.
- Logging → backend `logger.error` in controllers; no secrets in response or frontend console.

---

## 7. Testing Strategy

**Unit — stores (Jest, mock apiClient):**
- `aiStore`: `generateCarousel` success, `mock:true` branch, 400 topic missing, `syncNotion` 2 carousels, `enhance` empty instruction error, `suggestDesign`/`generateHashtags` query encoding.
- `tiktokStore`: `fetchAccounts` empty + populated, `getAuthUrl` encodes redirect_uri, `connectAccount` stores account, `createUploadJob` validates missing account, `fetchJobStatus` status transitions, polling interval cleared when terminal.
- `contentStore` already tested (Phase 3); add Templates create/delete happy + JSON invalid paths.

**Component — React Testing Library:**
- `GenerateForm` required topic, disabled while generating, mock banner renders when `mock` true.
- `NotionPanel` setup→sync happy, error when dbId empty.
- `AccountCard` disconnect confirm modal, empty CTA.
- `TemplateForm` JSON validation, submit disabled on invalid.
- `AIToolbar` 4 buttons disabled when `isNew` without id.

**Integration — manual E2E checklist (demo script):**
1. Register → Login → land Dashboard.
2. `/ai` Generate "Trading Psychology" without keys → mock result → Save → verify in `/content` list.
3. `/ai` Notion dummy id → Sync → 2 mock carousels → click one → editor shows slides.
4. `/content/:id` Enhance "Make more engaging" → Hashtags → Design → Apply → Save → verify.
5. `/tiktok` (keys empty) → mock banner → Add Mock Account or Connect (if keys set) → Create Job (carousel+account) → table polling → `Process Now` → `published`.
6. `/templates` Create → Use in Generate → Delete → list updates.
7. Build gates: `npm run build` root `tsc` green, `npx tsc --noEmit` frontend green, `npm test -- aiStore tiktokStore` green, no console 404/Heart errors.

**Coverage target:** Backend stays 70%+, new frontend stores+components 50% (existing Jest setup in `apps/frontend/jest.config.js` reused). No E2E automation in this spec.

---

## 8. Deployment & Env

**Env (document in `.env.example` root + `apps/frontend/.env.example`):**
```
# Backend (already mostly in PHASE_6_PROGRESS.md)
OPENAI_API_KEY=            # optional — mock if empty
OPENAI_MODEL=gpt-4o
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7
NOTION_API_KEY=            # optional — mock if empty
TIKTOK_CLIENT_KEY=         # optional — mock if empty
TIKTOK_CLIENT_SECRET=
FRONTEND_URL=http://localhost:3001
UPLOAD_DIR=./uploads
PORT=3000
DATABASE_URL=postgres://...
JWT_SECRET=...

# Frontend
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```
No secrets in frontend bundle.

**Build & run gates (must stay green):**
- `npm run build` (root, `tsc` backend)
- `npx tsc --noEmit` (frontend)
- `yarn build` / `next build` (frontend, optional in CI)
- Existing `apiClient` baseURL + `middleware.ts` auth guard covers new `/ai`, `/tiktok`, `/templates` (matcher `'/((?!api|_next/static|_next/image|favicon.ico).*)'` already protects them; add to publicRoutes check).

**Infra reuse:** existing CORS (`origin: FRONTEND_URL, credentials:true`), helmet, cookieParser, static `/uploads`, `tiktokScheduler.start()` cron. No new Docker, no new DB migrations, no new Redis keys.

**Rollback:** all additive behind new routes; mock flag makes behavior reversible. Revert commit restores 8-page baseline without loss.

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| OpenAI/Notion keys missing → demo fails | Mock fallbacks with identical shape + banner; DB rows still real |
| TikTok OAuth unavailable locally | Mock account path + manual `Process Now` to simulate publish without real TikTok API |
| Template `style_data` JSON invalid | Client `JSON.parse` validation + inline error; backend already stores `style_data: Record<string,any>` |
| Polling interval leak | `clearInterval` on unmount + when all jobs terminal; max 30 polls cap |
| Sidebar nav overflow on collapsed | Icons only in `w-20` mode, tooltips on hover |

---

## 10. Open Decisions (resolved in spec)

- Tabs vs separate pages for AI Studio → **tabs** (faster demo).
- Separate AI backend or reuse → **reuse** `aiIntegrationService` with guard clauses, no new service.
- Mock implementation → **in-place** in existing service, not separate mock service, to keep shape identical.

---

## 11. File-level Acceptance (for plan generator)

- `apps/frontend/src/app/(dashboard)/ai/page.tsx` exists, renders 3 tabs, all 6 AI endpoints wired, mock banner when `mock:true`, `withCredentials`, auth-guarded.
- `apps/frontend/src/app/(dashboard)/tiktok/page.tsx` + `tiktok/callback/page.tsx` exist, Connect → Accounts → Jobs → Polling → Process Now, handles missing `TIKTOK_CLIENT_KEY`.
- `apps/frontend/src/app/(dashboard)/templates/page.tsx` exists, grid + create/delete + Use→prefill + preview, JSON validation.
- `apps/frontend/src/app/(dashboard)/content/[id]/page.tsx` has `AIToolbar` with 4 actions, reuses `aiStore`, disabled when `isNew` without id.
- `apps/frontend/src/components/layout/Sidebar.tsx` has 7 nav items with correct icons and active states.
- `apps/frontend/src/store/aiStore.ts` + `tiktokStore.ts` exist, full CRUD + error + mock handling, via `apiClient`.
- `apps/frontend/src/utils/constants.ts` has `API_ENDPOINTS.AI` + completed `TIKTOK`.
- `src/services/aiIntegrationService.ts` + `src/controllers/AIController.ts` return mock payloads when keys empty, with `mock` flag.
- `.env.example` documents new keys, `.gitignore` already covers `.next/` + `tsconfig.tsbuildinfo`.
- `npm run build` + `npx tsc --noEmit` green, no `@ts-nocheck` reintroduced, `yarn.lock` has no `next-auth`.

---

*End of spec. Next: `writing-plans` skill to generate task-level implementation plan.*
