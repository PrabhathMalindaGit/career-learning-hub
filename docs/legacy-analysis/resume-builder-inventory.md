# Resume Builder Legacy Inventory

## 1. Inspection metadata

- Inspection date: 2026-07-24
- Active repository branch: `phase-10-unified-frontend`
- Active starting HEAD: `618b6b6`
- External reference: `LEGACY_RESUME_BUILDER`
- Authorization: temporary read-only source, style, asset-metadata, manifest, and test inventory
- Execution: prohibited and not performed
- Dependency installation: prohibited and not performed
- Environment files: identified by filename only and not opened
- Runtime verification: not performed
- Visual QA: not applicable because no visible application file changed

`IMPLEMENTED` in this report means the behavior is present in source. It does
not claim that the legacy application runs correctly.

## 2. Project summary

The legacy project has a React 19 and Vite 6 JavaScript frontend and a separate
Express and Mongoose backend. The frontend uses React Router, Tailwind CSS,
Axios, browser print, canvas capture, icons, and toast notifications
(`LEGACY_RESUME_BUILDER/frontend/resume-builder/package.json:L1-L35`). The
backend uses JWT authentication, MongoDB, Multer, and local disk uploads
(`LEGACY_RESUME_BUILDER/backend/package.json:L1-L25`).

The application has a landing page, a resume dashboard, and one multi-step
editor. Resume state is held as one mutable object in the editor. Save uploads
a screenshot and optional profile image, then overwrites the resume document.
There is no immutable version history, stable entry identity, autosave, import,
or analysis integration.

Strengths:

- A clear list, create, edit, preview workflow.
- Repeatable forms for common resume sections.
- Three layout concepts and a palette-selection concept.
- A compact multi-step editing flow with visible progress.

Limitations:

- The data model and save path conflict with the active canonical resume and
  immutable-version contracts.
- Tokens are stored in persistent browser storage.
- Resume content can be logged and captured into publicly served images.
- Loading, empty, error, retry, accessibility, and responsive states are
  incomplete.
- No safe test files were found.
- Static asset ownership and licensing are not documented.

No package, backend, API, database, authentication, storage, component, or
style reuse is recommended.

## 3. Route and screen inventory

| Screen | Evidence | Reachability | Purpose | Status | Classification | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| Landing page with authentication modal | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/App.jsx:L14-L19`; `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/LandingPage.jsx:L26-L104` | Public `/` | Marketing plus login/signup entry | PARTIAL | REFERENCE ONLY | Product framing can inform copy, but active authentication and public routes already control the application. |
| Resume dashboard | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/Home/Dashboard.jsx:L12-L70` | `/dashboard`; no client route guard | List, open, and create resumes | PARTIAL | REBUILD | The workflow is useful, but it lacks factual loading, empty, error, retry, pagination, and active-shell integration. |
| Create-resume modal | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/Home/CreateResumeForm.jsx:L7-L62` | From dashboard | Create from a title and open the result | IMPLEMENTED | REBUILD | The active create contract supports the capability through the shared client. |
| Resume editor | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/EditResume.jsx:L31-L115`; `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/EditResume.jsx:L577-L713` | `/resume/:resumeId`; no client route guard | Multi-step editing, preview, theme, save, delete, print | PARTIAL | REBUILD | The current shell, `/resumes/:resumeId` route, stable IDs, immutable versions, and secure API boundary must control the implementation. |

## 4. Feature decision matrix

| ID | Feature | Evidence | Status | Classification | Active backend support | Phase 8 action | Risks | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RB-001 | Landing CTA and feature framing | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/LandingPage.jsx:L26-L104` | IMPLEMENTED | REFERENCE ONLY | NOT APPLICABLE | Keep only useful terminology; do not add a second landing experience. | Duplicates active public routing and shell. | HIGH |
| RB-002 | Login, signup, profile, logout, route access | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/App.jsx:L14-L19`; `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/Auth/Login.jsx:L17-L53` | PARTIAL | REJECT | NOT APPLICABLE | Use the active authentication provider and route guards only. | Unguarded legacy routes and incompatible token lifecycle. | HIGH |
| RB-003 | User context, persistent JWT, Axios client | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/context/userContext.jsx:L11-L44`; `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/utils/axiosInstance.js:L4-L45` | IMPLEMENTED | REJECT | NOT APPLICABLE | Use `ACTIVE_REPO/frontend/src/api/apiClient.ts` and in-memory auth. | Access token in `localStorage`; global redirect; lost request IDs. | HIGH |
| RB-004 | Resume list and open flow | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/Home/Dashboard.jsx:L15-L56` | PARTIAL | REBUILD | SUPPORTED | Build `/resumes` with paginated owned records and factual states. | Legacy thumbnails can expose personal data. | HIGH |
| RB-005 | Create resume by title | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/Home/CreateResumeForm.jsx:L7-L62` | IMPLEMENTED | REBUILD | SUPPORTED | Submit the active create contract and navigate to `/resumes/:resumeId`. | Legacy error shape and duplicate-submit handling are incomplete. | HIGH |
| RB-006 | Inline resume-title editing | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/components/Inputs/TitleInput.jsx:L4-L35` | IMPLEMENTED | REBUILD | NOT SUPPORTED | Defer title changes unless a separate active backend contract is approved. | A client-only title would fabricate save success. | HIGH |
| RB-007 | Eight-step editor navigation and progress | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/EditResume.jsx:L230-L389` | IMPLEMENTED | REBUILD | NOT APPLICABLE | Use the ordering as workflow evidence; choose the smallest accessible Phase 8 editor navigation. | Forced step validation can block partial drafts. | HIGH |
| RB-008 | Personal details form | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/Forms/ProfileInfoForm.jsx:L5-L53` | IMPLEMENTED | REBUILD | PARTIALLY SUPPORTED | Map name, headline, and summary to canonical basics; exclude photo until supported. | Legacy field names and requiredness differ. | HIGH |
| RB-009 | Profile-photo selection and preview | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/components/Inputs/ProfilePhotoSelector.jsx:L4-L71` | PARTIAL | REBUILD | NOT SUPPORTED | Defer profile-photo upload and storage in Phase 8. | Missing client validation and object-URL cleanup; no canonical content field. | HIGH |
| RB-010 | Contact and social fields | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/Forms/ContactInfoForm.jsx:L4-L63` | IMPLEMENTED | REBUILD | SUPPORTED | Map contact data and social URLs to canonical basics and stable links. | Legacy validation and URL behavior are incomplete. | HIGH |
| RB-011 | Repeatable work experience | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/Forms/WorkExperienceForm.jsx:L5-L98` | IMPLEMENTED | REBUILD | SUPPORTED | Rebuild entries and bullets with stable IDs. | Index-based identity and a single description field do not match canonical bullets. | HIGH |
| RB-012 | Repeatable education | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/Forms/EducationDetailsForm.jsx:L5-L87` | IMPLEMENTED | REBUILD | SUPPORTED | Rebuild entries and details with stable IDs. | Index-based identity; date and detail contracts differ. | HIGH |
| RB-013 | Skills and proficiency rating | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/Forms/SkillsInfoForm.jsx:L6-L68`; `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/components/ResumeSections/RatingInput.jsx:L3-L34` | IMPLEMENTED | REBUILD | PARTIALLY SUPPORTED | Implement canonical skill groups and keywords; omit fabricated proficiency percentages. | Clickable non-semantic rating and incompatible data. | HIGH |
| RB-014 | Repeatable projects | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/Forms/ProjectsDetailFrom.jsx:L5-L97` | PARTIAL | REBUILD | SUPPORTED | Rebuild projects, links, technologies, and bullets with stable IDs. | Legacy URLs are not rendered as links and have weak validation. | HIGH |
| RB-015 | Repeatable certifications | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/Forms/CertificationInfoFrom.jsx:L5-L78` | IMPLEMENTED | REBUILD | SUPPORTED | Map to canonical certification fields and stable IDs. | Free-text year differs from the active issued-date field. | HIGH |
| RB-016 | Languages and interests | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/Forms/AdditionalInfoFrom.jsx:L6-L112` | IMPLEMENTED | REBUILD | SUPPORTED | Rebuild canonical languages and interests without forced sample values. | Legacy proficiency scale and console logging are unsafe. | HIGH |
| RB-017 | Per-step validation | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/EditResume.jsx:L117-L228` | PARTIAL | REBUILD | SUPPORTED | Align client validation with active strict request schemas and server errors. | Phone message does not match the check; URL/date bounds are missing. | HIGH |
| RB-018 | In-memory editing and live preview | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/EditResume.jsx:L391-L441`; `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/EditResume.jsx:L615-L673` | IMPLEMENTED | REBUILD | NOT APPLICABLE | Keep one editor draft owner and derive preview from that draft. | No stale-load protection or unsaved-change handling. | HIGH |
| RB-019 | Three layout concepts | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/components/ResumeTemplates/RenderResume.jsx:L6-L45`; `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/utils/data.js:L1-L21` | IMPLEMENTED | REFERENCE ONLY | PARTIALLY SUPPORTED | Treat layouts as visual research only until provenance and accessibility review. | Unknown provenance; legacy IDs do not equal approved active template IDs. | HIGH |
| RB-020 | Template and color-palette selector | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/ThemeSelector.jsx:L12-L102` | PARTIAL | REBUILD | PARTIALLY SUPPORTED | Bind approved template and palette IDs to the active design patch contract after a supported catalog is approved. | Palette click targets are inaccessible; selection restoration is incomplete. | HIGH |
| RB-021 | Preview and print/download | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/EditResume.jsx:L554-L555`; `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/EditResume.jsx:L697-L713` | PARTIAL | REBUILD | NOT SUPPORTED | Build on-screen preview; defer export/download until an approved contract exists. | Browser print is not a verified PDF export and can paginate poorly. | HIGH |
| RB-022 | Save/update workflow | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/EditResume.jsx:L475-L538` | PARTIAL | REBUILD | SUPPORTED | Save canonical content as a new immutable version with the expected current version ID. | Legacy overwrite, swallowed error, and false success behavior. | HIGH |
| RB-023 | Screenshot thumbnails and image persistence | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/EditResume.jsx:L475-L506`; `LEGACY_RESUME_BUILDER/backend/server.js:L32-L40` | IMPLEMENTED | REJECT | PARTIALLY SUPPORTED | Do not create or expose resume screenshots in Phase 8. | Full resume PII is captured and served from a public uploads path. | HIGH |
| RB-024 | Resume deletion | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/EditResume.jsx:L540-L552`; `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/EditResume.jsx:L600-L603` | PARTIAL | REBUILD | NOT SUPPORTED | Exclude from Phase 8 unless a separate owned archive/delete contract is approved. | Immediate destructive action has no confirmation or recovery. | HIGH |
| RB-025 | Hero and template PNG assets | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/LandingPage.jsx:L3-L3`; `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/utils/data.js:L1-L19` | UNKNOWN | REFERENCE ONLY | NOT APPLICABLE | Do not copy. Retain only as visual evidence pending provenance review. | Ownership and license are undocumented. | MEDIUM |
| RB-026 | React and Vite logo assets | `LEGACY_RESUME_BUILDER/frontend/resume-builder/README.md:L1-L12` | DEAD OR UNREACHABLE | REJECT | NOT APPLICABLE | Ignore boilerplate assets. | Irrelevant and no verified product provenance. | MEDIUM |
| RB-027 | Dummy resume and sample records | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/utils/data.js:L44-L152`; `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/ThemeSelector.jsx:L96-L102` | PLACEHOLDER | REJECT | NOT APPLICABLE | Use factual empty preview copy and user-owned drafts only. | Unsupported records can be mistaken for user data. | HIGH |
| RB-028 | Legacy backend, routes, models, database, uploads | `LEGACY_RESUME_BUILDER/backend/routes/resumeRoutes.js:L12-L21`; `LEGACY_RESUME_BUILDER/backend/models/Resume.js:L3-L86` | IMPLEMENTED | REJECT | NOT APPLICABLE | Use active backend modules only. | Mutable documents, mass assignment, disk uploads, and incompatible ownership boundary. | HIGH |
| RB-029 | Package configuration, dependencies, lockfiles | `LEGACY_RESUME_BUILDER/frontend/resume-builder/package.json:L1-L35`; `LEGACY_RESUME_BUILDER/backend/package.json:L1-L25` | IMPLEMENTED | REJECT | NOT APPLICABLE | Do not copy or install. | Would introduce a second dependency and configuration boundary. | HIGH |
| RB-030 | Accessibility behavior | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/components/Inputs/Input.jsx:L11-L23`; `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/components/Modal.jsx:L14-L67`; `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/components/ResumeSections/RatingInput.jsx:L19-L33` | PARTIAL | REBUILD | NOT APPLICABLE | Rebuild with labels, native controls, dialog focus, keyboard operation, and visible focus. | Clickable `div` controls, unnamed buttons, missing dialog semantics. | HIGH |
| RB-031 | Responsive behavior | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/EditResume.jsx:L615-L673`; `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/ThemeSelector.jsx:L70-L103` | PARTIAL | REBUILD | NOT APPLICABLE | Design and verify active desktop, tablet, and mobile layouts. | Fixed viewport modal sizes and 800-pixel template assumptions. | HIGH |
| RB-032 | Loading, empty, error, retry, cancellation states | `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/Home/Dashboard.jsx:L15-L29`; `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/EditResume.jsx:L443-L473` | PARTIAL | REBUILD | NOT APPLICABLE | Add factual per-operation states, structured request IDs, cancellation, and stale-response guards. | Console-only failures, no list empty state, retry, or cancellation. | HIGH |

## 5. UI and interaction patterns

- Editor structure: eight sequential form steps with a side-by-side preview.
  This is useful workflow evidence, but Phase 8 should not make optional draft
  fields mandatory merely to advance.
- Navigation: dashboard cards open an editor; the editor returns to the
  dashboard. The active `/resumes` and `/resumes/:resumeId` routes control
  Phase 8.
- Section controls: entries can be added and removed by array index. Rebuild
  these controls around stable server IDs.
- Form behavior: local controlled inputs with aggregated step errors. Active
  request schemas and structured API errors must control validation.
- Preview: draft changes render immediately. Preserve this concept without
  persisting public screenshots.
- Templates and design: three layout concepts and palette swatches exist.
  Specific assets, layouts, fonts, and colors are not approved for copying.
- Responsive behavior: the editor collapses to one column at narrower widths,
  but fixed modal and preview sizes need a fresh design.
- Accessibility: source inspection found non-semantic click targets, weak
  label association, incomplete dialog semantics, and missing focus control.
- States: busy text and toasts exist. List loading, empty, safe errors, retry,
  cancellation, stale-response handling, and request IDs do not.

## 6. Static assets and provenance

| Normalized path | Type and dimensions | Purpose | Provenance | Classification | Copy status |
| --- | --- | --- | --- | --- | --- |
| `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/assets/hero-img.png` | PNG, 2560×1680 | Landing illustration | Unknown; no attribution found | REFERENCE ONLY | Copying prohibited pending provenance and explicit approval |
| `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/assets/template-one.png` | PNG, 595×842 | Template thumbnail | Unknown | REFERENCE ONLY | Copying prohibited pending provenance and explicit approval |
| `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/assets/template-two.png` | PNG, 595×842 | Template thumbnail | Unknown | REFERENCE ONLY | Copying prohibited pending provenance and explicit approval |
| `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/assets/template-three.png` | PNG, 595×842 | Template thumbnail | Unknown | REFERENCE ONLY | Copying prohibited pending provenance and explicit approval |
| `LEGACY_RESUME_BUILDER/frontend/resume-builder/src/assets/react.svg` | SVG | Vite boilerplate | Framework boilerplate, not product evidence | REJECT | Do not copy |
| `LEGACY_RESUME_BUILDER/frontend/resume-builder/public/vite.svg` | SVG | Vite boilerplate | Framework boilerplate, not product evidence | REJECT | Do not copy |

No font file was inspected or approved. No asset is classified `PORT`.

## 7. Technical architecture findings

- State: one local mutable resume object and index-based repeatable entries.
  Rebuild with a clear editor draft, saved canonical version, and stable IDs.
- Persistence: a whole-document update overwrites the legacy record. Reject in
  favor of immutable active resume versions.
- API: a hard-coded base URL and Axios client duplicate the active shared
  client. Reject.
- Authentication: persistent browser token storage conflicts with the active
  in-memory access-token rule. Reject.
- Backend and database: separate Express, Mongoose, disk-upload, route, model,
  and authorization code. Reject.
- Configuration: environment files were not opened. Package configuration,
  Vite configuration, lockfiles, and environment files are rejected.
- PDF generation: browser print is present; a verified export service is not.
  Keep only the preview intent and defer export.
- Dependencies: no legacy dependency is authorized for addition.
- Testing: no safe test file was found. No runtime claim is made.

## 8. Security and privacy findings

- The legacy context and Axios interceptor persist the access token in
  `localStorage`.
- Full resume state can be printed to the browser console
  (`LEGACY_RESUME_BUILDER/frontend/resume-builder/src/pages/ResumeUpdate/EditResume.jsx:L501-L504`).
- A screenshot of the resume and a profile image can be written under a public
  uploads path.
- The general image-upload route lacks the active private-asset boundary.
- The update controller applies the complete request body to a Mongoose
  document, creating a mass-assignment boundary.
- The client routes are not protected by a route guard.
- Save can display success after the data update failed because an inner error
  is caught without being rethrown.
- Destructive deletion has no confirmation.
- No secret value, environment value, or personal resume content is reproduced
  in this report.

## 9. Mandatory rejections

- Legacy authentication and authorization
- Legacy user context and browser token persistence
- Legacy backend and server routes
- Legacy API client and hard-coded URL
- Legacy database models and mutable save behavior
- Legacy local/public upload storage
- Legacy environment files and configuration
- Legacy package manifests, Vite configuration, and lockfiles
- Screenshot thumbnail persistence
- Dummy resume records and sample metrics
- React/Vite boilerplate assets
- Unconfirmed destructive deletion behavior

## 10. Recommended retained concepts

### PORT

None. No source, style, static asset, copy block, or font passed the required
provenance, ownership, compatibility, accessibility, and security checks.

### REBUILD

- Owned resume list and create flow.
- Multi-section canonical editor.
- Stable entry, link, and bullet controls.
- In-memory draft with live preview.
- Approved template and palette controls backed by active IDs.
- Immutable save and version creation.
- Accessible, responsive loading, empty, error, retry, and confirmation states.

### REFERENCE ONLY

- The three template compositions as visual research.
- The landing-page framing and terminology.
- The legacy image assets pending provenance review.

## 11. Open questions

1. Are the hero image and three template images operator-owned or licensed for
   reuse? The default remains no copying.
2. Should profile photos be excluded from Phase 8, as the current canonical
   content contract has no profile-photo field?
3. Is resume title editing required in Phase 8? The current active backend has
   create-title support but no title-update route.
4. Are archive, delete, and export intentionally deferred? No active Resume
   route currently supports them.
5. Which active template IDs, palette IDs, and font choices are approved for
   presentation? The contract accepts strings but does not prove that a
   renderer exists for arbitrary values.

## 12. Inventory totals

| Classification | Count |
| --- | ---: |
| PORT | 0 |
| REBUILD | 22 |
| REFERENCE ONLY | 3 |
| REJECT | 7 |
| UNKNOWN or unresolved evidence | 0 |
| Total feature rows | 32 |

The unresolved asset-provenance questions do not create unclassified rows.
Those assets remain `REFERENCE ONLY` unless separate evidence supports a later
decision.
