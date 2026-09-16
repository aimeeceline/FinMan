# TEST_PLAN — FinMan Quality Assurance Strategy
## Kế Hoạch & Ma Trận Kiểm Thử Hệ Thống Quản Lý Tài Chính FinMan

Tài liệu này xác định chi tiết chiến lược kiểm thử, môi trường, công cụ và ma trận test case cụ thể cho từng tính năng của hệ thống FinMan (Spring Boot Backend, Google Gemini AI, và Frontend UI).

---

# 1. Chiến Lược Kiểm Thử (Testing Strategy)

Hệ thống FinMan áp dụng mô hình **Kim Tự Tháp Kiểm Thử (Testing Pyramid)**:

```text
       ▲
      / \
     /E2E\      10% - Kiểm thử luồng giao diện người dùng (User Journeys)
    /-----\
   / Integ \    25% - Kiểm thử tích hợp API, Database Transactions & AI
  /---------\
 /   Unit    \  65% - Kiểm thử logic tính toán số dư, Net Worth, Ngân sách, Validation
/─────────────\
```

### Công cụ kiểm thử:
- **Unit & Integration Test Backend**: JUnit 5, Mockito, Spring Boot Test (`@WebMvcTest`, `@SpringBootTest`), H2 Database / Testcontainers PostgreSQL.
- **API & Security Testing**: MockMvc, Postman / REST Client.
- **Frontend & E2E Testing**: Vitest, React Testing Library / Playwright.

---

# 2. Ma Trận Test Cases Chi Tiết Theo Từng Module

## Module 1: Authentication & User Management (`AUTH`)

| Mã Test Case | Tên kịch bản | Dữ liệu đầu vào (Input) | Kết quả mong đợi (Expected Output) | Loại Test |
|---|---|---|---|---|
| **TC_AUTH_01** | Đăng ký tài khoản mới thành công | Email mới, Họ tên hợp lệ, Mật khẩu >= 6 ký tự, Confirm trùng | Mã HTTP 201, trả về JWT Token; DB tạo mới User, tự động sinh ví "Tiền mặt" (số dư 0đ) và danh mục mặc định | Integration |
| **TC_AUTH_02** | Đăng ký với email đã tồn tại | Email đã có trong hệ thống | Mã HTTP 400, báo lỗi: `"Email đã được sử dụng"` | Unit/Integ |
| **TC_AUTH_03** | Đăng ký vi phạm Validation | Email sai format, mật khẩu < 6 ký tự hoặc confirm không khớp | Mã HTTP 400, trả về danh sách chi tiết các trường vi phạm validation | Unit |
| **TC_AUTH_04** | Đăng nhập thành công | Email đúng, Mật khẩu đúng | Mã HTTP 200, trả về Access Token hợp lệ, thông tin User cơ bản | Integration |
| **TC_AUTH_05** | Đăng nhập sai mật khẩu hoặc sai email | Mật khẩu sai hoặc email không tồn tại | Mã HTTP 401, thông báo lỗi: `"Email hoặc mật khẩu không chính xác"` | Unit/Integ |
| **TC_AUTH_06** | Xác thực Token & Lấy thông tin cá nhân | Request kèm Header `Authorization: Bearer <token_hợp_lệ>` đến `/api/v1/auth/me` | Mã HTTP 200, trả về đúng profile của User | Integration |
| **TC_AUTH_07** | Truy cập không có Token hoặc Token hết hạn | Token rác hoặc token quá hạn | Mã HTTP 401 Unauthorized | Integration |

---

## Module 2: Financial Accounts & Net Worth (`ACC`)

| Mã Test Case | Tên kịch bản | Dữ liệu đầu vào (Input) | Kết quả mong đợi (Expected Output) | Loại Test |
|---|---|---|---|---|
| **TC_ACC_01** | Tạo ví Tiền mặt / Ngân hàng | Name: `"Vietcombank"`, Type: `BANK`, Initial Balance: `5.000.000` | Mã HTTP 201, số dư khả dụng (`current_balance`) bằng `5.000.000đ` | Integration |
| **TC_ACC_02** | Tạo Thẻ tín dụng | Name: `"Techcombank Visa"`, Type: `CREDIT_CARD`, Limit: `20.000.000`, Initial Debt: `0` | Mã HTTP 201, lưu đúng hạn mức và số dư nợ ban đầu | Integration |
| **TC_ACC_03** | Tính toán Tài sản ròng (Net Worth) | 1 ví tiền mặt `2.000.000đ`, 1 thẻ tín dụng nợ `500.000đ` | API trả về: Total Assets = `2.000.000đ`, Total Liabilities = `500.000đ`, Net Worth = `1.500.000đ` | Unit |
| **TC_ACC_04** | Xóa tài khoản đã phát sinh giao dịch | Gửi `DELETE /api/v1/accounts/{id}` với ví đã có giao dịch | Chuyển `isArchived = true` (Soft delete), ví không còn xuất hiện trong danh sách hoạt động nhưng lịch sử giao dịch vẫn nguyên vẹn | Integration |
| **TC_ACC_05** | Kiểm tra phân quyền truy cập ví (Multi-tenant) | User B cố tình gửi ID ví của User A để sửa hoặc xóa | Mã HTTP 403 Forbidden hoặc 404 Not Found, không cho phép can thiệp | Integration |

---

## Module 3: Category Management (`CAT`)

| Mã Test Case | Tên kịch bản | Dữ liệu đầu vào (Input) | Kết quả mong đợi (Expected Output) | Loại Test |
|---|---|---|---|---|
| **TC_CAT_01** | Lấy danh mục hệ thống mặc định | Gọi `GET /api/v1/categories` sau khi đăng ký | Trả về danh sách đầy đủ: Ăn uống, Giải trí, Lương, Giao thông... | Integration |
| **TC_CAT_02** | Tạo danh mục cá nhân mới | Name: `"Nuôi thú cưng"`, Type: `EXPENSE`, Icon: `"🐶"` | Tạo thành công danh mục riêng gắn với `user_id` hiện tại | Integration |
| **TC_CAT_03** | Ngăn chặn xóa danh mục mặc định hoặc đã dùng | Gửi yêu cầu xóa danh mục hệ thống hoặc danh mục đã có giao dịch | Mã HTTP 400, từ chối xóa kèm thông báo giải thích rõ ràng | Unit/Integ |

---

## Module 4: Core Transaction Engine & Balance Consistency (`TXN`)

> [!IMPORTANT]
> Đây là module trọng yếu nhất của dự án. Mọi biến động số dư phải đạt tính chính xác 100%, không chấp nhận sai số.

| Mã Test Case | Tên kịch bản | Dữ liệu đầu vào (Input) | Kết quả mong đợi (Expected Output) | Loại Test |
|---|---|---|---|---|
| **TC_TXN_01** | Thêm giao dịch Thu nhập (INCOME) | Ví ban đầu có `1.000.000đ`. Thêm Thu nhập: `2.000.000đ` | Giao dịch được lưu, số dư ví tăng thành `3.000.000đ` | Integration |
| **TC_TXN_02** | Thêm giao dịch Chi tiêu (EXPENSE) | Ví ban đầu có `3.000.000đ`. Thêm Chi tiêu: `800.000đ` | Giao dịch được lưu với dấu `-800.000đ`, số dư ví giảm còn `2.200.000đ` | Integration |
| **TC_TXN_03** | Chỉnh sửa số tiền của giao dịch | Đổi giao dịch chi tiêu từ `800.000đ` thành `1.000.000đ` | Số dư ví được hoàn tác `800k` cũ và trừ `1tr` mới, số dư ví chính xác còn `2.000.000đ` | Integration |
| **TC_TXN_04** | Chỉnh sửa đổi ví phát sinh giao dịch | Chuyển giao dịch chi `500.000đ` từ Ví A sang Ví B | Số dư Ví A được cộng hoàn lại `500.000đ`, Số dư Ví B bị trừ đi `500.000đ` trong cùng 1 transaction | Integration |
| **TC_TXN_05** | Xóa giao dịch Chi tiêu | Xóa khoản chi `500.000đ` khỏi ví có số dư `1.500.000đ` | Bản ghi giao dịch bị xóa, số dư ví hoàn lại thành `2.000.000đ` | Integration |
| **TC_TXN_06** | Xóa giao dịch Thu nhập | Xóa khoản thu `1.000.000đ` khỏi ví có số dư `2.000.000đ` | Bản ghi giao dịch bị xóa, số dư ví giảm còn `1.000.000đ` | Integration |
| **TC_TXN_07** | Chặn số tiền không hợp lệ (Validation) | Số tiền âm (`-50.000đ`), số tiền bằng `0đ`, hoặc số tiền vượt 10 tỷ | Mã HTTP 400, từ chối lưu giao dịch | Unit |
| **TC_TXN_08** | Tính toàn vẹn Database Transaction (Rollback) | Cố tình tạo lỗi runtime trong lúc cập nhật số dư | Toàn bộ thao tác bị Rollback, số dư ví và bảng transaction giữ nguyên trạng thái cũ | Integration |
| **TC_TXN_09** | Lọc giao dịch theo tháng & ngày | Lọc tháng `2026-09` | Trả về đúng danh sách giao dịch tháng 9, nhóm theo từng ngày kèm tổng Thu - Chi | Integration |

---

## Module 5: Budgeting System & Alert Engine (`BDG`)

| Mã Test Case | Tên kịch bản | Dữ liệu đầu vào (Input) | Kết quả mong đợi (Expected Output) | Loại Test |
|---|---|---|---|---|
| **TC_BDG_01** | Thiết lập ngân sách danh mục chi tiêu | Category: "Ăn uống", Month: `2026-09`, Amount: `3.000.000đ` | Lưu thành công, nếu tháng đó đã có thì tự động cập nhật (Upsert) | Integration |
| **TC_BDG_02** | Chặn tạo ngân sách cho danh mục Thu nhập | Category loại `INCOME` | Mã HTTP 400, báo lỗi: `"Chỉ được đặt ngân sách cho danh mục chi tiêu"` | Unit |
| **TC_BDG_03** | Trạng thái bình thường (< 80%) | Ngân sách `3.000.000đ`, đã chi `1.500.000đ` (50%) | Status: `NORMAL`, Remaining: `1.500.000đ`, Progress: `50%` | Unit |
| **TC_BDG_04** | Trạng thái sắp chạm ngưỡng (80% - 100%) | Ngân sách `3.000.000đ`, đã chi `2.500.000đ` (83.3%) | Status: `WARNING`, hiển thị cảnh báo màu vàng | Unit |
| **TC_BDG_05** | Trạng thái vượt hạn mức (> 100%) | Ngân sách `3.000.000đ`, đã chi `3.200.000đ` (106.6%) | Status: `OVERBUDGET`, hiển thị cảnh báo đỏ và số tiền vượt `200.000đ` | Unit |

---

## Module 6: Google Gemini AI Features (`AI`)

| Mã Test Case | Tên kịch bản | Dữ liệu đầu vào (Input) | Kết quả mong đợi (Expected Output) | Loại Test |
|---|---|---|---|---|
| **TC_AI_01** | Nhập nhanh câu văn tiếng Việt rõ ràng | `"Ăn bún bò 45k bằng tiền mặt"` | Trả về JSON: `type: EXPENSE`, `amount: 45000`, `category: Ăn uống`, `account: Tiền mặt`, `note: bún bò` | Integration |
| **TC_AI_02** | Nhập nhanh tiếng Việt không dấu | `"mua ao so mi 350k the ngan hang"` | Trả về JSON: `type: EXPENSE`, `amount: 350000`, `category: Áo quần`, `account: Ngân hàng` | Integration |
| **TC_AI_03** | Câu nhập thiếu tên tài khoản hoặc danh mục | `"Uống cà phê 35k"` | Tự động gán tài khoản mặc định ("Tiền mặt") và danh mục phù hợp | Integration |
| **TC_AI_04** | Câu nhập không hợp lệ hoặc không có số tiền | `"Xin chào FinMan hôm nay trời đẹp quá"` | API trả về mã lỗi thân thiện: `"Không thể nhận diện giao dịch. Vui lòng nhập rõ số tiền và nội dung."` | Integration |
| **TC_AI_05** | Tạo nhận xét tài chính hàng tháng | Gọi `/api/v1/ai/insights` tháng `2026-09` | Trả về đoạn văn bản nhận xét mạch lạc, đưa ra 2 lời khuyên tiết kiệm cụ thể | Integration |
| **TC_AI_06** | Xử lý khi mất kết nối Gemini hoặc hết hạn mức | Mock Gemini API trả về HTTP 429 hoặc Timeout | API bắt lỗi an toàn, trả về JSON mã lỗi `AI_SERVICE_UNAVAILABLE`, không gây crash server | Unit/Integ |

---

## Module 7: Data Export (Apache POI) (`EXP`)

| Mã Test Case | Tên kịch bản | Dữ liệu đầu vào (Input) | Kết quả mong đợi (Expected Output) | Loại Test |
|---|---|---|---|---|
| **TC_EXP_01** | Tải file Excel lịch sử giao dịch | Gọi `GET /api/v1/export/excel?from=2026-09-01&to=2026-09-30` | Header phản hồi đúng `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, tải về file `.xlsx` nguyên vẹn | Integration |
| **TC_EXP_02** | Kiểm tra tính chính xác dữ liệu trong file Excel | Đọc file Excel vừa tải bằng thư viện POI | File chứa đầy đủ số dòng tương ứng với DB, số tiền định dạng tiền tệ đẹp mắt, không lỗi tiếng Việt Unicode | Integration |

---

# 3. Tiêu Chí Nghiệm Thu Chất Lượng (Quality Gates)

Một tính năng chỉ được xem là hoàn tất khi đáp ứng 100% các tiêu chí sau:
1. **Pass toàn bộ Test Cases liên quan**: Không có bất kỳ test case nào bị Fail hoặc Error.
2. **Không có lỗi sai số làm tròn**: Kiểm tra số dư ví khớp chính xác từng đồng VNĐ.
3. **Tuân thủ Clean Code & Security**: Không vi phạm các nguyên tắc trong `GEMINI.md`.
4. **Cập nhật tiến độ**: Đã cập nhật kết quả kiểm thử vào `plans/PROCESS.md`.
