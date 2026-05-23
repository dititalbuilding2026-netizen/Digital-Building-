const { useState, useEffect } = React;

const supabaseUrl = 'https://qfdkuzlndzlydcrwboqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGt1emxuZHpseWRjcndib3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTU2OTQsImV4cCI6MjA5NTAzMTY5NH0.WYx5xRSifld6Bd45dBzuX_1gnUkeM0fhQOiH1QguWtY';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const C = {
  bg: "#0f1923", card: "#fff", navy: "#1e293b", blue: "#3b82f6",
  slate: "#64748b", border: "#e2e8f0", red: "#ef4444", green: "#10b981", indigo: "#6366f1", amber: "#f59e0b"
};

function TenantApp() {
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeMenu, setActiveMenu] = useState("home"); 

  // حقول وإعدادات لوحة إدارة رئيس اتحاد الملاك
  const [managedAccounts, setManagedAccounts] = useState([]);
  const [hoaForm, setHoaForm] = useState({ role: "owner", unit: "", password_code: "" });

  const [tickets, setTickets] = useState([]);
  const [votes, setVotes] = useState([]);
  const [votedList, setVotedList] = useState([]);
  const [ticketForm, setTicketForm] = useState({ title: "", description: "" });
  const [notif, setNotif] = useState({ show: false, msg: "", type: "success" });

  const [credentials, setCredentials] = useState({ building_id: "", unit: "", password_code: "", role: "owner" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pass = params.get('pass');
    if (pass) autoLogin(pass);
  }, []);

  const autoLogin = async (pass) => {
    try {
      const { data, error } = await supabase.from("building_accounts").select("*").eq("password_code", pass);
      if (!error && data && data.length > 0) loginSuccess(data[0]);
    } catch (err) { console.error(err); }
  };

  const loginSuccess = (user) => {
    setUserData(user);
    setIsLoggedIn(true);
    loadAppData(user);
  };

  const loadAppData = (user) => {
    // جلب البلاغات والتصويتات
    supabase.from("building_tickets").select("*").eq("building_id", user.building_id).then(res => { if(res.data) setTickets(res.data); });
    supabase.from("building_votes").select("*").eq("building_id", user.building_id).then(res => { if(res.data) setVotes(res.data); });
    
    // جلب الحسابات التابعة والمولدة بواسطة رئيس الاتحاد هذا
    supabase.from("building_accounts").select("*").eq("created_by", user.password_code).then(res => {
      if(res.data) setManagedAccounts(res.data);
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      let query = supabase.from("building_accounts").select("*")
        .eq("building_id", credentials.building_id.trim())
        .eq("password_code", credentials.password_code.trim())
        .eq("role", credentials.role);
        
      if (credentials.role === 'owner') {
        query = query.eq("unit", credentials.unit.trim());
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) { 
        loginSuccess(data[0]); 
      } else { 
        setErrorMsg("⚠️ بيانات الدخول غير مطابقة، تأكد من الرمز والدور المختار"); 
      }
    } catch (err) { 
      setErrorMsg("⚠️ حدث خطأ في الاتصال بالسيرفر"); 
    }
    setLoading(false);
  };

  // دالة إضافة حساب ساكن بواسطة رئيس الاتحاد مع فحص الحصّة المسموحة (allowed_units)
  const handleHoaCreateAccount = async (e) => {
    e.preventDefault();
    setNotif({ show: false, msg: "", type: "success" });

    const maxUnits = userData.allowed_units || 0;
    const currentUnits = managedAccounts.length;

    if (currentUnits >= maxUnits) {
      setNotif({ show: true, msg: `⚠️ عذراً! لقد استهلكت الحد الأقصى لباقة الوحدات المتاحة لك (${maxUnits} وحدة). يرجى التواصل مع إدارة النظام لزيادة السعة.`, type: "error" });
      return;
    }

    try {
      const newAcc = {
        building_id: userData.building_id,
        unit: hoaForm.unit.trim(),
        password_code: hoaForm.password_code.trim(),
        role: hoaForm.role,
        created_by: userData.password_code // ربط الحساب برئيس الاتحاد الحالي
      };

      const { error } = await supabase.from("building_accounts").insert([newAcc]);
      if (error) throw error;

      setNotif({ show: true, msg: "🎉 تم حفظ وتوليد حساب الساكن بنجاح!", type: "success" });
      setHoaForm({ role: "owner", unit: "", password_code: "" });
      
      // تحديث البيانات لايف
      supabase.from("building_accounts").select("*").eq("created_by", userData.password_code).then(res => {
        if(res.data) setManagedAccounts(res.data);
      });

    } catch (err) {
      setNotif({ show: true, msg: "❌ فشل إنشاء الحساب، تأكد من البيانات", type: "error" });
    }
  };

  const handleSendTicket = async (e) => {
    e.preventDefault();
    await supabase.from("building_tickets").insert([{ building_id: userData.building_id, unit: userData.unit, title: ticketForm.title, description: ticketForm.description }]);
    setNotif({ show: true, msg: "✅ تم إرسال بلاغ الصيانة بنجاح!", type: "success" });
    setTicketForm({ title: "", description: "" });
    supabase.from("building_tickets").select("*").eq("building_id", userData.building_id).then(res => { if(res.data) setTickets(res.data); });
  };

  const handleVoteSubmit = async (voteId, option) => {
    await supabase.from("vote_responses").insert([{ vote_id: voteId, unit: userData.unit || 'مدير', selected_option: option }]);
    setVotedList([...votedList, voteId]);
    setNotif({ show: true, msg: "🗳️ تم تسجيل تصويتك بنجاح!", type: "success" });
  };

  if (isLoggedIn && userData) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: "#f8fafc", padding: 16, fontFamily: "'Noto Sans Arabic', sans-serif", boxSizing:"border-box", maxWidth:500, margin:"0 auto" }}>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700;900&display=swap" rel="stylesheet" />
        
        <div style={{ background: userData.role==='hoa'? C.indigo : C.navy, color: "#fff", padding: 16, borderRadius: 16, textAlign: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 17 }}>المبنى الرقمي الذكي 🏢</h2>
          <p style={{ margin: 0, fontSize: 12 }}>منشأة: {userData.building_id} {userData.unit ? `| وحدة: ${userData.unit}` : ''}</p>
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", padding: "2px 10px", borderRadius: 20, fontSize: 11, marginTop: 6, fontWeight:"bold" }}>
            صلاحيتك: {userData.role === 'owner' ? '👤 مالك شقة' : userData.role === 'hoa' ? '👑 مدير اتحاد الملاك' : '🔧 مقاول الصيانة'}
          </div>
        </div>

        {/* أزرار القائمة حقت الخدمات */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          <button onClick={() => setActiveMenu("home")} style={{ flex: 1, padding: 8, borderRadius: 8, border:"none", background: activeMenu==='home'?C.blue:'#fff', color: activeMenu==='home'?'#fff':C.slate, fontWeight: "bold", fontSize: 11 }}>🏠 رئيسية</button>
          {userData.role !== 'contractor' && <button onClick={() => setActiveMenu("ticket")} style={{ flex: 1, padding: 8, borderRadius: 8, border:"none", background: activeMenu==='ticket'?C.blue:'#fff', color: activeMenu==='ticket'?'#fff':C.slate, fontWeight: "bold", fontSize: 11 }}>🛠️ صيانة</button>}
          {userData.role !== 'contractor' && <button onClick={() => setActiveMenu("vote")} style={{ flex: 1, padding: 8, borderRadius: 8, border:"none", background: activeMenu==='vote'?C.blue:'#fff', color: activeMenu==='vote'?'#fff':C.slate, fontWeight: "bold", fontSize: 11 }}>🗳️ تصويت</button>}
          {userData.role === 'hoa' && <button onClick={() => setActiveMenu("hoa_panel")} style={{ flex: 1, padding: 8, borderRadius: 8, border:"none", background: activeMenu==='hoa_panel'?C.blue:'#fff', color: activeMenu==='hoa_panel'?'#fff':C.slate, fontWeight: "bold", fontSize: 11 }}>👑 لوحة الإدارة</button>}
        </div>

        {notif.show && <div style={{ background: notif.type === 'success' ? C.green : C.red, color: "#fff", padding: 10, borderRadius: 10, fontSize: 12, textAlign: "center", marginBottom: 12, fontWeight:"bold" }}>{notif.msg}</div>}

        {activeMenu === "home" && (
          <div style={{ background: "#fff", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <h4>💰 صندوق اتحاد الملاك والمالية</h4>
            <p style={{ fontSize: 12, color: "#64748b", margin:0 }}>حالة رسوم الخدمات السنوية لعام 2026م:</p>
            <div style={{ padding: 10, background: "#f0fdf4", color: "#10b981", borderRadius: 8, textAlign: "center", fontWeight: "bold", fontSize: 12, marginTop:10 }}>✅ حساب المنشأة مستقر ونشط</div>
          </div>
        )}

        {activeMenu === "ticket" && (
          <div>
            <form onSubmit={handleSendTicket} style={{ background: "#fff", padding: 16, borderRadius: 12, marginBottom: 16, border: "1px solid #e2e8f0" }}>
              <h4>🚨 رفع بلاغ صيانة جديد</h4>
              <input type="text" value={ticketForm.title} onChange={(e) => setTicketForm({...ticketForm, title: e.target.value})} placeholder="عنوان العطل" style={{ width: "100%", padding: 8, marginBottom: 8, borderRadius:8, border:"1px solid #ddd" }} required />
              <textarea value={ticketForm.description} onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})} placeholder="تفاصيل موقع العطل..." style={{ width: "100%", padding: 8, marginBottom: 8, borderRadius:8, border:"1px solid #ddd" }} required />
              <button type="submit" style={{ width: "100%", padding: 10, background: C.red, color: "white", border: "none", borderRadius: 8, fontWeight: "bold" }}>🚀 إرسال البلاغ للشركة المعنية</button>
            </form>
          </div>
        )}

        {activeMenu === "vote" && (
          <div>
            <h4>🗳️ التصويت والقرارات الجارية للمبنى</h4>
            {votes.map(v => (
              <div key={v.id} style={{ background: "#fff", padding: 12, borderRadius: 12, marginBottom: 8, border: "1px solid #e2e8f0" }}>
                <p style={{ fontWeight: "bold", margin: "0 0 10px", fontSize: 12 }}>📢 {v.question}</p>
                {votedList.includes(v.id) ? (
                  <div style={{ color: C.green, fontSize: 11, textAlign: "center" }}>✓ تم تسجيل صوتك بنجاح شكراً لك</div>
                ) : (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => handleVoteSubmit(v.id, 'موافق')} style={{ flex: 1, padding: 6, background: C.green, color: "white", border: "none", borderRadius: 6, fontWeight: "bold" }}>👍 موافق</button>
                    <button onClick={() => handleVoteSubmit(v.id, 'غير موافق')} style={{ flex: 1, padding: 6, background: C.red, color: "white", border: "none", borderRadius: 6, fontWeight: "bold" }}>👎 معترض</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 👑 لوحة التحكم الذكية والمقيدة بعدد الوحدات (تظهر فقط لمدير اتحاد الملاك) */}
        {activeMenu === "hoa_panel" && userData.role === 'hoa' && (
          <div style={{ background: "#fff", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0" }}>
            <div style={{ background: C.light, padding: 12, borderRadius: 12, marginBottom: 14, textAlign: "center", border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, color: C.slate }}>📊 رصيد باقة الشقق والوحدات التابعة لك:</span>
              <div style={{ fontSize: 18, fontWeight: "900", color: C.navy, marginTop: 4 }}>
                {managedAccounts.length} من أصل {userData.allowed_units || 0} وحدة مضافة
              </div>
            </div>

            <form onSubmit={handleHoaCreateAccount} style={{ background: C.light, padding: 12, borderRadius: 12, marginBottom: 16 }}>
              <h4 style={{ margin: "0 0 10px 0" }}>➕ توليد حساب ساكن / مقاول تابع لمبناك</h4>
              <input type="text" value={hoaForm.unit} placeholder="رقم الشقة / الوحدة (مثال: شقة 4)" onChange={(e)=>setHoaForm({...hoaForm, unit: e.target.value})} style={{ width: "100%", padding: 8, marginBottom: 8, borderRadius:8, border:"1px solid #ddd" }} required />
              <input type="text" value={hoaForm.password_code} placeholder="الرمز السري لدخوله" onChange={(e)=>setHoaForm({...hoaForm, password_code: e.target.value})} style={{ width: "100%", padding: 8, marginBottom: 12, borderRadius:8, border:"1px solid #ddd", fontWeight:"bold" }} required />
              <select value={hoaForm.role} onChange={(e)=>setHoaForm({...hoaForm, role: e.target.value})} style={{ width: "100%", padding: 8, marginBottom: 12, borderRadius:8, border:"1px solid #ddd" }}>
                <option value="owner">👤 مالك وحدة</option>
                <option value="contractor">🔧 مقاول صيانة</option>
              </select>
              <button type="submit" style={{ width: "100%", padding: 10, background: C.green, color: "white", border: "none", borderRadius: 8, fontWeight: "bold" }}>💾 توليد وحفظ الحساب</button>
            </form>

            <h4>👥 قائمة الحسابات المضافة تحت إدارتك ({managedAccounts.length})</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {managedAccounts.map(a => (
                <div key={a.id} style={{ background: C.light, padding: 8, borderRadius: 8, fontSize: 12, border:`1px solid ${C.border}` }}>
                  🚪 وحدة: <strong>{a.unit}</strong> ({a.role==='owner'?'مالك':'مقاول'}) | 🔑 الرمز: <strong>{a.password_code}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => { setIsLoggedIn(false); window.location.href = window.location.pathname; }} style={{ width: "100%", padding: 10, background: C.navy, color: "#fff", border: "none", borderRadius: 8, marginTop: 16, fontWeight: "bold" }}>🚪 تسجيل الخروج</button>
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
          <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11 }}>رقم / اسم المبنى</label><input type="text" value={credentials.building_id} onChange={(e)=>setCredentials({...credentials, building_id: e.target.value})} placeholder="مثال: 12" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e2e8f0", boxSizing: "border-box" }} required /></div>
          {credentials.role === 'owner' && <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11 }}>رقم الشقة / الوحدة</label><input type="text" value={credentials.unit} onChange={(e)=>setCredentials({...credentials, unit: e.target.value})} placeholder="مثال: 5" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e2e8f0", boxSizing: "border-box" }} required /></div>}
          <div style={{ marginBottom: 16 }}><label style={{ fontSize: 11, fontWeight: "bold" }}>الرمز السري</label><input type="password" value={credentials.password_code} onChange={(e)=>setCredentials({...credentials, password_code: e.target.value})} placeholder="🔑 الرمز السري" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e2e8f0", boxSizing: "border-box", textAlign: "center", fontWeight: "bold" }} required /></div>
          <button type="submit" disabled={loading} style={{ width: "100%", padding: 10, background: "#3b82f6", color: "#fff", border: "none", borderRadius: 20, fontWeight: "bold", fontSize: 13, cursor: "pointer" }}>{loading ? "جاري التحقق..." : "🚪 تسجيل الدخول"}</button>
        </form>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<TenantApp />);
