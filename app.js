const supabaseUrl = 'https://qfdkuzlndzlydcrwboqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGt1emxuZHpseWRjcndib3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTU2OTQsImV4cCI6MjA5NTAzMTY5NH0.WYx5xRSifld6Bd45dBzuX_1gnUkeM0fhQOiH1QguWtY';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('submit-btn');
    const errorDiv = document.getElementById('error-msg');
    
    btn.innerText = "جاري التحقق...";
    errorDiv.innerText = "";

    const role = document.getElementById('role').value;
    const building_id = document.getElementById('building_id').value;
    const unit = document.getElementById('unit').value;
    const password_code = document.getElementById('password_code').value;

    try {
        const { data, error } = await supabase.from("building_accounts").select("*")
            .eq("building_id", building_id)
            .eq("unit", unit)
            .eq("password_code", password_code)
            .eq("role", role);

        if (error) throw error;

        if (data && data.length > 0) {
            const user = data[0];
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('main-screen').style.display = 'block';
            
            let roleText = user.role === 'owner' ? 'مالك' : user.role === 'hoa' ? 'رئيس اتحاد' : 'مقاول';
            document.getElementById('user-info').innerText = `مبنى: ${user.building_id} | وحدة: ${user.unit} | صلاحيتك: ${roleText}`;
        } else {
            errorDiv.innerText = "⚠️ البيانات غير صحيحة، تأكد من اختيار الدور والرمز السري الصحيح";
            btn.innerText = "🚪 تسجيل الدخول";
        }
    } catch (err) {
        errorDiv.innerText = "⚠️ حدث خطأ أثناء الاتصال بقاعدة البيانات";
        btn.innerText = "🚪 تسجيل الدخول";
    }
});
