const { useState, useEffect } = React;

const supabaseUrl = 'https://qfdkuzlndzlydcrwboqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGt1emxuZHpseWRjcndib3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTU2OTQsImV4cCI6MjA5NTAzMTY5NH0.WYx5xRSifld6Bd45dBzuX_1gnUkeM0fhQOiH1QguWtY';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const C = {
  bg: "#0f1923", card: "#fff", navy: "#1e293b", blue: "#3b82f6",
  border: "#e2e8f0", slate: "#64748b", red: "#ef4444", green: "#10b981", indigo: "#6366f1"
};

function AdminDashboard() {
  const [isAuth, setIsAuth] = useState(false);
  const [passInput, setPassInput] = useState("");
  const [authError, setAuthError] = useState("");

  const [accounts, setAccounts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState("accounts");
  const [form, setForm] = useState({ building_id: "", unit: "", password_code: "", role: "owner" });
  const [voteQuestion, setVoteQuestion] = useState("");

  useEffect(() => {
    if (isAuth) {
      fetchAccounts();
      fetchTickets();
    }
  }, [isAuth]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passInput === "Db2026$$") {
      setIsAuth(true);
    } else {
      setAuthError("❌ كلمة المرور غير صحيحة!");
    }
  };

  const fetchAccounts = async () => {
    const { data } = await supabase.from("building_accounts").select("*").order("created_at", { ascending: false });
    setAccounts(data || []);
  };

  const fetchTickets = async () => {
    const { data } = await supabase.from("building_tickets").select("*").order("created_at", { ascending: false });
    setTickets(data || []);
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    await supabase.from("building_accounts").insert([form]);
    fetchAccounts();
    setForm({ building_id: "", unit: "", password_code: "", role: "owner" });
  };

  const handleCreateVote = async (e) => {
    e.preventDefault();
    if (!voteQuestion) return;
    await supabase.from("building_votes").insert([{ question: voteQuestion, options: ['موافق', 'غير موافق'] }]);
    setVoteQuestion("");
  };

  const markResolved = async (id) => {
    await supabase.from("building_tickets").update({ status: 'resolved' }).eq('id', id);
    fetchTickets();
  };

  if (!isAuth) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Noto Sans Arabic', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700;900&display=swap" rel="stylesheet" />
        <form onSubmit={handleLogin} style={{ background: "#fff", padding: 30, borderRadius: 24, width: "100%", maxWidth: 360, textAlign: "center" }}>
          <h2>🔒 بوابة الإدارة المحمية</h2>
          <p style={{ color: C.slate, fontSize: 13 }}>يرجى إدخال كلمة السر المؤقتة للدخول للنظام</p>
          {authError && <div style={{ color: C.red, fontWeight: "bold", marginBottom: 10, fontSize: 13 }}>{authError}</div>}
          <input type="password" value={passInput} onChange={(e) => setPassInput(e.target.value)} placeholder="Db2026$$" style={{ width: "100%", padding: 12, borderRadius: 12, border: `2px solid ${C.border}`, textAlign: "center", marginBottom: 16, boxSizing: "border-box", fontWeight: "bold" }} />
          <button type="submit" style={{ width: "100%", padding: 12, background: C.blue, color: "white", border: "none", borderRadius: 50, fontWeight: "bold", cursor: "pointer" }}>🔓 دخول النظام</button>
        </form>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Noto Sans Arabic', sans-serif", display: "flex", flexDirection: "column" }}>
      <header style={{ background: C.navy, color: "#fff", padding: "16px 24px", textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>المبنى الرقمي - لوحة الإدارة 🏢</h1>
      </header>

      <div style={{ display: "flex", background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "4px 12px", gap: 8, justifyContent: "center" }}>
        <button onClick={() => setActiveTab("accounts")} style={{ padding: "12px", border: "none", background: "none", fontWeight: "bold", color: activeTab === "accounts" ? C.blue : C.slate }}>👥 الحسابات ({accounts.length})</button>
        <button onClick={() => setActiveTab("tickets")} style={{ padding: "12px", border: "none", background: "none", fontWeight: "bold", color: activeTab === "tickets" ? C.blue : C.slate }}>🛠️ الصيانة ({tickets.length})</button>
        <button onClick={() => setActiveTab("votes")} style={{ padding: "12px", border: "none", background: "none", fontWeight: "bold", color: activeTab === "votes" ? C.blue : C.slate }}>🗳️ التصويت</button>
      </div>

      <main style={{ padding: 16, flex: 1, maxWidth: 600, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {activeTab === "accounts" && (
          <div>
            <form onSubmit={handleAddAccount} style={{ background: "#fff", padding: 16, borderRadius: 16, marginBottom: 16 }}>
              <h3>➕ إضافة حساب ساكن جديد</h3>
              <input type="text" name="building_id" placeholder="رقم المبنى" onChange={(e) => setForm({ ...form, building_id: e.target.value })} style={{ width: "100%", padding: 10, marginBottom: 8 }} required />
              <input type="text" name="unit" placeholder="رقم الشقة" onChange={(e) => setForm({ ...form, unit: e.target.value })} style={{ width: "100%", padding: 10, marginBottom: 8 }} required />
              <input type="text" name="password_code" placeholder="الرمز السري" onChange={(e) => setForm({ ...form, password_code: e.target.value })} style={{ width: "100%", padding: 10, marginBottom: 8 }} required />
              <select onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ width: "100%", padding: 10, marginBottom: 8 }}><option value="owner">👤 مالك</option><option value="hoa">👑 رئيس اتحاد</option><option value="contractor">🔧 مقاول</option></select>
              <button type="submit" style={{ width: "100%", padding: 10, background: C.blue, color: "white", borderRadius: 8 }}>حفظ الحساب</button>
            </form>
            <h3>👥 قائمة الحسابات المضافة للمبنى 12</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {accounts.filter(a => a.building_id === '12').map(acc => (
                <div key={acc.id} style={{ background: "#fff", padding: 10, borderRadius: 8, borderRight: `4px solid ${C.blue}` }}>🚪 وحدة {acc.unit} ({acc.role}) | 🔑 الرمز: <strong>{acc.password_code}</strong></div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "tickets" && (
          <div>
            <h3>📋 بلاغات الصيانة المعلقة لجميع المباني</h3>
            {tickets.map(t => (
              <div key={t.id} style={{ background: "#fff", padding: 14, borderRadius: 12, marginBottom: 8, borderRight: `4px solid ${t.status==='pending'?C.red:C.green}` }}>
                <strong>🚪 مبنى {t.building_id} | وحدة {t.unit}</strong> - {t.title}
                <p style={{ margin: 0, fontSize: 12, color: C.slate }}>{t.description}</p>
                {t.status === 'pending' && <button onClick={() => markResolved(t.id)} style={{ padding: "4px 8px", background: C.green, color: "white", borderRadius: 6, fontSize: 11, marginTop: 6, border: "none" }}>⚙️ تم الحل</button>}
              </div>
            ))}
          </div>
        )}

        {activeTab === "votes" && (
          <div>
            <form onSubmit={handleCreateVote} style={{ background: "#fff", padding: 16, borderRadius: 16, marginBottom: 16 }}>
              <h3>📢 إطلاق تصويت عام لجميع المباني</h3>
              <input type="text" value={voteQuestion} onChange={(e) => setVoteQuestion(e.target.value)} placeholder="مثال: هل تؤيدون تغيير شركة النظافة؟" style={{ width: "100%", padding: 10, marginBottom: 8 }} />
              <button type="submit" style={{ width: "100%", padding: 10, background: C.indigo, color: "white", borderRadius: 8 }}>نشر التصويت فورا</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AdminDashboard />);
