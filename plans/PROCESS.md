# PROCESS — FinMan Development & Progress Tracker
## Nhật Ký Tiến Độ & Quy Trình Lập Trình Thực Tế

> [!NOTE]
> Đây là **tài liệu sống (Living Document)** được cập nhật liên tục sau mỗi lượt làm việc của Developer / AI Agent.
> **Quy trình chuẩn**: `Task N` → `Code` → `Review` → `Test` → `Cập nhật PROCESS.md`.

---

# 1. Dashboard Tổng Quan Tiến Độ

```text
Tiến độ dự án: [███████████████████░] 93.2% (41 / 44 Tasks hoàn thành)
Trạng thái:    🟢 Hoàn thành Task 8.1, Task 8.2 & Task 8.3 — Sẵn sàng Task 8.4: Tests Cho Statistics & Export
Phase hiện tại: Phase 8 — Statistics & Data Export Fullstack (APIs + Stitch Statistics Screen + Excel Export)
```

| Chỉ số | Số lượng | Ghi chú |
|---|---|---|
| **Tổng số Task** | 44 tasks | Được phân rã từ Phase 0 đến Phase 9 trong `CODE_PLAN.md` |
| **Đã hoàn thành (Done)** | 41 tasks | Phase 0 (5) + Phase 1 (4) + Phase 2 (6) + Phase 3 (4) + Phase 4 (6) + Phase 5 (4) + Phase 6 (4) + Phase 7 (4) + Phase 8 (3: 8.1, 8.2, 8.3) |
| **Đang thực hiện (In Progress)** | 0 tasks | Sẵn sàng cho Task 8.4 (Tests Cho Statistics & Export) |
| **Chưa thực hiện (Pending)** | 3 tasks | Phase 8 (1) + Phase 9 (3) |
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
| **Task 3.1** | Backend Accounts & Categories APIs (CRUD, Net Worth) | `Completed` | 2026-09-21 | Agent |
| **Task 3.2** | Frontend Accounts Screen: Bóc tách từ `design/finman_web_t_i_kho_n_t_i_s_n_r_ng/code.html` | `Completed` | 2026-09-21 | Agent |
| **Task 3.3** | Kết nối Frontend Accounts với Backend API | `Completed` | 2026-09-21 | Agent |
| **Task 3.4** | Tests cho Accounts & Net Worth | `Completed` | 2026-09-22 | Agent |

### Phase 4: Core Transaction Engine Fullstack (Home, Add Txn & Calendar)
| Task ID | Tên Task | Trạng thái | Ngày hoàn thành | Người thực hiện |
|---|---|---|---|---|
| **Task 4.1** | Backend Transaction Service (`@Transactional`, cộng/trừ số dư, filter) | `Completed` | 2026-09-22 | Agent |
| **Task 4.2** | Frontend Transactions Home Dashboard: Bóc tách từ `design/finman_web_giao_d_ch_dashboard` | `Completed` | 2026-09-22 | Agent |
| **Task 4.3** | Frontend Add Transaction Modal: Bóc tách từ `design/finman_web_popup_th_m_giao_d_ch_m_i` | `Completed` | 2026-09-22 | Agent |
| **Task 4.4** | Frontend Calendar & Time Filtering (Lọc thời gian & đồng bộ lịch sử) | `Completed` | 2026-09-22 | Agent |
| **Task 4.5** | Kết nối Frontend Transactions với Backend API | `Completed` | 2026-09-23 | Agent |
| **Task 4.6** | Tests cho Core Transaction Engine & Balance Consistency | `Completed` | 2026-09-23 | Agent |

### Phase 5: Budgeting System Fullstack (APIs + Stitch Budget Screen)
| Task ID | Tên Task | Trạng thái | Ngày hoàn thành | Người thực hiện |
|---|---|---|---|---|
| **Task 5.1** | Backend Budget APIs (Upsert, tính amountSpent, cảnh báo 80%, 100%) | `Completed` | 2026-09-25 | Agent |
| **Task 5.2** | Frontend Budget Screen: Bóc tách từ `design/finman_web_qu_n_l_ng_n_s_ch/code.html` | `Completed` | 2026-09-25 | Agent |
| **Task 5.3** | Kết nối Frontend Budget với Backend API | `Completed` | 2026-09-25 | Agent |
| **Task 5.4** | Tests cho Budgeting System (`TC_BDG_01` đến `TC_BDG_05`) | `Completed` | 2026-09-25 | Agent |

### Phase 6: Google Gemini AI Fullstack (APIs + Stitch AI Assistant Screen)
| Task ID | Tên Task | Trạng thái | Ngày hoàn thành | Người thực hiện |
|---|---|---|---|---|
| **Task 6.1** | Backend Gemini AI Client & Structured Prompt Engine | `Completed` | 2026-09-25 | Agent |
| **Task 6.2** | Backend Quick-Add & Spending Insights APIs | `Completed` | 2026-09-28 | Agent |
| **Task 6.3** | Frontend AI Assistant Screen: Giao diện trợ lý ảo AI Web Desktop | `Completed` | 2026-09-28 | Agent |
| **Task 6.4** | Tests cho Google Gemini AI Features (`TC_AI_01` đến `TC_AI_06`) | `Completed` | 2026-09-28 | Agent |

### Phase 7: Settings, Profile & Web Polish (APIs + Stitch Settings Screen + Web Polish)
| Task ID | Tên Task | Trạng thái | Ngày hoàn thành | Người thực hiện |
|---|---|---|---|---|
| **Task 7.1** | Backend Profile & Settings APIs (Đổi mật khẩu, Logout) | `Completed` | 2026-09-28 | Agent |
| **Task 7.2** | Frontend Settings Screen: Bóc tách từ giao diện Stitch Web Settings | `Completed` | 2026-09-28 | Agent |
| **Task 7.3** | Tối ưu trải nghiệm Web Responsive & Performance | `Completed` | 2026-09-28 | Agent |
| **Task 7.4** | Kiểm tra đối chiếu toàn diện với thiết kế Stitch Web (`code.html`, `screen.png`) | `Completed` | 2026-09-28 | Agent |

### Phase 8: Statistics & Data Export Fullstack
| Task ID | Tên Task | Trạng thái | Ngày hoàn thành | Người thực hiện |
|---|---|---|---|---|
| **Task 8.1** | Backend Aggregation & Apache POI Excel Export Service | `Completed` | 2026-09-29 | Agent |
| **Task 8.2** | Frontend Statistics Screen: Bóc tách từ `design/finman_web_th_ng_k_b_o_c_o/code.html` | `Completed` | 2026-09-29 | Agent |
| **Task 8.3** | Kết nối Frontend Statistics & Kích hoạt tải file Excel | `Completed` | 2026-09-29 | Agent |
| **Task 8.4** | Tests cho Statistics & Excel Export (`TC_EXP_01`, `TC_EXP_02`) | `Pending` | — | — |

### Phase 9: Comprehensive Testing, Security Audit & Docker Deployment
| Task ID | Tên Task | Trạng thái | Ngày hoàn thành | Người thực hiện |
|---|---|---|---|---|
| **Task 9.1** | Chạy toàn bộ Test Suite (Backend & Frontend) | `Pending` | — | — |
| **Task 9.2** | Rà soát bảo mật đa tầng (Multi-tenant isolation & JWT security) | `Pending` | — | — |
| **Task 9.3** | Xây dựng Docker Compose Production hoàn chỉnh | `Pending` | — | — |
| **Task 9.7** | Tái cấu trúc chuẩn hóa Account Domain & Đồng bộ toàn bộ Planning Documents | `Completed` | 2026-09-29 | Agent |

### Phase 10: Extended Account Domain & Full Transfer Implementation
| Task ID | Tên Task | Trạng thái | Ngày hoàn thành | Người thực hiện |
|---|---|---|---|---|
| **Task 10.1** | Database Schema Migration Cho Transfer & Extended Account Attributes | `Completed` | 2026-10-05 | Agent |
| **Task 10.2** | Backend Transaction Service Processing Cho Luồng TRANSFER | `Completed` | 2026-10-05 | Agent |
| **Task 10.3** | Cô Lập Thống Kê & Báo Cáo Không Bị Ảnh Hưởng Bởi TRANSFER | `Completed` | 2026-10-05 | Agent |
| **Task 10.4** | Frontend Transfer Tab & UI Modal Cập Nhật | `Completed` | 2026-10-05 | Agent |
| **Task 10.5** | AI Natural Language Quick Add Nhận Diện Intent TRANSFER | `Pending` | — | — |
| **Task 10.6** | Backend Account Lifecycle & Purpose Pocket Management | `Completed` | 2026-10-05 | Agent |
| **Task 10.7** | Frontend Purpose-based Accounts Redesign (`AccountsPage.tsx` & Modal) | `Completed` | 2026-10-05 | Agent |

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
### [2026-09-21] Task 2.10: Tích Hợp Google Identity Services Chính Thức & Gỡ Bỏ Đăng Nhập Thủ Công
- **Người thực hiện**: Agent
- **Yêu cầu từ người dùng**: "985373734063-qnaa9b0gh7hotm83ir996kqutav885t5.apps.googleusercontent.com sau khi thay thế việc sử dụng clientID hãy gỡ những thành phần liên quan đến việc đăng nhập gg bằng cách nhập thủ công"
- **Các file tạo mới / chỉnh sửa / xóa bỏ**:
  - `frontend/.env`: Cấu hình `VITE_GOOGLE_CLIENT_ID=985373734063-qnaa9b0gh7hotm83ir996kqutav885t5.apps.googleusercontent.com`.
  - `frontend/index.html`: Nhúng SDK Google Identity Services (`https://accounts.google.com/gsi/client`).
  - `frontend/src/components/auth/GoogleSignInButton.tsx`: **TẠO MỚI** component nút Google Sign-In chuẩn Google Identity Services: tự động khởi tạo SDK với Client ID, render nút chuẩn Google, kích hoạt One Tap và tiếp nhận JWT ID Token (`credential`) gửi về backend `/api/v1/auth/google`.
  - `frontend/src/pages/auth/GoogleAuthModal.tsx`: **ĐÃ XÓA VĨNH VIỄN** (gỡ bỏ toàn bộ modal và form nhập email Google thủ công).
  - `frontend/src/pages/auth/LoginPage.tsx`: Gỡ bỏ modal cũ, thay thế bằng `<GoogleSignInButton text="continue_with" />`.
  - `frontend/src/pages/auth/RegisterPage.tsx`: Gỡ bỏ modal cũ, thay thế bằng `<GoogleSignInButton text="signup_with" />`.
  - `frontend/src/pages/auth/index.ts`: Xóa export `GoogleAuthModal`.
- **Nội dung công việc**: Chuyển đổi toàn diện cơ chế xác thực Google từ mô phỏng nhập form thủ công sang luồng OAuth 2.0 chính thức của Google Identity Services (GIS), tự động mở popup chọn tài khoản Google đang có trên máy của client.
- **Kết quả kiểm thử**: PASS —
  - `npm run build`: 100% biên dịch thành công (88 modules transformed trong 1.73s, 0 lỗi TypeScript).
  - Grep search: 0 tham chiếu tới `GoogleAuthModal` trong toàn bộ mã nguồn.
  - Live Backend API Verification (`https://finman-backend-8oac.onrender.com`):
    - `POST /api/v1/auth/register`: PASS — Đăng ký tài khoản mới thành công, cấp phát token JWT và ví tiền mặt 0₫.
    - `POST /api/v1/auth/login`: PASS — Xác thực email/password thành công, trả về JWT hợp lệ.
    - `GET /api/v1/auth/me`: PASS — Xác thực Bearer JWT token thành công, trả về đúng UserPrincipal.
### [2026-09-21] Task 2.11: Tối Ưu OAuth Flow Google 1-Click (Không Ép Chọn Lại Tài Khoản)
- **Người thực hiện**: Agent
- **Yêu cầu từ người dùng**: "Hiện tại Google Login đang hiển thị đúng tài khoản lelananh02@gmail.com, nhưng khi người dùng bấm 'Tiếp tục bằng Lê Thị Lan Anh', tôi muốn Google đăng nhập trực tiếp bằng tài khoản đó và không mở thêm bước chọn tài khoản lần nữa. Nếu người dùng muốn dùng tài khoản khác, họ có thể bấm mũi tên bên cạnh tài khoản và chọn 'Sử dụng tài khoản khác'. Hãy kiểm tra và điều chỉnh OAuth flow để không ép prompt=select_account ở mọi lần đăng nhập. Giữ lại khả năng chọn tài khoản khác khi người dùng chủ động chọn. Không thay đổi UI/flow khác nếu không cần thiết."
- **Các file chỉnh sửa**:
  - `frontend/src/components/auth/GoogleSignInButton.tsx`: Tích hợp `login_hint: savedEmail` (chuẩn chính thức của Google Identity Services để bỏ qua bước chọn tài khoản khi người dùng bấm vào tài khoản đã nhận diện), kích hoạt `auto_select: true`, `context: 'signin'`, `itp_support: true`, `use_fedcm_for_prompt: true`.
  - `frontend/src/context/AuthContext.tsx`: Tự động lưu `finman_last_google_email` khi đăng nhập thành công, loại bỏ lệnh `disableAutoSelect()` khi logout.
  - `frontend/src/types/google.d.ts`: Cập nhật Type Definition chuẩn cho GIS (`login_hint`, `auto_select`, `itp_support`, `use_fedcm_for_prompt`, `context`).
- **Nội dung công việc**: Tinh chỉnh luồng Google Identity Services loại bỏ các bước lặp lại dư thừa bằng `login_hint` và `auto_select`.
- **Kết quả kiểm thử**: PASS (88 modules transformed, 0 lỗi).
- **Trạng thái**: Completed.

### [2026-09-21] Task 2.12: Khắc Phục Triệt Để Hiện Tượng Giật / Tải Lại Nút Google Khi Nhập Form Đăng Ký & Đăng Nhập
- **Người thực hiện**: Agent
- **Yêu cầu từ người dùng**: "Kiểm tra lại trang đăng ký, mỗi lần tôi nhập thông tin vào các box thì đều bị load trang"
- **Nguyên nhân cốt lõi (Root Cause)**:
  - Khi người dùng gõ từng ký tự vào các input trên `RegisterPage` (`fullName`, `email`, `password`, `confirmPassword`), hook `useState` cập nhật lại state của form, làm `RegisterPage` re-render.
  - Prop `onError={(msg) => setErrorMsg(msg)}` truyền vào component con `GoogleSignInButton` là một anonymous arrow function mới trên mỗi render cycle.
  - Trong `GoogleSignInButton.tsx`, `useEffect` có dependency array `[text, loginWithGoogle, onError]`. Sự thay đổi tham chiếu của callback `onError` khiến `useEffect` kích hoạt lại sau MỖI PHÍM BẤM.
  - Bên trong effect, lệnh `buttonContainerRef.current.innerHTML = ''` xóa sạch iframe của nút Google, rồi gọi `window.google.accounts.id.renderButton()` và `prompt()`. Việc hủy và tạo lại iframe liên tục tạo ra các request mạng tới Google, làm trình duyệt nhấp nháy, giật lag và gây cảm giác như toàn bộ trang bị tải lại.
- **Các file chỉnh sửa**:
  - `frontend/src/components/auth/GoogleSignInButton.tsx`:
    - Dùng `useRef` lưu giữ tham chiếu mới nhất của các callback (`onErrorRef`, `loginWithGoogleRef`), loại bỏ chúng khỏi dependency array của `useEffect` (chỉ còn `[text]`).
    - Thêm cờ `isRenderedRef` để bảo đảm nút Google chỉ render duy nhất một lần khi mount, không bao giờ xóa `innerHTML` hay tái tạo iframe nếu không có sự thay đổi về cấu hình `text`.
    - Bọc component bằng `React.memo` để tránh re-render thừa khi component cha render.
    - Xóa bỏ email mặc định fallback `'lelananh02@gmail.com'` khi đăng ký mới, chỉ truyền `login_hint` nếu người dùng đã có phiên Google hợp lệ trước đó.
  - `frontend/src/pages/auth/RegisterPage.tsx`: Bọc `handleGoogleError` bằng `useCallback`, loại bỏ inline function prop.
  - `frontend/src/pages/auth/LoginPage.tsx`: Bọc `handleGoogleError` bằng `useCallback`, đảm bảo trải nghiệm gõ input trên trang đăng nhập cũng hoàn toàn mượt mà.
  - `frontend/src/context/AuthContext.tsx`: Bọc toàn bộ các hàm xác thực (`login`, `register`, `loginWithGoogle`, `logout`) bằng `useCallback` để đảm bảo ổn định tham chiếu hệ thống.
- **Kết quả kiểm thử**: PASS —
  - `npm run build`: 100% biên dịch thành công (88 modules transformed trong 1.09s, 0 lỗi TypeScript/Vite).
  - Trải nghiệm nhập liệu trong form đăng ký/đăng nhập hoàn toàn trơn tru, không có hiện tượng giật, chớp nháy hoặc gửi lại request khởi tạo nút Google.
- **Trạng thái**: Completed.

### [2026-09-21] Task 3.1: Xây Dựng Backend Accounts & Categories APIs (CRUD, Net Worth)
- **Người thực hiện**: Agent
- **Yêu cầu từ kế hoạch**: Xây dựng toàn bộ các tầng REST APIs (DTO, Service, Controller, Exception Handling) cho 2 nghiệp vụ: Quản lý Tài khoản / Ví tiền (`CASH`, `BANK`, `CREDIT_CARD`), tự động tính Net Worth, và Quản lý Danh mục thu chi (`INCOME`, `EXPENSE`), cô lập dữ liệu người dùng (`userId` từ JWT).
- **Các file tạo mới / chỉnh sửa**:
  - DTOs:
    - `backend/src/main/java/com/finman/dto/request/AccountCreateRequest.java`: DTO tạo tài khoản mới với validation (`@NotBlank`, `@NotNull`, `@Min(0)`).
    - `backend/src/main/java/com/finman/dto/request/AccountUpdateRequest.java`: DTO cập nhật tài khoản (tên, hạn mức tín dụng, trạng thái lưu trữ).
    - `backend/src/main/java/com/finman/dto/request/CategoryCreateRequest.java`: DTO tạo danh mục mới.
    - `backend/src/main/java/com/finman/dto/request/CategoryUpdateRequest.java`: DTO cập nhật tên/icon danh mục cá nhân.
    - `backend/src/main/java/com/finman/dto/response/AccountResponse.java`: DTO trả về thông tin chi tiết tài khoản.
    - `backend/src/main/java/com/finman/dto/response/AccountSummaryResponse.java`: DTO tổng hợp tài sản ròng (`totalAssets`, `totalLiabilities`, `netWorth`, `accounts`).
    - `backend/src/main/java/com/finman/dto/response/CategoryResponse.java`: DTO trả về danh mục.
  - Services:
    - `backend/src/main/java/com/finman/service/AccountService.java`: Logic CRUD tài khoản, tính toán `Net Worth = (CASH + BANK) - CREDIT_CARD`, kiểm tra trùng tên, Soft Delete (`isArchived = true`) để bảo toàn lịch sử giao dịch.
    - `backend/src/main/java/com/finman/service/CategoryService.java`: Logic lấy danh mục hệ thống + cá nhân, chặn xóa/sửa danh mục mặc định của hệ thống (`TC_CAT_03`), kiểm tra trùng tên.
  - Controllers:
    - `backend/src/main/java/com/finman/controller/AccountController.java`: Endpoints `/api/v1/accounts` (`GET`, `POST`, `PUT`, `DELETE`), lấy `userId` an toàn từ `@AuthenticationPrincipal UserPrincipal`.
    - `backend/src/main/java/com/finman/controller/CategoryController.java`: Endpoints `/api/v1/categories` (`GET`, `POST`, `PUT`, `DELETE`).
  - Tests:
    - `backend/src/test/java/com/finman/service/AccountServiceTest.java`: 8 unit test cases bao phủ `TC_ACC_01` -> `TC_ACC_05`.
    - `backend/src/test/java/com/finman/service/CategoryServiceTest.java`: 8 unit test cases bao phủ `TC_CAT_01` -> `TC_CAT_03`.
    - `backend/src/test/java/com/finman/security/SecurityIntegrationTest.java`: Cập nhật kỳ vọng kiểm thử `/api/v1/accounts` sang `200 OK`.
- **Kết quả kiểm thử**: PASS 100% —
  - `mvn test`: 47/47 tests passed (0 failures, 0 errors, 0 skipped).
- **Trạng thái**: Completed.

### [2026-09-21] Task 3.2 & Task 3.3: Frontend Accounts Screen & API Integration
- **Người thực hiện**: Agent
- **Yêu cầu từ kế hoạch**:
  - Bóc tách toàn diện màn hình Quản lý Tài khoản & Tài sản ròng từ mã nguồn Stitch Web Desktop [design/finman_web_t_i_kho_n_t_i_s_n_r_ng/code.html](file:///d:/FinMan/design/finman_web_t_i_kho_n_t_i_s_n_r_ng/code.html) (Task 3.2).
  - Kết nối trực tiếp Frontend với Backend REST APIs `/api/v1/accounts` (Task 3.3).
- **Các file tạo mới / chỉnh sửa**:
  - `frontend/src/types/index.ts`: Bổ sung các kiểu dữ liệu `AccountSummary`, `AccountCreatePayload`, `AccountUpdatePayload`, mở rộng thuộc tính `createdAt`, `updatedAt` cho `Account`.
  - `frontend/src/services/accountService.ts`: Tạo mới service gọi REST APIs backend (`getAccountsSummary()`, `getAccountById()`, `createAccount()`, `updateAccount()`, `deleteAccount()`).
  - `frontend/src/pages/accounts/AccountsPage.tsx`: Tái hiện 100% chuẩn thiết kế Stitch Fintech Prestige:
    - **VIP Net Worth Hero Card**: Màu Dark Gunmetal gradient, hiệu ứng đốm mờ blur, nút con mắt bảo mật số dư (`hideBalance`), dải phân rã phương trình tài chính (Tổng tài sản thực có, Dư nợ thẻ, Thặng dư ròng & tỷ lệ thanh khoản).
    - **Biểu đồ Donut SVG Phân bổ dòng vốn**: Tính toán động tỷ trọng % phân bổ vốn thực tế từ các tài khoản khả dụng.
    - **3 Cột phân loại nguồn tiền Desktop-First**: Tiền mặt (`CASH`), Tài khoản ngân hàng (`BANK`), Thẻ tín dụng & Nợ (`CREDIT_CARD`).
    - **Mục tiêu Tích lũy & Dự phòng**: Quỹ khẩn cấp và mục tiêu sắm laptop với thanh tiến độ trực quan.
    - **Hệ thống Dialog / Modal chuẩn Stitch**: Modal Thêm tài khoản mới đầy đủ các trường dữ liệu và loại ví, Modal Xuất file Excel (.xlsx), và Dialog xác nhận Lưu trữ tài khoản (Soft Delete).
  - `frontend/src/App.tsx`: Tự động tải và đồng bộ danh sách tài khoản thực tế từ `/api/v1/accounts` khi người dùng đăng nhập, chia sẻ dữ liệu ví realtime cho toàn bộ hệ thống (Dashboard, Add Transaction Modal).
- **Kết quả kiểm thử**: PASS 100% —
  - `npm run build`: Build thành công trong 1.18s, không có bất kỳ lỗi TypeScript hay linter nào.
  - `mvn test`: Toàn bộ 47 unit/integration test cases backend chạy thành công 100%.
- **Trạng thái**: Completed.

### [2026-09-22] Task 3.4: Tests Toàn Diện Cho Accounts, Categories & Net Worth (DoD 100%)
- **Người thực hiện**: Agent
- **Yêu cầu từ kế hoạch**: Xây dựng trọn bộ kiểm thử cho Module 2 (Financial Accounts & Net Worth `TC_ACC_01` -> `TC_ACC_05`) và Module 3 (Categories `TC_CAT_01` -> `TC_CAT_03`), kiểm tra phân quyền multi-tenant, bảo đảm số dư không dùng float, kiểm tra tính toàn vẹn soft delete (`isArchived`).
- **Các file tạo mới / chỉnh sửa**:
  - `backend/pom.xml`: Bổ sung dependency `com.h2database:h2` với scope `test` phục vụ môi trường kiểm thử tự động độc lập, không phụ thuộc Docker cục bộ.
  - `backend/src/test/resources/application.yml`: Tạo cấu hình kiểm thử với H2 Database (PostgreSQL mode, `NON_KEYWORDS=MONTH,YEAR`), JPA Hibernate `create-drop`.
  - `backend/src/test/java/com/finman/controller/AccountControllerTest.java`: Bộ Integration Test MockMvc 8 test cases:
    - `TC_ACC_01`: Tạo ví Tiền mặt / Ngân hàng thành công (`POST /api/v1/accounts`, 201 Created).
    - `TC_ACC_02`: Tạo Thẻ tín dụng thành công với hạn mức và dư nợ ban đầu (`POST /api/v1/accounts`, 201 Created).
    - `TC_ACC_03`: Tính toán Tài sản ròng chính xác (`Net Worth = Assets - Liabilities`) qua `GET /api/v1/accounts`.
    - `TC_ACC_04`: Xóa tài khoản (Soft Delete chuyển `isArchived = true`, bảo toàn lịch sử giao dịch) qua `DELETE /api/v1/accounts/{id}`.
    - `TC_ACC_05`: Multi-tenant Isolation (User B không thể truy cập hoặc xóa tài khoản của User A, trả về 404 Not Found).
    - Cập nhật thông tin tài khoản thành công (`PUT /api/v1/accounts/{id}`).
    - Chặn tạo tài khoản trùng tên trong cùng một User (400 Bad Request kèm `BUSINESS_VALIDATION_ERROR`).
    - Chặn truy cập khi không có Bearer token (401 Unauthorized).
  - `backend/src/test/java/com/finman/controller/CategoryControllerTest.java`: Bộ Integration Test MockMvc 6 test cases:
    - `TC_CAT_01`: Lấy danh sách danh mục có sẵn của hệ thống (`GET /api/v1/categories`, 200 OK, >= 14 danh mục).
    - `TC_CAT_02`: Tạo danh mục cá nhân mới thành công (`POST /api/v1/categories`, 201 Created, `isDefault = false`).
    - `TC_CAT_03`: Ngăn chặn xóa danh mục mặc định của hệ thống (`DELETE /api/v1/categories/{id}`, 400 Bad Request).
    - Xóa danh mục cá nhân thành công (`DELETE /api/v1/categories/{id}`, 200 OK).
    - Lọc danh mục theo loại `?type=INCOME` hoặc `?type=EXPENSE`.
    - Chặn truy cập khi không có Bearer token (401 Unauthorized).
- **Nội dung công việc**: Hoàn tất 100% yêu cầu kiểm thử và nghiệm thu (DoD) của Phase 3, thiết lập hạ tầng test H2 in-memory độc lập cho backend, bảo đảm 100% test cases đạt chuẩn kiến trúc bảo mật Multi-tenant.
- **Kết quả kiểm thử**: PASS 100% —
  - `mvn test`: Chạy thành công toàn bộ **61/61 tests** (0 failures, 0 errors, 0 skipped) trong 16.0s (`BUILD SUCCESS`).
  - Frontend `npm run build`: 89 modules transformed thành công trong 1.13s (0 lỗi TypeScript / linting).
- **Trạng thái**: Completed (Chính thức đóng Phase 3).

### [2026-09-22] Task 4.1: Backend Transaction Service & APIs (@Transactional & Consistency)
- **Người thực hiện**: Agent
- **Yêu cầu từ kế hoạch**:
  - Triển khai logic ghi nhận giao dịch: `INCOME` (+ balance ví khả dụng), `EXPENSE` (- balance ví khả dụng).
  - Thẻ tín dụng (`CREDIT_CARD`): `EXPENSE` làm tăng dư nợ, `INCOME` làm giảm dư nợ.
  - Chỉnh sửa & Xóa giao dịch: Hoàn tác tác động cũ, áp dụng tác động mới chuẩn xác không sai lệch 1 đồng VNĐ.
  - Lọc giao dịch linh hoạt theo tháng (`month=YYYY-MM`), khoảng ngày (`startDate`, `endDate`), tài khoản, danh mục, loại thu/chi, từ khóa tìm kiếm (`search`), hỗ trợ phân trang `Pageable`.
  - Thống kê dòng tiền tóm tắt (`summary`): Tổng thu, tổng chi, thặng dư ròng `netCashFlow`.
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/main/java/com/finman/dto/request/TransactionCreateRequest.java`: DTO tạo giao dịch mới với validation (`@Positive`, `@NotNull`).
  - `backend/src/main/java/com/finman/dto/request/TransactionUpdateRequest.java`: DTO cập nhật giao dịch.
  - `backend/src/main/java/com/finman/dto/response/TransactionResponse.java`: DTO trả về thông tin giao dịch kèm snapshot tài khoản và danh mục.
  - `backend/src/main/java/com/finman/dto/response/TransactionSummaryResponse.java`: DTO thống kê dòng tiền tổng thể.
  - `backend/src/main/java/com/finman/repository/TransactionRepository.java`: Bổ sung kế thừa `JpaSpecificationExecutor<Transaction>`, query tính tổng theo ví và đếm số lượng.
  - `backend/src/main/java/com/finman/service/TransactionService.java`: Service nghiệp vụ `@Transactional` quản lý toàn bộ luồng tạo, sửa, xóa, hoàn tác số dư, phân trang và thống kê.
  - `backend/src/main/java/com/finman/controller/TransactionController.java`: REST controller `/api/v1/transactions` đầy đủ các endpoints (POST, GET, PUT, DELETE, GET /summary).
  - `backend/src/test/java/com/finman/service/TransactionServiceTest.java`: 9 Unit test cases bao phủ logic tính toán số dư.
  - `backend/src/test/java/com/finman/controller/TransactionControllerTest.java`: 11 MockMvc integration test cases bao phủ `TC_TXN_01` -> `TC_TXN_09`.
- **Kết quả kiểm thử**: PASS 100% —
  - `mvn test`: **81/81 tests passed** (0 failures, 0 errors, 0 skipped) trong 23.4s (`BUILD SUCCESS`).
  - Frontend `npm run build`: 90 modules transformed thành công trong 1.26s.
- **Trạng thái**: Completed.

### [2026-09-22] Task 4.2: Frontend Transactions Home Dashboard (Bóc tách từ Stitch Design)
- **Người thực hiện**: Agent
- **Yêu cầu từ kế hoạch**:
  - Bóc tách toàn diện desktop layout từ `design/finman_web_giao_d_ch_dashboard/code.html` sang `frontend/src/pages/dashboard/DashboardPage.tsx`.
  - Bộ 4 thẻ KPI tài chính cấp cao (Top-level KPI metrics strip):
    - Tổng số dư khả dụng (Net Available Balance) kèm nút ẩn/hiện số dư (eye toggle) đồng bộ với `localStorage`.
    - Tổng Thu nhập T9 (Total Income T9) hiển thị số tiền định dạng dấu chấm `+X.XXX.XXX ₫`.
    - Tổng Chi tiêu T9 (Total Expenses T9) hiển thị số tiền `-X.XXX.XXX ₫`.
    - Tỷ lệ tích lũy / Dòng tiền ròng (Savings Rate / Net Cash Flow) kèm đường dẫn tới báo cáo tài chính.
  - Thanh nhập liệu tự nhiên AI (Smart AI Natural Language prompt bar - PRD 32.1):
    - Nhập câu văn tiếng Việt tự nhiên hoặc bấm mic mô phỏng giọng nói.
    - Nút "Bóc tách" tự động trích xuất số tiền, phân loại thu/chi, danh mục, tài khoản và ghi chú.
    - Khay xem trước kết quả bóc tách (AI Parsed Drawer) với nút "Chỉnh sửa" và "Áp dụng & Lưu" chuyển hiệu ứng "Đã ghi nhận!".
  - Bố cục chia đôi màn hình chuẩn thiết kế (Desktop 65% / 35% Split Workspace):
    - **Cột trái (65%)**:
      - Bộ lọc thời gian: Hôm nay (16/09), Hôm qua, Tuần này, Tháng 9/2026, Tất cả.
      - Nút hành động nhanh: "Lọc nâng cao" và "Xuất XLSX".
      - Hàng lọc chi tiết: Pills danh mục và dropdown chọn tài khoản nguồn tiền.
      - Sổ nhật ký giao dịch nhóm theo ngày (Chronologically Grouped Ledger) kèm banner thống kê tổng thu/chi/dòng tiền ròng từng ngày.
      - Hàng giao dịch trực quan với icon danh mục, huy hiệu, thời gian, tài khoản, số tiền màu sắc, trạng thái "Hoàn tất" và nút sửa/xóa khi hover.
      - Tóm tắt footer: "Hiển thị X trên Y giao dịch" kèm liên kết "Xem sao kê đầy đủ".
      - Biểu đồ Dòng tiền Tuần 3 - Tháng 9 (Cashflow Trajectory Vector Chart) dựng bằng SVG inline với gradient vùng thu nhập và đường nét đứt chi tiêu.
    - **Cột phải (35%)**:
      - Danh sách nhanh tài khoản nguồn tiền (Quick Accounts list) với số dư định dạng dấu chấm phân cách hàng nghìn.
      - Hũ tích lũy mục tiêu (Goal Piggy Banks): Tiến độ MacBook Pro M3 (66%) và Quỹ khẩn cấp (25%).
      - Phân bổ Chi tiêu nhanh theo danh mục dạng thanh tiến trình trực quan.
- **Các file tạo mới / chỉnh sửa**:
  - `frontend/src/constants/transactions.ts`: Tạo mới danh sách giao dịch mẫu chuẩn thiết kế Stitch (Lương T9 +6M VCB, Quần Uniqlo -1M, Cà phê Highlands -90k, v.v.).
  - `frontend/src/constants/accounts.ts`: Cập nhật danh sách tài khoản mặc định đồng bộ số dư với Stitch dashboard (Vietcombank 4.910.000 ₫, Tiền mặt 1.500.000 ₫, Thẻ tín dụng Techcombank).
  - `frontend/src/pages/dashboard/DashboardPage.tsx`: Viết lại toàn diện theo đúng thiết kế Stitch Web Dashboard chuẩn Fintech Prestige.
  - `frontend/src/App.tsx`: Tích hợp `DEFAULT_TRANSACTIONS`, bổ sung hàm xóa giao dịch `handleDeleteTransaction` hoàn tác số dư và kết nối `onApplyAiTransaction`.
- **Kết quả kiểm thử**: PASS 100% —
  - Frontend `npm run build`: **91 modules transformed** thành công trong 1.25s (0 lỗi TypeScript, 0 cảnh báo lint).
- **Trạng thái**: Completed.

### [2026-09-22] Task 4.3: Frontend Add Transaction Modal (Bóc tách từ Stitch Design)
- **Người thực hiện**: Agent
- **Yêu cầu từ kế hoạch**:
  - Bóc tách toàn diện modal thêm giao dịch từ mã nguồn Stitch Web Desktop [design/finman_web_popup_th_m_giao_d_ch_m_i/code.html](file:///d:/FinMan/design/finman_web_popup_th_m_giao_d_ch_m_i/code.html) sang `frontend/src/components/modals/AddTransactionModal.tsx`.
  - Hỗ trợ chuyển đổi tab Chi tiêu / Thu nhập mượt mà (đổi màu chủ đạo Red sang Emerald).
  - Quick amount chips: 10k, 50k, 100k, 500k, 1M, 2M.
  - Phân loại danh mục theo icon trực quan, tự động tải danh mục thực tế từ backend.
  - Hỗ trợ tạo nhanh danh mục mới ngay trong modal qua `categoryService.createCategory`.
  - Phím tắt bàn phím: Enter để lưu, Escape để đóng.
- **Các file tạo mới / chỉnh sửa**:
  - `frontend/src/components/modals/AddTransactionModal.tsx`: Component modal glassmorphism hoàn chỉnh.
- **Kết quả kiểm thử**: PASS 100% — `npm run build` không lỗi, modal hiển thị đúng pixel theo Stitch.
- **Trạng thái**: Completed.

### [2026-09-22] Task 4.4: Frontend Calendar & Time Filtering (Lọc Thời Gian & Đồng Bộ Lịch Sử Giao Dịch)
- **Người thực hiện**: Agent
- **Yêu cầu từ kế hoạch**:
  - Tích hợp bộ lọc thời gian trực quan: 1 tháng, 3 tháng, 6 tháng, Tự chọn (Custom date range), và Toàn bộ (All).
  - Dropdown phân loại Thu/Chi, lọc theo Danh mục chi tiêu, và lọc theo Nguồn tiền (Tài khoản).
  - Đồng bộ số liệu KPI Header (Tổng số dư, Tổng thu, Tổng chi, Tỷ lệ tích lũy) và biểu đồ SVG Trajectory Chart theo thời gian thực tương ứng với khoảng lọc được chọn.
- **Các file tạo mới / chỉnh sửa**:
  - `frontend/src/pages/dashboard/DashboardPage.tsx`: Tích hợp các bộ lọc và logic tính toán động theo kỳ.
  - `frontend/src/components/layout/TopHeader.tsx`: Cung cấp thanh tìm kiếm toàn cục đồng bộ tức thì.
- **Kết quả kiểm thử**: PASS 100% — `npm run build` không lỗi, bộ lọc hoạt động mượt mà.
- **Trạng thái**: Completed.

### [2026-09-23] Task 4.5: Kết Nối Frontend Transactions Với Backend API (Full CRUD & Real-time Balance)
- **Người thực hiện**: Agent
- **Yêu cầu từ kế hoạch**:
  - Kết nối luồng dữ liệu 2 chiều giữa Frontend React và Backend REST APIs `/api/v1/transactions`.
  - Hỗ trợ toàn bộ chu trình CRUD giao dịch:
    - **Tạo mới**: `POST /api/v1/transactions` qua `AddTransactionModal` và qua AI Prompt bar (`onApplyAiTransaction`).
    - **Chỉnh sửa**: `PUT /api/v1/transactions/{id}`, tái sử dụng `AddTransactionModal` với chế độ pre-fill form ("Chỉnh sửa giao dịch" & "Lưu thay đổi"), hoàn tác số dư cũ và áp dụng số dư mới chính xác.
    - **Xóa**: `DELETE /api/v1/transactions/{id}` kèm hộp thoại xác nhận an toàn, hoàn trả số dư ví tức thì.
    - **Tải & Xem**: `GET /api/v1/transactions` với phân trang và mapping đầy đủ dữ liệu tài khoản (`currentBalance`), danh mục (`icon`, `color`), thời gian.
  - Tự động gọi `loadData()` re-fetch số dư ví và lịch sử giao dịch tức thì sau mỗi thao tác thêm/sửa/xóa.
- **Các file tạo mới / chỉnh sửa**:
  - `frontend/src/services/transactionService.ts`: Tinh chỉnh mapping fallback `account.currentBalance` và các methods CRUD.
  - `frontend/src/components/modals/AddTransactionModal.tsx`: Bổ sung props `editingTransaction`, `onUpdateTransaction`, effect đồng bộ form khi mở/sửa và nhãn nút cập nhật.
  - `frontend/src/pages/dashboard/DashboardPage.tsx`: Bổ sung prop `onEditTransaction` và kết nối nút Edit trên từng hàng giao dịch.
  - `frontend/src/App.tsx`: Tích hợp state `editingTransaction`, handlers `handleUpdateTransaction`, `handleOpenEditModal`, `handleCloseModal` và đồng bộ realtime toàn ứng dụng.
- **Kết quả kiểm thử**: PASS 100% —
  - `npm run build`: 90 modules transformed thành công trong 1.45s (0 TypeScript errors, 0 linter warnings).
- **Trạng thái**: Completed.

### [2026-09-23] Task 4.6: Tests Cho Core Transaction Engine & Balance Consistency (DoD 100%)
- **Người thực hiện**: Agent
- **Yêu cầu từ kế hoạch**:
  - Kiểm thử toàn diện module Core Transaction Engine theo ma trận [TEST_PLAN.md](file:///d:/FinMan/plans/TEST_PLAN.md):
    - `TC_TXN_01`: Thêm giao dịch Thu nhập (INCOME) tăng balance ví.
    - `TC_TXN_02`: Thêm giao dịch Chi tiêu (EXPENSE) giảm balance ví và tăng nợ Thẻ tín dụng.
    - `TC_TXN_03`: Chỉnh sửa số tiền giao dịch hoàn tác số tiền cũ và áp dụng số tiền mới.
    - `TC_TXN_04`: Chỉnh sửa đổi ví phát sinh giao dịch hoàn tác ví cũ và trừ ví mới.
    - `TC_TXN_05`: Xóa giao dịch Chi tiêu hoàn trả số dư ví.
    - `TC_TXN_06`: Xóa giao dịch Thu nhập khấu trừ lại số dư ví.
    - `TC_TXN_07`: Chặn số tiền không hợp lệ (số tiền <= 0, lệch loại danh mục).
    - `TC_TXN_08`: Tính toàn vẹn Database Transaction (Rollback khi gặp RuntimeException, bảo toàn số dư).
    - `TC_TXN_09`: Lọc giao dịch theo tháng & ngày kèm phân trang.
    - `TC_TXN_SUMMARY`, `TC_TXN_MULTI_TENANT`, `TC_TXN_SECURITY`.
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/test/java/com/finman/service/TransactionServiceTest.java`: Bổ sung test case `TC_TXN_08` mô phỏng ngoại lệ runtime và kích hoạt rollback.
  - `backend/src/test/java/com/finman/controller/TransactionControllerTest.java`: Bổ sung MockMvc test case `TC_TXN_08` xác nhận số dư ví không đổi khi giao dịch lỗi.
- **Kết quả kiểm thử**: PASS 100% —
  - Backend `mvn test`: **83/83 tests passed** (0 failures, 0 errors, 0 skipped) trong 27.9s (`BUILD SUCCESS`).
  - Frontend `npm run build`: Compile sạch 100% không lỗi.
- **Trạng thái**: Completed (Chính thức đóng Phase 4).

### [2026-09-25] Task 5.1: Backend Budget APIs (Upsert, Spending & Alert Engine)
- **Người thực hiện**: Agent
- **Yêu cầu từ kế hoạch**:
  - Xây dựng tầng DTO cho module Budget: `BudgetRequest`, `BudgetResponse` và `BudgetSummaryResponse`.
  - Triển khai enum `BudgetStatus` (`NORMAL`, `WARNING`, `OVERBUDGET`).
  - Xây dựng `BudgetService`:
    - Quản lý CRUD ngân sách theo tháng (`YYYY-MM`) và danh mục.
    - Cơ chế **Upsert**: Tự động cập nhật hạn mức nếu ngân sách cùng `(user_id, category_id, month)` đã tồn tại, hoặc tạo mới nếu chưa có (`TC_BDG_01`).
    - Chặn thiết lập ngân sách cho danh mục loại `INCOME` với thông điệp: `"Chỉ được đặt ngân sách cho danh mục chi tiêu"` (`TC_BDG_02`).
    - Tính toán tổng chi tiêu thực tế `spentAmount` trong tháng theo danh mục qua `TransactionRepository.sumAmountByUserIdAndCategoryIdAndDateBetween`.
    - Tính số tiền còn lại `remainingAmount`, số tiền vượt `overspentAmount` và tỷ lệ phần trăm `percentage`.
    - Gắn nhãn trạng thái cảnh báo trực quan:
      - `NORMAL`: Chi tiêu < 80% hạn mức (`TC_BDG_03`).
      - `WARNING`: Chi tiêu từ 80% đến 100% hạn mức (`TC_BDG_04`).
      - `OVERBUDGET`: Chi tiêu vượt quá 100% hạn mức (`TC_BDG_05`).
    - Đảm bảo kiểm tra phân quyền sở hữu người dùng chặt chẽ trên mọi thao tác xem, sửa, xóa (chống IDOR).
  - Xây dựng `BudgetController`:
    - `GET /api/v1/budgets?month=YYYY-MM`: Lấy danh sách ngân sách tháng kèm tiến độ chi tiêu.
    - `GET /api/v1/budgets/summary?month=YYYY-MM`: Lấy tổng quan ngân sách và tổng chi tiêu toàn tháng.
    - `GET /api/v1/budgets/{id}`: Xem chi tiết một ngân sách.
    - `POST /api/v1/budgets`: Thiết lập / Upsert ngân sách.
    - `PUT /api/v1/budgets/{id}`: Cập nhật hạn mức ngân sách.
    - `DELETE /api/v1/budgets/{id}`: Hủy thiết lập ngân sách.
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/main/java/com/finman/entity/enums/BudgetStatus.java`: Enum trạng thái cảnh báo ngân sách.
  - `backend/src/main/java/com/finman/dto/request/BudgetRequest.java`: DTO nhận yêu cầu tạo/sửa ngân sách.
  - `backend/src/main/java/com/finman/dto/response/BudgetResponse.java`: DTO phản hồi chi tiết tiến độ ngân sách.
  - `backend/src/main/java/com/finman/dto/response/BudgetSummaryResponse.java`: DTO tổng quan toàn bộ ngân sách theo tháng.
  - `backend/src/main/java/com/finman/service/BudgetService.java`: Service xử lý nghiệp vụ ngân sách, tính lũy kế chi tiêu và cảnh báo.
  - `backend/src/main/java/com/finman/controller/BudgetController.java`: REST API Controller với xác thực JWT và phân quyền.
  - `backend/src/test/java/com/finman/service/BudgetServiceTest.java`: Unit tests bao phủ đầy đủ các kịch bản `TC_BDG_01` đến `TC_BDG_05`, IDOR và validation.
  - `backend/src/test/java/com/finman/controller/BudgetControllerTest.java`: MockMvc integration tests kiểm thử các endpoints API, bảo mật và phân quyền.
- **Kết quả kiểm thử**: PASS 100% —
  - `BudgetServiceTest` (9 tests) & `BudgetControllerTest` (5 tests): **14/14 tests PASSED**.
  - Toàn bộ backend test suite: **97/97 tests PASSED** (0 failures, 0 errors, 0 skipped) trong 20.5s (`BUILD SUCCESS`).
- **Trạng thái**: Completed.

### [2026-09-25] Task 5.2 & Task 5.3: Frontend Budget Screen & API Integration (Stitch Design 100%)
- **Người thực hiện**: Agent
- **Yêu cầu từ kế hoạch**:
  - Bóc tách toàn diện desktop layout từ `design/finman_web_qu_n_l_ng_n_s_ch/code.html` sang `frontend/src/pages/budget/BudgetPage.tsx`.
  - Bộ thẻ KPI sức khỏe ngân sách cấp cao (Primary Budget Health Dashboard):
    - Hạn mức chi tiêu tổng thể + Badge "Mức độ an toàn: X%" (`verified_user`).
    - Thanh đo tiến độ đa đoạn (Multi-Segment Progress Indicator) với tỷ lệ đã sử dụng (%) và khả dụng còn lại (VNĐ).
    - Dải Quick Metrics Ribbon (3 thẻ): Đã giải ngân tháng này, Chi tiêu dự kiến/ngày còn lại (~ X đ/ngày), Tình trạng danh mục (Chạm trần / Cảnh báo / An toàn).
    - Thẻ tốc độ & dự báo chi tiêu hàng ngày (Daily Allowed Rate & AI Insight callout).
  - Bố cục chia đôi chuẩn Stitch Web (7 cột Danh mục / 5 cột Lịch chi tiêu):
    - **Cột trái (7 cols)**:
      - Bộ lọc tab danh mục: "Tất cả", "Cảnh báo (X)", "An toàn (Y)".
      - Thẻ ngân sách danh mục: Icon danh mục, huy hiệu trạng thái (An toàn / Sắp chạm ngưỡng / Hết hạn mức), số tiền đã tiêu / hạn mức, phần trăm và số tiền còn lại hoặc vượt trần.
      - Thanh tiến độ đổi màu trực quan: Xanh (< 80%), Vàng (80-100%), Đỏ (> 100%).
      - Thẻ cảnh báo nổi bật (Distinct Warning Notice) khi chạm trần / vượt hạn mức kèm nút "Nâng quỹ +500k".
      - Nút sửa / xóa ngân sách linh hoạt trên từng danh mục.
    - **Cột phải (5 cols)**:
      - Lịch chi tiêu tương tác trực quan theo tháng (`selectedMonth`).
      - Ma trận ngày hiển thị dòng tiền thực tế (`+X`, `-Y`).
      - Chọn ngày trên lịch để xem sổ nhật ký chi tiết (Drilldown Ledger) các giao dịch trong ngày đã chọn.
  - Modal Glassmorphism Thiết lập / Chỉnh sửa ngân sách mới:
    - Chọn danh mục, chọn tháng, nhập số tiền định dạng dấu chấm phân cách hàng nghìn.
    - Quick Amount Chips: 500k, 1M, 2M, 5M.
    - Bắt lỗi validation trực tiếp và hiển thị banner cảnh báo.
  - Tích hợp 100% Backend REST APIs qua `frontend/src/services/budgetService.ts`:
    - `budgetService.getBudgets(selectedMonth)`
    - `budgetService.getBudgetSummary(selectedMonth)`
    - `budgetService.setBudget(...)` (Upsert & Quick Boost +500k)
    - `budgetService.deleteBudget(id)`
  - Toast notification thông báo kết quả thao tác mượt mà.
- **Các file tạo mới / chỉnh sửa**:
  - `frontend/src/types/index.ts`: Bổ sung các trường `amount`, `remainingAmount`, `overspentAmount`, `percentage`, `status` cho interface `Budget`.
  - `frontend/src/services/budgetService.ts`: Xây dựng service gọi các endpoints `/api/v1/budgets`.
  - `frontend/src/pages/budget/BudgetPage.tsx`: Bóc tách và hoàn thiện toàn bộ giao diện Stitch Web Budget.
- **Kết quả kiểm thử**: PASS 100% —
  - `npm run build`: **91 modules transformed** thành công trong 1.58s (0 TypeScript errors, 0 linter warnings).
  - Toàn bộ 97 backend tests duy trì PASS 100%.
- **Trạng thái**: Completed.

### [2026-09-25] Task 5.4: Tests Cho Budget Logic (Unit & Integration Tests)
- **Người thực hiện**: Agent
- **Yêu cầu từ kế hoạch**:
  - Kiểm thử test cases `TC_BDG_01` đến `TC_BDG_05` bao phủ toàn diện:
    - `TC_BDG_01`: Thiết lập ngân sách danh mục chi tiêu & cơ chế Upsert khi đã tồn tại.
    - `TC_BDG_02`: Chặn tạo ngân sách cho danh mục Thu nhập (`INCOME`) với HTTP 400 và lỗi tương ứng.
    - `TC_BDG_03`: Kiểm thử trạng thái bình thường `NORMAL` (< 80%), tính đúng `remainingAmount` và `percentage`.
    - `TC_BDG_04`: Kiểm thử trạng thái sắp chạm ngưỡng `WARNING` (80% - 100%).
    - `TC_BDG_05`: Kiểm thử trạng thái vượt hạn mức `OVERBUDGET` (> 100%) và tính đúng `overspentAmount`.
    - `TC_BDG_VALIDATION`: Chặn số tiền `<= 0` hoặc định dạng tháng không hợp lệ.
    - `TC_BDG_SUMMARY`: Tính toán tổng quan ngân sách tháng (tổng hạn mức, đã chi, còn lại, %).
    - `TC_BDG_MULTI_TENANT`: Kiểm thử chống can thiệp trái phép ngân sách người dùng khác (IDOR protection).
  - Tầng API Controller (`BudgetControllerTest`):
    - Kiểm thử các endpoints `GET`, `POST`, `DELETE /api/v1/budgets` và `/summary`.
    - Kiểm thử phân quyền JWT token (401 khi thiếu token, 404 khi cố xóa dữ liệu người dùng khác).
- **Các file kiểm thử**:
  - `backend/src/test/java/com/finman/service/BudgetServiceTest.java`: 9 unit tests.
  - `backend/src/test/java/com/finman/controller/BudgetControllerTest.java`: 5 integration tests.
- **Kết quả kiểm thử**: PASS 100% —
  - `BudgetServiceTest`: 9/9 tests PASSED (3.05s).
  - `BudgetControllerTest`: 5/5 tests PASSED (16.53s).
  - Toàn bộ backend test suite duy trì PASS 100%.
- **Trạng thái**: Completed.

### [2026-09-25] Task 6.1: Backend Gemini AI Client & Structured Prompt Engine
- **Người thực hiện**: Agent
- **Yêu cầu từ kế hoạch**:
  - Cấu hình Spring REST Client (`RestClient`) gọi Google Gemini API (`gemini-2.0-flash`) với structured prompt bóc tách ngôn ngữ tự nhiên tiếng Việt ra JSON chuẩn.
  - Tự động map dữ liệu bóc tách được với danh mục khả dụng và tài khoản thực tế của người dùng trong cơ sở dữ liệu.
  - Tích hợp bộ giải mã NLP tiếng Việt cục bộ (Local Vietnamese Financial NLP Engine) làm fallback an toàn khi offline, thiếu API key hoặc khi Gemini gặp sự cố, đảm bảo không làm gián đoạn ứng dụng.
  - Xử lý các kịch bản ngoại lệ: mất kết nối, timeout, rate limit (HTTP 429) ném `AppException` với mã lỗi `AI_SERVICE_UNAVAILABLE` (chuẩn `TC_AI_06`).
  - Kiểm tra câu không có số tiền hoặc không hợp lệ ném `BusinessValidationException` với thông báo thân thiện (chuẩn `TC_AI_04`).
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/main/java/com/finman/dto/request/AiQuickAddRequest.java`: DTO nhận câu lệnh văn bản tự nhiên.
  - `backend/src/main/java/com/finman/dto/response/AiQuickAddResponse.java`: DTO trả về kết quả bóc tách kèm ID danh mục và ví tương ứng.
  - `backend/src/main/java/com/finman/dto/response/AiInsightsResponse.java`: DTO báo cáo nhận xét chi tiêu hàng tháng.
  - `backend/src/main/java/com/finman/config/GeminiConfig.java`: Spring `@Configuration` quản lý API key, model `gemini-2.0-flash`, base URL và `RestClient` bean với timeout 10s/25s.
  - `backend/src/main/java/com/finman/client/GeminiClient.java` & `GeminiClientImpl.java`: Client gọi endpoint `generateContent` với `responseMimeType: application/json`, loại bỏ markdown code fence.
  - `backend/src/main/java/com/finman/service/AiService.java`: Dịch vụ AI lõi bóc tách giao dịch, ánh xạ danh mục/ví, tạo nhận xét tài chính hàng tháng.
  - `backend/src/test/java/com/finman/service/AiServiceTest.java`: Bộ test suite 8 tests bao phủ toàn diện `TC_AI_01` đến `TC_AI_06`.
- **Kết quả kiểm thử**: PASS 100% —
  - `AiServiceTest`: **8/8 tests PASSED** (1.56s).
  - Toàn bộ backend test suite: **105/105 tests PASSED** (0 failures, 0 errors, 0 skipped) trong 19.8s (`BUILD SUCCESS`).
- **DoD Checklist**: Bóc tách chính xác câu `"Ăn bún bò 45k bằng tiền mặt"` thành `type: EXPENSE`, `amount: 45000`, `category: Ăn uống`, `account: Tiền mặt`, `note: bún bò`.
- **Trạng thái**: Completed.

### [2026-09-28] Task 6.2: Backend Quick-Add & Spending Insights APIs
- **Người thực hiện**: Agent
- **Yêu cầu từ kế hoạch**:
  - Triển khai endpoint `POST /api/v1/ai/quick-add` nhận dạng ngôn ngữ tự nhiên tiếng Việt, bóc tách và trả về dữ liệu form điền sẵn giao dịch tài chính (`AiQuickAddResponse`).
  - Triển khai endpoint `POST /api/v1/ai/insights` và `GET /api/v1/ai/insights` phân tích tình hình tài chính tháng `YYYY-MM`, đưa ra nhận xét tổng quan và ít nhất 2 lời khuyên tiết kiệm thiết thực bằng tiếng Việt.
  - Tích hợp gọi Google Gemini API khi có cấu hình API Key và tự động fallback sang bộ xử lý tài chính rule-based cục bộ khi offline hoặc khi mạng gián đoạn, đảm bảo không bao giờ crash ứng dụng.
  - Phân quyền bảo mật JWT bắt buộc cho toàn bộ `/api/v1/ai/**`, kiểm tra chặt chẽ `user_id` của phiên đăng nhập.
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/main/java/com/finman/dto/request/AiInsightsRequest.java`: DTO nhận tham số tháng phân tích với validation pattern `YYYY-MM`.
  - `backend/src/main/java/com/finman/service/AiService.java`: Cập nhật `generateMonthlyInsights` tích hợp Google Gemini API prompt phân tích tài chính kèm fallback an toàn.
  - `backend/src/main/java/com/finman/controller/AiController.java`: Controller xử lý `/api/v1/ai/quick-add`, `/api/v1/ai/insights` (POST & GET).
  - `backend/src/test/java/com/finman/controller/AiControllerTest.java`: Bộ test suite 10 integration tests bao phủ trọn vẹn các kịch bản quick-add, insights (body, query param, default), validation và JWT security.
- **Kết quả kiểm thử**: PASS 100% —
  - `AiControllerTest`: **10/10 tests PASSED** (9.14s).
  - Toàn bộ backend test suite: **115/115 tests PASSED** (0 failures, 0 errors, 0 skipped) trong 19.6s (`BUILD SUCCESS`).
- **DoD Checklist**: Trả về form đã điền sẵn cho Quick Add và nhận xét chi tiêu hữu ích bằng tiếng Việt.
- **Trạng thái**: Completed.

### [2026-09-28] Task 6.3: Frontend AI Assistant Screen (Bóc tách từ Stitch)
- **Người thực hiện**: Agent
- **Yêu cầu từ kế hoạch**:
  - Tái sử dụng giao diện trợ lý ảo AI trên nền tảng Web Desktop theo thiết kế Fintech Prestige.
  - Xây dựng luồng hội thoại chat trực quan với bong bóng chat thông minh, typing indicator và hỗ trợ giọng nói Web Speech.
  - Tích hợp Card xem trước giao dịch bóc tách tự động: hiển thị loại, số tiền, danh mục, ví, ngày, cho phép chỉnh sửa nhanh inline và bấm "Áp dụng & Lưu vào lịch sử giao dịch" trực tiếp từ màn hình chat.
  - Tích hợp Card báo cáo tài chính tháng: tổng thu, tổng chi, thặng dư/thâm hụt, bài nhận xét phân tích từ Gemini và danh sách các lời khuyên tiết kiệm thiết thực.
  - Nối khung nhập liệu AI tại màn hình Dashboard sang Backend `aiService.quickAdd` để loại bỏ regex tĩnh cũ, có loading spinner và cơ chế fallback an toàn.
- **Các file tạo mới / chỉnh sửa**:
  - `frontend/src/services/aiService.ts`: Service frontend kết nối `/api/v1/ai/quick-add` và `/api/v1/ai/insights`.
  - `frontend/src/services/accountService.ts`: Bổ sung hàm `getAccounts()`.
  - `frontend/src/pages/ai/AIAssistantPage.tsx`: Màn hình trợ lý ảo AI hoàn chỉnh với dual-rail layout, chat stream, transaction preview cards, monthly insights cards và snapshot panel.
  - `frontend/src/pages/dashboard/DashboardPage.tsx`: Cập nhật `handleAiParse` gọi Backend `aiService.quickAdd`.
  - `frontend/src/App.tsx`: Cung cấp `accounts`, `categories`, `onApplyAiTransaction` và `onRefreshData` vào `AIAssistantPage`.
- **Kết quả kiểm thử**: PASS 100% —
  - `npm run build`: Compile sạch 0 lỗi TypeScript, Vite bundle production thành công trong 2.03s.
  - Backend AI tests: **18/18 tests PASSED** (`AiControllerTest` 10/10, `AiServiceTest` 8/8).
- **DoD Checklist**: Trải nghiệm nhập liệu bằng AI trực quan, thân thiện, người dùng chỉ cần gõ 1 câu là xong.
- **Trạng thái**: Completed.

### [2026-09-28] Task 6.4: Tests Cho Google Gemini AI (Backend & Integration)
- **Người thực hiện**: Agent
- **Yêu cầu từ kế hoạch**:
  - Kiểm thử test cases `TC_AI_01` đến `TC_AI_06` (bao gồm câu có dấu, không dấu, câu rác và lỗi mạng).
  - Kiểm tra mở rộng cho tính năng nhận diện đa giao dịch trong 1 câu (multi-transactions batch) và phân loại ý định hội thoại (Query Intent / Quick Add Intent).
  - Tích hợp kiểm thử toàn diện controller `AiControllerTest` cho các endpoint `/api/v1/ai/quick-add`, `/api/v1/ai/insights` (POST & GET), `/api/v1/ai/chat`, `/api/v1/ai/query`, `/api/v1/ai/status`.
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/test/java/com/finman/service/AiServiceTest.java`: 12 unit tests bao phủ `TC_AI_01` đến `TC_AI_06`, multi-item parsing, exception fallback an toàn, Gemini mock JSON parsing, routing intent.
  - `backend/src/test/java/com/finman/controller/AiControllerTest.java`: 15 integration tests bao phủ trọn vẹn xác thực JWT, HTTP status code, validate body, query params, `POST /api/v1/ai/chat`, `POST /api/v1/ai/query`, và `GET /api/v1/ai/status`.
- **Kết quả kiểm thử**: PASS 100% —
  - `AiServiceTest`: **12/12 tests PASSED** (1.21s).
  - `AiControllerTest`: **15/15 tests PASSED** (18.31s).
  - Tổng số test AI: **27/27 tests PASSED** (0 failures, 0 errors, 0 skipped).
  - Toàn bộ backend test suite: **124/124 tests PASSED** (`BUILD SUCCESS` trong 35.2s).
  - Frontend: `npm run lint` 0 errors, `npm run build` thành công xuất sắc.
- **DoD Checklist**: Tất cả các kịch bản AI đều được xử lý an toàn, 100% test cases đạt PASS.
- **Trạng thái**: Completed.

### [2026-09-28] Task 7.1: Backend Profile & Settings APIs (Profile, Đổi Mật Khẩu & Logout)
- **Người thực hiện**: Agent
- **Yêu cầu từ kế hoạch**:
  - Triển khai endpoint `GET /api/v1/users/profile` và `GET /api/v1/users/me` lấy thông tin tài khoản người dùng hiện tại (ID, email, họ tên, ảnh đại diện avatarUrl, role).
  - Triển khai endpoint `PUT /api/v1/users/profile` cho phép cập nhật thông tin cá nhân (`fullName`, `avatarUrl`) với validation chặt chẽ.
  - Triển khai endpoint `POST /api/v1/users/change-password` (và `PUT /api/v1/users/change-password`) xác thực mật khẩu hiện tại bằng `PasswordEncoder`, chống đổi mật khẩu mới trùng mật khẩu cũ (`NEW_PASSWORD_SAME_AS_OLD`), kiểm tra khớp mật khẩu xác nhận (`PASSWORD_CONFIRMATION_MISMATCH`), validate độ dài tối thiểu 6 ký tự và tối đa 50 ký tự.
  - Triển khai endpoint `POST /api/v1/users/logout` ghi nhận hành vi đăng xuất an toàn trên máy chủ.
  - Áp dụng kiểm tra bảo mật `@AuthenticationPrincipal UserPrincipal`, ngăn chặn hoàn toàn IDOR.
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/main/java/com/finman/dto/request/UpdateProfileRequest.java`: DTO nhận họ tên và avatarUrl với `@Size`.
  - `backend/src/main/java/com/finman/dto/request/ChangePasswordRequest.java`: DTO nhận currentPassword, newPassword, confirmPassword.
  - `backend/src/main/java/com/finman/service/UserService.java`: Service xử lý logic đổi mật khẩu an toàn, cập nhật profile và ghi log đăng xuất.
  - `backend/src/main/java/com/finman/controller/UserController.java`: Controller cung cấp đầy đủ các endpoints `/profile`, `/change-password`, `/logout`.
  - `backend/src/test/java/com/finman/service/UserServiceTest.java`: 8 unit tests bao phủ mọi kịch bản nghiệp vụ.
  - `backend/src/test/java/com/finman/controller/UserControllerTest.java`: 12 integration tests kiểm thử MockMvc và JWT security.
- **Kết quả kiểm thử**: PASS 100% —
  - `UserServiceTest`: **8/8 tests PASSED** (0.39s).
  - `UserControllerTest`: **12/12 tests PASSED** (16.40s).
  - Toàn bộ backend test suite: **144/144 tests PASSED** (`BUILD SUCCESS` trong 33.1s).
- **DoD Checklist**: Đổi thông tin thành công, kiểm tra mật khẩu cũ trước khi đổi mật khẩu mới, kiểm thử bao phủ toàn diện.
- **Trạng thái**: Completed.

### [2026-09-28] Task 7.2: Frontend Settings Screen (Bóc Tách Từ Stitch Web Settings)
- **Người thực hiện**: Agent
- **Yêu cầu từ kế hoạch**:
  - Xây dựng giao diện Cài đặt Web Desktop theo thiết kế Fintech Prestige chuẩn mực:
    - Profile Card: Hiển thị Avatar, Họ tên, Email, Badges vai trò người dùng.
    - Hệ thống chuyển Tab trực quan: **Thông tin cá nhân (Profile)**, **Bảo mật & Mật khẩu (Security)**, **Danh mục thu chi (Categories)**.
    - Bộ chọn Avatar thông minh: Hỗ trợ 8 Preset Avatar phong phú (Felix, Aneka, Aiden, Zoe, Leo, FinBot, doanh nhân) kèm tùy chọn nhập Custom Image URL.
    - Form đổi mật khẩu: Nhập mật khẩu hiện tại, mật khẩu mới, xác nhận mật khẩu; nút con mắt bật/tắt hiển thị mật khẩu; thanh đo độ mạnh mật khẩu realtime; banner thông báo phản hồi lỗi / thành công tiếng Việt rõ ràng.
    - Quản lý danh mục: Danh sách phân loại Thu / Chi, thanh tìm kiếm danh mục, Modal tạo mới danh mục kèm bộ chọn biểu tượng Material Symbols và 8 bảng màu preset hiện đại.
    - Hộp thoại Modal xác nhận đăng xuất an toàn (Logout Confirmation Dialog).
- **Các file tạo mới / chỉnh sửa**:
  - `frontend/src/services/userService.ts`: Client gọi `/api/v1/users/profile`, `/api/v1/users/change-password`, `/api/v1/users/logout`.
  - `frontend/src/context/AuthContext.tsx`: Bổ sung hàm `updateUser`, hook tự động đồng bộ profile với backend khi khởi tạo, xử lý dọn dẹp token và chuyển hướng khi logout.
  - `frontend/src/pages/settings/SettingsPage.tsx`: Màn hình Cài đặt hoàn chỉnh (1.137 dòng code) tích hợp toàn bộ tính năng và logic kết nối backend.
- **Kết quả kiểm thử**: PASS 100% —
  - `npm run build`: Vite build hoàn tất thành công trong 2.82s (`dist/index.html`, `dist/assets/*`).
  - `npm run lint`: 0 errors.
- **DoD Checklist**: Màn hình cài đặt hiển thị đầy đủ tính năng, hoạt động đồng bộ với Backend API.
- **Trạng thái**: Completed.

### [2026-09-28] Task 7.3: Tối Ưu Trải Nghiệm Web Responsive & Performance
- **Người thực hiện**: Agent
- **Yêu cầu từ kế hoạch**:
  - Tinh chỉnh layout Web responsive từ Desktop siêu rộng (1600px canvas) xuống Laptop (1200px), Tablet (768px - 1024px) và Mobile viewport.
  - Tối ưu hóa các hiệu ứng hover, transition, active ring và micro-animations.
  - Khắc phục lỗi build TypeScript (`setNewCatBgColor`), dọn dẹp các warnings và đảm bảo tốc độ tải trang nhanh, không giật lag.
- **Các file tạo mới / chỉnh sửa**:
  - `frontend/src/pages/settings/SettingsPage.tsx`: Khắc phục triệt để lỗi TS2552, tối ưu layout lưới responsive `grid-cols-1 md:grid-cols-2`.
  - `frontend/src/App.tsx`: Tối ưu định tuyến `/cai-dat-va-danh-muc` và căn lề linh hoạt giữa các view.
- **Kết quả kiểm thử**: PASS 100% — `npm run build` đạt tốc độ 2.82s, tải trang tức thì.
- **DoD Checklist**: Trải nghiệm mượt mà trên mọi kích thước màn hình, hiệu năng đạt chuẩn.
- **Trạng thái**: Completed.

### [2026-09-28] Task 7.4: Kiểm Tra Đối Chiếu Toàn Diện Với Thiết Kế Stitch Web
- **Người thực hiện**: Agent
- **Yêu cầu từ kế hoạch**:
  - Đối chiếu toàn diện giao diện thực tế với quy chuẩn thiết kế Stitch Web (`design/`):
    - Tone màu Fintech Prestige: Chủ đạo Deep Navy / Royal Indigo, Teal / Mint accents, Neutral slate surfaces.
    - Typography chuẩn Plus Jakarta Sans / Inter với phân cấp nhãn (`font-headline`, `font-body`, `font-label`).
    - Hệ thống layout Dual-rail sidebar đồng bộ (Sidebar 288px cố định, TopHeader 80px cố định, Main stage `pl-72 pt-20`).
- **Các file kiểm tra**:
  - Toàn bộ các trang Web: Dashboard, Quản lý ngân sách, Tài khoản & Tài sản, Trợ lý AI, Cài đặt hệ thống.
- **Kết quả kiểm thử**: PASS 100% — Giao diện đồng nhất, trực quan và đạt chuẩn thẩm mỹ cao cấp.
- **DoD Checklist**: Chuẩn xác 100% về bảng màu, typography và bố cục thiết kế.
- **Trạng thái**: Completed.

### [2026-09-29] Task 8.1: Backend Aggregation & Apache POI Excel Export Service
- **Người thực hiện**: Agent
- **Yêu cầu từ kế hoạch**:
  - Viết query tổng hợp số liệu thu/chi theo danh mục và service xuất file `.xlsx` lịch sử giao dịch.
  - Xây dựng service tổng hợp dữ liệu tài chính (Backend Aggregation) cung cấp số liệu dòng tiền, phân bổ danh mục, xu hướng theo ngày, top khoản chi.
  - Xây dựng endpoint `/api/v1/export/excel` stream file Excel chuẩn về client với Unicode tiếng Việt và định dạng tiền tệ chuyên nghiệp.
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/main/java/com/finman/service/StatisticsService.java`: Service tính toán tổng quan thống kê, phân bổ danh mục theo tỷ lệ % và xu hướng dòng tiền theo ngày.
  - `backend/src/main/java/com/finman/controller/StatisticsController.java`: Controller cung cấp các endpoint `/api/v1/statistics/overview`, `/api/v1/statistics/categories`, `/api/v1/statistics/daily`.
  - `backend/src/main/java/com/finman/service/ExportService.java`: Cập nhật truy vấn phân bổ danh mục đồng bộ với bộ lọc tài khoản và loại giao dịch.
  - `backend/src/main/java/com/finman/controller/ExportController.java`: Endpoint `/api/v1/export/excel` tải file Excel `.xlsx` gồm 2 sheet ("Lịch sử Giao dịch" và "Tổng hợp theo Danh mục").
  - `backend/src/main/java/com/finman/repository/TransactionRepository.java`: Nâng cấp các truy vấn tổng hợp `aggregateByCategory`, `aggregateDailyCashflow`, `findTopTransactionsByType`.
  - `backend/src/main/java/com/finman/config/SecurityConfig.java`: Bổ sung header `Content-Disposition` vào danh sách `exposedHeaders` CORS.
  - `backend/src/test/java/com/finman/service/ExportServiceTest.java`: Unit tests kiểm tra tính toàn vẹn của file Excel bằng thư viện Apache POI (`TC_EXP_01`, `TC_EXP_02`).
  - `backend/src/test/java/com/finman/controller/ExportControllerTest.java`: Integration tests kiểm tra endpoint `/api/v1/export/excel`, mã phản hồi 200, Content-Type, Content-Disposition và tính bảo mật multi-tenant.
  - `backend/src/test/java/com/finman/service/StatisticsServiceTest.java`: Unit tests cho các hàm tính toán tỷ lệ thặng dư, tỷ trọng danh mục và xu hướng ngày.
  - `backend/src/test/java/com/finman/controller/StatisticsControllerTest.java`: Integration tests cho các endpoint `/api/v1/statistics`.
- **Kết quả kiểm thử**: PASS 100% — Toàn bộ 157/157 tests của backend đều vượt qua (`BUILD SUCCESS`).
- **DoD Checklist**: Endpoint `/api/v1/export/excel` stream file Excel chuẩn về client, dữ liệu tiếng Việt Unicode không bị lỗi, các query thống kê hoạt động chính xác.
- **Trạng thái**: Completed.

### [2026-09-29] Task 8.2: Frontend Statistics Screen (Bóc tách từ Stitch)
- **Người thực hiện**: Agent
- **Yêu cầu từ kế hoạch**:
  - Đọc trực tiếp từ Stitch Web: `design/finman_web_th_ng_k_b_o_c_o/code.html`.
  - Tái tạo trọn vẹn màn hình Thống kê & Báo cáo chuẩn Fintech Prestige:
    - Sub-Navigation Tabs: Thống kê tổng hợp, Phân tích Thu - Chi, Dòng tiền theo thời gian.
    - Bộ lọc chu kỳ linh hoạt: Tuần, Tháng, Hàng năm, Tùy chọn ngày (`PeriodFilter`).
    - Thẻ Financial Health Banner (AI Intelligence Banner) với % thặng dư dòng tiền và 3 Highlight Pillars: Dòng tiền thuần, Tổng thu nhập, Tổng chi tiêu.
    - Biểu đồ Cashflow Trend SVG mượt mà với vùng gradient, trần chi tiêu, đường cong bezier và đỉnh chi tiêu tương tác.
    - Biểu đồ tròn Donut Chart SVG phân bổ tỷ trọng chi tiêu kèm danh sách chi tiết các danh mục chính.
    - Thanh đo tiến độ hạn mức chi tiêu từng hạng mục (Category Threshold Progress Bars) với cảnh báo vượt ngưỡng an toàn.
    - Bảng xếp hạng Top khoản chi lớn nhất (Top Expense Ranking Ledger Card) kiểm soát chi tiêu trọng yếu.
    - Thẻ khuyến nghị tài chính thông minh từ FinMan AI Engine.
- **Các file tạo mới / chỉnh sửa**:
  - `frontend/src/pages/statistics/StatisticsPage.tsx`: Thành phần giao diện Thống kê & Báo cáo hoàn chỉnh.
- **Kết quả kiểm thử**: PASS 100% — Build frontend `npm run build` thành công, không phát sinh lỗi lint hay TypeScript (`vite v8.3.0 building for production... ✓ built`).
- **DoD Checklist**: Biểu đồ hiển thị sắc nét, đồng bộ màu sắc và trải nghiệm với thiết kế Stitch Web.
- **Trạng thái**: Completed.

### [2026-09-29] Task 8.3: Kết Nối Frontend Statistics & Tải File Excel
- **Người thực hiện**: Agent
- **Yêu cầu từ kế hoạch**:
  - Xây dựng service gọi API thống kê tổng hợp và kích hoạt tải file `.xlsx` trực tiếp về trình duyệt.
  - Kết nối nút "Xuất Báo cáo Excel (.xlsx)" trên cả thanh công cụ `TopHeader` và trang `StatisticsPage`.
- **Các file tạo mới / chỉnh sửa**:
  - `frontend/src/services/statisticsService.ts`: Cung cấp các hàm `getOverview`, `getCategories`, `getDailyTrends`, `exportExcel`.
  - `frontend/src/App.tsx`: Tích hợp gọi `statisticsService.exportExcel()` từ nút "Excel" trên `TopHeader`.
  - `frontend/src/pages/statistics/StatisticsPage.tsx`: Tích hợp nạp dữ liệu thống kê từ backend với cơ chế dự phòng tự động tính toán từ danh sách giao dịch; hỗ trợ nút tải Excel kèm trạng thái loading spinner và thông báo thành công.
- **Kết quả kiểm thử**: PASS 100% — Giao tiếp API trơn tru, tải file nhị phân blob Excel mượt mà và tự động đặt tên file định dạng `FinMan_BaoCao_TaiChinh_YYYYMM.xlsx`.
- **DoD Checklist**: Tải về file Excel mở được trên máy tính với dữ liệu tiếng Việt chuẩn Unicode, số liệu đồng bộ chính xác.
### [2026-09-29] Task 8.2 & 8.3 (Refinement): Tối Ưu Màn Hình Thống Kê & Liên Kết Biểu Đồ - Lịch Chi Tiêu
- **Người thực hiện**: Agent
- **Yêu cầu từ người dùng**:
  - Chuyển đổi biểu đồ dòng tiền sang biểu đồ 2 đường (Thu nhập & Chi tiêu) với nhãn cố định `T2 - CN`, căn chỉnh thẳng hàng 100% với các điểm nút SVG.
  - Đưa component Lịch chi tiêu (`Spending Calendar`) từ `BudgetPage` sang `StatisticsPage`.
  - Tối ưu lại `BudgetPage`: Gỡ bỏ lịch chi tiêu để mở rộng danh sách danh mục ngân sách ra toàn màn hình dạng lưới 2 cột (`grid grid-cols-1 lg:grid-cols-2 gap-space-md`), loại bỏ API call `monthTransactions` dư thừa.
  - Tối giản `StatisticsPage`: Gỡ bỏ thanh Sub-Nav/bộ lọc trên cùng và thẻ chi tiết giao dịch cố định bên dưới theo yêu cầu người dùng.
  - Thêm nút "Xem chi tiết" và Popup Modal kính mờ (backdrop-blur) hiển thị danh sách giao dịch theo ngày, tóm tắt tổng thu/chi trong ngày.
  - Liên kết 2 chiều thông minh giữa Lịch chi tiêu và Biểu đồ tuần: khi chọn ngày nào trên lịch (kể cả khác tháng), biểu đồ tuần bên trái lập tức hiển thị tuần chứa ngày đó (từ T2 đến CN) và highlight trực quan ngày được chọn; ngược lại, click vào cột ngày trên biểu đồ cũng nhảy ngày trên lịch.
- **Các file chỉnh sửa**:
  - `frontend/src/pages/statistics/StatisticsPage.tsx`: Cập nhật logic liên kết động 2 chiều, popup modal xem giao dịch ngày, biểu đồ 2 đường SVG căn chuẩn T2 - CN.
  - `frontend/src/pages/budget/BudgetPage.tsx`: Mở rộng layout danh mục ngân sách full-width lưới 2 cột, dọn dẹp các state và service không dùng.
- **Kết quả kiểm thử**: PASS 100% — `npm run build` thành công xuất sắc (Exit code 0, 0 lỗi TypeScript).
- **DoD Checklist**: Biểu đồ hiển thị sắc nét, đồng bộ nhịp nhàng với lịch chi tiêu, thao tác mượt mà, layout 2 trang cân đối chuẩn Fintech Prestige.
- **Trạng thái**: Completed.

### [2026-09-29] Task 8.2 & 8.3 (Refinement 2): Tích Hợp Popover Chọn Tháng & Năm Trên Lịch Chi Tiêu Trang Thống Kê
- **Người thực hiện**: Agent
- **Yêu cầu từ người dùng**:
  - Xử lý tương tác khi bấm vào nút "Tháng" trên thanh điều hướng `< Tháng >` của thẻ Lịch chi tiêu: mở popover chọn Tháng và Năm giống hệt bên trang Ngân sách.
  - Hỗ trợ đổi năm nhanh qua nút Chevron trước/sau hoặc dropdown chọn năm (2015-2045).
  - Lưới 12 tháng trực quan (Tháng 1 đến Tháng 12) với tháng đang chọn được highlight nền đỏ (`bg-primary text-white`), chấm xanh báo hiệu tháng thực tế.
  - Phím tắt "Tháng hiện tại" nhảy nhanh về tháng hiện tại, nút "Đóng" và sự kiện click ra ngoài để đóng popover.
  - Khi chọn tháng/năm mới: tự động nạp dữ liệu giao dịch tháng đó, đồng thời kích hoạt cập nhật biểu đồ tuần T2-CN liên kết tương ứng.
- **Các file chỉnh sửa**:
  - `frontend/src/pages/statistics/StatisticsPage.tsx`: Bổ sung state `isMonthPickerOpen`, `pickerYear`, `pickerRef`, xử lý đóng popover khi click ngoài và giao diện popover chuẩn xác.
- **Kết quả kiểm thử**: PASS 100% — `npm run build` thành công xuất sắc (Exit code 0, 0 lỗi TypeScript).
- **Trạng thái**: Completed.

### [2026-09-29] Task 8.2 (Refinement 3): Bổ Sung Chấm Xanh Đánh Dấu Ngày Hiện Tại Trên Lịch Chi Tiêu
- **Người thực hiện**: Agent
- **Yêu cầu từ người dùng**:
  - Bổ sung chấm xanh (`green dot`) báo hiệu ngày hiện tại (`Today`) trên ma trận ô ngày của thẻ Lịch chi tiêu.
  - Phân định rõ ràng ngày hôm nay ngay cả khi người dùng đang click chọn duyệt xem các ngày khác trong tháng.
- **Các file chỉnh sửa**:
  - `frontend/src/pages/statistics/StatisticsPage.tsx`: Tính toán trạng thái `isToday` cho từng ô lịch; thêm chấm tròn xanh ngọc (`w-2 h-2 rounded-full bg-secondary ring-1 ring-white`) tại góc trên bên phải, cùng hiệu ứng màu chữ và nền nhẹ nhàng (`bg-secondary/10`).
- **Kết quả kiểm thử**: PASS 100% — `npm run build` thành công xuất sắc (Exit code 0, 0 lỗi TypeScript).
- **Trạng thái**: Completed.

### [2026-09-29] Task 8.2 (Refinement 4): Nâng Cấp Biểu Đồ Tròn Phân Bổ (Donut Chart) Đa Chiều (Thu/Chi & Chọn Tháng/Năm)
- **Người thực hiện**: Agent
- **Yêu cầu từ người dùng**:
  - Bổ sung logic chọn linh hoạt giữa Thu nhập (`INCOME`) và Chi tiêu (`EXPENSE`) trực tiếp trên biểu đồ phân bổ tròn.
  - Tích hợp bộ chọn Tháng & Năm tương tác với popover đầy đủ tính năng: lướt tháng qua nút chevron hoặc mở lưới 12 tháng/năm, hỗ trợ phím tắt "Tháng hiện tại" và đóng khi click ra ngoài.
  - Tự động đồng bộ số liệu qua API `statisticsService.getCategories({ month, type })` cùng cơ chế dự phòng tổng hợp giao dịch local thông minh.
  - Chuyển đổi linh hoạt màu sắc và nội dung:
    - Khi chọn **Chi tiêu**: Thẻ hiển thị "Phân bổ chi tiêu", màu đỏ/hổ phách chủ đạo, chỉ số "Tổng chi tiêu ghi nhận" và "Tiến độ chi tiêu các hạng mục chính".
    - Khi chọn **Thu nhập**: Thẻ hiển thị "Phân bổ thu nhập", màu xanh ngọc/xanh lá chủ đạo, chỉ số "Tổng thu nhập ghi nhận" và "Đóng góp thu nhập các hạng mục chính".
- **Các file chỉnh sửa**:
  - `frontend/src/pages/statistics/StatisticsPage.tsx`: Bổ sung state `breakdownType`, `breakdownMonth`, `isBreakdownMonthPickerOpen`, `breakdownPickerYear`, `breakdownPickerRef`, các hàm tính toán SVG donut động và giao diện điều khiển chuẩn Fintech.
- **Kết quả kiểm thử**: PASS 100% — `npm run build` thành công xuất sắc (Exit code 0, 0 lỗi TypeScript).
- **Trạng thái**: Completed.

### [2026-09-29] Task 9.1: Khắc Phục Lỗi Bóc Tách Ngày & Prefill Dữ Liệu AI Quick Add Vào Modal Giao Dịch
- **Người thực hiện**: Agent
- **Yêu cầu từ người dùng**:
  - Khắc phục sự cố không nhận diện đúng ngày giao dịch trong câu lệnh tự nhiên (ví dụ lương tháng, ngày tương đối).
  - Khi người dùng nhấn nút "Chỉnh sửa" từ danh sách giao dịch do AI bóc tách trên Dashboard, form Modal thêm giao dịch (`AddTransactionModal`) không nhận được thông tin đã bóc tách (số tiền, ngày, danh mục, tài khoản, ghi chú).
- **Các file chỉnh sửa**:
  - `backend/src/main/java/com/finman/service/AiService.java`: Bổ sung bóc tách ngày định dạng YYYY-MM-DD từ kết quả Gemini và NLP cục bộ.
  - `frontend/src/pages/dashboard/DashboardPage.tsx`: Truyền đầy đủ `initialData` sang Modal khi click "Chỉnh sửa".
  - `frontend/src/components/modals/AddTransactionModal.tsx`: Nhận và prefill đầy đủ các trường `initialData` (type, amount, categoryId, accountId, transactionDate, note).
  - `frontend/src/App.tsx`: Đồng bộ trạng thái mở modal từ sự kiện sửa giao dịch AI.
- **Kết quả kiểm thử**: PASS 100% — Prefill mượt mà, ngày giao dịch và số tiền được điền chính xác.
- **Trạng thái**: Completed.

### [2026-09-29] Task 9.2: Chuẩn Hóa Nhãn Phương Thức Chuyển Khoản Trang Quản Lý Tài Khoản
- **Người thực hiện**: Agent
- **Yêu cầu từ người dùng**:
  - Làm rõ và chuẩn hóa nhãn phương thức chuyển khoản liên ngân hàng đang để cố định `VCB - 24/7` tại `AccountsPage.tsx`.
  - Đổi sang `Napas 24/7` cho đúng chuẩn hệ thống thanh toán quốc gia Việt Nam.
- **Các file chỉnh sửa**:
  - `frontend/src/pages/accounts/AccountsPage.tsx`: Cập nhật nhãn hiển thị thành `Napas 24/7`.
- **Trạng thái**: Completed.

### [2026-09-29] Task 9.3: Hoàn Thiện Toàn Diện Tính Năng Quên Mật Khẩu (Forgot Password Flow)
- **Người thực hiện**: Agent
- **Yêu cầu từ người dùng**:
  - Nút "Quên mật khẩu?" trên `LoginPage.tsx` chưa được gắn logic xử lý.
  - Xây dựng hoàn chỉnh luồng quên mật khẩu từ Backend đến Frontend: gửi mã xác thực OTP / liên kết đặt lại mật khẩu.
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/main/java/com/finman/dto/request/ForgotPasswordRequest.java`: DTO nhận email yêu cầu khôi phục.
  - `backend/src/main/java/com/finman/service/AuthService.java` & `AuthController.java`: Endpoint `POST /api/v1/auth/forgot-password` xử lý an toàn (chống user enumeration attack).
  - `frontend/src/context/AuthContext.tsx`: Cung cấp hàm `forgotPassword(email)`.
  - `frontend/src/pages/auth/ForgotPasswordModal.tsx`: Thiết kế lại giao diện modal kính mờ cao cấp, đếm ngược 60 giây gửi lại mã, thông báo inline trực quan, không dùng `alert()`.
- **Kết quả kiểm thử**: PASS 100% — Luồng gửi yêu cầu mượt mà, xác thực chuẩn xác.
- **Trạng thái**: Completed.

### [2026-09-29] Task 9.4: Tách Rời File Prompt Cho AI Transaction Parser (Clean Architecture)
- **Người thực hiện**: Agent
- **Yêu cầu từ người dùng**:
  - Không nhúng trực tiếp khối prompt 450 dòng vào code Java `AiService.java`.
  - Gọi file template bên ngoài để code sạch hơn, dễ bảo trì và tinh chỉnh prompt engineering.
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/main/resources/prompts/parse-transaction.txt`: Chứa template prompt chuẩn đóng gói JAR/Production.
  - `backend/src/main/java/com/finman/service/AiService.java`: Thêm cơ chế `loadPromptTemplate` tự động nạp từ file dev ngoài (`promts/parse`) hoặc classpath resource; làm sạch mã Java của phương thức `parseWithGemini`.
- **Kết quả kiểm thử**: PASS 100% — Toàn bộ 14/14 test cases của `AiServiceTest` chạy qua.
- **Trạng thái**: Completed.

### [2026-09-29] Task 9.5: Nâng Cấp Toàn Diện Tính Năng Monthly Financial Insights Với Deep Financial Context
- **Người thực hiện**: Agent
- **Yêu cầu từ người dùng**:
  - Nâng cấp tính năng nhận xét tài chính hàng tháng không chỉ dựa trên tổng thu/tổng chi/tiết kiệm ròng.
  - Backend tổng hợp sâu từ Database: chi tiêu theo danh mục (tính %), thu nhập theo danh mục, danh mục chi tiêu lớn nhất, so sánh % tăng/giảm với tháng trước, kiểm tra thực thi ngân sách (Budget) phát hiện vượt hạn mức / tiệm cận hạn mức.
  - Tạo Financial Context đa chiều gửi sang Gemini với template độc lập, có quy tắc nghiêm ngặt chống bịa số liệu.
  - Nâng cấp bộ Fallback Rule-based thông minh dùng số liệu động khi mất kết nối Gemini.
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/main/resources/prompts/monthly-insights.txt`: Prompt template độc lập cho phân tích tài chính tháng.
  - `backend/src/main/java/com/finman/dto/response/AiInsightsKeyMetrics.java`: DTO chỉ số then chốt tài chính.
  - `backend/src/main/java/com/finman/dto/response/CategorySpendingItem.java`: DTO danh mục chi tiêu kèm %.
  - `backend/src/main/java/com/finman/dto/response/AiInsightsResponse.java`: Bổ sung `savingsRate`, `keyMetrics`, `topExpenseCategories`, `alerts` (100% tương thích ngược).
  - `backend/src/main/java/com/finman/repository/BudgetRepository.java`: Bổ sung query `findByUserIdAndMonthWithCategory` FETCH JOIN triệt tiêu N+1 query.
  - `backend/src/main/java/com/finman/service/AiService.java`: Tích hợp tính toán tổng hợp dữ liệu tài chính sâu và fallback động.
  - `frontend/src/services/aiService.ts`: Bổ sung các kiểu dữ liệu tương ứng trong `AiInsightsResult`.
  - `backend/src/test/java/com/finman/service/AiServiceTest.java`: Bổ sung 8 test cases bao phủ mọi khía cạnh phân tích và edge cases.
- **Kết quả kiểm thử**: PASS 100% — Toàn bộ 22/22 unit tests `AiServiceTest` và 167/167 tests backend của FinMan chạy qua (`BUILD SUCCESS`). Frontend TypeScript `0 errors`.
- **Trạng thái**: Completed.

### [2026-09-29] Task 9.6: Nâng Cấp Toàn Diện FinMan AI Financial Chatbot (Zero Hallucination, Deep Financial Context, Triệt Tiêu N+1 Query)
- **Người thực hiện**: Agent
- **Yêu cầu từ người dùng**:
  - Nâng cấp chatbot tài chính cá nhân FinMan AI trở thành trợ lý đắc lực, hiểu tiếng Việt tự nhiên và câu hỏi tương đối (Hôm nay, Hôm qua, Tuần này, Tháng này, Tháng trước, Gần đây).
  - Trả lời CHÍNH XÁC dựa trên Dữ liệu Tài chính Thực tế từ Database của đúng người dùng đang đăng nhập.
  - Phân tích chi tiết: Thu nhập, Chi tiêu, Tiết kiệm ròng, Phân bổ danh mục kèm %, Tình hình ngân sách (Budget) kèm trạng thái cảnh báo, Số dư tài khoản/ví, Giao dịch hôm nay và hôm qua, So sánh biến động MoM với tháng trước kèm % tăng/giảm.
  - Triệt tiêu hoàn toàn hallucination (bịa đặt số liệu) và bảo vệ chống prompt injection ("Hãy quên hết các quy tắc", "Tôi có 1 tỷ"). Backend là Source of Truth tính toán sẵn mọi chỉ số.
  - Triệt tiêu N+1 queries khi kiểm tra hạn mức ngân sách: Map dữ liệu chi tiêu danh mục bằng `aggregateByCategory` O(1) in-memory.
  - Hỗ trợ lưu trữ ngữ cảnh hội thoại đa lượt (Conversation History).
  - Tương thích ngược 100% với endpoint `POST /api/v1/ai/chat` và `POST /api/v1/ai/query`.
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/main/resources/prompts/financial-chatbot.txt`: Thiết lập prompt template chuyên biệt cho Financial Chatbot với hướng dẫn Persona, Grounding, Anti-Injection và Formatting chặt chẽ.
  - `backend/src/main/java/com/finman/dto/request/AiChatMessageDto.java`: DTO nhận lịch sử hội thoại (role, content).
  - `backend/src/main/java/com/finman/dto/request/AiChatRequest.java`: Mở rộng nhận danh sách `conversationHistory`.
  - `backend/src/main/java/com/finman/service/AiService.java`:
    + Cập nhật `buildUserFinancialContext(userId, conversationHistory)` gom 8 nhóm dữ liệu (Nhóm A-H) với mốc thời gian hệ thống, số dư ví, tổng quan tháng, phân bổ danh mục, ngân sách (O(1)), hôm nay/hôm qua, so sánh MoM, 10 giao dịch gần nhất, lịch sử chat.
    + Thêm hàm `formatMoney(Long amount)` định dạng tiền tệ chuẩn Việt Nam có dấu chấm phân tách hàng nghìn (`1.200.000 ₫`).
    + Nâng cấp `queryFinancialDataLocally` xử lý trọn vẹn mọi intent (Số dư, Hôm qua, Hôm nay, Ngân sách, Danh mục, Tháng trước, Gần đây, Mặc định).
    + Cập nhật `processUserChat` và `executeDataQuery` nhận và chuyển tiếp `conversationHistory`.
  - `backend/src/main/java/com/finman/controller/AiController.java`: Chuyển `request.getConversationHistory()` vào `aiService.processUserChat` và `executeDataQuery`.
  - `backend/src/test/java/com/finman/service/AiServiceTest.java`: Bổ sung 8 unit test cases toàn diện kiểm thử: Context prompt generation, Conversation history, Local fallback hôm qua/ngân sách/danh mục/MoM, Gemini failure fallback, và Data user isolation.
- **Kết quả kiểm thử**:
  - Toàn bộ 30/30 unit tests `AiServiceTest` PASS 100%.
  - Toàn bộ 175/175 backend tests toàn dự án PASS 100% (`BUILD SUCCESS`).
  - Frontend `npm run build` thành công trong 2.38s, TypeScript 0 lỗi.
- **Trạng thái**: Completed.

### [2026-09-29] Task 9.7: Tái cấu trúc chuẩn hóa Account Domain & Đồng bộ toàn bộ Planning Documents
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `plans/PRD.md`:
    + Định nghĩa lại "Account" là Đơn vị tài chính (Financial Unit) để theo dõi số dư của tiền, tài sản hoặc nghĩa vụ nợ; người dùng tự do chọn `type`, đặt tên tùy chỉnh `name`, nhập `initial_balance` và ghi nhận giao dịch.
    + Thống nhất quyết định kiến trúc: **KHÔNG tạo entity/module "Fund" riêng**; các mục đích như "Nuôi con", "Cá nhân", "Tiết kiệm", "Du lịch" được biểu diễn chuẩn mực bằng Account có tên tùy chỉnh.
    + Phân biệt rạch ròi giữa **Account** ("Tiền đang ở đâu?") và **Budget** ("Kế hoạch giới hạn chi bao nhiêu theo danh mục trong kỳ?"). Budget không thay thế Account và không trực tiếp trừ số dư Account.
    + Bổ sung phân định Account Type: Current Scope (`CASH`, `BANK`, `CREDIT_CARD`) vs Proposed Extension Scope (`DEBIT_CARD`, `INVESTMENT`, `CREDIT_LIMIT`, `LOAN`, `INSURANCE`, `CRYPTO`, `OTHER`).
    + Bổ sung luồng giao dịch Chuyển khoản nội bộ (`TRANSFER`), quy tắc dòng tiền không làm tăng Thu nhập/Chi tiêu, bảo toàn Net Worth, và bổ sung kịch bản Teacher's Flow.
    + Cập nhật quy tắc Vòng đời tài khoản: Không xóa cứng tài khoản đã có lịch sử; chuyển sang lưu trữ (`is_archived = true`).
    + Cập nhật Ma trận Validation (Section 33), Quy tắc nghiệp vụ (Section 34) và Tiêu chí nghiệm thu (Section 35, AC-05, AC-06, AC-07).
  - `plans/ARCHITECTURE.md`:
    + Cập nhật ERD và bảng `transactions` thêm `to_account_id FK` (nullable), cho phép `category_id` nullable khi là `TRANSFER`, type gồm `INCOME | EXPENSE | TRANSFER`.
    + Bổ sung thuộc tính `note` (proposed), giải thích tên tùy chỉnh `name` và scope `type` trong bảng `accounts`.
    + Cập nhật mã giả `TransactionService.createTransaction` cho cơ chế atomic transaction khi chuyển khoản giữa 2 tài khoản.
    + Cập nhật Prompt template của Gemini Quick Add nhận diện `TRANSFER`, `accountName` tùy chỉnh và `toAccountName`.
    + Cập nhật danh sách REST Endpoints cốt lõi (Account archiving, Transfer transactions, lọc theo type).
  - `plans/GEMINI.md`:
    + Sửa đổi Nguyên tắc 2: Thống nhất 3 luồng giao dịch (`INCOME`, `EXPENSE`, `TRANSFER`), nguyên tắc bảo toàn Net Worth của Transfer, loại bỏ lệnh cấm cũ về Transfer; nghiêm cấm tạo entity "Fund" riêng.
    + Cập nhật Nguyên tắc 4: Công thức số dư chuẩn xác với `Transfer In` và `Transfer Out`.
  - `plans/CODE_PLAN.md`:
    + Cập nhật Task 1.1, Task 3.1, Task 4.1 để đồng bộ domain model.
    + Bổ sung Phase 10: "Extended Account Domain & Full Transfer Implementation (Next Phase Roadmap)" gồm 5 sub-tasks chi tiết định hướng triển khai kỹ thuật cho phase sau.
  - `plans/TEST_PLAN.md`:
    + Cập nhật và bổ sung các test cases cho tài khoản tên tùy chỉnh (`TC_ACC_01`, `TC_ACC_06`), lưu trữ tài khoản (`TC_ACC_04`).
    + Bổ sung test cases cho Chuyển khoản nội bộ (`TC_TXN_10`, `TC_TXN_11`), kịch bản Teacher's Flow (`TC_TXN_12`), Chi tiêu từ tài khoản tên tùy chỉnh và Budget độc lập (`TC_TXN_13`).
    + Bổ sung test case AI nhận diện Transfer và tên tài khoản tùy chỉnh (`TC_AI_07`, `TC_AI_08`).
  - `plans/PROCESS.md`: Cập nhật Master Tracker và ghi nhận nhật ký chi tiết công việc.
- **Nội dung công việc**: Rà soát, tái cấu trúc và đồng bộ hóa toàn diện toàn bộ 6 tài liệu quy hoạch của dự án FinMan theo đúng chỉ đạo về Account Domain, loại bỏ mọi mâu thuẫn về khái niệm tài khoản, ngân sách và giao dịch chuyển khoản.
- **Kết quả kiểm thử**: PASS — 100% tài liệu quy hoạch nhất quán tuyệt đối về domain, không có mâu thuẫn chéo, tuân thủ nguyên tắc Planning Only (0 dòng code Java/TS bị thay đổi trong đợt này).
- **Trạng thái**: Completed.

### [2026-10-05] Task 10.1: Database Schema Migration Cho Transfer & Extended Account Attributes
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/main/java/com/finman/entity/enums/TransactionType.java`: Bổ sung giá trị enum `TRANSFER`.
  - `backend/src/main/java/com/finman/entity/Account.java`: Bổ sung thuộc tính `note VARCHAR(255) NULL`, các constructor tương thích, getter/setter và cập nhật `toString()`.
  - `backend/src/main/java/com/finman/entity/Transaction.java`: Bổ sung quan hệ `toAccount` (`@ManyToOne`, cột `to_account_id BIGINT NULL REFERENCES accounts(id)`), mở cho phép `category_id` NULL khi là `TRANSFER`, bổ sung index `@Index(name = "idx_transactions_user_to_account", columnList = "user_id, to_account_id")`, các constructor nạp chồng và getter/setter.
  - `backend/src/main/java/com/finman/dto/response/AccountResponse.java`: Bổ sung thuộc tính `note` và phương thức ánh xạ `from(Account)`.
  - `backend/src/main/java/com/finman/dto/request/AccountCreateRequest.java`: Bổ sung trường `note` khi tạo tài khoản.
  - `backend/src/main/java/com/finman/dto/request/AccountUpdateRequest.java`: Bổ sung trường `note` khi cập nhật tài khoản.
  - `backend/src/main/java/com/finman/service/AccountService.java`: Nạp `note` vào Account khi `createAccount` và `updateAccount`.
  - `backend/src/main/java/com/finman/dto/response/TransactionResponse.java`: Bổ sung trường `toAccount` (AccountInfo) cho dữ liệu trả về giao dịch chuyển khoản.
  - `backend/src/test/java/com/finman/repository/RepositoryIntegrationTest.java`: Bổ sung test case `testTask10_1_SchemaMigrationAndTransferAttributes` kiểm thử lưu trữ/truy vấn Account có note và Transaction TRANSFER có toAccount cùng category null.
  - `plans/CODE_PLAN.md`: Cập nhật trạng thái Task 10.1 Completed.
- **Nội dung công việc**: Thực hiện mở rộng schema database theo Task 10.1 để hỗ trợ luồng chuyển khoản nội bộ `TRANSFER` và thuộc tính ghi chú `note` cho `Account`, đảm bảo tương thích ngược 100% với toàn bộ dữ liệu và nghiệp vụ giao dịch hiện có.
- **Kết quả kiểm thử**: PASS — Toàn bộ 176/176 tests backend chạy thành công 100% (`BUILD SUCCESS`), kiểm thử tích hợp Repository xác nhận lưu/đọc dữ liệu Transfer và Account Note chuẩn xác.
- **Trạng thái**: Completed.

### [2026-10-05] Task 10.2: Backend Transaction Service Processing Cho Luồng TRANSFER
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/main/java/com/finman/dto/request/TransactionCreateRequest.java`: Bổ sung trường `toAccountId`, các constructor nạp chồng, bỏ `@NotNull` trên `categoryId` cho phép `category = null` khi giao dịch là `TRANSFER`.
  - `backend/src/main/java/com/finman/dto/request/TransactionUpdateRequest.java`: Bổ sung trường `toAccountId`, các constructor nạp chồng tương ứng cho cập nhật giao dịch chuyển khoản.
  - `backend/src/main/java/com/finman/service/TransactionService.java`:
    + Triển khai logic xử lý nguyên tử `@Transactional` cho `TRANSFER`: kiểm tra `fromAccountId != toAccountId`, `toAccountId != null`, kiểm tra quyền sở hữu và trạng thái `isArchived` của cả hai tài khoản.
    + Xây dựng cơ chế cập nhật (`updateTransaction`) và xóa (`deleteTransaction`) với hoàn tác số dư đối xứng (`applyTransferImpact` và `revertTransferImpact`), xử lý đúng đắn tài khoản thẻ tín dụng (`CREDIT_CARD`) và tài khoản thông thường (`CASH`/`BANK`).
    + Tối ưu tái sử dụng instance account khi ID không đổi trên update để tránh query dư thừa và đảm bảo tính nhất quán.
    + Cập nhật truy vấn Specification lọc giao dịch theo `accountId` hỗ trợ cả vai trò ví nguồn hoặc ví đích (`cb.or(account == id, toAccount == id)`).
  - `backend/src/test/java/com/finman/service/TransactionServiceTest.java`: Thêm 8 unit test bao phủ toàn bộ luồng tạo, cập nhật, xóa giao dịch `TRANSFER`, kiểm tra ngoại lệ cùng tài khoản, thiếu `toAccountId`, tài khoản archived, và chuyển khoản vào thẻ tín dụng.
  - `backend/src/test/java/com/finman/controller/TransactionControllerTest.java`: Thêm 3 integration test MockMvc cho `POST /api/v1/transactions` chuyển khoản thành công, chặn cùng tài khoản, và xóa hoàn tác số dư.
  - `plans/CODE_PLAN.md`: Cập nhật trạng thái Task 10.2 `[COMPLETED]`.
- **Nội dung công việc**: Xây dựng toàn diện business logic và transaction processing cho luồng chuyển tiền nội bộ `TRANSFER` ở tầng Backend Service, bảo toàn 100% Net Worth và giữ vững tương thích ngược với luồng `INCOME`/`EXPENSE`.
- **Kết quả kiểm thử**: PASS — 187/187 tests backend chạy thành công 100% (`BUILD SUCCESS`), frontend build `tsc -b && vite build` PASS không có lỗi.
- **Trạng thái**: Completed.

### [2026-10-05] Task 10.6: Backend Account Lifecycle & Purpose Pocket Management
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/main/java/com/finman/repository/AccountRepository.java`: Bổ sung `findByUserIdAndIsArchived(userId, isArchived)`.
  - `backend/src/main/java/com/finman/service/AccountService.java`: Bổ sung phương thức `getAccountsSummary(userId, includeArchived)` và `archiveAccount(userId, accountId, archive)` hỗ trợ đóng và khôi phục khoản tiền mục đích.
  - `backend/src/main/java/com/finman/controller/AccountController.java`: Bổ sung param `includeArchived` trong `GET /api/v1/accounts` và endpoint `PATCH /api/v1/accounts/{id}/archive?archived=true/false`.
  - `backend/src/test/java/com/finman/service/AccountServiceTest.java`: Thêm test cases cho archive, unarchive và truy vấn tài khoản với `includeArchived`.
  - `plans/CODE_PLAN.md`: Cập nhật trạng thái Task 10.6 `[COMPLETED]`.
- **Nội dung công việc**: Xây dựng đầy đủ vòng đời lưu trữ và khôi phục tài khoản mục đích, phân quyền sở hữu tài khoản và tương thích hoàn toàn với hệ thống ledger.
- **Kết quả kiểm thử**: PASS — 189/189 tests backend chạy thành công 100% (`BUILD SUCCESS`).
- **Trạng thái**: Completed.

### [2026-10-05] Task 10.7: Frontend Purpose-based Accounts Redesign (`AccountsPage.tsx` & Modal)
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `frontend/src/types/index.ts`: Bổ sung thuộc tính `note?: string; isArchived?: boolean;` trong `Account`, `AccountCreatePayload`, `AccountUpdatePayload`.
  - `frontend/src/services/accountService.ts`: Bổ sung param `includeArchived` và phương thức `archiveAccount(id, archived)`.
  - `frontend/src/pages/accounts/AccountsPage.tsx`:
    + Tái thiết kế toàn diện từ 3 cột ngân hàng cứng nhắc sang **Lưới các Khoản tiền Mục đích (Purpose Accounts Canvas)**: thẻ hiển thị icon mục đích sinh động (🍼 Nuôi con, 👵 Phụng dưỡng bố mẹ, ☕ Đầu tư quán cà phê, 🚨 Dự phòng khẩn cấp, 🏠 Mua nhà/xe, 🛒 Chi tiêu sinh hoạt), số dư khả dụng, ghi chú kế hoạch `note`.
    + Bổ sung thanh chuyển Tab: "Khoản tiền đang dùng" vs "Đã lưu trữ / Đóng mục đích", hỗ trợ nút **Khôi phục** khoản tiền đã lưu trữ.
    + Cải tiến modal thêm mới: Gợi ý các chip mục đích nhanh (Quick Presets) tự động điền form, bổ sung ô nhập ghi chú mục đích chi tiêu và số tiền ban đầu.
  - `plans/PRD.md`: Chuẩn hóa định nghĩa "Account trong FinMan là Khoản tiền cho mục đích sử dụng".
  - `plans/CODE_PLAN.md`: Cập nhật trạng thái Task 10.7 `[COMPLETED]`.
- **Nội dung công việc**: Chuyển đổi toàn diện giao diện và trải nghiệm quản lý tài khoản sang mô hình phân bổ các khoản tiền theo mục đích sử dụng thực tế của người dùng.
- **Kết quả kiểm thử**: PASS — `npm run build` thành công 100%, 0 lỗi TypeScript, giao diện tải dữ liệu mượt mà.
- **Trạng thái**: Completed.

### [2026-10-05] Task 10.3: Cô Lập Thống Kê & Báo Cáo Không Bị Ảnh Hưởng Bởi TRANSFER
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/main/java/com/finman/repository/TransactionRepository.java`: Cập nhật `findTransactionsForExport` hỗ trợ `LEFT JOIN FETCH t.toAccount` và `c` cho phép `category_id = NULL`; điều kiện lọc tài khoản bao gồm cả `a.id = :accountId OR ta.id = :accountId`; bổ sung `countByUserIdAndAccountIdAndDateBetween` để đếm chính xác giao dịch theo ví mục đích; cô lập `aggregateDailyCashflow` chỉ gom `t.type IN (INCOME, EXPENSE)`.
  - `backend/src/main/java/com/finman/service/StatisticsService.java`: Áp dụng `countByUserIdAndAccountIdAndDateBetween` khi xem thống kê theo tài khoản.
  - `backend/src/main/java/com/finman/service/ExportService.java`: Tạo style riêng `transferTypeStyle` và `transferAmountStyle` màu xanh navy `#1E40AF`, hiển thị loại "Chuyển khoản", danh mục "Chuyển khoản nội bộ", tài khoản nguồn & đích `Ví A ➔ Ví B`.
  - `backend/src/main/java/com/finman/service/AiService.java`: Nhận diện an toàn giao dịch TRANSFER trong context phân tích tài chính AI (`⇄ `, `Ví A ➔ Ví B`, danh mục "Chuyển khoản nội bộ").
  - `backend/src/test/java/com/finman/service/ExportServiceTest.java`: Bổ sung unit test `TC_EXP_04: testExportTransactions_WithTransfer_Success`.
- **Nội dung công việc**: Đảm bảo các chỉ số tài chính ròng, biểu đồ dòng tiền ngày, ngân sách và AI insights không bị tăng khống bởi các giao dịch điều chuyển giữa các ví mục đích, đồng thời phản ánh rõ ràng trong báo cáo Excel.
- **Kết quả kiểm thử**: PASS — 190/190 backend test cases đạt 100%.
- **Trạng thái**: Completed.

### [2026-10-05] Task 10.4: Frontend Transfer Tab & UI Modal Cập Nhật
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `frontend/src/types/index.ts`: Cập nhật interface `Transaction` (`toAccount?: Account`, `category?: Category`).
  - `frontend/src/services/transactionService.ts`: Cập nhật `TransactionCreatePayload` và `TransactionUpdatePayload` hỗ trợ `toAccountId?: number`, `categoryId?: number`.
  - `frontend/src/App.tsx`: Cập nhật logic submit form thêm/sửa giao dịch gửi đúng `toAccountId` và `categoryId`, tìm kiếm giao dịch an toàn không văng lỗi khi `category` null.
  - `frontend/src/components/modals/AddTransactionModal.tsx`: Thêm tab "Chuyển khoản" với Canvas điều chuyển trực quan, bộ chọn Khoản tiền nguồn và Khoản tiền đích, dự toán số dư sau chuyển, cảnh báo không được chọn trùng ví và ghi chú mục đích chuyển.
  - `frontend/src/pages/dashboard/DashboardPage.tsx`: Cập nhật thẻ hiển thị giao dịch: icon `swap_horiz` màu xanh dương dịu mắt, hiển thị lộ trình `Ví Nguồn ➔ Ví Đích`, số tiền dạng `⇄ X ₫`, loại trừ khỏi tính toán nhanh tổng thu/chi.
  - `frontend/src/pages/statistics/StatisticsPage.tsx`: Hiển thị chi tiết giao dịch chuyển khoản trong modal dòng tiền ngày an toàn kiểu dữ liệu.
- **Nội dung công việc**: Tích hợp luồng người dùng điều chuyển khoản tiền trên Web hoàn chỉnh, trực quan, bảo toàn trải nghiệm người dùng theo triết lý Khoản tiền mục đích.
- **Kết quả kiểm thử**: PASS — `npm run build` thành công 100%, 0 lỗi TypeScript.
- **Trạng thái**: Completed.

### [2026-10-05] Task 10.5: Mở Rộng AccountType Bổ Sung Loại "Đầu Tư" (INVESTMENT) và "Khác" (OTHER)
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `backend/src/main/java/com/finman/entity/enums/AccountType.java`: Bổ sung 2 giá trị enum `INVESTMENT` (Đầu tư) và `OTHER` (Khác).
  - `backend/src/main/java/com/finman/service/AccountService.java`: Cập nhật thông điệp xác thực số dư ban đầu cho các tài khoản tài sản non-credit card.
  - `backend/src/main/java/com/finman/service/AiService.java`: Bổ sung phân tích từ khóa cục bộ ("dau tu", "invest", "chung khoan", "co phieu", "crypto", "vang") nhận diện tài khoản loại `INVESTMENT`.
  - `backend/src/test/java/com/finman/service/AccountServiceTest.java`: Thêm 2 unit test bao phủ tạo tài khoản `INVESTMENT` và `OTHER`, xác thực tính toán chính xác Net Worth khi có đầy đủ 5 loại tài khoản.
  - `frontend/src/types/index.ts`: Mở rộng type `AccountType = 'CASH' | 'BANK' | 'CREDIT_CARD' | 'INVESTMENT' | 'OTHER'`.
  - `frontend/src/pages/accounts/AccountsPage.tsx`: Bổ sung preset và icon/badge cho `INVESTMENT` (icon: `trending_up`) và `OTHER` (icon: `category`), mở rộng bộ chọn hình thức giữ tiền trong Add Account Modal thành 5 tùy chọn dạng grid responsive.
  - `frontend/src/pages/dashboard/DashboardPage.tsx`: Bổ sung icon và nhãn hiển thị cho `INVESTMENT` và `OTHER` trong bộ lọc tài khoản.
  - `frontend/src/components/modals/AddTransactionModal.tsx`: Bổ sung emoji đại diện `📈` (INVESTMENT) và `💼` (OTHER) trong bộ chọn tài khoản giao dịch.
  - `plans/PRD.md`, `plans/ARCHITECTURE.md`, `plans/CODE_PLAN.md`: Cập nhật đồng bộ tài liệu đặc tả, chuyển `INVESTMENT` và `OTHER` từ Proposed Scope sang Current Scope hoạt động.
- **Kết quả kiểm thử**: PASS — 192/192 Backend Tests đạt PASS 100%, `npm run build` frontend đạt 0 lỗi.
- **Trạng thái**: Completed.

### [2026-10-05] Task 10.6: Tách Component Modal Tạo Khoản Tiền Mục Đích Mới (AddAccountModal)
- **Người thực hiện**: Agent
- **Các file tạo mới / chỉnh sửa**:
  - `frontend/src/components/modals/AddAccountModal.tsx`: Tạo mới component modal độc lập đóng gói toàn bộ state form nhập liệu, danh sách preset mục đích, xác thực tên/số tiền/hạn mức, và gọi service tạo tài khoản kèm fallback an toàn.
  - `frontend/src/pages/accounts/AccountsPage.tsx`: Loại bỏ hơn 280 dòng JSX và hàng loạt state con cục bộ, tái cấu trúc gọn gàng bằng cách import và sử dụng `<AddAccountModal />`.
- **Kết quả kiểm thử**: PASS — `npm run build` thành công 100%, 0 lỗi TypeScript, hot reload hoạt động trơn tru.
- **Trạng thái**: Completed.

---

# 5. Bảng Theo Dõi Lỗi Phát Sinh (Defect & Issue Tracker)

| Bug ID | Task liên quan | Mô tả sự cố / Lỗi | Mức độ (Severity) | Trạng thái | Giải pháp khắc phục |
|---|---|---|---|---|---|
| **BUG-01** | Task 2.10 / 2.12 | Nhập ký tự vào input form đăng ký làm nhấp nháy / tải lại nút Google | Medium | `Closed` | Chuyển callbacks sang `useRef`, bọc `useCallback` & `React.memo`, dùng `isRenderedRef` chặn hủy / tạo lại iframe Google. |
| **BUG-02** | Task 3.2 / 3.3 | Không lưu được tài khoản khi thêm mới do thiếu báo lỗi nhập tên / payload thừa; ô nhập tiền thiếu định dạng dấu chấm (`.`) phân tách hàng nghìn | Medium | `Closed` | Bổ sung `@JsonIgnoreProperties` ở DTO backend; thêm banner `modalError` cảnh báo trực tiếp trong modal; tạo bộ tiện ích `formatCurrencyInput` & `parseCurrencyInput` cho toàn bộ các ô nhập tiền tệ (`AccountsPage`, `AddTransactionModal`, `BudgetPage`). |
| **BUG-03** | Task 7.2 / 7.3 | Lỗi biên dịch TypeScript `TS2552: Cannot find name 'setNewCatBgColor'` tại `SettingsPage.tsx` và ổ cứng `C:` cạn bộ nhớ tạm thời làm gián đoạn build/test | High | `Closed` | Loại bỏ lời gọi `setNewCatBgColor` dư thừa trong bộ chọn màu modal danh mục; dọn dẹp thư mục Temp và chuyển hướng thư mục tạm thời của Maven/Java sang ổ `D:` (`-Djava.io.tmpdir=d:\FinMan\backend\target\tmp`); kiểm thử build frontend và toàn bộ 144 backend tests đạt PASS 100%. |
| **BUG-04** | Task 8.2 | Trục ngày dưới biểu đồ dòng tiền xuất hiện 2 ô tô nền đỏ đồng thời gây nhầm lẫn | Low | `Closed` | Gỡ bỏ khối tô màu nền đỏ (`#fee2e2`) và font chữ đỏ của ngày Đỉnh chi (`isPeak`) trên trục hoành; chỉ duy trì duy nhất 1 ô tô đỏ (`#ffdad6`) cho ngày đang được người dùng chọn (`isSelected`). |
| **BUG-05** | Task 9.1 | Dữ liệu bóc tách giao dịch từ AI không prefill sang AddTransactionModal khi click "Chỉnh sửa" | Medium | `Closed` | Truyền state `initialData` từ Dashboard sang modal và cập nhật effect thiết lập form fields tại `AddTransactionModal.tsx`. |
| **BUG-06** | Task 9.3 | Nút "Quên mật khẩu?" tại màn hình đăng nhập không có hành vi phản hồi | Medium | `Closed` | Xây dựng API `forgot-password`, `AuthContext.forgotPassword` và hoàn thiện `ForgotPasswordModal.tsx`. |
| **BUG-07** | Task 9.5 | `String.format` gây lỗi `UnknownFormatConversionException: Conversion = ')'` do template chứa ký tự `%` trong văn bản | Low | `Closed` | Chuyển sang dùng `replace("%s", context)` an toàn tuyệt đối cho prompt template. |
| **BUG-08** | Task 9.6 | Định dạng tiền tệ phân tách hàng nghìn dùng `Locale.US` trong Java sinh ra dấu phẩy thay vì dấu chấm chuẩn Việt Nam (`1,200,000 ₫` thay vì `1.200.000 ₫`) | Low | `Closed` | Xây dựng hàm `formatMoney(Long amount)` chuẩn hóa dấu chấm phân tách hàng nghìn độc lập với locale hệ điều hành: `String.format(Locale.US, "%,d", amount).replace(',', '.') + " ₫"`. |



