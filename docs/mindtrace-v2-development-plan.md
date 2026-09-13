# Development Plan --- MindTrace

**Nguồn:** `project-overview-prd.md`, `design-guidelines.md`\
**Trạng thái:** Ready for repository discovery\
**Ngày:** 2026-09-10

## 1. MVP cần giao

Core flow: **Sign up → Verify Email → Sign in → Upload PDF → Read →
Annotate/Ask AI → Reflection → Knowledge Evidence/Map → Review → return
later with progress restored.**

Account P0: email/password registration, mandatory email verification,
session persistence, password reset by email, per-account data
isolation, account deletion.

## 2. Ràng buộc

-   Không lộ LLM/service-role secret ở client.
-   Authenticated `user_id` là ownership root.
-   Email chưa verify không vào app chính.
-   Reset password không làm mất ownership/data.
-   RLS/authorization bảo vệ mọi user-owned data.
-   AI error không mất user input.
-   Evidence/history append, không overwrite.
-   Không score/streak/knowledge graph.
-   Destructive account deletion cần confirmation.
-   Retention/backup policy sau deletion: `CHƯA ĐỦ DỮ LIỆU`.

## 3. Repository discovery gate

Codex phải: - \[ \] Đọc cả ba tài liệu. - \[ \] Kiểm tra
framework/package manager/routing/UI. - \[ \] Xác định Auth/DB/Storage
hiện tại. - \[ \] Xác định Supabase đã được cấu hình hay chưa. - \[ \]
Xác định server/API/Edge Function pattern. - \[ \] Xác định PDF
renderer, AI provider, tests, env, migrations, deploy. - \[ \] Chạy
baseline lint/typecheck/test/build nếu có. - \[ \] Báo conflict trước
schema/breaking/destructive change.

## 4. Technical approach

**Stack hiện có:** `<Codex xác nhận sau khi khảo sát repo>`.

**Đề xuất nếu greenfield:** responsive TypeScript web app + Supabase
Auth/Postgres/Storage/RLS + server-side AI layer.

Không thay stack đang hoạt động chỉ để theo đề xuất.

### Auth contract

-   Sign up email/password.
-   Provider gửi verification email.
-   Verification redirect phải đưa user về đúng app environment.
-   App gate dựa trên verified auth state.
-   Resend verification.
-   Sign in/out.
-   Session restore/refresh.
-   Forgot password email.
-   Reset-password callback + new password.
-   Account deletion qua server-authorized destructive flow; không đưa
    admin/service key xuống client.

## 5. Data model

Auth identity do auth provider quản lý. App tables: - `documents`:
user_id, title, private storage path, processing,
progress/current_location. - `annotations`: user_id, document_id,
kind/type, selected_text, note, source_location. - `learning_sessions`:
user_id, document_id, scope, recall, reflection. - `knowledge_topics`:
user_id, topic_name, status, weak_point, next_review. - `topic_sources`:
topic ↔ document/source. - `knowledge_evidence`: append-only evidence
history. - `reviews`: scheduled review + response/result.

Mọi user-owned table phải có ownership trực tiếp hoặc relation có thể
enforce chắc chắn. Ưu tiên explicit `user_id` nếu giúp RLS đơn giản/an
toàn.

## 6. Supabase/RLS requirements nếu Supabase được xác nhận

-   Email/password Auth + email confirmation enabled.
-   Site URL/redirect URLs cấu hình cho local/staging/production.
-   RLS bật trên user data.
-   SELECT/INSERT/UPDATE/DELETE policies kiểm tra `auth.uid()`
    ownership.
-   Private document bucket; storage policy theo user ownership.
-   Không dùng public URL cho sách riêng nếu không cần.
-   Service-role key chỉ server.
-   Account deletion server flow xử lý DB rows + storage objects + auth
    identity theo policy đã duyệt.
-   Mọi migration/destructive operation cần preview/approval trước khi
    chạy trên project thật.

## 7. API/interface contracts

-   `signUp(email,password)` → verification pending / validation error.
-   `resendVerification(email/session)` → generic success/error.
-   `signIn(email,password)` → verified session hoặc unverified/invalid
    state.
-   `requestPasswordReset(email)` → generic confirmation.
-   `updatePassword(newPassword)` → success/expired-invalid recovery
    state.
-   `deleteAccount(confirm)` → authenticated server operation; success
    signs user out.
-   document upload/read/update progress.
-   annotation CRUD.
-   contextual AI server endpoint.
-   reflection server endpoint returning structured output.
-   review generation/evaluation endpoint.
-   knowledge-state transition domain service.

Không tin `user_id` từ client khi auth context có sẵn.

## 8. Phase map

### Phase 0 --- Repository discovery

Audit repo + baseline commands + integration map.

### Phase 1 --- Account/Auth foundation

Implement email/password sign-up, mandatory verification, resend,
sign-in/out, session restore, forgot/reset password, protected app
routes, Settings account shell.

**Done:** - unverified user bị chặn khỏi app chính; - verified user
login được; - refresh giữ session khi hợp lệ; - reset password hoạt
động; - auth errors có recovery; - không có secret client-side.

### Phase 2 --- Database/RLS/Storage + per-account persistence

Migrations cho core tables; private storage; ownership/RLS; document
upload/library/progress.

**Integration tests:** - Account A tạo document/progress. - Logout →
login lại A → progress đúng. - Login A trên session/device khác →
progress/library đúng từ backend. - Account B không SELECT/UPDATE/DELETE
dữ liệu A. - private file của A không accessible bởi B.

### Phase 3 --- Reader + annotations

PDF Reader, progress persistence, selection toolbar,
Highlight/Note/source anchor.

**Tests:** 3 highlights = 3 rows; ≥5 annotations reload vẫn đúng; save
lỗi không mất text.

### Phase 4 --- Contextual AI

Server-side AI, ownership validation, structured response,
uncertainty/error.

### Phase 5 --- Reflection

Session Transition → Free Recall → Hint/Source → AI Reflection →
Optional Deepening → Knowledge Trace.

Thêm **Reflect before correct**: - minor mismatch → Socratic
follow-up; - material misconception → neutral correction + source; -
insufficient confidence → no definitive correction.

Persist recall trước AI call.

### Phase 6 --- Knowledge Map + evidence

Topics/sources/evidence, deterministic state engine, Topic
Detail/evidence explanation.

`read` không tạo `mastered`; evidence append-only.

### Phase 7 --- Review loop

1d/1w/1m starting schedule, Hôm nay, recall/explain/connect/apply,
hint/source, new evidence, decay/recovery.

### Phase 8 --- Account deletion

Chỉ triển khai destructive backend operation sau khi xác nhận deletion
semantics.

Flow: Settings → warning → confirm → server deletion → sign out →
deleted state.

Delete user-owned DB/storage/auth identity theo policy đã phê duyệt. Nếu
một bước thất bại, không báo thành công giả; log an toàn và có
recovery/operational path.

`CHƯA ĐỦ DỮ LIỆU`: backup/retention timing.

### Phase 9 --- Responsive/accessibility/reliability

Desktop Reader, mobile review, auth responsive, keyboard/focus, touch
targets, contrast, reduced motion, network recovery.

### Phase 10 --- Validation instrumentation

Events tối thiểu: signup initiated/completed, verification completed
(không log email raw nếu không cần), document_imported,
reflection_started/skipped/completed, review_started/completed,
knowledge_map_viewed. Không đưa nội dung sách/note/recall/password/token
vào analytics/log.

## 9. Test strategy

### Auth E2E

1.  Sign up → verification pending.
2.  Attempt app access before verification → blocked.
3.  Verify link → valid login/app access.
4.  Resend verification.
5.  Invalid/expired verification recovery.
6.  Sign out/sign in.
7.  Refresh/session restore.
8.  Forgot password → reset link → new password → login.
9.  Old password fails/new succeeds as provider semantics dictate.
10. Reset không làm mất app data.

### Isolation E2E/integration

A và B có dữ liệu riêng; cố truy cập row/file của nhau phải fail.

### Persistence

A đọc tới location X → logout → login lại hoặc session/device khác →
resume X; annotations/topics/reviews giữ đúng.

### Deletion

Trên test environment: tạo account có
document/storage/annotation/session/topic/evidence/review → delete → xác
minh auth/data/storage theo policy. Test partial failure. Destructive
test không chạy nhầm production.

### Learning

Unit: state transitions, scheduling, AI schema.\
Integration: reflection → evidence; review → evidence → status.\
E2E: upload → read → annotate → reflection → map → review.

## 10. Security/privacy/reliability

-   Validate email/password via provider + app UX.
-   Auth callback/redirect allowlist chính xác.
-   CSRF/session protections theo framework/provider.
-   RLS là defense-in-depth, không chỉ UI filtering.
-   Password/token không log.
-   Email raw không đưa analytics nếu không cần.
-   AI chỉ nhận context cần thiết.
-   Storage private.
-   Account deletion có explicit confirmation.
-   User input được giữ khi network/AI fail nếu có thể.
-   Rate limiting/abuse protection cho auth resend/reset và AI theo khả
    năng stack/provider.

## 11. UI ↔ database mapping

-   Sign up/sign in/reset → Auth provider identity/session.
-   Thư viện → `documents`.
-   Reader progress → `documents.current_location/progress`.
-   Highlight/Note → `annotations`.
-   Reflection → `learning_sessions`.
-   Knowledge Map → `knowledge_topics`.
-   "Vì sao MindTrace nghĩ vậy" → `knowledge_evidence` +
    `topic_sources`.
-   Review → `reviews` + evidence mới.
-   Settings/Delete → authenticated server deletion across auth + DB +
    storage.

## 12. Release acceptance

-   Email/password signup.
-   Mandatory verification.
-   Resend verification/recovery.
-   Sign in/out + session restore.
-   Forgot/reset password.
-   Per-account data isolation.
-   Cross-session/account persistence.
-   Private documents.
-   Core learning loop end-to-end.
-   Evidence-based status, no score.
-   Review history append-only.
-   Delete-account UI + backend behavior tested according to approved
    deletion policy.
-   Desktop/mobile core flow.
-   Critical loading/error/recovery.
-   lint/typecheck/test/build pass.
-   no client secret or sensitive logs.

## 13. Open decisions

-   [ ] `<Codex xác nhận>` repository stack.
-   [ ] `<Codex xác nhận>` existing Supabase/project/env configuration.
-   [ ] `<Codex xác nhận>` PDF renderer/source anchor.
-   [ ] `<Codex xác nhận>` AI provider/model.
-   [ ] Chủ sản phẩm/legal: retention/backup policy after deletion ---
    `CHƯA ĐỦ DỮ LIỆU`.
-   [ ] User testing: review schedule và Reflection length.

## 14. Definition of Done

Core flow chạy đầu-cuối cho verified account; dữ liệu được
persist/isolate; auth recovery hoạt động; account deletion có behavior
đã duyệt; UI states hoàn chỉnh; security constraints đạt;
tests/lint/typecheck/build xanh; bản thử nghiệm sẵn sàng cho người dùng
mục tiêu.
