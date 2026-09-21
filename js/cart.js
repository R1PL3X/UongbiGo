/* ===================== Uong Bi GO - Quan ly Gio hang (localStorage, phia client) ===================== */
const Cart = {
  _key() {
    const user = Auth.getUser();
    return `ubg_cart_${user ? user.maNguoiDung : "guest"}`;
  },
  getItems() {
    try { return JSON.parse(localStorage.getItem(this._key()) || "[]"); } catch (e) { return []; }
  },
  _save(items) {
    try { localStorage.setItem(this._key(), JSON.stringify(items)); } catch (e) { /* noop */ }
  },
  add(monAn, soLuong = 1) {
    const items = this.getItems();
    const existing = items.find((i) => i.maMon === monAn.maMon);
    if (existing) {
      existing.soLuong += soLuong;
    } else {
      items.push({ maMon: monAn.maMon, tenMon: monAn.tenMon, donGia: monAn.donGia, soLuong });
    }
    this._save(items);
  },
  updateQty(maMon, soLuong) {
    let items = this.getItems();
    if (soLuong <= 0) {
      items = items.filter((i) => i.maMon !== maMon);
    } else {
      const item = items.find((i) => i.maMon === maMon);
      if (item) item.soLuong = soLuong;
    }
    this._save(items);
  },
  remove(maMon) {
    const items = this.getItems().filter((i) => i.maMon !== maMon);
    this._save(items);
  },
  clear() {
    this._save([]);
  },
  totalItems() {
    return this.getItems().reduce((sum, i) => sum + i.soLuong, 0);
  },
  totalAmount() {
    return this.getItems().reduce((sum, i) => sum + i.soLuong * i.donGia, 0);
  },
};

function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  if (badge) {
    const count = Cart.totalItems();
    badge.textContent = count;
    badge.classList.toggle("hidden", count === 0);
  }
}
