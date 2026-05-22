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
  
  const [form, setForm] = useState({
    property_type: "apartment", role: "owner",
    compound_id: "", building_id: "", unit: "", villa_id: "", townhouse_id: "",
    username: "", password_code: ""
  });
  const [notif, setNotif] = useState({ show: false, msg: "", type: "success" });

  useEffect(() => {
    fetchAccounts();
  }, []);

  // جلب البيانات الحقيقية من Supabase
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("building_accounts")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      setAccounts(data || []);
    } catch (err) {
      showNotification("حدث خطأ أثناء جلب البيانات من Supabase", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const showNotification = (msg, type = "success") => {
    setNotif({ show: true, msg, type });
    setTimeout(() => setNotif({ show: false, msg: "", type: "success" }), 3000);
  };

  // حفظ وإرسال البيانات الحقيقية إلى Supabase
  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!form.password_code) {
      showNotification("يرجى إدخال الرمز السري", "error");
      return;
    }

    try {
      const { error } = await supabase.from("building_accounts").insert([form]);
      if (error) throw error;
      
      showNotification("تم توليد وحفظ الحساب في قاعدة البيانات بنجاح!");
      setActiveTab("view_accounts");
      fetchAccounts(); 
      
      setForm({
        property_type: "apartment", role: "owner", compound_id: "", building_id: "",
        unit: "", villa_id: "", townhouse_id: "", username: "", password_code: ""
      });
    } catch (err) {
      showNotification("فشل إضافة الحساب في سوبابيس", "error");
    }
  };

  const stats = {
    total: accounts.length,
    owners: accounts.filter(a => a.role === "owner").length,
    hoa: accounts.filter(a => a.role === "hoa").length,
    contractors: accounts.filter(a => a.role === "contractor").length,
  };

  const filteredAccounts = accounts.filter(acc => {
    const search = searchQuery.toLowerCase();
    return (
      acc.compound_id?.toLowerCase().includes(search) ||
      acc.building_id?.toLowerCase().includes(search) ||
      acc.unit?.toLowerCase().includes(search) ||
      acc.username?.toLowerCase().includes(search) ||
      acc.property_type.toLowerCase().includes(search)
    );
  });

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Noto Sans Arabic', sans-serif", display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700;900&display=swap" rel="stylesheet" />
      
      <header style={{ background: C.navy, color: "#fff", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>المبنى الرقمي 🏢</h1>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>لوحة تحكم مالك النظام</p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.1)", padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>👑 المدير</div>
      </header>

      <div style={{ display: "flex", background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "4px 12px", gap: 8, overflowX: "auto" }}>
        <button onClick={() => setActiveTab("overview")} style={{ padding: "12px", background: "none", border: "none", borderBottom: activeTab === "overview" ? `3px solid ${C.blue}` : "3px solid transparent", color: activeTab === "overview" ? C.blue : C.slate, fontWeight: 700, fontSize: 13 }}>📊 نظرة عامة</button>
        <button onClick={() => setActiveTab("add_account")} style={{ padding: "12px", background: "none", border: "none", borderBottom: activeTab === "add_account" ? `3px solid ${C.blue}` : "3px solid transparent", color: activeTab === "add_account" ? C.blue : C.slate, fontWeight: 700, fontSize: 13 }}>➕ إضافة حساب</button>
        <button onClick={() => setActiveTab("view_accounts")} style={{ padding: "12px", background: "none", border: "none", borderBottom: activeTab === "view_accounts" ? `3px solid ${C.blue}` : "3px solid transparent", color: activeTab === "view_accounts" ? C.blue : C.slate, fontWeight: 700, fontSize: 13 }}>👥 الحسابات ({accounts.length})</button>
      </div>

      {notif.show && (
        <div style={{ position: "fixed", top: 20, left: 20, right: 20, background: notif.type === "success" ? C.green : C.red, color: "#fff", padding: "12px", borderRadius: 10, textAlign: "center", zIndex: 1000, fontWeight: 700 }}>
          {notif.msg}
        </div>
      )}

      <main style={{ padding: 16, flex: 1, maxWidth: 600, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        
        {activeTab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div style={{ background: C.card, padding: 14, borderRadius: 14, boxShadow: "0 2px 6px rgba(0,0,0,.03)" }}>
                <div style={{ fontSize: 20 }}>🏢</div>
                <div style={{ fontSize: 11, color: C.slate }}>إجمالي العقارات</div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{stats.total}</div>
              </div>
              <div style={{ background: C.card, padding: 14, borderRadius: 14, boxShadow: "0 2px 6px rgba(0,0,0,.03)" }}>
                <div style={{ fontSize: 20 }}>👤</div>
                <div style={{ fontSize: 11, color: C.slate }}>الملاك</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: C.blue }}>{stats.owners}</div>
              </div>
            </div>
            <button onClick={() => setActiveTab("add_account")} style={{ width:"100%", padding:"12px", background: C.blue, color:"white", border:"none", borderRadius:12, fontWeight:700 }}>+ إضافة عقار/حساب جديد فوراً</button>
          </div>
        )}

        {activeTab === "add_account" && (
          <div style={{ background: C.card, padding: 20, borderRadius: 20, boxShadow: "0 4px 12px rgba(0,0,0,.04)" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 16 }}>توليد حساب عقاري</h3>
            <form onSubmit={handleAddAccount}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, color: C.slate, marginBottom: 4 }}>نوع العقار</label>
                <select name="property_type" value={form.property_type} onChange={handleInputChange} style={{ width: "100%", padding: 10, borderRadius: 10, border: `2px solid ${C.border}` }}>
                  <option value="apartment">🏢 عمارة سكنية</option>
                  <option value="compound">🏘️ مجمع سكني</option>
                  <option value="villa">🏡 فيلا مستقلة</option>
                  <option value="townhouse">🏠 تاون هاوس</option>
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, color: C.slate, marginBottom: 4 }}>الدور / الصلاحية</label>
                <select name="role" value={form.role} onChange={handleInputChange} style={{ width: "100%", padding: 10, borderRadius: 10, border: `2px solid ${C.border}` }}>
                  <option value="owner">👤 مالك الوحدة</option>
                  <option value="hoa">👑 رئيس اتحاد الملاك</option>
                  <option value="contractor">🔧 مقاول / خدمات</option>
                </select>
              </div>

              {/* حقول ديناميكية مريحة للجوال */}
              {(form.property_type !== "apartment") && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>اسم / رقم المجمع</label>
                  <input type="text" name="compound_id" value={form.compound_id} onChange={handleInputChange} style={{ width: "100%", padding: 10, borderRadius: 10, border: `2px solid ${C.border}`, boxSizing: "border-box" }} />
                </div>
              )}
              {form.property_type === "apartment" && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>رقم المبنى / البرج</label>
                  <input type="text" name="building_id" value={form.building_id} onChange={handleInputChange} style={{ width: "100%", padding: 10, borderRadius: 10, border: `2px solid ${C.border}`, boxSizing: "border-box" }} />
                </div>
              )}
              {form.property_type === "apartment" && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>رقم الشقة / الوحدة</label>
                  <input type="text" name="unit" value={form.unit} onChange={handleInputChange} style={{ width: "100%", padding: 10, borderRadius: 10, border: `2px solid ${C.border}`, boxSizing: "border-box" }} />
                </div>
              )}
              {form.property_type === "villa" && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>رقم الفيلا</label>
                  <input type="text" name="villa_id" value={form.villa_id} onChange={handleInputChange} style={{ width: "100%", padding: 10, borderRadius: 10, border: `2px solid ${C.border}`, boxSizing: "border-box" }} />
                </div>
              )}
              {form.property_type === "townhouse" && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>رقم التاون هاوس</label>
                  <input type="text" name="townhouse_id" value={form.townhouse_id} onChange={handleInputChange} style={{ width: "100%", padding: 10, borderRadius: 10, border: `2px solid ${C.border}`, boxSizing: "border-box" }} />
                </div>
              )}
              {(form.role !== "owner") && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>اسم المستخدم</label>
                  <input type="text" name="username" value={form.username} onChange={handleInputChange} style={{ width: "100%", padding: 10, borderRadius: 10, border: `2px solid ${C.border}`, boxSizing: "border-box" }} />
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, marginBottom: 4, fontWeight: "bold" }}>الرمز السري للدخول</label>
                <input type="text" name="password_code" value={form.password_code} onChange={handleInputChange} placeholder="مثال: 1234" style={{ width: "100%", padding: 10, borderRadius: 10, border: `2px solid ${C.border}`, boxSizing: "border-box", fontWeight:"bold", color:C.blue }} />
              </div>

              <button type="submit" style={{ width: "100%", padding: "12px 0", background: C.blue, color: "#fff", border: "none", borderRadius: 50, fontWeight: 700 }}>💾 حفظ وتوليد بالمنصة</button>
            </form>
          </div>
        )}

        {activeTab === "view_accounts" && (
          <div>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="🔍 ابحث برقم الوحدة، المجمع..." style={{ width: "100%", padding: 12, borderRadius: 10, border: `2px solid ${C.border}`, marginBottom: 12, boxSizing: "border-box" }} />
            
            {loading ? <div style={{textAlign:"center", padding:20}}>جاري تحميل البيانات الحقيقية...</div> : 
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredAccounts.map((acc) => (
                <div key={acc.id} style={{ background: C.card, borderRadius: 12, padding: 12, boxShadow: "0 2px 6px rgba(0,0,0,.02)", borderRight: `4px solid ${C.typeColors[acc.property_type] || C.blue}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: "bold" }}>
                    <span style={{ color: C.typeColors[acc.property_type] }}>{acc.property_type}</span>
                    <span style={{ color: C.roleColors[acc.role] }}>{acc.role}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: "bold", marginTop: 4 }}>
                    {acc.compound_id && `مجمع: ${acc.compound_id} `}
                    {acc.building_id && `| مبنى: ${acc.building_id} `}
                    {acc.unit && `| وحدة: ${acc.unit} `}
                    {acc.villa_id && `| فيلا: ${acc.villa_id} `}
                    {acc.townhouse_id && `| تاون هاوس: ${acc.townhouse_id} `}
                    {acc.username && `| مستخدم: ${acc.username} `}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, borderTop: `1px solid ${C.light}`, paddingTop: 6 }}>
                    🔑 الرمز السري الحقيقي: <strong style={{color: C.blue}}>{acc.password_code}</strong>
                  </div>
                </div>
              ))}
            </div>}
          </div>
        )}
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AdminDashboard />);
