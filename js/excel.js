// Excel Processing and Export Utility with Exact Original Colors for Headers AND Data Rows
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

  // 44 Columns Configuration matching Taqa Gas exact Excel palette (Headers + Data Rows)
  const EXCEL_COLUMN_CONFIG = [
    { key: 'serial_no', header: 'S.', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'asd', header: 'ASD', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'hiring_type', header: 'Hiring Type', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'id', header: 'ID', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF8DD', dFg: '000000', align: 'center' },
    { key: 'employee_name', header: 'Employee Name', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF6DD', dFg: '000000', align: 'left' },
    { key: 'job_post', header: 'Job Post', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF6DD', dFg: '000000', align: 'left' },
    { key: 'job_title', header: 'Jop Title', hBg: 'FF0000', hFg: 'FFFFF3C9', dBg: 'FFF6DD', dFg: '000000', align: 'left' },
    { key: 'managerial_level', header: 'Mangerial Level', hBg: 'FF0000', hFg: 'FFFFF3C9', dBg: 'FFF6DD', dFg: '000000', align: 'left' },
    { key: 'job_tree', header: 'Job Tree', hBg: 'FF0000', hFg: 'FFFFF3C9', dBg: 'FFF6DD', dFg: '000000', align: 'left' },
    { key: 'company_sector', header: 'Company\n(Sector)', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFFFEB', dFg: '000000', align: 'center' },
    { key: 'company', header: 'Company', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'A9D08E', dFg: '000000', align: 'center' }, // Light Green!
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
    { key: 'company_level', header: 'Company \nLevel', hBg: '002060', hFg: 'FFFFF3C9', dBg: '262626', dFg: '5B9BD5', align: 'center' }, // Dark charcoal + blue text
    { key: 'taqa_level_grade', header: 'TAQA Level (Grade)', hBg: 'FF0000', hFg: 'FFFFF3C9', dBg: '262626', dFg: '5B9BD5', align: 'center' }, // Dark charcoal + blue text
    { key: 'qalaa_job_group', header: 'Qalaa Job Group', hBg: '002060', hFg: 'FFFFF3C9', dBg: '262626', dFg: '5B9BD5', align: 'center' }, // Dark charcoal + blue text
    { key: 'start_date', header: 'Start Date', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF9E5', dFg: '000000', align: 'center' },
    { key: 'yoe', header: 'YOE', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'A9D08E', dFg: '000000', align: 'center' }, // Light Green!
    { key: 'resignation_date', header: 'Resignation Date', hBg: 'C00000', hFg: 'FFFFF3C9', dBg: 'C00000', dFg: 'FFFFFF', align: 'center' }, // Solid Red!
    { key: 'gender', header: 'Gender', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF6DD', dFg: '000000', align: 'center' },
    { key: 'employment_type', header: 'Employment Type', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF6DD', dFg: '000000', align: 'center' },
    { key: 'type_of_contract', header: 'Type of Contract', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF6DD', dFg: '000000', align: 'left' },
    { key: 'birth_date', header: 'Birth Date', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF9E5', dFg: '000000', align: 'center' },
    { key: 'birth_month', header: 'Birth Month', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF9E5', dFg: '000000', align: 'center' },
    { key: 'age', header: 'Age', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'A9D08E', dFg: '000000', align: 'center' }, // Light Green!
    { key: 'national_id', header: 'National ID', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF9E5', dFg: '000000', align: 'center' },
    { key: 'mobile_numbers', header: 'Mobile Numbers', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFF9E5', dFg: '000000', align: 'center' },
    { key: 'insurance_number', header: 'Insurance Number', hBg: 'FF0000', hFg: 'FFFFF3C9', dBg: 'FFF9E5', dFg: '000000', align: 'center' },
    { key: 'bank_name', header: 'Bank Name', hBg: 'FFEBEB', hFg: '6C0000', dBg: 'FFF7F7', dFg: '6C0000', align: 'center' }, // Soft Pink + Maroon text
    { key: 'status', header: 'Status', hBg: 'FFEBEB', hFg: '6C0000', dBg: 'FFF7F7', dFg: '6C0000', align: 'center' },
    { key: 'account_numbers', header: 'Account Numbers', hBg: 'FFEBEB', hFg: '6C0000', dBg: 'FFF7F7', dFg: '6C0000', align: 'center' },
    { key: 'floor', header: 'Floor', hBg: '285E6A', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'telephone_extension', header: 'Telephone Extension', hBg: '285E6A', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'center' },
    { key: 'employee_name_ar', header: 'أســم الموظف بالعربية', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'right' },
    { key: 'email', header: 'Email', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'left' },
    { key: 'manager', header: 'Manager', hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'left' }
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

    // Export to Excel with EXACT Original Colors for BOTH Headers and Data Rows
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

      // Set Row Heights: Header is 38pt, Data rows 20pt
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
          const colConfig = EXCEL_COLUMN_CONFIG[C] || { hBg: '002060', hFg: 'FFFFF3C9', dBg: 'FFFFFF', dFg: '000000', align: 'left' };

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
