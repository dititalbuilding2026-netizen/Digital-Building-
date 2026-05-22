const { useState } = React;

const T = {
  ar: {
    app: "المبنى الرقمي", tagline: "منصة إدارة العقارات الذكية",
    step1: { title: "نوع العقار", subtitle: "اختر نوع العقار الخاص بك" },
    step2: { title: "طريقة الدخول", subtitle: "امسح رمز QR أو أدخل بياناتك يدوياً" },
    step3: { title: "بيانات الدخول", subtitle: "أدخل تفاصيل وحدتك" },
    types: {
      apartment: { label: "عمارة سكنية", desc: "شقق في عمارة واحدة", icon: "🏢" },
      compound: { label: "مجمع سكني", desc: "أبراج أو وحدات في مجمع", icon: "🏘️" },
      villa: { label: "فيلا", desc: "فيلا مستقلة في حي سكني", icon: "🏡" },
      townhouse: { label: "تاون هاوس", desc: "وحدة في تاون هاوس", icon: "🏠" },
    },
    roles: { owner: { label: "مالك الوحدة", icon: "👤" }, hoa: { label: "رئيس اتحاد الملاك", icon: "👑" }, contractor: { label: "مقاول / خدمات", icon: "🔧" } },
    fields: { compound_id: "رقم / اسم المجمع", building_id: "رقم البرج / المبنى", unit: "رقم الوحدة / الشقة", villa_id: "رقم الفيلا", townhouse_id: "رقم التاون هاوس", password: "الرمز السري", username: "اسم المستخدم" },
    qr: { scan: "امسح رمز QR للمبنى", hint: "وجّه الكاميرا نحو رمز QR الموجود عند مدخل المبنى", or: "أو أدخل يدوياً" },
    enter: "تسجيل الدخول", back: "رجوع", next: "التالي", forgot: "نسيت الرمز؟", 
    errorEmpty: "يرجى إدخال جميع البيانات", errorWrong: "بيانات الدخول غير صحيحة", welcome: "أهلاً بك في",
  }
};

const FIELDS = {
  compound: { owner: ["compound_id", "building_id", "unit", "password"], hoa: ["compound_id", "username", "password"], contractor: ["compound_id", "username", "password"] },
  apartment: { owner: ["building_id", "unit", "password"], hoa: ["building_id", "username", "password"], contractor: ["building_id", "username", "password"] },
  villa: { owner: ["compound_id", "villa_id", "password"], hoa: ["compound_id", "username", "password"], contractor: ["compound_id", "username", "password"] },
  townhouse: { owner: ["compound_id", "townhouse_id", "password"], hoa: ["compound_id", "username", "password"], contractor: ["compound_id", "username", "password"] },
};

const C = {
  bg: "#f0f4f8", card: "#fff", navy: "#1e293b", blue: "#3b82f6", green: "#10b981", amber: "#f59e0b", slate: "#64748b", border: "#e2e8f0", light: "#f8fafc",
  roleColors: { owner: "#3b82f6", hoa: "#7c3aed", contractor: "#10b981" },
  typeColors: { compound: "#6366f1", apartment: "#3b82f6", villa: "#10b981", townhouse: "#f59e0b" },
};

function LoginFlow() {
  const [step, setStep] = useState(1);
  const [propType, setPropType] = useState(null);
  const [role, setRole] = useState(null);
  const [useQR, setUseQR] = useState(false);
  const [form, setForm] = useState({});
  const [errorMsg, setErrorMsg] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const t = T.ar;
  const font = "'Noto Sans Arabic', sans-serif";
  const typeColor = C.typeColors[propType] || C.blue;
  const roleColor = C.roleColors[role] || C.blue;
  const requiredFields = propType && role ? FIELDS[propType][role] : [];

  const handleLogin = async () => {
    // التحقق من تعبئة الحقول
    const filled = requiredFields.filter(f => f !== "password").every(f => form[f]);
    if (!form.password || !filled) {
      setErrorMsg(t.errorEmpty);
      setTimeout(() => setErrorMsg(""), 2500);
      return;
    }

    setLoading(true);

    try {
      // الاتصال بقاعدة بيانات Supabase للتحقق من البيانات
      let query = supabase.from('building_accounts')
        .select('*')
        .eq('property_type', propType)
        .eq('role', role)
        .eq('password_code', form.password);

      if (form.compound_id) query = query.eq('compound_id', form.compound_id);
      if (form.building_id) query = query.eq('building_id', form.building_id);
      if (form.unit) query = query.eq('unit', form.unit);
      if (form.villa_id) query = query.eq('villa_id', form.villa_id);
      if (form.townhouse_id) query = query.eq('townhouse_id', form.townhouse_id);
      if (form.username) query = query.eq('username', form.username);

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        setErrorMsg(t.errorWrong);
        setTimeout(() => setErrorMsg(""), 3000);
      } else {
        setLoggedIn(true);
      }
    } catch (err) {
      setErrorMsg("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  const btn = (bg, color, extra = {}) => ({ background: bg, color, border: "none", borderRadius: 12, cursor: "pointer", fontFamily: font, fontWeight: 700, fontSize: 14, ...extra });
  const BackBtn = ({ to }) => <button onClick={() => setStep(to)} style={{ ...btn("none", C.slate), padding: "8px 0", fontSize: 13, display: "flex", gap: 4, marginBottom: 20 }}>→ {t.back}</button>;

  if (loggedIn) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${typeColor}22, ${roleColor}15)`, fontFamily: font, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700;900&display=swap" rel="stylesheet" />
        <div style={{ background: C.card, borderRadius: 24, padding: 40, maxWidth: 400, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,.1)" }}>
          <div style={{ width: 80, height: 80, background: `linear-gradient(135deg,${typeColor},${roleColor})`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 20px", color:"white" }}>✓</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: C.navy }}>{t.welcome}</h2>
          <div style={{ fontSize: 26, fontWeight: 900, color: typeColor, margin: "0 0 16px" }}>{t.types[propType]?.icon} {t.types[propType]?.label}</div>
          <button onClick={() => window.location.reload()} style={{ ...btn(`linear-gradient(135deg,${typeColor},${roleColor})`, "#fff"), padding: "14px 32px", fontSize: 15, borderRadius: 50 }}>← خروج</button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f1923 0%,#1a2940 55%,#0d2137 100%)", fontFamily: font, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700;900&display=swap" rel="stylesheet" />
      <div style={{ background: C.card, borderRadius: 24, padding: "36px 32px", width: "100%", maxWidth: 480 }}>
        
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>🏢</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.navy }}>{t.app}</div>
          <div style={{ fontSize: 12, color: C.slate }}>{t.tagline}</div>
        </div>

        {step === 1 && (
          <div>
            <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: C.navy }}>{t.step1.title}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {Object.entries(t.types).map(([key, val]) => (
                <button key={key} onClick={() => setPropType(key)} style={{ background: propType === key ? `${C.typeColors[key]}15` : C.light, border: `2px solid ${propType === key ? C.typeColors[key] : C.border}`, borderRadius: 14, padding: "14px 12px", cursor: "pointer", textAlign: "right" }}>
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{val.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{val.label}</div>
                </button>
              ))}
            </div>
            {propType && (
              <div style={{ display: "flex", gap: 8 }}>
                {Object.entries(t.roles).map(([key, val]) => (
                  <button key={key} onClick={() => setRole(key)} style={{ flex: 1, background: role === key ? `${C.roleColors[key]}15` : C.light, border: `2px solid ${role === key ? C.roleColors[key] : C.border}`, borderRadius: 12, padding: "12px 8px", cursor: "pointer", textAlign: "center" }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{val.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{val.label}</div>
                  </button>
                ))}
              </div>
            )}
            {propType && role && <button onClick={() => setStep(2)} style={{ ...btn(`linear-gradient(135deg,${typeColor},${typeColor}bb)`, "#fff"), width: "100%", padding: "14px 0", marginTop: 20, borderRadius: 50 }}>{t.next} →</button>}
          </div>
        )}

        {step === 2 && (
          <div>
            <BackBtn to={1} />
            <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: C.navy }}>{t.step2.title}</h3>
            <button onClick={() => setUseQR(true)} style={{ width: "100%", background: useQR ? `${typeColor}12` : C.light, border: `2px solid ${useQR ? typeColor : C.border}`, borderRadius: 16, padding: "20px", cursor: "pointer", marginBottom: 12, textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: useQR ? typeColor : C.navy }}>📸 {t.qr.scan}</div>
            </button>
            <div style={{ textAlign: "center", color: C.slate, fontSize: 12, margin: "14px 0" }}>{t.qr.or}</div>
            <button onClick={() => { setUseQR(false); setStep(3); }} style={{ width: "100%", background: C.light, border: `2px solid ${C.border}`, borderRadius: 16, padding: "16px 20px", cursor: "pointer", textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>⌨️ إدخال يدوي</div>
            </button>
            {useQR && <button onClick={() => setStep(3)} style={{ ...btn(`linear-gradient(135deg,${typeColor},${typeColor}bb)`, "#fff"), width: "100%", padding: "14px 0", marginTop: 16, borderRadius: 50 }}>تأكيد المتابعة →</button>}
          </div>
        )}

        {step === 3 && (
          <div>
            <BackBtn to={2} />
            <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: C.navy }}>{t.step3.title}</h3>
            {requiredFields.map(field => (
              <div key={field} style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.slate, marginBottom: 5 }}>{t.fields[field]}</label>
                <input type={field === "password" ? "password" : "text"} placeholder={t.fields[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} style={{ width: "100%", padding: "12px", border: `2px solid ${C.border}`, borderRadius: 12, boxSizing: "border-box", fontFamily: font, outline: "none" }} />
              </div>
            ))}
            {errorMsg && <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px", borderRadius: 10, fontSize: 13, marginBottom: 14, textAlign: "center" }}>⚠️ {errorMsg}</div>}
            <button onClick={handleLogin} disabled={loading} style={{ ...btn(`linear-gradient(135deg,${typeColor},${roleColor})`, "#fff"), width: "100%", padding: "15px 0", borderRadius: 50 }}>
              {loading ? "جاري التحقق..." : t.enter}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// تشغيل التطبيق في المتصفح
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<LoginFlow />);
