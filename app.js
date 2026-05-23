const { useState, useEffect } = React;

// الربط المباشر المضمون بقاعدة البيانات
const supabaseUrl = 'https://qfdkuzlndzlydcrwboqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGt1emxuZHpseWRjcndib3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTU2OTQsImV4cCI6MjA5NTAzMTY5NH0.WYx5xRSifld6Bd45dBzuX_1gnUkeM0fhQOiH1QguWtY';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const C = {
  bg: "#0f1923", card: "#fff", navy: "#1e293b", blue: "#3b82f6",
  indigo: "#6366f1", green: "#10b981", amber: "#f59e0b", slate: "#64748b",
  border: "#e2e8f0", light: "#f8fafc", red: "#ef4444",
  typeColors: { compound: "#6366f1", apartment: "#3b82f6", villa: "#10b981", townhouse: "#f59e0b" }
};

function TenantApp() {
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  
  // خاص برئيس اتحاد الملاك لإدارة حسابات مبناه
  const [managedAccounts, setManagedAccounts] = useState([]);
  const [activeHoaTab, setActiveHoaTab] = useState("view_created"); // view_created أو create_account
  const [hoaForm, setHoaForm] = useState({ role: "owner", unit: "", password_code: "" });
  const [notif, setNotif] = useState({ show: false, msg: "", type: "success" });

  const [credentials, setCredentials] = useState({
    property_type: "apartment", role: "owner", building_id: "", unit: "", compound_id: "", password_code: ""
  });

  // قراءة الـ QR Code تلقائياً عند المسح
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const role = params.get('role');
    const pass = params.get('pass');
    
    if (type && role && pass) {
      setCredentials(prev => ({ ...prev, property_type: type, role: role, password_code: pass }));
      autoLogin(type, role, pass);
    }
  }, []);

  const autoLogin = async (type, role, pass) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("building_accounts").select("*").eq("property_type", type).eq("role", role).eq("password_code", pass);
      if (error) throw error;
      if (data && data.length > 0) {
        setUserData(data[0]);
        setIsLoggedIn(true);
        if (role === "hoa") fetchManagedAccounts(pass);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagedAccounts = async (managerPass) => {
    try {
      const { data, error } = await supabase.from("building_accounts").select("*").eq("created_by", managerPass).order("created_at", { ascending: false });
      if (!error && data) setManagedAccounts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });
  const handleHoaInputChange = (e) => setHoaForm({ ...hoaForm, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      let query = supabase.from("building_accounts").select("*").eq("property_type", credentials.property_type).eq("role", credentials.role).eq("password_code", credentials.password_code);
      if (credentials.property_type === "apartment") {
        if (credentials.building_id) query = query.eq("building_id", credentials.building_id);
        if (credentials.unit) query = query.eq("unit", credentials.unit);
      } else {
        if (credentials.compound_id) query = query.eq("compound_id", credentials.compound_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        setUserData(data[0]);
        setIsLoggedIn(true);
        if (credentials.role === "hoa") fetchManagedAccounts(credentials.password_code);
      } else {
        setErrorMsg("⚠️ البيانات غير صحيحة، تأكد من الرمز ورقم الوحدة");
      }
    } catch (err) {
      setErrorMsg("⚠️ حدث خطأ في الاتصال بقاعدة البيانات");
    } finally {
      setLoading(false);
    }
  };

  // دالة تتيح لرئيس اتحاد الملاك إضافة حسابات تابعة له لمبناه
  const handleHoaCreateAccount = async (e) => {
    e.preventDefault();
    if (!hoaForm.password_code || (!hoaForm.unit && userData.property_type === "apartment")) {
      setNotif({ show: true, msg: "يرجى تعبئة الحقول المطلوبة والرمز السري", type: "error" });
      return;
    }

    const newAccount = {
      property_type: userData.property_type,
      role: hoaForm.role,
      building_id: userData.building_id || "",
      compound_id: userData.compound_id || "",
      unit: hoaForm.unit,
      password_code: hoaForm.password_code,
      created_by: userData.password_code // ربط الحساب برئيس الاتحاد الحالي
    };

    try {
      const { error } = await supabase.from("building_accounts").insert([newAccount]);
      if (error) throw error;
      setNotif({ show: true, msg: "تم إنشاء حساب الساكن بنجاح!", type: "success" });
      setHoaForm({ role: "owner", unit: "", password_code: "" });
      setActiveHoaTab("view_created");
      fetchManagedAccounts(userData.password_code);
    } catch (err) {
      setNotif({ show: true, msg: "فشل إضافة الحساب", type: "error" });
    }
  };

  if (isLoggedIn && userData) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Noto Sans Arabic', sans-serif", padding: 16 }}>
        <div style={{ background: C.navy, color: "#fff", padding: 20, borderRadius: 16, textAlign: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>مرحباً بك في مبناك الرقمي 🏢</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>
            {userData.property_type === "apartment" ? `مبنى: ${userData.building_id || '-'} | وحدة: ${userData.unit || '-'}` : `مجمع: ${userData.compound_id || '-'}`}
          </p>
          <div style={{ display: "inline-block", background: C.blue, padding: "2px 10px", borderRadius: 20, fontSize: 11, marginTop: 8, fontWeight: "bold" }}>
            صلاحيتك: {userData.role === "hoa" ? "👑 رئيس اتحاد الملاك" : userData.role === "owner" ? "👤 مالك" : "🔧 مقاول"}
          </div>
        </div>

        {/* إذا كان المستخدم رئيس اتحاد ملاك، تفتح له لوحة الإدارة المستقلة حقت مبناه */}
        {userData.role === "hoa" ? (
          <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 10px rgba(0,0,0,0.03)", padding: 14, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, color: C.navy, fontWeight: "bold", borderBottom: `2px solid ${C.light}`, paddingBottom: 6 }}>💼 لوحة إدارة اتحاد الملاك للمبنى</h3>
            
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button onClick={() => setActiveHoaTab("view_created")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: activeHoaTab === "view_created" ? C.blue : C.light, color: activeHoaTab === "view_created" ? "#fff" : C.slate, fontWeight: "bold", fontSize: 12 }}>👥 السكان المضافين ({managedAccounts.length})</button>
              <button onClick={() => setActiveHoaTab("create_account")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: activeHoaTab === "create_account" ? C.blue : C.light, color: activeHoaTab === "create_account" ? "#fff" : C.slate, fontWeight: "bold", fontSize: 12 }}>➕ إضافة ساكن/مقاول</button>
            </div>

            {notif.show && <div style={{ background: notif.type === "success" ? C.green : C.red, color: "#fff", padding: 8, borderRadius: 8, fontSize: 12, textAlign: "center", marginBottom: 10, fontWeight: "bold" }}>{notif.msg}</div>}

            {activeHoaTab === "create_account" && (
              <form onSubmit={handleHoaCreateAccount} style={{ background: C.light, padding: 12, borderRadius: 12 }}>
                <div style={{ marginBottom: 8 }}><label style={{ fontSize: 11, color: C.slate }}>صلاحية الساكن</label><select name="role" value={hoaForm.role} onChange={handleHoaInputChange} style={{ width: "100%", padding: 8, borderRadius: 8, border: `1px solid ${C.border}` }}><option value="owner">👤 مالك وحدة</option><option value="contractor">🔧 مقاول صيانة</option></select></div>
                <div style={{ marginBottom: 8 }}><label style={{ fontSize: 11, color: C.slate }}>رقم الشقة / الوحدة</label><input type="text" name="unit" value={hoaForm.unit} onChange={handleHoaInputChange} placeholder="مثال: شقة 4" style={{ width: "100%", padding: 8, borderRadius: 8, border: `1px solid ${C.border}`, boxSizing: "border-box" }} /></div>
                <div style={{ marginBottom: 12 }}><label style={{ fontSize: 11, color: C.slate }}>الرمز السري للدخول للساكن</label><input type="text" name="password_code" value={hoaForm.password_code} onChange={handleHoaInputChange} placeholder="ضع رمز دخول خاص به" style={{ width: "100%", padding: 8, borderRadius: 8, border: `1px solid ${C.border}`, boxSizing: "border-box", fontWeight: "bold" }} /></div>
                <button type="submit" style={{ width: "100%", padding: "10px", background: C.green, color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 12 }}>💾 توليد وحفظ حساب الساكن</button>
              </form>
            )}

            {activeHoaTab === "view_created" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {managedAccounts.map(acc => (
                  <div key={acc.id} style={{ padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: C.light }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: "bold" }}>
                      <span style={{ color: C.blue }}>🚪 وحدة: {acc.unit || '-'}</span>
                      <span style={{ color: C.slate }}>{acc.role === "owner" ? "مالك" : "مقاول"}</span>
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4, color: C.navy }}>🔑 الرمز السري للدخول: <strong>{acc.password_code}</strong></div>
                  </div>
                ))}
                {managedAccounts.length === 0 && <div style={{ fontSize: 12, color: C.slate, textAlign: "center", padding: 10 }}>لا يوجد ملاك مضافين تحت إدارتك بعد.</div>}
              </div>
            )}
          </div>
        ) : null}

        {/* الواجهة الخدمية العادية للساكن أو المقاول (وحساب رئيس الاتحاد كساكن) */}
        <div style={{ background: "#fff", padding: 20, borderRadius: 16, boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
          <h3 style={{ marginTop: 0, color: C.navy, fontSize: 15 }}>🏠 الخدمات والميزات العامة لمسكنك</h3>
          <p style={{ color: C.slate, fontSize: 13 }}>هذه واجهتك الشخصية لمتابعة شؤون مسكنك، وسيتم ربط ميزات التصويت والبلاغات هنا قريباً.</p>
          <div style={{ background: "#eff6ff", padding: 12, borderRadius: 10, color: C.blue, fontWeight: "bold", textAlign: "center", fontSize: 12 }}>
            🎉 النظام متصل ومستقر 100%
          </div>
          <button onClick={() => { setIsLoggedIn(false); window.location.href = window.location.pathname; }} style={{ width: "100%", padding: 10, background: C.red, color: "#fff", border: "none", borderRadius: 10, marginTop: 20, fontWeight: "bold", fontSize: 13 }}>تسجيل الخروج</button>
        </div>
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
          <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12, color: C.slate }}>نوع العقار</label><select name="property_type" value={credentials.property_type} onChange={handleInputChange} style={{ width: "100%", padding: 10, borderRadius: 10, border: `2px solid ${C.border}` }}><option value="apartment">🏢 عمارة سكنية</option><option value="compound">🏘️ مجمع سكني</option><option value="villa">🏡 فيلا مستقلة</option><option value="townhouse">🏠 تاون هاوس</option></select></div>
          <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12, color: C.slate }}>الدور / الصفة</label><select name="role" value={credentials.role} onChange={handleInputChange} style={{ width: "100%", padding: 10, borderRadius: 10, border: `2px solid ${C.border}` }}><option value="owner">👤 مالك الوحدة</option><option value="hoa">👑 رئيس اتحاد الملاك</option><option value="contractor">🔧 مقاول</option></select></div>

          {credentials.property_type === "apartment" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div><label style={{ fontSize: 12 }}>المبنى</label><input type="text" name="building_id" value={credentials.building_id} onChange={handleInputChange} placeholder="مثال: أ" style={{ width: "100%", padding: 10, borderRadius: 10, border: `2px solid ${C.border}`, boxSizing: "border-box" }} /></div>
              <div><label style={{ fontSize: 12 }}>الوحدة</label><input type="text" name="unit" value={credentials.unit} onChange={handleInputChange} placeholder="مثال: 5" style={{ width: "100%", padding: 10, borderRadius: 10, border: `2px solid ${C.border}`, boxSizing: "border-box" }} /></div>
            </div>
          ) : (
            <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12 }}>اسم المجمع</label><input type="text" name="compound_id" value={credentials.compound_id} onChange={handleInputChange} style={{ width: "100%", padding: 10, borderRadius: 10, border: `2px solid ${C.border}`, boxSizing: "border-box" }} /></div>
          )}

          <div style={{ marginBottom: 20 }}><label style={{ fontSize: 12, fontWeight: "bold" }}>الرمز السري للدخول</label><input type="password" name="password_code" value={credentials.password_code} onChange={handleInputChange} placeholder="🔑 أدخل الرمز" style={{ width: "100%", padding: 10, borderRadius: 10, border: `2px solid ${C.border}`, boxSizing: "border-box", textAlign: "center", fontWeight: "bold" }} /></div>

          <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", background: C.blue, color: "#fff", border: "none", borderRadius: 50, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            {loading ? "جاري التحقق..." : "🚪 تسجيل الدخول"}
          </button>
        </form>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<TenantApp />);
