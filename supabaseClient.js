// روابط ومفاتيح مشروعك الفعلي الصحيحة في Supabase
const supabaseUrl = 'https://qfdkuzlndzlydcrwboqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGt1emxuZHpseWRjcndib3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTU2OTQsImV4cCI6MjA5NTAzMTY5NH0.WYx5xRSifld6Bd45dBzuX_1gnUkeM0fhQOiH1QguWtY';

// إنشاء الاتصال
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
