# PROCESS — FinMan Development & Progress Tracker
## Nhật Ký Tiến Độ & Quy Trình Lập Trình Thực Tế

> [!NOTE]
> Đây là **tài liệu sống (Living Document)** được cập nhật liên tục sau mỗi lượt làm việc của Developer / AI Agent.
> **Quy trình chuẩn**: `Task N` → `Code` → `Review` → `Test` → `Cập nhật PROCESS.md`.

---

# 1. Dashboard Tổng Quan Tiến Độ

```text
Tiến độ dự án: [█████████░░░░░░░░░░░] 22.5% (9 / 40 Tasks hoàn thành)
Trạng thái:    🟢 Đang triển khai (In Progress)
Phase hiện tại: Phase 2 — Authentication Fullstack (Spring Security + Stitch Auth Screens)
```

| Chỉ số | Số lượng | Ghi chú |
|---|---|---|
| **Tổng số Task** | 40 tasks | Được phân rã từ Phase 0 đến Phase 9 trong `CODE_PLAN.md` |
| **Đã hoàn thành (Done)** | 9 tasks | Hoàn tất 100% Phase 0 (5 tasks) + Phase 1 (4 tasks) |
| **Đang thực hiện (In Progress)** | 0 tasks | |
| **Chưa thực hiện (Pending)** | 31 tasks | |
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
| **Task 0.3** | Khởi tạo Frontend Project React + Vite (`frontend/`) | `Completed` | 2026-09-16 | Agent |
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
| **Task 2.1** | Cấu hình Spring Security 6 & JWT Token Provider | `Pending` | — | — |
| **Task 2.2** | Backend Auth APIs (`/api/v1/auth/register`, `/login`, `/me`) | `Pending` | — | — |
| **Task 2.3** | Frontend Auth Screens: Splash, Login, Register, Forgot Password từ `design/01-05` | `Pending` | — | — |
| **Task 2.4** | Kết nối Frontend Auth với Backend API & Quản lý Token | `Pending` | — | — |
| **Task 2.5** | Unit & E2E Tests cho luồng Authentication | `Pending` | — | — |

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

### Phase 8: Settings, Profile & App Polish (APIs + Stitch Settings Screen + PWA)
| Task ID | Tên Task | Trạng thái | Ngày hoàn thành | Người thực hiện |
|---|---|---|---|---|
| **Task 8.1** | Backend Profile & Settings APIs (Đổi mật khẩu, Logout) | `Pending` | — | — |
| **Task 8.2** | Frontend Settings Screen: Bóc tách từ `design/13_more_settings/code.html` | `Pending` | — | — |
| **Task 8.3** | Tinh chỉnh Responsive Mobile/Desktop & PWA configuration | `Pending` | — | — |
| **Task 8.4** | Kiểm tra đối chiếu toàn diện với ảnh Mockup Stitch (`screen.png`) | `Pending` | — | — |

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

---

# 5. Bảng Theo Dõi Lỗi Phát Sinh (Defect & Issue Tracker)

| Bug ID | Task liên quan | Mô tả sự cố / Lỗi | Mức độ (Severity) | Trạng thái | Giải pháp khắc phục |
|---|---|---|---|---|---|
| *(Chưa có lỗi)* | — | — | — | — | — |
