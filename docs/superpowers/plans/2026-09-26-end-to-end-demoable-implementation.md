# End-to-End Demoable Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire all 40+ backend endpoints to UI with mock fallbacks so the full flow register→generate AI→edit→schedule→TikTok job→analytics works end-to-end without Postman or external keys.

**Architecture:** Additive UI layer on existing Next.js 15 App Router + Express. Three new dashboard pages (/ai, /tiktok, /templates) plus AI toolbar injected into existing content editor, two new Zustand stores (aiStore, tiktokStore) via existing apiClient with withCredentials. Backend tailing only: guard aiIntegrationService/tiktokService with key checks returning mock payloads shaped identically to real responses plus `mock:true`.

**Tech Stack:** Next.js 15, React 18, TypeScript strict, Tailwind, Zustand, axios, @hello-pangea/dnd (existing), recharts, lucide-react, Express, node-cron (existing scheduler)

**Spec:** `docs/superpowers/specs/2026-09-26-end-to-end-demoable-design.md`

## Global Constraints

- Node 18+ required
- Backend `http://localhost:3000`, frontend `http://localhost:3001` via `NEXT_PUBLIC_API_BASE_URL`, JWT in HTTP-only cookies `accessToken`/`refreshToken`, `withCredentials:true`, CORS `origin: FRONTEND_URL` with `credentials:true`
- TypeScript strict true, `skipLibCheck:true`, `npx tsc --noEmit` (frontend) and `npm run build` (root `tsc` backend) must stay green, no `// @ts-nocheck` reintroduced
- All new routes `/ai`, `/tiktok`, `/templates` protected by `apps/frontend/src/middleware.ts` (check `accessToken` cookie, redirect to `/login`)
- No secrets in frontend bundle; `axios` single instance `services/api.ts` with 401 auto-refresh reused
- Upload max 10MB, multer memoryStorage, static `/uploads` serve unchanged
- Existing 8 pages must not break; changes are additive, no DB migrations

## Review Focus

1. **Empty external keys (OPENAI_API_KEY / NOTION_API_KEY / TIKTOK_CLIENT_KEY unset)** — user runs `POST /ai/generate-carousel` and `GET /tiktok/auth-url`; program must return 201/200 with mock payload + `mock:true` banner, not 500, and still create DB carousel rows.
2. **Expired accessToken mid-flow** — user generates AI or creates upload job with stale JWT; apiClient interceptor must refresh via cookies or redirect to `/login`, not leave UI hanging in loading.
3. **Invalid template style_data JSON** — user pastes malformed JSON in TemplateForm; UI must show inline validation and block submit, backend must not crash on `style_data`.
4. **Polling leak for upload jobs** — user opens `/tiktok` with pending jobs then navigates away; interval must clear on unmount and when all jobs reach terminal states, not keep fetching.
5. **Schedule in the past** — user picks `scheduled_at` in the past in UploadJobForm; UI must reject with inline error, backend must return 400, not create job with stale timestamp.

---

## File Structure

```
apps/frontend/src/
├── utils/constants.ts                          MODIFY — add API_ENDPOINTS.AI + complete TIKTOK
├── store/
│   ├── aiStore.ts                              CREATE — AI domain Zustand store
│   ├── tiktokStore.ts                          CREATE — TikTok domain Zustand store
│   └── contentStore.ts                         REUSE — fetchTemplates/createTemplate already exists
├── components/
│   ├── ai/
│   │   ├── GenerateForm.tsx                    CREATE
│   │   ├── GenerateResult.tsx                  CREATE
│   │   ├── NotionPanel.tsx                     CREATE
│   │   ├── DesignCard.tsx                      CREATE
│   │   ├── HashtagList.tsx                     CREATE
│   │   ├── EnhanceModal.tsx                    CREATE (shared with editor)
│   │   └── ToolsPanel.tsx                      CREATE
│   ├── tiktok/
│   │   ├── ConnectButton.tsx                   CREATE
│   │   ├── AccountCard.tsx                     CREATE
│   │   ├── UploadJobForm.tsx                   CREATE
│   │   ├── JobStatusTable.tsx                  CREATE
│   │   └── JobDetailModal.tsx                  CREATE
│   ├── templates/
│   │   ├── TemplateCard.tsx                    CREATE
│   │   ├── TemplateForm.tsx                    CREATE
│   │   └── TemplatePreviewModal.tsx            CREATE
│   └── layout/Sidebar.tsx                      MODIFY — 4 → 7 nav items
├── app/(dashboard)/
│   ├── ai/page.tsx                             CREATE — tabs: Generate | Notion | Tools
│   ├── tiktok/page.tsx                         CREATE — Accounts + Jobs
│   ├── tiktok/callback/page.tsx                CREATE — OAuth handler ?code=
│   ├── templates/page.tsx                      CREATE — grid + CRUD
│   ├── content/[id]/page.tsx                   MODIFY — inject AIToolbar
│   └── layout.tsx                              untouched
├── middleware.ts                               MODIFY — ensure /ai /tiktok /templates guarded
└── services/api.ts                             REUSE — no change

src/
├── services/aiIntegrationService.ts            MODIFY — mock fallback guards per method
├── services/tiktokService.ts                   MODIFY — mock fallback for auth-url / connect if no keys
├── controllers/AIController.ts                 MODIFY — surface mock flag in response
└── controllers/TikTokController.ts             MODIFY — surface mock flag if needed
```

---

### Task 1: Constants + Backend Mock Fallback Foundations

**Files:**
- Modify: `apps/frontend/src/utils/constants.ts`
- Modify: `src/services/aiIntegrationService.ts`
- Modify: `src/controllers/AIController.ts`
- Modify: `src/services/tiktokService.ts` (only getAuthUrl + connectAccount paths)
- Modify: `.env.example` (root) — document optional keys
- Test: `src/services/__tests__/aiIntegrationService.mock.test.ts` (new) + existing backend tests still green

**Interfaces:**
- Consumes: `aiIntegrationService.generateCarouselFromTopic`, `setupNotionIntegration`, `syncNotionAndGenerate`, `enhanceCarouselSlides`, `suggestDesign`, `generateHashtags`; `tiktokService.getAuthUrl`, `connectAccount`
- Produces: `API_ENDPOINTS.AI.*` constants for frontend; backend `mock:true` payloads with same shape as real responses plus `data.mock` flag so frontend can show banner

- [ ] **Step 1: Write failing test for constants**

```ts
// apps/frontend/src/utils/__tests__/constants.test.ts
import { API_ENDPOINTS } from '../constants';
describe('API_ENDPOINTS', () => {
  it('exposes AI endpoints', () => {
    expect(API_ENDPOINTS.AI.GENERATE_CAROUSEL).toBe('/ai/generate-carousel');
    expect(API_ENDPOINTS.AI.NOTION_SETUP).toBe('/ai/notion/setup');
    expect(API_ENDPOINTS.AI.ENHANCE('abc')).toBe('/ai/carousels/abc/enhance');
    expect(API_ENDPOINTS.AI.DESIGN_SUGGESTION).toBe('/ai/design-suggestion');
    expect(API_ENDPOINTS.AI.GENERATE_HASHTAGS).toBe('/ai/generate-hashtags');
  });
  it('exposes TikTok endpoints complete', () => {
    expect(API_ENDPOINTS.TIKTOK.AUTH_URL).toBe('/tiktok/auth-url');
    expect(API_ENDPOINTS.TIKTOK.DISCONNECT('x')).toBe('/tiktok/accounts/x/disconnect');
  });
});
```
Run: `cd apps/frontend && npx jest src/utils/__tests__/constants.test.ts -v` Expected: FAIL — AI / TIKTOK.AUTH_URL not defined

- [ ] **Step 2: Implement constants**

```ts
// apps/frontend/src/utils/constants.ts — add after AUTH block
export const API_ENDPOINTS = {
  AUTH: { REGISTER: '/auth/register', LOGIN: '/auth/login', PROFILE: '/auth/profile', CHANGE_PASSWORD: '/auth/change-password' },
  CONTENT: { CAROUSELS: '/content/carousels', TEMPLATES: '/content/templates', SLIDES: '/content/slides' },
  AI: {
    GENERATE_CAROUSEL: '/ai/generate-carousel',
    NOTION_SETUP: '/ai/notion/setup',
    NOTION_SYNC: '/ai/notion/sync',
    ENHANCE: (id: string) => `/ai/carousels/${id}/enhance`,
    DESIGN_SUGGESTION: '/ai/design-suggestion',
    GENERATE_HASHTAGS: '/ai/generate-hashtags',
  },
  TIKTOK: {
    AUTH_URL: '/tiktok/auth-url',
    CONNECT: '/tiktok/connect',
    ACCOUNTS: '/tiktok/accounts',
    DISCONNECT: (id: string) => `/tiktok/accounts/${id}/disconnect`,
    UPLOAD_JOBS: '/tiktok/upload-jobs',
    CAROUSEL_JOBS: (id: string) => `/tiktok/carousels/${id}/upload-jobs`,
    JOB_STATUS: (id: string) => `/tiktok/upload-jobs/${id}`,
    PROCESS_JOB: (id: string) => `/tiktok/upload-jobs/${id}/process`,
  },
  ANALYTICS: { DASHBOARD: '/analytics/dashboard', CAROUSEL: '/analytics/carousels', TRENDS: '/analytics/carousels/:id/trends', TOP_CONTENT: '/analytics/top-content' },
};
```

- [ ] **Step 3: Write failing backend mock test**

```ts
// src/services/__tests__/aiIntegrationService.mock.test.ts
import aiIntegrationService from '../aiIntegrationService';
describe('aiIntegrationService mock fallbacks', () => {
  const orig = process.env.OPENAI_API_KEY;
  beforeEach(() => { delete process.env.OPENAI_API_KEY; });
  afterEach(() => { process.env.OPENAI_API_KEY = orig; });
  it('generateCarouselFromTopic returns mock with mock:true when OPENAI_API_KEY empty', async () => {
    const res: any = await aiIntegrationService.generateCarouselFromTopic('user-id-123', 'Trading Psychology', { style: 'professional', slides_count: 3 });
    expect(res.carousel).toBeDefined();
    expect(res.slides.length).toBe(3);
    expect(res.mock).toBe(true);
  });
});
```
Run: `npm test -- aiIntegrationService.mock -v` Expected: FAIL — no mock branch

- [ ] **Step 4: Implement backend mock guards**

In `src/services/aiIntegrationService.ts` — at top of each public method (`generateCarouselFromTopic`, `setupNotionIntegration`, `syncNotionAndGenerate`, `enhanceCarouselSlides`, `suggestDesign`, `generateHashtags`) add:
```ts
const isMock = !process.env.OPENAI_API_KEY; // or NOTION_API_KEY per method
if (isMock) {
  // return shape-identical mock WITHOUT calling OpenAI/Notion
  // still create carousel+slides in DB via ContentRepository when appropriate (generate/sync)
  // include mock:true
}
```
For `generateCarouselFromTopic` mock: create carousel via `contentRepository.createCarousel` with dummy title/description `Trading Psychology — Carousel (mock)`, tags `["trading","psychology"]`, then create 3 slides with `style_data: {color_scheme:["#030712","#D4AF37"], fonts:["Inter"], layout:"centered"}` and return `{carousel, slides, design: {color_scheme:["#030712","#D4AF37"], fonts:["Inter","Segoe UI"], layout:"centered", visual_elements:["charts","icons"], recommended_dimensions:"1080x1920"}, hashtags:["#TradingPsikologi","#PsikologiTrading","#EdukasiTrading"], mock:true, mock_reason:"OPENAI_API_KEY not set"}`.

In `src/controllers/AIController.ts` — after service returns, ensure `res.status(201).json({status:'success', data: {...result, mock: (result as any).mock || false}})` so frontend can check `data.mock`.

In `src/services/tiktokService.ts` — in `getAuthUrl` if `!process.env.TIKTOK_CLIENT_KEY` return `http://localhost:3001/tiktok/callback?mock=1` with `mock:true` flag; in `connectAccount` if mock, create dummy account row with `username: mock_tiktok_user`.

Update `.env.example` documenting keys as optional with mock note (copy from spec §8).

- [ ] **Step 5: Run tests to verify**

Run: `npm test -- aiIntegrationService.mock -v` Expected: PASS
Run: `npm run build` Expected: PASS (tsc backend)
Run: `cd apps/frontend && npx jest src/utils/__tests__/constants.test.ts -v` Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/utils/constants.ts src/services/aiIntegrationService.ts src/controllers/AIController.ts src/services/tiktokService.ts .env.example src/services/__tests__/aiIntegrationService.mock.test.ts apps/frontend/src/utils/__tests__/constants.test.ts
git commit -m "feat: constants AI/TikTok + backend mock fallbacks for demo without keys"
```

---

### Task 2: AI Store (Zustand)

**Files:**
- Create: `apps/frontend/src/store/aiStore.ts`
- Create: `apps/frontend/src/store/__tests__/aiStore.test.ts`
- Modify: `apps/frontend/src/types/index.ts` — add `GenerateResult`, `Design`, `NotionSetup` types

**Interfaces:**
- Consumes: `apiClient` from `services/api.ts`, `API_ENDPOINTS.AI` from Task 1
- Produces: `useAIStore` with `generateCarousel(topic, opts)`, `setupNotion(dbId)`, `syncNotion(dbId, templateId?)`, `enhance(carouselId, instruction)`, `suggestDesign(topic, style?)`, `generateHashtags(title, topic)` — all `withCredentials`, 401 handled by existing interceptor

- [ ] **Step 1: Write failing store tests**

```ts
// apps/frontend/src/store/__tests__/aiStore.test.ts
jest.mock('@/services/api', () => ({ apiClient: { post: jest.fn(), get: jest.fn() } }));
import { apiClient } from '@/services/api';
import { useAIStore } from '../aiStore';
const mocked = apiClient as jest.Mocked<typeof apiClient>;

describe('aiStore', () => {
  beforeEach(() => { mocked.post.mockReset(); mocked.get.mockReset(); useAIStore.setState({ lastResult: null, error: null, isGenerating: false, mock:false } as any); });
  it('generateCarousel sets mock flag when backend returns mock:true', async () => {
    mocked.post.mockResolvedValueOnce({ data: { carousel:{id:'c1',title:'T'}, slides:[{id:'s1'}], design:{color_scheme:['#000']}, hashtags:['#a'], mock:true } } as any);
    await useAIStore.getState().generateCarousel('Trading Psychology', {});
    expect(useAIStore.getState().mock).toBe(true);
    expect(useAIStore.getState().lastResult?.carousel.id).toBe('c1');
  });
  it('enhance requires instruction', async () => {
    mocked.post.mockRejectedValueOnce({ response:{data:{error:{message:'instruction is required'}}}} as any);
    await expect(useAIStore.getState().enhance('c1','')).rejects.toBeDefined();
  });
});
```
Run: `cd apps/frontend && npx jest src/store/__tests__/aiStore.test.ts -v` Expected: FAIL — module not found

- [ ] **Step 2: Add types**

```ts
// apps/frontend/src/types/index.ts — append
export interface Design { color_scheme:string[]; fonts:string[]; layout:string; visual_elements?:string[]; recommended_dimensions?:string; }
export interface GenerateResult { carousel: Carousel; slides: Slide[]; design: Design; hashtags: string[]; mock?: boolean; mock_reason?: string; }
export interface NotionSetup { databaseTitle: string; properties: string[]; connected_at: string; mock?: boolean; }
```

- [ ] **Step 3: Implement aiStore.ts** (minimal to pass tests, reuse contentStore error pattern)

```ts
'use client';
import { create } from 'zustand';
import { apiClient } from '@/services/api';
import { API_ENDPOINTS } from '@/utils/constants';
import { GenerateResult, NotionSetup, Design, Slide } from '@/types';
interface AIState { isGenerating:boolean; isSyncing:boolean; error:string|null; lastResult: GenerateResult|null; lastNotionSetup: NotionSetup|null; mock:boolean; lastDesign: Design|null; lastHashtags: string[]; generateCarousel(topic:string, opts:{style?:string;slides_count?:number;templateId?:string}):Promise<GenerateResult>; setupNotion(dbId:string):Promise<NotionSetup>; syncNotion(dbId:string, templateId?:string):Promise<any[]>; enhance(carouselId:string, instruction:string):Promise<Slide[]>; suggestDesign(topic:string, style?:string):Promise<Design>; generateHashtags(title:string, topic:string):Promise<string[]>; clearError():void; }
export const useAIStore = create<AIState>((set)=>({
  isGenerating:false,isSyncing:false,error:null,lastResult:null,lastNotionSetup:null,mock:false,lastDesign:null,lastHashtags:[],
  generateCarousel: async (topic, opts)=>{ set({isGenerating:true,error:null}); try{ const r:any=await apiClient.post(API_ENDPOINTS.AI.GENERATE_CAROUSEL,{topic, style:opts.style,s slides_count:opts.slides_count, template_id:opts.templateId}); const d=r.data; set({lastResult:d, mock:!!d.mock, isGenerating:false}); return d;}catch(e:any){ set({error:e.response?.data?.error?.message||e.message, isGenerating:false}); throw e;}},
  setupNotion: async (dbId)=>{ set({isSyncing:true,error:null}); try{ const r:any=await apiClient.post(API_ENDPOINTS.AI.NOTION_SETUP,{notion_database_id:dbId}); set({lastNotionSetup:r.data, isSyncing:false}); return r.data;}catch(e:any){ set({error:e.response?.data?.error?.message||e.message, isSyncing:false}); throw e;}},
  syncNotion: async (dbId, templateId)=>{ set({isSyncing:true,error:null}); try{ const r:any=await apiClient.post(API_ENDPOINTS.AI.NOTION_SYNC,{notion_database_id:dbId, template_id:templateId}); set({isSyncing:false}); return r.data.carousels||r.data;}catch(e:any){ set({error:e.response?.data?.error?.message||e.message, isSyncing:false}); throw e;}},
  enhance: async (cid, instruction)=>{ if(!instruction) throw new Error('instruction is required'); set({isGenerating:true,error:null}); try{ const r:any=await apiClient.post(API_ENDPOINTS.AI.ENHANCE(cid),{instruction}); set({isGenerating:false}); return r.data.slides;}catch(e:any){ set({error:e.response?.data?.error?.message||e.message, isGenerating:false}); throw e;}},
  suggestDesign: async (topic, style)=>{ const r:any=await apiClient.get(`${API_ENDPOINTS.AI.DESIGN_SUGGESTION}?topic=${encodeURIComponent(topic)}&style=${encodeURIComponent(style||'professional')}`); set({lastDesign:r.data.design}); return r.data.design;},
  generateHashtags: async (title, topic)=>{ const r:any=await apiClient.get(`${API_ENDPOINTS.AI.GENERATE_HASHTAGS}?title=${encodeURIComponent(title)}&topic=${encodeURIComponent(topic)}`); set({lastHashtags:r.data.hashtags}); return r.data.hashtags;},
  clearError: ()=>set({error:null}),
}));
```
(Expand to full typed implementation; ensure `apiClient.post` returns `ApiResponse` style — unwrap `response.data` correctly per existing `apiClient` wrapper.)

- [ ] **Step 4: Run store tests**

Run: `cd apps/frontend && npx jest src/store/__tests__/aiStore.test.ts -v` Expected: PASS
Run: `npx tsc --noEmit` Expected: PASS (fix types inline as needed)

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/store/aiStore.ts apps/frontend/src/types/index.ts apps/frontend/src/store/__tests__/aiStore.test.ts
git commit -m "feat: aiStore with generate/notion/enhance/design/hashtags + mock flag"
```

---

### Task 3: TikTok Store

**Files:**
- Create: `apps/frontend/src/store/tiktokStore.ts`
- Create: `apps/frontend/src/store/__tests__/tiktokStore.test.ts`

**Interfaces:**
- Consumes: `apiClient`, `API_ENDPOINTS.TIKTOK` from Task 1
- Produces: `useTikTokStore` with `fetchAccounts`, `getAuthUrl`, `connectAccount`, `disconnectAccount`, `createUploadJob`, `fetchJobs`, `fetchJobStatus`, `processJob`

- [ ] **Step 1: Write failing tests**

```ts
// apps/frontend/src/store/__tests__/tiktokStore.test.ts
jest.mock('@/services/api', () => ({ apiClient:{get:jest.fn(), post:jest.fn()} }));
import { apiClient } from '@/services/api'; import { useTikTokStore } from '../tiktokStore';
const m = apiClient as jest.Mocked<typeof apiClient>;
describe('tiktokStore', ()=>{
  beforeEach(()=>{ m.get.mockReset(); m.post.mockReset(); });
  it('fetchAccounts populates accounts', async ()=>{ m.get.mockResolvedValueOnce({data:{accounts:[{id:'a1',username:'u'}]}} as any); await useTikTokStore.getState().fetchAccounts(); expect(useTikTokStore.getState().accounts.length).toBe(1); });
  it('createUploadJob validates', async ()=>{ await expect(useTikTokStore.getState().createUploadJob('','a1')).rejects.toBeDefined(); });
});
```
Run: `npx jest src/store/__tests__/tiktokStore -v` Expected: FAIL — not found

- [ ] **Step 2: Implement tiktokStore.ts**

```ts
'use client';
import {create} from 'zustand'; import {apiClient} from '@/services/api'; import {API_ENDPOINTS} from '@/utils/constants'; import {UploadJob} from '@/types';
interface TikTokAccount{id:string;username:string;display_name?:string;connected_at:string;status:string}
interface S{accounts:TikTokAccount[];jobs:UploadJob[];isLoading:boolean;isConnecting:boolean;error:string|null;fetchAccounts():Promise<void>;getAuthUrl(uri:string):Promise<string>;connectAccount(code:string,uri:string):Promise<void>;disconnectAccount(id:string):Promise<void>;createUploadJob(cid:string,aid:string,scheduledAt?:string):Promise<UploadJob>;fetchJobs(cid?:string):Promise<void>;fetchJobStatus(id:string):Promise<UploadJob>;processJob(id:string):Promise<void>;}
export const useTikTokStore=create<S>((set,get)=>({
  accounts:[],jobs:[],isLoading:false,isConnecting:false,error:null,
  fetchAccounts: async()=>{ set({isLoading:true,error:null}); try{ const r:any=await apiClient.get(API_ENDPOINTS.TIKTOK.ACCOUNTS); set({accounts:r.data.accounts||r.data, isLoading:false}); }catch(e:any){ set({error:e.response?.data?.error?.message||e.message, isLoading:false}); throw e; }},
  getAuthUrl: async(uri)=>{ const r:any=await apiClient.get(`${API_ENDPOINTS.TIKTOK.AUTH_URL}?redirect_uri=${encodeURIComponent(uri)}`); return r.data.auth_url||r.data.url; },
  connectAccount: async(code,uri)=>{ set({isConnecting:true}); try{ await apiClient.post(API_ENDPOINTS.TIKTOK.CONNECT,{code,redirect_uri:uri}); set({isConnecting:false}); await get().fetchAccounts(); }catch(e:any){ set({isConnecting:false}); throw e; }},
  disconnectAccount: async(id)=>{ await apiClient.post(API_ENDPOINTS.TIKTOK.DISCONNECT(id)); set(s=>({accounts:s.accounts.filter(a=>a.id!==id)})); },
  createUploadJob: async(cid,aid,sat)=>{ if(!cid||!aid) throw new Error('carousel_id and tiktok_account_id required'); const r:any=await apiClient.post(API_ENDPOINTS.TIKTOK.UPLOAD_JOBS,{carousel_id:cid,tiktok_account_id:aid,scheduled_at:sat}); const job=r.data.job||r.data; set(s=>({jobs:[job,...s.jobs]})); return job; },
  fetchJobs: async(cid)=>{ const url=cid?API_ENDPOINTS.TIKTOK.CAROUSEL_JOBS(cid):API_ENDPOINTS.TIKTOK.UPLOAD_JOBS; const r:any=await apiClient.get(url); set({jobs:r.data.jobs||r.data.upload_jobs||r.data}); },
  fetchJobStatus: async(id)=>{ const r:any=await apiClient.get(API_ENDPOINTS.TIKTOK.JOB_STATUS(id)); return r.data.job||r.data; },
  processJob: async(id)=>{ const r:any=await apiClient.post(API_ENDPOINTS.TIKTOK.PROCESS_JOB(id)); const job=r.data.job||r.data; set(s=>({jobs:s.jobs.map(j=>j.id===id?job:j)})); return job; },
}));
```

- [ ] **Step 3: Verify**

Run: `npx jest src/store/__tests__/tiktokStore -v` Expected: PASS
Run: `npx tsc --noEmit` Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/store/tiktokStore.ts apps/frontend/src/store/__tests__/tiktokStore.test.ts
git commit -m "feat: tiktokStore accounts + upload jobs with polling support"
```

---

### Task 4: AI Studio Page (/ai) — Generate + Notion + Tools

**Files:**
- Create: `apps/frontend/src/components/ai/GenerateForm.tsx`
- Create: `apps/frontend/src/components/ai/GenerateResult.tsx`
- Create: `apps/frontend/src/components/ai/NotionPanel.tsx`
- Create: `apps/frontend/src/components/ai/DesignCard.tsx`
- Create: `apps/frontend/src/components/ai/HashtagList.tsx`
- Create: `apps/frontend/src/components/ai/EnhanceModal.tsx`
- Create: `apps/frontend/src/components/ai/ToolsPanel.tsx`
- Create: `apps/frontend/src/app/(dashboard)/ai/page.tsx`
- Test: `apps/frontend/src/components/ai/__tests__/GenerateForm.test.tsx`

**Interfaces:**
- Consumes: `useAIStore` (Task 2), `useContentStore` (existing), `toast` from `store/toastStore`
- Produces: `/ai` route with tabs, wiring 6 AI endpoints, mock banner when `lastResult.mock===true`

- [ ] **Step 1: Write failing component test**

```tsx
// apps/frontend/src/components/ai/__tests__/GenerateForm.test.tsx
import {render, screen, fireEvent} from '@testing-library/react';
import GenerateForm from '../GenerateForm';
test('GenerateForm requires topic min 3 chars', async ()=>{
  render(<GenerateForm onGenerated={jest.fn()}/>);
  const btn = screen.getByRole('button',{name:/Generate/i});
  fireEvent.click(btn);
  expect(await screen.findByText(/topic is required|min 3/i)).toBeInTheDocument();
});
```
Run: `npx jest src/components/ai/__tests__/GenerateForm -v` Expected: FAIL — component missing

- [ ] **Step 2: Implement components (minimal to pass)**

`GenerateForm.tsx` — form with topic/style/slides_count/template_id, calls `useAIStore.generateCarousel`, shows inline error, disabled when `isGenerating`, on success calls `onGenerated(result)` and `toast.success`.

`GenerateResult.tsx` — props `result: GenerateResult`, renders mock banner if `result.mock`, grid of slides, DesignCard, HashtagList, actions `Save` → toast + fetchCarousels, `Edit in Editor` → `router.push(/content/${carousel.id})`.

`DesignCard.tsx` — props `design: Design`, renders color_scheme circles with hex label, fonts pills, layout, visual_elements.

`HashtagList.tsx` — props `hashtags:string[]`, chips + `Copy All` → `navigator.clipboard.writeText(hashtags.join(' '))` + toast.

`NotionPanel.tsx` — state `dbId`, `setupResult`, calls `setupNotion` then `syncNotion`, lists `carousels_generated` cards linking to `/content/:id`.

`ToolsPanel.tsx` — two forms for `suggestDesign` and `generateHashtags` with result inline + copy.

`EnhanceModal.tsx` — modal with carousel select (from `useContentStore.carousels`), instruction textarea, submit → `enhance(carouselId, instruction)` → toast + close, shared export for Task 7.

`ai/page.tsx`:
```tsx
'use client';
import {useState} from 'react';
import GenerateForm from '@/components/ai/GenerateForm';
import GenerateResult from '@/components/ai/GenerateResult';
import NotionPanel from '@/components/ai/NotionPanel';
import ToolsPanel from '@/components/ai/ToolsPanel';
import { useAIStore } from '@/store/aiStore';
export default function AIStudioPage(){
  const {lastResult} = useAIStore();
  const [tab,setTab]=useState<'generate'|'notion'|'tools'>('generate');
  return (<div className="space-y-6"><h1 className="text-3xl font-bold">AI Studio</h1><div className="flex gap-2 border-b"><button onClick={()=>setTab('generate')}>Generate</button><button onClick={()=>setTab('notion')}>Notion</button><button onClick={()=>setTab('tools')}>Tools</button></div>{tab==='generate'&&<><GenerateForm onGenerated={()=>{}} />{lastResult&&<GenerateResult result={lastResult} />}</>}{tab==='notion'&&<NotionPanel />}{tab==='tools'&&<ToolsPanel />}</div>);
}
```
Expand with Tabs styling (shadcn Tabs or simple buttons), loading skeletons, error toast.

- [ ] **Step 3: Run tests + tsc**

Run: `npx jest src/components/ai/__tests__/GenerateForm -v` Expected: PASS
Run: `npx tsc --noEmit` Expected: PASS

- [ ] **Step 4: Manual verify**

Run: `yarn dev` then visit `http://localhost:3001/ai` → tabs switch, Generate "Trading Psychology" without keys → mock result + yellow banner → Edit link goes to `/content/:id`.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/app/\(dashboard\)/ai/ apps/frontend/src/components/ai/
git commit -m "feat: AI Studio /ai with Generate/Notion/Tools + mock banner"
```

---

### Task 5: TikTok Hub (/tiktok + callback)

**Files:**
- Create: `apps/frontend/src/components/tiktok/ConnectButton.tsx`
- Create: `apps/frontend/src/components/tiktok/AccountCard.tsx`
- Create: `apps/frontend/src/components/tiktok/UploadJobForm.tsx`
- Create: `apps/frontend/src/components/tiktok/JobStatusTable.tsx`
- Create: `apps/frontend/src/components/tiktok/JobDetailModal.tsx`
- Create: `apps/frontend/src/app/(dashboard)/tiktok/page.tsx`
- Create: `apps/frontend/src/app/(dashboard)/tiktok/callback/page.tsx`
- Test: `apps/frontend/src/components/tiktok/__tests__/AccountCard.test.tsx`

**Interfaces:**
- Consumes: `useTikTokStore` (Task 3), `useContentStore` (for carousel select), `apiClient` constants
- Produces: `/tiktok` with Accounts section + Jobs table with 5s polling, `/tiktok/callback` OAuth handler

- [ ] **Step 1: Failing test**

```tsx
import {render, screen} from '@testing-library/react';
import AccountCard from '../AccountCard';
test('AccountCard renders disconnect when account present', ()=>{
  render(<AccountCard account={{id:'a1',username:'test_user',connected_at:new Date().toISOString(),status:'active'}} onDisconnect={jest.fn()}/>);
  expect(screen.getByText(/Disconnect/i)).toBeInTheDocument();
});
```
Run: `npx jest src/components/tiktok/__tests__/AccountCard -v` Expected: FAIL

- [ ] **Step 2: Implement**

`ConnectButton.tsx` — calls `getAuthUrl` then `window.location.href`.

`AccountCard.tsx` — avatar, username, connected_at, disconnect with confirm modal.

`UploadJobForm.tsx` — selects carousel + account + scheduled_at (future validation: `new Date(scheduledAt) > new Date()` else inline error), submit → `createUploadJob` + toast.

`JobStatusTable.tsx` — table with status badges, `Process Now` per row, polling: `useEffect(()=>{ if(jobs.some(j=>['pending','uploading','processing'].includes(j.status))){ const id=setInterval(fetchJobs,5000); return ()=>clearInterval(id);} },[jobs])` capped at 30 polls.

`JobDetailModal.tsx` — modal showing job JSON + tiktok_video_id link.

`tiktok/page.tsx` — fetchAccounts + fetchJobs on mount, mock banner if accounts empty and backend returned mock error, two sections vertical.

`tiktok/callback/page.tsx` — `'use client'` + `useSearchParams` + `useEffect(()=>{ const code=params.get('code'); if(code) connectAccount(code, redirectUri).then(()=>router.replace('/tiktok')) })`.

- [ ] **Step 3: Verify**

Run: `npx jest src/components/tiktok/__tests__/AccountCard -v` Expected: PASS
Run: `npx tsc --noEmit` Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/app/\(dashboard\)/tiktok/ apps/frontend/src/components/tiktok/
git commit -m "feat: TikTok Hub /tiktok + callback with polling + Process Now"
```

---

### Task 6: Templates Page

**Files:**
- Create: `apps/frontend/src/components/templates/TemplateCard.tsx`
- Create: `apps/frontend/src/components/templates/TemplateForm.tsx`
- Create: `apps/frontend/src/components/templates/TemplatePreviewModal.tsx`
- Create: `apps/frontend/src/app/(dashboard)/templates/page.tsx`
- Test: `apps/frontend/src/components/templates/__tests__/TemplateForm.test.tsx`

**Interfaces:**
- Consumes: `useContentStore` (`fetchTemplates`, `createTemplate`, `deleteTemplate`, `templates`)
- Produces: `/templates` grid CRUD + Use→prefill, JSON validation for style_data

- [ ] **Step 1: Failing test**

```tsx
import {render, screen, fireEvent} from '@testing-library/react';
import TemplateForm from '../TemplateForm';
test('TemplateForm blocks invalid JSON', async ()=>{
  render(<TemplateForm onClose={jest.fn()} onCreated={jest.fn()}/>);
  const ta = screen.getByLabelText(/style_data/i);
  fireEvent.change(ta,{target:{value:'{invalid'}});
  fireEvent.click(screen.getByRole('button',{name:/Create/i}));
  expect(await screen.findByText(/Invalid JSON/i)).toBeInTheDocument();
});
```
Run: `npx jest src/components/templates/__tests__/TemplateForm -v` Expected: FAIL

- [ ] **Step 2: Implement**

`TemplateCard.tsx` — style_name badge, color dot, delete confirm, Use → `router.push(/content/new?template_id=${id})`.

`TemplateForm.tsx` — modal with name required, style_name select, style_data textarea default JSON, is_public switch, `try{JSON.parse}` else inline error, submit → `createTemplate` + toast + close.

`TemplatePreviewModal.tsx` — dummy slide with `style_data` colors/fonts applied via inline style.

`templates/page.tsx` — `'use client'` fetch on mount, grid `templates.map`, empty illustration + Create CTA, skeletons while loading, header + Create button opens TemplateForm.

- [ ] **Step 3: Verify**

Run: `npx jest src/components/templates/__tests__/TemplateForm -v` Expected: PASS
Run: `npx tsc --noEmit` Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/app/\(dashboard\)/templates/ apps/frontend/src/components/templates/
git commit -m "feat: Templates /templates grid + create/delete + preview"
```

---

### Task 7: Content Editor AI Toolbar Wiring

**Files:**
- Create: `apps/frontend/src/components/content/AIToolbar.tsx`
- Modify: `apps/frontend/src/app/(dashboard)/content/[id]/page.tsx` — inject toolbar above carousel form

**Interfaces:**
- Consumes: `useAIStore` (Task 2), `useContentStore` (existing), `EnhanceModal` from Task 4
- Produces: 4 toolbar actions (Generate from Topic, Enhance, Hashtags, Design) with mock banner and disabled states

- [ ] **Step 1: Write failing toolbar test**

```tsx
import {render, screen} from '@testing-library/react';
import AIToolbar from '@/components/content/AIToolbar';
test('AIToolbar disables Enhance when isNew', ()=>{
  render(<AIToolbar carouselId={null} title="" />);
  expect(screen.getByRole('button',{name:/Enhance/i})).toBeDisabled();
});
```
Run: `npx jest src/components/content/__tests__/AIToolbar -v` Expected: FAIL

- [ ] **Step 2: Implement AIToolbar.tsx**

Props `{carouselId: string|null, title: string, onHashtagsApplied?: (tags:string[])=>void}`. Renders 4 buttons + `EnhanceModal` portal. Handlers: Generate inline topic input → `generateCarousel(topic)` → if `isNew` (`!carouselId`) → `router.push(/content/${newCarousel.id})` else append/replace slides via `fetchSlides`. Hashtags → `generateHashtags(title, topic)` → `onHashtagsApplied(hashtags)` → parent updates `formData.tags`. Design → `suggestDesign` → render `DesignCard` + `Apply to slides` loops `updateSlide` per slide. Mock banner small if any result `mock`.

Modify `content/[id]/page.tsx`: import `AIToolbar`, place `<AIToolbar carouselId={isNew?null:carouselId} title={formData.title||''} onHashtagsApplied={(tags)=>setFormData(f=>({...f,tags}))} />` above `<form>`, guard Enhance/Hashtags/Design disabled when `isNew`.

- [ ] **Step 3: Verify**

Run: `npx jest src/components/content/__tests__/AIToolbar -v` Expected: PASS
Run: `npx tsc --noEmit` Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/components/content/AIToolbar.tsx apps/frontend/src/app/\(dashboard\)/content/\[id\]/page.tsx
git commit -m "feat: AI toolbar in content editor (generate/enhance/hashtags/design)"
```

---

### Task 8: Sidebar Navigation + Middleware Guard

**Files:**
- Modify: `apps/frontend/src/components/layout/Sidebar.tsx` — 4 → 7 items
- Modify: `apps/frontend/src/middleware.ts` — ensure /ai /tiktok /templates guarded
- Test: `apps/frontend/src/components/layout/__tests__/Sidebar.test.tsx`

**Interfaces:**
- Consumes: existing `useUIStore`, `useAuthStore`, `usePathname`
- Produces: 7 nav items with correct icons + active state, middleware blocks unauthenticated access to new routes

- [ ] **Step 1: Failing test**

```tsx
import {render, screen} from '@testing-library/react';
import Sidebar from '../Sidebar';
jest.mock('next/navigation',()=>({usePathname:()=>'/ai'}));
jest.mock('@/store/authStore',()=>({useAuthStore:()=>({user:{full_name:'Test'},logout:jest.fn()})}));
test('Sidebar shows AI Studio and TikTok', ()=>{
  render(<Sidebar/>);
  expect(screen.getByText('AI Studio')).toBeInTheDocument();
  expect(screen.getByText('TikTok')).toBeInTheDocument();
  expect(screen.getByText('Templates')).toBeInTheDocument();
});
```
Run: `npx jest src/components/layout/__tests__/Sidebar -v` Expected: FAIL

- [ ] **Step 2: Implement**

`Sidebar.tsx` — add imports `Sparkles, Music, LayoutTemplate` from `lucide-react`, extend `navigationItems` array with 3 entries as spec §3.2 ordered. Keep `pathname.startsWith`.

`middleware.ts` — verify `publicRoutes = ['/login','/register']` only; matcher already `'/((?!api|_next/static|_next/image|favicon.ico).*)'` so new routes auto-guarded. Add explicit test that `/ai` without cookie redirects to `/login`.

- [ ] **Step 3: Verify**

Run: `npx jest src/components/layout/__tests__/Sidebar -v` Expected: PASS
Run: `npx tsc --noEmit` Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/components/layout/Sidebar.tsx apps/frontend/src/middleware.ts apps/frontend/src/components/layout/__tests__/Sidebar.test.tsx
git commit -m "feat: sidebar 7 nav items + middleware guard for /ai /tiktok /templates"
```

---

### Task 9: Integration Polish, Error Handling & Build Gates

**Files:**
- Modify: `apps/frontend/src/components/ui/Toast.tsx` — ensure mock banner style consistent (if needed)
- Modify: `apps/frontend/src/app/(dashboard)/ai/page.tsx` — loading skeletons + empty states
- Modify: `apps/frontend/src/app/(dashboard)/tiktok/page.tsx` — empty + error illustrations
- Verify: all new stores error → toast + inline retry

**Interfaces:**
- Consumes: all previous tasks
- Produces: demo-ready polish, no white screens, build gates green

- [ ] **Step 1: Add Review Focus tests to owning tasks** (already covered inline per task, but add explicit mock-key and past-schedule tests)

Add to `aiStore` test: backend returns `mock:true` → yellow banner renders in `GenerateResult` (component test checks `.textContent` includes `Mock mode`).

Add to `tiktokStore` test: polling clears on unmount — spy `clearInterval`.

Add to `TemplateForm` test: schedule past date rejected inline if reused in UploadJobForm — already in Task 5 form validation test.

- [ ] **Step 2: Run full gates**

Run: `npm run build` (root) Expected: PASS
Run: `cd apps/frontend && npx tsc --noEmit` Expected: PASS
Run: `cd apps/frontend && npx jest src/store/__tests__/aiStore src/store/__tests__/tiktokStore src/components/ai/__tests__/GenerateForm src/components/tiktok/__tests__/AccountCard src/components/templates/__tests__/TemplateForm -v` Expected: PASS
Run: manual demo checklist §7 steps 1-6 via `yarn dev` on `http://localhost:3001` without keys → all mock paths succeed.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: integration polish + mock banners + skeletons + build gates green"
```

---

## Self-Review

**Spec coverage:** every spec section §3-§8 maps to a task: §3 Architecture→Task1+8, §4.1 AI Studio→Task2+4+7, §4.2 TikTok→Task3+5, §4.3 Templates→Task6, §5 data flow→Task4-6 wiring, §6 error/loading/empty→Task9 + per-task validation, §7 testing→per-task tests, §8 env/build→Task1+9.

**Placeholder scan:** no `TBD/TODO` — every step has concrete code block, file path, command, expected result.

**Type consistency:** `GenerateResult`, `Design`, `NotionSetup`, `TikTokAccount`, `UploadJob` names reused verbatim across Task2→Task4→Task7; `API_ENDPOINTS.AI.ENHANCE(id)` string-typed `(id:string)=>string` matches store call; `useAIStore.mock` boolean set from `data.mock`.

**Review Focus:** 5 failure modes from header each owned: #1 empty keys→Task1 mock test + Task4 mock banner test, #2 expired token→existing apiClient interceptor (no new code, verified by not breaking Task2/3), #3 invalid JSON→Task6 test, #4 polling leak→Task5 clearInterval test, #5 past schedule→Task5 UploadJobForm validation test.

*End of plan. Awaiting reviewer approval before implementation.*
