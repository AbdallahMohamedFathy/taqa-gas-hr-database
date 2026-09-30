// Excel Processing and Export Utility with Exact Color & Style Formatting
(function() {
  // Mapping rules: Normalized Excel Header -> Database field key
  const HEADER_MAP = {
    'id': 'id',
    'employee id': 'id',
    'كود الموظف': 'id',
    'الرقم الوظيفي': 'id',
    's.': 'serial_no',
    's': 'serial_no',
    'serial': 'serial_no',
    'مسلسل': 'serial_no',
    'م': 'serial_no',
    'asd': 'asd',
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
    'المدير المباشر': 'manager'
  };

  // Exact Excel columns order & original color configuration
  const EXCEL_COLUMN_CONFIG = [
    { key: 'serial_no', header: 'S.', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'asd', header: 'ASD', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'hiring_type', header: 'Hiring Type', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'id', header: 'ID', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'employee_name', header: 'Employee Name', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'job_post', header: 'Job Post', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'job_title', header: 'Jop Title', bg: 'FF0000', fg: 'FFFFF3C9' },
    { key: 'managerial_level', header: 'Mangerial Level', bg: 'FF0000', fg: 'FFFFF3C9' },
    { key: 'job_tree', header: 'Job Tree', bg: 'FF0000', fg: 'FFFFF3C9' },
    { key: 'company_sector', header: 'Company\n(Sector)', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'company', header: 'Company', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'costed_by_company', header: 'Costed by \n(Company)', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'costed_by_sector', header: 'Costed by \n(Sector)', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'locations', header: 'Locations', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'sub_location', header: 'Sub-Location', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'division', header: 'Division', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'department', header: 'Department', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'sub_department', header: 'Sub-Department', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'qalaa_department', header: 'Qalaa Department', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'qalaa_group_functions', header: 'Qalaa Group Functions', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'skilled_unskilled', header: 'Skilled / Unskilled \n(Second Level)', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'company_level', header: 'Company \nLevel', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'taqa_level_grade', header: 'TAQA Level (Grade)', bg: 'FF0000', fg: 'FFFFF3C9' },
    { key: 'qalaa_job_group', header: 'Qalaa Job Group', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'start_date', header: 'Start Date', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'yoe', header: 'YOE', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'resignation_date', header: 'Resignation Date', bg: 'C00000', fg: 'FFFFF3C9' },
    { key: 'gender', header: 'Gender', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'employment_type', header: 'Employment Type', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'type_of_contract', header: 'Type of Contract', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'birth_date', header: 'Birth Date', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'birth_month', header: 'Birth Month', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'age', header: 'Age', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'national_id', header: 'National ID', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'mobile_numbers', header: 'Mobile Numbers', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'insurance_number', header: 'Insurance Number', bg: 'FF0000', fg: 'FFFFF3C9' },
    { key: 'bank_name', header: 'Bank Name', bg: 'FFEBEB', fg: '6C0000' },
    { key: 'status', header: 'Status', bg: 'FFEBEB', fg: '6C0000' },
    { key: 'account_numbers', header: 'Account Numbers', bg: 'FFEBEB', fg: '6C0000' },
    { key: 'floor', header: 'Floor', bg: '285E6A', fg: 'FFFFF3C9' },
    { key: 'telephone_extension', header: 'Telephone Extension', bg: '285E6A', fg: 'FFFFF3C9' },
    { key: 'employee_name_ar', header: 'أســم الموظف بالعربية', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'email', header: 'Email', bg: '002060', fg: 'FFFFF3C9' },
    { key: 'manager', header: 'Manager', bg: '002060', fg: 'FFFFF3C9' }
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
      return val.toISOString().split('T')[0];
    }
    if (typeof val === 'number') {
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
                  if (typeof cleanedVal === 'string') cleanedVal = cleanedVal.trim();
                  
                  if (['start_date', 'resignation_date', 'birth_date'].includes(dbKey)) {
                    cleanedVal = parseExcelDate(cleanedVal);
                  }
                  
                  if (cleanedVal !== '' && cleanedVal !== null && cleanedVal !== undefined) {
                    record[dbKey] = String(cleanedVal);
                    hasAnyData = true;
                  }
                }
              }

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

    // Export to Excel with EXACT Original Headers and Color Palette
    exportToExcel(records, filename = 'Taqa_Gas_Employees.xlsx') {
      if (!records || records.length === 0) {
        alert('لا توجد بيانات لتصديرها!');
        return;
      }

      // Build 2D array of data (Header row + data rows)
      const headers = EXCEL_COLUMN_CONFIG.map(col => col.header);
      const dataRows = [headers];

      records.forEach((emp, rIdx) => {
        const row = EXCEL_COLUMN_CONFIG.map(col => {
          let val = emp[col.key];
          if (col.key === 'serial_no' && (!val || val === '')) {
            val = rIdx + 1;
          }
          return val !== undefined && val !== null ? String(val) : '';
        });
        dataRows.push(row);
      });

      // Create Worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(dataRows);

      // Set Row Heights: Header is 40pt, Data rows 20pt
      worksheet['!rows'] = [
        { hpt: 38 },
        ...records.map(() => ({ hpt: 20 }))
      ];

      // Auto-compute column widths
      const colWidths = EXCEL_COLUMN_CONFIG.map(col => {
        let maxLen = Math.max(col.header.length, 12);
        if (col.header.includes('\n')) {
          const parts = col.header.split('\n');
          maxLen = Math.max(...parts.map(p => p.length), 12);
        }
        return { wch: Math.min(Math.max(maxLen + 4, 15), 32) };
      });
      worksheet['!cols'] = colWidths;

      // Apply cell styling to ALL cells (Headers + Data)
      const range = XLSX.utils.decode_range(worksheet['!ref']);

      for (let R = range.s.r; R <= range.e.r; ++R) {
        const isHeader = (R === 0);

        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (!worksheet[cellRef]) {
            worksheet[cellRef] = { t: 's', v: '' };
          }
          const cell = worksheet[cellRef];
          const colConfig = EXCEL_COLUMN_CONFIG[C] || { bg: '002060', fg: 'FFFFF3C9' };

          if (isHeader) {
            // Header Cell Styling
            cell.s = {
              fill: {
                patternType: 'solid',
                fgColor: { rgb: colConfig.bg }
              },
              font: {
                name: 'Calibri',
                sz: 10,
                bold: true,
                color: { rgb: colConfig.fg }
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
            // Data Cell Styling
            const isEven = (R % 2 === 0);
            const isCenterCol = ['serial_no', 'asd', 'id', 'hiring_type', 'gender', 'age', 'birth_month', 'start_date', 'resignation_date', 'status', 'floor'].includes(colConfig.key);

            cell.s = {
              fill: {
                patternType: 'solid',
                fgColor: { rgb: isEven ? 'F9FAFB' : 'FFFFFF' }
              },
              font: {
                name: 'Calibri',
                sz: 9.5,
                color: { rgb: '1E293B' }
              },
              alignment: {
                horizontal: isCenterCol ? 'center' : (colConfig.key === 'employee_name_ar' ? 'right' : 'left'),
                vertical: 'center'
              },
              border: {
                top: { style: 'thin', color: { rgb: 'E2E8F0' } },
                bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
                left: { style: 'thin', color: { rgb: 'E2E8F0' } },
                right: { style: 'thin', color: { rgb: 'E2E8F0' } }
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
