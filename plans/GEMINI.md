# GEMINI — Quy Chuẩn Hoạt Động Của AI Agent Cho Dự Án FinMan
## Operating Guidelines & Development Protocol for AI Coding Assistants

Tài liệu này là **bộ quy chuẩn tối cao và bắt buộc** dành cho bất kỳ AI Agent (Gemini / Antigravity / Claude / GPT) nào tham gia lập trình và phát triển dự án FinMan.
Mọi hành vi vi phạm các nguyên tắc dưới đây đều bị coi là **thất bại** trong việc thực hiện nhiệm vụ.

---

# 1. Các Nguyên Tắc Cốt Lõi (Core Principles)

### 📌 Nguyên Tắc 1: Đọc Và Tuân Thủ Tài Liệu Trước Tiên (Documentation First)
- Trước khi viết hoặc sửa bất kỳ dòng code nào, Agent **bắt buộc phải đọc kỹ** các tài liệu trong thư mục `plans/`:
  - [PRD.md](file:///d:/FinMan/plans/PRD.md): Nắm vững nghiệp vụ, validation matrix, business rules và acceptance criteria.
  - [ARCHITECTURE.md](file:///d:/FinMan/plans/ARCHITECTURE.md): Nắm rõ kiến trúc hệ thống, schema database, tech stack (Spring Boot 3.x, Gemini API).
  - [CODE_PLAN.md](file:///d:/FinMan/plans/CODE_PLAN.md): Nắm rõ vị trí của task hiện tại trong lộ trình phát triển.
- **Tuyệt đối không suy đoán nghiệp vụ**: Mọi công thức tính toán dòng tiền, số dư ví, tài sản ròng Net Worth và ngân sách đều phải đối chiếu chính xác với PRD.

### 📌 Nguyên Tắc 2: Giới Hạn Phạm Vi Tuyệt Đối (Strict Scope Adherence)
- **Chỉ làm ĐÚNG Task ID được giao**: Không tự ý làm trước các task khác, không tự ý sửa các file ngoài phạm vi task hiện tại.
- **Nghiêm cấm tự mở rộng scope (No Scope Creep)**:
  - ❌ **KHÔNG** làm tính năng Chuyển khoản (Transfer) giữa các ví. FinMan chỉ có 2 luồng: Thu nhập (INCOME) và Chi tiêu (EXPENSE).
  - ❌ **KHÔNG** làm tính năng OCR / Quét ảnh hóa đơn (Receipt Scanning).
  - ❌ **KHÔNG** làm engine học máy phân loại tự động (Auto-categorization engine).
  - ❌ **KHÔNG** tự ý tạo thêm các bảng phức tạp (`RecurringTransaction`, `FinancialGoal`, `ReceiptScanLog`, `AuditLog`). Hệ thống chỉ có 5 bảng: `users`, `accounts`, `categories`, `transactions`, `budgets`.
- **Giữ vững Tech Stack**: Backend là **Java Spring Boot 3.x**, Cơ sở dữ liệu quan hệ **PostgreSQL/MySQL**, AI là **Google Gemini REST API**. Không tự tiện đổi framework hoặc cài thêm các thư viện lạ không cần thiết.

### 📌 Nguyên Tắc 3: Kiểm Tra Hiện Trạng Trước Khi Sửa (Inspect Before Edit)
- Trước khi sửa bất kỳ file nào, Agent **bắt buộc phải đọc nội dung hiện tại** của file đó (`view_file`).
- Hiểu rõ ngữ cảnh, các import và các hàm đang hoạt động để tránh làm hỏng code hiện hữu.
- Sử dụng công cụ sửa đổi từng phần (`replace_file_content` hoặc `multi_replace_file_content`), **tránh ghi đè toàn bộ file** trừ khi tạo mới file từ đầu.

### 📌 Nguyên Tắc 4: Bảo Đảm Tính Toàn Vẹn Số Liệu Tài Chính (Financial Math & Data Integrity)
- **Đơn vị tiền tệ**: Luôn sử dụng đơn vị Đồng Việt Nam (VND).
- **Kiểu dữ liệu tiền tệ**: Tuyệt đối dùng kiểu số nguyên `Long` trong Java và `BIGINT` trong SQL. **Cấm tuyệt đối dùng kiểu số thực `float` hay `double`** để tính toán tiền tệ vì sẽ gây sai số làm tròn số thực.
- **Giao dịch nguyên tử (Atomic Transactions)**: Tất cả các hàm thêm/sửa/xóa giao dịch tác động lên số dư ví bắt buộc phải có annotation `@Transactional`.
- **Bảo mật Multi-tenant**: Mọi câu lệnh truy vấn dữ liệu từ database **bắt buộc** phải có điều kiện ràng buộc `user_id = :currentUserId` lấy từ Security Context. Không được tin tưởng `userId` gửi lên từ body hoặc query param nếu không được xác thực.

### 📌 Nguyên Tắc 5: Bắt Buộc Đọc Mã Nguồn Giao Diện Từ Thư Mục `design/` (Stitch UI Adherence)
- Khi phát triển các màn hình và component ở Frontend, Agent **bắt buộc phải đọc file `code.html` và ảnh `screen.png`** trong thư mục `design/` tương ứng (theo bảng ánh xạ trong `CODE_PLAN.md`).
- **Nghiêm cấm tự sáng tạo giao diện khác**: Phải bóc tách và tái sử dụng chính xác:
  - Cấu trúc DOM / thẻ HTML từ Stitch.
  - Toàn bộ class Tailwind CSS, các biến màu sắc (`surface`, `primary`, `secondary`...).
  - Biểu tượng Material Symbols Outlined và Font chữ `Plus Jakarta Sans`.
  - Bố cục responsive (`max-w-[480px] mx-auto`, `pb-safe`, `pt-safe`).

### 📌 Nguyên Tắc 6: Xử Lý Khi Gặp Điểm Mơ Hồ (Handling Ambiguity)
- Khi gặp trường hợp nghiệp vụ chưa rõ ràng, mâu thuẫn hoặc thiếu thông tin:
  - **DỪNG LẠI NGAY** và xin ý kiến làm rõ từ User.
  - Tuyệt đối không tự suy diễn logic tài chính phức tạp rồi code theo phỏng đoán.

---

# 2. Quy Trình Vòng Lặp Chuẩn Từng Task (Task Execution Loop)

Khi nhận một nhiệm vụ từ User (ví dụ: *"Hãy làm Task 4.2 trong CODE_PLAN"*), Agent phải thực hiện tuần tự và nghiêm ngặt theo 6 bước:

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. Đọc Task ID & Checklist yêu cầu trong CODE_PLAN.md      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Kiểm tra các file hiện có liên quan (Inspect Context)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Viết Code (Entity -> DTO -> Repository -> Service/Ctrl) │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Tự Review Code: Type safety, Clean code, Security audit │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Viết & Chạy Unit/Integration Tests xác minh kết quả      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. CẬP NHẬT NGAY LẬP TỨC VÀO plans/PROCESS.md              │
│    (Đổi trạng thái Task sang Done, ghi chép nhật ký ngắn)   │
└─────────────────────────────────────────────────────────────┘
```

---

# 3. Quy Chuẩn Lập Trình Cho Spring Boot (Coding Conventions)

1. **Phân Tách Trách Nhiệm (Separation of Concerns)**:
   - `Controller`: Chỉ nhận HTTP Request, gọi tầng Service và bọc kết quả vào `ApiResponse<T>`. Không viết logic nghiệp vụ trong Controller.
   - `Service`: Chứa 100% logic nghiệp vụ, quản lý transaction, kiểm tra quyền sở hữu dữ liệu.
   - `Repository`: Chỉ tương tác với Database thông qua Spring Data JPA.
   - `DTO`: Phân tách rạch ròi Request DTO và Response DTO. Dùng `jakarta.validation` (`@NotNull`, `@NotBlank`, `@Min`, `@Size`) để validate dữ liệu đầu vào.
2. **Xử Lý Ngoại Lệ (Exception Handling)**:
   - Không nuốt lỗi (`catch (Exception e) {}`).
   - Ném các custom exception rõ nghĩa (`ResourceNotFoundException`, `BusinessValidationException`, `UnauthorizedException`).
   - Tất cả exception được bắt tập trung tại `GlobalExceptionHandler` để trả về JSON thân thiện với mã lỗi chuẩn.
3. **Thông Báo & Ngôn Ngữ**:
   - Các thông báo lỗi trả về cho người dùng (Error Messages) và nhãn giao diện phải sử dụng **tiếng Việt có dấu, rõ ràng, lịch sự và dễ hiểu**.
   - Tên biến, tên hàm, tên class trong mã nguồn viết bằng tiếng Anh chuẩn.

---

# 4. Quy Định Cập Nhật PROCESS.md

- `plans/PROCESS.md` là cuốn nhật ký sống (Living Document) phản ánh độ tin cậy và tiến độ thực tế của dự án.
- **Bắt buộc**: Ngay sau khi hoàn thành và kiểm thử thành công một task, Agent phải:
  1. Cập nhật dòng tương ứng trong bảng Master Tasks từ `Pending` / `In Progress` thành `Completed`.
  2. Tăng số lượng task hoàn thành và tính lại % tiến độ tổng thể.
  3. Thêm một mục ngắn trong phần **Worklog** mô tả: Mã task, Ngày thực hiện, Các file đã tạo/sửa, Kết quả test (PASS).
