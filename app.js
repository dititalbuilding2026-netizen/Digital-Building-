const { useState, useEffect } = React;

// الربط المباشر لنسخة العميل والمستأجر
const supabaseUrl = 'https://qfdkuzlndzlydcrwboqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGt1emxuZHpseWRjcndib3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTU2OTQsImV4cCI6MjA5NTAzMTY5NH0.WYx5xRSifld6Bd45dBzuX_1gnUkeM0fhQOiH1QguWtY';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

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
  
  const [credentials, setCredentials] = useState({
    property_type: "apartment",
    role: "owner",
    building_id: "",
    unit: "",
    compound_id: "",
    password_code: ""
  });

  // ميزة ذكية: قراءة البيانات تلقائياً لو الساكن مسح الـ QR Code 📱
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const role = params.get('role');
    const pass = params.get('pass');
    
    if (type && role && pass) {
      setCredentials(prev => ({
        ...prev,
        property_type: type,
        role: role,
        password_code: pass
      }));
      // محاولة تسجيل دخول تلقائي
      autoLogin(type, role, pass);
    }
  }, []);

  const autoLogin = async (type, role, pass) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("building_accounts")
        .select("*")
        .eq("property_type", type)
        .eq("role", role)
        .eq("password_code", pass);

      if (error) throw error;

      if (data && data.length > 0) {
        setUserData(data[0]);
        setIsLoggedIn(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      let query = supabase
        .from("building_accounts")
        .select("*")
        .eq("property_type", credentials.property_type)
        .eq("role", credentials.role)
        .eq("password_code", credentials.password_code);

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
      } else {
        setErrorMsg("⚠️ البيانات غير صحيحة، تأكد من الرمز السري ورقم الوحدة");
      }
    } catch (err) {
      setErrorMsg("⚠️ حدث خطأ في الاتصال بقاعدة البيانات");
    } finally {
      setLoading(false);
    }
  };

  if (isLoggedIn && userData) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Noto Sans Arabic', sans-serif", padding: 20 }}>
        <div style={{ background: C.navy, color: "#fff", padding: 20, borderRadius: 16, textAlign: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>مرحباً بك في مبناك الرقمي 🏢</h2>
          <p style={{ margin: "5px 0 0", fontSize: 13, color: "#94a3b8" }}>
            {userData.property_type === "apartment" ? `مبنى: ${userData.building_id || '-'} | وحدة: ${userData.unit || '-'}` : `مجمع: ${userData.compound_id || '-'}`}
          </p>
        </div>

        <div style={{ background: "#fff", padding: 20, borderRadius: 16, boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
          <h3 style={{ marginTop: 0, color: C.navy }}>لوحة الساكن ترحب بك 👋</h3>
          <p style={{ color: C.slate, fontSize: 14 }}>حسابك نشط الآن بصلاحية: <strong>{userData.role === "owner" ? "مالك" : userData.role === "hoa" ? "اتحاد ملاك" : "مقاول"}</strong></p>
          <hr style={{ border: `1px solid ${C.border}`, margin: "16px 0" }} />
          <div style={{ background: "#eff6ff", padding: 12, borderRadius: 10, color: C.blue, fontWeight: "bold", textAlign: "center", fontSize: 13 }}>
            🎉 تم الربط بنجاح! هذه واجهتك الخاصة وسيتم إضافة ميزات الخدمات قريباً.
          </div>
          <button onClick={() => { setIsLoggedIn(false); window.location.href = window.location.pathname; }} style={{ width: "100%", padding: 12, background: C.red, color: "#fff", border: "none", borderRadius: 10, marginTop: 20, fontWeight: "bold" }}>تسجيل الخروج</button>
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
