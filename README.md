# TaskForge

Task & billing tracker cho freelancer solo. Ghi nhận task **maintain** / **on-demand**,
tự tính tiền theo giờ, và **export Excel** để báo cáo — thay cho ClickUp (vốn bắt trả
phí để phân loại task).

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase
(Postgres + Auth + RLS) · SheetJS (xlsx). Deploy free trên Vercel + Supabase.

---

## Tính năng

- 🔐 Đăng nhập email/mật khẩu (Supabase Auth), dữ liệu cô lập theo user bằng RLS
- 📋 CRUD task: tên, loại (maintain / on-demand), khách, trạng thái, ngày, ghi chú
- ⏱️ On-demand: nhập số giờ → tự tính tiền (`giờ × rate`)
- 🔁 Maintain: phí retainer cố định / tháng, gắn theo khách hàng
- 🧮 `rate_snapshot` — chốt rate ngay khi tạo task, đổi rate sau này **không** làm lệch báo cáo cũ
- 🔎 Lọc theo tháng / loại / khách / trạng thái + tìm theo tên
- 📊 Dashboard: giờ on-demand, doanh thu on-demand, retainer, tổng — theo tháng
- 📑 Export `.xlsx`: sheet **Chi tiết** (theo bộ lọc) + sheet **Tổng hợp** theo khách

---

## Cài đặt local

> Cần **Node ≥ 18.18**. Repo này dev trên Node 20.

```bash
npm install
cp .env.example .env.local   # rồi điền giá trị thật (xem bên dưới)
npm run dev                  # http://localhost:3000
```

### 1. Tạo project Supabase

1. Tạo project tại <https://supabase.com>.
2. Vào **SQL Editor** → dán toàn bộ nội dung [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   (Tạo bảng `settings`, `clients`, `tasks` + enum + RLS.)
3. Vào **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `Publishable (anon) key` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. (Khuyến nghị cho app solo) **Authentication → Providers → Email**: tắt
   **"Confirm email"** để đăng ký xong vào dùng ngay, khỏi chờ email xác nhận.

### 2. Điền `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

### 3. Tạo tài khoản

Mở app → trang đăng nhập → bấm **Đăng ký** → tạo tài khoản của bạn. Xong, đăng nhập
và bắt đầu thêm khách hàng + task.

---

## Deploy lên Vercel

1. Push repo lên GitHub.
2. Vercel → **New Project** → import repo (Vercel tự nhận Next.js).
3. **Environment Variables**: thêm `NEXT_PUBLIC_SUPABASE_URL` và
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (cùng giá trị như `.env.local`).
4. Deploy. Không cần cấu hình build đặc biệt.

> Database vẫn nằm ở Supabase; Vercel chỉ host phần web. Cả hai đều có free tier
> dư dùng cho 1 người.

---

## Mô hình tính tiền

| Loại task | Tính tiền |
|-----------|-----------|
| **on-demand** | `số giờ × rate_snapshot`. Rate mặc định lấy từ **Cài đặt** tại thời điểm tạo task. |
| **maintain**  | Không tính theo task. Doanh thu = `monthly_retainer` của các khách đang bật **maintain active**. |

**Doanh thu tháng** = (Σ tiền on-demand trong tháng) + (Σ retainer các khách maintain active).

> Lưu ý: retainer hiện tính theo trạng thái *hiện tại* của khách (`is_maintain_active`),
> áp dụng cho mọi tháng đang xem. Nếu sau này cần lịch sử retainer theo từng tháng,
> có thể tách thành bảng `retainers(client_id, month, amount)`.

---

## Cấu trúc

```
src/
  app/
    login/                 # trang đăng nhập + form (client)
    auth/actions.ts        # signIn / signUp / signOut (server actions)
    (app)/                 # nhóm route đã đăng nhập (sidebar shell, auth guard)
      dashboard/           # tổng quan theo tháng
      tasks/               # CRUD + lọc + export
      clients/             # CRUD khách + retainer
      settings/            # rate + đơn vị tiền
  components/              # ui primitives, modal, sidebar
  lib/
    supabase/              # client / server / proxy (SSR cookies)
    dal.ts                 # requireUser, getSettings (auth + settings)
    export.ts              # build .xlsx (SheetJS)
    format.ts types.ts utils.ts
  proxy.ts                 # Next 16 Middleware (refresh session + guard route)
supabase/schema.sql        # migration: bảng + enum + RLS
```

## Scripts

```bash
npm run dev      # dev server (Turbopack)
npm run build    # production build
npm run start    # chạy bản build
npm run lint     # eslint
```
