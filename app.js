const { useState, useEffect } = React;

const supabaseUrl = 'https://qfdkuzlndzlydcrwboqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGt1emxuZHpseWRjcndib3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTU2OTQsImV4cCI6MjA5NTAzMTY5NH0.WYx5xRSifld6Bd45dBzuX_1gnUkeM0fhQOiH1QguWtY';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

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

  const loginSuccess = (user) => {
    setUserData(user);
    setIsLoggedIn(true);
    supabase.from("building_tickets").select("*").eq("building_id", user.building_id).then(res => { if(res.data) setTickets(res.data); });
    supabase.from("building_votes").select("*").eq("building_id", user.building_id).then(res => { if(res.data) setVotes(res.data); });
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
        setErrorMsg("⚠️ بيانات الدخول غير صحيحة، تأكد من البيانات والرمز"); 
      }
    } catch (err) { 
      setErrorMsg("⚠️ حدث خطأ في الاتصال بقاعدة البيانات"); 
    }
    setLoading(false);
  };

  const handleSendTicket = async (e) => {
    e.preventDefault();
    await supabase.from("building_tickets").insert([{ building_id: userData.building_id, unit: userData.unit, title: ticketForm.title, description: ticketForm.description }]);
    setNotif({ show: true, msg: "✅ تم إرسال بلاغ الصيانة بنجاح!" });
    setTicketForm({ title: "", description: "" });
    supabase.from("building_tickets").select("*").eq("building_id", userData.building_id).then(res => { if(res.data) setTickets(res.data); });
  };

  const handleVoteSubmit = async (voteId, option) => {
    await supabase.from("vote_responses").insert([{ vote_id: voteId, unit: userData.unit, selected_option: option }]);
    setVotedList([...votedList, voteId]);
    setNotif({ show: true, msg: "🗳️ تم تسجيل تصويتك بنجاح!" });
  };

  if (isLoggedIn && userData) {
    return (
      <div dir="rtl" style={{ padding: 16, maxWidth: 500, margin: "0 auto", color: "#1e293b" }}>
        <div style={{ background: "#1e293b", color: "#fff", padding: 16, borderRadius: 12, textAlign: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>المبنى الرقمي الذكي 🏢</h2>
          <p style={{ margin: 0, fontSize: 12 }}>مبنى: {userData.building_id} | وحدة: {userData.unit} | دورك: {userData.role === 'owner' ? '👤 مالك' : userData.role === 'hoa' ? '👑 رئيس' : '🔧 مقاول'}</p>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          <button onClick={() => setActiveMenu("home")} style={{ flex: 1, padding: 8, background: activeMenu==='home'?'#3b82f6':'#fff', color: activeMenu==='home'?'#fff':'#64748b', fontWeight: "bold", border: "1px solid #e2e8f0", borderRadius: 8 }}>🏠 رئيسية</button>
          {userData.role !== 'contractor' && <button onClick={() => setActiveMenu("ticket")} style={{ flex: 1, padding: 8, background: activeMenu==='ticket'?'#3b82f6':'#fff', color: activeMenu==='ticket'?'#fff':'#64748b', fontWeight: "bold", border: "1px solid #e2e8f0", borderRadius: 8 }}>🛠️ صيانة</button>}
          {userData.role !== 'contractor' && <button onClick={() => setActiveMenu("vote")} style={{ flex: 1, padding: 8, background: activeMenu==='vote'?'#3b82f6':'#fff', color: activeMenu==='vote'?'#fff':'#64748b', fontWeight: "bold", border: "1px solid #e2e8f0", borderRadius: 8 }}>🗳️ تصويت</button>}
        </div>

        {notif.show && <div style={{ background: "#10b981", color: "#fff", padding: 10, borderRadius: 8, textAlign: "center", marginBottom: 12, fontSize: 12 }}>{notif.msg}</div>}

        {activeMenu === "home" && (
          <div style={{ background: "#fff", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <h4>💰 صندوق اتحاد الملاك والمالية</h4>
            <p style={{ fontSize: 12, color: "#64748b" }}>حالة رسوم الخدمات السنوية لعقارات لعام 2026:</p>
            <div style={{ padding: 10, background: "#f0fdf4", color: "#10b981", borderRadius: 8, textAlign: "center", fontWeight: "bold", fontSize: 12 }}>✅ مستحقاتك مسددة بالكامل</div>
          </div>
        )}

        {activeMenu === "ticket" && (
          <div>
            <form onSubmit={handleSendTicket} style={{ background: "#fff", padding: 16, borderRadius: 12, marginBottom: 16, border: "1px solid #e2e8f0" }}>
              <h4>🚨 رفع بلاغ صيانة جديد</h4>
              <input type="text" value={ticketForm.title} onChange={(e) => setTicketForm({...ticketForm, title: e.target.value})} placeholder="عنوان البلاغ (مثال: إنارة الممر عاطلة)" style={{ width: "100%", padding: 8, marginBottom: 8, boxSizing: "border-box" }} required />
              <textarea value={ticketForm.description} onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})} placeholder="تفاصيل موقع العطل..." style={{ width: "100%", padding: 8, marginBottom: 8, boxSizing: "border-box" }} required />
              <button type="submit" style={{ width: "100%", padding: 10, background: "#ef4444", color: "white", border: "none", borderRadius: 8, fontWeight: "bold" }}>🚀 إرسال البلاغ</button>
            </form>
            <h4>📋 قائمة البلاغات الحالية لمبناك</h4>
            {tickets.map(t => (
              <div key={t.id} style={{ background: "#fff", padding: 10, borderRadius: 8, marginBottom: 6, border: "1px solid #e2e8f0" }}>
                <strong>🚪 وحدة {t.unit}</strong> - {t.title}
                <p style={{ margin: 0, fontSize: 11, color: t.status==='pending'?'#f59e0b':'#10b981' }}>{t.status==='pending'?'⏳ قيد الانتظار':'✅ تم الحل'}</p>
              </div>
            ))}
          </div>
        )}

        {activeMenu === "vote" && (
          <div>
            <h4>🗳️ القرارات والتصويت الحي للمبنى</h4>
            {votes.map(v => (
              <div key={v.id} style={{ background: "#fff", padding: 12, borderRadius: 12, marginBottom: 8, border: "1px solid #e2e8f0" }}>
                <p style={{ fontWeight: "bold", margin: "0 0 10px", fontSize: 12 }}>📢 {v.question}</p>
                {votedList.includes(v.id) ? (
                  <div style={{ color: "#10b981", fontSize: 11, textAlign: "center" }}>✓ تم تسجيل تصويتك بنجاح شكراً لك</div>
                ) : (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => handleVoteSubmit(v.id, 'موافق')} style={{ flex: 1, padding: 6, background: "#10b981", color: "white", border: "none", borderRadius: 6, fontWeight: "bold" }}>👍 موافق</button>
                    <button onClick={() => handleVoteSubmit(v.id, 'غير موافق')} style={{ flex: 1, padding: 6, background: "#ef4444", color: "white", border: "none", borderRadius: 6, fontWeight: "bold" }}>👎 معترض</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <button onClick={() => { setIsLoggedIn(false); window.location.href = window.location.pathname; }} style={{ width: "100%", padding: 10, background: "#1e293b", color: "#fff", border: "none", borderRadius: 8, marginTop: 16, fontWeight: "bold" }}>🚪 تسجيل الخروج</button>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, boxSizing: "border-box" }}>
      <div style={{ background: "#fff", padding: 20, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 32 }}>🏢</span>
          <h3 style={{ margin: "4px 0 0", color: "#1e293b", fontWeight: 900 }}>المبنى الرقمي</h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: 11 }}>بوابتك الذكية لإدارة عقارك</p>
        </div>
        {errorMsg && <div style={{ color: "#ef4444", fontWeight: "bold", marginBottom: 12, fontSize: 11, textAlign: "center" }}>{errorMsg}</div>}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: "#64748b" }}>الدور / الصفة</label>
            <select value={credentials.role} onChange={(e)=>setCredentials({...credentials, role: e.target.value})} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <option value="owner">👤 مالك الوحدة</option>
              <option value="hoa">👑 رئيس جمعية اتحاد الملاك</option>
              <option value="contractor">🔧 مقاول الصيانة</option>
            </select>
          </div>
          <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11 }}>رقم المبنى</label><input type="text" value={credentials.building_id} onChange={(e)=>setCredentials({...credentials, building_id: e.target.value})} placeholder="مثال: 12" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e2e8f0", boxSizing: "border-box" }} required /></div>
          <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11 }}>رقم الشقة / الوحدة</label><input type="text" value={credentials.unit} onChange={(e)=>setCredentials({...credentials, unit: e.target.value})} placeholder="مثال: 5" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e2e8f0", boxSizing: "border-box" }} required /></div>
          <div style={{ marginBottom: 16 }}><label style={{ fontSize: 11, fontWeight: "bold" }}>الرمز السري</label><input type="password" value={credentials.password_code} onChange={(e)=>setCredentials({...credentials, password_code: e.target.value})} placeholder="🔑 الرمز السري" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e2e8f0", boxSizing: "border-box", textAlign: "center", fontWeight: "bold" }} required /></div>
          <button type="submit" disabled={loading} style={{ width: "100%", padding: 10, background: "#3b82f6", color: "#fff", border: "none", borderRadius: 20, fontWeight: "bold", fontSize: 13, cursor: "pointer" }}>{loading ? "جاري التحقق..." : "🚪 تسجيل الدخول"}</button>
        </form>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<TenantApp />);
