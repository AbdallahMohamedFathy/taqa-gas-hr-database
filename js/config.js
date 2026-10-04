// Configuration for Supabase & Application
window.APP_CONFIG = {
  SUPABASE_URL: "https://lobillrepxkmqsxensnl.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYmlsbHJlcHhrbXFzeGVuc25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3NjI0NjAsImV4cCI6MjEwNjMzODQ2MH0.LeaHXGniVm5dCnuJtMaq1TKDnMV7jNgF7U9d2EvKLko",
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100, 200],
  DEFAULT_PAGE_SIZE: 25,
  BATCH_SIZE: 100
};

// Exact order of all columns matching Taqa Gas Excel sheet
window.COLUMN_DEFINITIONS = [
  { key: "hiring_type", label: "Hiring Type", labelAr: "نوع التعيين", defaultVisible: true },
  { key: "id", label: "ID", labelAr: "كود الموظف", isKey: true, defaultVisible: true },
  { key: "employee_name", label: "Employee Name", labelAr: "اسم الموظف (EN)", defaultVisible: true },
  { key: "job_post", label: "Job Post", labelAr: "المسمى الوظيفي", defaultVisible: true },
  { key: "job_title", label: "Jop Title", labelAr: "الوظيفة", defaultVisible: true },
  { key: "managerial_level", label: "Mangerial Level", labelAr: "المستوى الإداري", defaultVisible: true },
  { key: "job_tree", label: "Job Tree", labelAr: "شجرة الوظائف", defaultVisible: true },
  { key: "company_sector", label: "Company (Sector)", labelAr: "القطاع (Company)", defaultVisible: true },
  { key: "company", label: "Company", labelAr: "الشركة", defaultVisible: true },
  { key: "costed_by_company", label: "Costed by (Company)", labelAr: "التكلفة على (الشركة)", defaultVisible: true },
  { key: "costed_by_sector", label: "Costed by (Sector)", labelAr: "التكلفة على (القطاع)", defaultVisible: true },
  { key: "locations", label: "Locations", labelAr: "المواقع", defaultVisible: true },
  { key: "sub_location", label: "Sub-Location", labelAr: "الموقع الفرعي", defaultVisible: true },
  { key: "division", label: "Division", labelAr: "القطاع الرئيسي", defaultVisible: true },
  { key: "department", label: "Department", labelAr: "الإدارة", defaultVisible: true },
  { key: "sub_department", label: "Sub-Department", labelAr: "القسم الفرعي", defaultVisible: true },
  { key: "qalaa_department", label: "Qalaa Department", labelAr: "إدارة القلعة", defaultVisible: true },
  { key: "qalaa_group_functions", label: "Qalaa Group Functions", labelAr: "وظائف مجموعة القلعة", defaultVisible: true },
  { key: "skilled_unskilled", label: "Skilled / Unskilled (Second Level)", labelAr: "المهارة (مستوى ثان)", defaultVisible: true },
  { key: "company_level", label: "Company Level", labelAr: "مستوى الشركة", defaultVisible: true },
  { key: "taqa_level_grade", label: "TAQA Level (Grade)", labelAr: "درجة طاقة", defaultVisible: true },
  { key: "qalaa_job_group", label: "Qalaa Job Group", labelAr: "مجموعة القلعة الوظيفية", defaultVisible: true },
  { key: "start_date", label: "Start Date", labelAr: "تاريخ التعيين", defaultVisible: true },
  { key: "yoe", label: "YOE", labelAr: "سنوات الخبرة", defaultVisible: true },
  { key: "resignation_date", label: "Resignation Date", labelAr: "تاريخ الاستقالة", defaultVisible: true },
  { key: "gender", label: "Gender", labelAr: "النوع", defaultVisible: true },
  { key: "employment_type", label: "Employment Type", labelAr: "نوع التوظيف", defaultVisible: true },
  { key: "type_of_contract", label: "Type of Contract", labelAr: "نوع العقد", defaultVisible: true },
  { key: "birth_date", label: "Birth Date", labelAr: "تاريخ الميلاد", defaultVisible: true },
  { key: "birth_month", label: "Birth Month", labelAr: "شهر الميلاد", defaultVisible: true },
  { key: "age", label: "Age", labelAr: "السن", defaultVisible: true },
  { key: "national_id", label: "National ID", labelAr: "الرقم القومي", defaultVisible: true },
  { key: "mobile_numbers", label: "Mobile Numbers", labelAr: "رقم الموبايل", defaultVisible: true },
  { key: "insurance_number", label: "Insurance Number", labelAr: "الرقم التأميني", defaultVisible: true },
  { key: "bank_name", label: "Bank Name", labelAr: "اسم البنك", defaultVisible: true },
  { key: "status", label: "Status", labelAr: "الحالة", defaultVisible: true },
  { key: "account_numbers", label: "Account Numbers", labelAr: "رقم الحساب البنكي", defaultVisible: true },
  { key: "floor", label: "Floor", labelAr: "الدور", defaultVisible: true },
  { key: "telephone_extension", label: "Telephone Extension", labelAr: "الداخلي", defaultVisible: true },
  { key: "employee_name_ar", label: "أســم الموظف بالعربية", labelAr: "الاسم بالعربي", defaultVisible: true },
  { key: "email", label: "Email", labelAr: "البريد الإلكتروني", defaultVisible: true },
  { key: "manager", label: "Manager", labelAr: "المدير المباشر", defaultVisible: true },
  { key: "manager_id", label: "Id manager", labelAr: "كود المدير (Id manager)", defaultVisible: true },

  // تقييمات الأداء السنوية (Performance Appraisal) - مخفية افتراضياً من الجدول
  { key: "pa_2016", label: "PA 2016", labelAr: "تقييم 2016", group: "pa", defaultVisible: false },
  { key: "pa_2017", label: "PA 2017", labelAr: "تقييم 2017", group: "pa", defaultVisible: false },
  { key: "pa_2018", label: "PA 2018", labelAr: "تقييم 2018", group: "pa", defaultVisible: false },
  { key: "pa_2019", label: "PA 2019", labelAr: "تقييم 2019", group: "pa", defaultVisible: false },
  { key: "pa_2020", label: "PA 2020", labelAr: "تقييم 2020", group: "pa", defaultVisible: false },
  { key: "pa_2021", label: "PA 2021", labelAr: "تقييم 2021", group: "pa", defaultVisible: false },
  { key: "pa_2022", label: "PA 2022", labelAr: "تقييم 2022", group: "pa", defaultVisible: false },
  { key: "pa_2023", label: "PA 2023", labelAr: "تقييم 2023", group: "pa", defaultVisible: false },
  { key: "pa_2024", label: "PA 2024", labelAr: "تقييم 2024", group: "pa", defaultVisible: false },
  { key: "pa_2025", label: "PA 2025", labelAr: "تقييم 2025", group: "pa", defaultVisible: false },

  // الترقيات: علامة P في سنة الترقية - مخفية افتراضياً من الجدول
  { key: "promo_2016", label: "2016", labelAr: "ترقية 2016", group: "promo", defaultVisible: false },
  { key: "promo_2017", label: "2017", labelAr: "ترقية 2017", group: "promo", defaultVisible: false },
  { key: "promo_2018", label: "2018", labelAr: "ترقية 2018", group: "promo", defaultVisible: false },
  { key: "promo_2019", label: "2019", labelAr: "ترقية 2019", group: "promo", defaultVisible: false },
  { key: "promo_2020", label: "2020", labelAr: "ترقية 2020", group: "promo", defaultVisible: false },
  { key: "promo_2021", label: "2021", labelAr: "ترقية 2021", group: "promo", defaultVisible: false },
  { key: "promo_2022", label: "2022", labelAr: "ترقية 2022", group: "promo", defaultVisible: false },
  { key: "promo_2023", label: "2023", labelAr: "ترقية 2023", group: "promo", defaultVisible: false },
  { key: "promo_2024", label: "2024", labelAr: "ترقية 2024", group: "promo", defaultVisible: false },
  { key: "promo_2025", label: "2025", labelAr: "ترقية 2025", group: "promo", defaultVisible: false },
  { key: "promo_2026", label: "2026", labelAr: "ترقية 2026", group: "promo", defaultVisible: false }
];


// =========================================================================
// توحيد الإملاء (Canonical spellings)
// نفس الشركة كانت مكتوبة بأكثر من شكل في ملف الإكسيل (MASTER GAS / Master Gas).
// المفتاح دائماً بحروف صغيرة ومسافات مضغوطة، والقيمة هي الشكل المعتمد.
// =========================================================================
const COMPANY_CANON = {
  "taqa gas": "TAQA Gas",
  "taqa": "TAQA Gas",
  "house gas": "House Gas",
  "housegas": "House Gas",
  "master gas": "Master Gas",
  "mastergas": "Master Gas",
  "trans gas": "Trans Gas",
  "transgas": "Trans Gas",
  "others": "Others"
};

const SECTOR_CANON = {
  "ldc": "LDC",
  "epc": "EPC",
  "cng": "CNG",
  "others": "Others"
};

window.VALUE_NORMALIZATION = {
  company: COMPANY_CANON,
  costed_by_company: COMPANY_CANON,
  company_sector: SECTOR_CANON,
  costed_by_sector: SECTOR_CANON,
  // نفس نوع المشكلة في أعمدة تانية (اختلاف حالة الأحرف فقط)
  division: { "hr": "Human Resources", "human resources": "Human Resources" },
  sub_department: { "conversion": "Conversion" },
  qalaa_group_functions: {
    "operational": "Operational Function",
    "operational function": "Operational Function",
    "supporting": "Support Function",
    "support function": "Support Function"
  }
};

// يوحّد إملاء القيم في السجل الواحد (يُستدعى عند الاستيراد من الإكسيل وعند الحفظ اليدوي)
window.normalizeEmployeeRecord = function(record) {
  if (!record || typeof record !== "object") return record;
  Object.keys(window.VALUE_NORMALIZATION).forEach(field => {
    const raw = record[field];
    if (raw === null || raw === undefined || String(raw).trim() === "") return;
    const lookup = String(raw).replace(/\s+/g, " ").trim().toLowerCase();
    const canonical = window.VALUE_NORMALIZATION[field][lookup];
    if (canonical) record[field] = canonical;
  });
  return record;
};
