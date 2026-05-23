const { useState, useEffect } = React;

const supabaseUrl = 'https://qfdkuzlndzlydcrwboqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGt1emxuZHpseWRjcndib3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTU2OTQsImV4cCI6MjA5NTAzMTY5NH0.WYx5xRSifld6Bd45dBzuX_1gnUkeM0fhQOiH1QguWtY';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const C = {
  bg: "#0f1923", card: "#fff", navy: "#1e293b", blue: "#3b82f6",
  indigo: "#6366f1", green: "#10b981", amber: "#f59e0b", slate: "#64748b",
  border: "#e2e8f0", light: "#f8fafc", red: "#ef4444",
  typeColors: { compound: "#6366f1", apartment: "#3b82f6", villa: "#10b981", townhouse: "#f59e0b" }
};

function AdminDashboard() {
  const [isAuth, setIsAuth] = useState(false);
  const [passInput, setPassInput] = useState("");
  const [authError, setAuthError] = useState("");

  const [accounts, setAccounts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); 
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQR, setSelectedQR] = useState(null);
  
  const [form, setForm] = useState({
    property_type: "apartment", role: "owner", compound_id: "", building_id: "", unit: "", password_code: ""
  });
  const [voteQuestion, setVoteQuestion] = useState("");
  const [notif, setNotif] = useState({ show: false, msg: "", type: "success" });

  useEffect(() => {
    if (isAuth) {
      fetchAccounts();
      fetchTickets();
    }
  }, [isAuth]);

  const fetchAccounts = async () => {
    try {
      const { data } = await supabase.from("building_accounts").select("*").order("created_at", { ascending: false });
      setAccounts(data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchTickets = async () => {
    try {
      const { data } = await supabase.from("building_tickets").select("*").order("created_at", { ascending: false });
      setTickets(data || []);
    } catch (err) { console.error(err); }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (passInput === "Db2026$$") {
      setIsAuth(true);
    } else {
      setAuthError("❌ كلمة المرور غير صحيحة!");
    }
  };

  const handleInputChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!form.password_code) return setNotif({ show: true, msg: "يرجى إدخال الرمز السري", type: "error" });
    try {
      const { error } = await supabase.from("building_accounts").insert([form]);
      if (error) throw error;
      setNotif({ show: true, msg: "تم إنشاء الحساب بنجاح!", type: "success" });
      setActiveTab("view_accounts");
      fetchAccounts();
    } catch (err) { setNotif({ show: true, msg: "فشل إضافة الحساب", type: "error" }); }
  };

  const handleCreateVote = async (e) => {
    e.preventDefault();
    if (!voteQuestion) return;
    try {
      const { error } = await supabase.from("building_votes").insert([{ question: voteQuestion, options: ['موافق', 'غير موافق'] }]);
      if (error) throw error;
      setNotif({ show: true, msg: "تم إطلاق التصويت لجميع السكان بنجاح!", type: "success" });
      setVoteQuestion("");
    } catch (err) { console.error(err); }
  };

  const generateQRData = (acc) => {
    const appUrl = "https://dititalbuilding2026-netizen.github.io/Digital-Building-/";
    const params = new URLSearchParams({ type: acc.property_type, role: acc.role, pass: acc.password_code });
    return encodeURIComponent(`${appUrl}?${params.toString()}`);
  };

  if (!isAuth) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Noto Sans Arabic', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700;900&display=swap" rel="stylesheet" />
        <form onSubmit={handleLogin} style={{ background: "#fff", padding: 30, borderRadius: 24, width: "100%", maxWidth: 360, textAlign: "center" }}>
          <h2>🔒 بوابة الإدارة المحمية</h2>
          <p style={{ color: C.slate, fontSize: 13 }}>يرجى إدخال كلمة السر المؤقتة للدخول للوحة التحكم</p>
          {authError && <div style={{ color: C.red, fontWeight: "bold", marginBottom: 10, fontSize: 13 }}>{authError}</div>}
          <input type="password" value={passInput} onChange={(e) => setPassInput(e.target.value)} placeholder="أدخل كلمة السر هنا" style={{ width: "100%", padding: 12, borderRadius: 12, border: `2px solid ${C.border}`, textAlign: "center", marginBottom: 16, boxSizing: "border-box", fontWeight: "bold" }} />
          <button type="submit" style={{ width: "100%", padding: 12, background: C.blue, color: "white", border: "none", borderRadius: 50, fontWeight: "bold", cursor: "pointer" }}>🔓 دخول النظام</button>
        </form>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Noto Sans Arabic', sans-serif", display: "flex", flexDirection: "column" }}>
      <header style={{ background: C.navy, color: "#fff", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>المبنى الرقمي 🏢</h1>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>لوحة تحكم النظام الشاملة</p>
        </div>
      </header>

      <div style={{ display: "flex", background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "4px 12px", gap: 8, overflowX: "auto" }}>
        <button onClick={() => setActiveTab("overview")} style={{ padding: "12px", background: "none", border: "none", borderBottom: activeTab === "overview" ? `3px solid ${C.blue}` : "3px solid transparent", color: activeTab === "overview" ? C.blue : C.slate, fontWeight: 700 }}>📊 نظرة عامة</button>
        <button onClick={() => setActiveTab("add_account")} style={{ padding: "12px", background: "none", border: "none", borderBottom: activeTab === "add_account" ? `3px solid ${C.blue}` : "3px solid transparent", color: activeTab === "add_account" ? C.blue : C.slate, fontWeight: 700 }}>➕ إضافة حساب</button>
        <button onClick={() => setActiveTab("view_accounts")} style={{ padding: "12px", background: "none", border: "none", borderBottom: activeTab === "view_accounts" ? `3px solid ${C.blue}` : "3px solid transparent", color: activeTab === "view_accounts" ? C.blue : C.slate, fontWeight: 700 }}>👥 الحسابات ({accounts.length})</button>
        <button onClick={() => setActiveTab("view_tickets")} style={{ padding: "12px", background: "none", border: "none", borderBottom: activeTab === "view_tickets" ? `3px solid ${C.blue}` : "3px solid transparent", color: activeTab === "view_tickets" ? C.blue : C.slate, fontWeight: 700 }}>🛠️ بلاغات الصيانة ({tickets.length})</button>
      </div>

      {notif.show && <div style={{ position: "fixed", top: 20, left: 20, right: 20, background: notif.type === "success" ? C.green : C.red, color: "#fff", padding: "12px", borderRadius: 10, textAlign: "center", zIndex: 1000, fontWeight: 700 }}>{notif.msg}</div>}

      <main style={{ padding: 16, flex: 1, maxWidth: 600, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {activeTab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              <div style={{ background: C.card, padding: 14, borderRadius: 14 }}>🏢 إجمالي العقارات: <strong>{accounts.length}</strong></div>
              <div style={{ background: C.card, padding: 14, borderRadius: 14 }}>🛠️ بلاغات معلقة: <strong>{tickets.filter(t=>t.status==='pending').length}</strong></div>
            </div>
            <div style={{ background: "#fff", padding: 16, borderRadius: 16 }}>
              <h3>🗳️ إطلاق تصويت عام للسكان</h3>
              <form onSubmit={handleCreateVote}>
                <input type="text" value={voteQuestion} onChange={(e)=>setVoteQuestion(e.target.value)} placeholder="مثال: هل تؤيدون صيانة الواجهة الخارجية للمبنى؟" style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 10 }} />
                <button type="submit" style={{ width: "100%", padding: 10, background: C.indigo, color: "white", border: "none", borderRadius: 8, fontWeight: "bold" }}>📢 نشر التصويت فورا</button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "add_account" && (
          <div style={{ background: C.card, padding: 20, borderRadius: 20 }}>
            <h3>توليد حساب عقاري جديد</h3>
            <form onSubmit={handleAddAccount}>
              <div style={{ marginBottom: 12 }}><label>نوع العقار</label><select name="property_type" value={form.property_type} onChange={handleInputChange} style={{ width: "100%", padding: 10 }}><option value="apartment">🏢 عمارة سكنية</option><option value="compound">🏘️ مجمع سكني</option></select></div>
              <div style={{ marginBottom: 12 }}><label>الدور والصلاحية</label><select name="role" value={form.role} onChange={handleInputChange} style={{ width: "100%", padding: 10 }}><option value="owner">👤 مالك وحدة</option><option value="hoa">👑 رئيس اتحاد الملاك</option><option value="contractor">🔧 مقاول صيانة</option></select></div>
              <div style={{ marginBottom: 12 }}><label>رقم/اسم المبنى</label><input type="text" name="building_id" onChange={handleInputChange} style={{ width: "100%", padding: 10 }} /></div>
              <div style={{ marginBottom: 12 }}><label>رقم الشقة/الوحدة (إن وجد)</label><input type="text" name="unit" onChange={handleInputChange} style={{ width: "100%", padding: 10 }} /></div>
              <div style={{ marginBottom: 16 }}><label>الرمز السري للدخول</label><input type="text" name="password_code" onChange={handleInputChange} style={{ width: "100%", padding: 10, fontWeight: "bold" }} /></div>
              <button type="submit" style={{ width: "100%", padding: "12px", background: C.blue, color: "#fff", border: "none", borderRadius: 50, fontWeight: 700 }}>💾 حفظ وتوليد الحساب</button>
            </form>
          </div>
        )}

        {activeTab === "view_accounts" && (
          <div>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="🔍 ابحث برقم الوحدة..." style={{ width: "100%", padding: 12, borderRadius: 10, marginBottom: 12 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {accounts.filter(a=>a.unit?.includes(searchQuery)).map((acc) => (
                <div key={acc.id} style={{ background: C.card, borderRadius: 12, padding: 12, borderRight: `4px solid ${C.blue}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: "bold" }}>
                    <span>{acc.property_type === "apartment" ? "🏢 شقة" : "🏡 مجمع"} ({acc.role})</span>
                    <button onClick={() => setSelectedQR(acc)} style={{ background: C.light, border: "none", padding: "4px 10px", borderRadius: 8, fontWeight: "bold", color: C.blue }}>📱 QR</button>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: "bold", marginTop: 4 }}>مبنى: {acc.building_id} | وحدة: {acc.unit || '-'}</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>🔑 الرمز: <strong>{acc.password_code}</strong></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "view_tickets" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tickets.map(t => (
              <div key={t.id} style={{ background: "#fff", padding: 14, borderRadius: 12, borderRight: `4px solid ${t.status==='pending'? C.amber : C.green}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.slate }}>
                  <span>🚪 مبنى {t.building_id} | وحدة {t.unit}</span>
                  <strong>{t.status === 'pending' ? '⏳ قيد الانتظار' : '✅ تم الحل'}</strong>
                </div>
                <h4 style={{ margin: "6px 0 2px" }}>{t.title}</h4>
                <p style={{ margin: 0, fontSize: 12, color: C.slate }}>{t.description}</p>
                {t.status === 'pending' && (
                  <button onClick={async () => { await supabase.from("building_tickets").update({status: 'resolved'}).eq('id', t.id); fetchTickets(); }} style={{ marginTop: 8, padding: "4px 10px", background: C.green, color: "white", border: "none", borderRadius: 6, fontSize: 11, fontWeight: "bold" }}>⚙️ تم الإصلاح</button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedQR && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 20, textAlign: "center" }}>
            <h3>QR Code الدخول السريع</h3>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${generateQRData(selectedQR)}`} alt="QR" />
            <button onClick={() => setSelectedQR(null)} style={{ width: "100%", padding: 10, background: C.red, color: "#fff", border: "none", borderRadius: 12, marginTop: 14 }}>إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AdminDashboard />);
