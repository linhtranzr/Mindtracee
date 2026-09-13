# Design Guidelines --- MindTrace

**Nguồn:** `project-overview-prd.md`\
**Trạng thái:** Đã duyệt --- cập nhật Account/Auth\
**Ngày:** 2026-09-10

## 1. Design direction

**Quiet Reading, Visible Understanding.** Tĩnh, rõ, không phán xét.
Desktop/laptop ưu tiên đọc sâu; mobile ưu tiên review nhanh và đọc tiếp.
Reader gần trang sách; Knowledge Map trực quan hơn. AI gần như vô hình.

Nền trắng/kem + chữ đen/xám; màu trạng thái rất tiết chế, luôn đi cùng
icon + label.

## 2. UX principles

1.  **Recall before reveal.**
2.  **Reflect before correct:** lệch nhẹ → gợi tự nhận ra; sai bản chất
    → sửa trung tính + nguồn; AI không chắc → không kết luận.
3.  Một màn hình, một việc chính.
4.  Không tự ngắt Reader.
5.  Không score/streak/quiz pressure.
6.  Status phải có evidence.
7.  Quên là trạng thái bình thường.
8.  AI hỗ trợ theo ngữ cảnh, không có chatbot home.
9.  User luôn có đường thoát nhẹ.
10. Account flow phải rõ, an toàn nhưng không làm app có cảm giác
    "enterprise".

## 3. Information architecture

### Trước khi vào app

-   Đăng ký
-   Kiểm tra email / xác minh
-   Đăng nhập
-   Quên mật khẩu
-   Đặt mật khẩu mới

### App chính

-   Hôm nay
-   Thư viện
-   Reader
-   Reflection
-   Review
-   Bản đồ hiểu biết
-   Topic Detail
-   Settings / Account

User chưa xác minh email không vào app chính.

## 4. Core flow

`Đăng ký → Xác minh email → Đăng nhập → Upload PDF → Reader → Kết thúc phiên → Free Recall → Hint nếu cần → AI Reflection → Optional Deepening → Knowledge Trace → Review → Knowledge Map`

Return flow:
`Mở app → session còn hợp lệ: vào app / session hết hạn: Sign in → phục hồi dữ liệu account`.

Recovery:
`Quên mật khẩu → nhập email → email reset → đặt password mới → sign in → dữ liệu cũ còn nguyên`.

Deletion:
`Settings → Xóa tài khoản → cảnh báo → xác nhận → processing → signed-out/deleted state`.

## 5. Screens and states

  -------------------------------------------------------------------------------
  Màn hình                Mục đích                States
  ----------------------- ----------------------- -------------------------------
  Sign up                 Email + password        default, validation,
                                                  submitting, email-exists,
                                                  error, success

  Verify email            Chờ user bấm link       waiting, resend,
                                                  resend-success,
                                                  expired/invalid-link, verified

  Sign in                 Vào account             default, submitting,
                                                  invalid-credentials,
                                                  unverified-email, error

  Forgot password         Yêu cầu reset           default, submitting, sent,
                                                  error

  Reset password          Đặt password mới        default, validation,
                                                  submitting, expired-link,
                                                  success

  Settings/Account        Quản lý account         default, sign-out, delete-entry

  Delete account          Destructive             warning, confirming, deleting,
                          confirmation            partial/error, success

  Hôm nay                 Review + continue       default, empty, loading, error,
                          reading                 completed

  Thư viện                Documents               empty, upload, processing,
                                                  unsupported, error

  Reader                  Đọc tập trung           default, selected-text,
                                                  note-saved, AI-loading/error

  Reflection              Tự nhớ/AI phản chiếu    recall, hint, source,
                                                  reflection, uncertain, error,
                                                  skip

  Review                  Ôn                      recall/explain/connect/apply,
                                                  hint, source, error

  Knowledge Map           Topic list              default, empty, loading, error

  Topic Detail            Evidence/status         default, no-evidence, loading,
                                                  error
  -------------------------------------------------------------------------------

## 6. Auth microcopy

### Sign up

**Tạo tài khoản MindTrace**\
`Email`\
`Mật khẩu`\
Primary: `Tạo tài khoản`\
Secondary: `Đã có tài khoản? Đăng nhập`

### Verify

**Kiểm tra email của bạn**\
`MindTrace đã gửi một link xác minh đến {email}. Hãy bấm link đó để hoàn tất đăng ký.`\
Primary: `Mở email` nếu platform hỗ trợ hợp lý\
Secondary: `Gửi lại email xác minh`\
Tertiary: `Đổi email`

Không tuyên bố email đã gửi nếu backend chưa xác nhận request thành
công.

### Unverified sign-in

`Email này chưa được xác minh.`\
Action: `Gửi lại email xác minh`

### Forgot password

**Quên mật khẩu?**\
`Nhập email của bạn. MindTrace sẽ gửi link để đặt mật khẩu mới.`\
Primary: `Gửi link đặt lại mật khẩu`

Sau submit nên dùng copy không làm lộ account existence nếu auth
provider/security design yêu cầu:
`Nếu email này thuộc một tài khoản, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.`

### Delete

**Xóa tài khoản?**\
`Hành động này sẽ xóa tài khoản và dữ liệu MindTrace thuộc tài khoản theo chính sách xóa dữ liệu. Không thể hoàn tác từ giao diện.`\
Primary destructive: `Xóa tài khoản`\
Secondary: `Giữ tài khoản`

Không dùng dark pattern.

## 7. Reader → Reflection

Pattern bắt buộc:
`Reader → khoảng chuyển → Free Recall → Hint → AI Reflection → Optional Deepening → Knowledge Trace`.

Reader không tự hỏi. User chọn `Kết thúc phiên đọc`.

Transition: `Nghỉ một nhịp.`\
`Trước khi MindTrace phản chiếu, thử xem điều gì vẫn còn ở lại với bạn.`\
Primary: `Nhớ lại cùng MindTrace`\
Secondary: `Hôm nay chỉ muốn đọc`

Free Recall: `Điều gì còn ở lại với bạn?`\
`Không cần nhớ chính xác. Hãy kể lại phần vừa đọc theo cách của bạn.`\
Secondary: `Mình không nhớ rõ`

Nếu hiểu lệch nhẹ, hỏi để user tự xem lại. Nếu sai làm thay đổi bản
chất, dùng:
`Có một điểm trong cách bạn đang hiểu chưa khớp với đoạn vừa đọc.`\
Sau đó giải thích ngắn và cho `Xem lại đoạn nguồn`.

Nếu AI không chắc: `MindTrace chưa đủ chắc để kết luận phần này.`

Không score, không `Câu 1/3`, không "sai" màu đỏ.

## 8. Components

Auth: `AuthShell`, `EmailField`, `PasswordField`,
`PasswordRequirements`, `AuthSubmitButton`, `VerificationNotice`,
`ResendVerificationAction`, `PasswordResetForm`, `DeleteAccountDialog`.

Core: `AppNav`, `DocumentCard`, `ReaderChrome`, `TextSelectionToolbar`,
`HighlightChip`, `NotePanel`, `ContextAIAction`, `EndSessionButton`,
`TransitionCard`, `RecallComposer`, `HintCard`, `SourceReturn`,
`ReflectionCard`, `DeepeningPrompt`, `KnowledgeStatusBadge`,
`EvidenceList`, `TopicRow`, `ReviewCard`, `FeedbackToast`, `EmptyState`.

## 9. Responsive

Mobile: auth form single-column; bottom nav Hôm nay/Thư viện/Bản đồ;
Reader/Reflection/Review full-screen.\
Desktop: centered auth panel; app sidebar; Reader 640--760px; Reflection
560--680px; Knowledge Map có thể 2 cột.

Touch target khoảng ≥44×44px. Không phụ thuộc hover.

## 10. Tokens

-   background `#F7F4ED`
-   surface `#FFFDF8`
-   text `#252521`
-   muted `#6C6B63`
-   border `#DDD9CF`
-   primary `#3F5F55`
-   primary-soft `#E4ECE8`
-   mastered `#47695C`
-   forming `#9A7428`
-   needs-review `#8A671F`
-   neutral `#77766F`
-   danger `#A4433F`

Danger dành cho system/destructive action; không dùng để chấm kiến thức.

UI font: Inter/system sans. Reader: Source Serif 4/Georgia. Reader body
18--20px, line-height 1.6--1.75.

## 11. Accessibility/security UX

-   Form có label thật, autocomplete phù hợp cho
    email/current-password/new-password.
-   Error nằm gần field/action và không xóa input không cần thiết.
-   Password requirements đọc được bằng screen reader.
-   Focus visible; keyboard flow đầy đủ.
-   Verification/reset status có live announcement hợp lý.
-   Không tiết lộ account existence không cần thiết.
-   Delete confirmation không preselected.
-   Status kiến thức dùng icon + text + color.
-   Reduced motion.

## 12. UI acceptance

-   [ ] User đăng ký email/password được.
-   [ ] User chưa verify không vào app chính.
-   [ ] Resend verification và đổi email có đường đi rõ.
-   [ ] Login, forgot/reset password có error/recovery.
-   [ ] Session còn hiệu lực không bắt login lại vô lý.
-   [ ] Đăng nhập lại phục hồi đúng dữ liệu account.
-   [ ] Settings có delete account với warning + confirm.
-   [ ] Reader → Reflection giữ Recall-before-reveal.
-   [ ] Misconception handling giữ Reflect-before-correct.
-   [ ] Không score/streak/chatbot home.
-   [ ] Mobile/desktop hoàn thành core flow.

## 13. UI Spec Prompt --- standalone

Thiết kế responsive UI hoàn chỉnh cho **MindTrace --- "Đừng chỉ đọc. Hãy
để kiến thức ở lại."**

MindTrace dành cho người đi làm tự học qua sách/tài liệu, giúp biến phần
đã đọc thành kiến thức thực sự hiểu và còn nhớ. Core loop: **Đăng ký →
xác minh email → đăng nhập → upload PDF → đọc → highlight/note/hỏi AI →
tự nhớ lại → AI phản chiếu → Knowledge Map → review**.

### Design direction

**Quiet Reading, Visible Understanding.** Tĩnh, rõ, không phán xét.
Reader gần trang sách; AI gần như vô hình. Desktop ưu tiên đọc sâu;
mobile ưu tiên review và đọc tiếp. Không AI mascot, chat home, score,
streak, leaderboard, quiz UI hay knowledge graph phức tạp.

### Auth screens bắt buộc

1.  Sign up: email, password, validation, loading/error.
2.  Verify Email: `Kiểm tra email của bạn`, email destination, resend
    verification, đổi email, expired/invalid link.
3.  Sign in: email/password; state cho invalid credentials và unverified
    email.
4.  Forgot Password: email + confirmation an toàn không cần tiết lộ
    account existence.
5.  Reset Password: new password + confirm, expired-link, success.
6.  Settings/Account.
7.  Delete Account confirmation: cảnh báo rõ, destructive CTA, cancel,
    deleting/error/success.

User chưa verify email không vào app chính. Khi session hợp lệ, không
bắt login lại. Dữ liệu
library/progress/highlights/notes/reflection/map/reviews thuộc account
và được phục hồi khi login lại.

### App screens

Hôm nay, Thư viện, Reader, Session Transition, Free Recall, Hint/Source,
AI Reflection, Optional Deepening, Knowledge Trace, Review, Knowledge
Map list, Topic Detail.

Reader là màn yên tĩnh nhất. Text selection toolbar:
`Highlight / Take Note / Hỏi về đoạn này`. CTA: `Kết thúc phiên đọc`.

Reflection: `Nghỉ một nhịp.` → `Điều gì còn ở lại với bạn?` → hint nếu
bí → AI reflection → optional deepening → Knowledge Trace.

Nguyên tắc **Recall before reveal**. Với hiểu nhầm: **Reflect before
correct** --- lệch nhẹ thì hỏi để tự nhận ra; sai bản chất thì nói rõ
trung tính + source; AI không chắc thì không kết luận.

Knowledge Map dùng list, status:
`Chưa đọc / Đã tiếp xúc / Đang hình thành / Nắm chắc / Cần gợi nhớ`,
luôn kèm evidence.

### Visual

background `#F7F4ED`; surface `#FFFDF8`; text `#252521`; primary
`#3F5F55`; trạng thái xanh/xám/vàng rất tiết chế. Danger chỉ cho
lỗi/destructive action. UI Inter/system sans; Reader Source Serif
4/Georgia. Không neon/AI glow/robot/sparkles.

### Responsive/accessibility

Mobile auth single-column, app bottom nav; desktop auth centered panel +
app sidebar. Touch target \~44px. Keyboard/focus rõ, form labels thật,
contrast AA khi triển khai, reduced motion, status không phụ thuộc màu.

### Acceptance

Mockup phải thể hiện đầy đủ auth + verification + recovery + deletion và
core learning flow; loading/empty/error/success/AI-uncertain; không thêm
feature ngoài MVP; đủ chi tiết để developer triển khai.
