// Excel Processing and Export Utility with Exact Original Colors & Smart Formula Evaluation
(function() {
  // Mapping rules: Normalized Excel Header -> Database field key
  const HEADER_MAP = {
    'id': 'id',
    'employee id': 'id',
    'كود الموظف': 'id',
    'الرقم الوظيفي': 'id',
    'hiring type': 'hiring_type',
    'نوع التعيين': 'hiring_type',
    'employee name': 'employee_name',
    'name': 'employee_name',
    'اسم الموظف': 'employee_name',
    'أســم الموظف بالعربية': 'employee_name_ar',
    'اسم الموظف بالعربية': 'employee_name_ar',
    'الاسم بالعربي': 'employee_name_ar',
    'job post': 'job_post',
    'المسمى الوظيفي': 'job_post',
    'jop title': 'job_title',
    'job title': 'job_title',
    'الوظيفة': 'job_title',
    'mangerial level': 'managerial_level',
    'managerial level': 'managerial_level',
    'المستوى الإداري': 'managerial_level',
    'job tree': 'job_tree',
    'شجرة الوظائف': 'job_tree',
    'company (sector)': 'company_sector',
    'company(sector)': 'company_sector',
    'sector': 'company_sector',
    'القطاع': 'company_sector',
    'company': 'company',
    'الشركة': 'company',
    'costed by (company)': 'costed_by_company',
    'costed by(company)': 'costed_by_company',
    'costed by company': 'costed_by_company',
    'costed by (sector)': 'costed_by_sector',
    'costed by(sector)': 'costed_by_sector',
    'costed by sector': 'costed_by_sector',
    'locations': 'locations',
    'location': 'locations',
    'الموقع': 'locations',
    'sub-location': 'sub_location',
    'sub location': 'sub_location',
    'الموقع الفرعي': 'sub_location',
    'division': 'division',
    'القطاع الرئيسي': 'division',
    'department': 'department',
    'الإدارة': 'department',
    'sub-department': 'sub_department',
    'sub department': 'sub_department',
    'القسم الفرعي': 'sub_department',
    'qalaa department': 'qalaa_department',
    'qalaa group functions': 'qalaa_group_functions',
    'skilled / unskilled (second level)': 'skilled_unskilled',
    'skilled / unskilled': 'skilled_unskilled',
    'company level': 'company_level',
    'taqa level (grade)': 'taqa_level_grade',
    'taqa level': 'taqa_level_grade',
    'qalaa job group': 'qalaa_job_group',
    'start date': 'start_date',
    'تاريخ التعيين': 'start_date',
    'yoe': 'yoe',
    'سنوات الخبرة': 'yoe',
    'resignation date': 'resignation_date',
    'تاريخ الاستقالة': 'resignation_date',
    'gender': 'gender',
    'النوع': 'gender',
    'employment type': 'employment_type',
    'نوع التوظيف': 'employment_type',
    'type of contract': 'type_of_contract',
    'نوع العقد': 'type_of_contract',
    'birth date': 'birth_date',
    'تاريخ الميلاد': 'birth_date',
    'birth month': 'birth_month',
    'شهر الميلاد': 'birth_month',
    'age': 'age',
    'السن': 'age',
    'national id': 'national_id',
    'الرقم القومي': 'national_id',
    'mobile numbers': 'mobile_numbers',
    'mobile': 'mobile_numbers',
    'رقم الموبايل': 'mobile_numbers',
    'insurance number': 'insurance_number',
    'الرقم التأميني': 'insurance_number',
    'bank name': 'bank_name',
    'اسم البنك': 'bank_name',
    'status': 'status',
    'الحالة': 'status',
    'account numbers': 'account_numbers',
    'account number': 'account_numbers',
    'رقم الحساب': 'account_numbers',
    'floor': 'floor',
    'الدور': 'floor',
    'telephone extension': 'telephone_extension',
    'extension': 'telephone_extension',
    'الداخلي': 'telephone_extension',
    'email': 'email',
    'البريد الإلكتروني': 'email',
    'manager': 'manager',
    'المدير المباشر': 'manager',
    'id manager': 'manager_id',
    'manager id': 'manager_id',
    'manager_id': 'manager_id',
    'كود المدير': 'manager_id',
    'كود المدير المباشر': 'manager_id',

    // تقييمات الأداء السنوية
    'pa 2016': 'pa_2016',
    'تقييم 2016': 'pa_2016',
    'pa 2017': 'pa_2017',
    'تقييم 2017': 'pa_2017',
    'pa 2018': 'pa_2018',
    'تقييم 2018': 'pa_2018',
    'pa 2019': 'pa_2019',
    'تقييم 2019': 'pa_2019',
    'pa 2020': 'pa_2020',
    'تقييم 2020': 'pa_2020',
    'pa 2021': 'pa_2021',
    'تقييم 2021': 'pa_2021',
    'pa 2022': 'pa_2022',
    'تقييم 2022': 'pa_2022',
    'pa 2023': 'pa_2023',
    'تقييم 2023': 'pa_2023',
    'pa 2024': 'pa_2024',
    'تقييم 2024': 'pa_2024',
    'pa 2025': 'pa_2025',
    'تقييم 2025': 'pa_2025',

    // الترقيات (علامة P في سنة الترقية)
    '2016': 'promo_2016',
    'ترقية 2016': 'promo_2016',
    '2017': 'promo_2017',
    'ترقية 2017': 'promo_2017',
    '2018': 'promo_2018',
    'ترقية 2018': 'promo_2018',
    '2019': 'promo_2019',
    'ترقية 2019': 'promo_2019',
    '2020': 'promo_2020',
    'ترقية 2020': 'promo_2020',
    '2021': 'promo_2021',
    'ترقية 2021': 'promo_2021',
    '2022': 'promo_2022',
    'ترقية 2022': 'promo_2022',
    '2023': 'promo_2023',
    'ترقية 2023': 'promo_2023',
    '2024': 'promo_2024',
    'ترقية 2024': 'promo_2024',
    '2025': 'promo_2025',
    'ترقية 2025': 'promo_2025',
    '2026': 'promo_2026',
    'ترقية 2026': 'promo_2026'
  };

  // Columns Configuration matching Taqa Gas exact Excel palette (Headers + Data Rows)
  const EXCEL_COLUMN_CONFIG = [
    { key: 'hiring_type', header: 'Hiring Type', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'id', header: 'ID', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF8DD', dFg: '000000', align: 'center' },
    { key: 'employee_name', header: 'Employee Name', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF6DD', dFg: '000000', align: 'left' },
    { key: 'job_post', header: 'Job Post', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF6DD', dFg: '000000', align: 'left' },
    { key: 'job_title', header: 'Jop Title', hBg: 'FF0000', hFg: 'FFFFF3C9', dBg: 'FFF6DD', dFg: '000000', align: 'left' },
    { key: 'managerial_level', header: 'Mangerial Level', hBg: 'FF0000', hFg: 'FFFFF3C9', dBg: 'FFF6DD', dFg: '000000', align: 'left' },
    { key: 'job_tree', header: 'Job Tree', hBg: 'FF0000', hFg: 'FFFFF3C9', dBg: 'FFF6DD', dFg: '000000', align: 'left' },
    { key: 'company_sector', header: 'Company\n(Sector)', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFFFEB', dFg: '000000', align: 'center' },
    { key: 'company', header: 'Company', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'A9D08E', dFg: '000000', align: 'center' },
    { key: 'costed_by_company', header: 'Costed by \n(Company)', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFFFEB', dFg: '000000', align: 'center' },
    { key: 'costed_by_sector', header: 'Costed by \n(Sector)', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFFFEB', dFg: '000000', align: 'center' },
    { key: 'locations', header: 'Locations', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFFFEB', dFg: '000000', align: 'left' },
    { key: 'sub_location', header: 'Sub-Location', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFFFEB', dFg: '000000', align: 'left' },
    { key: 'division', header: 'Division', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF6DD', dFg: '000000', align: 'left' },
    { key: 'department', header: 'Department', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF6DD', dFg: '000000', align: 'left' },
    { key: 'sub_department', header: 'Sub-Department', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF6DD', dFg: '000000', align: 'left' },
    { key: 'qalaa_department', header: 'Qalaa Department', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF6DD', dFg: '000000', align: 'left' },
    { key: 'qalaa_group_functions', header: 'Qalaa Group Functions', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF6DD', dFg: '000000', align: 'left' },
    { key: 'skilled_unskilled', header: 'Skilled / Unskilled \n(Second Level)', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF6DD', dFg: '000000', align: 'center' },
    { key: 'company_level', header: 'Company \nLevel', hBg: '002060', hFg: 'FFFFF3C9', dBg: '262626', dFg: '5B9BD5', align: 'center' },
    { key: 'taqa_level_grade', header: 'TAQA Level (Grade)', hBg: 'FF0000', hFg: 'FFFFF3C9', dBg: '262626', dFg: '5B9BD5', align: 'center' },
    { key: 'qalaa_job_group', header: 'Qalaa Job Group', hBg: '002060', hFg: 'FFFFF3C9', dBg: '262626', dFg: '5B9BD5', align: 'center' },
    { key: 'start_date', header: 'Start Date', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF9E5', dFg: '000000', align: 'center' },
    { key: 'yoe', header: 'YOE', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'A9D08E', dFg: '000000', align: 'center' },
    { key: 'resignation_date', header: 'Resignation Date', hBg: 'C00000', hFg: 'FFFFF3C9', dBg: 'C00000', dFg: 'FFFFFF', align: 'center' },
    { key: 'gender', header: 'Gender', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF6DD', dFg: '000000', align: 'center' },
    { key: 'employment_type', header: 'Employment Type', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF6DD', dFg: '000000', align: 'center' },
    { key: 'type_of_contract', header: 'Type of Contract', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF6DD', dFg: '000000', align: 'left' },
    { key: 'birth_date', header: 'Birth Date', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF9E5', dFg: '000000', align: 'center' },
    { key: 'birth_month', header: 'Birth Month', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF9E5', dFg: '000000', align: 'center' },
    { key: 'age', header: 'Age', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'A9D08E', dFg: '000000', align: 'center' },
    { key: 'national_id', header: 'National ID', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF9E5', dFg: '000000', align: 'center' },
    { key: 'mobile_numbers', header: 'Mobile Numbers', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF9E5', dFg: '000000', align: 'center' },
    { key: 'insurance_number', header: 'Insurance Number', hBg: 'FF0000', hFg: 'FFFFF3C9', dBg: 'FFF9E5', dFg: '000000', align: 'center' },
    { key: 'bank_name', header: 'Bank Name', hBg: 'FFEBEB', hFg: '6C0000', dBg: 'FFF7F7', dFg: '6C0000', align: 'center' },
    { key: 'status', header: 'Status', hBg: 'FFEBEB', hFg: '6C0000', dBg: 'FFF7F7', dFg: '6C0000', align: 'center' },
    { key: 'account_numbers', header: 'Account Numbers', hBg: 'FFEBEB', hFg: '6C0000', dBg: 'FFF7F7', dFg: '6C0000', align: 'center' },
    { key: 'floor', header: 'Floor', hBg: '285E6A', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'telephone_extension', header: 'Telephone Extension', hBg: '285E6A', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'employee_name_ar', header: 'أســم الموظف بالعربية', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'right' },
    { key: 'email', header: 'Email', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'left' },
    { key: 'manager', header: 'Manager', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'left' },
    { key: 'manager_id', header: 'Id manager', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'pa_2016', header: 'PA 2016', hBg: '7030A0', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'pa_2017', header: 'PA 2017', hBg: '7030A0', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'pa_2018', header: 'PA 2018', hBg: '7030A0', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'pa_2019', header: 'PA 2019', hBg: '7030A0', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'pa_2020', header: 'PA 2020', hBg: '7030A0', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'pa_2021', header: 'PA 2021', hBg: '7030A0', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'pa_2022', header: 'PA 2022', hBg: '7030A0', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'pa_2023', header: 'PA 2023', hBg: '7030A0', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'pa_2024', header: 'PA 2024', hBg: '7030A0', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'pa_2025', header: 'PA 2025', hBg: '7030A0', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'promo_2016', header: '2016', hBg: '00B050', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'promo_2017', header: '2017', hBg: '00B050', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'promo_2018', header: '2018', hBg: '00B050', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'promo_2019', header: '2019', hBg: '00B050', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'promo_2020', header: '2020', hBg: '00B050', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'promo_2021', header: '2021', hBg: '00B050', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'promo_2022', header: '2022', hBg: '00B050', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'promo_2023', header: '2023', hBg: '00B050', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'promo_2024', header: '2024', hBg: '00B050', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'promo_2025', header: '2025', hBg: '00B050', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'promo_2026', header: '2026', hBg: '00B050', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' }
  ];

  function cleanHeader(raw) {
    if (!raw) return '';
    return raw
      .toString()
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function parseExcelDate(val) {
    if (!val) return '';
    if (val instanceof Date) {
      const year = val.getFullYear();
      const month = String(val.getMonth() + 1).padStart(2, '0');
      const day = String(val.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    if (typeof val === 'number') {
      if (val > 10000 && val < 60000) {
        const utc_days = Math.floor(val - 25569);
        const date = new Date(utc_days * 86400 * 1000);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    const d = parseDateRobust(val);
    if (d) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return String(val).trim();
  }

  // Robust date parser supporting DD/MM/YYYY, YYYY-MM-DD, and Date objects
  function parseDateRobust(dateStr) {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;
    const s = String(dateStr).trim();
    if (s.includes('/')) {
      const parts = s.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          const dt = new Date(y, m, d);
          if (!isNaN(dt.getTime())) return dt;
        } else {
          const d = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const y = parseInt(parts[2], 10);
          const dt = new Date(y, m, d);
          if (!isNaN(dt.getTime())) return dt;
        }
      }
    }
    if (s.includes('-')) {
      const clean = s.split('T')[0].split(' ')[0];
      const parts = clean.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          const dt = new Date(y, m, d);
          if (!isNaN(dt.getTime())) return dt;
        } else if (parts[2].length === 4) {
          const d = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const y = parseInt(parts[2], 10);
          const dt = new Date(y, m, d);
          if (!isNaN(dt.getTime())) return dt;
        }
      }
    }
    const parsed = new Date(s);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  // Helper to calculate Age from Birth Date
  function calculateAge(birthDateStr) {
    const d = parseDateRobust(birthDateStr);
    if (!d) return '';
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) {
      age--;
    }
    return age > 0 ? String(age) : '';
  }

  // Helper to calculate Years of Experience (YOE) from Start Date
  function calculateYOE(startDateStr, resignationDateStr) {
    const d = parseDateRobust(startDateStr);
    if (!d) return '';
    const end = resignationDateStr ? (parseDateRobust(resignationDateStr) || new Date()) : new Date();
    const diff = end.getTime() - d.getTime();
    if (diff <= 0) return '0';
    const years = diff / (365.25 * 24 * 60 * 60 * 1000);
    return String(Math.floor(years));
  }

  // Helper to extract Birth Month
  function calculateBirthMonth(birthDateStr) {
    const d = parseDateRobust(birthDateStr);
    if (!d) return '';
    return String(d.getMonth() + 1);
  }

  window.ExcelHandler = {
    // Parse uploaded Excel file
    parseFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
            if (!rows || rows.length === 0) {
              return reject(new Error('الملف فارغ أو لا يحتوي على بيانات!'));
            }

            const rawHeaders = Object.keys(rows[0]);
            const mapping = {};
            rawHeaders.forEach(rh => {
              const clean = cleanHeader(rh);
              const dbField = HEADER_MAP[clean];
              if (dbField) {
                mapping[rh] = dbField;
              }
            });

            const parsedRecords = [];
            const errors = [];

            rows.forEach((row, idx) => {
              const record = {};
              let hasAnyData = false;

              for (const [rawKey, val] of Object.entries(row)) {
                const dbKey = mapping[rawKey];
                if (dbKey) {
                  let cleanedVal = val;
                  if (typeof cleanedVal === 'string') {
                    cleanedVal = cleanedVal.trim();
                    // Clean out Excel errors like #VALUE!, #REF!, #NAME? or raw formula strings
                    if (cleanedVal.includes('#VALUE!') || cleanedVal.includes('#REF!') || cleanedVal.startsWith('=')) {
                      cleanedVal = '';
                    }
                  }
                  
                  if (['start_date', 'resignation_date', 'birth_date'].includes(dbKey)) {
                    cleanedVal = parseExcelDate(cleanedVal);
                  }
                  
                  if (cleanedVal !== '' && cleanedVal !== null && cleanedVal !== undefined) {
                    record[dbKey] = String(cleanedVal);
                    hasAnyData = true;
                  }
                }
              }

              // SMART FORMULA EVALUATION: If YOE or Age or Month are empty or were #VALUE! in Excel:
              // Calculate YOE automatically from Start Date
              if ((!record.yoe || record.yoe === '') && record.start_date) {
                record.yoe = calculateYOE(record.start_date, record.resignation_date);
                if (record.yoe) hasAnyData = true;
              }

              // Calculate Age automatically from Birth Date
              if ((!record.age || record.age === '') && record.birth_date) {
                record.age = calculateAge(record.birth_date);
                if (record.age) hasAnyData = true;
              }

              // Calculate Birth Month automatically from Birth Date
              if ((!record.birth_month || record.birth_month === '') && record.birth_date) {
                record.birth_month = calculateBirthMonth(record.birth_date);
                if (record.birth_month) hasAnyData = true;
              }

              // توحيد إملاء أسماء الشركات والقطاعات قبل الحفظ
              if (typeof window.normalizeEmployeeRecord === 'function') {
                window.normalizeEmployeeRecord(record);
              }

              if (hasAnyData) {
                if (!record.id) {
                  errors.push(`الصف رقم ${idx + 2}: لا يحتوي على كود موظف (ID)`);
                } else {
                  parsedRecords.push(record);
                }
              }
            });

            resolve({
              records: parsedRecords,
              totalFound: rows.length,
              validCount: parsedRecords.length,
              errors: errors,
              sampleHeaders: rawHeaders
            });

          } catch (err) {
            reject(new Error('فشل قراءة ملف الإكسيل: ' + err.message));
          }
        };

        reader.onerror = () => reject(new Error('فشل فتح وقراءة الملف من المتصفح'));
        reader.readAsArrayBuffer(file);
      });
    },

    // Export to Excel with EXACT Original Colors for BOTH Headers and Data Rows
    exportToExcel(records, filename = 'Taqa_Gas_Employees.xlsx', visibleColumns = null) {
      if (!records || records.length === 0) {
        alert('لا توجد بيانات لتصديرها!');
        return;
      }

      // Filter columns based on visibleColumns if provided
      let exportColumns = EXCEL_COLUMN_CONFIG;
      if (visibleColumns) {
        const allowedSet = visibleColumns instanceof Set 
          ? visibleColumns 
          : new Set(Array.isArray(visibleColumns) ? visibleColumns : Object.keys(visibleColumns));
        
        if (allowedSet.size > 0) {
          exportColumns = EXCEL_COLUMN_CONFIG.filter(col => allowedSet.has(col.key));
        }
      }

      // Fallback if empty
      if (exportColumns.length === 0) {
        exportColumns = EXCEL_COLUMN_CONFIG;
      }

      // Build 2D array of data (Header row + data rows)
      const headers = exportColumns.map(col => col.header);
      const dataRows = [headers];

      records.forEach((emp, rIdx) => {
        const row = exportColumns.map(col => {
          let val = emp[col.key];

          // Auto-fill calculated values if empty
          if (col.key === 'yoe' && (!val || val === '') && emp.start_date) {
            val = calculateYOE(emp.start_date, emp.resignation_date);
          }
          if (col.key === 'age' && (!val || val === '') && emp.birth_date) {
            val = calculateAge(emp.birth_date);
          }
          if (col.key === 'birth_month' && (!val || val === '') && emp.birth_date) {
            val = calculateBirthMonth(emp.birth_date);
          }

          // Format dates nicely as DD/MM/YYYY in the exported sheet
          if (['start_date', 'birth_date', 'resignation_date'].includes(col.key) && val) {
            const d = parseDateRobust(val);
            if (d) {
              const day = String(d.getDate()).padStart(2, '0');
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const year = d.getFullYear();
              val = `${day}/${month}/${year}`;
            }
          }

          return val !== undefined && val !== null ? String(val) : '';
        });
        dataRows.push(row);
      });

      // Create Worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(dataRows);

      // Set Row Heights: Header is 38pt, Data rows 20pt
      worksheet['!rows'] = [
        { hpt: 38 },
        ...records.map(() => ({ hpt: 20 }))
      ];

      // Auto-compute column widths based on exported columns
      const colWidths = exportColumns.map(col => {
        let maxLen = Math.max(col.header.length, 12);
        if (col.header.includes('\n')) {
          const parts = col.header.split('\n');
          maxLen = Math.max(...parts.map(p => p.length), 12);
        }
        return { wch: Math.min(Math.max(maxLen + 4, 15), 32) };
      });
      worksheet['!cols'] = colWidths;

      // Apply cell styling to ALL cells (Headers + Data Rows)
      const range = XLSX.utils.decode_range(worksheet['!ref']);

      for (let R = range.s.r; R <= range.e.r; ++R) {
        const isHeader = (R === 0);

        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (!worksheet[cellRef]) {
            worksheet[cellRef] = { t: 's', v: '' };
          }
          const cell = worksheet[cellRef];
          const colConfig = exportColumns[C] || { hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'left' };

          if (isHeader) {
            // Header Row Styling
            cell.s = {
              fill: {
                patternType: 'solid',
                fgColor: { rgb: colConfig.hBg }
              },
              font: {
                name: 'Calibri',
                sz: 10,
                bold: true,
                color: { rgb: colConfig.hFg }
              },
              alignment: {
                horizontal: 'center',
                vertical: 'center',
                wrapText: true
              },
              border: {
                top: { style: 'thin', color: { rgb: 'FFFFFF' } },
                bottom: { style: 'medium', color: { rgb: 'FFFFFF' } },
                left: { style: 'thin', color: { rgb: 'FFFFFF' } },
                right: { style: 'thin', color: { rgb: 'FFFFFF' } }
              }
            };
          } else {
            // Data Rows Styling matching the exact company sheet color scheme!
            cell.s = {
              fill: {
                patternType: 'solid',
                fgColor: { rgb: colConfig.dBg }
              },
              font: {
                name: 'Calibri',
                sz: 9.5,
                color: { rgb: colConfig.dFg }
              },
              alignment: {
                horizontal: colConfig.align,
                vertical: 'center'
              },
              border: {
                top: { style: 'thin', color: { rgb: 'D9D9D9' } },
                bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
                left: { style: 'thin', color: { rgb: 'D9D9D9' } },
                right: { style: 'thin', color: { rgb: 'D9D9D9' } }
              }
            };
          }
        }
      }

      // Build Workbook & Trigger Download
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

      XLSX.writeFile(workbook, filename);
    }
  };
})();
