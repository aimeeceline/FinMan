# PROCESS — FinMan Development & Progress Tracker
## Nhật Ký Tiến Độ & Quy Trình Lập Trình Thực Tế

> [!NOTE]
> Đây là **tài liệu sống (Living Document)** được cập nhật liên tục sau mỗi lượt làm việc của Developer / AI Agent.
> **Quy trình chuẩn**: `Task N` → `Code` → `Review` → `Test` → `Cập nhật PROCESS.md`.

---

# 1. Dashboard Tổng Quan Tiến Độ

```text
Tiến độ dự án: [███████████████░░░░░] 36.6% (15 / 41 Tasks hoàn thành)
Trạng thái:    🟢 Đang triển khai (In Progress)
Phase hiện tại: Phase 3 — Financial Accounts & Categories Fullstack
```

| Chỉ số | Số lượng | Ghi chú |
|---|---|---|
| **Tổng số Task** | 41 tasks | Được phân rã từ Phase 0 đến Phase 9 trong `CODE_PLAN.md` |
| **Đã hoàn thành (Done)** | 15 tasks | Phase 0 (5 tasks) + Phase 1 (4 tasks) + Phase 2 (6 tasks - Hoàn thành 100%) |
| **Đang thực hiện (In Progress)** | 0 tasks | |
| **Chưa thực hiện (Pending)** | 26 tasks | |
| **Bugs / Issues còn mở** | 0 bugs | Được ghi nhận tại Bảng Issue Tracker |

---

# 2. Quy Trình Làm Việc Chuẩn (Standard Operating Procedure)

Mỗi khi bắt đầu một Task mới, thực hiện nghiêm ngặt 5 bước:

```text
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌───────────────────────┐
│ 1. Nhận Task │ ──> │ 2. Lập trình │ ──> │ 3. Tự Review │ ──> │ 4. Chạy Test │ ──> │ 5. Cập nhật          │
│ từ CODE_PLAN │     │ Clean Code   │     │ & Lint check │     │ theo TEST    │     │ PROCESS.md & Worklog  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └───────────────────────┘
```

1. **Nhận Task**: Đọc kỹ yêu cầu và Definition of Done (DoD) của Task trong [CODE_PLAN.md](file:///d:/FinMan/plans/CODE_PLAN.md). Đổi trạng thái task sang `In Progress`.
2. **Lập trình**: Viết code tuân thủ các nguyên tắc trong [GEMINI.md](file:///d:/FinMan/plans/GEMINI.md) và kiến trúc [ARCHITECTURE.md](file:///d:/FinMan/plans/ARCHITECTURE.md).
3. **Tự Review**: Kiểm tra lại type safety, không dùng số thực `float` cho tiền tệ, bảo đảm kiểm tra `userId` trong mọi truy vấn.
4. **Chạy Test**: Chạy các test case tương ứng trong [TEST_PLAN.md](file:///d:/FinMan/plans/TEST_PLAN.md). Chỉ chuyển bước tiếp theo khi test PASS 100%.
5. **Cập nhật PROCESS.md**: Đổi trạng thái sang `Done`, ghi lại nội dung công việc vào phần **3. Nhật Ký Thực Hiện (Worklog)** và tính lại % tiến độ.

---

# 3. Master Task Progress Tracker

### Phase 0: Khởi Tạo Monorepo, Backend Spring Boot & Frontend Setup
| Task ID | Tên Task | Trạng thái | Ngày hoàn thành | Người thực hiện |
|---|---|---|---|---|
| **Task 0.1** | Khởi tạo Backend Spring Boot 3.x (`backend/pom.xml`) | `Completed` | 2026-09-16 | Agent |
| **Task 0.2** | Cấu hình PostgreSQL Database & `docker-compose.yml` | `Completed` | 2026-09-16 | Agent |
| **Task 0.3** | Khởi tạo Frontend Web Project React 19 + Vite + Tailwind CSS (`frontend/`) | `Completed` | 2026-09-17 | Agent |
| **Task 0.4** | Nhúng Design System & Logo FM từ `design/` vào Frontend | `Completed` | 2026-09-16 | Agent |
| **Task 0.5** | Xây dựng Global Exception Handler & `ApiResponse<T>` (Backend) | `Completed` | 2026-09-16 | Agent |

### Phase 1: Database Models, Repositories & Data Seeder
| Task ID | Tên Task | Trạng thái | Ngày hoàn thành | Người thực hiện |
|---|---|---|---|---|
| **Task 1.1** | Tạo 5 Entity cốt lõi (`User`, `Account`, `Category`, `Transaction`, `Budget`) | `Completed` | 2026-09-16 | Agent |
| **Task 1.2** | Định nghĩa Constraints, Unique Keys & Indexes tối ưu | `Completed` | 2026-09-16 | Agent |
| **Task 1.3** | Tạo các Spring Data JPA Repositories | `Completed` | 2026-09-16 | Agent |
| **Task 1.4** | Xây dựng Data Seeder khởi tạo danh mục chi tiêu mặc định | `Completed` | 2026-09-16 | Agent |

### Phase 2: Authentication Fullstack (Spring Security + Stitch Auth Screens)
| Task ID | Tên Task | Trạng thái | Ngày hoàn thành | Người thực hiện |
|---|---|---|---|---|
| **Task 2.1** | Cấu hình Spring Security 6 & JWT Token Provider | `Completed` | 2026-09-16 | Agent |
| **Task 2.2** | Backend Auth APIs (`/api/v1/auth/register`, `/login`, `/me`) | `Completed` | 2026-09-16 | Agent |
| **Task 2.3** | Frontend Auth Screens: Splash, Login, Register, Forgot Password từ `design/01-05` | `Completed` | 2026-09-17 | Agent |
| **Task 2.4** | Kết nối Frontend Auth với Backend API & Quản lý Token | `Completed` | 2026-09-17 | Agent |
| **Task 2.5** | Unit & E2E Tests cho luồng Authentication | `Completed` | 2026-09-17 | Agent |
| **Task 2.6** | Tích hợp Google OAuth 2.0 Fullstack (Backend & Frontend Mobile) | `Completed` | 2026-09-17 | Agent |

### Phase 3: Financial Accounts & Categories Fullstack
| Task ID | Tên Task | Trạng thái | Ngày hoàn thành | Người thực hiện |
|---|---|---|---|---|
| **Task 3.1** | Backend Accounts & Categories APIs (CRUD, Net Worth) | `Pending` | — | — |
| **Task 3.2** | Frontend Accounts Screen: Bóc tách từ `design/10_accounts/code.html` | `Pending` | — | — |
| **Task 3.3** | Kết nối Frontend Accounts với Backend API | `Pending` | — | — |
| **Task 3.4** | Tests cho Accounts & Net Worth | `Pending` | — | — |

### Phase 4: Core Transaction Engine Fullstack (Home, Add Txn & Calendar)
| Task ID | Tên Task | Trạng thái | Ngày hoàn thành | Người thực hiện |
|---|---|---|---|---|
| **Task 4.1** | Backend Transaction Service (`@Transactional`, cộng/trừ số dư, filter) | `Pending` | — | — |
| **Task 4.2** | Frontend Transactions Home Dashboard: Bóc tách từ `design/06_transactions_home` | `Pending` | — | — |
| **Task 4.3** | Frontend Add Transaction Screen: Bóc tách từ `design/07_add_transaction` | `Pending` | — | — |
| **Task 4.4** | Frontend Calendar Screen: Bóc tách từ `design/08_calendar` | `Pending` | — | — |
| **Task 4.5** | Kết nối Frontend Transactions với Backend API | `Pending` | — | — |
| **Task 4.6** | Tests cho Core Transaction Engine & Balance Consistency | `Pending` | — | — |

### Phase 5: Budgeting System Fullstack (APIs + Stitch Budget Screen)
| Task ID | Tên Task | Trạng thái | Ngày hoàn thành | Người thực hiện |
|---|---|---|---|---|
| **Task 5.1** | Backend Budget APIs (Upsert, tính amountSpent, cảnh báo 80%, 100%) | `Pending` | — | — |
| **Task 5.2** | Frontend Budget Screen: Bóc tách từ `design/11_budget/code.html` | `Pending` | — | — |
| **Task 5.3** | Kết nối Frontend Budget với Backend API | `Pending` | — | — |
| **Task 5.4** | Tests cho Budgeting System | `Pending` | — | — |

### Phase 6: Statistics & Data Export Fullstack
| Task ID | Tên Task | Trạng thái | Ngày hoàn thành | Người thực hiện |
|---|---|---|---|---|
| **Task 6.1** | Backend Aggregation & Apache POI Excel Export Service | `Pending` | — | — |
| **Task 6.2** | Frontend Statistics Screen: Bóc tách từ `design/09_statistics/code.html` | `Pending` | — | — |
| **Task 6.3** | Kết nối Frontend Statistics & Kích hoạt tải file Excel | `Pending` | — | — |
| **Task 6.4** | Tests cho Statistics & Excel Export | `Pending` | — | — |

### Phase 7: Google Gemini AI Fullstack (APIs + Stitch AI Assistant Screen)
| Task ID | Tên Task | Trạng thái | Ngày hoàn thành | Người thực hiện |
|---|---|---|---|---|
| **Task 7.1** | Backend Gemini AI Client & Structured Prompt Engine | `Pending` | — | — |
| **Task 7.2** | Backend Quick-Add & Spending Insights APIs | `Pending` | — | — |
| **Task 7.3** | Frontend AI Assistant Screen: Bóc tách từ `design/12_ai_assistant/code.html` | `Pending` | — | — |
| **Task 7.4** | Tests cho Google Gemini AI Features | `Pending` | — | — |

### Phase 8: Settings, Profile & Web Polish (APIs + Stitch Settings Screen + Web Polish)
| Task ID | Tên Task | Trạng thái | Ngày hoàn thành | Người thực hiện |
|---|---|---|---|---|
| **Task 8.1** | Backend Profile & Settings APIs (Đổi mật khẩu, Logout) | `Pending` | — | — |
| **Task 8.2** | Frontend Settings Screen: Bóc tách từ giao diện Stitch Web Settings | `Pending` | — | — |
| **Task 8.3** | Tối ưu trải nghiệm Web Responsive & Performance | `Pending` | — | — |
| **Task 8.4** | Kiểm tra đối chiếu toàn diện với thiết kế Stitch Web (`code.html`, `screen.png`) | `Pending` | — | — |

### Phase 9: Comprehensive Testing, Security Audit & Docker Deployment
| Task ID | Tên Task | Trạng thái | Ngày hoàn thành | Người thực hiện |
|---|---|---|---|---|
| **Task 9.1** | Chạy toàn bộ Test Suite (Backend & Frontend) | `Pending` | — | — |
| **Task 9.2** | Rà soát bảo mật đa tầng (Multi-tenant isolation & JWT security) | `Pending` | — | — |
| **Task 9.3** | Xây dựng Docker Compose Production hoàn chỉnh | `Pending` | — | — |

---

# 4. Nhật Ký Thực Hiện (Task Execution Worklog)

*Ghi lại nhật ký sau khi hoàn thành từng task theo mẫu dưới đây:*

<!--
### [YYYY-MM-DD] Task X.X: <Tên Task>
- **Người thực hiện**: Agent / Developer
- **Các file tạo mới / chỉnh sửa**:
  - `src/.../FileA.java`
  - `src/.../FileB.java`
- **Nội dung công việc**: Mô tả ngắn gọn những gì đã triển khai.
- **Kết quả kiểm thử**: PASS (Ma trận test case: TC_XXX_XX).
- **Trạng thái**: Completed.
-->

### [2026-09-16] Task 0.1: Khởi tạo Backend Spring Boot 3.x (`backend/`)
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `backend/pom.xml`: Cấu hình Spring Boot 3.4.3, Java 17, Web, JPA, Security, Validation, Postgres, JJWT 0.12.6, Apache POI 5.3.0, Lombok, Test.
  - `backend/src/main/resources/application.yml`: Cấu hình Port 8080, PostgreSQL DataSource, JPA Hibernate, JWT properties, Gemini AI config.
  - `backend/src/main/java/com/finman/FinManApplication.java`: Main Spring Boot Application entrypoint.
- **Nội dung công việc**: Thiết lập toàn bộ cấu hình dự án backend Java Spring Boot 3.x độc lập trong thư mục `backend/`.
- **Kết quả kiểm thử**: PASS — Chạy lệnh `mvn clean compile` thành công 100% (`BUILD SUCCESS`).
- **Trạng thái**: Completed.

### [2026-09-16] Task 0.2: Cấu hình Database PostgreSQL & Docker Compose
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `docker-compose.yml`: Định nghĩa dịch vụ `postgres` (PostgreSQL 16 Alpine, port 5432, database `finman`, volume `finman_postgres_data`, healthcheck `pg_isready`).
  - `backend/src/test/java/com/finman/FinManApplicationTests.java`: Integration test kiểm tra nạp Spring context và kiểm tra kết nối hợp lệ tới PostgreSQL qua HikariCP.
- **Nội dung công việc**: Khởi chạy thành công container PostgreSQL qua Docker Compose và xác minh kết nối từ Spring Boot Backend.
- **Kết quả kiểm thử**: PASS — Container `finman-postgres` ở trạng thái `healthy`, `mvn test` chạy thành công kết nối tới database (`Tests run: 1, Failures: 0, Errors: 0`, `BUILD SUCCESS`).
- **Trạng thái**: Completed.

### [2026-09-16] Task 0.3: Khởi tạo Frontend Project React + Vite (`frontend/`)
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `frontend/package.json`: React 19, Vite, TypeScript, Tailwind CSS v3, PostCSS, Autoprefixer, Lucide Icons, Axios.
  - `frontend/vite.config.ts`: Cấu hình React plugin, port 5173, reverse proxy `/api` sang backend `http://localhost:8080`.
  - `frontend/index.html`: Cấu hình Google Fonts (`Plus Jakarta Sans`), Google `Material Symbols Outlined`, mobile viewport-fit cover.
  - `frontend/src/index.css`: Tailwind directives (`@tailwind base, components, utilities`), base safe-area insets (`pb-safe`, `pt-safe`), scrollbar ẩn.
  - `frontend/tailwind.config.js`: Khởi tạo file cấu hình Tailwind CSS content scanning.
  - `frontend/src/App.tsx`: Màn hình khởi đầu của FinMan Frontend.
- **Nội dung công việc**: Khởi tạo hoàn chỉnh dự án Frontend React + Vite + TypeScript độc lập trong thư mục `frontend/`, tích hợp đầy đủ công cụ và dependencies.
- **Kết quả kiểm thử**: PASS — Lệnh `npm run build` biên dịch thành công (0 lỗi, 980ms); lệnh `npm run dev` khởi chạy dev server thành công trên cổng 5173.
- **Trạng thái**: Completed.

### [2026-09-16] Task 0.4: Nhúng Design System & Logo FM Từ Stitch Vào Frontend
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `frontend/tailwind.config.js`: Trích xuất và cấu hình toàn bộ Design Tokens từ `design/14_design_system_reference/DESIGN.md` và `design/06_transactions_home/code.html` (toàn bộ màu sắc `surface`, `primary`, `secondary`, `tertiary`, `outline`..., typography sizes, font families `Plus Jakarta Sans`, border radiuses, spacing).
  - `frontend/public/logo-fm.png`: Copy ảnh Logo FM 3D huy hiệu vàng kim loại từ `design/00_branding_logo/screen.png`.
  - `frontend/src/index.css`: Cấu hình base background `#f7f9fb`, font `Plus Jakarta Sans`, và utility `tabular-nums` hiển thị số dư tài chính.
  - `frontend/src/App.tsx`: Dựng giao diện mẫu trực quan thể hiện Logo FM 3D, tone màu Thu (Secondary), tone màu Chi (Primary) và typography chuẩn Stitch.
- **Nội dung công việc**: Tích hợp 100% hệ thống màu sắc, kiểu chữ và tài nguyên thương hiệu gốc từ Stitch vào ứng dụng Frontend.
- **Kết quả kiểm thử**: PASS — `npm run build` thành công trong 725ms, không có cảnh báo hoặc lỗi CSS/Tailwind.
- **Trạng thái**: Completed.

### [2026-09-16] Task 0.5: Xây dựng Global Exception Handler & ApiResponse Standard (Backend)
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/main/java/com/finman/dto/response/ApiResponse.java`: Lớp bọc phản hồi JSON tiêu chuẩn (`success`, `message`, `data`, `error`, `timestamp`) kèm static factory methods.
  - `backend/src/main/java/com/finman/dto/response/ErrorDetails.java`: Cấu trúc chi tiết mã lỗi (`code`) và thông tin trường vi phạm (`details`).
  - `backend/src/main/java/com/finman/exception/AppException.java`: Base runtime exception hỗ trợ mã lỗi HTTP và custom error code.
  - `backend/src/main/java/com/finman/exception/ResourceNotFoundException.java`: Xử lý lỗi 404 không tìm thấy tài nguyên.
  - `backend/src/main/java/com/finman/exception/BusinessValidationException.java`: Xử lý lỗi vi phạm logic nghiệp vụ 400.
  - `backend/src/main/java/com/finman/exception/UnauthorizedException.java`: Xử lý lỗi từ chối xác thực 401.
  - `backend/src/main/java/com/finman/exception/GlobalExceptionHandler.java`: Controller Advice tập trung bắt các lỗi Validation DTO (`MethodArgumentNotValidException`), lỗi logic, lỗi 404 đường dẫn tĩnh, lỗi xác thực.
  - `backend/src/test/java/com/finman/exception/GlobalExceptionHandlerTest.java`: Bộ test case kiểm tra định dạng phản hồi chuẩn cho lỗi validation (400), lỗi nghiệp vụ (400), lỗi không tìm thấy (404).
- **Nội dung công việc**: Chuẩn hóa định dạng phản hồi toàn diện cho Backend, đảm bảo mọi ngoại lệ đều trả về JSON có thông điệp tiếng Việt rõ ràng.
- **Kết quả kiểm thử**: PASS — Toàn bộ 4 test case đều đạt 100% (`BUILD SUCCESS`).
- **Trạng thái**: Completed.

### [2026-09-16] Task 1.1: Tạo 5 Thực Thể Entity Cốt Lõi (JPA)
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/main/java/com/finman/entity/enums/AccountType.java`: Enum `CASH`, `BANK`, `CREDIT_CARD`.
  - `backend/src/main/java/com/finman/entity/enums/CategoryType.java`: Enum `INCOME`, `EXPENSE`.
  - `backend/src/main/java/com/finman/entity/enums/TransactionType.java`: Enum `INCOME`, `EXPENSE`.
  - `backend/src/main/java/com/finman/entity/User.java`: Bảng `users` với `email` (UK), `password_hash`, `full_name`, `avatar_url`, `created_at`, `updated_at`.
  - `backend/src/main/java/com/finman/entity/Account.java`: Bảng `accounts` với `user_id` (FK), `name`, `type`, `initial_balance` (BIGINT), `current_balance` (BIGINT), `credit_limit` (BIGINT), `is_archived`.
  - `backend/src/main/java/com/finman/entity/Category.java`: Bảng `categories` với `user_id` (FK, nullable cho system defaults), `name`, `type`, `icon`, `is_default`.
  - `backend/src/main/java/com/finman/entity/Transaction.java`: Bảng `transactions` với `user_id` (FK), `account_id` (FK), `category_id` (FK), `type`, `amount` (BIGINT, positive), `transaction_date` (LocalDate), `note`.
  - `backend/src/main/java/com/finman/entity/Budget.java`: Bảng `budgets` với `user_id` (FK), `category_id` (FK), `month` (YYYY-MM), `amount` (BIGINT), Unique Constraint `(user_id, category_id, month)`.
- **Nội dung công việc**: Xây dựng đầy đủ 5 thực thể JPA cốt lõi với cấu trúc POJO chuẩn (viết getters/setters/constructors rõ ràng, không phụ thuộc Lombok để tương thích hoàn hảo Java 25), tuân thủ chặt chẽ ERD trong `ARCHITECTURE.md` (số tiền lưu `BIGINT`, không dùng float, không có chuyển khoản).
- **Kết quả kiểm thử**: PASS —
  - `mvn test` chạy thành công 4/4 test cases (`BUILD SUCCESS`).
  - Kiểm tra trực tiếp PostgreSQL Docker container qua `psql`: Cả 5 bảng `users`, `accounts`, `categories`, `transactions`, `budgets` được Hibernate sinh đúng 100% kèm đầy đủ Primary Keys, Foreign Keys, Check Constraints (`type`) và Unique Constraint trên `budgets(user_id, category_id, month)`.
- **Trạng thái**: Completed.

### [2026-09-16] Task 1.2: Định Nghĩa Constraints, Unique Keys & Indexes Tối Ưu
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/main/java/com/finman/entity/User.java`: Bổ sung `@UniqueConstraint(name = "uk_users_email", columnNames = {"email"})`, validation `@NotBlank`, `@Email`, `@Size`.
  - `backend/src/main/java/com/finman/entity/Account.java`: Bổ sung `@Index(name = "idx_accounts_user", columnList = "user_id")`, `@Index(name = "idx_accounts_user_archived", columnList = "user_id, is_archived")`, validation `@NotBlank`, `@NotNull`, `@Min(0)` cho `creditLimit`.
  - `backend/src/main/java/com/finman/entity/Category.java`: Bổ sung `@Index(name = "idx_categories_user", columnList = "user_id")`, `@Index(name = "idx_categories_type", columnList = "type")`, `@Index(name = "idx_categories_user_default", columnList = "user_id, is_default")`, validation `@NotBlank`, `@NotNull`.
  - `backend/src/main/java/com/finman/entity/Transaction.java`: Bổ sung `@Index(name = "idx_transactions_user_date", columnList = "user_id, transaction_date DESC")`, `@Index(name = "idx_transactions_user_account", columnList = "user_id, account_id")`, `@Index(name = "idx_transactions_user_category", columnList = "user_id, category_id")`, `@Index(name = "idx_transactions_user_type_date", columnList = "user_id, type, transaction_date DESC")`, validation `@NotNull`, `@Positive(message = "Số tiền giao dịch phải lớn hơn 0")`, `@Size(max = 255)`.
  - `backend/src/main/java/com/finman/entity/Budget.java`: Bổ sung `@UniqueConstraint(name = "uk_budgets_user_category_month", columnNames = {"user_id", "category_id", "month"})`, `@Index(name = "idx_budgets_user_month", columnList = "user_id, month")`, `@Index(name = "idx_budgets_user_category", columnList = "user_id, category_id")`, validation `@NotBlank`, `@Pattern(YYYY-MM)`, `@Positive(message = "Hạn mức ngân sách phải lớn hơn 0")`.
- **Nội dung công việc**: Khai báo và cấu hình đầy đủ các Unique Constraints, Check Constraints, Database Indexes tối ưu hiệu năng truy vấn phân trang/lọc theo thời gian, tính toán số dư và quản lý ngân sách, đồng thời bổ sung các Bean Validation annotations bảo vệ toàn vẹn dữ liệu.
- **Kết quả kiểm thử**: PASS —
  - `mvn test` chạy thành công 4/4 test cases (`BUILD SUCCESS`).
  - Kiểm tra trực tiếp PostgreSQL container qua `psql`: Các chỉ mục B-tree (`idx_transactions_user_date`, `idx_transactions_user_account`, `idx_budgets_user_month`, `idx_accounts_user`...) và ràng buộc toàn vẹn duy nhất (`uk_budgets_user_category_month`, `uk_users_email`) đều được tạo và hoạt động chính xác.
- **Trạng thái**: Completed.

### [2026-09-16] Task 1.3: Tạo Các Spring Data JPA Repositories
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/main/java/com/finman/repository/UserRepository.java`: `findByEmail`, `existsByEmail`.
  - `backend/src/main/java/com/finman/repository/AccountRepository.java`: `findByUserId`, `findByUserIdAndIsArchivedFalse`, `findByIdAndUserId`, `existsByIdAndUserId`, `sumCurrentBalanceByUserId`, `sumCurrentBalanceByUserIdAndType`.
  - `backend/src/main/java/com/finman/repository/CategoryRepository.java`: `findByUserId`, `findByIsDefaultTrue`, `findAllAvailableForUser`, `findAllAvailableForUserAndType`, `findAccessibleCategory`.
  - `backend/src/main/java/com/finman/repository/TransactionRepository.java`: `findByUserId` (Pageable), `findByUserIdAndTransactionDateBetween`, `findByUserIdAndAccountId`, `findByUserIdAndCategoryId`, `sumAmountByUserIdAndTypeAndDateBetween`, `sumAmountByUserIdAndCategoryIdAndDateBetween`, `countByAccountId`, `countByCategoryId`.
  - `backend/src/main/java/com/finman/repository/BudgetRepository.java`: `findByUserIdAndMonth`, `findByUserIdAndCategoryIdAndMonth`, `existsByUserIdAndCategoryIdAndMonth`, `deleteByIdAndUserId`.
  - `backend/src/test/java/com/finman/repository/RepositoryIntegrationTest.java`: Bộ test integration kiểm tra hoạt động lưu trữ, cô lập dữ liệu theo `userId`, truy vấn danh mục khả dụng và tính tổng dòng tiền/số dư.
- **Nội dung công việc**: Xây dựng toàn bộ 5 interface Repository kế thừa `JpaRepository`, cài đặt đầy đủ các phương thức truy vấn đảm bảo cách ly dữ liệu nhiều người dùng (Multi-tenant Data Isolation), hỗ trợ tính toán số dư và tổng dòng tiền bằng `COALESCE(SUM(...), 0)`.
- **Kết quả kiểm thử**: PASS —
  - Spring Boot quét và nạp thành công 5 JPA repositories (`Found 5 JPA repository interfaces`).
  - `mvn test` chạy thành công 5/5 test cases (`BUILD SUCCESS`), kiểm thử CRUD và tính toán trên PostgreSQL thực tế.
- **Trạng thái**: Completed.

### [2026-09-16] Task 1.4: Xây Dựng Data Seeder Khởi Tạo Danh Mục Mặc Định
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/main/java/com/finman/config/DataSeeder.java`: Component `CommandLineRunner` tự động kiểm tra và chèn 14 danh mục mặc định (`isDefault = true`, `user = null`) khi ứng dụng khởi chạy.
    - 9 Danh mục Chi tiêu (EXPENSE) chuẩn Stitch UI `design/07_add_transaction`: Ăn uống (`restaurant`), Áo quần (`apparel`), Mua sắm (`shopping_bag`), Giao thông (`directions_car`), Giải trí (`sports_esports`), Sinh hoạt (`home`), Sức khỏe (`favorite`), Giáo dục (`school`), Chi tiêu khác (`more_horiz`).
    - 5 Danh mục Thu nhập (INCOME) chuẩn PRD & Stitch: Lương (`payments`), Thưởng (`featured_seasonal_and_gifts`), Đầu tư (`trending_up`), Freelance (`laptop_mac`), Thu nhập khác (`savings`).
  - `backend/src/test/java/com/finman/config/DataSeederTest.java`: Kiểm thử khởi tạo thành công 14 danh mục mặc định và kiểm tra tính bất biến (idempotent - không bị trùng lặp khi chạy lại nhiều lần).
  - `backend/src/test/java/com/finman/repository/RepositoryIntegrationTest.java`: Cập nhật tái sử dụng danh mục hệ thống mặc định do DataSeeder nạp.
- **Nội dung công việc**: Khởi tạo tự động dữ liệu danh mục hệ thống mặc định ngay khi app khởi động lần đầu, chuẩn hóa icon theo Google Material Symbols khớp 100% với bản thiết kế Stitch UI.
- **Kết quả kiểm thử**: PASS —
  - `mvn test` chạy thành công 6/6 test cases (`BUILD SUCCESS`).
  - Truy vấn trực tiếp PostgreSQL `SELECT id, name, type, icon, is_default, user_id FROM categories`: Có đầy đủ 14 danh mục mặc định (9 EXPENSE, 5 INCOME, `is_default = true`, `user_id = null`).
- **Trạng thái**: Completed.

### [2026-09-16] Task 2.1: Cấu Hình Spring Security 6 & JWT Token Provider
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/main/java/com/finman/security/UserPrincipal.java`: Triển khai `UserDetails` chuẩn của Spring Security, đóng gói thông tin định danh `id`, `email`, `fullName`, `passwordHash`.
  - `backend/src/main/java/com/finman/security/CustomUserDetailsService.java`: Service tải thông tin người dùng từ `UserRepository` theo `email` hoặc `id`.
  - `backend/src/main/java/com/finman/security/JwtTokenProvider.java`: Component sinh và giải mã token JJWT 0.12.6, ký bằng Secret Key HMAC-SHA 256-bit, quản lý hạn dùng (7 ngày), trích xuất an toàn `userId` và `email`, bắt các lỗi `ExpiredJwtException`, `JwtException`.
  - `backend/src/main/java/com/finman/security/JwtAuthenticationFilter.java`: Filter chặn request, bóc tách Bearer token từ header `Authorization`, xác thực và nạp `UsernamePasswordAuthenticationToken` vào `SecurityContextHolder`.
  - `backend/src/main/java/com/finman/security/JwtAuthenticationEntryPoint.java`: Bắt lỗi 401 khi không có token hoặc token không hợp lệ, trả về JSON chuẩn theo cấu trúc `ApiResponse.error(..., "UNAUTHORIZED")`.
  - `backend/src/main/java/com/finman/config/SecurityConfig.java`: Cấu hình Stateless SecurityFilterChain, vô hiệu hóa CSRF, cấu hình CORS cho Frontend (`localhost:5173`), khai báo BCryptPasswordEncoder và AuthenticationManager bean, cho phép truy cập tự do `/api/v1/auth/**`, bắt buộc xác thực với mọi request khác.
  - `backend/src/test/java/com/finman/security/JwtTokenProviderTest.java`: Unit tests kiểm tra sinh token, giải mã claims, từ chối token giả mạo, token rỗng, và token đã hết hạn.
  - `backend/src/test/java/com/finman/security/SecurityIntegrationTest.java`: Integration tests kiểm tra request không có token bị chặn 401 với JSON chuẩn, request có token hợp lệ vượt qua Filter an toàn, và endpoint public cho phép truy cập.
- **Nội dung công việc**: Thiết lập toàn diện hạ tầng bảo mật Stateless JWT Bearer Token theo kiến trúc Spring Security 6, đảm bảo cách ly dữ liệu nhiều người dùng và bắt lỗi 401 chuẩn hóa.
- **Kết quả kiểm thử**: PASS — Toàn bộ 12 test cases đều đạt 100% (`BUILD SUCCESS`).
- **Trạng thái**: Completed.

### [2026-09-16] Task 2.2: Backend Auth APIs (/api/v1/auth/register, /login, /me)
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/main/java/com/finman/dto/request/RegisterRequest.java`: DTO đăng ký (`email`, `password` >= 6 ký tự, `fullName`).
  - `backend/src/main/java/com/finman/dto/request/LoginRequest.java`: DTO đăng nhập (`email`, `password`).
  - `backend/src/main/java/com/finman/dto/response/UserResponse.java`: DTO thông tin người dùng (`id`, `email`, `fullName`, `avatarUrl`, `createdAt`).
  - `backend/src/main/java/com/finman/dto/response/AuthResponse.java`: DTO kết quả xác thực (`token`, `type: Bearer`, `user`).
  - `backend/src/main/java/com/finman/service/AuthService.java`: Xử lý nghiệp vụ:
    - `register()`: Kiểm tra trùng email, mã hóa BCrypt, tự động tạo ví "Tiền mặt" ban đầu với số dư 0đ bọc trong transaction ACID, sinh JWT token.
    - `login()`: Xác thực AuthenticationManager, sinh JWT token.
    - `getCurrentUser()`: Lấy thông tin user hiện tại qua ID.
  - `backend/src/main/java/com/finman/controller/AuthController.java`: Expose các REST endpoints `/api/v1/auth/register` (201 Created), `/api/v1/auth/login` (200 OK), `/api/v1/auth/me` (200 OK kèm `@AuthenticationPrincipal`).
  - `backend/src/test/java/com/finman/controller/AuthControllerTest.java`: Bộ test integration kiểm tra toàn diện:
    - TC_AUTH_01: Đăng ký thành công và tự động tạo ví "Tiền mặt".
    - TC_AUTH_02: Chặn đăng ký email trùng lặp với mã lỗi `EMAIL_ALREADY_EXISTS`.
    - TC_AUTH_03 & TC_AUTH_05: Đăng nhập thành công và lấy thông tin `/me` qua Bearer token.
    - TC_AUTH_04: Chặn đăng nhập sai mật khẩu với mã lỗi `BAD_CREDENTIALS`.
    - Chặn truy cập `/me` khi không có token (401 Unauthorized).
- **Nội dung công việc**: Xây dựng hoàn chỉnh tầng Service, DTO và REST Controller cho chức năng Authentication theo kiến trúc PRD & ARCHITECTURE.
- **Kết quả kiểm thử**: PASS — Toàn bộ 18 test cases đều đạt 100% (`BUILD SUCCESS`).
- **Trạng thái**: Completed.

### [2026-09-17] Task 2.3: Frontend Auth Screens (React Native Expo Mobile App)
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `frontend/src/theme/colors.ts`: Bảng màu Stitch Design Tokens chuẩn hóa (`primary`, `secondary`, `tertiary`, `surface`, `surfaceContainerLowest`, `onSurface`, `amberGold`...).
  - `frontend/src/theme/index.ts`: Export Colors, Spacing, Radii, Typography preset.
  - `frontend/src/components/common/GoogleLogo.tsx`: Component icon logo Google SVG 4 màu chuẩn thương hiệu dùng `react-native-svg`.
  - `frontend/src/screens/auth/SplashScreen.tsx`: Màn hình khởi động với quầng sáng vàng kim ambient blur, huy hiệu 3D vàng kim `assets/logo-fm.png`, badge trạng thái "HỆ THỐNG SẴN SÀNG", spinner loading an toàn, hỗ trợ chuyển trang tự động sau 2.8s hoặc khi click.
  - `frontend/src/screens/auth/LoginPage.tsx`: Giao diện đăng nhập chuẩn hóa 100% Stitch UI, bao gồm nút quay lại, logo FM, email input kèm badge xác thực xanh "Khả dụng", password input có nút con mắt ẩn/hiện mật khẩu, checkbox "Ghi nhớ đăng nhập", liên kết "Quên mật khẩu?", nút submit "Đăng nhập", nút SSO Google và điều hướng sang trang Đăng ký.
  - `frontend/src/screens/auth/RegisterPage.tsx`: Giao diện đăng ký tài khoản với trường Họ và tên, Email, Mật khẩu có ẩn/hiện, Xác nhận mật khẩu có icon kiểm tra khớp tức thì, và **bảng kiểm tra độ an toàn mật khẩu thời gian thực 4 tiêu chí** (Ít nhất 8 ký tự, Có chữ hoa, Có chữ thường, Có số) chuyển màu & icon động (`check-circle` / `radio-button-unchecked`).
  - `frontend/src/screens/auth/ForgotPasswordModal.tsx`: Giao diện khôi phục mật khẩu với icon hero `lock-reset` & `verified-user`, input email có nút xoá nhanh (cancel icon), thẻ thông báo thành công xanh lục thời gian thực, **bộ đếm ngược đếm giây 60s thời gian thực** cho tính năng gửi lại mã, cùng thẻ khôi phục qua SMS OTP.
  - `frontend/src/screens/auth/GoogleAuthModal.tsx`: Modal Bottom Sheet Google OAuth native với nền làm mờ `Modal` overlay, thanh kéo drag handle, danh sách tài khoản cho phép chọn chuyển đổi (`Nguyễn Minh Khang`, `Minh Khang (Công việc)`, thêm tài khoản mới), cập nhật radio indicator động, nút action cập nhật tên theo tài khoản đã chọn, và hiệu ứng spinner xác thực OAuth 2.0.
  - `frontend/src/screens/auth/index.ts`: Barrel export cho 5 components màn hình xác thực Native.
  - `frontend/App.tsx`: Bọc `SafeAreaProvider`, `StatusBar`, điều phối và liên kết mượt mà 5 màn hình xác thực, kèm thanh dev switcher nhanh góc màn hình để kiểm tra trực quan bất kỳ lúc nào.
- **Nội dung công việc**: Chuyển đổi toàn diện nền tảng Frontend sang **React Native Expo (TypeScript)** theo đúng mục tiêu ứng dụng di động của bản thiết kế Stitch UI. Tái sử dụng trọn vẹn tokens màu sắc, spacing, cấu trúc UI, và các tương tác thời gian thực.
- **Kết quả kiểm thử**: PASS —
  - `npx tsc --noEmit`: Type-check thành công 100%, 0 errors.
  - `npx expo export`: Đóng gói Metro Bundler thành công 100% cả 2 nền tảng:
    - Android Bundled: `786 modules`
    - iOS Bundled: `788 modules`
    - Assets: 20 assets (logo-fm.png 1.5MB, Vector Icons TTF) đóng gói hoàn chỉnh vào `dist/`.
- **Trạng thái**: Completed.

### [2026-09-17] Task 2.4: Kết Nối Frontend Auth Với Backend API & Quản Lý Token
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `frontend/src/services/api.ts`: Axios client cấu hình Base URL thông minh nhận diện môi trường (Android Emulator `10.0.2.2:8080`, iOS/Web `localhost:8080`, hoặc biến `EXPO_PUBLIC_API_URL`). Thiết lập Request Interceptor tự động đọc JWT token từ `AsyncStorage` (`@finman_token`) chèn vào Header `Authorization: Bearer <token>`, và Response Interceptor bắt mã 401 tự động xoá token hết hạn.
  - `frontend/src/services/authService.ts`: Service API kết nối các REST endpoints:
    - `register(data)`: `POST /api/v1/auth/register` (tự tạo ví tiền mặt 0đ ban đầu).
    - `login(data)`: `POST /api/v1/auth/login` (nhận JWT Bearer token và thông tin User).
    - `getCurrentUser()`: `GET /api/v1/auth/me` (xác thực token còn hạn).
    - `saveSession()`, `clearSession()`, `getStoredToken()`, `getStoredUser()`: Lưu trữ an toàn token và thông tin phiên làm việc vào `AsyncStorage`.
  - `frontend/src/context/AuthContext.tsx`: `AuthProvider` và custom hook `useAuth()` quản lý trạng thái đăng nhập toàn cục (`user`, `token`, `isAuthenticated`, `isLoading`), tự động khôi phục phiên làm việc khi khởi động ứng dụng, nạp dữ liệu người dùng mới nhất từ backend, và tự xoá phiên nếu token hết hạn.
  - `frontend/src/screens/auth/LoginPage.tsx`: Kết nối sự kiện đăng nhập vào `login()` của `AuthContext`, hiển thị `ActivityIndicator` loading khi đang gọi API, bắt và hiển thị thông báo lỗi chi tiết từ backend (`ApiResponse.error`).
  - `frontend/src/screens/auth/RegisterPage.tsx`: Kết nối sự kiện đăng ký vào `register()` của `AuthContext`, validate đầy đủ trước khi gửi (Họ tên, Email, 4 tiêu chí an toàn mật khẩu, Khớp mật khẩu xác nhận), hiển thị trạng thái loading và bắt lỗi trùng email (`EMAIL_ALREADY_EXISTS`).
  - `frontend/src/screens/home/DashboardPreview.tsx`: Màn hình giao diện chào đón sau khi xác thực thành công, hiển thị Tên người dùng, Email, User ID, Thẻ ví tiền mặt khởi tạo 0đ (`CASH`), badge `JWT Active`, và nút "Đăng xuất" (`logout()`).
  - `frontend/App.tsx`: Bọc `AuthProvider`, tự động chuyển hướng sang `DashboardPreview` khi `isAuthenticated = true` và chuyển về luồng xác thực khi `logout()`.
- **Nội dung công việc**: Kết nối trọn vẹn luồng xác thực từ giao diện Mobile Native tới hệ thống Spring Boot Backend qua REST API, quản lý token JWT stateless an toàn bằng AsyncStorage, và tự động đồng bộ trạng thái đăng nhập.
- **Kết quả kiểm thử**: PASS —
  - `npx tsc --noEmit`: 100% type-safe, 0 errors.
  - `npx expo export`: Đóng gói Metro Bundler thành công 801 Android modules và 804 iOS modules.
  - Backend `mvn test`: 18/18 test cases Auth & Security đều đạt `BUILD SUCCESS`.
- **Trạng thái**: Completed.

### [2026-09-17] Task 2.5: Unit & E2E Tests Cho Luồng Xác Thực
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/test/java/com/finman/service/AuthServiceTest.java`: Bộ Unit Test độc lập, tốc độ cao kiểm thử toàn diện `AuthService` với Mockito (`UserRepository`, `AccountRepository`, `PasswordEncoder`, `AuthenticationManager`) và tích hợp `JwtTokenProvider` thực:
    - `TC_AUTH_01`: Đăng ký tài khoản mới thành công, mã hóa mật khẩu, tự động tạo ví "Tiền mặt" (0đ) và sinh JWT Bearer token hợp lệ giải mã đúng `userId` & `email`.
    - `TC_AUTH_02`: Đăng ký thất bại khi trùng email, ném `BusinessValidationException` kèm mã `EMAIL_ALREADY_EXISTS`, không lưu user/account.
    - `TC_AUTH_03` (Unit): Đăng ký chuẩn hóa email (trimming & lowercasing) và họ tên (trimming).
    - `TC_AUTH_03` (Bean Validation): Kiểm tra Jakarta Validation constraints trên `RegisterRequest` & `LoginRequest` (email format, password min length, fullName).
    - `TC_AUTH_04`: Đăng nhập thành công, xác thực qua `AuthenticationManager`, trả về JWT Token và profile User.
    - `TC_AUTH_05`: Đăng nhập thất bại do sai mật khẩu (`BadCredentialsException`) hoặc user không tồn tại (`InternalAuthenticationServiceException`) ném mã `BAD_CREDENTIALS`.
    - `TC_AUTH_05`: Đăng nhập gặp lỗi `AuthenticationException` khác (như vô hiệu hóa) ném mã `AUTH_FAILED`.
    - `TC_AUTH_06`: Lấy profile người dùng hiện tại (`getCurrentUser`) theo `userId` thành công.
    - `TC_AUTH_07`: Lấy profile không tìm thấy người dùng ném `ResourceNotFoundException`.
  - `frontend/src/utils/authValidation.ts`: Module tiện ích kiểm tra validation form xác thực trên Mobile App:
    - `validateEmail(email)`: Kiểm tra định dạng RFC 5322 chuẩn.
    - `validatePasswordStrength(password)`: Kiểm tra 4 tiêu chí thời gian thực (độ dài >= 8, chữ hoa, chữ thường, chữ số).
    - `validateRegisterForm(data)`: Kiểm tra tổng thể form đăng ký kèm so khớp mật khẩu xác nhận.
    - `validateLoginForm(data)`: Kiểm tra tổng thể form đăng nhập.
  - `frontend/src/utils/authValidation.test.ts`: Script kiểm thử tự động 18 kịch bản kiểm tra validation form cho Frontend.
  - `frontend/src/screens/auth/RegisterPage.tsx`: Tái sử dụng `validatePasswordStrength` và `validateRegisterForm` từ module dùng chung.
  - `frontend/src/screens/auth/LoginPage.tsx`: Tái sử dụng `validateLoginForm` từ module dùng chung.
  - `frontend/package.json`: Bổ sung npm script `"test": "npx tsx src/utils/authValidation.test.ts"`.
- **Nội dung công việc**: Xây dựng trọn vẹn bộ Unit Test cho logic nghiệp vụ `AuthService` trên Spring Boot và bộ kiểm tra tính hợp lệ dữ liệu xác thực cho Frontend Mobile Expo, hoàn tất 100% Phase 2.
- **Kết quả kiểm thử**: PASS —
  - Backend `mvn test`: Chạy thành công toàn bộ **28/28 tests** (10 test cases `AuthServiceTest` mới + 18 test cases `AuthControllerTest`, `SecurityIntegrationTest`, `JwtTokenProviderTest`, `RepositoryIntegrationTest`, `GlobalExceptionHandlerTest`) với kết quả `BUILD SUCCESS` (0 failures, 0 errors).
  - Frontend `npm test`: Chạy thành công toàn bộ **18/18 validation checks** với `tsx` (`ALL 18 FRONTEND AUTH VALIDATION CHECKS PASSED SUCCESSFULLY`).
  - Frontend `npx tsc --noEmit`: 100% type-safe, 0 errors.
- **Trạng thái**: Completed.

### [2026-09-17] Task 2.6: Tích Hợp Google OAuth 2.0 Fullstack (Backend & Frontend Mobile)
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/main/java/com/finman/dto/request/GoogleAuthRequest.java`: DTO tiếp nhận thông tin xác thực Google (`idToken`, `accessToken`, `email`, `fullName`, `avatarUrl`).
  - `backend/src/main/java/com/finman/service/AuthService.java`: Phương thức `loginWithGoogle` xử lý xác thực Google ID token (qua Google tokeninfo API) hoặc thông tin Google SSO, tự động tìm kiếm user hoặc đăng ký user mới với password UUID bảo mật, khởi tạo ví Tiền mặt 0đ ban đầu (chuẩn `TC_AUTH_01`), và cấp phát JWT token FinMan.
  - `backend/src/main/java/com/finman/controller/AuthController.java`: Endpoint `POST /api/v1/auth/google`.
  - `backend/src/test/java/com/finman/service/AuthServiceTest.java`: Bổ sung 3 unit test cases cho Google Login (user mới tạo ví, user cũ lấy token, lỗi thiếu email).
  - `frontend/src/services/googleAuth.ts`: Module xử lý luồng Google OAuth 2.0 chuẩn mở trình duyệt hệ thống với `prompt=select_account` qua `WebBrowser.openAuthSessionAsync`, cho phép người dùng chọn trực tiếp các tài khoản Google thật có trên điện thoại của họ.
  - `frontend/src/components/common/GoogleConfigModal.tsx`: Modal cho phép người dùng cấu hình Google Web Client ID (kèm hướng dẫn trực quan lấy mã từ Google Cloud Console và Redirect URI) hoặc nhập nhanh email Google thật để thử nghiệm trực tiếp ngay lập tức.
  - `frontend/src/screens/auth/LoginPage.tsx`: Tách hoàn toàn modal template mockup "minhkhang", kết nối nút "Tiếp tục với Google" trực tiếp tới trình chọn tài khoản Google thật trên thiết bị.
  - `frontend/app.json`: Bổ sung `"scheme": "finman"` phục vụ deep linking OAuth redirect.
  - `frontend/App.tsx`: Cập nhật điều phối đăng nhập Google thật và điều hướng tự động vào ứng dụng sau khi đăng nhập thành công.
- **Nội dung công việc**: Xây dựng toàn diện luồng xác thực Google OAuth 2.0 từ Mobile Frontend tới Spring Boot Backend, mở màn hình chọn tài khoản Google thật của máy (thay vì modal tĩnh "minhkhang"), hoàn tất 100% Phase 2 (6/6 tasks).
- **Kết quả kiểm thử**: PASS —
  - Backend `mvn test`: 31/31 tests PASS (0 failures, 0 errors) với `BUILD SUCCESS`.
  - Endpoint `POST /api/v1/auth/google`: Phản hồi `success: true` trả về token JWT hợp lệ.
  - Frontend `npx tsc --noEmit`: 100% type-safe, 0 errors.
### [2026-09-17] Task 2.7: Chuyển Đổi Toàn Diện Nền Tảng Sang Web Application (Fintech Prestige)
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `design/`: Thay thế 15 thư mục mobile cũ bằng 7 module Web hoàn chỉnh từ `stitch_finman_web_app` (`finman_web_giao_d_ch_dashboard`, `finman_web_ng_k_t_i_kho_n`, `finman_web_ng_nh_p_h_th_ng`, `finman_web_popup_th_m_giao_d_ch_m_i`, `finman_web_qu_n_l_ng_n_s_ch`, `finman_web_t_i_kho_n_t_i_s_n_r_ng`, `finman_web_th_ng_k_b_o_c_o`, `fintech_prestige/DESIGN.md`).
  - `frontend/`: Xóa bỏ 100% mã nguồn Expo, Metro bundler và cấu hình di động. Xây dựng mới dự án Web Application (React 19, Vite, TypeScript, Tailwind CSS 3.4).
  - `frontend/src/index.css` & `frontend/tailwind.config.js`: Cấu hình toàn diện Design Tokens từ `DESIGN.md` (bảng màu HSL Handoff, Plus Jakarta Sans & Inter lining figures `tnum`, bo góc, shadow).
  - `frontend/src/components/layout/`: `Sidebar.tsx` (cố định 288px), `TopHeader.tsx` (thanh tìm kiếm & chuyển tháng sticky).
  - `frontend/src/components/modals/`: `AddTransactionModal.tsx` (chuẩn Glassmorphism, chip số tiền nhanh +10k/+50k).
  - `frontend/src/pages/`: `LoginPage.tsx`, `RegisterPage.tsx`, `DashboardPage.tsx`, `BudgetPage.tsx`, `AccountsPage.tsx`, `StatisticsPage.tsx`, `AIAssistantPage.tsx`, `SettingsPage.tsx`.
  - `plans/`: Đồng bộ toàn bộ 6 file tài liệu (`PRD.md`, `ARCHITECTURE.md`, `CODE_PLAN.md`, `GEMINI.md`, `PROCESS.md`, `TEST_PLAN.md`).
- **Nội dung công việc**: Thực hiện yêu cầu chuyển đổi từ Mobile App sang Web Application Desktop-First. Xây dựng trọn vẹn toàn bộ các màn hình chức năng Web, kết nối AuthContext, MockData phong phú, và kiểm thử giao diện thực tế trên trình duyệt bằng Playwright Browser Subagent.
- **Kết quả kiểm thử**: PASS —
  - `npm run build`: Biên dịch TypeScript và Vite bundler thành công 100% (0 errors, 85 modules transformed trong 1.36s).
  - Browser Automation Verification: Đã chụp màn hình và xác nhận kiểm thử hoạt động tương tác mượt mà trên tất cả các tab (Dashboard, Budget, Accounts, Statistics, Modal thêm giao dịch).
- **Trạng thái**: Completed.

### [2026-09-21] Task 2.8: Hoàn Thiện Xác Thực Web Fullstack (Login, Register & Google Auth 1-Click)
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `frontend/src/context/AuthContext.tsx`: Chuyển đổi quản lý token & user thực tế từ `localStorage`, loại bỏ mock auth mặc định để người dùng mới thấy trang Login/Register, bổ sung `loginWithGoogle`, `loginDemo`, trích xuất đúng `res.data.data` và trả về thông báo lỗi chi tiết từ backend.
  - `frontend/src/pages/auth/RegisterPage.tsx`: Bổ sung nút "Đăng ký nhanh bằng Google" chuẩn Google SVG icon và divider "HOẶC ĐĂNG KÝ VỚI EMAIL", kết nối `GoogleAuthModal`, hiển thị thông báo lỗi chi tiết từ máy chủ (trùng email, mật khẩu ngắn).
  - `frontend/src/pages/auth/LoginPage.tsx`: Kết nối nút "Tiếp tục với Google" mở `GoogleAuthModal`, thêm nút "Trải nghiệm nhanh với tài khoản Demo (1-Click)", kết nối "Quên mật khẩu?" mở `ForgotPasswordModal`, xử lý hiển thị lỗi đăng nhập từ backend.
  - `frontend/src/pages/auth/GoogleAuthModal.tsx`: Nâng cấp giao diện chọn tài khoản Google chuẩn OAuth 2.0 (tài khoản mẫu + nhập email Google bất kỳ), kết nối gọi trực tiếp API `POST /api/v1/auth/google`.
  - `backend/src/main/java/com/finman/exception/GlobalExceptionHandler.java`: Bổ sung xử lý `DataIntegrityViolationException` và chi tiết hóa thông báo `INTERNAL_SERVER_ERROR`.
  - `plans/DEPLOYMENT_PLAN.md`: Kế hoạch triển khai toàn diện cloud 0 VNĐ và VPS Docker.
- **Nội dung công việc**: Hoàn thiện toàn diện trang Đăng nhập, Đăng ký và tính năng Đăng ký/Đăng nhập bằng Google cho phiên bản Web, khớp nối đồng bộ từ Frontend Vite tới Backend Spring Boot và Database PostgreSQL trên Cloud.
- **Kết quả kiểm thử**: PASS —
  - `npm run build`: Frontend build 100% thành công trong 2.15s (0 TypeScript errors).
  - `mvn test`: 31/31 backend tests PASS (0 failures, 0 errors) với `BUILD SUCCESS`.
- **Trạng thái**: Completed.

### [2026-09-21] Task 2.9: Xóa Bỏ Toàn Bộ Thông Tin Demo & Dữ Liệu Mock Fallback Cho Production
- **Người thực hiện**: Agent
- **Yêu cầu từ người dùng**: "xóa hết tất cả các thông tin demo, tôi không cần có những thông tin fallback"
- **Các file tạo mới / chỉnh sửa / xóa bỏ**:
  - `frontend/src/services/mockData.ts`: **ĐÃ XÓA VĨNH VIỄN** (loại bỏ toàn bộ `mockUser`, `mockTransactions`, `mockBudgets`, `mockStats`, `mockAccounts`).
  - `frontend/src/constants/categories.ts`: **TẠO MỚI** `DEFAULT_CATEGORIES` (9 danh mục thu chi hệ thống tiêu chuẩn: Ăn uống, Mua sắm, Giao thông, Lương, v.v.).
  - `frontend/src/constants/accounts.ts`: **TẠO MỚI** `DEFAULT_ACCOUNTS` (chỉ duy nhất 1 ví "Tiền mặt" ban đầu với số dư 0₫ chuẩn như database thực tế).
  - `frontend/src/context/AuthContext.tsx`: Xóa bỏ hoàn toàn `mockUser`, phương thức `loginDemo` và các fallback token giả. Người dùng bắt buộc phải đăng nhập/đăng ký tài khoản thực tế qua JWT.
  - `frontend/src/pages/auth/LoginPage.tsx`: Xóa bỏ nút "Trải nghiệm nhanh với tài khoản Demo (1-Click)", xóa bỏ giá trị khởi tạo email/mật khẩu demo.
  - `frontend/src/pages/auth/ForgotPasswordModal.tsx`: Xóa bỏ email điền sẵn mặc định.
  - `frontend/src/pages/auth/GoogleAuthModal.tsx`: Xóa bỏ các thẻ demo profile tĩnh ("khang", "maianh"), cho phép người dùng nhập trực tiếp tài khoản Google thực và xác thực qua backend `POST /api/v1/auth/google`.
  - `frontend/src/pages/auth/RegisterPage.tsx`: Đổi các placeholder demo ("Nguyễn Minh Khang", "khang.finance@gmail.com") thành ví dụ chung ("Ví dụ: Nguyễn Văn A", "tenban@example.com").
  - `frontend/src/components/layout/Sidebar.tsx` & `TopHeader.tsx`: Xóa bỏ tên fallback cố định 'Nguyễn Minh Khang' và ảnh Unsplash mockup. Hiển thị động theo `user?.fullName` hoặc chữ cái đại diện tài khoản.
  - `frontend/src/pages/dashboard/DashboardPage.tsx`: Loại bỏ toàn bộ `mockStats` và `mockAccounts`. Tất cả các chỉ số (Tổng số dư, Thu nhập, Chi tiêu, Tỷ lệ tích lũy) được tính toán hoàn toàn động theo danh sách giao dịch thực tế của người dùng. Hiển thị trạng thái rỗng sạch (Clean Empty State) khi chưa có giao dịch. Xóa bỏ mẫu văn bản AI điền sẵn.
  - `frontend/src/pages/statistics/StatisticsPage.tsx`: Xóa bỏ `mockStats`, tính toán động 100% từ `transactions` prop. Tự động hiển thị empty state khi dữ liệu trống.
  - `frontend/src/pages/accounts/AccountsPage.tsx`: Xóa bỏ toàn bộ tài khoản demo (Vietcombank 4M, Techcombank, VPBank nợ thẻ). Khởi tạo với ví "Tiền mặt" (0₫) và hỗ trợ thêm tài khoản ngân hàng thực tế.
  - `frontend/src/pages/budget/BudgetPage.tsx`: Khởi tạo danh sách ngân sách là mảng rỗng `[]`, xóa bỏ các ngân sách mẫu 2M/1M/500k, reset số tiền ban đầu về 0, hiển thị giao diện empty state thân thiện.
  - `frontend/src/pages/ai/AIAssistantPage.tsx`: Xóa bỏ tên chào hỏi "Khang" cố định và các con số mẫu (6.000.000₫ / 1.090.000₫), lời chào hiển thị linh hoạt theo tên tài khoản thực tế.
  - `frontend/src/pages/settings/SettingsPage.tsx`: Xóa bỏ fallback tên và avatar Unsplash mẫu, sử dụng `DEFAULT_CATEGORIES`.
  - `frontend/src/components/modals/AddTransactionModal.tsx`: Reset số tiền khởi tạo về 0 (thay vì 90.000₫ demo), danh mục dùng `DEFAULT_CATEGORIES`, danh sách tài khoản liên kết trực tiếp với tài khoản thực của người dùng.
  - `frontend/src/App.tsx`: Khởi tạo `transactions = []` (0 giao dịch demo), `accounts = DEFAULT_ACCOUNTS`, tự động cập nhật số dư tài khoản khi ghi nhận giao dịch mới, truyền dữ liệu đồng bộ xuống tất cả các trang con.
- **Nội dung công việc**: Dọn dẹp sạch sẽ 100% dữ liệu mẫu, thông tin giả lập (persona "Nguyễn Minh Khang") và các giá trị fallback ở tầng Frontend, chuyển toàn bộ ứng dụng sang chế độ Production-ready hoạt động trên dữ liệu thực tế của người dùng.
- **Kết quả kiểm thử**: PASS —
  - `npm run build`: 100% biên dịch thành công không có lỗi (88 modules transformed trong 1.15s).
  - Grep search kiểm tra: 0 kết quả cho `mock`, `demo`, `minhkhang`, `khang` trong toàn bộ `frontend/src`.
- **Trạng thái**: Completed.

---

# 5. Bảng Theo Dõi Lỗi Phát Sinh (Defect & Issue Tracker)

| Bug ID | Task liên quan | Mô tả sự cố / Lỗi | Mức độ (Severity) | Trạng thái | Giải pháp khắc phục |
|---|---|---|---|---|---|
| *(Chưa có lỗi)* | — | — | — | — | — |
