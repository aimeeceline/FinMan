# CODE_PLAN — FinMan Implementation Roadmap
## Kế Hoạch Triển Khai Kỹ Thuật Toàn Diện (Fullstack: Spring Boot + Frontend Stitch UI + Gemini AI)

Tài liệu này xác định thứ tự lập trình chi tiết cho dự án FinMan theo mô hình **Fullstack Monorepo**:
- **`backend/`**: Java Spring Boot 3.x (REST API, JPA, Spring Security 6, JWT, Gemini API, Apache POI).
- **`backend/`**: Java Spring Boot 3.x (REST API, JPA, Spring Security 6, JWT, Gemini API, Apache POI).
- **`frontend/`**: React 19 + Vite + TypeScript + Tailwind CSS (Được xây dựng chuẩn hóa từ bộ thiết kế Stitch Web Application trong thư mục `design/`).
- **`design/`**: Bộ thiết kế Web Desktop từ Stitch với 7 module hoàn chỉnh và tài liệu `fintech_prestige/DESIGN.md`.

---

# Bảng Ánh Xạ Thư Mục Giao Diện Web Stitch (`design/`) Với Kế Hoạch Lập Trình

> [!IMPORTANT]
> **Quy tắc bất biến cho Agent**: Trước khi code bất kỳ màn hình nào ở Frontend, Agent **bắt buộc phải đọc file `code.html` và ảnh `screen.png`** trong thư mục `design/` tương ứng để tái sử dụng chính xác cấu trúc HTML, các class Tailwind CSS, inline icons (Material Symbols) và layout Desktop-First (1600px analytical canvas).

| Thư mục Stitch (`design/`) | Tên màn hình / Tài nguyên | Phase & Task triển khai |
|---|---|---|
| [`design/fintech_prestige`](file:///d:/FinMan/design/fintech_prestige) | Toàn bộ Design Tokens & Quy chuẩn thiết kế (DESIGN.md) | **Task 0.4**: Cấu hình `tailwind.config.js` & `src/index.css` |
| [`design/finman_web_ng_nh_p_h_th_ng`](file:///d:/FinMan/design/finman_web_ng_nh_p_h_th_ng) | Màn hình Đăng nhập Web (Login split screen) | **Task 2.3**: `src/pages/auth/LoginPage.tsx` |
| [`design/finman_web_ng_k_t_i_kho_n`](file:///d:/FinMan/design/finman_web_ng_k_t_i_kho_n) | Màn hình Đăng ký Web (Register split screen) | **Task 2.3**: `src/pages/auth/RegisterPage.tsx` |
| [`design/finman_web_giao_d_ch_dashboard`](file:///d:/FinMan/design/finman_web_giao_d_ch_dashboard) | Màn hình Dashboard & Lịch sử Giao dịch Web | **Task 4.2**: `src/pages/dashboard/DashboardPage.tsx` |
| [`design/finman_web_popup_th_m_giao_d_ch_m_i`](file:///d:/FinMan/design/finman_web_popup_th_m_giao_d_ch_m_i) | Modal Thêm giao dịch Glassmorphism Web | **Task 4.3**: `src/components/modals/AddTransactionModal.tsx` |
| [`design/finman_web_qu_n_l_ng_n_s_ch`](file:///d:/FinMan/design/finman_web_qu_n_l_ng_n_s_ch) | Màn hình Quản lý Ngân sách chi tiêu Web | **Task 5.2**: `src/pages/budget/BudgetPage.tsx` |
| [`design/finman_web_t_i_kho_n_t_i_s_n_r_ng`](file:///d:/FinMan/design/finman_web_t_i_kho_n_t_i_s_n_r_ng) | Màn hình Tài khoản & Tài sản ròng Web (VIP Net Worth) | **Task 3.2**: `src/pages/accounts/AccountsPage.tsx` |
| [`design/finman_web_th_ng_k_b_o_c_o`](file:///d:/FinMan/design/finman_web_th_ng_k_b_o_c_o) | Màn hình Thống kê & Báo cáo dòng tiền Web | **Task 8.2**: `src/pages/statistics/StatisticsPage.tsx` |
| [`design/finman_web_tr_l_finman_ai`](file:///d:/FinMan/design/finman_web_tr_l_finman_ai) | Màn hình Trợ lý FinMan AI Web | **Task 6.3**: `src/pages/ai/AIAssistantPage.tsx` |

---

# Bảng Tóm Tắt Các Phase (79 Tasks: 77 Completed + 2 Planned)

| Phase | Tên Phase | Số lượng Tasks | Trạng thái | Phụ thuộc |
|---|---|---|---|---|
| **Phase 0** | Khởi tạo dự án Monorepo, Backend Spring Boot & Frontend Stitch Design Tokens | 5 tasks | `COMPLETED` | Không |
| **Phase 1** | Database Models, Repositories & Data Seeder | 4 tasks | `COMPLETED` | Phase 0 |
| **Phase 2** | Authentication Fullstack (Spring Security + Frontend Auth Screens) | 5 tasks | `COMPLETED` | Phase 1 |
| **Phase 3** | Financial Accounts & Categories Fullstack (APIs + Stitch Accounts Screen) | 4 tasks | `COMPLETED` | Phase 2 |
| **Phase 4** | Core Transaction Engine Fullstack (APIs + Stitch Home, Add Txn & Calendar) | 6 tasks | `COMPLETED` | Phase 3 |
| **Phase 5** | Budgeting System Fullstack (APIs + Stitch Budget Screen) | 4 tasks | `COMPLETED` | Phase 4 |
| **Phase 6** | Google Gemini AI Fullstack (APIs + Stitch AI Assistant Screen) | 4 tasks | `COMPLETED` | Phase 4 |
| **Phase 7** | Settings, Profile & App Polish (APIs + Stitch Settings Screen + PWA) | 4 tasks | `COMPLETED` | Phase 2 - 6 |
| **Phase 8** | Statistics & Data Export Fullstack (APIs + Stitch Stats Screen + Excel) | 4 tasks | `COMPLETED` | Phase 4 |
| **Phase 9** | Comprehensive Testing, Security Audit & Docker Deployment | 3 tasks | `COMPLETED` | Phase 1 - 8 |
| **Phase 10** | Extended Account Domain & Full Transfer Implementation | 7 tasks | `COMPLETED` | Phase 4, 8 |
| **Phase 11** | Recycle Bin & Soft Delete Management (Thùng rác & Phục hồi dữ liệu) | 2 tasks | `COMPLETED` | Phase 1 - 4 |
| **Phase 12** | Playwright Automated End-to-End Testing Suite (10 Test Specs) | 2 tasks | `COMPLETED` | Phase 2 - 8 |
| **Phase 13** | Mobile Responsive Layout, Bottom Navigation & Floating AI Chat Ball | 2 tasks | `COMPLETED` | Phase 4, 6 |
| **Phase 14** | Module 1: Financial News Foundation (Thu thập & chuẩn hóa tin tức) | 5 tasks | `COMPLETED` | Phase 0 - 2 |
| **Phase 15** | Module 2: AI News Intelligence (Tóm tắt, sắc thái, tác động & Caching) | 4 tasks | `COMPLETED` | Phase 14, Phase 6 |
| **Phase 16** | Module 4: AI Financial Assistant Expansion (Q&A tin tức, dẫn nguồn, cross-insights) | 5 tasks | `COMPLETED` | Phase 14, 15, Core Finance |
| **Phase 17** | Module 3: Market Intelligence (Chỉ số VN-Index, mã cổ phiếu, Watchlist) | 5 tasks | `COMPLETED` | Phase 14 |
| **Phase 18** | Module 5: FinMan Daily Intelligence (Bản tin tài chính sáng, Digest) | 4 tasks (2 done, 2 planned) | `IN PROGRESS` | Phase 14 - 17 |

---

# Chi Tiết Từng Phase & Danh Sách Tasks

## Phase 0: Khởi Tạo Monorepo, Backend Spring Boot & Frontend Setup

### Task 0.1: Khởi tạo Backend Spring Boot 3.x (`backend/`)
- **Mục tiêu**: Tạo khung dự án Maven Spring Boot 3.x trong thư mục `backend/` với Java 17/21.
- **Phụ thuộc (pom.xml)**: `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-security`, `spring-boot-starter-validation`, `postgresql`, `jjwt-api`, `jjwt-impl`, `jjwt-jackson`, `lombok`, `poi-ooxml`.
- **Files**: `backend/pom.xml`, `backend/src/main/resources/application.yml`.
- **DoD**: Build thành công bằng `mvn clean compile` trong thư mục `backend/`.

### Task 0.2: Cấu hình Database PostgreSQL & Docker Compose
- **Mục tiêu**: Thiết lập file `docker-compose.yml` chạy PostgreSQL và cấu hình Datasource kết nối.
- **Files**: `docker-compose.yml`, `backend/src/main/resources/application.yml`.
- **DoD**: PostgreSQL khởi động ổn định, kết nối HikariCP thành công.

### Task 0.3: Khởi tạo Frontend Web Project (`frontend/`)
- **Mục tiêu**: Tạo dự án Frontend React 19 + Vite + TypeScript trong thư mục `frontend/`, cấu hình Tailwind CSS, Axios, Lucide React, Google Fonts.
- **Files**: `frontend/package.json`, `frontend/vite.config.ts`, `frontend/index.html`, `frontend/src/App.tsx`.
- **DoD**: Lệnh `npm run dev` khởi chạy thành công và `npm run build` biên dịch sạch sẽ không có lỗi TypeScript.

### Task 0.4: Nhúng Design Tokens & Quy Chuẩn Fintech Prestige Vào Frontend Web
- **Mục tiêu**:
  - **Đọc tài liệu**: Đọc file [design/fintech_prestige/DESIGN.md](file:///d:/FinMan/design/fintech_prestige/DESIGN.md).
  - Khai báo toàn bộ bảng màu Fintech Prestige (`surface`, `surface-container-*`, `primary`, `secondary`, `tertiary`, `outline`...) vào `frontend/tailwind.config.js`.
  - Cấu hình font chữ `Plus Jakarta Sans` cho headings/body và `Inter` cho `currency-display`, `currency-row` (tabular lining figures) trong `frontend/src/index.css`.
  - Cấu hình các lớp bo góc, shadow glassmorphism, và scrollbar mỏng tùy biến.
- **Files**: `frontend/tailwind.config.js`, `frontend/src/index.css`, `frontend/index.html`.
- **DoD**: Giao diện Web hiển thị đúng 100% mã màu, typography và elevation theo chuẩn Fintech Prestige.

### Task 0.5: Xây dựng Global Exception Handler & ApiResponse Standard (Backend)
- **Mục tiêu**: Chuẩn hóa định dạng JSON phản hồi `ApiResponse<T>` và bắt các lỗi validation, business error.
- **Files**: `backend/src/main/java/com/finman/dto/response/ApiResponse.java`, `exception/GlobalExceptionHandler.java`.
- **DoD**: Khi ném Exception, API trả về JSON chuẩn kèm message tiếng Việt rõ ràng.

---

## Phase 1: Database Models, Repositories & Data Seeder

### Task 1.1: Tạo 5 Thực Thể Entity Cốt Lõi (JPA)
- **Mục tiêu**: Xây dựng 5 entity JPA theo đúng thiết kế ERD trong `ARCHITECTURE.md`:
  - `User.java`: `id`, `email`, `passwordHash`, `fullName`, `avatarUrl`, `createdAt`, `updatedAt`.
  - `Account.java`: Đơn vị tài chính (`id`, `user`, `name` [tên tùy chỉnh do user đặt: TPBank, Nuôi con, Tiết kiệm...], `type` [`CASH`, `BANK`, `CREDIT_CARD`, `INVESTMENT`, `OTHER`], `initialBalance`, `currentBalance`, `creditLimit`, `note` [proposed], `isArchived`).
  - `Category.java`: `id`, `user`, `name`, `type` (`INCOME`, `EXPENSE`), `icon`, `isDefault`.
  - `Transaction.java`: `id`, `user`, `account` (tài khoản nguồn), `toAccount` (tài khoản nhận nếu TRANSFER), `category`, `type` (`INCOME`, `EXPENSE`, `TRANSFER`), `amount` (Long), `transactionDate`, `note`.
  - `Budget.java`: `id`, `user`, `category`, `month`, `amount`.
- **Files**: `backend/src/main/java/com/finman/entity/*`.
- **DoD**: Hibernate sinh đúng các bảng và khóa ngoại, số tiền lưu dạng `BIGINT`, không dùng float.

### Task 1.2: Định Nghĩa Constraints, Unique Keys & Indexes
- **Mục tiêu**: Khai báo Unique Constraint cho `users.email`, Unique `(user_id, category_id, month)` trong `Budget`, và các Database Indexes cho tìm kiếm giao dịch.
- **Files**: Các Entity trong `backend/src/main/java/com/finman/entity/*`.
- **DoD**: DB schema thể hiện đầy đủ các ràng buộc toàn vẹn.

### Task 1.3: Tạo Spring Data JPA Repositories
- **Mục tiêu**: Xây dựng các interface Repository kế thừa `JpaRepository` cho `User`, `Account`, `Category`, `Transaction`, `Budget`.
- **Files**: `backend/src/main/java/com/finman/repository/*`.
- **DoD**: Các method truy vấn lọc theo `userId` hoạt động chính xác.

### Task 1.4: Xây Dựng Data Seeder Khởi Tạo Danh Mục Mặc Định
- **Mục tiêu**: Tự động chèn danh mục mặc định (Ăn uống, Giải trí, Lương, Giao thông...) khi app khởi chạy.
- **Files**: `backend/src/main/java/com/finman/config/DataSeeder.java`.
- **DoD**: Khởi động app lần đầu, database có sẵn các danh mục chuẩn với cờ `is_default = true`.

---

## Phase 2: Authentication Fullstack (Spring Security + Stitch Auth Screens)

### Task 2.1: Cấu hình Spring Security 6 & JWT Token Provider
- **Mục tiêu**: Cấu hình Stateless SecurityFilterChain, BCrypt, JWT Provider sinh/giải mã token.
- **Files**: `backend/src/main/java/com/finman/config/SecurityConfig.java`, `security/JwtTokenProvider.java`, `security/JwtAuthenticationFilter.java`.
- **DoD**: Token hợp lệ giải mã đúng `userId`, request không token bị chặn `401`.

### Task 2.2: Backend Auth APIs (`/api/v1/auth/register`, `/login`, `/me`)
- **Mục tiêu**: Xử lý đăng ký (tự tạo ví "Tiền mặt" ban đầu), đăng nhập trả về JWT token, và lấy thông tin cá nhân.
- **Files**: `backend/src/main/java/com/finman/controller/AuthController.java`, `service/AuthService.java`.
- **DoD**: Đăng ký và đăng nhập thành công qua Postman, kiểm tra trùng email chặt chẽ.

### Task 2.3: Frontend Auth Screens (React Web SPA từ Stitch)
- **Mục tiêu**:
  - **Đọc trực tiếp từ Stitch Web**:
    - [design/finman_web_ng_nh_p_h_th_ng/code.html](file:///d:/FinMan/design/finman_web_ng_nh_p_h_th_ng/code.html) → Tạo `frontend/src/pages/auth/LoginPage.tsx`.
    - [design/finman_web_ng_k_t_i_kho_n/code.html](file:///d:/FinMan/design/finman_web_ng_k_t_i_kho_n/code.html) → Tạo `frontend/src/pages/auth/RegisterPage.tsx`.
  - Tái sử dụng trọn vẹn cấu trúc Desktop split-screen, hero showcase cards, form input có icon Material Symbols, nút ẩn/hiện mật khẩu, Google login trigger, và logo FM.
- **Files**: `frontend/src/pages/auth/LoginPage.tsx`, `frontend/src/pages/auth/RegisterPage.tsx`.
- **DoD**: Các màn hình Auth hiển thị đúng 100% so với thiết kế Web Stitch, build thành công với Vite.

### Task 2.4: Kết Nối Frontend Auth Với Backend API
- **Mục tiêu**: Gửi request đăng nhập/đăng ký từ form Web tới Spring Boot backend, lưu token vào `localStorage`, tự động gán Bearer Token vào Axios Request Interceptor, chuyển hướng tới Web Dashboard sau khi xác thực thành công.
- **Files**: `frontend/src/services/api.ts`, `frontend/src/context/AuthContext.tsx`.
- **DoD**: Đăng ký và đăng nhập mượt mà trên trình duyệt Web, tự động lưu token và đồng bộ trạng thái User.

### Task 2.5: Unit Test Cho Luồng Xác Thực
- **Mục tiêu**: Viết Unit Test cho `AuthService` (Backend) và kiểm tra validate form Auth (Frontend).
- **Files**: `backend/src/test/java/com/finman/service/AuthServiceTest.java`.
- **DoD**: Test cases `TC_AUTH_01` đến `TC_AUTH_07` đạt PASS 100%.

### Task 2.6: Tích Hợp Google OAuth 2.0 Fullstack (Backend & Frontend Web)
- **Mục tiêu**:
  - Backend: Xây dựng endpoint `POST /api/v1/auth/google` xử lý xác thực token Google / tài khoản Google, tự động tạo User + Ví tiền mặt 0đ ban đầu nếu là người dùng mới, và cấp phát token JWT FinMan.
  - Frontend: Tích hợp nút đăng nhập Google OAuth trên Web, kết nối trigger Google với `login` trong `AuthContext`.
- **Files**: `backend/src/main/java/com/finman/dto/request/GoogleAuthRequest.java`, `backend/src/main/java/com/finman/service/AuthService.java`, `backend/src/main/java/com/finman/controller/AuthController.java`, `frontend/src/pages/auth/LoginPage.tsx`, `frontend/src/context/AuthContext.tsx`.
- **DoD**: Bấm "Đăng nhập với Google" đăng nhập thành công vào ứng dụng và nhận token JWT thật từ backend.

---

## Phase 3: Financial Accounts & Categories Fullstack

### Task 3.1: Backend Accounts & Categories APIs
- **Mục tiêu**:
  - CRUD Accounts: `GET /api/v1/accounts` (hỗ trợ tên tùy chỉnh do user đặt: TPBank, Nuôi con, Tiết kiệm...; tính Net Worth = Assets - Liabilities), `POST`, `PUT`, `PATCH /archive` (chuyển `isArchived = true` bảo toàn lịch sử), `DELETE` (chỉ cho phép khi chưa có giao dịch).
  - Phân định rõ ràng: Account là Financial Unit (không tạo entity Fund riêng).
  - Categories: `GET /api/v1/categories`, `POST`, `DELETE`.
- **Files**: `backend/src/main/java/com/finman/service/AccountService.java`, `controller/AccountController.java`, `service/CategoryService.java`.
- **DoD**: Trả về danh sách tài khoản kèm số dư và tính đúng Net Worth.

### Task 3.2: Frontend Accounts Screen (Bóc tách từ Stitch)
- **Mục tiêu**:
  - **Đọc trực tiếp từ Stitch**: [design/finman_web_t_i_kho_n_t_i_s_n_r_ng/code.html](file:///d:/FinMan/design/finman_web_t_i_kho_n_t_i_s_n_r_ng/code.html).
  - Tạo `frontend/src/pages/accounts/AccountsPage.tsx`.
  - Tái sử dụng:
    - Thẻ VIP Dark Gunmetal hiển thị Tài sản ròng (Net Worth = Assets - Liabilities) và nút ẩn/hiện số dư bảo mật.
    - Dải phương trình tài chính (Tổng tài sản thực có, Khoản nợ / Dư nợ thẻ, Thặng dư ròng).
    - Biểu đồ phân bổ dòng vốn Donut SVG vector tự động tính % tỷ trọng dòng tiền.
    - Các nhóm tài khoản: Tiền mặt (`CASH`), Tài khoản ngân hàng (`BANK`), Thẻ tín dụng & Nợ (`CREDIT_CARD`), Tài khoản đầu tư (`INVESTMENT`), Tài khoản khác (`OTHER`).
    - Modal thêm tài khoản mới chuẩn Stitch Web (cho phép đặt tên tùy chỉnh).
- **Files**: `frontend/src/pages/accounts/AccountsPage.tsx`.
- **DoD**: Giao diện hiển thị đúng layout Desktop-First sang trọng của Stitch, có nút thêm ví và lưu trữ ví tiện lợi.

### Task 3.3: Kết Nối Frontend Accounts Với Backend API
- **Mục tiêu**: Tải danh sách ví thực tế từ `/api/v1/accounts`, xử lý form tạo ví mới và cập nhật trạng thái số dư theo thời gian thực.
- **Files**: `frontend/src/services/accountService.ts`.
- **DoD**: Người dùng tạo ví mới trên giao diện, ví hiển thị ngay lập tức và số dư tổng cập nhật chuẩn xác từ database.

### Task 3.4: Tests Cho Accounts & Net Worth
- **Mục tiêu**: Kiểm thử test cases `TC_ACC_01` đến `TC_ACC_05` (kiểm tra phân quyền multi-tenant, tính toán Net Worth).
- **DoD**: Toàn bộ test case module Account đạt PASS.

---

## Phase 4: Core Transaction Engine Fullstack (Dashboard, Add Txn & Calendar)

### Task 4.1: Backend Transaction Service (`@Transactional`)
- **Mục tiêu**:
  - Triển khai logic ghi nhận 3 loại giao dịch:
    + `INCOME`: Tăng số dư tài khoản nhận.
    + `EXPENSE`: Giảm số dư tài khoản nguồn.
    + `TRANSFER`: Giảm số dư tài khoản chuyển (`fromAccount`), tăng số dư tài khoản nhận (`toAccount`), không tính vào Thu nhập hay Chi tiêu.
  - Chỉnh sửa & Xóa giao dịch: Hoàn tác tác động cũ, áp dụng tác động mới chuẩn xác trên các tài khoản liên quan.
  - Lọc giao dịch theo tháng (`month=YYYY-MM`), khoảng ngày, tài khoản, danh mục, loại giao dịch (`type`), từ khóa.
- **Files**: `backend/src/main/java/com/finman/service/TransactionService.java`, `controller/TransactionController.java`.
- **DoD**: Đảm bảo tính toán số dư chính xác từng đồng VNĐ, có rollback khi lỗi, Transfer không làm biến động Net Worth.

### Task 4.2: Frontend Transactions Web Dashboard (Bóc tách từ Stitch)
- **Mục tiêu**:
  - **Đọc trực tiếp từ Stitch**: [design/finman_web_giao_d_ch_dashboard/code.html](file:///d:/FinMan/design/finman_web_giao_d_ch_dashboard/code.html).
  - Tạo `frontend/src/pages/dashboard/DashboardPage.tsx`.
  - Tái sử dụng:
    - Interactive Header & Bộ chọn tháng (Tháng 8, 9, 10...).
    - KPI Strip: Tổng số dư khả dụng, Thu nhập xanh, Chi tiêu đỏ, Tỷ lệ tích lũy.
    - Khung nhập lệnh nhanh FinMan AI (Quick AI Prompt bar).
    - Lịch sử giao dịch gần đây nhóm theo thời gian.
    - Cột Net Worth & Tài khoản nhanh phía bên phải.
- **Files**: `frontend/src/pages/dashboard/DashboardPage.tsx`.
- **DoD**: Màn hình Web Dashboard hiển thị chuẩn xác từng pixel theo thiết kế Stitch Web.

### Task 4.3: Frontend Add Transaction Modal (Bóc tách từ Stitch)
- **Mục tiêu**:
  - **Đọc trực tiếp từ Stitch**: [design/finman_web_popup_th_m_giao_d_ch_m_i/code.html](file:///d:/FinMan/design/finman_web_popup_th_m_giao_d_ch_m_i/code.html).
  - Tạo `frontend/src/components/modals/AddTransactionModal.tsx`.
  - Tái sử dụng:
    - Popup Glassmorphism chuẩn Web Desktop.
    - Tab chuyển đổi: **Chi tiêu** | **Thu nhập** (Bỏ hoàn toàn tab chuyển khoản).
    - Quick Amount Chips: 50k, 100k, 200k, 500k, 1M, 2M, 5M.
    - Bộ chọn danh mục với icon tương ứng.
    - Bộ chọn tài khoản ví liên kết.
    - Chọn ngày và ô nhập ghi chú.
- **Files**: `frontend/src/components/modals/AddTransactionModal.tsx`.
- **DoD**: Modal thêm giao dịch hoạt động mượt mà, đổi màu chủ đạo khi chuyển giữa Thu và Chi.

### Task 4.4: Frontend Calendar & Time Filtering
- **Mục tiêu**: Tích hợp bộ lọc thời gian trực quan theo tháng và khoảng ngày trên Header và Dashboard, đồng bộ lịch sử giao dịch tức thì.
- **Files**: `frontend/src/components/layout/TopHeader.tsx`, `frontend/src/pages/dashboard/DashboardPage.tsx`.
- **DoD**: Người dùng dễ dàng chuyển đổi chu kỳ tháng và theo dõi dòng tiền trực quan.

### Task 4.5: Kết Nối Frontend Transactions Với Backend API
- **Mục tiêu**: Khi bấm "Lưu giao dịch" → gọi `POST /api/v1/transactions` → cập nhật số dư trên Hero Card và danh sách giao dịch ngày tức thì.
- **Files**: `frontend/src/services/transactionService.ts`.
- **DoD**: Toàn bộ luồng tạo, xem và xóa giao dịch hoạt động trơn tru.

### Task 4.6: Tests Cho Transaction Engine
- **Mục tiêu**: Kiểm thử test cases `TC_TXN_01` đến `TC_TXN_09`.
- **DoD**: Tất cả các kịch bản kiểm thử tính toán và cập nhật số dư đạt PASS 100%.

---

## Phase 5: Budgeting System Fullstack (APIs + Stitch Budget Screen)

### Task 5.1: Backend Budget APIs
- **Mục tiêu**: CRUD ngân sách, tính tổng tiền đã chi `amountSpent`, số tiền còn lại `remaining`, và trạng thái cảnh báo (`NORMAL`, `WARNING`, `OVERBUDGET`).
- **Files**: `backend/src/main/java/com/finman/service/BudgetService.java`, `controller/BudgetController.java`.
- **DoD**: Trả về đúng tiến độ chi tiêu theo từng danh mục trong tháng.

### Task 5.2: Frontend Budget Screen (Bóc tách từ Stitch)
- **Mục tiêu**:
  - **Đọc trực tiếp từ Stitch**: [design/finman_web_qu_n_l_ng_n_s_ch/code.html](file:///d:/FinMan/design/finman_web_qu_n_l_ng_n_s_ch/code.html).
  - Tạo `frontend/src/pages/budget/BudgetPage.tsx`.
  - Tái sử dụng:
    - Header chọn tháng ngân sách.
    - Card tổng quan ngân sách tháng (Tổng ngân sách, Đã chi, Còn lại).
    - Danh sách các danh mục có thanh tiến độ (Progress bar) đổi màu Xanh (<80%), Vàng (80-100%), Đỏ (>100%).
    - Modal thiết lập hạn mức ngân sách mới.
- **Files**: `frontend/src/pages/budget/BudgetPage.tsx`.
- **DoD**: Giao diện ngân sách phản ánh trực quan cảnh báo hạn mức chi tiêu.

### Task 5.3: Kết Nối Frontend Budget Với Backend API
- **Mục tiêu**: Tải dữ liệu ngân sách thực tế và cho phép người dùng thêm/sửa ngân sách ngay trên giao diện.
- **Files**: `frontend/src/services/budgetService.ts`.
- **DoD**: Thay đổi chi tiêu ở Phase 4 tự động cập nhật ngay thanh tiến độ ngân sách ở Phase 5.

### Task 5.4: Tests Cho Budget Logic
- **Mục tiêu**: Kiểm thử test cases `TC_BDG_01` đến `TC_BDG_05`.
- **DoD**: Đạt PASS 100% các ngưỡng cảnh báo 80% và 100%.

---

## Phase 6: Google Gemini AI Fullstack (APIs + Stitch AI Assistant Screen)

### Task 6.1: Backend Gemini AI Client & Structured Prompt Engine
- **Mục tiêu**: Cấu hình Spring REST Client gọi Gemini API (`gemini-2.0-flash`) với prompt bóc tách tiếng Việt ra JSON chuẩn.
- **Files**: `backend/src/main/java/com/finman/config/GeminiConfig.java`, `service/AiService.java`.
- **DoD**: Bóc tách chính xác câu `"Ăn bún bò 45k tiền mặt"` thành JSON giao dịch.

### Task 6.2: Backend Quick-Add & Spending Insights APIs
- **Mục tiêu**: Triển khai `/api/v1/ai/quick-add` và `/api/v1/ai/insights`. Xử lý fallback an toàn khi API AI lỗi.
- **Files**: `backend/src/main/java/com/finman/controller/AiController.java`.
- **DoD**: Trả về form đã điền sẵn cho Quick Add và nhận xét chi tiêu hữu ích bằng tiếng Việt.

### Task 6.3: Frontend AI Assistant Screen (Bóc tách từ Stitch)
- **Mục tiêu**:
  - Tái sử dụng giao diện trợ lý ảo AI trên nền tảng Web Desktop:
    - Khung nhập lệnh AI thông minh với placeholder gợi ý câu nói tự nhiên.
    - Bong bóng chat tư vấn tài chính thông minh qua Gemini.
    - Card xem trước thông tin giao dịch mà AI bóc tách được trước khi lưu (Số tiền, Danh mục, Ví, Ngày).
- **Files**: `frontend/src/pages/ai/AIAssistantPage.tsx`.
- **DoD**: Trải nghiệm nhập liệu bằng AI trực quan, thân thiện, người dùng chỉ cần gõ 1 câu là xong.

### Task 6.4: Tests Cho Google Gemini AI
- **Mục tiêu**: Kiểm thử test cases `TC_AI_01` đến `TC_AI_06` (bao gồm câu có dấu, không dấu, câu rác và lỗi mạng).
- **DoD**: Tất cả các kịch bản AI đều được xử lý an toàn, đạt PASS.

---

## Phase 7: Settings, Profile & App Polish (APIs + Stitch Settings Screen)

### Task 7.1: Backend Profile & Settings APIs
- **Mục tiêu**: Cập nhật thông tin cá nhân (Họ tên, Mật khẩu), API đăng xuất.
- **Files**: `backend/src/main/java/com/finman/controller/UserController.java`.
- **DoD**: Đổi thông tin thành công, kiểm tra mật khẩu cũ trước khi đổi mật khẩu mới.

### Task 7.2: Frontend More & Settings Screen (Bóc tách từ Stitch)
- **Mục tiêu**:
  - Tái sử dụng giao diện Cài đặt Web Desktop:
    - Profile header (Avatar, Tên người dùng, Email).
    - Danh sách tab: Thông tin cá nhân, Quản lý tài khoản, Danh mục thu chi, Cài đặt thông báo, Xuất dữ liệu Excel, Đăng xuất.
- **Files**: `frontend/src/pages/settings/SettingsPage.tsx`.
- **DoD**: Màn hình cài đặt hiển thị đầy đủ các tính năng hỗ trợ, đăng xuất chuyển hướng về Login.

### Task 7.3: Tối Ưu Trải Nghiệm Web Responsive & Performance
- **Mục tiêu**: Tinh chỉnh giao diện Web responsive từ Desktop (1600px canvas) xuống Tablet và Mobile viewport. Tối ưu animation CSS, lazy loading và bundle size với Vite.
- **Files**: `frontend/src/index.css`, `frontend/src/App.tsx`, `frontend/tailwind.config.js`.
- **DoD**: Trải nghiệm mượt mà trên mọi kích thước màn hình trình duyệt, Lighthouse Performance & Accessibility đạt chuẩn.

### Task 7.4: Kiểm Tra Đối Chiếu Toàn Diện Với Thiết Kế Stitch Web
- **Mục tiêu**: So sánh từng trang Web đã code với mã nguồn `code.html` và ảnh `screen.png` trong tất cả các thư mục `design/finman_web_*`.
- **DoD**: Chuẩn xác 100% về bảng màu Fintech Prestige, typography Plus Jakarta Sans, layout dual-rail sidebar và spacing chuẩn design system.

---

## Phase 8: Statistics & Data Export Fullstack

### Task 8.1: Backend Aggregation & Apache POI Excel Export
- **Mục tiêu**: Viết query tổng hợp số liệu thu/chi theo danh mục và service xuất file `.xlsx` lịch sử giao dịch.
- **Files**: `backend/src/main/java/com/finman/service/ExportService.java`, `controller/ExportController.java`.
- **DoD**: Endpoint `/api/v1/export/excel` stream file Excel chuẩn về client.

### Task 8.2: Frontend Statistics Screen (Bóc tách từ Stitch)
- **Mục tiêu**:
  - **Đọc trực tiếp từ Stitch**: [design/finman_web_th_ng_k_b_o_c_o/code.html](file:///d:/FinMan/design/finman_web_th_ng_k_b_o_c_o/code.html).
  - Tạo `frontend/src/pages/statistics/StatisticsPage.tsx`.
  - Tái sử dụng:
    - Tab lọc thời gian: Tuần, Tháng, Hàng năm, Tùy chọn (Period).
    - Biểu đồ tỷ trọng chi tiêu theo danh mục (tỷ lệ % và số tiền) với Donut Chart SVG và Legend.
    - Cashflow Trend Over Time Card: Biểu đồ đường SVG với vùng gradient mịn màng và đỉnh chi tiêu tương tác.
    - AI Financial Health Banner: Trạng thái tài chính (Khả quan/Cảnh báo), % thặng dư, 3 highlight pillars (Dòng tiền thuần, Tổng thu, Tổng chi).
    - Detailed Category Threshold Progress Bars: Thanh tiến độ theo từng danh mục.
    - Top khoản chi lớn nhất tháng: Bảng xếp hạng chi tiêu trọng yếu.
    - Nút tải file Excel xuất báo cáo trực tiếp.
- **Files**: `frontend/src/pages/statistics/StatisticsPage.tsx`.
- **DoD**: Biểu đồ hiển thị sắc nét, đồng bộ màu sắc với thiết kế Stitch.

### Task 8.3: Kết Nối Frontend Statistics & Tải File Excel
- **Mục tiêu**: Gọi API thống kê đổ dữ liệu vào biểu đồ và kích hoạt tải file `.xlsx` trực tiếp về trình duyệt khi bấm nút Xuất.
- **Files**: `frontend/src/services/statisticsService.ts`, `frontend/src/App.tsx`.
- **DoD**: Tải về file Excel mở được trên máy tính với dữ liệu tiếng Việt chuẩn Unicode. Kết nối với `/api/v1/statistics/overview` và `/api/v1/export/excel`.

### Task 8.4: Tests Cho Statistics & Export [COMPLETED]
- **Mục tiêu**: Kiểm thử test cases `TC_EXP_01`, `TC_EXP_02`, `TC_EXP_04`.
- **Files**: `backend/src/test/java/com/finman/controller/ExportControllerTest.java`, `backend/src/test/java/com/finman/service/ExportServiceTest.java`.
- **DoD**: File Excel xuất ra nguyên vẹn, số liệu khớp hoàn toàn với cơ sở dữ liệu.
- **Trạng thái**: Đã hoàn thành (100% tests cho Export & Statistics PASS).

---

## Phase 9: Comprehensive Testing, Security Audit & Docker Deployment

### Task 9.1: Chạy Toàn Bộ Test Suite (Backend & Frontend) [COMPLETED]
- **Mục tiêu**: Thực thi `mvn test` trên Backend và chạy test trên Frontend.
- **DoD**: 100% test cases đều PASS, không có regression bug.
- **Trạng thái**: Đã hoàn thành (24 test classes Backend PASS, Frontend `npm run build` PASS 0 lỗi).

### Task 9.2: Rà Soát Bảo Mật Đa Tầng (Multi-tenant & Injection Audit) [COMPLETED]
- **Mục tiêu**: Kiểm tra bảo đảm mọi query đều ràng buộc `user_id = currentUserId`, chống tấn công IDOR, XSS.
- **DoD**: Báo cáo kiểm thử bảo mật sạch sẽ, không có lỗ hổng rò rỉ dữ liệu chéo.
- **Trạng thái**: Đã hoàn thành (Tất cả controller và service đều lấy `userId` từ `UserPrincipal` bảo mật).

### Task 9.3: Docker Compose Production Hoàn Chỉnh [COMPLETED]
- **Mục tiêu**: Tạo Dockerfile đa tầng cho Spring Boot backend và cấu hình `docker-compose.prod.yml` chạy đồng bộ PostgreSQL + Backend.
- **Files**: `backend/Dockerfile`, `docker-compose.prod.yml`.
- **DoD**: Khởi chạy toàn bộ hệ thống bằng 1 lệnh duy nhất: `docker-compose -f docker-compose.prod.yml up -d`.
- **Trạng thái**: Đã hoàn thành (Dockerfile multi-stage và docker-compose.prod.yml sẵn sàng).

---

## Phase 10: Extended Account Domain & Full Transfer Implementation

### Task 10.1: Database Schema Migration Cho Transfer & Extended Account Attributes [COMPLETED]
- **Mục tiêu**: Mở rộng bảng `transactions` thêm cột `to_account_id BIGINT NULL REFERENCES accounts(id)` và cho phép `category_id` NULL khi `type = 'TRANSFER'`. Bổ sung cột `note VARCHAR(255) NULL` vào bảng `accounts`.
- **Files**: `backend/src/main/java/com/finman/entity/Transaction.java`, `backend/src/main/java/com/finman/entity/Account.java`.
- **DoD**: Schema migration thành công, backwards-compatible 100% với dữ liệu giao dịch hiện hữu.
- **Trạng thái**: Đã hoàn thành.

### Task 10.2: Backend Transaction Service Processing Cho Luồng TRANSFER [COMPLETED]
- **Mục tiêu**: Xử lý logic chuyển khoản nguyên tử `@Transactional`: trừ tiền tài khoản nguồn (`fromAccount`) và cộng tiền tài khoản đích (`toAccount`). Kiểm tra ràng buộc `fromAccountId != toAccountId`, cả hai tài khoản thuộc cùng user và không bị archived.
- **Files**: `backend/src/main/java/com/finman/service/TransactionService.java`, `backend/src/main/java/com/finman/dto/request/TransactionCreateRequest.java`, `backend/src/main/java/com/finman/dto/request/TransactionUpdateRequest.java`.
- **DoD**: Giao dịch Transfer thực thi thành công, hoàn tác chuẩn xác khi sửa/xóa, tổng tài sản của user bảo toàn tuyệt đối.
- **Trạng thái**: Đã hoàn thành.

### Task 10.3: Cô Lập Thống Kê & Báo Cáo Không Bị Ảnh Hưởng Bởi TRANSFER [COMPLETED]
- **Mục tiêu**: Rà soát và cập nhật toàn bộ các câu truy vấn tổng hợp (`findTotalIncomeByMonth`, `findTotalExpenseByMonth`, `aggregateByCategory`, `aggregateDailyCashflow`, `AiService.buildUserFinancialContext`, `ExportService`) để cô lập các giao dịch có `type = 'TRANSFER'`.
- **Files**: `backend/src/main/java/com/finman/repository/TransactionRepository.java`, `backend/src/main/java/com/finman/service/StatisticsService.java`, `backend/src/main/java/com/finman/service/AiService.java`, `backend/src/main/java/com/finman/service/ExportService.java`.
- **DoD**: Thống kê Thu nhập và Chi tiêu không bị tăng khống khi có giao dịch chuyển tiền nội bộ. Báo cáo Excel hiển thị giao dịch chuyển tiền trực quan (`Ví A ➔ Ví B`) với màu xanh navy đặc thù. Context AI phân biệt rạch ròi giao dịch chuyển ví. Toàn bộ 190 backend unit & integration tests pass 100%.
- **Trạng thái**: Đã hoàn thành.

### Task 10.4: Frontend Transfer Tab & UI Modal Cập Nhật [COMPLETED]
- **Mục tiêu**: Bổ sung tab "Chuyển khoản" trong modal `AddTransactionModal.tsx` cho phép chọn Khoản tiền nguồn và Khoản tiền đích, dự toán số dư sau chuyển và chặn điều chuyển cùng một ví. Cập nhật thẻ giao dịch trên Dashboard & Statistics hiển thị biểu tượng điều chuyển trung tính (`Ví Nguồn ➔ Ví Đích`, số tiền `⇄ X ₫`).
- **Files**: `frontend/src/components/modals/AddTransactionModal.tsx`, `frontend/src/pages/dashboard/DashboardPage.tsx`, `frontend/src/pages/statistics/StatisticsPage.tsx`, `frontend/src/types/index.ts`, `frontend/src/services/transactionService.ts`.
- **DoD**: Người dùng dễ dàng tạo giao dịch chuyển khoản giữa các khoản tiền trực tiếp trên giao diện Web với Canvas trực quan, an toàn kiểu dữ liệu và 0 lỗi TypeScript build.
- **Trạng thái**: Đã hoàn thành.

### Task 10.5: AI Natural Language Quick Add Nhận Diện Intent TRANSFER [COMPLETED]
- **Mục tiêu**: Nâng cấp Prompt và schema bóc tách của Gemini API để nhận diện intent chuyển tiền (ví dụ: "Chuyển 10tr từ TPBank sang Nuôi con") và trả về đúng `fromAccountName` và `toAccountName`.
- **Files**: `backend/src/main/java/com/finman/service/AiService.java`.
- **DoD**: AI bóc tách chính xác giao dịch Transfer và tự động điền form chuyển khoản để người dùng xác nhận.
- **Trạng thái**: Đã hoàn thành (Tích hợp prompt nhận diện và mapping sang DTO).

### Task 10.6: Backend Account Lifecycle & Purpose Pocket Management [COMPLETED]
- **Mục tiêu**: Hoàn thiện vòng đời tài khoản mục đích: bổ sung endpoint lưu trữ / khôi phục tài khoản (`PATCH /api/v1/accounts/{id}/archive`), chặn xóa cứng nếu tài khoản đã có lịch sử giao dịch (bảo toàn toàn vẹn dữ liệu), hỗ trợ tham số lọc `includeArchived` trong danh sách tài khoản.
- **Files**: `backend/src/main/java/com/finman/controller/AccountController.java`, `backend/src/main/java/com/finman/service/AccountService.java`, `backend/src/main/java/com/finman/repository/AccountRepository.java`.
- **DoD**: API archive/unarchive hoạt động chuẩn xác, bảo đảm an toàn dữ liệu lịch sử và phân quyền người dùng.
- **Trạng thái**: Đã hoàn thành.

### Task 10.7: Frontend Purpose-based Accounts Redesign (`AccountsPage.tsx` & Account Modal) [COMPLETED]
- **Mục tiêu**: Tái thiết kế toàn diện trang Tài khoản và modal theo triết lý "Khoản tiền cho mục đích sử dụng":
  + Bổ sung gợi ý chip mục đích nhanh (🍼 Nuôi con, 👵 Phụng dưỡng bố mẹ, ☕ Đầu tư quán cà phê, 🚨 Dự phòng khẩn cấp, 🏠 Mua nhà/xe, 🛒 Chi tiêu sinh hoạt) và trường nhập `Ghi chú (note)`.
  + Chuyển layout từ chia cột ngân hàng cứng nhắc sang Lưới các **Khoản tiền mục đích (Purpose Allocation Cards)** với icon/màu sắc nhận diện, số dư khả dụng, ghi chú kế hoạch.
  + Hỗ trợ chuyển đổi xem danh sách Khoản tiền đang hoạt động vs Khoản tiền đã lưu trữ (Archive/Unarchive).
- **Files**: `frontend/src/pages/accounts/AccountsPage.tsx`, `frontend/src/services/accountService.ts`, `frontend/src/types/index.ts`.
- **DoD**: Giao diện phản ánh đúng nghĩa các khoản tiền mục đích, mượt mà, đầy đủ tính năng và 0 lỗi TypeScript.
- **Trạng thái**: Đã hoàn thành.

---

## Phase 11: Recycle Bin & Soft Delete Management [COMPLETED]

### Task 11.1: Backend Recycle Bin APIs & Soft Delete Processing [COMPLETED]
- **Mục tiêu**: Xây dựng controller và service quản lý thùng rác cho phép xem danh sách mục đã xóa mềm, khôi phục và xóa vĩnh viễn dữ liệu.
- **Files**: `backend/src/main/java/com/finman/controller/RecycleBinController.java`, `backend/src/main/java/com/finman/service/RecycleBinService.java`, `backend/src/main/java/com/finman/dto/request/RecycleBinActionRequest.java`, `backend/src/main/java/com/finman/dto/response/RecycleBinItemResponse.java`.
- **DoD**: Khôi phục giao dịch tự động hoàn tác/áp lại số dư tương ứng, xóa vĩnh viễn dọn dẹp an toàn.
- **Trạng thái**: Đã hoàn thành.

### Task 11.2: Frontend Recycle Bin Service & Soft Delete Synchronization [COMPLETED]
- **Mục tiêu**: Xây dựng client service `recycleBinService.ts` kết nối `/api/v1/recycle-bin`, cập nhật các component modal và trang để lọc bỏ các mục đã xóa mềm (`!isDeleted`).
- **Files**: `frontend/src/services/recycleBinService.ts`, `frontend/src/types/index.ts`, `frontend/src/components/modals/AddTransactionModal.tsx`, `frontend/src/pages/dashboard/DashboardPage.tsx`, `frontend/src/pages/budget/BudgetPage.tsx`.
- **DoD**: UI không hiển thị danh mục / giao dịch đã xóa mềm, tự động reset filter khi danh mục đang chọn bị xóa.
- **Trạng thái**: Đã hoàn thành.

---

## Phase 12: Playwright Automated End-to-End Testing Suite [COMPLETED]

### Task 12.1: Thiết Lập Playwright Test Harness & CI Workflow [COMPLETED]
- **Mục tiêu**: Cấu hình môi trường kiểm thử trình duyệt tự động Playwright, tích hợp GitHub Actions chạy tự động.
- **Files**: `playwright.config.ts`, `package.json`, `.github/workflows/playwright.yml`.
- **DoD**: Chạy kiểm thử tự động trên nhiều viewport và môi trường CI.
- **Trạng thái**: Đã hoàn thành.

### Task 12.2: Xây Dựng 10 Kịch Bản Kiểm Thử E2E Toàn Diện [COMPLETED]
- **Mục tiêu**: Viết đầy đủ kịch bản kiểm thử E2E từ đăng ký/đăng nhập, điều hướng, giao dịch, tài khoản, ngân sách, AI, thống kê đến cài đặt và seed data.
- **Files**: `tests/01_auth.spec.ts` đến `tests/08_settings.spec.ts`, `tests/seed_data.spec.ts`, `tests/fixtures/mock-api.ts`.
- **DoD**: Toàn bộ kịch bản E2E chạy thông suốt, xác thực tính sẵn sàng của sản phẩm.
- **Trạng thái**: Đã hoàn thành.

---

## Phase 13: Mobile Responsive Layout & UI Modernization [COMPLETED]

### Task 13.1: Thanh Điều Hướng Đáy Màn Hình (Mobile Bottom Navigation) [COMPLETED]
- **Mục tiêu**: Tối ưu hiển thị cho thiết bị di động, ẩn sidebar máy tính và thay thế bằng bottom bar cố định thân thiện với thao tác một tay.
- **Files**: `frontend/src/App.tsx`, `frontend/src/index.css`.
- **DoD**: Responsive mượt mà trên mobile viewport, chuyển tab tức thì.
- **Trạng thái**: Đã hoàn thành.

### Task 13.2: Bong Bóng Trợ Lý AI Nổi (Floating AI Chat Ball) & Compact Filters [COMPLETED]
- **Mục tiêu**: Thiết kế nút tròn nổi kích hoạt nhanh trợ lý AI trên màn hình nhỏ và thu gọn bộ lọc giao dịch dạng chips.
- **Files**: `frontend/src/pages/dashboard/DashboardPage.tsx`, `frontend/src/App.tsx`.
- **DoD**: Người dùng dễ dàng chat với AI và lọc dữ liệu trên di động.
- **Trạng thái**: Đã hoàn thành.

---

# LỘ TRÌNH MỞ RỘNG FINMAN 2.0 (AI FINANCIAL & MARKET INTELLIGENCE)

> [!IMPORTANT]
> **Quy tắc tuyệt đối cho Developer & Coding Agent**:
> - Toàn bộ các Phase từ 14 đến 18 dưới đây là **Kế Hoạch Triển Khai Mới (PLANNED / NOT IMPLEMENTED)**.
> - **KHÔNG ĐƯỢC PHÉP** tự ý sửa đổi hoặc làm gián đoạn các phân hệ tài chính cá nhân cốt lõi đã hoàn thành ở Phase 0 – 13.
> - Mọi thao tác coding phải tuân thủ nghiêm ngặt thứ tự từng Task ID, kiểm thử đạt Definition of Done (DoD) mới được chuyển sang task tiếp theo.

---

## Phase 14: Module 1 — Financial News Foundation (Thu Thập & Chuẩn Hóa Tin Tức) [PLANNED]

### Task 14.1: Database Schema Migration & Entities Cho News Module [DONE]
- **Mục tiêu**: Khởi tạo 4 bảng `news_sources`, `news_categories`, `news_articles`, `user_saved_articles` và các entity JPA tương ứng. Tạo Full-Text Search GIN Index trên `title` và `description`.
- **Files dự kiến**:
  - `backend/src/main/resources/db/migration/V2__news_foundation.sql`
  - `backend/src/main/java/com/finman/entity/NewsSource.java`
  - `backend/src/main/java/com/finman/entity/NewsCategory.java`
  - `backend/src/main/java/com/finman/entity/NewsArticle.java`
  - `backend/src/main/java/com/finman/entity/UserSavedArticle.java`
  - `backend/src/main/java/com/finman/repository/NewsArticleRepository.java`
- **DoD**: Chạy migration SQL thành công, JPA entity mapping chuẩn xác, seed dữ liệu cho 4 nguồn tin và 5 danh mục tin tức.
- **Trạng thái**: `[DONE]` (Đã hoàn thành).

### Task 14.2: News Collector Service & RSS/API Ingestion Engine [DONE]
- **Mục tiêu**: Xây dựng service thu thập tin tức từ RSS Feeds (VnExpress, CafeF, Vietstock) và REST API (NewsAPI). Tự động phân tách nội dung HTML thô thành văn bản sạch sẽ.
- **Files dự kiến**:
  - `backend/src/main/java/com/finman/service/news/NewsCollectorService.java`
  - `backend/src/main/java/com/finman/client/RssFeedParser.java`
  - `backend/src/main/java/com/finman/client/NewsApiClient.java`
- **DoD**: Thu thập thành công tối thiểu 20 bài báo tài chính hợp lệ từ các nguồn, xử lý lỗi an toàn khi mất mạng hoặc nguồn feed bị lỗi format.
- **Trạng thái**: `[DONE]` (Đã hoàn thành).

### Task 14.3: De-duplication Engine & Hashing Processor [DONE]
- **Mục tiêu**: Xây dựng cơ chế phát hiện và chặn lưu trùng bài viết thông qua mã băm SHA-256 từ `normalized_title` + `source_id`, đồng thời kiểm tra độ tương đồng tiêu đề (Jaccard similarity).
- **Files dự kiến**:
  - `backend/src/main/java/com/finman/service/news/NewsDeduplicationService.java`
- **DoD**: Chặn thành công 100% các bài viết trùng lặp URL hoặc tiêu đề tương tự > 85%, không tạo rác dữ liệu trong database.
- **Trạng thái**: `[DONE]` (Đã hoàn thành).

### Task 14.4: Spring Boot News REST Controllers & Background Scheduler [DONE]
- **Mục tiêu**: Xây dựng các API `/api/v1/news/**` phục vụ xem danh sách bài viết (phân trang, lọc theo category, source, keyword), chi tiết bài báo, lưu/bỏ lưu bài viết. Cấu hình task `@Scheduled` tự động kích hoạt crawl mỗi 30 phút.
- **Files dự kiến**:
  - `backend/src/main/java/com/finman/controller/NewsController.java`
  - `backend/src/main/java/com/finman/service/news/NewsService.java`
  - `backend/src/main/java/com/finman/scheduler/NewsIngestionScheduler.java`
  - `backend/src/main/java/com/finman/dto/response/NewsArticleResponse.java`
- **DoD**: API trả về dữ liệu nhanh (< 100ms với FTS index), scheduler chạy mượt mà không gây tắc nghẽn thread pool.
- **Trạng thái**: `[DONE]` (Đã hoàn thành).

### Task 14.5: Frontend Financial News Dashboard & Article Modal [COMPLETED]
- **Mục tiêu**: Xây dựng giao diện trang Tin tức Tài chính (`/tin-tuc-tai-chinh`) chuẩn Stitch UI: bộ chọn danh mục ngang, lưới thẻ tin tức (News Cards) có thumbnail, modal đọc bài viết sạch và nút đánh dấu lưu bài.
- **Files**:
  - `frontend/src/pages/news/NewsDashboardPage.tsx`
  - `frontend/src/components/news/NewsCard.tsx`
  - `frontend/src/components/news/NewsDetailModal.tsx`
  - `frontend/src/services/newsService.ts`
  - `frontend/src/types/news.ts`
  - `frontend/src/components/layout/Sidebar.tsx`
  - `frontend/src/components/layout/TopHeader.tsx`
  - `frontend/src/App.tsx` (Bổ sung route `tin-tuc-tai-chinh`)
  - `tests/09_news.spec.ts`
- **DoD**: Giao diện hiển thị sắc nét trên cả desktop và mobile, tìm kiếm từ khóa mượt mà, phân trang không giật lag. Đồng bộ toàn bộ hệ thống khi đăng nhập luôn ở ngày hiện tại.
- **Trạng thái**: `[COMPLETED]` (Đã hoàn thành).

---

## Phase 15: Module 2 — AI News Intelligence (Gemini Phân Tích Chuyên Sâu) [PLANNED]

### Task 15.1: Database Schema Cho `news_summaries` & Caching Processor [DONE]
- **Mục tiêu**: Tạo bảng `news_summaries` lưu trữ kết quả tóm tắt, sắc thái, đối tượng ảnh hưởng và tags. Xây dựng tầng cache kiểm tra trước khi gọi Gemini.
- **Files dự kiến**:
  - `backend/src/main/resources/db/migration/V3__news_ai_summaries.sql`
  - `backend/src/main/java/com/finman/entity/NewsSummary.java`
  - `backend/src/main/java/com/finman/repository/NewsSummaryRepository.java`
- **DoD**: Khóa ngoại `article_id` quan hệ 1-1 chặt chẽ, truy vấn cache trả về kết quả tức thì trong < 10ms.
- **Trạng thái**: `[DONE]` (Đã hoàn thành).

### Task 15.2: Backend Gemini News Summarization & 3-Bullet Points Extractor [DONE]
- **Mục tiêu**: Thiết kế Structured Prompt gửi nội dung bài báo đến Gemini API để trích xuất 3 ý chính tóm lược và các con số tài chính quan trọng.
- **Files dự kiến**:
  - `backend/src/main/java/com/finman/service/ai/NewsAiService.java`
  - `backend/src/main/resources/prompts/news-summary.txt`
- **DoD**: Gemini trả về JSON có cấu trúc chuẩn xác 100%, tự động fallback khi gặp sự cố mạng hoặc lỗi quota.
- **Trạng thái**: `[DONE]` (Đã hoàn thành).

### Task 15.3: Backend Gemini Sentiment & Impact Analysis Service [DONE]
- **Mục tiêu**: Phân tích sắc thái (POSITIVE, NEGATIVE, NEUTRAL) kèm câu giải thích căn cứ, nhận diện mã cổ phiếu liên quan (Tickers) và đối tượng chịu tác động kinh tế.
- **Files dự kiến**:
  - `backend/src/main/java/com/finman/service/ai/NewsSentimentService.java`
  - `backend/src/main/resources/prompts/news-sentiment.txt`
- **DoD**: Phân biệt rạch ròi dữ kiện từ bài báo (Fact) và nhận định AI (Opinion). Nhận diện chính xác tối thiểu 90% mã cổ phiếu xuất hiện trong bài.
- **Trạng thái**: `[DONE]` (Đã hoàn thành).

### Task 15.4: Frontend AI Summary Card & Sentiment Badges Integration [COMPLETED]
- **Mục tiêu**: Tích hợp khối thông tin AI lên thẻ tin tức và modal đọc bài: huy hiệu sắc thái màu sắc (Xanh lá / Vàng / Đỏ), danh sách 3 ý tóm tắt nhanh và các chip mã cổ phiếu liên quan có thể click.
- **Files triển khai**:
  - `frontend/src/components/news/AiSummaryCard.tsx`
  - `frontend/src/components/news/SentimentBadge.tsx`
  - `frontend/src/components/news/NewsCard.tsx`
  - `frontend/src/components/news/NewsDetailModal.tsx`
  - `frontend/src/components/news/HeroFeaturedNews.tsx`
  - `frontend/src/pages/news/NewsDashboardPage.tsx`
- **DoD**: Người dùng nắm bắt toàn bộ nội dung cốt lõi của bài báo trong 10 giây mà không cần đọc hết bài viết dài.
- **Trạng thái**: `[COMPLETED]` (Đã hoàn thành 100%).

---

## Phase 16: Module 4 — AI Financial Assistant Expansion (Trợ Lý Toàn Diện & Dẫn Nguồn) [COMPLETED]

### Task 16.1: Database Schema Cho Lịch Sử Hội Thoại & Dẫn Nguồn AI [COMPLETED]
- **Mục tiêu**: Tạo 3 bảng `ai_conversations`, `ai_messages`, `ai_message_sources` để lưu phiên trò chuyện và mối liên kết trích dẫn bài báo cho từng câu trả lời.
- **Files triển khai**:
  - `backend/src/main/resources/db/migration/V4__ai_conversations.sql`
  - `backend/src/main/java/com/finman/entity/enums/AiMessageRole.java`
  - `backend/src/main/java/com/finman/entity/AiConversation.java`
  - `backend/src/main/java/com/finman/entity/AiMessage.java`
  - `backend/src/main/java/com/finman/entity/AiMessageSource.java`
  - `backend/src/main/java/com/finman/repository/AiConversationRepository.java`
  - `backend/src/main/java/com/finman/repository/AiMessageRepository.java`
  - `backend/src/main/java/com/finman/repository/AiMessageSourceRepository.java`
  - `backend/src/test/java/com/finman/repository/AiConversationRepositoryTest.java`
- **DoD**: Phân quyền nghiêm ngặt theo `user_id`, hỗ trợ xem lại lịch sử trò chuyện và các nguồn tham khảo trong quá khứ. 100% integration tests đạt chuẩn.
- **Trạng thái**: `[COMPLETED]` (Đã hoàn thành 100%).

### Task 16.2: Backend Hybrid Context Retrieval Engine [COMPLETED]
- **Mục tiêu**: Xây dựng engine tự động gom ngữ cảnh đa nguồn trước khi gửi cho Gemini:
  1. *Ngữ cảnh Nội bộ*: Số dư 5 loại tài khoản mục đích, ngân sách tháng, top chi tiêu (chỉ của `currentUserId`).
  2. *Ngữ cảnh Ngoại vi*: Top 3 bài báo liên quan nhất lấy từ PostgreSQL Full-Text Search.
- **Files triển khai**:
  - `backend/src/main/java/com/finman/dto/response/HybridFinancialContext.java`
  - `backend/src/main/java/com/finman/service/ai/HybridContextBuilder.java`
  - `backend/src/test/java/com/finman/service/ai/HybridContextBuilderTest.java`
- **DoD**: Gom ngữ cảnh hoàn tất trong < 50ms, bảo đảm không rò rỉ dữ liệu cá nhân của người dùng khác. 100% test cases đạt PASS (`BUILD SUCCESS`).
- **Trạng thái**: `[COMPLETED]` (Đã hoàn thành 100%).

### Task 16.3: Prompt Injection Defense & Citation Mapping Processor [COMPLETED]
- **Mục tiêu**: Bọc nội dung tin tức bên ngoài vào thẻ `<untrusted_external_news>`, kiểm tra chống tiêm mã độc (Prompt Injection) và ánh xạ các đánh dấu trích dẫn `[1]`, `[2]` vào danh sách `ai_message_sources`.
- **Files triển khai**:
  - `backend/src/main/resources/prompts/financial-assistant-v2.txt`
  - `backend/src/main/java/com/finman/service/ai/CitationProcessor.java`
  - `backend/src/test/java/com/finman/service/ai/CitationProcessorTest.java`
- **DoD**: Chặn đứng 100% các câu lệnh can thiệp hệ thống nằm trong bài báo, trung hòa thẻ XML sandbox, trích xuất chính xác liên kết bài báo cho từng phát biểu `[1]`, `[2]` và gán vào `AiMessageSource`. 100% test cases đạt PASS (`BUILD SUCCESS`).
- **Trạng thái**: `[COMPLETED]` (Đã hoàn thành 100%).

### Task 16.4: Cross-Domain Personalized Financial Insights Engine [COMPLETED]
- **Mục tiêu**: Huấn luyện prompt cho phép AI đối chiếu sự kiện vĩ mô (lãi suất tăng/giảm, lạm phát, giá xăng) với tình hình thu chi và số dư ví của người dùng để đưa ra lời khuyên cá nhân hóa kèm Disclaimer.
- **Files triển khai**:
  - `backend/src/main/resources/prompts/personalized-insights.txt`
  - `backend/src/main/java/com/finman/service/ai/PersonalizedInsightEngine.java`
  - `backend/src/main/java/com/finman/dto/response/PersonalizedInsightItem.java`
  - `backend/src/main/java/com/finman/dto/response/PersonalizedInsightResponse.java`
  - `backend/src/main/java/com/finman/dto/request/MacroImpactRequest.java`
  - `backend/src/main/java/com/finman/dto/response/MacroImpactEvaluationResponse.java`
  - `backend/src/main/java/com/finman/dto/response/AiMessageSourceResponse.java`
  - `backend/src/main/java/com/finman/dto/response/AiMessageResponse.java`
  - `backend/src/main/java/com/finman/dto/response/AiConversationResponse.java`
  - `backend/src/main/java/com/finman/controller/AiController.java`
  - `backend/src/test/java/com/finman/service/ai/PersonalizedInsightEngineTest.java`
- **DoD**: Đưa ra nhận xét sát sườn, tính toán lợi nhuận/chi phí chênh lệch có căn cứ toán học chính xác (Integer VND arithmetic, nhạy cảm lãi suất, tác động lạm phát, số tháng dự phòng khẩn cấp), kèm Financial Disclaimer và kiểm soát Multi-tenant an toàn. 100% test cases đạt PASS (`BUILD SUCCESS`).
- **Trạng thái**: `[COMPLETED]` (Đã hoàn thành 100%).

### Task 16.5: Frontend AI Assistant Chat Interface v2 [COMPLETED]
- **Mục tiêu**: Nâng cấp giao diện `AIAssistantPage.tsx`: danh sách phiên trò chuyện bên trái, bong bóng tin nhắn hiển thị rich markdown, các thẻ chip nguồn tham khảo (Citation Chips) có thể click để mở xem bài báo gốc.
- **Files triển khai**:
  - `frontend/src/services/aiChatService.ts`
  - `frontend/src/components/ai/CitationChip.tsx`
  - `frontend/src/components/ai/ConversationList.tsx`
  - `frontend/src/components/ai/MacroScenarioModal.tsx`
  - `frontend/src/components/ai/PersonalizedInsightCard.tsx`
  - `frontend/src/pages/ai/AIAssistantPage.tsx`
  - `backend/src/main/java/com/finman/controller/AiController.java`
- **DoD**: Trải nghiệm đàm thoại mượt mà, hỗ trợ quản lý đa phiên hội thoại, lưu vết trích dẫn bài báo chính xác, chuyển đổi tab linh hoạt giữa Trò chuyện v2 và Báo cáo Vĩ mô cá nhân hóa. `npm run build` đạt 100% type-safe, 0 lỗi.
- **Trạng thái**: `[COMPLETED]` (Đã hoàn thành 100%).

---

## Phase 17: Module 3 — Market Intelligence (Thị Trường & Cổ Phiếu) [COMPLETED]

### Task 17.1: Database Schema Cho Market Data & User Watchlist [COMPLETED]
- **Mục tiêu**: Tạo 4 bảng `market_indices`, `stock_symbols`, `stock_price_history`, `user_watchlists`.
- **Files đã triển khai**:
  - `backend/src/main/resources/db/migration/V5__market_intelligence.sql`: Script Flyway khởi tạo 4 bảng, indexes, constraints và seed dữ liệu ban đầu cho 4 chỉ số lớn (VNINDEX, HNX, VN30, UPCOM) và 8 cổ phiếu đầu ngành (FPT, VCB, HPG, SSI, MWG, TCB, MBB, VHM).
  - `backend/src/main/java/com/finman/entity/MarketIndex.java`: JPA Entity chỉ số thị trường.
  - `backend/src/main/java/com/finman/entity/StockSymbol.java`: JPA Entity mã cổ phiếu với giá lưu bằng `BIGINT` VND nguyên vẹn.
  - `backend/src/main/java/com/finman/entity/StockPriceHistory.java`: JPA Entity lịch sử giá EOD theo ngày.
  - `backend/src/main/java/com/finman/entity/UserWatchlist.java`: JPA Entity danh sách theo dõi cá nhân của người dùng.
  - `backend/src/main/java/com/finman/repository/MarketIndexRepository.java`
  - `backend/src/main/java/com/finman/repository/StockSymbolRepository.java`
  - `backend/src/main/java/com/finman/repository/StockPriceHistoryRepository.java`
  - `backend/src/main/java/com/finman/repository/UserWatchlistRepository.java`
  - `backend/src/test/java/com/finman/repository/MarketRepositoryTest.java`: 4 test cases kiểm thử toàn diện CRUD, constraints và tính toàn vẹn BIGINT VND (100% Passed).
- **DoD**: Migration thành công, lưu trữ số liệu giá cổ phiếu bằng `BIGINT` (VND nguyên vẹn).
- **Trạng thái**: `[COMPLETED]` (Đã hoàn thành 100%).

### Task 17.2: Market Data Connector Service (Chỉ Số & Giá EOD) [COMPLETED]
- **Mục tiêu**: Xây dựng service kết nối nhà cung cấp dữ liệu thị trường mở (Vietstock / SSI / TCBS / AlphaVantage) để cập nhật chỉ số VN-Index, HNX, VN30 và giá chốt phiên cuối ngày (EOD).
- **Files đã triển khai**:
  - `backend/src/main/java/com/finman/client/MarketApiClient.java`: Connector kết nối API ngoài kèm bộ sinh Fallback thông minh tự động khi mất kết nối.
  - `backend/src/main/java/com/finman/service/market/MarketDataService.java`: Service nghiệp vụ đồng bộ chỉ số thị trường, giá cổ phiếu niêm yết (VND nguyên vẹn) và chốt phiên EOD.
  - `backend/src/main/java/com/finman/scheduler/MarketDataScheduler.java`: Scheduler chạy định kỳ mỗi 15 phút trong phiên (09:00 - 15:00 Thứ 2 - Thứ 6) và chốt phiên EOD lúc 15:30 chiều mỗi ngày làm việc.
  - `backend/src/main/java/com/finman/dto/response/MarketIndexResponse.java`: DTO phản hồi chỉ số thị trường.
  - `backend/src/main/java/com/finman/dto/response/StockQuoteResponse.java`: DTO phản hồi báo giá cổ phiếu.
  - `backend/src/main/java/com/finman/dto/response/StockPriceHistoryResponse.java`: DTO phản hồi lịch sử giá EOD.
  - `backend/src/test/java/com/finman/service/market/MarketDataServiceTest.java`: 5 test cases kiểm thử đồng bộ chỉ số, giá cổ phiếu, chốt phiên EOD, nạp lịch sử và scheduler.
- **DoD**: Cập nhật định kỳ chỉ số mỗi 15 phút trong giờ giao dịch và nạp dữ liệu chốt phiên lúc 15:30 chiều mỗi ngày làm việc.
- **Trạng thái**: `[COMPLETED]` (Đã hoàn thành 100%).

### Task 17.3: Backend Stock Search, Details & Watchlist APIs [COMPLETED]
- **Mục tiêu**: Xây dựng các API `/api/v1/market/**` phục vụ xem bảng điểm chỉ số, tra cứu mã cổ phiếu, lịch sử giá và CRUD danh sách theo dõi cá nhân (Watchlist).
- **Files**:
  - `backend/src/main/java/com/finman/dto/request/WatchlistAddRequest.java`
  - `backend/src/main/java/com/finman/dto/request/WatchlistUpdateRequest.java`
  - `backend/src/main/java/com/finman/dto/response/UserWatchlistResponse.java`
  - `backend/src/main/java/com/finman/dto/response/StockDetailResponse.java`
  - `backend/src/main/java/com/finman/service/market/WatchlistService.java`
  - `backend/src/main/java/com/finman/controller/MarketController.java`
  - `backend/src/main/java/com/finman/config/SecurityConfig.java`
  - `backend/src/test/java/com/finman/controller/MarketControllerTest.java`
- **DoD**: Tốc độ phản hồi < 20ms đối với endpoint chỉ số nhờ cache in-memory TTL; kiểm soát quyền sở hữu chặt chẽ cho Watchlist; 7/7 test cases `MarketControllerTest` PASS 100%.
- **Trạng thái**: `[COMPLETED]` (Đã hoàn thành 100%).

### Task 17.4: Frontend Market Overview Dashboard & Biểu Đồ Chỉ Số [COMPLETED]
- **Mục tiêu**: Xây dựng màn hình Thị Trường (`/thi-truong`) gồm: bảng điểm 4 chỉ số lớn (VN-Index, VN30, HNX, UPCOM), biểu đồ biến động điểm số dạng SVG line chart tương tác thời gian thực, độ rộng thị trường (mã tăng/giảm/tham chiếu) và bảng giá cổ phiếu niêm yết đầy đủ bộ lọc, phân trang, bước giá VND.
- **Files**:
  - `frontend/src/types/market.ts`
  - `frontend/src/services/marketService.ts`
  - `frontend/src/components/market/IndexCard.tsx`
  - `frontend/src/components/market/IndexChart.tsx`
  - `frontend/src/components/market/StockQuoteTable.tsx`
  - `frontend/src/pages/market/MarketOverviewPage.tsx`
  - `frontend/src/components/layout/Sidebar.tsx`
  - `frontend/src/App.tsx`
- **DoD**: Giao diện sắc nét chuẩn Stitch Fintech Prestige, biểu đồ SVG mượt mà không phụ thuộc thư viện ngoài, cập nhật dữ liệu tự động và thủ công; `tsc -b && vite build` PASS 100%.
- **Trạng thái**: `[COMPLETED]` (Đã hoàn thành 100%).

### Task 17.5: Frontend Stock Watchlist & Stock-News Cross Linking [COMPLETED]
- **Mục tiêu**: Bổ sung bảng quản lý danh sách cổ phiếu theo dõi của người dùng (Watchlist). Khi click vào một mã cổ phiếu, hiển thị popup lịch sử giá 25-30 phiên (kèm biểu đồ khối lượng Volume bar) và danh sách các bài báo tài chính có nhắc đến mã đó (Cross-linking trực tiếp sang News Module).
- **Files**:
  - `frontend/src/components/market/WatchlistTable.tsx`
  - `frontend/src/components/market/StockDetailModal.tsx`
  - `frontend/src/pages/market/MarketOverviewPage.tsx`
- **DoD**: Thêm/xóa/cập nhật ghi chú và giá mục tiêu mã khỏi Watchlist tức thì với optimistic update, liên kết thông suốt sang phân hệ tin tức, kiểm tra build TypeScript & Vite PASS 100%.
- **Trạng thái**: `[COMPLETED]` (Đã hoàn thành 100%).

---

## Phase 18: Module 5 — FinMan Daily Intelligence (Bản Tin Sáng & Tối Ưu) [IN PROGRESS]

### Task 18.1: Daily Digest Background Compilation Scheduler [COMPLETED]
- **Mục tiêu**: Xây dựng cron job chạy lúc 06:30 sáng hàng ngày: tự động tổng hợp top 5 tin tức quan trọng nhất, diễn biến thị trường hôm trước và gọi Gemini sinh ra 1 đoạn nhận định vĩ mô ngắn gọn.
- **Files đã triển khai**:
  - `backend/src/main/resources/db/migration/V6__daily_intelligence.sql`: Script Flyway khởi tạo bảng `daily_digests` kèm indexes tối ưu.
  - `backend/src/main/resources/prompts/daily-macro-digest.txt`: Prompt template định hướng Gemini phân tích tổng hợp vĩ mô, 3 takeaways và 3 câu hỏi gợi ý nhanh.
  - `backend/src/main/java/com/finman/entity/DailyDigest.java`: JPA Entity lưu trữ bản tin ngày.
  - `backend/src/main/java/com/finman/repository/DailyDigestRepository.java`: Repository tra cứu bản tin theo ngày và bản tin mới nhất.
  - `backend/src/main/java/com/finman/dto/response/MarketPulseItemDto.java`
  - `backend/src/main/java/com/finman/dto/response/HeadlineItemDto.java`
  - `backend/src/main/java/com/finman/dto/response/DailyDigestResponse.java`
  - `backend/src/main/java/com/finman/service/intelligence/DailyIntelligenceService.java`: Service nghiệp vụ thu thập dữ liệu chỉ số thị trường, top 5 tin tức, gọi Gemini API phân tích và tích hợp bộ Fallback tổng hợp quy tắc vĩ mô khi mất kết nối AI.
  - `backend/src/main/java/com/finman/scheduler/DailyDigestScheduler.java`: Cron job chạy lúc 06:30 AM mỗi ngày và tự động chuẩn bị bản tin ngay khi ứng dụng khởi động.
  - `backend/src/test/java/com/finman/service/intelligence/DailyIntelligenceServiceTest.java`: 4 test cases kiểm thử tổng hợp AI, Fallback, tính Idempotent và chuyển đổi DTO.
  - `backend/src/test/java/com/finman/scheduler/DailyDigestSchedulerTest.java`: 2 test cases kiểm thử scheduler định kỳ và kích hoạt thủ công.
- **DoD**: Bản tin tổng hợp được chuẩn bị sẵn trong cache/DB lúc 06:31 sáng, sẵn sàng phục vụ người dùng mở app. 6/6 test cases đạt chuẩn PASS 100% (`BUILD SUCCESS`).
- **Trạng thái**: `[COMPLETED]` (Đã hoàn thành 100%).

### Task 18.2: Backend Daily Intelligence Aggregator API [COMPLETED]
- **Mục tiêu**: API `GET /api/v1/daily-intelligence/today` trả về gói dữ liệu tổng hợp: Market Pulse, Top Headlines, AI Macro Summary và Góc cảnh báo ngân sách cá nhân hóa dựa trên ngày trong tháng của user đang đăng nhập.
- **Files đã triển khai**:
  - `backend/src/main/java/com/finman/dto/response/PersonalFinancialAlertDto.java`: DTO phản hồi góc cảnh báo ngân sách cá nhân hóa (`dayOfMonth`, `monthProgressPercent`, `totalBudget`, `totalSpent`, `spentPercentage`, `alertLevel`: SAFE/WARNING/DANGER/INFO).
  - `backend/src/main/java/com/finman/dto/response/DailyIntelligenceResponse.java`: DTO tổng hợp toàn diện gói dữ liệu bản tin sáng.
  - `backend/src/main/java/com/finman/service/intelligence/DailyIntelligenceService.java`: Bổ sung tích hợp `BudgetService` và phương thức `getAggregatedDailyIntelligence(date, userId)` tính toán đối chiếu tốc độ chi tiêu với ngày trong tháng (Scenario AC-16).
  - `backend/src/main/java/com/finman/controller/DailyIntelligenceController.java`: REST Controller cung cấp `GET /today`, `GET /date/{date}`, `POST /recompile`.
  - `backend/src/main/java/com/finman/config/SecurityConfig.java`: Cấu hình cấp quyền truy cập an toàn cho endpoint `/api/v1/daily-intelligence/**`.
  - `backend/src/test/java/com/finman/controller/DailyIntelligenceControllerTest.java`: 3/3 test cases MockMvc kiểm thử HTTP endpoints, status codes và format JSON (100% Passed).
  - `backend/src/test/java/com/finman/service/intelligence/DailyIntelligenceServiceTest.java`: 7/7 test cases kiểm thử tổng hợp và tính toán cảnh báo ngân sách theo tiến độ tháng.
- **DoD**: Thời gian phản hồi < 50ms nhờ dữ liệu đã được tính toán sẵn. 12/12 unit & integration tests đạt chuẩn PASS 100% (`BUILD SUCCESS`).
- **Trạng thái**: `[COMPLETED]` (Đã hoàn thành 100%).

### Task 18.3: Frontend Daily Intelligence Hub (Executive Morning Brief) [COMPLETED]
- **Mục tiêu**: Xây dựng màn hình Bản Tin Hằng Ngày (`/ban-tin-hang-ngay`) với phong cách tạp chí tài chính cao cấp: thẻ tóm tắt thị trường, top 5 tin nổi bật và thông điệp cố vấn tài chính cá nhân.
- **Files đã triển khai**:
  - `frontend/src/types/intelligence.ts`: Interface định nghĩa DTOs cho Market Pulse, Headlines, Personal Financial Alert, Daily Intelligence data.
  - `frontend/src/services/dailyIntelligenceService.ts`: Service API giao tiếp endpoints `/api/v1/daily-intelligence/**` kèm fallback offline đầy đủ.
  - `frontend/src/components/intelligence/MarketPulseCard.tsx`: Thẻ tổng quan 4 chỉ số lớn với điểm số, % tăng giảm, khối lượng và liên kết nhanh tới bảng thị trường.
  - `frontend/src/components/intelligence/PersonalAlertCard.tsx`: Thanh tiến độ so sánh đối chiếu thời gian trong tháng vs % ngân sách đã chi tiêu kèm khuyến nghị hành động thông minh.
  - `frontend/src/components/intelligence/TopHeadlinesList.tsx`: Danh sách 5 bài báo tài chính hàng đầu kèm 3 ý tóm tắt Gemini AI, phân tích tác động và mã cổ phiếu liên quan.
  - `frontend/src/pages/intelligence/DailyIntelligencePage.tsx`: Trang chủ Bản Tin Sáng tích hợp bộ chọn ngày, thẻ vĩ mô Gemini, 3 ý chính và thanh prompt chips dẫn sang Trợ lý AI.
  - `frontend/src/components/layout/Sidebar.tsx`: Bổ sung mục điều hướng "Bản tin sáng" với icon `auto_awesome`.
  - `frontend/src/App.tsx`: Đăng ký route `ban-tin-hang-ngay` và liên kết thông suốt sang các phân hệ Tin tức, Thị trường, Ngân sách và Trợ lý FinMan AI.
- **DoD**: Hiển thị ấn tượng trên cả máy tính và điện thoại di động, đem lại thói quen đọc tin sáng cho người dùng; `npm run build` PASS 100%.
- **Trạng thái**: `[COMPLETED]` (Đã hoàn thành 100%).

### Task 18.4: Interactive Follow-up Q&A Bridge to AI Assistant [PLANNED]
- **Mục tiêu**: Bên dưới mỗi thẻ tin tức hoặc nhận định vĩ mô trên bản tin, tạo các nút câu hỏi gợi ý nhanh (ví dụ: *"Sự kiện này tác động thế nào đến tài khoản của tôi?"*). Khi người dùng click, hệ thống tự động chuyển sang `AIAssistantPage` và bắt đầu phiên hội thoại với ngữ cảnh đã nạp sẵn.
- **Files dự kiến**:
  - `frontend/src/components/intelligence/FollowUpPromptChips.tsx`
  - `frontend/src/pages/intelligence/DailyIntelligencePage.tsx`
- **DoD**: Chuyển đổi ngữ cảnh liền mạch giữa Bản tin và Trợ lý AI, không bị mất dữ liệu phiên.
- **Trạng thái**: `[PLANNED]` (Chưa triển khai).


