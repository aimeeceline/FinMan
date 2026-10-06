# PRD — FinMan
## Personal Finance Management Application

**Product Name:** FinMan  
**Product Type:** Personal Finance Management Web Application  
**Platform:** Modern Web Application (Desktop-first responsive interface, 1600px analytical canvas, fixed 288px dual-rail sidebar, Plus Jakarta Sans & Inter typography, Tailwind CSS tokens)  
**Design System:** Fintech Prestige (Stitch Web UI)  
**Target Users:** Cá nhân muốn theo dõi và quản lý thu nhập, chi tiêu, ngân sách và tài sản cá nhân trên nền tảng Web hiện đại.

---

# 1. Product Overview

## 1.1 Product Description

**FinMan** là ứng dụng quản lý tài chính cá nhân giúp người dùng:

- Ghi nhận các khoản thu nhập (Income), chi tiêu (Expense) và chuyển khoản nội bộ (Transfer).
- Quản lý các đơn vị tài chính (Account) với loại tài khoản (Type) và tên tùy chỉnh do người dùng đặt (ví dụ: TPBank, Tiền mặt, Nuôi con, Tiết kiệm, Cá nhân...).
- Theo dõi số dư tài sản và nghĩa vụ nợ.
- Quản lý ngân sách (Budget) theo tháng và danh mục độc lập với số dư tài khoản.
- Theo dõi chi tiêu theo danh mục.
- Xem thống kê tài chính và dòng tiền chuẩn xác (Transfer không tính vào Thu nhập hay Chi tiêu).
- Ghi chú các giao dịch.
- Xuất dữ liệu tài chính.

Ứng dụng tập trung vào việc giúp người dùng **nhìn thấy dòng tiền và cơ cấu tài sản của mình một cách trực quan**, thay vì chỉ lưu lại từng giao dịch riêng lẻ.

---

# 2. Product Goals

## G1 — Theo dõi dòng tiền & Tài sản

Người dùng có thể biết:

> Tháng này tôi kiếm được bao nhiêu? (Tổng thu nhập)  
> Tôi đã tiêu bao nhiêu? (Tổng chi tiêu)  
> Tôi còn lại bao nhiêu? (Dòng tiền ròng Net Cash Flow = Thu nhập − Chi tiêu)  
> Tổng tài sản và nợ của tôi phân bổ ở các tài khoản nào? (Net Worth = Tổng Tài sản − Tổng Nợ)

*Nguyên tắc dòng tiền*: Chuyển khoản nội bộ (TRANSFER) di chuyển tiền giữa các tài khoản, **KHÔNG** làm tăng thu nhập, **KHÔNG** làm tăng chi tiêu và **KHÔNG** làm biến động tổng tài sản ròng.

## G2 — Quản lý giao dịch đa luồng

Người dùng có thể tạo, chỉnh sửa và xóa 3 loại giao dịch:

- **Thu nhập (INCOME)**: Tiền đi vào một tài khoản (ví dụ: Lương 50.000.000đ → TPBank).
- **Chi tiêu (EXPENSE)**: Tiền đi ra khỏi một tài khoản (ví dụ: Mua sữa 500.000đ từ tài khoản "Nuôi con").
- **Chuyển khoản (TRANSFER)**: Tiền di chuyển giữa hai tài khoản nội bộ (ví dụ: Chuyển 10.000.000đ từ TPBank sang tài khoản "Nuôi con").

Mỗi giao dịch phải có thông tin tối thiểu:

- Số tiền (Amount)
- Loại giao dịch (INCOME, EXPENSE, TRANSFER)
- Tài khoản phát sinh (Tài khoản nguồn; và Tài khoản đích nếu là TRANSFER)
- Danh mục (Category - bắt buộc với Income/Expense, tùy chọn với Transfer)
- Ngày giao dịch (Date)
- Ghi chú (Note)

## G3 — Quản lý ngân sách

Người dùng có thể đặt ngân sách theo:

- Tháng
- Danh mục

Ví dụ:

| Danh mục | Ngân sách | Đã chi |
|---|---:|---:|
| Ăn uống | 2.000.000đ | 1.200.000đ |
| Giải trí | 1.000.000đ | 400.000đ |
| Giao thông | 500.000đ | 300.000đ |

## G4 — Phân tích tài chính

FinMan cung cấp thống kê để người dùng biết tiền đang được sử dụng vào đâu.

Có thể hiển thị dưới dạng:

- Pie chart
- Bar chart
- Danh sách
- Tổng thu
- Tổng chi
- Chênh lệch

---

# 3. Target User

## Primary User

Người dùng cá nhân từ sinh viên đến người đi làm muốn quản lý tài chính cá nhân.

### User Needs

Người dùng cần:

- Nhập giao dịch nhanh.
- Biết số tiền hiện có.
- Theo dõi khoản chi.
- Kiểm soát ngân sách.
- Xem lại lịch sử giao dịch.
- Phân tích thói quen chi tiêu.

---

# 4. User Authentication

FinMan phải có hệ thống authentication trước khi người dùng truy cập dữ liệu cá nhân.

## 4.1 Login

### UI

Màn hình Login gồm:

- FinMan logo
- Email
- Password
- Button **Đăng nhập**
- Button **Đăng nhập với Google**
- Link **Quên mật khẩu?**
- Link **Chưa có tài khoản? Đăng ký**

### Flow

```text
Open App
   ↓
Login
   ↓
Enter Email + Password
   ↓
Validate
   ↓
Success
   ↓
Home
```

Nếu đăng nhập thất bại:

> Email hoặc mật khẩu không chính xác.

---

# 5. Register

## 5.1 Registration Fields

- Họ tên
- Email
- Mật khẩu
- Xác nhận mật khẩu

Button:

**Đăng ký**

Ngoài ra:

**Đăng ký với Google**

## 5.2 Validation

### Email

- Required
- Phải đúng format email.
- Email không được tồn tại trước đó.

### Password

- Required
- Không được để trống.

### Confirm Password

Phải giống Password.

Nếu không:

> Mật khẩu xác nhận không khớp.

---

# 6. Main Navigation

Sau khi đăng nhập, ứng dụng sử dụng bottom navigation.

```text
┌──────────┬──────────┬──────────┬──────────┐
│  Giao    │ Thống    │ Tài      │   Hơn    │
│  dịch    │ kê       │ khoản    │          │
└──────────┴──────────┴──────────┴──────────┘
```

## Navigation

### 1. Giao dịch

Màn hình chính quản lý giao dịch.

### 2. Thống kê

Phân tích thu nhập và chi tiêu.

### 3. Tài khoản

Quản lý các tài khoản tài chính (Financial Accounts: Tiền mặt, Ngân hàng, Thẻ tín dụng, Nuôi con, Tiết kiệm...) và tài sản ròng.

### 4. Hơn

Các chức năng bổ sung và cài đặt.

---

# 7. Transaction Management

## 7.1 Transaction Dashboard

Màn hình chính hiển thị:

```text
Hàng ngày

Thu              Chi              Cộng
6.000.000đ       1.090.000đ       4.910.000đ
```

Trong đó:

**Cộng (Dòng tiền ròng) = Thu − Chi**

*Lưu ý cốt lõi*: Các giao dịch Chuyển khoản (TRANSFER) giữa các tài khoản nội bộ chỉ làm dịch chuyển số dư giữa 2 tài khoản, **hoàn toàn KHÔNG** được cộng vào Thu, **KHÔNG** được cộng vào Chi, và không làm thay đổi dòng tiền ròng Cộng.

## 7.2 Transaction List

Danh sách giao dịch được nhóm theo ngày, hỗ trợ hiển thị cả 3 loại: Thu nhập (INCOME), Chi tiêu (EXPENSE), và Chuyển khoản (TRANSFER).

Ví dụ:

```text
16        Thứ 4

👕 Áo quần
   quần uniqlo
   Nuôi con (hoặc Tiền mặt)      -1.000.000đ

💰 Tiền lương
   lương T9
   TPBank                      +50.000.000đ

🔄 Chuyển khoản nội bộ
   Phân bổ quỹ nuôi con
   TPBank ➔ Nuôi con            10.000.000đ

Lan Anh
   test
   Tiền mặt cá nhân                 -90.000đ
```

- **Thu nhập (INCOME)**: Hiển thị màu xanh dương (`+6.000.000đ`).
- **Chi tiêu (EXPENSE)**: Hiển thị màu đỏ/cam (`-1.000.000đ`).
- **Chuyển khoản (TRANSFER)**: Hiển thị màu trung tính/tím nhạt kèm icon chuyển đổi (`TPBank ➔ Nuôi con: 10.000.000đ`), không mang dấu +/- vì tổng tài sản bảo toàn.

---

# 8. Add Transaction

Floating Action Button:

**+**

Khi người dùng nhấn `+`, mở màn hình/modal thêm giao dịch.

## Transaction Type

Hệ thống hỗ trợ 3 loại giao dịch:

```text
Thu nhập (INCOME) | Chi tiêu (EXPENSE) | Chuyển khoản (TRANSFER)
```

## 8.1 Chi tiêu (EXPENSE)

Fields:
- Số tiền (Amount)
- Danh mục (Category - loại Expense)
- Tài khoản nguồn (Account)
- Ngày giao dịch (Date)
- Ghi chú (Note)

Ví dụ:
```text
Số tiền: 500.000đ
Danh mục: 👶 Trẻ em / Gia đình
Tài khoản: Nuôi con (hoặc Tiền mặt)
Ngày: 16/09/2026
Ghi chú: Mua sữa cho bé
```

## 8.2 Thu nhập (INCOME)

Fields:
- Số tiền (Amount)
- Danh mục (Category - loại Income)
- Tài khoản nhận (Account)
- Ngày giao dịch (Date)
- Ghi chú (Note)

Ví dụ:
```text
Số tiền: 50.000.000đ
Danh mục: 💰 Tiền lương
Tài khoản: TPBank
Ngày: 16/09/2026
Ghi chú: Lương tháng 9
```

## 8.3 Chuyển khoản nội bộ (TRANSFER)

Fields:
- Số tiền (Amount)
- Tài khoản chuyển (Từ tài khoản / From Account)
- Tài khoản nhận (Đến tài khoản / To Account - phải khác tài khoản chuyển)
- Ngày giao dịch (Date)
- Ghi chú (Note)
- Danh mục: Tùy chọn / Không bắt buộc (mặc định phân loại "Chuyển khoản")

Ví dụ:
```text
Số tiền: 10.000.000đ
Từ tài khoản: TPBank
Đến tài khoản: Nuôi con
Ngày: 16/09/2026
Ghi chú: Phân bổ tiền nuôi con tháng 9
```

Button:

**Lưu giao dịch**

---

# 9. Categories

FinMan cung cấp category mặc định:

### Expense Categories

- 🍜 Ăn uống
- 👫 Giải trí
- 🚕 Giao thông vận tải
- 🖼️ Sở thích
- 🪑 Sinh hoạt
- 👕 Áo quần
- 💄 Làm đẹp
- 🧘 Sức khỏe
- 📚 Giáo dục
- 🎁 Sự kiện
- Khác

Người dùng có thể:

- Thêm category.
- Sửa category.
- Xóa category nếu category chưa được sử dụng hoặc theo rule hệ thống.

---

# 10. Account Management (Quản Lý Tài Khoản Mục Đích & Tài Sản)

## 10.1 Định nghĩa "Account" trong FinMan: Khoản Tiền Cho Mục Đích Sử Dụng

> [!IMPORTANT]
> **Nguyên tắc cốt lõi về Account**:
> Trong FinMan, **"Tài khoản" KHÔNG PHẢI là tài khoản ngân hàng thực tế**, mà là **KHOẢN TIỀN CHO MỤC ĐÍCH ĐÓ ĐỂ SỬ DỤNG** (Purpose-driven Financial Pocket / Allocation Account).
> - **Ví dụ thực tế**:
>   - 🍼 *Tài khoản cho việc nuôi con* (Khoản tiền nuôi con)
>   - 👵 *Tài khoản cho việc phụng dưỡng bố mẹ* (Khoản tiền biếu phụ dưỡng)
>   - ☕ *Tài khoản đầu tư quán cà phê* (Khoản tiền hùn vốn mở quán)
>   - 🚨 *Tài khoản dự phòng khẩn cấp*
>   - 🏠 *Tài khoản tích lũy mua nhà / mua xe*
>   - 🛒 *Tài khoản chi tiêu sinh hoạt hàng ngày*
> - **Hình thức lưu trữ** (như giữ bằng Ngân hàng, Tiền mặt, hay Sổ tiết kiệm) chỉ là phương tiện kỹ thuật phía sau.
> - **Mục đích sống còn của người dùng khi nhìn vào Tài khoản**: Biết chính xác *"Khoản tiền cho mục đích này hiện có bao nhiêu số dư khả dụng, đã được rót vào bao nhiêu từ lương/thu nhập (Transfer In), và đã chi tiêu bao nhiêu cho mục đích đó (Expense)?"*

Người dùng có thể:
- Đặt tên Khoản tiền theo mục đích sử dụng tự do (`name`: ví dụ *"Nuôi con"*, *"Phụng dưỡng bố mẹ"*, *"Đầu tư quán cà phê"*...).
- Ghi chú kế hoạch / diễn giải mục đích (`note`: ví dụ *"Chi tiền sữa, học phí cho bé"*, *"Tiền gửi về quê định kỳ ngày 15"*, *"Vốn dự phòng vận hành 3 tháng đầu"*...).
- Nhập số tiền ban đầu (`initialBalance`).
- Theo dõi số dư thực tế theo thời gian thực (`currentBalance`).
- Ghi nhận các giao dịch liên quan trực tiếp đến Khoản tiền (`INCOME` thu nhập, `EXPENSE` chi cho mục đích, `TRANSFER` rót tiền phân bổ giữa các khoản).
- Chọn hình thức lưu trữ (`Account Type`: `BANK`, `CASH`, `CREDIT_CARD`) để hệ thống tính toán tài sản ròng và thanh khoản.

## 10.2 Quyết Định Thiết Kế Domain: KHÔNG Tạo Entity "Fund" Riêng

- Hệ thống **KHÔNG thiết kế một entity/module riêng tên "Fund"** chỉ để xử lý các mục đích như: Nuôi con, Phụng dưỡng bố mẹ, Đầu tư quán cà phê, Tiết kiệm, Du lịch, Quỹ dự phòng...
- Trong domain FinMan, toàn bộ các mục đích trên được biểu diễn chuẩn mực bằng **Account là Khoản tiền mục đích** (Purpose Pocket) với tên gọi rõ ràng, thuộc tính `note` chi tiết và `Account Type` phù hợp.
  - Ví dụ: Khoản tiền *"Nuôi con"* (Initial Balance: `10.000.000đ`, Note: *"Chi tiêu ăn uống, học phí, tiêm phòng cho con"*).
  - Ví dụ: Khoản tiền *"Phụng dưỡng bố mẹ"* (Initial Balance: `5.000.000đ`, Note: *"Biếu bố mẹ hàng tháng và thuốc thang khám bệnh"*).
  - Ví dụ: Khoản tiền *"Đầu tư quán cà phê"* (Initial Balance: `50.000.000đ`, Note: *"Vốn góp mở quán cà phê cùng bạn"*).
- **Tuyệt đối không tự ý biến các khoản tiền mục đích này thành Budget**.

## 10.3 Phân Biệt Rạch Ròi: Account vs Budget

Tài liệu quy định rạch ròi hai khái niệm domain độc lập này:

| Đặc tính | Account (Đơn vị tài chính) | Budget (Ngân sách chi tiêu) |
|---|---|---|
| **Câu hỏi giải quyết** | *"Tiền/tài sản/nghĩa vụ này đang được FinMan quản lý ở đâu?"* | *"Trong một khoảng thời gian, dự kiến/giới hạn chi bao nhiêu theo danh mục?"* |
| **Bản chất** | Nơi lưu giữ và dịch chuyển dòng tiền thực tế. | Hạn mức chi tiêu kế hoạch trong kỳ (tháng). |
| **Ví dụ** | TPBank, MBBank, Tiền mặt, Nuôi con, Tiết kiệm, Đầu tư... | Ngân sách tháng 09/2026: Ăn uống: 5tr, Đi lại: 2tr, Nuôi con: 3tr... |
| **Thuộc tính** | `type`, `name`, `balance`, `note`, `status/is_archived` | `month`, `category_id`, `amount` (hạn mức), `amount_spent` |
| **Tác động số dư** | Thay đổi trực tiếp khi có Transaction (Thu/Chi/Chuyển). | Không làm thay đổi số dư tài khoản; chỉ theo dõi tỷ lệ tiêu xài. |

- **Quy tắc bắt buộc**:
  - Không được mô tả Account như một Budget.
  - Không được dùng Budget để thay thế Account.
  - Ngân sách KHÔNG làm thay đổi số dư Account trực tiếp; Transaction mới làm thay đổi số dư Account.

## 10.4 Danh Sách Account Types (Hiện Tại vs Đề Xuất Mở Rộng)

Để tương thích với app mẫu mà dự án tham khảo và mở rộng tương lai, hệ thống phân định rõ ràng giữa phạm vi hiện tại và phạm vi mở rộng:

### A. Phạm vi triển khai hiện tại (Current Scope):
1. `CASH` — Tiền mặt (Ví tiền mặt vật lý).
2. `BANK` — Tài khoản ngân hàng (Tài khoản thanh toán, tài khoản mục đích: Nuôi con, Tiết kiệm, MBBank, TPBank...).
3. `CREDIT_CARD` — Thẻ tín dụng (Theo dõi dư nợ và hạn mức khả dụng).
4. `INVESTMENT` — Đầu tư (Cổ phiếu, chứng chỉ quỹ, vàng, bất động sản tích lũy).
5. `OTHER` — Loại tài chính khác / ví khác.

### B. Phạm vi đề xuất mở rộng (Proposed Scope — Chưa triển khai code):
6. `DEBIT_CARD` — Thẻ ghi nợ (Liên kết trực tiếp với tài khoản ngân hàng).
7. `CREDIT_LIMIT` — Hạn mức tín dụng cá nhân / Thấu chi.
8. `LOAN` — Cho vay / Khoản nợ phải trả (Nghiệp vụ tính lãi, lịch trả góp).
9. `INSURANCE` — Bảo hiểm (Nghiệp vụ hợp đồng, tích lũy giá trị hoàn lại).
10. `CRYPTO` — Tiền điện tử / Tài sản số.

> [!IMPORTANT]
> **Ranh giới kế hoạch**: Hiện tại hệ thống hỗ trợ 5 loại tài khoản hoạt động (`CASH`, `BANK`, `CREDIT_CARD`, `INVESTMENT`, `OTHER`). Các loại từ 6 đến 10 được gắn nhãn là *Proposed Scope* cho giai đoạn mở rộng tiếp theo.

## 10.5 Nguyên Tắc Bắt Buộc: Account Name vs Account Type

- `Account Type`: Nhóm kỹ thuật/tài chính (`CASH`, `BANK`, `CREDIT_CARD`...).
- `Account Name`: Tên do người dùng đặt tự do thể hiện định danh thực tế hoặc mục đích quản lý.
  - Ví dụ: Type: `BANK`, Name: `"Nuôi con"` ➔ Account này thuộc nhóm `BANK` có tên tùy chỉnh `"Nuôi con"`.
  - **Cấm tuyệt đối**: Không được coi `"Nuôi con"` là một `Account Type`. Không được tạo enum mã nguồn như `CHILD_CARE`, `PERSONAL`, `SAVING` chỉ để biểu diễn mục đích của tài khoản. Mục đích tài khoản được biểu diễn hoàn toàn qua trường `name`.

## 10.6 Vòng Đời Tài Khoản (Account Lifecycle & Archiving)

Hệ thống quản lý các trạng thái vòng đời của Account:
- **Tạo mới (Create)**: Thiết lập Name, Type, Initial Balance, Note.
- **Xem / Theo dõi (View)**: Xem số dư hiện tại, lịch sử giao dịch gắn liền.
- **Chỉnh sửa (Edit)**: Sửa tên hiển thị, ghi chú (không sửa trực tiếp số dư mà qua giao dịch điều chỉnh).
- **Lưu trữ (Archive Account)**:
  - Nếu Account **đã có lịch sử giao dịch**: **KHÔNG ĐƯỢC PHÉP XÓA CỨNG (Hard Delete)** để bảo toàn tính toàn vẹn dữ liệu tài chính.
  - Hệ thống áp dụng cờ `is_archived = true` (Lưu trữ / Đóng tài khoản).
  - Khi đã lưu trữ:
    + Không cho phép tạo thêm giao dịch mới liên quan đến tài khoản này.
    + Bảo toàn 100% lịch sử giao dịch và dữ liệu thống kê trong quá khứ.
    + Cho phép người dùng xem lại trong mục "Tài khoản đã lưu trữ" hoặc mở lại khi cần.
- **Xóa (Delete)**: Chỉ cho phép xóa cứng khi tài khoản mới tạo và **chưa phát sinh bất kỳ giao dịch nào**.

---

# 11. Account Business Rules & Balance Rules

## 11.1 Quy Tắc Tính Số Dư Tài Khoản (Balance Rules)

### A. Nhóm Tài sản (Asset Accounts: CASH, BANK, DEBIT_CARD, các Asset accounts)

Số dư tài khoản tài sản phản ánh lượng tiền khả dụng thực tế:

$$\text{Balance}_{\text{hiện tại}} = \text{Initial Balance} + \sum \text{Income} + \sum \text{Transfer In} - \sum \text{Expense} - \sum \text{Transfer Out}$$

- `Initial Balance`: Số dư ban đầu khi tạo tài khoản.
- `Income`: Giao dịch thu nhập trực tiếp vào tài khoản.
- `Transfer In`: Giao dịch chuyển tiền từ tài khoản khác tới tài khoản này.
- `Expense`: Giao dịch chi tiêu từ tài khoản này.
- `Transfer Out`: Giao dịch chuyển tiền từ tài khoản này sang tài khoản khác.

### B. Nhóm Nghĩa Vụ / Khoản Nợ (Liability Accounts: CREDIT_CARD, LOAN)

Không áp dụng công thức của tài khoản tài sản một cách máy móc:
- Thẻ tín dụng và khoản vay theo dõi **Dư nợ hiện tại (Current Outstanding Debt)**:
  - Giao dịch chi tiêu (`EXPENSE`): Làm **tăng** dư nợ phải trả.
  - Giao dịch thanh toán nợ (`INCOME` hoặc `TRANSFER` từ Bank vào Thẻ): Làm **giảm** dư nợ phải trả.
- Hạn mức khả dụng (Available Credit):
  $$\text{Available Credit} = \text{Credit Limit} - \text{Current Outstanding Debt}$$

## 11.2 Công Thức Tài Sản Ròng (Net Worth)

$$\text{Total Assets} = \sum \text{Balance của các Asset Accounts (với Balance } \ge 0\text{)}$$
$$\text{Total Liabilities} = \sum \text{Dư nợ Credit Card} + \sum |\text{Balance âm của Asset Accounts}|$$
$$\text{Net Worth} = \text{Total Assets} - \text{Total Liabilities}$$

> [!NOTE]
> Giao dịch chuyển khoản nội bộ (`TRANSFER`) di chuyển tiền giữa 2 tài khoản cùng thuộc sở hữu của người dùng, do đó:
> - Giảm số dư tài khoản chuyển và tăng số dư tài khoản nhận với cùng số tiền.
> - **Tổng tài sản (Total Assets) và Tài sản ròng (Net Worth) hoàn toàn không đổi.**

---

# 12. Dashboard & Statistics (Thống Kê Tài Chính Chuẩn Xác)

Màn hình **Dashboard** và **Statistics** phân tách rõ rệt giữa:
- **Dòng tiền thực thu / thực chi (Cash Flow)**.
- **Dòng dịch chuyển nội bộ (Transfer)**.
- **Biến động tài sản (Net Worth & Balances)**.

## 12.1 Quy Tắc Cốt Lõi Về Thống Kê & Transfer

- **Giao dịch TRANSFER tuyệt đối KHÔNG được tính là Thu nhập (Income)**.
- **Giao dịch TRANSFER tuyệt đối KHÔNG được tính là Chi tiêu (Expense)**.
- Ví dụ:
  - Tổng Income ghi nhận: `50.000.000đ`
  - Tổng Transfer nội bộ: `50.000.000đ`
  - Tổng Expense ghi nhận: `500.000đ`
  - **Thống kê Thu nhập phải hiển thị đúng**: `50.000.000đ`
  - **Thống kê Chi tiêu phải hiển thị đúng**: `500.000đ`
  - **Dòng tiền ròng**: `49.500.000đ`
  - Transfer không được làm sai lệch bất kỳ biểu đồ hay chỉ số thu/chi nào.

## 12.2 Kịch Bản Nghiệp Vụ Mẫu Từ Giảng Viên (Teacher's Flow)

Kịch bản chuẩn hóa bắt buộc phải có trong luồng vận hành của FinMan:

1. **Khởi tạo & Nhận thu nhập ban đầu**:
   - Người dùng sở hữu tài khoản `TPBank` (loại `BANK`).
   - Người dùng nhận lương tháng: `50.000.000đ` vào tài khoản `TPBank`.
   - Hệ thống ghi nhận:
     - Giao dịch: `INCOME` | Số tiền: `50.000.000đ` | Tài khoản: `TPBank` | Danh mục: `Lương`.
     - Số dư TPBank: `50.000.000đ`.
     - Thống kê Thu nhập tháng: `50.000.000đ`.
     - Tổng tài sản (Total Assets): `50.000.000đ`.
2. **Phân bổ tiền sang các tài khoản mục đích thông qua TRANSFER**:
   - Người dùng thực hiện 3 giao dịch chuyển khoản nội bộ:
     + Chuyển `30.000.000đ` từ `TPBank` sang tài khoản `"Cá nhân"` (loại `CASH` hoặc `BANK`).
     + Chuyển `10.000.000đ` từ `TPBank` sang tài khoản `"Nuôi con"` (loại `BANK`).
     + Chuyển `10.000.000đ` từ `TPBank` sang tài khoản `"Tiết kiệm"` (loại `BANK`).
3. **Kết quả hệ thống sau phân bổ**:
   - Số dư `TPBank`: Giảm `50.000.000đ` (về `0đ`).
   - Số dư `"Cá nhân"`: Tăng `30.000.000đ` (bằng `30.000.000đ`).
   - Số dư `"Nuôi con"`: Tăng `10.000.000đ` (bằng `10.000.000đ`).
   - Số dư `"Tiết kiệm"`: Tăng `10.000.000đ` (bằng `10.000.000đ`).
   - **Tổng tài sản (Total Assets) của người dùng**: Vẫn bảo toàn chính xác `50.000.000đ`.
   - **Thống kê Thu nhập tháng**: Vẫn giữ nguyên `50.000.000đ` (không bị ghi nhận thành thu nhập mới để phồng lên 100.000.000đ).
   - **Thống kê Chi tiêu tháng**: Vẫn bằng `0đ`.

## 12.3 Luồng Giao Dịch Chi Tiêu & Mối Quan Hệ Với Ngân Sách (Example Transaction Flow)

1. **Khởi tạo Account & Thiết lập Ngân sách**:
   - Người dùng tạo Account: Type: `BANK`, Name: `"Nuôi con"`, Initial Balance: `10.000.000đ`.
   - Người dùng thiết lập Ngân sách (Budget) tháng 09/2026: Danh mục `"Trẻ em"`, Hạn mức: `3.000.000đ`.
2. **Phát sinh giao dịch chi tiêu**:
   - Người dùng tạo Expense:
     + Số tiền: `500.000đ`
     + Danh mục: `"Trẻ em"`
     + Tài khoản: `"Nuôi con"`
3. **Hệ thống cập nhật độc lập**:
   - Số dư tài khoản `"Nuôi con"`: Giảm từ `10.000.000đ` xuống `9.500.000đ`.
   - Thống kê chi tiêu toàn hệ thống: Tăng thêm `500.000đ`.
   - Tiến độ ngân sách `"Trẻ em"`: Tăng phần đã chi `500.000đ` / `3.000.000đ` (16.7%).
4. **Nguyên lý quan trọng**:
   - **Ngân sách (Budget) KHÔNG làm thay đổi số dư Account trực tiếp**.
   - **Chính Giao dịch (Transaction) mới làm thay đổi số dư Account**.
   - Tài khoản `"Nuôi con"` có thể chi cho nhiều danh mục khác nhau, và Ngân sách `"Trẻ em"` có thể được chi từ nhiều tài khoản khác nhau (ví dụ vừa chi từ "Nuôi con" vừa chi từ "Tiền mặt"). Hai thực thể này hoàn toàn độc lập.

---

# 13. Statistics — Expense

Hiển thị cơ cấu chi tiêu thực tế (không chứa Transfer):
- Tổng chi tiêu trong kỳ.
- Phân bổ theo từng danh mục (Pie chart & Tỷ lệ %).
- Danh sách top danh mục chi nhiều nhất.

Ví dụ tháng 9:
```text
Thu:               50.000.000đ
Chi:                1.500.000đ
Chênh lệch (Dư):   48.500.000đ
```

Cơ cấu chi tiêu:
```text
Trẻ em:            500.000đ   (33.3%)
Áo quần:         1.000.000đ   (66.7%)
```

---

# 14. Statistics — Income

Phân tích các nguồn thu nhập thực tế (không chứa Transfer):
- Nguồn thu nhập (Lương, Freelance, Thưởng, Đầu tư...).
- Tỷ lệ từng nguồn thu và xu hướng biến động theo thời gian.

---

# 15. Budget Management (Quản Lý Ngân Sách)

Người dùng thiết lập hạn mức chi tiêu dự kiến theo tháng cho từng danh mục chi tiêu cụ thể.

Ví dụ:
```text
Ngân sách tháng 09/2026:
- Ăn uống:        2.000.000đ
- Trẻ em:         3.000.000đ
- Giải trí:       1.000.000đ
- Áo quần:        1.000.000đ
```

Mỗi ngân sách theo dõi:
```text
Hạn mức (Budget Limit)  ➔  Đã chi (Amount Spent)  ➔  Còn lại (Remaining)
```

## Budget Progress & Cảnh báo:
- $\text{Chi tiêu} < 80\% \text{ Budget}$: Bình thường (Xanh lá).
- $80\% \le \text{Chi tiêu} \le 100\% \text{ Budget}$: Cảnh báo sắp chạm hạn mức (Cam).
- $\text{Chi tiêu} > 100\% \text{ Budget}$: Báo động đỏ vượt hạn mức.

> [!IMPORTANT]
> **Nhắc lại nguyên tắc domain**: Budget chỉ theo dõi tiến độ chi tiêu của Category, **không phải là Account**, không giữ số dư tiền và không thay thế cho Account.
   ↓
Remaining
```

## Budget Progress

Ví dụ:

```text
Áo quần

1.000.000đ / 1.000.000đ

████████████████ 100%
```

Khi vượt ngân sách:

```text
1.200.000đ / 1.000.000đ

120%
```

Hệ thống phải cảnh báo người dùng.

---

# 16. Notes

Màn hình **Ghi chú** hiển thị các giao dịch theo nội dung note.

Ví dụ:

```text
Ghi chú                  Số tiền

quần uniqlo              1.000.000đ
test                        90.000đ
```

Cho phép:

- Search note.
- Sort.
- Xem giao dịch liên quan.

---

# 17. Date & Period Filtering

FinMan hỗ trợ các khoảng thời gian:

### Tuần

Hiển thị giao dịch trong tuần.

### Tháng

Ví dụ:

```text
01/09 → 30/09
```

### Hàng năm

```text
01/01 → 31/12
```

### Period

Người dùng tự chọn:

```text
From: 01/09/2026
To:   16/09/2026
```

---

# 18. Search & Filter

Người dùng có thể tìm giao dịch theo:

- Keyword
- Category
- Account
- Transaction type
- Date
- Amount

Ví dụ:

```text
Search: uniqlo

→ quần uniqlo
  1.000.000đ
```

---

# 19. Export Data

FinMan hỗ trợ xuất dữ liệu tài chính.

Từ màn hình Summary:

**Trích xuất Excel (.xlsx) qua e-mail**

Flow:

```text
User clicks Export
        ↓
Select period
        ↓
Generate Excel
        ↓
Send to user's email
```

File Excel chứa:

- Date
- Type
- Amount
- Category
- Account
- Note

---

# 20. More / Settings

Màn hình **Hơn** bao gồm:

```text
Thông tin cá nhân
Tài khoản
Danh mục
Cài đặt
Xuất dữ liệu
Đăng xuất
```

---

# 21. Profile

Người dùng có thể xem:

- Avatar
- Full name
- Email

Có thể chỉnh sửa:

- Full name
- Avatar
- Password

---

# 22. Logout

Khi người dùng chọn:

**Đăng xuất**

Hiển thị confirmation:

> Bạn có chắc chắn muốn đăng xuất?

Buttons:

```text
Hủy        Đăng xuất
```

Sau khi logout:

```text
→ Login Screen
```

---

# 23. UI/UX Requirements

## 23.1 Brand Identity

Tên:

**FinMan**

Logo sử dụng logo **FM** dạng huy hiệu kim loại vàng trên nền đen mà người dùng cung cấp.

Phong cách logo:

- Luxury
- Premium
- Financial
- Professional
- Trustworthy

Logo cần được sử dụng ở:

- Splash screen
- Login
- Register
- Profile/App branding

---

# 24. Color System

Dựa trên giao diện tham khảo:

### Primary

```text
#FF6B61
```

Sử dụng cho:

- Primary button
- Active tab
- Expense
- Important actions

### Income

```text
#2684FF
```

### Expense

```text
#FF634E
```

### Background

```text
#F7F7FA
```

### Text

Black / dark gray.

---

# 25. Design Principles

UI phải:

### Simple

Không nhồi quá nhiều thông tin trên một màn hình.

### Financial-focused

Các con số tài chính phải dễ nhìn.

### Visual

Ưu tiên:

- Cards
- Charts
- Progress bars
- Summary numbers

### Consistent

Các màn hình phải dùng chung:

- Typography
- Spacing
- Color
- Icon style
- Button style
- Card style

---

# 26. Core User Flow

## New User

```text
Splash
 ↓
Login
 ↓
Register
 ↓
Create account
 ↓
Home
 ↓
Create first transaction
 ↓
Dashboard
```

## Existing User

```text
Splash
 ↓
Login
 ↓
Home
```

## Add Expense

```text
Home
 ↓
+
 ↓
Chi tiêu
 ↓
Amount
 ↓
Category
 ↓
Account
 ↓
Date
 ↓
Note
 ↓
Save
 ↓
Home
```

## Analyze Spending

```text
Home
 ↓
Thống kê
 ↓
Chọn Tháng
 ↓
Chi
 ↓
Pie Chart
 ↓
Expense breakdown
```

---

# 27. MVP Scope

| Module | MVP |
|---|---|
| Login | ✅ |
| Register | ✅ |
| Google Login | ✅ |
| Transaction | ✅ |
| Income | ✅ |
| Expense | ✅ |
| Category | ✅ |
| Account | ✅ |
| Budget | ✅ |
| Statistics | ✅ |
| Notes | ✅ |
| Search/Filter | ✅ |
| Export Excel | ✅ |
| Profile | ✅ |
| Logout | ✅ |

---

# 28. Non-functional Requirements

## Security

- Password phải được mã hóa.
- Authentication sử dụng token.
- Người dùng chỉ được truy cập dữ liệu của chính mình.
- API phải kiểm tra authentication/authorization.

## Performance

Các thao tác:

- Login
- Load transactions
- Add transaction
- Load statistics

cần phản hồi nhanh và không làm UI bị treo.

## Data Consistency

Khi thêm/sửa/xóa transaction:

**Transaction → Account balance → Statistics → Budget**

phải được cập nhật nhất quán.

---

# 29. Acceptance Criteria

## Authentication

- User đăng ký thành công.
- Không cho đăng ký email trùng.
- Login thành công với thông tin hợp lệ.
- Login thất bại với thông tin không hợp lệ.
- Google Login hoạt động.
- Logout hoạt động.

## Transaction

- Có thể tạo transaction.
- Có thể edit.
- Có thể delete.
- Transaction xuất hiện đúng ngày.
- Thu/chi được tính đúng.
- Account balance cập nhật đúng.

## Statistics

- Tổng thu đúng.
- Tổng chi đúng.
- Net balance đúng.
- Category breakdown đúng.
- Pie chart phản ánh đúng dữ liệu.

## Budget

- Tạo budget.
- Hiển thị số tiền đã sử dụng.
- Hiển thị số tiền còn lại.
- Cảnh báo khi vượt budget.

---

# 30. Design Deliverable cho Stitch

Stitch cần thiết kế **toàn bộ hệ thống FinMan**, không chỉ một màn hình.

Các màn hình tối thiểu:

```text
01. Splash Screen
02. Login
03. Register
04. Google Login state
05. Forgot Password
06. Home / Transaction
07. Add Income
08. Add Expense
09. Edit Transaction
10. Transaction Detail
11. Statistics
12. Statistics — Budget
13. Statistics — Notes
14. Account
15. Add Account
16. Edit Account
17. Budget Setup
18. Category Management
19. Profile
20. Settings
21. Export Excel
22. Logout Confirmation
```

**Quan trọng:** Stitch phải thiết kế các màn hình như **một sản phẩm duy nhất**, đảm bảo navigation, component, typography, spacing, màu sắc và interaction nhất quán; không tạo ra 20 màn hình có phong cách khác nhau.

---

# 31. Product Structure

PRD là tài liệu gốc của FinMan. Các tài liệu và hoạt động triển khai được xây dựng dựa trên PRD:

```text
PRD
 │
 ├── UI/UX Design → Stitch
 │
 ├── Database Design
 │
 ├── API Specification
 │
 ├── Backend Implementation
 │
 ├── Frontend Implementation
 │
 └── Testing
```

Khi sử dụng AI để phát triển, AI phải đọc PRD và tuân thủ các requirement/business rule đã được định nghĩa. Không tự ý tạo business rule mới nếu chưa được đặc tả.

---

# 32. AI Smart Features (Tính Năng AI Thông Minh)

FinMan tích hợp công nghệ AI (Google Gemini API) nhằm tối ưu trải nghiệm người dùng, giảm thiểu thao tác nhập liệu thủ công:

## 32.1 AI Natural Language Quick Add (Nhập Nhanh Bằng Ngôn Ngữ Tự Nhiên)
- **Mô tả**: Người dùng có thể nhập một câu ngắn bằng tiếng Việt (hoặc voice-to-text) miêu tả giao dịch, AI sẽ bóc tách và tự động điền form giao dịch để người dùng xác nhận trước khi lưu. AI có khả năng nhận diện cả 3 loại giao dịch: `INCOME`, `EXPENSE`, và `TRANSFER`, đồng thời bóc tách đúng tài khoản theo tên tùy chỉnh của người dùng (ví dụ: "tiền mặt", "Nuôi con", "TPBank", "Tiết kiệm"...).
- **Ví dụ đầu vào**:
  - `"Ăn bún đậu mắm tôm 55k ví MoMo"` ➔ EXPENSE, 55.000đ, Danh mục: Ăn uống, Tài khoản: MoMo
  - `"Mua sữa cho con 500k từ tài khoản Nuôi con"` ➔ EXPENSE, 500.000đ, Danh mục: Trẻ em / Gia đình, Tài khoản: Nuôi con
  - `"Nhận lương tháng 9 50 triệu tài khoản TPBank hôm qua"` ➔ INCOME, 50.000.000đ, Danh mục: Tiền lương, Tài khoản: TPBank
  - `"Chuyển 10 triệu từ TPBank sang Nuôi con"` ➔ TRANSFER, 10.000.000đ, Từ tài khoản: TPBank, Đến tài khoản: Nuôi con
- **Cấu trúc JSON đầu ra AI trả về**:
  ```json
  {
    "type": "EXPENSE",
    "amount": 500000,
    "categoryName": "Trẻ em",
    "accountName": "Nuôi con",
    "toAccountName": null,
    "note": "Mua sữa cho con",
    "transactionDate": "2026-09-16"
  }
  ```
  *(Nếu là `TRANSFER`, AI trả về `"type": "TRANSFER"`, `"accountName": "TPBank"`, `"toAccountName": "Nuôi con"`, `"categoryName": null`)*.
- **Business Rule & Fallback**:
  - **Nhận diện Tài khoản**: AI đối chiếu `accountName` trích xuất được với danh sách tài khoản thực tế của người dùng (khớp theo tên tùy chỉnh).
  - **Fallback an toàn**: Nếu AI **không xác định được tài khoản**, **TUYỆT ĐỐI KHÔNG tự ý tạo mới tài khoản**. Hệ thống fallback chọn tài khoản mặc định ("Tiền mặt") hoặc tài khoản có số dư lớn nhất, và hiển thị rõ ràng trên giao diện để người dùng chọn lại trước khi bấm Lưu.
  - Nếu AI không xác định được danh mục (`categoryName`), chọn danh mục "Khác" (hoặc để trống nếu là `TRANSFER`).
  - Nếu câu nhập không trích xuất được số tiền hợp lệ (`amount <= 0`), trả về lỗi: `"Không thể nhận diện giao dịch. Vui lòng nhập rõ số tiền và nội dung."`
  - Dữ liệu luôn hiển thị lên popup/form để người dùng kiểm tra và bấm "Lưu" (không tự ý âm thầm lưu vào DB).

## 32.2 AI Financial Advisor & Spending Insights (Trợ Lý Tư Vấn Tài Chính)
- **Mô tả**: Dựa trên dữ liệu thu chi hàng tháng, AI tổng hợp các đánh giá khách quan về thói quen chi tiêu của người dùng.
- **Nội dung cung cấp**:
  - *Cảnh báo bội chi*: Cảnh báo các danh mục có tốc độ chi tiêu tăng đột biến (> 30% so với trung bình).
  - *Dự báo dòng tiền*: Dự báo số tiền còn lại đến cuối tháng dựa trên tốc độ tiêu dùng hiện tại (bỏ qua các giao dịch Transfer nội bộ để không làm sai lệch dòng tiền).
  - *Gợi ý tiết kiệm*: Đưa ra 1 - 2 gợi ý hành động thiết thực.
- **Tần suất**: Người dùng bấm nút "Phân tích AI" tại màn hình Thống kê hoặc nhận tổng kết vào cuối tháng.

---

# 33. Detailed Validation Matrix (Ma Trận Kiểm Tra Dữ Liệu)

| Module | Trường dữ liệu | Bắt buộc | Kiểu dữ liệu / Format | Ràng buộc nghiệp vụ (Constraints) | Thông báo lỗi khi vi phạm |
|---|---|---|---|---|---|
| **Auth** | Full Name | Có | String (2 - 50 ký tự) | Không chứa ký tự đặc biệt nguy hiểm | Họ tên phải từ 2 đến 50 ký tự |
| **Auth** | Email | Có | Email format | Đúng chuẩn RFC 5322, duy nhất trong hệ thống | Email không đúng định dạng / Email đã được sử dụng |
| **Auth** | Password | Có | String (>= 6 ký tự) | Tối thiểu 6 ký tự, khuyến khích có chữ & số | Mật khẩu phải có ít nhất 6 ký tự |
| **Auth** | Confirm Password | Có | String | Phải khớp 100% với trường Password | Mật khẩu xác nhận không khớp |
| **Account** | Account Name | Có | String (1 - 50 ký tự) | Tên tùy chỉnh do người dùng đặt (ví dụ: Nuôi con, TPBank, Tiền mặt cá nhân...), duy nhất trong danh sách tài khoản của User | Tên tài khoản không được để trống hoặc trùng lặp |
| **Account** | Account Type | Có | Enum | **Current Scope**: `CASH` (Tiền mặt), `BANK` (Ngân hàng), `CREDIT_CARD` (Thẻ tín dụng), `INVESTMENT` (Đầu tư), `OTHER` (Khác).<br>**Proposed Scope**: `DEBIT_CARD`, `CREDIT_LIMIT`, `LOAN`, `INSURANCE`, `CRYPTO` | Loại tài khoản không hợp lệ |
| **Account** | Initial Balance | Có | Integer / Long | >= 0 đối với Cash, Bank, Investment, Other. Đối với Credit Card: Số dư nợ ban đầu >= 0 | Số dư ban đầu không được âm |
| **Account** | Credit Limit | Tùy chọn | Integer / Long | Bắt buộc nếu là `CREDIT_CARD`, giá trị >= 0 | Hạn mức thẻ tín dụng phải lớn hơn hoặc bằng 0 |
| **Account** | Note | Tùy chọn | String (<= 255 ký tự) | Ghi chú diễn giải mục đích tài khoản *(Proposed field)* | Ghi chú không được vượt quá 255 ký tự |
| **Account** | is_archived / status | Có | Boolean / Enum | Mặc định `false` (Active). Chuyển `true` (Archived) khi người dùng lưu trữ tài khoản đã có giao dịch | Trạng thái tài khoản không hợp lệ |
| **Category**| Category Name | Có | String (1 - 40 ký tự) | Duy nhất trong cùng loại thu/chi của User | Tên danh mục không được để trống hoặc trùng |
| **Category**| Category Type | Có | Enum | Thuộc: `INCOME` (Thu nhập) hoặc `EXPENSE` (Chi tiêu) | Loại danh mục phải là Thu nhập hoặc Chi tiêu |
| **Category**| Icon / Emoji | Tùy chọn | String (1 - 10 ký tự) | Biểu tượng hiển thị (ví dụ: 🍜, 💰) | Biểu tượng không hợp lệ |
| **Transaction** | Type | Có | Enum | Thuộc: `INCOME` (Thu nhập), `EXPENSE` (Chi tiêu), `TRANSFER` (Chuyển khoản nội bộ) | Loại giao dịch không hợp lệ |
| **Transaction** | Amount | Có | Integer / Long | > 0 và <= 10.000.000.000đ (10 tỷ) | Số tiền phải lớn hơn 0 |
| **Transaction** | Account ID (From) | Có | UUID / Long | Phải tồn tại, thuộc sở hữu của User, và không ở trạng thái Archived | Vui lòng chọn tài khoản hợp lệ |
| **Transaction** | To Account ID | Bắt buộc nếu là `TRANSFER` | UUID / Long | Phải tồn tại, thuộc sở hữu của User, không ở trạng thái Archived, và **phải khác Account ID nguồn** | Tài khoản nhận tiền phải khác tài khoản chuyển |
| **Transaction** | Category ID | Bắt buộc nếu `INCOME` hoặc `EXPENSE` | UUID / Long | Phải tồn tại và đúng Type (`INCOME` hoặc `EXPENSE`). Với `TRANSFER`: Trường này là tùy chọn / NULL | Vui lòng chọn danh mục phù hợp |
| **Transaction** | Date | Có | Date (YYYY-MM-DD) | Không được vượt quá ngày hiện tại quá 1 năm trong tương lai | Ngày giao dịch không hợp lệ |
| **Transaction** | Note | Tùy chọn | String (<= 255 ký tự) | Ghi chú thêm | Ghi chú không được vượt quá 255 ký tự |
| **Budget** | Month | Có | String (YYYY-MM) | Đúng định dạng năm-tháng | Tháng ngân sách không đúng định dạng YYYY-MM |
| **Budget** | Category ID | Có | UUID / Long | Phải là Category loại `EXPENSE`, duy nhất 1 budget/category/tháng | Danh mục đã có ngân sách trong tháng này |
| **Budget** | Amount | Có | Integer / Long | > 0 và <= 10.000.000.000đ | Số tiền ngân sách phải lớn hơn 0 |

---

# 34. Detailed Business Rules (Quy Tắc Nghiệp Vụ Chuyên Sâu)

## 34.1 Quy Tắc Lưu Trữ Và Tính Toán Tiền Tệ
1. **Tiền tệ VND**:
   - Sử dụng đơn vị Đồng Việt Nam (VND).
   - VND không có phần thập phân. Tất cả số tiền trong Database và Backend lưu dưới dạng số nguyên (`Long` trong Java, `BIGINT` trong PostgreSQL).
   - Tuyệt đối không dùng số thực `Float`/`Double` để tính toán tiền tệ nhằm triệt tiêu sai số dấu phẩy động.
2. **Công Thức Số Dư Tài Khoản (Account Balance)**:
   - **Tài khoản Tài sản (Asset Accounts: CASH, BANK, DEBIT_CARD...)**:
     $$\text{Balance}_{\text{hiện tại}} = \text{Initial Balance} + \sum \text{Income} + \sum \text{Transfer In} - \sum \text{Expense} - \sum \text{Transfer Out}$$
   - **Tài khoản Thẻ tín dụng & Khoản nợ (Liability Accounts: CREDIT_CARD, LOAN...)**:
     - Theo dõi Dư nợ hiện tại (Current Outstanding Debt).
     - Chi tiêu (`EXPENSE`): Dư nợ tăng lên.
     - Trả nợ thẻ / Thanh toán nợ (`INCOME` hoặc `TRANSFER In`): Dư nợ giảm xuống.
3. **Công Thức Tài Sản Ròng (Net Worth)**:
   $$\text{Total Assets} = \sum \text{Balance của các Asset Accounts (với Balance } \ge 0\text{)}$$
   $$\text{Total Liabilities} = \sum \text{Dư nợ Thẻ tín dụng} + \sum |\text{Balance âm của Asset Accounts}|$$
   $$\text{Net Worth} = \text{Total Assets} - \text{Total Liabilities}$$
   *Giao dịch TRANSFER di chuyển giữa 2 tài khoản của cùng một user không làm thay đổi Net Worth.*

## 34.2 Quy Tắc Cập Nhật Số Dư Khi Thêm / Sửa / Xóa Giao Dịch
- **Thêm giao dịch**:
  - `INCOME`: Cộng `amount` vào số dư của tài khoản nhận.
  - `EXPENSE`: Trừ `amount` khỏi số dư của tài khoản nguồn.
  - `TRANSFER`: Trừ `amount` khỏi tài khoản chuyển (`from_account`) và cộng `amount` vào tài khoản nhận (`to_account`).
- **Xóa giao dịch**:
  - Nếu xóa `INCOME`: Trừ lại `amount` khỏi số dư của tài khoản.
  - Nếu xóa `EXPENSE`: Hoàn trả (cộng lại) `amount` vào số dư của tài khoản.
  - Nếu xóa `TRANSFER`: Cộng lại `amount` vào tài khoản chuyển (`from_account`) và trừ lại `amount` khỏi tài khoản nhận (`to_account`).
- **Chỉnh sửa giao dịch**:
  - Hệ thống tự động hoàn tác ảnh hưởng của giao dịch cũ lên các tài khoản liên quan cũ, sau đó áp dụng ảnh hưởng của giao dịch mới lên các tài khoản mới trong cùng một Database Transaction (`@Transactional`) để đảm bảo tính nhất quán (ACID).

## 34.3 Quy Tắc Xóa Dữ Liệu & Vòng Đời Tài Khoản (Account Lifecycle & Integrity Constraints)
- **Xóa Danh mục (Category)**:
  - Nếu danh mục đã phát sinh giao dịch: Không cho phép xóa cứng (Hard Delete). Hệ thống thông báo yêu cầu đổi tên hoặc chuyển giao dịch sang danh mục khác.
- **Xóa Tài khoản (Account Lifecycle)**:
  - Tài khoản **đã có lịch sử giao dịch**: **TUYỆT ĐỐI KHÔNG XÓA CỨNG (Hard Delete)** để không làm gãy chuỗi lịch sử tài chính và số liệu thống kê.
  - Người dùng thực hiện thao tác **Lưu trữ / Đóng tài khoản (Archive Account)**: chuyển `is_archived = true`.
  - Tài khoản đã lưu trữ:
    + Không cho phép tạo giao dịch mới liên quan đến tài khoản này.
    + Bảo toàn nguyên vẹn 100% lịch sử giao dịch, số dư và dữ liệu báo cáo trong quá khứ.
    + Có thể kích hoạt lại (Unarchive) nếu người dùng có nhu cầu sử dụng tiếp.
  - Chỉ cho phép xóa cứng tài khoản nếu tài khoản đó vừa tạo mới và **hoàn toàn chưa có bất kỳ giao dịch nào**.

## 34.4 Quy Tắc Ngân Sách (Budget Rules)
- Ngân sách áp dụng theo chu kỳ từng tháng (từ ngày 01 đến ngày cuối cùng của tháng đó).
- Chỉ áp dụng ngân sách cho danh mục **Chi tiêu (EXPENSE)**.
- Giao dịch chuyển khoản nội bộ (`TRANSFER`) **hoàn toàn không ảnh hưởng đến Ngân sách**.
- Khi người dùng tạo giao dịch chi tiêu trong tháng, hệ thống tự động cộng dồn vào `amount_spent` của budget tương ứng với Category đó.
- **Ngân sách và Tài khoản là độc lập**: Budget không làm thay đổi số dư tài khoản trực tiếp; chỉ giao dịch mới làm thay đổi số dư tài khoản.
- **Ngưỡng cảnh báo**:
  - $\text{Chi tiêu} < 80\% \text{ Budget}$: Trạng thái Bình thường (Xanh lá / Trung tính).
  - $80\% \le \text{Chi tiêu} \le 100\% \text{ Budget}$: Cảnh báo Sắp chạm hạn mức (Vàng / Cam).
  - $\text{Chi tiêu} > 100\% \text{ Budget}$: Cảnh báo Vượt hạn mức (Đỏ).

---

# 35. Detailed Acceptance Criteria (Tiêu Chí Nghiệm Thu Chuẩn Hóa)

### Scenario AC-01: Đăng ký tài khoản mới thành công
- **Given**: Người dùng ở màn hình Register và nhập email chưa từng đăng ký `user@example.com`, họ tên hợp lệ, password `123456`, confirm password `123456`.
- **When**: Người dùng nhấn nút "Đăng ký".
- **Then**: Hệ thống tạo tài khoản mới thành công, mã hóa mật khẩu, tự động khởi tạo các danh mục mặc định (Ăn uống, Giải trí, Lương...) và tài khoản mặc định ("Tiền mặt", Type: `CASH`, balance 0đ), trả về JWT Token và chuyển hướng về màn hình Home.

### Scenario AC-02: Thêm giao dịch chi tiêu và kiểm tra cập nhật số dư
- **Given**: Tài khoản "Tiền mặt" có số dư hiện tại là `2.000.000đ`.
- **When**: Người dùng tạo giao dịch Chi tiêu `500.000đ`, danh mục "Ăn uống", tài khoản "Tiền mặt", ngày hôm nay.
- **Then**: Giao dịch xuất hiện trong danh sách giao dịch ngày hôm nay với màu cam/đỏ `-500.000đ`, số dư tài khoản "Tiền mặt" cập nhật thành `1.500.000đ`, ngân sách "Ăn uống" tháng này tăng phần đã chi thêm `500.000đ`.

### Scenario AC-03: Nhập giao dịch nhanh bằng AI (Natural Language Quick Add) với tài khoản tùy chỉnh
- **Given**: Người dùng có tài khoản "Nuôi con" (Type: `BANK`) và mở popup nhập nhanh AI, gõ: `"Mua sữa bột cho bé 500k từ tài khoản Nuôi con"`.
- **When**: Người dùng nhấn "Xử lý bằng AI".
- **Then**: Form giao dịch tự động điền: Loại: Chi tiêu, Số tiền: 500.000đ, Danh mục: Trẻ em / Gia đình, Tài khoản: "Nuôi con", Ghi chú: "Mua sữa bột cho bé". Người dùng chỉ cần nhấn "Lưu" để hoàn tất.

### Scenario AC-04: Cảnh báo vượt ngân sách
- **Given**: Ngân sách danh mục "Áo quần" tháng này là `1.000.000đ`, đã chi `800.000đ`.
- **When**: Người dùng thêm giao dịch chi tiêu mới `300.000đ` cho "Áo quần".
- **Then**: Tổng chi đạt `1.100.000đ` (110%), thanh tiến độ hiển thị màu đỏ và hệ thống hiển thị thông báo cảnh báo vượt ngân sách `100.000đ`.

### Scenario AC-05: Chuyển khoản nội bộ giữa các tài khoản (TRANSFER & Teacher's Flow)
- **Given**: Người dùng có tài khoản TPBank số dư `50.000.000đ` (từ nhận lương trước đó), tài khoản "Nuôi con" có `0đ`, tài khoản "Tiết kiệm" có `0đ`.
- **When**: Người dùng thực hiện 2 giao dịch chuyển khoản nội bộ:
  1. Chuyển `10.000.000đ` từ TPBank sang "Nuôi con".
  2. Chuyển `10.000.000đ` từ TPBank sang "Tiết kiệm".
- **Then**: 
  - Số dư TPBank còn `30.000.000đ`, "Nuôi con" là `10.000.000đ`, "Tiết kiệm" là `10.000.000đ`.
  - Tổng tài sản (Total Assets) của người dùng vẫn là `50.000.000đ`.
  - Thống kê Thu nhập (Income) của tháng vẫn giữ nguyên `50.000.000đ` (không ghi nhận Transfer thành thu nhập mới).
  - Thống kê Chi tiêu (Expense) của tháng vẫn là `0đ`.

### Scenario AC-06: Chi tiêu từ tài khoản tên tùy chỉnh và tính độc lập với Ngân sách
- **Given**: Tài khoản "Nuôi con" có số dư `10.000.000đ`. Ngân sách tháng 09/2026 cho danh mục "Trẻ em" có hạn mức `3.000.000đ` (đã chi `0đ`).
- **When**: Người dùng tạo giao dịch Chi tiêu `500.000đ` cho danh mục "Trẻ em" từ tài khoản "Nuôi con".
- **Then**: 
  - Số dư tài khoản "Nuôi con" giảm còn `9.500.000đ`.
  - Ngân sách danh mục "Trẻ em" ghi nhận đã chi `500.000đ / 3.000.000đ` (16.7%).
  - Thống kê Chi tiêu tháng tăng `500.000đ`.
  - Ngân sách không trực tiếp trừ tiền tài khoản; chính giao dịch chi tiêu làm giảm số dư tài khoản.

### Scenario AC-07: Lưu trữ tài khoản đã có lịch sử giao dịch (Archive Account)
- **Given**: Tài khoản "Tiết kiệm" đã có các giao dịch chuyển tiền và chi tiêu trong quá khứ.
- **When**: Người dùng yêu cầu xóa hoặc đóng tài khoản "Tiết kiệm".
- **Then**: Hệ thống không xóa cứng (Hard Delete) bản ghi trong database; chuyển trạng thái tài khoản sang `is_archived = true`. Tài khoản không còn xuất hiện trong dropdown chọn tài khoản khi tạo giao dịch mới, nhưng toàn bộ lịch sử giao dịch và báo cáo tài chính quá khứ vẫn hiển thị chính xác.
