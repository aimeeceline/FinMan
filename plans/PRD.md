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

- Ghi nhận các khoản thu nhập/chi tiêu.
- Quản lý tài khoản tiền mặt, ngân hàng và thẻ tín dụng.
- Theo dõi số dư tài sản và khoản nợ.
- Quản lý ngân sách theo tháng.
- Theo dõi chi tiêu theo danh mục.
- Xem thống kê tài chính.
- Ghi chú các giao dịch.
- Xuất dữ liệu tài chính.

Ứng dụng tập trung vào việc giúp người dùng **nhìn thấy dòng tiền của mình một cách trực quan**, thay vì chỉ lưu lại từng giao dịch riêng lẻ.

---

# 2. Product Goals

## G1 — Theo dõi dòng tiền

Người dùng có thể biết:

> Tháng này tôi kiếm được bao nhiêu?  
> Tôi đã tiêu bao nhiêu?  
> Tôi còn lại bao nhiêu?

Công thức:

**Số dư = Tổng thu nhập − Tổng chi tiêu**

## G2 — Quản lý giao dịch

Người dùng có thể tạo, chỉnh sửa và xóa:

- Thu nhập
- Chi tiêu

Mỗi giao dịch phải có thông tin tối thiểu:

- Số tiền
- Danh mục
- Tài khoản
- Ngày giao dịch
- Ghi chú

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

Quản lý tài khoản tiền.

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

**Cộng = Thu − Chi**

## 7.2 Transaction List

Danh sách giao dịch được nhóm theo ngày.

Ví dụ:

```text
16        Thứ 4

👕 Áo quần
   quần uniqlo
   Tiền mặt                    -1.000.000đ

💰 Tiền lương
   lương T9
   Tài khoản ngân hàng         +6.000.000đ

Lan Anh
   test
   Tiền mặt                       -90.000đ
```

Thu nhập hiển thị màu xanh.

Chi tiêu hiển thị màu đỏ/cam.

---

# 8. Add Transaction

Floating Action Button:

**+**

Khi người dùng nhấn `+`, mở màn hình thêm giao dịch.

## Transaction Type

```text
Thu nhập | Chi tiêu
```

## Expense

Fields:

- Amount
- Category
- Account
- Date
- Note

Ví dụ:

```text
Số tiền
1.000.000đ

Danh mục
👕 Áo quần

Tài khoản
Tiền mặt

Ngày
16/09/2026

Ghi chú
quần uniqlo
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
- Lan Anh

Người dùng có thể:

- Thêm category.
- Sửa category.
- Xóa category nếu category chưa được sử dụng hoặc theo rule hệ thống.

---

# 10. Account Management

Màn hình **Tài khoản** hiển thị tổng tài sản và khoản nợ.

Ví dụ:

```text
Tài sản          Khoản nợ          Cộng
6.000.000đ       -1.090.000đ       4.910.000đ
```

## 10.1 Cash Account

```text
Tiền mặt
1.090.000đ
```

## 10.2 Bank Account

```text
Tài khoản ngân hàng
6.000.000đ
```

## 10.3 Credit Card

```text
Thẻ tín dụng

Tháng hiện tại       0đ
Tháng tiếp theo      0đ
```

---

# 11. Account Business Rules

### Asset

Bao gồm:

- Cash
- Bank account
- Other asset accounts

### Liability

Bao gồm:

- Credit card
- Debt accounts

### Net Worth

```text
Net Worth = Total Assets − Total Liabilities
```

---

# 12. Statistics

Màn hình Statistics cho phép người dùng xem:

```text
Thống kê | Ngân sách | Ghi chú
```

và lựa chọn thời gian:

```text
Tuần
Tháng
Hàng năm
Period
Tóm lược
Khuynh hướng
```

---

# 13. Statistics — Expense

Ví dụ tháng 9:

```text
Thu
6.000.000đ

Chi
1.090.000đ
```

Expense breakdown:

```text
Áo quần       1.000.000đ    91.7%
Lan Anh          90.000đ     8.3%
```

Pie chart được sử dụng để trực quan hóa tỷ lệ.

---

# 14. Statistics — Income

Tương tự Expense nhưng phân tích:

- Nguồn thu.
- Category thu nhập.
- Tỷ lệ từng nguồn.
- Tổng thu nhập.

Ví dụ:

```text
Lương             6.000.000đ
Freelance                  0đ
Khác                       0đ
```

---

# 15. Budget Management

Người dùng có thể thiết lập ngân sách theo tháng.

Ví dụ:

```text
Ngân sách tháng 9

Ăn uống              2.000.000đ
Giải trí              1.000.000đ
Giao thông              500.000đ
Áo quần               1.000.000đ
```

Mỗi budget có:

```text
Budget
   ↓
Amount spent
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
- **Mô tả**: Người dùng có thể nhập một câu ngắn bằng tiếng Việt (hoặc voice-to-text) miêu tả giao dịch, AI sẽ bóc tách và tự động điền form giao dịch để người dùng xác nhận trước khi lưu.
- **Ví dụ đầu vào**:
  - `"Ăn bún đậu mắm tôm 55k ví MoMo"`
  - `"Nhận lương tháng 9 15 triệu tài khoản Vietcombank hôm qua"`
  - `"Mua áo sơ mi 350.000 tiền mặt"`
- **Cấu trúc JSON đầu ra AI trả về**:
  ```json
  {
    "type": "EXPENSE",
    "amount": 55000,
    "categoryName": "Ăn uống",
    "accountName": "MoMo",
    "note": "bún đậu mắm tôm",
    "transactionDate": "2026-09-16"
  }
  ```
- **Business Rule & Fallback**:
  - Nếu AI không xác định được tài khoản (`accountName`), mặc định chọn tài khoản có số dư lớn nhất hoặc tài khoản mặc định ("Tiền mặt").
  - Nếu AI không xác định được danh mục (`categoryName`), chọn danh mục "Khác".
  - Nếu câu nhập không liên quan đến thu/chi hoặc không trích xuất được số tiền (`amount <= 0`), trả về lỗi: `"Không thể nhận diện giao dịch. Vui lòng nhập rõ số tiền và nội dung."`
  - Dữ liệu luôn hiển thị lên popup/form để người dùng kiểm tra và bấm "Lưu" (không tự ý âm thầm lưu vào DB).

## 32.2 AI Financial Advisor & Spending Insights (Trợ Lý Tư Vấn Tài Chính)
- **Mô tả**: Dựa trên dữ liệu thu chi hàng tháng, AI tổng hợp các đánh giá khách quan về thói quen chi tiêu của người dùng.
- **Nội dung cung cấp**:
  - *Cảnh báo bội chi*: Cảnh báo các danh mục có tốc độ chi tiêu tăng đột biến (> 30% so với trung bình).
  - *Dự báo dòng tiền*: Dự báo số tiền còn lại đến cuối tháng dựa trên tốc độ tiêu dùng hiện tại.
  - *Gợi ý tiết kiệm*: Đưa ra 1 - 2 gợi ý hành động thiết thực (ví dụ: "Bạn đã chi 40% thu nhập cho Ăn uống ngoài hàng tháng này, thử nấu ăn tại nhà để tiết kiệm 1.500.000đ").
- **Tần suất**: Người dùng bấm nút "Phân tích AI" tại màn hình Thống kê hoặc nhận tổng kết vào cuối tháng.

---

# 33. Detailed Validation Matrix (Ma Trận Kiểm Tra Dữ Liệu)

| Module | Trường dữ liệu | Bắt buộc | Kiểu dữ liệu / Format | Ràng buộc nghiệp vụ (Constraints) | Thông báo lỗi khi vi phạm |
|---|---|---|---|---|---|
| **Auth** | Full Name | Có | String (2 - 50 ký tự) | Không chứa ký tự đặc biệt nguy hiểm | Họ tên phải từ 2 đến 50 ký tự |
| **Auth** | Email | Có | Email format | Đúng chuẩn RFC 5322, duy nhất trong hệ thống | Email không đúng định dạng / Email đã được sử dụng |
| **Auth** | Password | Có | String (>= 6 ký tự) | Tối thiểu 6 ký tự, khuyến khích có chữ & số | Mật khẩu phải có ít nhất 6 ký tự |
| **Auth** | Confirm Password | Có | String | Phải khớp 100% với trường Password | Mật khẩu xác nhận không khớp |
| **Account** | Account Name | Có | String (1 - 50 ký tự) | Duy nhất trong danh sách tài khoản của User | Tên tài khoản không được để trống hoặc trùng lặp |
| **Account** | Account Type | Có | Enum | Thuộc: `CASH` (Tiền mặt), `BANK` (Ngân hàng), `CREDIT_CARD` (Thẻ tín dụng) | Loại tài khoản không hợp lệ |
| **Account** | Initial Balance | Có | Integer / Long | >= 0 đối với Cash & Bank. Đối với Credit Card: Số dư nợ ban đầu >= 0 | Số dư ban đầu không được âm |
| **Account** | Credit Limit | Tùy chọn | Integer / Long | Bắt buộc nếu là `CREDIT_CARD`, giá trị >= 0 | Hạn mức thẻ tín dụng phải lớn hơn hoặc bằng 0 |
| **Category**| Category Name | Có | String (1 - 40 ký tự) | Duy nhất trong cùng loại thu/chi của User | Tên danh mục không được để trống hoặc trùng |
| **Category**| Category Type | Có | Enum | Thuộc: `INCOME` (Thu nhập) hoặc `EXPENSE` (Chi tiêu) | Loại danh mục phải là Thu nhập hoặc Chi tiêu |
| **Category**| Icon / Emoji | Tùy chọn | String (1 - 10 ký tự) | Biểu tượng hiển thị (ví dụ: 🍜, 💰) | Biểu tượng không hợp lệ |
| **Transaction** | Type | Có | Enum | Thuộc: `INCOME` (Thu) hoặc `EXPENSE` (Chi) | Loại giao dịch không hợp lệ |
| **Transaction** | Amount | Có | Integer / Long | > 0 và <= 10.000.000.000đ (10 tỷ) | Số tiền phải lớn hơn 0 |
| **Transaction** | Account ID | Có | UUID / Long | Phải tồn tại và thuộc sở hữu của User hiện tại | Vui lòng chọn tài khoản hợp lệ |
| **Transaction** | Category ID | Có | UUID / Long | Phải tồn tại và đúng Type (`INCOME` hoặc `EXPENSE`) | Vui lòng chọn danh mục phù hợp |
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
   - **Tài khoản Tiền mặt / Ngân hàng (Asset Accounts)**:
     $$\text{Balance}_{\text{hiện tại}} = \text{Initial Balance} + \sum \text{Income} - \sum \text{Expense}$$
   - **Tài khoản Thẻ tín dụng (Liability Accounts)**:
     - Thẻ tín dụng lưu Dư nợ hiện tại (Current Outstanding Debt).
     - Chi tiêu bằng thẻ tín dụng: Dư nợ tăng lên.
     - Thu nhập vào thẻ tín dụng (Trả nợ thẻ): Dư nợ giảm xuống.
3. **Công Thức Tài Sản Ròng (Net Worth)**:
   $$\text{Total Assets} = \sum \text{Balance của tất cả tài khoản Cash \& Bank (với Balance } \ge 0\text{)}$$
   $$\text{Total Liabilities} = \sum \text{Dư nợ Thẻ tín dụng} + \sum |\text{Balance âm của Cash/Bank}|$$
   $$\text{Net Worth} = \text{Total Assets} - \text{Total Liabilities}$$

## 34.2 Quy Tắc Cập Nhật Số Dư Khi Thêm / Sửa / Xóa Giao Dịch
- **Thêm giao dịch**:
  - `INCOME`: Cộng `amount` vào số dư của `account`.
  - `EXPENSE`: Trừ `amount` khỏi số dư của `account`.
- **Xóa giao dịch**:
  - Nếu xóa `INCOME`: Trừ lại `amount` khỏi số dư của `account`.
  - Nếu xóa `EXPENSE`: Hoàn trả (cộng lại) `amount` vào số dư của `account`.
- **Chỉnh sửa giao dịch**:
  - Hệ thống tự động hoàn tác ảnh hưởng của giao dịch cũ lên tài khoản cũ, sau đó áp dụng ảnh hưởng của giao dịch mới lên tài khoản mới trong cùng một Database Transaction để đảm bảo tính nhất quán (ACID).

## 34.3 Quy Tắc Xóa Dữ Liệu Có Liên Kết (Integrity Constraints)
- **Xóa Danh mục (Category)**:
  - Nếu danh mục đã phát sinh giao dịch: Không cho phép xóa cứng (Hard Delete). Hệ thống hiển thị cảnh báo: `"Danh mục này đã có giao dịch, bạn không thể xóa. Hãy đổi tên hoặc chuyển các giao dịch sang danh mục khác."` Hoặc áp dụng cờ ẩn (Soft Delete).
- **Xóa Tài khoản (Account)**:
  - Tương tự, tài khoản đã có lịch sử giao dịch sẽ không thể xóa cứng để tránh làm sai lệch lịch sử dòng tiền. Người dùng có thể chọn "Lưu trữ / Đóng tài khoản" (Archive Account).

## 34.4 Quy Tắc Ngân Sách (Budget Rules)
- Ngân sách áp dụng theo chu kỳ từng tháng (từ ngày 01 đến ngày cuối cùng của tháng đó).
- Chỉ áp dụng ngân sách cho danh mục **Chi tiêu (EXPENSE)**.
- Khi người dùng tạo giao dịch chi tiêu trong tháng, hệ thống tự động cộng dồn vào `amount_spent` của budget tương ứng.
- **Ngưỡng cảnh báo**:
  - $\text{Chi tiêu} < 80\% \text{ Budget}$: Trạng thái Bình thường (Xanh lá / Trung tính).
  - $80\% \le \text{Chi tiêu} \le 100\% \text{ Budget}$: Cảnh báo Sắp chạm hạn mức (Vàng / Cam).
  - $\text{Chi tiêu} > 100\% \text{ Budget}$: Cảnh báo Vượt hạn mức (Đỏ).

---

# 35. Detailed Acceptance Criteria (Tiêu Chí Nghiệm Thu Chuẩn Hóa)

### Scenario AC-01: Đăng ký tài khoản mới thành công
- **Given**: Người dùng ở màn hình Register và nhập email chưa từng đăng ký `user@example.com`, họ tên hợp lệ, password `123456`, confirm password `123456`.
- **When**: Người dùng nhấn nút "Đăng ký".
- **Then**: Hệ thống tạo tài khoản mới thành công, mã hóa mật khẩu, tự động khởi tạo các danh mục mặc định (Ăn uống, Giải trí, Lương...) và tài khoản mặc định ("Tiền mặt"), trả về JWT Token và chuyển hướng về màn hình Home.

### Scenario AC-02: Thêm giao dịch chi tiêu và kiểm tra cập nhật số dư
- **Given**: Tài khoản "Tiền mặt" có số dư hiện tại là `2.000.000đ`.
- **When**: Người dùng tạo giao dịch Chi tiêu `500.000đ`, danh mục "Ăn uống", tài khoản "Tiền mặt", ngày hôm nay.
- **Then**: Giao dịch xuất hiện trong danh sách giao dịch ngày hôm nay với màu cam/đỏ `-500.000đ`, số dư tài khoản "Tiền mặt" cập nhật thành `1.500.000đ`, ngân sách "Ăn uống" tháng này tăng phần đã chi thêm `500.000đ`.

### Scenario AC-03: Nhập giao dịch nhanh bằng AI (Natural Language Quick Add)
- **Given**: Người dùng mở popup nhập nhanh AI và gõ: `"Ăn lẩu 350k tiền mặt"`.
- **When**: Người dùng nhấn "Xử lý bằng AI".
- **Then**: Form giao dịch tự động điền: Loại: Chi tiêu, Số tiền: 350.000đ, Danh mục: Ăn uống, Tài khoản: Tiền mặt, Ghi chú: "Ăn lẩu". Người dùng chỉ cần nhấn "Lưu" để hoàn tất.

### Scenario AC-04: Cảnh báo vượt ngân sách
- **Given**: Ngân sách danh mục "Áo quần" tháng này là `1.000.000đ`, đã chi `800.000đ`.
- **When**: Người dùng thêm giao dịch chi tiêu mới `300.000đ` cho "Áo quần".
- **Then**: Tổng chi đạt `1.100.000đ` (110%), thanh tiến độ hiển thị màu đỏ và hệ thống hiển thị thông báo cảnh báo vượt ngân sách `100.000đ`.
