const supabaseUrl = 'https://qfdkuzlndzlydcrwboqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGt1emxuZHpseWRjcndib3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTU2OTQsImV4cCI6MjA5NTAzMTY5NH0.WYx5xRSifld6Bd45dBzuX_1gnUkeM0fhQOiH1QguWtY';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const roleSelect = document.getElementById('role');
const propertyTypeBlock = document.getElementById('property-type-block');
const propertyTypeSelect = document.getElementById('property_type');
const buildingLabel = document.getElementById('building-label');
const buildingInput = document.getElementById('building_id');
const unitBlock = document.getElementById('unit-block');
const unitInput = document.getElementById('unit');

// دالة لتحديث واجهة الدخول بناءً على الدور المختار
function updateFormFields() {
    const role = roleSelect.value;
    
    if (role === 'owner') {
        // المالك: يظهر له نوع السكن، اسم المبنى، ورقم الوحدة
        propertyTypeBlock.classList.remove('hidden');
        unitBlock.classList.remove('hidden');
        unitInput.setAttribute('required', 'true');
        updateBuildingLabel();
    } else {
        // مدير الاتحاد والمقاول: يختفي نوع السكن ورقم الوحدة
        propertyTypeBlock.classList.add('hidden');
        unitBlock.classList.add('hidden');
        unitInput.removeAttribute('required');
        
        if (role === 'hoa') {
            buildingLabel.innerText = "اسم / رقم مبنى اتحاد الملاك المعين";
            buildingInput.placeholder = "أدخل اسم أو رقم المبنى المسؤول عنه";
        } else if (role === 'contractor') {
            buildingLabel.innerText = "اسم / رقم المبنى المتعاقد معه";
            buildingInput.placeholder = "أدخل اسم أو رقم المبنى للصيانة";
        }
    }
}

function updateBuildingLabel() {
    if (propertyTypeSelect.value === 'building') {
        buildingLabel.innerText = "اسم / رقم العمارة";
        buildingInput.placeholder = "مثال: عمارة 12";
    } else {
        buildingLabel.innerText = "اسم الكمباوند / المجمع";
        buildingInput.placeholder = "مثال: كمباوند النخيل";
    }
}

// الاستماع للتغييرات في الاختيارات
roleSelect.addEventListener('change', updateFormFields);
propertyTypeSelect.addEventListener('change', updateBuildingLabel);

// تشغيل الفرز لأول مرة عند فتح الصفحة
updateFormFields();

// معالجة تسجيل الدخول والتحقق من سوبابيس
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('submit-btn');
    const errorDiv = document.getElementById('error-msg');
    
    btn.innerText = "جاري التحقق والدخول...";
    errorDiv.classList.add('hidden');
    errorDiv.innerText = "";

    const role = roleSelect.value;
    const building_id = buildingInput.value;
    const password_code = document.getElementById('password_code').value;
    const unit = unitInput.value;

    try {
        // بناء الاستعلام الذكي بناءً على الصلاحية
        let query = supabase.from("building_accounts").select("*")
            .eq("building_id", building_id)
            .eq("password_code", password_code)
            .eq("role", role);

        // إذا كان مالك، نشترط مطابقة رقم الوحدة أيضاً
        if (role === 'owner') {
            query = query.eq("unit", unit);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data && data.length > 0) {
            const user = data[0];
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('main-screen').style.display = 'block';
            
            let roleText = user.role === 'owner' ? '👤 مالك الوحدة' : user.role === 'hoa' ? '👑 مدير اتحاد الملاك' : '🔧 مقاول الصيانة';
            
            if (user.role === 'owner') {
                document.getElementById('user-info').innerText = `العقار: ${user.building_id} | وحدة: ${user.unit} \n صلاحيتك: ${roleText}`;
                document.getElementById('financial-status').style.display = 'block';
            } else {
                // إخفاء حالة السداد للمقاول والمدير لأنهم يديرون المنشأة كاملة
                document.getElementById('user-info').innerText = `المنشأة المستهدفة: ${user.building_id} \n صلاحيتك: ${roleText}`;
                document.getElementById('financial-status').style.display = 'none';
            }
        } else {
            errorDiv.innerText = "⚠️ البيانات غير مطابقة! تأكد من الرمز السري أو اسم المبنى الصحيح المسجل في النظام.";
            errorDiv.classList.remove('hidden');
            btn.innerText = "🚪 تسجيل الدخول";
        }
    } catch (err) {
        errorDiv.innerText = "⚠️ حدث خطأ أثناء الاتصال بالنظام الخارجي.";
        errorDiv.classList.remove('hidden');
        btn.innerText = "🚪 تسجيل الدخول";
    }
});
