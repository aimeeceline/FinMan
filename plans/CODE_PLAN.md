# CODE_PLAN — FinMan Implementation Roadmap
## Kế Hoạch Triển Khai Kỹ Thuật Toàn Diện (Fullstack: Spring Boot + Frontend Stitch UI + Gemini AI)

Tài liệu này xác định thứ tự lập trình chi tiết cho dự án FinMan theo mô hình **Fullstack Monorepo**:
- **`backend/`**: Java Spring Boot 3.x (REST API, JPA, Spring Security 6, JWT, Gemini API, Apache POI).
- **`frontend/`**: React / Vite + Tailwind CSS (Được bóc tách và tích hợp trực tiếp từ mã nguồn giao diện Stitch trong thư mục `design/`).
- **`design/`**: Bộ thiết kế UI gốc từ Stitch với 15 màn hình chuẩn hóa (`code.html` & `screen.png`).

---

# Bảng Ánh Xạ Thư Mục Giao Diện Stitch (`design/`) Với Kế Hoạch Lập Trình

> [!IMPORTANT]
> **Quy tắc bất biến cho Agent**: Trước khi code bất kỳ màn hình nào ở Frontend, Agent **bắt buộc phải đọc file `code.html` và ảnh `screen.png`** trong thư mục `design/` tương ứng để tái sử dụng chính xác cấu trúc HTML, các class Tailwind CSS, inline icons (Material Symbols) và layout.

| Thư mục Stitch (`design/`) | Tên màn hình / Tài nguyên | Phase & Task triển khai |
|---|---|---|
| [`design/00_branding_logo`](file:///d:/FinMan/design/00_branding_logo) | Logo FM 3D huy hiệu vàng kim loại | **Task 0.4**: Lưu vào `frontend/public/logo-fm.png` |
| [`design/14_design_system_reference`](file:///d:/FinMan/design/14_design_system_reference) | Toàn bộ Design Tokens (Màu sắc, Font, Spacing) | **Task 0.4**: Cấu hình `tailwind.config.js` |
| [`design/01_splash_screen`](file:///d:/FinMan/design/01_splash_screen) | Màn hình khởi động (Splash Screen) | **Task 2.3**: `SplashScreen.tsx` |
| [`design/02_login`](file:///d:/FinMan/design/02_login) | Màn hình Đăng nhập (Login) | **Task 2.3**: `LoginPage.tsx` |
| [`design/03_register`](file:///d:/FinMan/design/03_register) | Màn hình Đăng ký (Register) | **Task 2.3**: `RegisterPage.tsx` |
| [`design/04_forgot_password`](file:///d:/FinMan/design/04_forgot_password) | Màn hình Quên mật khẩu | **Task 2.3**: `ForgotPasswordModal.tsx` |
| [`design/05_google_login`](file:///d:/FinMan/design/05_google_login) | Chọn tài khoản Google Auth | **Task 2.3**: `GoogleAuthModal.tsx` |
| [`design/10_accounts`](file:///d:/FinMan/design/10_accounts) | Màn hình Quản lý tài khoản (Ví & Thẻ) | **Task 3.2**: `AccountsPage.tsx` |
| [`design/06_transactions_home`](file:///d:/FinMan/design/06_transactions_home) | Màn hình Giao dịch chính (Home Dashboard) | **Task 4.2**: `TransactionsHomePage.tsx` |
| [`design/07_add_transaction`](file:///d:/FinMan/design/07_add_transaction) | Màn hình Thêm giao dịch (Thu/Chi) | **Task 4.3**: `AddTransactionModal.tsx` |
| [`design/08_calendar`](file:///d:/FinMan/design/08_calendar) | Màn hình Lịch giao dịch | **Task 4.4**: `CalendarPage.tsx` |
| [`design/11_budget`](file:///d:/FinMan/design/11_budget) | Màn hình Quản lý ngân sách | **Task 5.2**: `BudgetPage.tsx` |
| [`design/09_statistics`](file:///d:/FinMan/design/09_statistics) | Màn hình Thống kê & Biểu đồ chi tiêu | **Task 6.2**: `StatisticsPage.tsx` |
| [`design/12_ai_assistant`](file:///d:/FinMan/design/12_ai_assistant) | Màn hình Trợ lý AI (Quick Add tự nhiên) | **Task 7.3**: `AiAssistantModal.tsx` |
| [`design/13_more_settings`](file:///d:/FinMan/design/13_more_settings) | Màn hình Cài đặt, Hồ sơ & Đăng xuất | **Task 8.2**: `SettingsPage.tsx` |

---

# Bảng Tóm Tắt Các Phase (40 Tasks)

| Phase | Tên Phase | Số lượng Tasks | Phụ thuộc |
|---|---|---|---|
| **Phase 0** | Khởi tạo dự án Monorepo, Backend Spring Boot & Frontend Stitch Design Tokens | 5 tasks | Không |
| **Phase 1** | Database Models, Repositories & Data Seeder | 4 tasks | Phase 0 |
| **Phase 2** | Authentication Fullstack (Spring Security + Frontend Auth Screens) | 5 tasks | Phase 1 |
| **Phase 3** | Financial Accounts & Categories Fullstack (APIs + Stitch Accounts Screen) | 4 tasks | Phase 2 |
| **Phase 4** | Core Transaction Engine Fullstack (APIs + Stitch Home, Add Txn & Calendar) | 6 tasks | Phase 3 |
| **Phase 5** | Budgeting System Fullstack (APIs + Stitch Budget Screen) | 4 tasks | Phase 4 |
| **Phase 6** | Statistics & Data Export Fullstack (APIs + Stitch Stats Screen + Excel) | 4 tasks | Phase 4 |
| **Phase 7** | Google Gemini AI Fullstack (APIs + Stitch AI Assistant Screen) | 4 tasks | Phase 4 |
| **Phase 8** | Settings, Profile & App Polish (APIs + Stitch Settings Screen + PWA) | 4 tasks | Phase 2 - 7 |
| **Phase 9** | Comprehensive Testing, Security Audit & Docker Deployment | 3 tasks | Phase 1 - 8 |

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

### Task 0.3: Khởi tạo Frontend Project (`frontend/`)
- **Mục tiêu**: Tạo dự án Frontend React + Vite + TypeScript trong thư mục `frontend/`, cài đặt Tailwind CSS, Lucide Icons, Axios.
- **Files**: `frontend/package.json`, `frontend/vite.config.ts`, `frontend/index.html`.
- **DoD**: Lệnh `npm run dev` khởi chạy thành công ứng dụng Frontend cục bộ.

### Task 0.4: Nhúng Design System & Logo Từ Stitch Vào Frontend
- **Mục tiêu**:
  - **Đọc tài liệu**: Đọc file [design/14_design_system_reference/code.html](file:///d:/FinMan/design/14_design_system_reference/code.html) và [design/06_transactions_home/code.html](file:///d:/FinMan/design/06_transactions_home/code.html).
  - Trích xuất toàn bộ bảng màu Stitch (`surface`, `surface-container`, `primary`, `secondary`, `tertiary`, `outline`...) vào file `frontend/tailwind.config.js`.
  - Cấu hình font chữ `Plus Jakarta Sans` và font biểu tượng `Material Symbols Outlined` trong `frontend/index.html`.
  - Copy ảnh Logo FM 3D kim loại từ [design/00_branding_logo/screen.png](file:///d:/FinMan/design/00_branding_logo/screen.png) vào `frontend/public/logo-fm.png`.
- **Files**: `frontend/tailwind.config.js`, `frontend/src/index.css`, `frontend/public/logo-fm.png`.
- **DoD**: Toàn bộ hệ màu và typography của Stitch được nhận diện chính xác trong ứng dụng Frontend.

### Task 0.5: Xây dựng Global Exception Handler & ApiResponse Standard (Backend)
- **Mục tiêu**: Chuẩn hóa định dạng JSON phản hồi `ApiResponse<T>` và bắt các lỗi validation, business error.
- **Files**: `backend/src/main/java/com/finman/dto/response/ApiResponse.java`, `exception/GlobalExceptionHandler.java`.
- **DoD**: Khi ném Exception, API trả về JSON chuẩn kèm message tiếng Việt rõ ràng.

---

## Phase 1: Database Models, Repositories & Data Seeder

### Task 1.1: Tạo 5 Thực Thể Entity Cốt Lõi (JPA)
- **Mục tiêu**: Xây dựng 5 entity JPA theo đúng thiết kế ERD trong `ARCHITECTURE.md`:
  - `User.java`: `id`, `email`, `passwordHash`, `fullName`, `avatarUrl`, `createdAt`, `updatedAt`.
  - `Account.java`: `id`, `user`, `name`, `type` (`CASH`, `BANK`, `CREDIT_CARD`), `initialBalance`, `currentBalance`, `creditLimit`, `isArchived`.
  - `Category.java`: `id`, `user`, `name`, `type` (`INCOME`, `EXPENSE`), `icon`, `isDefault`.
  - `Transaction.java`: `id`, `user`, `account`, `category`, `type` (`INCOME`, `EXPENSE`), `amount` (Long), `transactionDate`, `note`.
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

### Task 2.3: Frontend Auth Screens (Bóc tách từ Stitch)
- **Mục tiêu**:
  - **Đọc trực tiếp từ Stitch**:
    - [design/01_splash_screen/code.html](file:///d:/FinMan/design/01_splash_screen/code.html) → Tạo `frontend/src/pages/auth/SplashScreen.tsx`.
    - [design/02_login/code.html](file:///d:/FinMan/design/02_login/code.html) → Tạo `frontend/src/pages/auth/LoginPage.tsx`.
    - [design/03_register/code.html](file:///d:/FinMan/design/03_register/code.html) → Tạo `frontend/src/pages/auth/RegisterPage.tsx`.
    - [design/04_forgot_password/code.html](file:///d:/FinMan/design/04_forgot_password/code.html) → Tạo `frontend/src/pages/auth/ForgotPasswordModal.tsx`.
    - [design/05_google_login/code.html](file:///d:/FinMan/design/05_google_login/code.html) → Tạo `frontend/src/pages/auth/GoogleAuthModal.tsx`.
  - Tái sử dụng trọn vẹn HTML cấu trúc form, input có icon Material Symbols, nút ẩn/hiện mật khẩu, checkbox "Ghi nhớ", và Logo FM.
- **Files**: `frontend/src/pages/auth/*`.
- **DoD**: Các màn hình Auth hiển thị giống 100% so với ảnh `screen.png` trong từng thư mục Stitch tương ứng.

### Task 2.4: Kết Nối Frontend Auth Với Backend API
- **Mục tiêu**: Gửi request đăng nhập/đăng ký từ form Frontend tới Spring Boot backend, lưu token vào `localStorage`, chuyển hướng tới Dashboard sau khi đăng nhập thành công.
- **Files**: `frontend/src/services/authService.ts`, `frontend/src/context/AuthContext.tsx`.
- **DoD**: Đăng ký và đăng nhập mượt mà trên giao diện Web, lưu token an toàn.

### Task 2.5: Unit Test Cho Luồng Xác Thực
- **Mục tiêu**: Viết Unit Test cho `AuthService` (Backend) và kiểm tra validate form Auth (Frontend).
- **Files**: `backend/src/test/java/com/finman/service/AuthServiceTest.java`.
- **DoD**: Test cases `TC_AUTH_01` đến `TC_AUTH_07` đạt PASS 100%.

---

## Phase 3: Financial Accounts & Categories Fullstack

### Task 3.1: Backend Accounts & Categories APIs
- **Mục tiêu**:
  - CRUD Accounts: `GET /api/v1/accounts` (tính Net Worth = Assets - Liabilities), `POST`, `PUT`, `DELETE` (chuyển `isArchived = true`).
  - Categories: `GET /api/v1/categories`, `POST`, `DELETE`.
- **Files**: `backend/src/main/java/com/finman/service/AccountService.java`, `controller/AccountController.java`, `service/CategoryService.java`.
- **DoD**: Trả về danh sách ví kèm số dư và tính đúng Net Worth.

### Task 3.2: Frontend Accounts Screen (Bóc tách từ Stitch)
- **Mục tiêu**:
  - **Đọc trực tiếp từ Stitch**: [design/10_accounts/code.html](file:///d:/FinMan/design/10_accounts/code.html).
  - Tạo `frontend/src/pages/accounts/AccountsPage.tsx`.
  - Tái sử dụng: Card tổng hợp tài sản ròng Net Worth (Tài sản, Khoản nợ, Cộng), thẻ Ví tiền mặt, thẻ Ngân hàng, thẻ Thẻ tín dụng (Dư nợ, Hạn mức), và modal thêm tài khoản mới.
- **Files**: `frontend/src/pages/accounts/AccountsPage.tsx`, `frontend/src/components/accounts/*`.
- **DoD**: Giao diện hiển thị đúng layout sang trọng của Stitch, có nút thêm ví tiện lợi.

### Task 3.3: Kết Nối Frontend Accounts Với Backend API
- **Mục tiêu**: Tải danh sách ví thực tế từ `/api/v1/accounts`, xử lý form tạo ví mới và cập nhật trạng thái số dư theo thời gian thực.
- **Files**: `frontend/src/services/accountService.ts`.
- **DoD**: Người dùng tạo ví mới trên giao diện, ví hiển thị ngay lập tức và số dư tổng cập nhật chuẩn xác.

### Task 3.4: Tests Cho Accounts & Net Worth
- **Mục tiêu**: Kiểm thử test cases `TC_ACC_01` đến `TC_ACC_05` (kiểm tra phân quyền multi-tenant, tính toán Net Worth).
- **DoD**: Toàn bộ test case module Account đạt PASS.

---

## Phase 4: Core Transaction Engine Fullstack (Home, Add Txn & Calendar)

### Task 4.1: Backend Transaction Service (`@Transactional`)
- **Mục tiêu**:
  - Triển khai logic ghi nhận giao dịch: `INCOME` (+ balance ví), `EXPENSE` (- balance ví).
  - Chỉnh sửa & Xóa giao dịch: Hoàn tác tác động cũ, áp dụng tác động mới chuẩn xác.
  - Lọc giao dịch theo tháng (`month=YYYY-MM`), khoảng ngày, tài khoản, danh mục, từ khóa.
- **Files**: `backend/src/main/java/com/finman/service/TransactionService.java`, `controller/TransactionController.java`.
- **DoD**: Đảm bảo tính toán số dư chính xác từng đồng VNĐ, có rollback khi lỗi.

### Task 4.2: Frontend Transactions Home Dashboard (Bóc tách từ Stitch)
- **Mục tiêu**:
  - **Đọc trực tiếp từ Stitch**: [design/06_transactions_home/code.html](file:///d:/FinMan/design/06_transactions_home/code.html).
  - Tạo `frontend/src/pages/transactions/TransactionsHomePage.tsx`.
  - Tái sử dụng:
    - Interactive Top Action & Month Picker Row (Chọn tháng 8, 9, 10...)
    - Hero Financial Summary Card (Tổng số dư khả dụng, nút ẩn/hiện con mắt, thẻ Thu nhập xanh, thẻ Chi tiêu đỏ/cam)
    - Danh sách giao dịch nhóm theo ngày (16 Thứ 4: Áo quần, Tiền lương, có icon tròn, số tiền màu xanh/cam)
    - Bottom Navigation Bar (Giao dịch, Thống kê, Tài khoản, Hơn)
    - Nút Floating Action Button (+) thêm giao dịch.
- **Files**: `frontend/src/pages/transactions/TransactionsHomePage.tsx`, `frontend/src/components/navigation/BottomNav.tsx`.
- **DoD**: Màn hình Home hiển thị chuẩn xác từng pixel theo Stitch design.

### Task 4.3: Frontend Add Transaction Screen (Bóc tách từ Stitch)
- **Mục tiêu**:
  - **Đọc trực tiếp từ Stitch**: [design/07_add_transaction/code.html](file:///d:/FinMan/design/07_add_transaction/code.html).
  - Tạo `frontend/src/pages/transactions/AddTransactionModal.tsx`.
  - Tái sử dụng:
    - Tab chuyển đổi: **Thu nhập** | **Chi tiêu** (Bỏ hoàn toàn tab chuyển khoản)
    - Numpad / Bàn phím số nhập tiền nhanh hiển thị số to (ví dụ: `1.000.000₫`)
    - Bộ chọn danh mục (Ăn uống, Giải trí, Áo quần...) với icon tương ứng
    - Bộ chọn tài khoản ví (Tiền mặt, Ngân hàng...)
    - Chọn ngày và ô nhập ghi chú.
- **Files**: `frontend/src/pages/transactions/AddTransactionModal.tsx`.
- **DoD**: Modal thêm giao dịch hoạt động mượt mà, đổi màu chủ đạo khi chuyển giữa Thu và Chi.

### Task 4.4: Frontend Calendar Screen (Bóc tách từ Stitch)
- **Mục tiêu**:
  - **Đọc trực tiếp từ Stitch**: [design/08_calendar/code.html](file:///d:/FinMan/design/08_calendar/code.html).
  - Tạo `frontend/src/pages/transactions/CalendarPage.tsx`.
  - Hiển thị lịch tháng với số tiền thu/chi vắn tắt dưới mỗi ô ngày, bấm vào ngày nào hiển thị danh sách giao dịch ngày đó.
- **Files**: `frontend/src/pages/transactions/CalendarPage.tsx`.
- **DoD**: Người dùng dễ dàng theo dõi dòng tiền trực quan theo ngày trên lịch.

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
  - **Đọc trực tiếp từ Stitch**: [design/11_budget/code.html](file:///d:/FinMan/design/11_budget/code.html).
  - Tạo `frontend/src/pages/budget/BudgetPage.tsx`.
  - Tái sử dụng:
    - Header chọn tháng ngân sách
    - Card tổng quan ngân sách tháng (Tổng ngân sách, Đã chi, Còn lại)
    - Danh sách các danh mục có thanh tiến độ (Progress bar) đổi màu Xanh (<80%), Vàng (80-100%), Đỏ (>100%)
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

## Phase 6: Statistics & Data Export Fullstack

### Task 6.1: Backend Aggregation & Apache POI Excel Export
- **Mục tiêu**: Viết query tổng hợp số liệu thu/chi theo danh mục và service xuất file `.xlsx` lịch sử giao dịch.
- **Files**: `backend/src/main/java/com/finman/service/ExportService.java`, `controller/ExportController.java`.
- **DoD**: Endpoint `/api/v1/export/excel` stream file Excel chuẩn về client.

### Task 6.2: Frontend Statistics Screen (Bóc tách từ Stitch)
- **Mục tiêu**:
  - **Đọc trực tiếp từ Stitch**: [design/09_statistics/code.html](file:///d:/FinMan/design/09_statistics/code.html).
  - Tạo `frontend/src/pages/statistics/StatisticsPage.tsx`.
  - Tái sử dụng:
    - Tab lọc thời gian: Tuần, Tháng, Hàng năm, Tùy chọn (Period)
    - Biểu đồ tròn (Pie chart) chi tiêu theo danh mục (tỷ lệ % và số tiền)
    - Danh sách tỷ trọng chi tiêu (Áo quần 91.7%, Ăn uống...) kèm thanh màu sắc tương ứng
    - Nút tải file Excel xuất báo cáo.
- **Files**: `frontend/src/pages/statistics/StatisticsPage.tsx`.
- **DoD**: Biểu đồ hiển thị sắc nét, đồng bộ màu sắc với thiết kế Stitch.

### Task 6.3: Kết Nối Frontend Statistics & Tải File Excel
- **Mục tiêu**: Gọi API thống kê đổ dữ liệu vào biểu đồ và kích hoạt tải file `.xlsx` trực tiếp về trình duyệt khi bấm nút Xuất.
- **Files**: `frontend/src/services/statisticsService.ts`.
- **DoD**: Tải về file Excel mở được trên máy tính với dữ liệu tiếng Việt chuẩn Unicode.

### Task 6.4: Tests Cho Statistics & Export
- **Mục tiêu**: Kiểm thử test cases `TC_EXP_01`, `TC_EXP_02`.
- **DoD**: File Excel xuất ra nguyên vẹn, số liệu khớp hoàn toàn với cơ sở dữ liệu.

---

## Phase 7: Google Gemini AI Fullstack (APIs + Stitch AI Assistant Screen)

### Task 7.1: Backend Gemini AI Client & Structured Prompt Engine
- **Mục tiêu**: Cấu hình Spring REST Client gọi Gemini API (`gemini-2.0-flash`) với prompt bóc tách tiếng Việt ra JSON chuẩn.
- **Files**: `backend/src/main/java/com/finman/config/GeminiConfig.java`, `service/AiService.java`.
- **DoD**: Bóc tách chính xác câu `"Ăn bún bò 45k tiền mặt"` thành JSON giao dịch.

### Task 7.2: Backend Quick-Add & Spending Insights APIs
- **Mục tiêu**: Triển khai `/api/v1/ai/quick-add` và `/api/v1/ai/insights`. Xử lý fallback an toàn khi API AI lỗi.
- **Files**: `backend/src/main/java/com/finman/controller/AiController.java`.
- **DoD**: Trả về form đã điền sẵn cho Quick Add và nhận xét chi tiêu hữu ích bằng tiếng Việt.

### Task 7.3: Frontend AI Assistant Screen (Bóc tách từ Stitch)
- **Mục tiêu**:
  - **Đọc trực tiếp từ Stitch**: [design/12_ai_assistant/code.html](file:///d:/FinMan/design/12_ai_assistant/code.html).
  - Tạo `frontend/src/pages/ai/AiAssistantModal.tsx`.
  - Tái sử dụng:
    - Khung nhập lệnh AI thông minh với placeholder gợi ý câu nói
    - Bong bóng chat tư vấn tài chính thông minh
    - Card xem trước thông tin giao dịch mà AI bóc tách được trước khi lưu (Số tiền, Danh mục, Ví, Ngày).
- **Files**: `frontend/src/pages/ai/AiAssistantModal.tsx`.
- **DoD**: Trải nghiệm nhập liệu bằng AI trực quan, thân thiện, người dùng chỉ cần gõ 1 câu là xong.

### Task 7.4: Tests Cho Google Gemini AI
- **Mục tiêu**: Kiểm thử test cases `TC_AI_01` đến `TC_AI_06` (bao gồm câu có dấu, không dấu, câu rác và lỗi mạng).
- **DoD**: Tất cả các kịch bản AI đều được xử lý an toàn, đạt PASS.

---

## Phase 8: Settings, Profile & App Polish (APIs + Stitch Settings Screen + PWA)

### Task 8.1: Backend Profile & Settings APIs
- **Mục tiêu**: Cập nhật thông tin cá nhân (Họ tên, Mật khẩu), API đăng xuất.
- **Files**: `backend/src/main/java/com/finman/controller/UserController.java`.
- **DoD**: Đổi thông tin thành công, kiểm tra mật khẩu cũ trước khi đổi mật khẩu mới.

### Task 8.2: Frontend More & Settings Screen (Bóc tách từ Stitch)
- **Mục tiêu**:
  - **Đọc trực tiếp từ Stitch**: [design/13_more_settings/code.html](file:///d:/FinMan/design/13_more_settings/code.html).
  - Tạo `frontend/src/pages/settings/SettingsPage.tsx`.
  - Tái sử dụng:
    - Profile header (Avatar, Tên người dùng, Email)
    - Danh sách menu: Thông tin cá nhân, Quản lý tài khoản, Danh mục thu chi, Cài đặt thông báo, Xuất dữ liệu Excel, Đăng xuất
    - Modal xác nhận đăng xuất.
- **Files**: `frontend/src/pages/settings/SettingsPage.tsx`.
- **DoD**: Màn hình cài đặt hiển thị đầy đủ các tính năng hỗ trợ, đăng xuất chuyển hướng về Login.

### Task 8.3: Tinh Chỉnh Responsive Mobile/Desktop & PWA
- **Mục tiêu**: Đảm bảo giao diện hiển thị hoàn hảo trên màn hình điện thoại (mobile viewport fit) và căn giữa thanh lịch trên màn hình Desktop/Tablet (`max-w-[480px] mx-auto`). Cấu hình `manifest.json` để có thể cài đặt như app PWA trên điện thoại.
- **Files**: `frontend/public/manifest.json`, `frontend/src/index.css`.
- **DoD**: Ứng dụng hỗ trợ thao tác cảm ứng mượt mà, cài đặt được icon FinMan ra màn hình chính điện thoại.

### Task 8.4: Kiểm Tra Đối Chiếu Toàn Diện Với Ảnh Mockup Stitch
- **Mục tiêu**: So sánh từng màn hình đã code với ảnh `screen.png` trong tất cả các thư mục `design/01` đến `design/13`.
- **DoD**: Không có sự sai lệch về màu sắc thương hiệu, font chữ, icon hoặc khoảng cách (spacing).

---

## Phase 9: Comprehensive Testing, Security Audit & Docker Deployment

### Task 9.1: Chạy Toàn Bộ Test Suite (Backend & Frontend)
- **Mục tiêu**: Thực thi `mvn test` trên Backend và chạy test trên Frontend.
- **DoD**: 100% test cases đều PASS, không có regression bug.

### Task 9.2: Rà Soát Bảo Mật Đa Tầng (Multi-tenant & Injection Audit)
- **Mục tiêu**: Kiểm tra bảo đảm mọi query đều ràng buộc `user_id = currentUserId`, chống tấn công IDOR, XSS.
- **DoD**: Báo cáo kiểm thử bảo mật sạch sẽ, không có lỗ hổng rò rỉ dữ liệu chéo.

### Task 9.3: Docker Compose Production Hoàn Chỉnh
- **Mục tiêu**: Tạo Dockerfile đa tầng cho Spring Boot backend và Nginx cho Frontend, cấu hình `docker-compose.prod.yml` chạy đồng bộ PostgreSQL + Backend + Frontend.
- **Files**: `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.prod.yml`.
- **DoD**: Khởi chạy toàn bộ hệ thống bằng 1 lệnh duy nhất: `docker-compose -f docker-compose.prod.yml up -d`.
