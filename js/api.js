/* =====================================================================
   Uong Bi GO - API helper (PHIEN BAN FRONTEND-ONLY / MOCK)
   -----------------------------------------------------------------------
   File nay thay the hoan toan cho backend that. Khong co request mang nao
   duoc goi di ca - moi "API" (dang nhap, thuc don, gio hang, don hang,
   thanh toan QR, KDS, quan tri...) deu duoc gia lap va luu trong
   localStorage cua trinh duyet, dong vai tro nhu mot co so du lieu nho.
   Tat ca cac trang HTML/JS khac (index.html, menu.html, cart.html,
   orders.html, kds.html, admin/*.html, js/cart.js) khong can sua doi gi
   vi chung chi goi qua cac ham dung chung: Auth, apiFetch, goTo,
   formatCurrency, formatDateTime, statusPillHtml... y het ban goc.
   ===================================================================== */

/* ---------- "Dia chi API" chi con mang tinh trang tri, khong con dung ---------- */
const API_BASE = "(mock-local)";

/* ---------- Duong dan goc cua site (hoat dong ca khi host trong thu muc con) ---------- */
const SITE_ROOT = new URL("../", document.currentScript.src).href;
function goTo(page) {
  window.location.href = SITE_ROOT + String(page).replace(/^\/+/, "");
}

/* ===================== Auth (luu phien dang nhap trong localStorage) ===================== */
const Auth = {
  getToken() {
    try { return localStorage.getItem("ubg_token"); } catch (e) { return null; }
  },
  getUser() {
    try { return JSON.parse(localStorage.getItem("ubg_user") || "null"); } catch (e) { return null; }
  },
  setSession(token, user) {
    try {
      localStorage.setItem("ubg_token", token);
      localStorage.setItem("ubg_user", JSON.stringify(user));
    } catch (e) { /* trinh duyet chan luu tru - bo qua */ }
  },
  clear() {
    try {
      localStorage.removeItem("ubg_token");
      localStorage.removeItem("ubg_user");
    } catch (e) { /* noop */ }
  },
  isLoggedIn() { return !!this.getToken(); },
  requireRole(allowedRoles) {
    const user = this.getUser();
    if (!this.isLoggedIn() || !user) {
      goTo("index.html");
      return null;
    }
    if (allowedRoles && !allowedRoles.includes(user.vaiTro)) {
      alert("Tai khoan cua ban khong co quyen truy cap trang nay.");
      redirectByRole(user.vaiTro);
      return null;
    }
    return user;
  },
};

function redirectByRole(vaiTro) {
  const map = { ROLE_BUYER: "menu.html", ROLE_STAFF: "kds.html", ROLE_ADMIN: "admin/dashboard.html" };
  goTo(map[vaiTro] || "index.html");
}

/* ===================== "Co so du lieu" mock, luu trong localStorage ===================== */
const DB_KEY = "ubg_mock_db_v1";

function seedDB() {
  const db = {
    seq: { user: 3, mon: 6, don: 0 },
    users: [
      { maNguoiDung: 1, hoTen: "Quan ly Canteen", email: "admin@uongbigo.vn", matKhau: "Admin@123", vaiTro: "ROLE_ADMIN" },
      { maNguoiDung: 2, hoTen: "Nhan vien bep", email: "bep@uongbigo.vn", matKhau: "Bep@123", vaiTro: "ROLE_STAFF" },
      { maNguoiDung: 3, hoTen: "Sinh vien Demo", email: "sv@uongbigo.vn", matKhau: "sv@123", vaiTro: "ROLE_BUYER" },
    ],
    menu: [
      { maMon: 1, tenMon: "Com tam suon bi", donGia: 32000, moTa: "Com tam suon nuong, bi, cha, trung op la", hinhAnh: "", trangThai: "CON_HANG" },
      { maMon: 2, tenMon: "Bun cha Ha Noi", donGia: 30000, moTa: "Bun, cha nuong than hoa, nuoc mam chua ngot", hinhAnh: "", trangThai: "CON_HANG" },
      { maMon: 3, tenMon: "Pho bo tai", donGia: 35000, moTa: "Pho bo truyen thong, nuoc dung ninh xuong", hinhAnh: "", trangThai: "CON_HANG" },
      { maMon: 4, tenMon: "Bun dau mam tom", donGia: 28000, moTa: "Bun, dau ran, cha com, mam tom nguyen chat", hinhAnh: "", trangThai: "HET_HANG" },
      { maMon: 5, tenMon: "Mi xao hai san", donGia: 33000, moTa: "Mi xao gion cung tom, muc, rau cu", hinhAnh: "", trangThai: "CON_HANG" },
      { maMon: 6, tenMon: "Salad uc ga", donGia: 29000, moTa: "Uc ga ap chao, rau xa lach, sot me rang", hinhAnh: "", trangThai: "CON_HANG" },
    ],
    orders: [],
  };
  saveDB(db);
  return db;
}

function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* noop */ }
  return seedDB();
}

function saveDB(db) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) { /* noop */ }
}

function nextId(db, key) {
  db.seq[key] = (db.seq[key] || 0) + 1;
  return db.seq[key];
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fakeToken(user) {
  return "mock." + btoa(unescape(encodeURIComponent(`${user.maNguoiDung}:${user.email}:${Date.now()}`)));
}

/* Tao anh QR gia lap (SVG) hoan toan o phia client, khong goi mang */
function makeFakeQrDataUri(seedText) {
  let hash = 0;
  for (let i = 0; i < seedText.length; i++) hash = (hash * 31 + seedText.charCodeAt(i)) >>> 0;
  function rand() { hash = (hash * 1103515245 + 12345) >>> 0; return (hash >>> 8) / 16777216; }
  const cells = 21, cellSize = 8, size = cells * cellSize;
  let rects = "";
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const inTL = x < 7 && y < 7, inTR = x >= cells - 7 && y < 7, inBL = x < 7 && y >= cells - 7;
      if (inTL || inTR || inBL) continue;
      if (rand() > 0.55) rects += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="#111"/>`;
    }
  }
  function finder(ox, oy) {
    return `<rect x="${ox}" y="${oy}" width="${7 * cellSize}" height="${7 * cellSize}" fill="#111"/>
      <rect x="${ox + cellSize}" y="${oy + cellSize}" width="${5 * cellSize}" height="${5 * cellSize}" fill="#fff"/>
      <rect x="${ox + 2 * cellSize}" y="${oy + 2 * cellSize}" width="${3 * cellSize}" height="${3 * cellSize}" fill="#111"/>`;
  }
  const finders = finder(0, 0) + finder((cells - 7) * cellSize, 0) + finder(0, (cells - 7) * cellSize);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="240" height="240">
    <rect width="${size}" height="${size}" fill="#fff"/>${rects}${finders}</svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

/* ===================== Bo dinh tuyen "API" gia lap ===================== */
/**
 * Thay the apiFetch that: nhan vao path + options (giong het chu ky cu),
 * nhung xu ly hoan toan o local bang cach doc/ghi vao "database" trong
 * localStorage. Tra ve Promise giong nhu fetch that (co do tre nho cho
 * giong trai nghiem goi mang) va nem loi dang { status, message } khi
 * that bai, dung format ma cac trang khac dang bat (err.message).
 */
async function apiFetch(path, options = {}) {
  await delay(220 + Math.random() * 260);

  const method = (options.method || "GET").toUpperCase();
  let body = {};
  if (options.body) {
    try { body = typeof options.body === "string" ? JSON.parse(options.body) : options.body; } catch (e) { body = {}; }
  }
  const [rawPath, queryStr] = path.split("?");
  const query = Object.fromEntries(new URLSearchParams(queryStr || ""));
  const segs = rawPath.split("/").filter(Boolean);
  const db = loadDB();

  function fail(status, message) { throw { status, message }; }
  function requireLogin() {
    const u = Auth.getUser();
    if (!u || !Auth.isLoggedIn()) fail(401, "Phien dang nhap da het han, vui long dang nhap lai.");
    return u;
  }
  function toDonHangView(o) {
    return {
      maDonHang: o.maDonHang,
      maDonRutGon: o.maDonRutGon,
      ngayDat: o.ngayDat,
      thoiGianNhan: o.thoiGianNhan,
      trangThai: o.trangThai,
      tongTien: o.tongTien,
      chiTietDonHangs: o.chiTietDonHangs,
    };
  }

  try {
    /* ---------- AUTH ---------- */
    if (method === "POST" && rawPath === "/auth/login") {
      const email = String(body.email || "").trim().toLowerCase();
      const user = db.users.find((u) => u.email.toLowerCase() === email && u.matKhau === body.matKhau);
      if (!user) fail(401, "Sai email hoac mat khau.");
      const nguoiDung = { maNguoiDung: user.maNguoiDung, hoTen: user.hoTen, email: user.email, vaiTro: user.vaiTro };
      const redirectTo = { ROLE_BUYER: "menu.html", ROLE_STAFF: "kds.html", ROLE_ADMIN: "admin/dashboard.html" }[user.vaiTro] || "index.html";
      return { accessToken: fakeToken(user), nguoiDung, redirectTo };
    }

    if (method === "POST" && rawPath === "/auth/register") {
      const email = String(body.email || "").trim().toLowerCase();
      const hoTen = String(body.hoTen || "").trim();
      const matKhau = String(body.matKhau || "");
      const vaiTro = ["ROLE_BUYER", "ROLE_STAFF"].includes(body.vaiTro) ? body.vaiTro : "ROLE_BUYER";
      if (!hoTen || !email || matKhau.length < 6) fail(400, "Vui long nhap day du thong tin hop le.");
      if (db.users.some((u) => u.email.toLowerCase() === email)) fail(409, "Email nay da duoc su dung.");
      const maNguoiDung = nextId(db, "user");
      db.users.push({ maNguoiDung, hoTen, email: body.email.trim(), matKhau, vaiTro });
      saveDB(db);
      return { message: "Dang ky thanh cong." };
    }

    if (method === "POST" && rawPath === "/auth/forgot-password") {
      const email = String(body.email || "").trim().toLowerCase();
      const user = db.users.find((u) => u.email.toLowerCase() === email);
      if (!user) fail(404, "Khong tim thay tai khoan voi email nay.");
      const tam = "Tam@" + Math.floor(1000 + Math.random() * 9000);
      user.matKhau = tam;
      saveDB(db);
      return { message: "Da tao mat khau tam thoi, ban co the dang nhap ngay bang mat khau nay.", matKhauTamThoi: tam };
    }

    /* ---------- MENU (nguoi mua xem) ---------- */
    if (method === "GET" && rawPath === "/menu") {
      return db.menu.filter((m) => m.trangThai !== "DA_XOA");
    }

    /* ---------- DON HANG (nguoi mua) ---------- */
    if (method === "GET" && rawPath === "/donhang/cua-toi") {
      const user = requireLogin();
      return db.orders
        .filter((o) => o.maNguoiDung === user.maNguoiDung)
        .sort((a, b) => new Date(b.ngayDat) - new Date(a.ngayDat))
        .map(toDonHangView);
    }

    if (method === "POST" && rawPath === "/donhang") {
      const user = requireLogin();
      const items = Array.isArray(body.items) ? body.items : [];
      if (items.length === 0) fail(400, "Gio hang dang trong.");
      const chiTietDonHangs = [];
      let tongTien = 0;
      for (const it of items) {
        const mon = db.menu.find((m) => m.maMon === it.maMon && m.trangThai === "CON_HANG");
        if (!mon) continue;
        const soLuong = Math.max(1, parseInt(it.soLuong, 10) || 1);
        chiTietDonHangs.push({ maMon: mon.maMon, tenMon: mon.tenMon, soLuong, donGia: mon.donGia });
        tongTien += mon.donGia * soLuong;
      }
      if (chiTietDonHangs.length === 0) fail(400, "Cac mon trong gio hang hien khong con hang.");
      const maDonHang = nextId(db, "don");
      const order = {
        maDonHang,
        maDonRutGon: "DH" + String(maDonHang).padStart(4, "0"),
        maNguoiDung: user.maNguoiDung,
        ngayDat: new Date().toISOString(),
        thoiGianNhan: body.thoiGianNhan || new Date().toISOString(),
        trangThai: "CHO_THANH_TOAN",
        tongTien,
        chiTietDonHangs,
        maQr: null,
        thoiHanThanhToan: null,
      };
      db.orders.push(order);
      saveDB(db);
      return toDonHangView(order);
    }

    /* ---------- THANH TOAN (mock VietQR) ---------- */
    if (method === "POST" && segs[0] === "thanhtoan" && segs.length === 3 && segs[2] === "qr") {
      requireLogin();
      const maDonHang = parseInt(segs[1], 10);
      const order = db.orders.find((o) => o.maDonHang === maDonHang);
      if (!order) fail(404, "Khong tim thay don hang.");
      if (order.trangThai !== "CHO_THANH_TOAN") fail(400, "Don hang nay khong o trang thai cho thanh toan.");
      const maQr = "QR" + maDonHang + "-" + Date.now();
      const thoiHanThanhToan = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      order.maQr = maQr;
      order.thoiHanThanhToan = thoiHanThanhToan;
      saveDB(db);
      return {
        maDonHang,
        maQr,
        phuongThuc: query.phuongThuc || "VIETQR",
        soTien: order.tongTien,
        qrImageBase64: makeFakeQrDataUri(maQr),
        thoiHanThanhToan,
      };
    }

    if (method === "POST" && rawPath === "/thanhtoan/webhook") {
      requireLogin();
      const order = db.orders.find((o) => o.maDonHang === body.maDonHang && o.maQr === body.maQr);
      if (!order) fail(404, "Khong tim thay giao dich thanh toan.");
      if (body.ketQua === "THANH_CONG") {
        order.trangThai = "DA_THANH_TOAN";
      } else {
        // That bai: giu nguyen trang thai cho thanh toan de nguoi dung co the thu lai
        order.trangThai = "CHO_THANH_TOAN";
      }
      saveDB(db);
      return toDonHangView(order);
    }

    /* ---------- KDS (nhan vien bep) ---------- */
    if (method === "GET" && rawPath === "/kds/orders") {
      requireLogin();
      const active = ["DA_THANH_TOAN", "DANG_CHUAN_BI", "SAN_SANG_NHAN"];
      return db.orders
        .filter((o) => active.includes(o.trangThai))
        .sort((a, b) => new Date(a.ngayDat) - new Date(b.ngayDat))
        .map(toDonHangView);
    }

    if (method === "PATCH" && segs[0] === "kds" && segs[1] === "orders" && segs.length === 4 && segs[3] === "status") {
      requireLogin();
      const maDonHang = parseInt(segs[2], 10);
      const order = db.orders.find((o) => o.maDonHang === maDonHang);
      if (!order) fail(404, "Khong tim thay don hang.");
      order.trangThai = body.trangThaiMoi;
      saveDB(db);
      return toDonHangView(order);
    }

    if (method === "PATCH" && segs[0] === "kds" && segs[1] === "mon" && segs.length === 4 && segs[3] === "toggle") {
      requireLogin();
      const maMon = parseInt(segs[2], 10);
      const mon = db.menu.find((m) => m.maMon === maMon);
      if (!mon) fail(404, "Khong tim thay mon an.");
      mon.trangThai = mon.trangThai === "CON_HANG" ? "HET_HANG" : "CON_HANG";
      saveDB(db);
      return mon;
    }

    /* ---------- ADMIN ---------- */
    if (method === "GET" && rawPath === "/admin/thong-ke") {
      requireLogin();
      const paid = ["DA_THANH_TOAN", "DANG_CHUAN_BI", "SAN_SANG_NHAN", "HOAN_THANH"];
      const tongDoanhThu = db.orders.filter((o) => paid.includes(o.trangThai)).reduce((s, o) => s + o.tongTien, 0);
      return {
        tongDoanhThu,
        tongSoDonHoanThanh: db.orders.filter((o) => o.trangThai === "HOAN_THANH").length,
        tongSoDonTatCa: db.orders.length,
        soMonDangBan: db.menu.filter((m) => m.trangThai === "CON_HANG").length,
        soMonHetHang: db.menu.filter((m) => m.trangThai === "HET_HANG").length,
      };
    }

    if (method === "GET" && rawPath === "/admin/don-hang") {
      requireLogin();
      return db.orders.slice().sort((a, b) => new Date(b.ngayDat) - new Date(a.ngayDat)).map(toDonHangView);
    }

    if (method === "GET" && rawPath === "/admin/mon-an") {
      requireLogin();
      return db.menu;
    }

    if (method === "POST" && rawPath === "/admin/mon-an") {
      requireLogin();
      const tenMon = String(body.tenMon || "").trim();
      const donGia = parseFloat(body.donGia);
      if (!tenMon || !donGia || donGia <= 0) fail(400, "Ten mon va don gia khong hop le.");
      const maMon = nextId(db, "mon");
      const mon = { maMon, tenMon, donGia, moTa: body.moTa || "", hinhAnh: body.hinhAnh || "", trangThai: "CON_HANG" };
      db.menu.push(mon);
      saveDB(db);
      return mon;
    }

    if (method === "PUT" && segs[0] === "admin" && segs[1] === "mon-an" && segs.length === 3) {
      requireLogin();
      const maMon = parseInt(segs[2], 10);
      const mon = db.menu.find((m) => m.maMon === maMon);
      if (!mon) fail(404, "Khong tim thay mon an.");
      const tenMon = String(body.tenMon || "").trim();
      const donGia = parseFloat(body.donGia);
      if (!tenMon || !donGia || donGia <= 0) fail(400, "Ten mon va don gia khong hop le.");
      mon.tenMon = tenMon;
      mon.donGia = donGia;
      mon.moTa = body.moTa || "";
      mon.hinhAnh = body.hinhAnh || "";
      if (body.trangThai) mon.trangThai = body.trangThai;
      saveDB(db);
      return mon;
    }

    if (method === "DELETE" && segs[0] === "admin" && segs[1] === "mon-an" && segs.length === 3) {
      requireLogin();
      const maMon = parseInt(segs[2], 10);
      const mon = db.menu.find((m) => m.maMon === maMon);
      if (!mon) fail(404, "Khong tim thay mon an.");
      mon.trangThai = "DA_XOA";
      saveDB(db);
      return { message: "Da xoa mon an." };
    }

    fail(404, `Khong tim thay endpoint mock cho ${method} ${rawPath}`);
  } catch (e) {
    if (e && typeof e === "object" && "status" in e) throw e;
    throw { message: (e && e.message) || "Da xay ra loi khong xac dinh." };
  }
}

/* ===================== Tien ich dung chung (giu nguyen nhu ban goc) ===================== */
function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(value)) + "đ";
}

function formatDateTime(isoString) {
  try {
    const d = new Date(isoString);
    return d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
  } catch (e) { return isoString; }
}

const STATUS_LABEL = {
  CHO_THANH_TOAN: "Cho thanh toan",
  DA_THANH_TOAN: "Da thanh toan",
  DANG_CHUAN_BI: "Dang chuan bi",
  SAN_SANG_NHAN: "San sang nhan",
  HOAN_THANH: "Hoan thanh",
  DA_HUY: "Da huy",
};

function statusPillHtml(trangThai) {
  const label = STATUS_LABEL[trangThai] || trangThai;
  return `<span class="status-pill status-${trangThai}">${label}</span>`;
}

/* ---------- Banner mat mang (van dung navigator.onLine that cua trinh duyet) ---------- */
function initOfflineBanner() {
  const banner = document.createElement("div");
  banner.className = "offline-banner hidden";
  banner.innerHTML = '<span class="dot"></span><span>Mat ket noi mang - dang cho ket noi lai de dong bo...</span>';
  document.body.appendChild(banner);

  function updateStatus() {
    if (navigator.onLine) {
      banner.classList.add("hidden");
    } else {
      banner.classList.remove("hidden");
    }
  }
  window.addEventListener("online", () => {
    updateStatus();
    window.dispatchEvent(new CustomEvent("ubg:reconnected"));
  });
  window.addEventListener("offline", updateStatus);
  updateStatus();
}

document.addEventListener("DOMContentLoaded", initOfflineBanner);
