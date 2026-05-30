/**
 * Import historical tasks into TaskForge.
 *
 * Usage:
 *   node --env-file=.env.local scripts/import-tasks.mjs
 *
 * Env vars needed (in .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 *   IMPORT_EMAIL      your login email
 *   IMPORT_PASSWORD   your login password
 *
 * Optional overrides:
 *   IMPORT_TYPE       maintain | on_demand  (default: on_demand)
 *   IMPORT_DATE       YYYY-MM-DD            (default: today)
 *   IMPORT_CLIENT_ID  uuid of client        (default: none)
 */

import { createClient } from "@supabase/supabase-js";

// ─── Task list ────────────────────────────────────────────────────────────────
// Format: [name, status]  ("Closed" → done)
const RAW_TASKS = `Migrate data credit từ personal sang workspace	Closed
Điều chỉnh tiếng anh của bảng giá	Closed
Update code mới của bảng giá trong trang admin	Closed
Update user admin có quyền truy cập cài đặt cộng đồng, duyệt bài viết và thành viên	Closed
Host --> Đổi icon (Save): My Space trong preview panel của chat	Closed
Chỉnh giá và thêm thông tin loại gói khi switch workspace	Closed
Update replicate key	Closed
Check bug install database và jina	Closed
Đổi tên "GIẺ" --> Database/ Nguồn dữ liệu, auto install Agent strageties và Agent skill plugin	Closed
Auto refresh page khi re-click vào submenu trong menu AI studio	Closed
Ẩn mục Dify chrome extension	Closed
Deploy Zalo bridge	Closed
Thêm nút Schedule a Demo/ Đặt lịch Demo trong bảng giá Enterprise	Closed
Merge các categories trong lsit app connector	Closed
Update tab Thanh toán trong workspace setting	Closed
Update tab Thành viên trong workspace setting	Closed
Update tab Phòng ban trong workspace setting	Closed
Update tab Báo cáo trong workspace setting	Closed
Update model mặc định của tạo ảnh	Closed
Điều chỉnh list app connector	Closed
Rehost nocodb	Closed
Merge clickai landingpage	Closed
Update 3 api report thread, comment và member cho mobile	Closed
Chỉnh sửa thông tin gói trên các modal suggest upgrade gói	Closed
Điều chỉnh quyền admin của cộng đồng, cho phép modify vào group và space mà không cần join	Closed
Update expire time của refresh token, cải thiện UX khi hết token lúc chat	Closed
Tự động lọc nội dung bài viết khi report member	Closed
Cải thiện luồng auto register bên dify	Closed
Fix list app connector	Closed
Ẩn các nút dify và tìm kiếm trong marketplace	Closed
Điều chỉnh landing page khung chat	Closed
Re open advanced chat in dify	Closed
Fix bug summarize cuộc họp bị over 400 kí tự	Closed
Điều chỉnh logic load my assistant load thêm cả advanced chat	Closed
Chỉnh sửa bảng giá ngày 15/5	Closed
Rename menu Ai meeting và channels, thêm submenu model provider	Closed
Set up auto install 3 tool zalo và 2 tool plugin	Closed
Support điều chỉnh zalo channel bridge	Closed
Thêm logic is pulic assistant và nút public private	Closed
Điều chỉnh logic sys name và description của assistant	Closed
Bổ sung workspaceId khi mua thêm credit, điều hướng các thanh toán sang page thay vì modal	Closed`;

// ─── Config ───────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const EMAIL       = process.env.IMPORT_EMAIL;
const PASSWORD    = process.env.IMPORT_PASSWORD;
const TYPE        = process.env.IMPORT_TYPE       ?? "on_demand";
const DATE        = process.env.IMPORT_DATE        ?? new Date().toISOString().slice(0, 10);
const CLIENT_ID   = process.env.IMPORT_CLIENT_ID   ?? null;

// ─── Validate ─────────────────────────────────────────────────────────────────
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY trong .env.local");
  process.exit(1);
}
if (!EMAIL || !PASSWORD) {
  console.error("❌  Cần IMPORT_EMAIL và IMPORT_PASSWORD trong .env.local");
  console.error("   Thêm vào .env.local:\n   IMPORT_EMAIL=your@email.com\n   IMPORT_PASSWORD=yourpassword");
  process.exit(1);
}

// ─── Parse tasks ──────────────────────────────────────────────────────────────
const STATUS_MAP = { Closed: "done", Open: "todo", "In Progress": "doing" };

const tasks = RAW_TASKS.trim().split("\n").map((line) => {
  const [name, rawStatus] = line.split("\t");
  return {
    name: name.trim(),
    status: STATUS_MAP[rawStatus?.trim()] ?? "done",
  };
}).filter((t) => t.name);

// ─── Main ─────────────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log(`\n🔐  Đăng nhập với ${EMAIL}…`);
const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
if (authErr || !auth.user) {
  console.error("❌  Đăng nhập thất bại:", authErr?.message);
  process.exit(1);
}
console.log(`✅  Đăng nhập OK — user: ${auth.user.id}`);

// Get hourly rate for snapshot
const { data: settings } = await supabase
  .from("settings")
  .select("hourly_rate")
  .eq("user_id", auth.user.id)
  .maybeSingle();
const rate_snapshot = settings?.hourly_rate ?? 0;

// Build rows
const rows = tasks.map((t) => ({
  name:           t.name,
  type:           TYPE,
  status:         t.status,
  task_date:      DATE,
  hours:          TYPE === "on_demand" ? 0 : null,
  rate_snapshot,
  client_id:      CLIENT_ID,
  user_id:        auth.user.id,
  note:           null,
}));

console.log(`\n📋  Chuẩn bị import ${rows.length} tasks:`);
console.log(`    type       : ${TYPE}`);
console.log(`    task_date  : ${DATE}`);
console.log(`    client_id  : ${CLIENT_ID ?? "(none)"}`);
console.log(`    rate       : ${rate_snapshot}`);
console.log(`    status     : done (tất cả đều Closed)\n`);

const { error: insertErr, data: inserted } = await supabase
  .from("tasks")
  .insert(rows)
  .select("id, name");

if (insertErr) {
  console.error("❌  Insert lỗi:", insertErr.message);
  process.exit(1);
}

console.log(`✅  Import thành công ${inserted.length} tasks:`);
inserted.forEach((t, i) => console.log(`    ${String(i + 1).padStart(2, " ")}. ${t.name}`));
console.log("\n💡  Gợi ý: vào TaskForge để điền số giờ và gán khách cho từng task.");
