// Excel Processing and Export Utility using SheetJS
(function() {
  // Mapping rules: Normalized Excel Header -> Database field key
  const HEADER_MAP = {
    // ID
    'id': 'id',
    'employee id': 'id',
    'كود الموظف': 'id',
    'الرقم الوظيفي': 'id',

    // Serial
    's.': 'serial_no',
    's': 'serial_no',
    'serial': 'serial_no',
    'مسلسل': 'serial_no',
    'م': 'serial_no',

    // ASD
    'asd': 'asd',

    // Hiring Type
    'hiring type': 'hiring_type',
    'نوع التعيين': 'hiring_type',

    // Names
    'employee name': 'employee_name',
    'name': 'employee_name',
    'اسم الموظف': 'employee_name',
    'أســم الموظف بالعربية': 'employee_name_ar',
    'اسم الموظف بالعربية': 'employee_name_ar',
    'الاسم بالعربي': 'employee_name_ar',

    // Job Details
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

    // Company & Costs
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

    // Location
    'locations': 'locations',
    'location': 'locations',
    'الموقع': 'locations',
    'sub-location': 'sub_location',
    'sub location': 'sub_location',
    'الموقع الفرعي': 'sub_location',

    // Department & Division
    'division': 'division',
    'القطاع العام': 'division',
    'department': 'department',
    'الإدارة': 'department',
    'sub-department': 'sub_department',
    'sub department': 'sub_department',
    'القسم الفرعي': 'sub_department',
    'qalaa department': 'qalaa_department',
    'qalaa group functions': 'qalaa_group_functions',

    // Levels & Grades
    'skilled / unskilled (second level)': 'skilled_unskilled',
    'skilled / unskilled': 'skilled_unskilled',
    'company level': 'company_level',
    'taqa level (grade)': 'taqa_level_grade',
    'taqa level': 'taqa_level_grade',
    'qalaa job group': 'qalaa_job_group',

    // Dates & Status
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
    'المدير المباشر': 'manager'
  };

  // Helper to normalize header string
  function cleanHeader(raw) {
    if (!raw) return '';
    return raw
      .toString()
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  // Helper to convert excel date serial numbers to readable YYYY-MM-DD
  function parseExcelDate(val) {
    if (!val) return '';
    if (val instanceof Date) {
      return val.toISOString().split('T')[0];
    }
    if (typeof val === 'number') {
      // Excel serial date starting 1899-12-30
      if (val > 10000 && val < 60000) {
        const utc_days = Math.floor(val - 25569);
        const date = new Date(utc_days * 86400 * 1000);
        return date.toISOString().split('T')[0];
      }
    }
    const str = String(val).trim();
    if (str.includes(' 00:00:00')) {
      return str.replace(' 00:00:00', '');
    }
    return str;
  }

  window.ExcelHandler = {
    // Parse an uploaded File object
    parseFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            
            // Read first worksheet
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Get raw rows
            const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
            if (!rows || rows.length === 0) {
              return reject(new Error('الملف فارغ أو لا يحتوي على بيانات!'));
            }

            // Detect headers and build normalized mapping
            const rawHeaders = Object.keys(rows[0]);
            const mapping = {};
            rawHeaders.forEach(rh => {
              const clean = cleanHeader(rh);
              const dbField = HEADER_MAP[clean];
              if (dbField) {
                mapping[rh] = dbField;
              }
            });

            // Convert rows into DB formatted objects
            const parsedRecords = [];
            const errors = [];

            rows.forEach((row, idx) => {
              const record = {};
              let hasAnyData = false;

              for (const [rawKey, val] of Object.entries(row)) {
                const dbKey = mapping[rawKey];
                if (dbKey) {
                  let cleanedVal = val;
                  if (typeof cleanedVal === 'string') cleanedVal = cleanedVal.trim();
                  
                  // Date fields
                  if (['start_date', 'resignation_date', 'birth_date'].includes(dbKey)) {
                    cleanedVal = parseExcelDate(cleanedVal);
                  }
                  
                  if (cleanedVal !== '' && cleanedVal !== null && cleanedVal !== undefined) {
                    record[dbKey] = String(cleanedVal);
                    hasAnyData = true;
                  }
                }
              }

              // Check ID
              if (!record.id && record.asd) {
                record.id = record.asd;
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

    // Export an array of employee records to an Excel workbook
    exportToExcel(records, filename = 'Taqa_Gas_Employees.xlsx') {
      if (!records || records.length === 0) {
        alert('لا توجد بيانات لتصديرها!');
        return;
      }

      // Map DB fields to Arabic/English readable headers
      const exportRows = records.map(r => {
        const row = {};
        window.COLUMN_DEFINITIONS.forEach(col => {
          row[col.label] = r[col.key] || '';
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      
      // Auto column widths
      const colWidths = window.COLUMN_DEFINITIONS.map(col => {
        return { wch: Math.max(col.label.length * 2, 16) };
      });
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

      // Download
      XLSX.writeFile(workbook, filename);
    }
  };
})();
