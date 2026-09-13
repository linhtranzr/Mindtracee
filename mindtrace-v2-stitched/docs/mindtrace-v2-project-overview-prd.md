# Project Overview & PRD --- MindTrace

**Trạng thái:** Đã duyệt --- cập nhật Account P0\
**Ngày:** 2026-09-10\
**Phiên bản:** MVP Knowledge Loop

## 1. Tổng quan sản phẩm

-   **Tên:** MindTrace
-   **Tagline:** Đừng chỉ đọc. Hãy để kiến thức ở lại.
-   **Người dùng chính:** Người đi làm tự học qua sách và tài liệu.
-   **Hành động quan trọng nhất:** Biến phần đã đọc thành kiến thức thực
    sự hiểu và còn nhớ theo thời gian.

## 2. Câu định vị MVP

> Tôi tạo ra **MindTrace** dành cho **người đi làm tự học qua sách và
> tài liệu** để giúp họ **biến những gì đã đọc thành kiến thức thực sự
> hiểu và còn nhớ theo thời gian**.

## 3. Vấn đề

Người dùng có thể đọc/highlight nhiều nhưng nhanh quên; đôi khi tưởng đã
hiểu cho tới khi phải tự giải thích. `CHƯA ĐỦ DỮ LIỆU` để khẳng định mức
độ phổ biến hay willingness-to-pay; cần user test.

## 4. Giá trị và nguyên tắc

Core loop: **Đọc → Hiểu → Nhớ → Ôn lại → Hiểu sâu hơn**.

-   **Recall before reveal:** tự nhớ trước, AI nói sau.
-   **Reflect before correct:** với lệch nhẹ, gợi người dùng tự xem lại;
    nếu hiểu sai làm thay đổi bản chất kiến thức, nói rõ trung tính và
    dẫn về nguồn.
-   AI gần như vô hình; không AI-chat home.
-   Không numeric understanding score, streak hoặc leaderboard.
-   Tiến độ đọc khác với tiến độ hiểu.

## 5. Core user flow

1.  User đăng ký bằng email + mật khẩu.
2.  Hệ thống gửi email xác minh; user bấm link xác minh trước khi vào
    app chính.
3.  User đăng nhập; phiên đăng nhập được duy trì hợp lý.
4.  User upload PDF và đọc; progress gắn với account.
5.  User highlight, Take Note hoặc Hỏi AI theo đoạn.
6.  User chủ động `Kết thúc phiên đọc`.
7.  User free recall; có thể skip hoặc nói `Mình không nhớ rõ`.
8.  AI phản chiếu, hint/source khi cần, optional deepening.
9.  Hệ thống tạo/cập nhật topic + evidence.
10. Review xuất hiện theo thời gian; Knowledge Map thay đổi dựa trên
    evidence.
11. Khi quay lại hoặc đăng nhập cùng account trên thiết bị khác, dữ liệu
    đã lưu được phục hồi.
12. User có thể reset password qua email và có thể yêu cầu xóa account.

## 6. P0 Functional requirements

-   **FR-01 Account registration:** đăng ký bằng email + mật khẩu.
-   **FR-02 Email verification:** gửi verification link; chưa xác minh
    thì chưa vào app chính; có resend và đổi email.
-   **FR-03 Sign in/session:** đăng nhập bằng account đã xác minh và duy
    trì session hợp lý.
-   **FR-04 Password reset:**
    `Quên mật khẩu → email → link → đặt mật khẩu mới`; dữ liệu account
    không mất.
-   **FR-05 Account isolation:** mọi dữ liệu học thuộc đúng user; user A
    không đọc/ghi dữ liệu user B.
-   **FR-06 Account deletion:** Settings có flow xóa account với cảnh
    báo + xác nhận. Xóa dữ liệu user-owned theo policy triển khai;
    backup/retention hiện `CHƯA ĐỦ DỮ LIỆU`.
-   **FR-07 Import document:** nhập PDF được hỗ trợ vào thư viện riêng.
-   **FR-08 Reading progress:** lưu current location/progress theo
    account và phục hồi sau reload/login lại/thiết bị khác.
-   **FR-09 Highlight:** `Quan trọng / Muốn nhớ / Chưa hiểu`, gắn
    source.
-   **FR-10 Note:** note gắn document + source.
-   **FR-11 Contextual AI:** hỏi AI theo selected passage; secret chỉ
    server-side.
-   **FR-12 End session:** lưu scope rồi mời Reflection; không tự ngắt
    Reader.
-   **FR-13 Free recall:** hỏi "Điều gì còn ở lại với bạn?" trước AI
    reveal; skip hợp lệ.
-   **FR-14 Reflection:** AI phản chiếu không chấm điểm; 1 điểm đào sâu
    tại một thời điểm.
-   **FR-15 Misconception handling:** lệch nhẹ → hỏi để tự nhận ra; sai
    bản chất → nói rõ trung tính + source; AI không chắc → không kết
    luận sai.
-   **FR-16 Knowledge Map:** topic có
    `Chưa đọc / Đã tiếp xúc / Đang hình thành / Nắm chắc / Cần gợi nhớ`.
-   **FR-17 Evidence:** status phải truy được về evidence/history; không
    overwrite.
-   **FR-18 Review:** starting schedule khoảng 1 ngày/1 tuần/1 tháng;
    `CHƯA ĐỦ DỮ LIỆU` rằng lịch này tối ưu.
-   **FR-19 Source return:** hint trước, rồi quay về đúng nguồn nếu cần.
-   **FR-20 Status decay:** có thể `Nắm chắc → Cần gợi nhớ` mà không xóa
    lịch sử.

## 7. P1

Voice reflection; adaptive review; cross-document knowledge map nâng
cao; OCR/chụp sách giấy; EPUB nếu chưa có ở P0; licensed commercial
library.

## 8. Scope

### IN

Account/email verification/password recovery/delete account; private
personal library; PDF reading/progress; annotation; contextual AI;
Reflection; evidence-based Knowledge Map; reviews; source return.

### OUT

Commercial bookstore; social/community; leaderboard/streak; complex
knowledge graph; advanced adaptive scheduling; publisher system; public
sharing tài liệu có bản quyền.

### Non-goals

Không thay giáo viên/giám khảo tuyệt đối; không tối ưu pages-read; không
làm flashcard/test app; không dùng AI summary để bỏ qua đọc; không tạo
single understanding score.

## 9. Data requirements

Logical entities: - `documents` - `annotations` - `learning_sessions` -
`knowledge_topics` - `topic_sources` - `knowledge_evidence` - `reviews`

Auth identity do hệ thống Auth quản lý; mọi user-owned record phải map
được về authenticated `user_id`.

`knowledge_evidence` lưu các bằng chứng như `read`, `highlighted`,
`asked_for_help`, `free_recall`, `explained`, `connected`, `applied`,
`could_not_recall`, `self_reported_unclear`, `review_recall`, và
evidence cho misconception/correction khi implementation cần.

## 10. Data/security requirements

-   Database/Auth/File Storage đề xuất: Supabase; implementation cuối
    phải theo repo thực tế.
-   Email verification bắt buộc trước app chính.
-   RLS/authorization tách dữ liệu theo account.
-   Document storage private.
-   LLM/service-role secrets không nằm client.
-   Không tin `user_id` do client tự gửi khi server lấy được từ auth
    session.
-   Reset password không đổi ownership của dữ liệu.
-   Account deletion là destructive action, cần xác nhận rõ.
-   Retention/backup sau deletion: `CHƯA ĐỦ DỮ LIỆU`.

## 11. Success criteria & validation

-   Account chưa verify không vào app chính; verify thành công thì vào
    được.
-   Login lại cùng account phục hồi đúng
    library/progress/annotations/learning state.
-   Account khác không truy cập được dữ liệu.
-   Password reset thành công không làm mất dữ liệu.
-   3 highlight → đúng 3 records, không overwrite.
-   3 Reflection → 3 sessions/evidence history độc lập.
-   Tạo ≥5 note/topic rồi reload → dữ liệu còn đúng.
-   Review mới tạo history/evidence mới.
-   `Nắm chắc → Cần gợi nhớ` vẫn truy được evidence cũ.
-   Account deletion flow cần integration test cho auth + DB + storage
    theo deletion policy đã duyệt.
-   Giả định sản phẩm chính: user có thấy Reflection + Knowledge Map +
    Review đủ giá trị để quay lại? `CHƯA ĐỦ DỮ LIỆU`.

## 12. Edge cases

Email đã tồn tại; password invalid; verification link hết hạn/đã dùng;
resend; email chưa verify; sai credentials; reset link hết hạn; network
lỗi giữa auth flow; session hết hạn; upload lỗi; PDF hỏng; AI timeout;
source anchor mất; skip Reflection; AI không chắc; account deletion thất
bại một phần.

## 13. Rủi ro/giả định

-   AI có thể đánh giá sai → structured output + uncertainty + source +
    deterministic state rules.
-   PDF anchoring có thể không ổn định → test renderer thực tế.
-   Review schedule chưa được kiểm chứng → user test.
-   Account deletion có thể liên quan retention/backup →
    `CHƯA ĐỦ DỮ LIỆU`, cần policy trước production.
-   Email deliverability/redirect configuration có thể lỗi → test
    verification/reset trên môi trường deploy thực.

## 14. Câu hỏi còn mở

-   [ ] Retention/backup policy sau xóa account.
-   [ ] PDF renderer/stack thực tế sau repository audit.
-   [ ] AI provider/model thực tế.
-   [ ] Review schedule tối ưu sau user test.

## 15. Điều kiện sẵn sàng

-   [x] Một user chính.
-   [x] Một core loop.
-   [x] P0/OUT rõ.
-   [x] Auth/account persistence là P0.
-   [x] Các giả định chưa kiểm chứng được đánh dấu.
