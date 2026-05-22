const { useState, useEffect } = React;

const C = {
  bg: "#0f1923", card: "#fff", navy: "#1e293b", blue: "#3b82f6",
  indigo: "#6366f1", green: "#10b981", amber: "#f59e0b", slate: "#64748b",
  border: "#e2e8f0", light: "#f8fafc", red: "#ef4444",
  roleColors: { owner: "#3b82f6", hoa: "#7c3aed", contractor: "#10b981" },
  typeColors: { compound: "#6366f1", apartment: "#3b82f6", villa: "#10b981", townhouse: "#f59e0b" },
};

function AdminDashboard() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); 
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQR, setSelectedQR] = useState(null); // حالة جديدة لعرض الـ QR
  
  const [form, setForm] = useState({
    property_type: "apartment", role: "owner",
    compound_id: "", building_id: "", unit: "", villa_id: "", townhouse_id: "",
    username: "", password_code: ""
  });
  const [notif, setNotif] = useState({ show: false, msg: "", type: "success" });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("building_accounts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setAccounts(data || []);
    } catch (err) {
      showNotification("حدث خطأ أثناء جلب البيانات", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const showNotification = (msg, type = "success") => {
    setNotif({ show: true, msg, type });
    setTimeout(() => setNotif({ show: false, msg: "", type: "success" }), 3000);
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!form.password_code) return showNotification("يرجى إدخال الرمز السري", "error");

    try {
      const { error } = await supabase.from("building_accounts").insert([form]);
      if (error) throw error;
      showNotification("تم إنشاء الحساب بنجاح!");
      setActiveTab("view_accounts");
      fetchAccounts(); 
      setForm({ property_type: "apartment", role: "owner", compound_id: "", building_id: "", unit: "", villa_id: "", townhouse_id: "", username: "", password_code: "" });
    } catch (err) {
      showNotification("فشل إضافة الحساب", "error");
    }
  };

  // دالة لتوليد بيانات الـ QR Code
  const generateQRData = (acc) => {
    const appUrl = "https://dititalbuilding2026-netizen.github.io/Digital-Building-/";
    // ندمج البيانات في الرابط عشان يقراها النظام بعدين
    const params = new URLSearchParams({ type: acc.property_type, role: acc.role, pass: acc.password_code });
    return encodeURIComponent(`${appUrl}?${params.toString()}`);
  };

  const stats = {
    total: accounts.length,
    owners: accounts.filter(a => a.role === "owner").length,
    hoa: accounts.filter(a => a.role === "hoa").length,
    contractors: accounts.filter(a => a.role === "contractor").length,
  };

  const filteredAccounts = accounts.filter(acc => {
    const search = searchQuery.toLowerCase();
    return (acc.compound_id?.toLowerCase().includes(search) || acc.building_id?.toLowerCase().includes(search) || acc.unit?.toLowerCase().includes(search) || acc.username?.toLowerCase().includes(search));
  });

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Noto Sans Arabic', sans-serif", display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700;900&display=swap" rel="stylesheet" />
      
      <header style={{ background: C.navy, color: "#fff", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>المبنى الرقمي 🏢</h1>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>لوحة تحكم الوحوش</p>
        </div>
      </header>

      <div style={{ display: "flex", background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "4px 12px", gap: 8, overflowX: "auto" }}>
        <button onClick={() => setActiveTab("overview")} style={{ padding: "12px", background: "none", border: "none", borderBottom: activeTab === "overview" ? `3px solid ${C.blue}` : "3px solid transparent", color: activeTab === "overview" ? C.blue : C.slate, fontWeight: 700 }}>📊 نظرة عامة</button>
        <button onClick={() => setActiveTab("add_account")} style={{ padding: "12px", background: "none", border: "none", borderBottom: activeTab === "add_account" ? `3px solid ${C.blue}` : "3px solid transparent", color: activeTab === "add_account" ? C.blue : C.slate, fontWeight: 700 }}>➕ إضافة حساب</button>
        <button onClick={() => setActiveTab("view_accounts")} style={{ padding: "12px", background: "none", border: "none", borderBottom: activeTab === "view_accounts" ? `3px solid ${C.blue}` : "3px solid transparent", color: activeTab === "view_accounts" ? C.blue : C.slate, fontWeight: 700 }}>👥 الحسابات</button>
      </div>

      {notif.show && <div style={{ position: "fixed", top: 20, left: 20, right: 20, background: notif.type === "success" ? C.green : C.red, color: "#fff", padding: "12px", borderRadius: 10, textAlign: "center", zIndex: 1000, fontWeight: 700 }}>{notif.msg}</div>}

      <main style={{ padding: 16, flex: 1, maxWidth: 600, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ background: C.card, padding: 14, borderRadius: 14 }}><div style={{ fontSize: 20 }}>🏢</div><div style={{ fontSize: 11, color: C.slate }}>إجمالي العقارات</div><div style={{ fontSize: 20, fontWeight: 900 }}>{stats.total}</div></div>
            <div style={{ background: C.card, padding: 14, borderRadius: 14 }}><div style={{ fontSize: 20 }}>👤</div><div style={{ fontSize: 11, color: C.slate }}>الملاك</div><div style={{ fontSize: 20, fontWeight: 900, color: C.blue }}>{stats.owners}</div></div>
          </div>
        )}

        {/* نموذج الإضافة كما هو بالضبط في الكود السابق لتوفير المساحة هنا */}
        {activeTab === "add_account" && (
          <div style={{ background: C.card, padding: 20, borderRadius: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 16 }}>توليد حساب عقاري</h3>
            <form onSubmit={handleAddAccount}>
              <div style={{ marginBottom: 12 }}><label>نوع العقار</label><select name="property_type" value={form.property_type} onChange={handleInputChange} style={{ width: "100%", padding: 10 }}><option value="apartment">🏢 عمارة سكنية</option><option value="compound">🏘️ مجمع سكني</option><option value="villa">🏡 فيلا مستقلة</option><option value="townhouse">🏠 تاون هاوس</option></select></div>
              <div style={{ marginBottom: 12 }}><label>الدور / الصلاحية</label><select name="role" value={form.role} onChange={handleInputChange} style={{ width: "100%", padding: 10 }}><option value="owner">👤 مالك الوحدة</option><option value="hoa">👑 رئيس اتحاد الملاك</option><option value="contractor">🔧 مقاول</option></select></div>
              {form.property_type !== "apartment" && <div style={{ marginBottom: 12 }}><label>اسم المجمع</label><input type="text" name="compound_id" onChange={handleInputChange} style={{ width: "100%", padding: 10 }} /></div>}
              {form.property_type === "apartment" && <div style={{ marginBottom: 12 }}><label>المبنى</label><input type="text" name="building_id" onChange={handleInputChange} style={{ width: "100%", padding: 10 }} /></div>}
              {form.property_type === "apartment" && <div style={{ marginBottom: 12 }}><label>الوحدة</label><input type="text" name="unit" onChange={handleInputChange} style={{ width: "100%", padding: 10 }} /></div>}
              <div style={{ marginBottom: 16 }}><label>الرمز السري</label><input type="text" name="password_code" onChange={handleInputChange} style={{ width: "100%", padding: 10, fontWeight:"bold" }} /></div>
              <button type="submit" style={{ width: "100%", padding: "12px", background: C.blue, color: "#fff", border: "none", borderRadius: 50, fontWeight: 700 }}>💾 حفظ وتوليد</button>
            </form>
          </div>
        )}

        {activeTab === "view_accounts" && (
          <div>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="🔍 ابحث..." style={{ width: "100%", padding: 12, borderRadius: 10, marginBottom: 12 }} />
            {loading ? <div>جاري التحميل...</div> : 
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredAccounts.map((acc) => (
                <div key={acc.id} style={{ background: C.card, borderRadius: 12, padding: 12, borderRight: `4px solid ${C.typeColors[acc.property_type] || C.blue}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: "bold", marginBottom: 8 }}>
                    <span style={{ color: C.typeColors[acc.property_type] }}>{acc.property_type}</span>
                    {/* زر إظهار QR Code 🚀 */}
                    <button onClick={() => setSelectedQR(acc)} style={{ background: "#f0f4f8", border: "none", padding: "4px 10px", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>📱 عرض QR</button>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: "bold" }}>
                    {acc.building_id && `مبنى: ${acc.building_id} `} {acc.unit && `| وحدة: ${acc.unit} `}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12 }}>🔑 الرمز السري: <strong>{acc.password_code}</strong></div>
                </div>
              ))}
            </div>}
          </div>
        )}
      </main>

      {/* نافذة الـ QR المنبثقة 📸 */}
      {selectedQR && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 20, textAlign: "center", width: "100%", maxWidth: 300 }}>
            <h3 style={{ margin: "0 0 16px" }}>QR Code الدخول</h3>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${generateQRData(selectedQR)}`} alt="QR Code" style={{ width: "200px", height: "200px", margin: "0 auto", borderRadius: 10, border: `2px solid ${C.light}` }} />
            <p style={{ fontSize: 12, color: C.slate, marginTop: 16 }}>امسح الرمز للدخول السريع</p>
            <button onClick={() => setSelectedQR(null)} style={{ width: "100%", padding: 12, background: C.red, color: "#fff", border: "none", borderRadius: 12, fontWeight: "bold", marginTop: 10 }}>إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AdminDashboard />);
