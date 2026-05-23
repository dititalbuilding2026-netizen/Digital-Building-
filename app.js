const { useState, useEffect } = React;

const supabaseUrl = 'https://qfdkuzlndzlydcrwboqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGt1emxuZHpseWRjcndib3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTU2OTQsImV4cCI6MjA5NTAzMTY5NH0.WYx5xRSifld6Bd45dBzuX_1gnUkeM0fhQOiH1QguWtY';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const C = {
  bg: "#0f1923", card: "#fff", navy: "#1e293b", blue: "#3b82f6",
  slate: "#64748b", border: "#e2e8f0", red: "#ef4444", green: "#10b981", indigo: "#6366f1"
};

function TenantApp() {
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeMenu, setActiveMenu] = useState("home"); // home, ticket, vote

  const [tickets, setTickets] = useState([]);
  const [votes, setVotes] = useState([]);
  const [votedList, setVotedList] = useState([]);
  const [ticketForm, setTicketForm] = useState({ title: "", description: "" });
  const [notif, setNotif] = useState({ show: false, msg: "" });

  const [credentials, setCredentials] = useState({ building_id: "", unit: "", password_code: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pass = params.get('pass');
    if (pass) autoLogin(pass);
  }, []);

  const autoLogin = async (pass) => {
    const { data } = await supabase.from("building_accounts").select("*").eq("password_code", pass);
    if (data && data.length > 0) loginSuccess(data[0]);
  };

  const loginSuccess = (user) => {
    setUserData(user);
    setIsLoggedIn(true);
    loadAppData(user);
  };

  const loadAppData = async (user) => {
    const { data: tData } = await supabase.from("building_tickets").select("*").eq("building_id", user.building_id);
    setTickets(tData || []);
    const { data: vData } = await supabase.from("building_votes").select("*").eq("building_id", user.building_id);
    setVotes(vData || []);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    const { data } = await supabase.from("building_accounts").select("*")
      .eq("building_id", credentials.building_id).eq("unit", credentials.unit).eq("password_code", credentials.password_code);
    if (data && data.length > 0) { loginSuccess(data[0]); }
    else { setErrorMsg("⚠️ بيانات الدخول غير صحيحة"); }
    setLoading(false);
  };

  const handleSendTicket = async (e) => {
    e.preventDefault();
    await supabase.from("building_tickets").insert([{ building_id: userData.building_id, unit: userData.unit, title: ticketForm.title, description: ticketForm.description }]);
    setNotif({ show: true, msg: "✅ تم إرسال بلاغ الصيانة بنجاح!" });
    setTicketForm({ title: "", description: "" });
    loadAppData(userData);
  };

  const handleVoteSubmit = async (voteId, option) => {
    await supabase.from("vote_responses").insert([{ vote_id: voteId, unit: userData.unit, selected_option: option }]);
    setVotedList([...votedList, voteId]);
    setNotif({ show: true, msg: "🗳️ تم تسجيل تصويتك بنجاح!" });
  };

  if (isLoggedIn && userData) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: "#f8fafc", padding: 16, fontFamily: "'Noto Sans Arabic', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700;900&display=swap" rel="stylesheet" />
        
        <div style={{ background: C.navy, color: "#fff", padding: 16, borderRadius: 16, textAlign: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>المبنى الرقمي - بوابتك الذكية 🏢</h2>
          <p style={{ margin: 0, fontSize: 12 }}>مبنى: {userData.building_id} | وحدة: {userData.unit} | دورك: {userData.role === 'owner' ? '👤 مالك' : userData.role === 'hoa' ? '👑 رئيس' : '🔧 مقاول'}</p>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 16, justifyContent: "center" }}>
          <button onClick={() => setActiveMenu("home")} style={{ flex: 1, padding: 8, borderRadius: 8, background: activeMenu==='home'?C.blue:'#fff', color: activeMenu==='home'?'#fff':C.slate, fontWeight: "bold", fontSize: 11 }}>🏠 رئيسية</button>
          {userData.role !== 'contractor' && <button onClick={() => setActiveMenu("ticket")} style={{ flex: 1, padding: 8, borderRadius: 8, background: activeMenu==='ticket'?C.blue:'#fff', color: activeMenu==='ticket'?'#fff':C.slate, fontWeight: "bold", fontSize: 11 }}>🛠️ الصيانة</button>}
          {userData.role !== 'contractor' && <button onClick={() => setActiveMenu("vote")} style={{ flex: 1, padding: 8, borderRadius: 8, background: activeMenu==='vote'?C.blue:'#fff', color: activeMenu==='vote'?'#fff':C.slate, fontWeight: "bold", fontSize: 11 }}>🗳️ التصويت</button>}
        </div>

        {notif.show && <div style={{ background: C.green, color: "#fff", padding: 10, borderRadius: 10, fontSize: 12, textAlign: "center", marginBottom: 12 }}>{notif.msg}</div>}

        {activeMenu === "home" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ background: "#fff", padding: 16, borderRadius: 16 }}>
              <h4>💰 صندوق اتحاد الملاك والمالية</h4>
              <p style={{ margin: 0, fontSize: 12 }}>حالة سداد رسوم اتحاد الملاك لعام 2026:</p>
              <div style={{ marginTop: 10, padding: 12, background: "#f0fdf4", borderRadius: 10, color: C.green, fontWeight: "bold", textAlign: "center", fontSize: 13 }}>
                ✅ مسدد بالكامل (لا توجد مستحقات معلقة)
              </div>
            </div>
            {userData.role === 'contractor' && (
              <div style={{ background: "#fff", padding: 16, borderRadius: 16 }}>
                <h4>🔧 تنبيه المقاول</h4>
                <p style={{ margin: 0, fontSize: 12 }}>يرجى الانتقال لقسم "الصيانة" لمتابعة وإصلاح بلاغات الملاك المعلقة.</p>
              </div>
            )}
          </div>
        )}

        {activeMenu === "ticket" && (
          <div>
            {userData.role !== 'contractor' && (
              <form onSubmit={handleSendTicket} style={{ background: "#fff", padding: 16, borderRadius: 16, marginBottom: 16 }}>
                <h4>🚨 رفع بلاغ صيانة جديد لمبنى {userData.building_id} وحدة {userData.unit}</h4>
                <input type="text" value={ticketForm.title} onChange={(e) => setTicketForm({...ticketForm, title: e.target.value})} placeholder="عنوان البلاغ (مثال: المصعد عطلان)" style={{ width: "100%", padding: 10, marginBottom: 8 }} required />
                <textarea value={ticketForm.description} onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})} placeholder="تفاصيل وموقع العطل بالتفصيل..." style={{ width: "100%", padding: 10, marginBottom: 10 }} required />
                <button type="submit" style={{ width: "100%", padding: 10, background: C.red, color: "white", borderRadius: 8, fontWeight: "bold" }}>🚀 إرسال البلاغ فوراً</button>
              </form>
            )}
            <h4>📋 بلاغات مبنى {userData.building_id}</h4>
            {tickets.map(t => (
              <div key={t.id} style={{ background: "#fff", padding: 12, borderRadius: 12, marginBottom: 8 }}>
                <strong>🚪 وحدة {t.unit}</strong> - {t.title}
                <p style={{ margin: 0, fontSize: 11, color: t.status==='pending'?C.red:C.green }}>{t.status==='pending'?'⏳ قيد الانتظار':'✅ تم الحل'}</p>
              </div>
            ))}
          </div>
        )}

        {activeMenu === "vote" && (
          <div>
            <h4>🗳️ القرارات والتصويت الحي لمبنى {userData.building_id}</h4>
            {votes.map(v => (
              <div key={v.id} style={{ background: "#fff", padding: 16, borderRadius: 14, marginBottom: 10 }}>
                <p style={{ fontWeight: "bold", margin: "0 0 10px" }}>📢 {v.question}</p>
                {votedList.includes(v.id) ? (
                  <div style={{ textol: C.green, fontSize: 11, textAlign: "center" }}>✓ تم تسجيل تصويتك بنجاح شكراً لك</div>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleVoteSubmit(v.id, 'موافق')} style={{ flex: 1, padding: 8, background: C.green, color: "white", borderRadius: 8, fontWeight: "bold" }}>👍 موافق</button>
                    <button onClick={() => handleVoteSubmit(v.id, 'غير موافق')} style={{ flex: 1, padding: 8, background: C.red, color: "white", borderRadius: 8, fontWeight: "bold" }}>👎 غير موافق</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <button onClick={() => { setIsLoggedIn(false); window.location.href = window.location.pathname; }} style={{ width: "100%", padding: 10, background: C.bg, color: "#fff", border: "none", borderRadius: 10, marginTop: 20, fontWeight: "bold", fontSize: 12 }}>🚪 تسجيل الخروج</button>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Noto Sans Arabic', sans-serif", display: "flex", flexDirection: "column", justifyContent: "center", padding: 20 }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700;900&display=swap" rel="stylesheet" />
      <div style={{ background: "#fff", padding: 24, borderRadius: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 40 }}>🏢</span>
          <h2 style={{ margin: "10px 0 0", color: C.navy, fontWeight: 900 }}>المبنى الرقمي</h2>
          <p style={{ margin: "4px 0 0", color: C.slate, fontSize: 12 }}>بوابتك الذكية لإدارة عقارك</p>
        </div>
        {errorMsg && <div style={{ color: C.red, fontWeight: "bold", marginBottom: 14, fontSize: 12, textAlign: "center" }}>{errorMsg}</div>}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12 }}>رقم البرج / المبنى</label><input type="text" name="building_id" onChange={(e)=>setCredentials({...credentials, building_id: e.target.value})} placeholder="مثال: البرج أ" style={{ width: "100%", padding: 10 }} required /></div>
          <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12 }}>رقم الشقة / الوحدة</label><input type="text" name="unit" onChange={(e)=>setCredentials({...credentials, unit: e.target.value})} placeholder="مثال: 5" style={{ width: "100%", padding: 10 }} required /></div>
          <div style={{ marginBottom: 20 }}><label style={{ fontSize: 12, fontWeight: "bold" }}>الرمز السري للدخول</label><input type="password" name="password_code" onChange={(e)=>setCredentials({...credentials, password_code: e.target.value})} placeholder="🔑 أدخل الرمز" style={{ width: "100%", padding: 10, fontWeight: "bold" }} required /></div>
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", background: C.blue, color: "#fff", border: "none", borderRadius: 50, fontWeight: 700, fontSize: 14 }}>{loading ? "جاري التحقق..." : "🚪 تسجيل الدخول"}</button>
        </form>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<TenantApp />);
