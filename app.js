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
  const [activeMenu, setActiveMenu] = useState("home"); 

  const [tickets, setTickets] = useState([]);
  const [votes, setVotes] = useState([]);
  const [votedList, setVotedList] = useState([]);
  const [ticketForm, setTicketForm] = useState({ title: "", description: "" });
  const [notif, setNotif] = useState({ show: false, msg: "" });

  const [credentials, setCredentials] = useState({ building_id: "", unit: "", password_code: "", role: "owner" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pass = params.get('pass');
    if (pass) autoLogin(pass);
  }, []);

  const autoLogin = async (pass) => {
    try {
      const { data } = await supabase.from("building_accounts").select("*").eq("password_code", pass);
      if (data && data.length > 0) loginSuccess(data[0]);
    } catch (err) { console.error(err); }
  };

  const loginSuccess = (user) => {
    setUserData(user);
    setIsLoggedIn(true);
    loadAppData(user);
  };

  const loadAppData = async (user) => {
    try {
      const { data: tData } = await supabase.from("building_tickets").select("*").eq("building_id", user.building_id);
      setTickets(tData || []);
      const { data: vData } = await supabase.from("building_votes").select("*").eq("building_id", user.building_id);
      setVotes(vData || []);
    } catch (err) { console.error(err); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const { data, error } = await supabase.from("building_accounts").select("*")
        .eq("building_id", credentials.building_id)
        .eq("unit", credentials.unit)
        .eq("password_code", credentials.password_code)
        .eq("role", credentials.role);
        
      if (error) throw error;

      if (data && data.length > 0) { 
        loginSuccess(data[0]); 
      } else { 
        setErrorMsg("⚠️ بيانات الدخول غير صحيحة، تأكد من اختيار الدور الصحيح والرمز"); 
      }
    } catch (err) { 
      setErrorMsg("⚠️ حدث خطأ في الاتصال بالسيرفر"); 
    }
    setLoading(false);
  };

  const handleSendTicket = async (e) => {
    e.preventDefault();
    try {
      await supabase.from("building_tickets").insert([{ building_id: userData.building_id, unit: userData.unit, title: ticketForm.title, description: ticketForm.description }]);
      setNotif({ show: true, msg: "✅ تم إرسال بلاغ الصيانة بنجاح!" });
      setTicketForm({ title: "", description: "" });
      loadAppData(userData);
    } catch (err) { console.error(err); }
  };

  const handleVoteSubmit = async (voteId, option) => {
    try {
      await supabase.from("vote_responses").insert([{ vote_id: voteId, unit: userData.unit, selected_option: option }]);
      setVotedList([...votedList, voteId]);
      setNotif({ show: true, msg: "🗳️ تم تسجيل تصويتك بنجاح!" });
    } catch (err) { console.error(err); }
  };

  if (isLoggedIn && userData) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: "#f8fafc", padding: 16, fontFamily: "'Noto Sans Arabic', sans-serif", boxSizing:"border-box" }}>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700;900&display=swap" rel="stylesheet" />
        
        <div style={{ background: C.navy, color: "#fff", padding: 16, borderRadius: 16, textAlign: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>المبنى الرقمي - بوابتك الذكية 🏢</h2>
          <p style={{ margin: 0, fontSize: 12 }}>مبنى: {userData.building_id} | وحدة: {userData.unit} | دورك الحالي: {userData.role === 'owner' ? '👤 مالك' : userData.role === 'hoa' ? '👑 رئيس اتحاد' : '🔧 مقاول'}</p>
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

        {activeMenu ===
