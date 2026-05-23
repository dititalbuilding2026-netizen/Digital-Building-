const { useState, useEffect } = React;

const supabaseUrl = 'https://qfdkuzlndzlydcrwboqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInZiI6InFmZGt1emxuZHpseWRjcndib3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTU2OTQsImV4cCI6MjA5NTAzMTY5NH0.WYx5xRSifld6Bd45dBzuX_1gnUkeM0fhQOiH1QguWtY';
// معالجة بسيطة للمفتاح لضمان الاتصال المباشر
const finalKey = supabaseKey.replace('inrZi', 'inN1c');
const supabase = window.supabase.createClient(supabaseUrl, finalKey);

const C = {
  bg: "#0f1923", card: "#fff", navy: "#1e293b", blue: "#3b82f6",
  indigo: "#6366f1", green: "#10b981", amber: "#f59e0b", slate: "#64748b",
  border: "#e2e8f0", light: "#f8fafc", red: "#ef4444"
};

function TenantApp() {
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  
  // حقول الخدمات التفاعلية حقت الملاك والمقاولين ورئيس الاتحاد
  const [activeMenu, setActiveMenu] = useState("home"); // home, ticket, vote, finance, hoa_panel
  const [tickets, setTickets] = useState([]);
  const [votes, setVotes] = useState([]);
  const [votedList, setVotedList] = useState([]);
  
  const [ticketForm, setTicketForm] = useState({ title: "", description: "" });
  const [hoaForm, setHoaForm] = useState({ role: "owner", unit: "", password_code: "" });
  const [managedAccounts, setManagedAccounts] = useState([]);
  const [notif, setNotif] = useState({ show: false, msg: "", type: "success" });

  const [credentials, setCredentials] = useState({
    property_type: "apartment", role: "owner", building_id: "", unit: "", password_code: ""
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type'); const role = params.get('role'); const pass = params.get('pass');
    if (type && role && pass) autoLogin(type, role, pass);
  }, []);

  const autoLogin = async (type, role, pass) => {
    setLoading(true);
    try {
      const { data } = await supabase.from("building_accounts").select("*").eq("property_type", type).eq("role", role).eq("password_code", pass);
      if (data && data.length > 0) { loginSuccess(data[0]); }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const loginSuccess = (user) => {
    setUserData(user);
    setIsLoggedIn(true);
    loadAppData(user);
  };

  const loadAppData = async (user) => {
    // جلب البلاغات الخاصة بالمبنى
    const { data: tData } = await supabase.from("building_tickets").select("*").eq("building_id", user.building_id);
    setTickets(tData || []);

    // جلب التصويت النشط
    const { data: vData } = await supabase.from("building_votes").select("*");
    setVotes(vData || []);

    if (user.role === "hoa") {
      const { data: mData } = await supabase.from("building_accounts").select("*").eq("created_by", user.password_code);
      setManagedAccounts(mData || []);
    }
  };

  const handleInputChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setErrorMsg("");
    try {
      const { data } = await supabase.from("building_accounts").select("*")
        .eq("property_type", credentials.property_type).eq("role", credentials.role)
        .eq("building_id", credentials.building_id).eq("password_code", credentials.password_code);
      if (data && data.length > 0) { loginSuccess(data[0]); } 
      else { setErrorMsg("⚠️ الرمز السري أو بيانات الدخول غير صحيحة"); }
    } catch (err) { setErrorMsg("⚠️ حدث خطأ في الاتصال بالسيرفر"); }
    setLoading(false);
  };

  const handleSendTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.title || !ticketForm.description) return;
    try {
      await supabase.from("building_tickets").insert([{
        building_id: userData.building_id, unit: userData.unit, title: ticketForm.title, description: ticketForm.description
      }]);
      setNotif({ show: true, msg: "🚀 تم إرسال بلاغ الصيانة بنجاح ووصل للاتحاد والمقاولين!", type: "success" });
      setTicketForm({ title: "", description: "" }); loadAppData(userData); setActiveMenu("home");
    } catch (err) { console.error(err); }
  };

  const handleVoteSubmit = async (voteId, option) => {
    try {
      await supabase.from("vote_responses").insert([{ vote_id: voteId, unit: userData.unit, selected_option: option }]);
      setVotedList([...votedList, voteId]);
      setNotif({ show: true, msg: "🗳️ تم تسجيل تصويتك بنجاح شكراً لك!", type: "success" });
    } catch (err) { console.error(err); }
  };

  const handleHoaCreate = async (e) => {
    e.preventDefault();
    try {
      await supabase.from("building_accounts").insert([{
        property_type: userData.property_type, role: hoaForm.role, building_id: userData.building_id, unit: hoaForm.unit, password_code: hoaForm.password_code, created_by: userData.password_code
      }]);
      setNotif({ show: true, msg: "✅ تم توليد حساب الساكن وحفظه بنجاح!", type: "success" });
      setHoaForm({ role: "owner", unit: "", password_code: "" }); loadAppData(userData);
    } catch (err) { console.error(err); }
  };

  if (isLoggedIn && userData) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Noto Sans Arabic', sans-serif", padding: 16, boxSizing:"border-box" }}>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700;900&display=swap" rel="stylesheet" />
        
        {/* هيدر ترحيبي يتغير لونه حسب دور المستخدم وفخامته */}
        <div style={{ background: userData.role==='hoa'? C.indigo : C.navy, color: "#fff", padding: 20, borderRadius: 16, textAlign: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>المبنى الرقمي الذكي 🏢</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>مبنى: {userData.building_id} {userData.unit && `| وحدة: ${userData.unit}`}</p>
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", padding: "2px 10px", borderRadius: 20, fontSize: 11, marginTop: 8, fontWeight:"bold" }}>
            صلاحيتك الفعالة: {userData.role === "owner" ? "👤 مالك مسكن" : userData.role === "hoa" ? "👑 رئيس اتحاد الملاك" : "🔧 مقاول صيانة"}
          </div>
        </div>

        {/* أزرار التنقل الذكية والسلسة بين الخدمات المختلفة */}
        <div style={{ display:"grid", gridTemplateColumns: userData.role==='hoa'? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr", gap:6, marginBottom:16 }}>
          <button onClick={()=>setActiveMenu("home")} style={{ padding:10, borderRadius:10, border:"none", fontWeight:"bold", fontSize:11, background: activeMenu==='home'? C.blue : "#fff", color: activeMenu==='home'?'#fff':C.slate }}>🏠 رئيسية</button>
          <button onClick={()=>setActiveMenu("ticket")} style={{ padding:10, borderRadius:10, border:"none", fontWeight:"bold", fontSize:11, background: activeMenu==='ticket'? C.blue : "#fff", color: activeMenu==='ticket'?'#fff':C.slate }}>🛠️ الصيانة</button>
          <button onClick={()=>setActiveMenu("vote")} style={{ padding:10, borderRadius:10, border:"none", fontWeight:"bold", fontSize:11, background: activeMenu==='vote'? C.blue : "#fff", color: activeMenu==='vote'?'#fff':C.slate }}>🗳️ التصويت</button>
          {userData.role === 'hoa' && <button onClick={()=>setActiveMenu("hoa_panel")} style={{ padding:10, borderRadius:10, border:"none", fontWeight:"bold", fontSize:11, background: activeMenu==='hoa_panel'? C.blue : "#fff", color: activeMenu==='hoa_panel'?'#fff':C.slate }}>👑 الإدارة</button>}
        </div>

        {notif.show && <div style={{ background: C.green, color: "#fff", padding: 10, borderRadius: 10, fontSize: 12, textAlign: "center", marginBottom: 12, fontWeight: "bold" }}>{notif.msg}</div>}

        {/* 1. الشاشة الرئيسية والمالية */}
        {activeMenu === "home" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ background: "#fff", padding: 16, borderRadius: 16 }}>
              <h4 style={{ margin: "0 0 8px", color: C.navy }}>💰 صندوق اتحاد الملاك والمالية</h4>
              <p style={{ margin: 0, fontSize: 12, color: C.slate }}>حالة سداد رسوم الخدمات السنوية لعقارك الحالي:</p>
              <div style={{ marginTop: 10, padding: 12, background: "#f0fdf4", borderRadius: 10, color: C.green, fontWeight: "bold", textAlign: "center", fontSize: 13 }}>
                ✅ مستحقاتك مسددة بالكامل (حتى نهاية السنة)
              </div>
            </div>
            {userData.role === 'contractor' && (
              <div style={{ background: "#fff", padding: 16, borderRadius: 16, borderRight: `4px solid ${C.amber}` }}>
                <h4 style={{ margin: "0 0 4px", color: C.navy }}>🔧 تنبيه المقاول</h4>
                <p style={{ margin: 0, fontSize: 12, color: C.slate }}>يرجى الانتقال لقسم "الصيانة" لمتابعة وإصلاح بلاغات الملاك المفتوحة فورا.</p>
              </div>
            )}
          </div>
        )}

        {/* 2. شاشة البلاغات والشكاوى التفاعلية */}
        {activeMenu === "ticket" && (
          <div>
            {userData.role !== 'contractor' && (
              <div style={{ background: "#fff", padding: 16, borderRadius: 16, marginBottom: 16 }}>
                <h4>🚨 رفع بلاغ صيانة جديد</h4>
                <form onSubmit={handleSendTicket}>
                  <input type="text" value={ticketForm.title} onChange={(e)=>setTicketForm({...ticketForm, title: e.target.value})} placeholder="عنوان البلاغ (مثال: عطل في إنارة الممر)" style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 8, boxSizing:"border-box" }} />
                  <textarea value={ticketForm.description} onChange={(e)=>setTicketForm({...ticketForm, description: e.target.value})} placeholder="تفاصيل وموقع العطل بالتفصيل..." style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 10, boxSizing:"border-box" }} />
                  <button type="submit" style={{ width: "100%", padding: 10, background: C.blue, color: "white", border: "none", borderRadius: 8, fontWeight: "bold" }}>🚀 إرسال البلاغ فوراً</button>
                </form>
              </div>
            )}
            <h4>📋 قائمة البلاغات الحالية للمبنى</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tickets.map(t => (
                <div key={t.id} style={{ background: "#fff", padding: 12, borderRadius: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: "bold" }}>
                    <span>🚪 وحدة {t.unit || 'عامة'}</span>
                    <span style={{ color: t.status==='pending'? C.amber : C.green }}>{t.status === 'pending' ? '⏳ قيد الانتظار' : '✅ تم الحل'}</span>
                  </div>
                  <h5 style={{ margin: "4px 0 2px", fontSize: 13 }}>{t.title}</h5>
                  <p style={{ margin: 0, fontSize: 11, color: C.slate }}>{t.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. شاشة التصويت الحي والقرارات المشتركة */}
        {activeMenu === "vote" && (
          <div>
            <h4>🗳️ القرارات والتصويتات النشطة للمبنى</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {votes.map(v => (
                <div key={v.id} style={{ background: "#fff", padding: 16, borderRadius: 14 }}>
                  <p style={{ fontWeight: "bold", margin: "0 0 12px", fontSize: 13 }}>📢 {v.question}</p>
                  {votedList.includes(v.id) ? (
                    <div style={{ background: C.light, padding: 8, borderRadius: 8, textCol: C.green, fontSize: 11, textAlign: "center", fontWeight:"bold" }}>✓ تم تسجيل صوتك في هذا القرار سابقاً</div>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={()=>handleVoteSubmit(v.id, 'موافق')} style={{ flex: 1, padding: 8, background: C.green, color: "white", border: "none", borderRadius: 8, fontWeight: "bold" }}>👍 موافق</button>
                      <button onClick={()=>handleVoteSubmit(v.id, 'غير موافق')} style={{ flex: 1, padding: 8, background: C.red, color: "white", border: "none", borderRadius: 8, fontWeight: "bold" }}>👎 غير موافق</button>
                    </div>
                  )}
                </div>
              ))}
              {votes.length === 0 && <div style={{ textAlign: "center", color: C.slate, padding: 20 }}>لا توجد أي تصويتات معلنة حالياً.</div>}
            </div>
          </div>
        )}

        {/* 4. لوحة الإدارة المستقلة لرئيس اتحاد الملاك */}
        {activeMenu === "hoa_panel" && userData.role === 'hoa' && (
          <div style={{ background: "#fff", padding: 16, borderRadius: 16 }}>
            <h4>👑 توليد حسابات السكان لمبناك</h4>
            <form onSubmit={handleHoaCreate} style={{ background: C.light, padding: 12, borderRadius: 12, marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}><label style={{ fontSize: 11 }}>دور الساكن</label><select value={hoaForm.role} onChange={(e)=>setHoaForm({...hoaForm, role: e.target.value})} style={{ width: "100%", padding: 8 }}><option value="owner">👤 مالك وحدة</option><option value="contractor">🔧 مقاول صيانة</option></select></div>
              <div style={{ marginBottom: 8 }}><label style={{ fontSize: 11 }}>رقم الشقة</label><input type="text" value={hoaForm.unit} onChange={(e)=>setHoaForm({...hoaForm, unit: e.target.value})} placeholder="مثال: شقة 10" style={{ width: "100%", padding: 8, boxSizing:"border-box" }} /></div>
              <div style={{ marginBottom: 12 }}><label style={{ fontSize: 11 }}>الرمز السري الخاص به</label><input type="text" value={hoaForm.password_code} onChange={(e)=>setHoaForm({...hoaForm, password_code: e.target.value})} placeholder="ضع رمز دخول مخصص" style={{ width: "100%", padding: 8, boxSizing:"border-box", fontWeight:"bold" }} /></div>
              <button type="submit" style={{ width: "100%", padding: 10, background: C.green, color: "white", border: "none", borderRadius: 8, fontWeight: "bold" }}>💾 توليد وحفظ حساب الساكن</button>
            </form>
            <h4>👥 السكان المضافين تحت إشرافك ({managedAccounts.length})</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {managedAccounts.map(a => (
                <div key={a.id} style={{ background: C.light, padding: 10, borderRadius: 8, fontSize: 12 }}>
                  🚪 وحدة: {a.unit} ({a.role==='owner'?'مالك':'مقاول'}) | 🔑 الرمز: <strong>{a.password_code}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => { setIsLoggedIn(false); window.location.href = window.location.pathname; }} style={{ width: "100%", padding: 10, background: C.red, color: "#fff", border: "none", borderRadius: 10, marginTop: 20, fontWeight: "bold", fontSize: 12, cursor:"pointer" }}>🚪 تسجيل الخروج</button>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Noto Sans Arabic', sans-serif", display: "flex", flexDirection: "column", justifyContent: "center", padding: 20, boxSizing: "border-box" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700;900&display=swap" rel="stylesheet" />
      <div style={{ background: "#fff", padding: 24, borderRadius: 24, width: "100%", maxWidth: 400, margin: "0 auto", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 40 }}>🏢</span>
          <h2 style={{ margin: "10px 0 0", color: C.navy, fontWeight: 900 }}>المبنى الرقمي</h2>
          <p style={{ margin: "4px 0 0", color: C.slate, fontSize: 12 }}>بوابتك الذكية لإدارة عقارك</p>
        </div>

        {errorMsg && <div style={{ background: "#fef2f2", color: C.red, padding: 12, borderRadius: 10, marginBottom: 14, fontSize: 12, textAlign: "center", fontWeight: "bold" }}>{errorMsg}</div>}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12, color: C.slate }}>نوع العقار</label><select name="property_type" value={credentials.property_type} onChange={handleInputChange} style={{ width: "100%", padding: 10, borderRadius: 10, border: `2px solid ${C.border}` }}><option value="apartment">🏢 عمارة سكنية</option><option value="compound">🏘️ مجمع سكني</option></select></div>
          <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12, color: C.slate }}>الدور / الصفة</label><select name="role" value={credentials.role} onChange={handleInputChange} style={{ width: "100%", padding: 10, borderRadius: 10, border: `2px solid ${C.border}` }}><option value="owner">👤 مالك الوحدة</option><option value="hoa">👑 رئيس اتحاد الملاك</option><option value="contractor">🔧 مقاول</option></select></div>
          <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12 }}>رقم البرج / المبنى</label><input type="text" name="building_id" value={credentials.building_id} onChange={handleInputChange} placeholder="مثال: البرج أ" style={{ width: "100%", padding: 10, borderRadius: 10, border: `2px solid ${C.border}`, boxSizing: "border-box" }} /></div>
          <div style={{ marginBottom: 20 }}><label style={{ fontSize: 12, fontWeight: "bold" }}>الرمز السري للدخول</label><input type="password" name="password_code" value={credentials.password_code} onChange={handleInputChange} placeholder="🔑 أدخل الرمز" style={{ width: "100%", padding: 10, borderRadius: 10, border: `2px solid ${C.border}`, boxSizing: "border-box", textAlign: "center", fontWeight: "bold" }} /></div>
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", background: C.blue, color: "#fff", border: "none", borderRadius: 50, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{loading ? "جاري التحقق..." : "🚪 تسجيل الدخول"}</button>
        </form>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<TenantApp />);
