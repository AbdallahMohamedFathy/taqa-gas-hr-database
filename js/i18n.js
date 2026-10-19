// =========================================================================
// TAQA Gas HR - Arabic / English interface switching
//
// The dashboard is written in Arabic. Rather than rewrite every template and
// toast, this layer translates the rendered DOM: it walks text nodes and the
// user-visible attributes, swapping any string it recognises. A MutationObserver
// keeps doing that for content rendered later (table rows, toasts, modals), so
// dynamic screens stay translated without app.js knowing this file exists.
//
// Each node keeps its Arabic original, so switching back is exact rather than
// a second (lossy) translation pass.
// =========================================================================
(function() {

  const STORAGE_KEY = 'taqa_hr_lang';

  // ---------------------------------------------------------------- dictionary
  const DICT = {
    // --- login screen ---
    'نظام إدارة قاعدة بيانات موظفي طاقة غاز | TAQA Gas Database': 'TAQA Gas Employee Database',
    'طاقة غاز TAQA Gas': 'TAQA Gas',
    'بوابة إدارة الموارد البشرية وقاعدة بيانات العاملين': 'Human Resources & Employee Database Portal',
    'نظام مشفر ومحمي بكلمة مرور': 'Encrypted, password-protected system',
    'بيانات الدخول غير صحيحة': 'Invalid credentials',
    'البريد الإلكتروني للـ HR': 'HR email address',
    'كلمة المرور': 'Password',
    'تذكر تسجيل الدخول (7 أيام)': 'Remember me (7 days)',
    'تسجيل الدخول إلى النظام': 'Sign in',
    'بيانات الدخول الإداري:': 'Administrator credentials:',
    'إظهار/إخفاء كلمة المرور': 'Show / hide password',
    'تم تسجيل الدخول بنجاح، مرحباً بك!': 'Signed in successfully. Welcome!',
    'هل أنت متأكد من رغبتك في تسجيل الخروج من لوحة الـ HR؟': 'Are you sure you want to sign out of the HR dashboard?',

    // --- header ---
    'طاقة غاز': 'TAQA Gas',
    'نظام إدارة ومزامنة قاعدة بيانات العاملين والعقود (44 حقلاً كاملاً)':
      'Employee and contract database management & sync',
    'إنشاء رابط / QR للموظفين': 'Employee link / QR',
    'طلبات الموظفين': 'Employee requests',
    'رفع شيت إكسيل': 'Upload Excel sheet',
    'إضافة موظف جديد': 'Add employee',
    'مركز التقارير': 'Reports centre',
    'تصدير إكسيل': 'Export Excel',
    'خروج': 'Sign out',
    'تسجيل الخروج': 'Sign out',
    'طلبات تحديث بيانات الموظفين للمراجعة والاعتماد': 'Employee update requests awaiting review',
    'مركز التقارير والتحليلات': 'Reports & analytics centre',

    // --- stat cards ---
    'إجمالي الموظفين المسجلين': 'Total employees',
    'الموظفون على رأس العمل': 'Active employees',
    'الشركات التابعة': 'Companies',
    'الإدارات والأقسام': 'Departments',

    // --- filters / toolbar ---
    'جميع الشركات': 'All companies',
    'جميع القطاعات (Sector)': 'All sectors',
    'جميع القطاعات الرئيسية (Division)': 'All divisions',
    'جميع الإدارات': 'All departments',
    'كل شجرة الوظائف (Job Tree)': 'All job trees',
    'جميع المحافظات': 'All governorates',
    'النوع (الكل)': 'Gender (all)',
    'ذكر (Male)': 'Male',
    'أنثى (Female)': 'Female',
    'إعادة ضبط': 'Reset',
    'إعادة تعيين الفلاتر': 'Reset filters',
    'بحث شامل: كود الموظف، الاسم، الرقم القومي، الموبايل، الإيميل، الوظيفة...':
      'Search: ID, name, national ID, mobile, email, job title…',
    'سجلات الموظفين الكاملة': 'Employee records',
    'تخصيص الأعمدة': 'Columns',
    'اختيار الأعمدة المعروضة': 'Choose visible columns',
    'تحديث': 'Refresh',
    'تحديث السجلات': 'Refresh records',
    'الكل': 'All',
    'عرض متصل لكل الصفوف': 'Continuous view of all rows',
    'جاري تحميل البيانات من السيرفر السحابي...': 'Loading data from the cloud…',
    'لا توجد نتائج مطابقة': 'No matching results',
    'جرّب تغيير كلمات البحث أو الفلاتر، أو قم برفع شيت إكسيل جديد.':
      'Try different search terms or filters, or upload a new Excel sheet.',
    'لا توجد سجلات لعرضها': 'No records to display',
    'تمت إعادة ضبط جميع الفلاتر': 'All filters have been reset',
    'تم تحديث البيانات بنجاح': 'Data refreshed successfully',

    // --- column picker ---
    'يمكنك اختيار الأعمدة التي ترغب في إظهارها أو إخفائها من الجدول:':
      'Choose which columns to show or hide in the table:',
    'تحديد الكل': 'Select all',
    'الوضع الافتراضي': 'Default view',
    'تم وتطبيق': 'Done',

    // --- upload modal ---
    'رفع وتحديث شيت إكسيل (Excel Import)': 'Upload & sync Excel sheet',
    'اضغط هنا لاختيار ملف الإكسيل أو اسحبه وأفلته هنا':
      'Click to choose an Excel file, or drag and drop it here',
    'يدعم ملفات بصيغة .xlsx, .xls (تلقائياً يتعرف على 44 حقلاً للموظفين)':
      'Supports .xlsx and .xls files — employee fields are detected automatically',
    'طريقة المزامنة مع قاعدة البيانات:': 'Sync method:',
    'تحديث وإضافة (Upsert - موصى به):': 'Update & insert (Upsert — recommended):',
    'تحديث بيانات الموظف الموجود بناءً على الكود (ID) وإضافة أي موظف جديد.':
      'Update existing employees matched on ID and add any new ones.',
    'استبدال كامل (Full Overwrite):': 'Full overwrite:',
    'مسح البيانات الحالية واستبدالها بالكامل ببيانات هذا الشيت.':
      'Erase all current data and replace it with this sheet.',
    'جاري رفع البيانات إلى قاعدة البيانات السحابية...': 'Uploading data to the cloud database…',
    'إلغاء': 'Cancel',
    'بدء الرفع والمزامنة': 'Start upload & sync',
    'جاري قراءة وتجهيز الـ 44 حقلاً...': 'Reading and preparing the sheet…',
    'خطأ في معالجة الملف': 'Error processing the file',
    'جاري الاتصال بالسحابة...': 'Connecting to the cloud…',
    'جاري تفريغ قاعدة البيانات السحابية واستبدال السجلات...':
      'Clearing the cloud database and replacing records…',
    'حدث خطأ أثناء الرفع!': 'An error occurred during the upload.',
    'خطأ:': 'Error:',

    // --- employee form ---
    'بيانات الموظف': 'Employee details',
    'البيانات الأساسية والهوية الشخصية': 'Basic details & identity',
    'كود الموظف (ID)': 'Employee ID',
    'نوع التعيين (Hiring Type)': 'Hiring type',
    'الاسم بالإنجليزية (Employee Name)': 'Name (English)',
    'الاسم باللغة العربية': 'Name (Arabic)',
    'الرقم القومي (National ID)': 'National ID',
    'النوع (Gender)': 'Gender',
    'اختر...': 'Select…',
    'تاريخ الميلاد (Birth Date)': 'Date of birth',
    'شهر الميلاد (Birth Month)': 'Birth month',
    'السن (Age)': 'Age',
    'بيانات الوظيفة والشركة والتعاقد': 'Job, company & contract',
    'المسمى الوظيفي (Job Post)': 'Job post',
    'الوظيفة (Jop Title)': 'Job title',
    'الوظيفة (Job Title)': 'Job title',
    'المستوى الإداري (Managerial Level)': 'Managerial level',
    'المستوى الإداري': 'Managerial level',
    'شجرة الوظائف (Job Tree)': 'Job tree',
    'الشركة (Company)': 'Company',
    'القطاع (Company Sector)': 'Company sector',
    'التكلفة على الشركة (Costed by Company)': 'Costed by (company)',
    'التكلفة على القطاع (Costed by Sector)': 'Costed by (sector)',
    'الموقع (Locations)': 'Location',
    'الموقع الفرعي (Sub-Location)': 'Sub-location',
    'القطاع العام (Division)': 'Division',
    'الإدارة (Department)': 'Department',
    'القسم الفرعي (Sub-Department)': 'Sub-department',
    'إدارة القلعة (Qalaa Department)': 'Qalaa department',
    'وظائف القلعة (Qalaa Group Functions)': 'Qalaa group functions',
    'المهارة (Skilled / Unskilled)': 'Skilled / unskilled',
    'مستوى الشركة (Company Level)': 'Company level',
    'درجة طاقة (TAQA Level/Grade)': 'TAQA level (grade)',
    'مجموعة القلعة (Qalaa Job Group)': 'Qalaa job group',
    'الحالة (Status)': 'Status',
    'نوع التوظيف (Employment Type)': 'Employment type',
    'نوع العقد (Type of Contract)': 'Contract type',
    'تاريخ التعيين (Start Date)': 'Start date',
    'تاريخ الاستقالة (Resignation Date)': 'Resignation date',
    'سنوات الخبرة (YOE)': 'Years of experience',
    'المدير المباشر (Manager)': 'Direct manager',
    'كود المدير المباشر (Id manager)': 'Manager ID',
    'التواصل والحسابات المالية والتأمينية': 'Contact, banking & insurance',
    'رقم الموبايل (Mobile Numbers)': 'Mobile number',
    'الرقم التأميني (Insurance Number)': 'Insurance number',
    'اسم البنك (Bank Name)': 'Bank name',
    'رقم الحساب البنكي (Account Numbers)': 'Bank account number',
    'الدور (Floor)': 'Floor',
    'الداخلي (Telephone Extension)': 'Telephone extension',
    'البريد الإلكتروني (Email)': 'Email',
    'تقييمات الأداء السنوية (Performance Appraisal)': 'Annual performance appraisal',
    'الترقيات (Promotions)': 'Promotions',
    'حفظ البيانات في السحابة': 'Save to cloud',
    'يرجى إدخال اسم الموظف بالإنجليزية': 'Please enter the employee name in English',
    'لم يتم العثور على بيانات الموظف': 'Employee record not found',
    'تعذر جلب تفاصيل الموظف:': 'Could not load employee details:',
    'خطأ في حفظ البيانات:': 'Error saving data:',

    // --- delete modal ---
    'تأكيد حذف الموظف': 'Confirm employee deletion',
    'هل أنت متأكد من رغبتك في حذف سجل الموظف:': 'Are you sure you want to delete this employee record:',
    '⚠️ تنبيه: هذه العملية ستحذف الموظف نهائياً من قاعدة البيانات السحابية ولا يمكن التراجع عنها.':
      'Warning: this permanently deletes the employee from the cloud database and cannot be undone.',
    'نعم، قم بالحذف': 'Yes, delete',
    // the delete prompt splits around a <strong>, so these arrive as separate nodes
    '(كود:': '(ID:',
    ')؟': ')?',
    'غير مسمى': 'Unnamed',
    'فشل حذف الموظف:': 'Failed to delete employee:',

    // --- export ---
    'لا توجد بيانات مطابقة لتصديرها!': 'There is no matching data to export.',
    '(حسب نتائج البحث والفلترة)': '(based on the current search and filters)',
    'خطأ أثناء تصدير الإكسيل:': 'Error exporting to Excel:',

    // --- link / QR generator ---
    'إنشاء رابط و QR Code لاستيفاء وتحديث بيانات الموظفين':
      'Generate a link & QR code for employees to update their details',
    '1. تحديد نوع الرابط والمستهدفين:': '1. Choose the link type and recipients:',
    'رابط عام موحد (لكل موظفي الشركة)': 'General link (all employees)',
    'رابط مخصص لموظف معين (محدد بالكود)': 'Link for one specific employee (by ID)',
    'رابط لمدير مباشر (لفريق عمل)': 'Link for a direct manager (their team)',
    'كود الموظف المستهدف (ID)': 'Target employee ID',
    'فحص الكود': 'Check ID',
    'جلب فريق العمل': 'Load team',
    'أعضاء فريق العمل التابعين لهذا المدير:': 'Team members reporting to this manager:',
    'إلغاء الكل': 'Clear all',
    '2. حدد الحقول المسموح للموظف برؤيتها وتعديلها:':
      '2. Choose which fields the employee may view and edit:',
    'بيانات التواصل والبنك': 'Contact & banking details',
    'البيانات الشخصية والرقم القومي': 'Personal details & national ID',
    'تقييمات الأداء والترقيات': 'Performance ratings & promotions',
    'إلغاء التحديد': 'Clear selection',
    'الاسم باللغة العربية رباعياً': 'Full name in Arabic',
    'رقم الموبايل الشخصي': 'Personal mobile number',
    'الرقم القومي (14 رقماً)': 'National ID (14 digits)',
    'تاريخ الميلاد': 'Date of birth',
    'اسم البنك': 'Bank name',
    'رقم الحساب البنكي / IBAN': 'Bank account / IBAN',
    'الرقم التأميني': 'Insurance number',
    'الدور / مكان التواجد': 'Floor / location',
    'رقم التليفون الداخلي (Extension)': 'Telephone extension',
    'البريد الإلكتروني الشخصي': 'Personal email',
    'الرابط المباشر والـ QR Code الجاهز للإرسال:': 'Shareable link and QR code:',
    'الموظف سيرى فقط الحقول التي قمت بتحديدها أعلاه':
      'The employee will only see the fields selected above',
    'نسخ الرابط': 'Copy link',
    'تحميل QR كصورة PNG': 'Download QR as PNG',
    'فتح وتجربة الرابط': 'Open link',
    'يرجى إدخال كود الموظف أولاً': 'Please enter the employee ID first',
    'كود الموظف غير موجود بقاعدة البيانات!': 'That employee ID does not exist in the database.',
    'خطأ أثناء فحص الكود': 'Error checking the ID',
    'مدير مباشر': 'Direct manager',
    'تم نسخ الرابط إلى الحافظة بنجاح!': 'Link copied to clipboard.',
    'تم نسخ الرابط!': 'Link copied.',
    'جاري تحميل صورة QR Code...': 'Downloading QR code image…',
    'موظف': 'employees',

    // --- requests modal ---
    'طلبات تحديث بيانات الموظفين (المراجعة والاعتماد)': 'Employee update requests (review & approval)',
    'قيد المراجعة': 'Pending',
    'المعتمدة': 'Approved',
    'المرفوضة': 'Rejected',
    'اعتماد الكل': 'Approve all',
    'اعتماد جميع الطلبات المعلقة دفعة واحدة': 'Approve all pending requests at once',
    'تاريخ الإرسال': 'Submitted',
    'الموظف': 'Employee',
    'التعديلات المطلوبة (قبل ⬅ بعد)': 'Requested changes (before ➜ after)',
    'الحالة': 'Status',
    'الإجراءات': 'Actions',
    'إجراءات': 'Actions',
    'لا توجد طلبات في هذا القسم': 'No requests in this section',
    'عند قيام الموظفين بتعبئة روابط تحديث البيانات، ستظهر التعديلات هنا للمراجعة والاعتماد.':
      'When employees submit their update links, the changes will appear here for review and approval.',
    'جاري تحميل الطلبات...': 'Loading requests…',
    'لن يتم تطبيق أي تعديل في قاعدة البيانات الرئيسية إلا بعد النقر على':
      'No change is applied to the main database until you click',
    'اعتماد': 'Approve',
    'إغلاق النافذة': 'Close',
    'تحديث القائمة': 'Refresh list',
    'تم تحديث قائمة الطلبات': 'Request list refreshed',
    'لا توجد طلبات معلقة قيد المراجعة للاعتماد': 'There are no pending requests to approve',
    'حدث خطأ أثناء الاعتماد:': 'An error occurred while approving:',
    'سبب رفض طلب التعديل (اختياري):': 'Reason for rejecting this request (optional):',
    'بيانات غير مطابقة': 'Data does not match',
    'حدث خطأ أثناء الرفض:': 'An error occurred while rejecting:',
    '(فارغ)': '(empty)',
    'آخر تعديل: تم تحديثه من الموظف واعتماده من الـ HR':
      'Last change: submitted by the employee and approved by HR',
    'آخر تعديل: بواسطة مسؤول HR': 'Last change: by an HR administrator',
    'تم نسخ سكريبت SQL لإنشاء الجدول في Supabase إلى الحافظة!':
      'The SQL script for creating the Supabase table has been copied to the clipboard.',
    'يرجى نسخ الكود من ملف supabase_schema.sql الموجود بالمشروع':
      'Please copy the script from supabase_schema.sql in the project.',

    // --- status badges ---
    'شغال': 'Active',
    'قائم': 'Active',
    'مستقيل': 'Resigned',
    'خاص': 'Personal',

    // --- placeholders ---
    'مثال: 500021': 'e.g. 500021',
    'مثال: أحمد محمد صالح': 'e.g. Ahmed Mohamed Saleh',
    '14 رقم': '14 digits',
    'يُحسب تلقائياً': 'Calculated automatically',
    'مثال: Trans Gas': 'e.g. Trans Gas',
    'مثال: LDC': 'e.g. LDC',
    'مثال: Permanent Contract': 'e.g. Permanent Contract',
    'مثال: 000019': 'e.g. 000019',
    'P عند الترقية': 'P when promoted',
    'أدخل كود الموظف (مثال: 500021)': 'Enter employee ID (e.g. 500021)',
    'أدخل كود المدير (Id manager) مثال: 000019': 'Enter manager ID (e.g. 000019)'
  };

  // Appraisal / promotion labels follow a predictable shape
  for (let y = 2016; y <= 2025; y++) DICT['تقييم ' + y + ' (PA ' + y + ')'] = 'PA ' + y;
  for (let y = 2016; y <= 2026; y++) DICT['ترقية ' + y] = 'Promotion ' + y;
  for (let y = 2024; y <= 2025; y++) DICT['تقييم الأداء ' + y + ' (PA ' + y + ')'] = 'PA ' + y;
  for (let y = 2024; y <= 2026; y++) DICT['ترقية ' + y + ' (Promo ' + y + ')'] = 'Promotion ' + y;

  // Strings assembled at runtime: matched by shape, with the numbers kept
  const PATTERNS = [
    [/^(\d[\d,٠-٩٬]*)\s*سجل(?:\s*معروض)?$/, (m) => m[1] + ' records'],
    [/^(\d[\d,٠-٩٬]*)\s*عموداً معروضاً$/, (m) => m[1] + ' columns shown'],
    [/^تخصيص عرض الأعمدة \((\d+) عموداً\)$/, (m) => 'Customise columns (' + m[1] + ')'],
    [/^(\d[\d,٠-٩٬]*)\s*موظف صالح للرفع$/, (m) => m[1] + ' employees ready to upload'],
    [/^(\d[\d,٠-٩٬]*)\s*موظف صالح$/, (m) => m[1] + ' valid employees'],
    [/^(\d[\d,٠-٩٬]*)\s*موظف$/, (m) => m[1] + ' employees'],
    [/^(\d[\d,٠-٩٬]*)\s*طلب$/, (m) => m[1] + ' requests'],
    [/^عرض السجلات من (.+?) إلى (.+?) من إجمالي (.+)$/,
      (m) => 'Showing ' + m[1] + '–' + m[2] + ' of ' + m[3]],
    [/^تم رفع وتحديث (.+?) من إجمالي (.+?) موظف\.\.\.$/,
      (m) => 'Uploaded ' + m[1] + ' of ' + m[2] + ' employees…'],
    [/^اكتملت المزامنة بنجاح! تم رفع وتحديث (.+?) موظف\.$/,
      (m) => 'Sync complete. ' + m[1] + ' employees uploaded.'],
    [/^تم تصدير (.+?) موظف و (.+?) عمود مختار بنجاح!(.*)$/,
      (m) => 'Exported ' + m[1] + ' employees and ' + m[2] + ' columns.' + (m[3] ? ' ' + m[3] : '')],
    [/^تم حذف الموظف \(كود (.+?)\) بنجاح$/, (m) => 'Employee ' + m[1] + ' deleted successfully'],
    [/^تعديل بيانات الموظف \(كود: (.+?)\)$/, (m) => 'Edit employee (ID: ' + m[1] + ')'],
    [/^تم اعتماد بيانات الموظف \(كود: (.+?)\) وتحديث قاعدة البيانات بنجاح!$/,
      (m) => 'Employee ' + m[1] + ' approved and the database updated.'],
    [/^تم رفض طلب التعديل للموظف \(كود: (.+?)\)$/, (m) => 'Update request for employee ' + m[1] + ' rejected'],
    [/^لم يتم العثور على مدير أو موظفين مسجلين بكود المدير: (.+)$/,
      (m) => 'No manager or employees found for manager ID: ' + m[1]],
    [/^تم العثور على (.+?) موظف ضمن فريق (.+)$/, (m) => 'Found ' + m[1] + ' employees in ' + m[2] + "'s team"]
  ];

  function translate(text) {
    const key = text.trim();
    if (!key) return null;
    if (DICT[key]) return DICT[key];
    for (let i = 0; i < PATTERNS.length; i++) {
      const m = key.match(PATTERNS[i][0]);
      if (m) return PATTERNS[i][1](m);
    }
    return null;
  }

  // ---------------------------------------------------------------- DOM walking
  const ATTRS = ['placeholder', 'title', 'aria-label'];
  const SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1 };

  function translateNode(root) {
    if (!root) return;

    // text nodes
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node.parentNode && SKIP_TAGS[node.parentNode.nodeName]) return NodeFilter.FILTER_REJECT;
        return node.nodeValue && node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const texts = [];
    let n;
    while ((n = walker.nextNode())) texts.push(n);
    texts.forEach(node => {
      if (node.__taqaOrig === undefined) {
        const en = translate(node.nodeValue);
        if (en === null) return;
        node.__taqaOrig = node.nodeValue;
        node.nodeValue = node.nodeValue.replace(node.nodeValue.trim(), en);
      }
    });

    // attributes
    const elements = root.querySelectorAll ? root.querySelectorAll('*') : [];
    const all = root.nodeType === 1 ? [root].concat(Array.prototype.slice.call(elements))
                                    : Array.prototype.slice.call(elements);
    all.forEach(el => {
      ATTRS.forEach(attr => {
        const v = el.getAttribute && el.getAttribute(attr);
        if (!v) return;
        const store = '__taqaOrig_' + attr;
        if (el[store] !== undefined) return;
        const en = translate(v);
        if (en === null) return;
        el[store] = v;
        el.setAttribute(attr, en);
      });
    });
  }

  function restoreNode(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const texts = [];
    let n;
    while ((n = walker.nextNode())) texts.push(n);
    texts.forEach(node => {
      if (node.__taqaOrig !== undefined) {
        node.nodeValue = node.__taqaOrig;
        delete node.__taqaOrig;
      }
    });
    const all = root.querySelectorAll ? root.querySelectorAll('*') : [];
    Array.prototype.slice.call(all).forEach(el => {
      ATTRS.forEach(attr => {
        const store = '__taqaOrig_' + attr;
        if (el[store] !== undefined) {
          el.setAttribute(attr, el[store]);
          delete el[store];
        }
      });
    });
  }

  // ---------------------------------------------------------------- observer
  let observer = null;

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver(mutations => {
      observer.disconnect();
      mutations.forEach(mu => {
        Array.prototype.slice.call(mu.addedNodes).forEach(node => {
          if (node.nodeType === 1) translateNode(node);
          else if (node.nodeType === 3 && node.__taqaOrig === undefined) {
            const en = translate(node.nodeValue);
            if (en !== null) {
              node.__taqaOrig = node.nodeValue;
              node.nodeValue = node.nodeValue.replace(node.nodeValue.trim(), en);
            }
          }
        });
      });
      observe();
    });
    observe();
  }

  function observe() {
    if (observer) observer.observe(document.body, { childList: true, subtree: true });
  }

  function stopObserver() {
    if (observer) { observer.disconnect(); observer = null; }
  }

  // ---------------------------------------------------------------- public API
  function current() {
    try { return localStorage.getItem(STORAGE_KEY) || 'ar'; } catch (e) { return 'ar'; }
  }

  function apply(lang, persist) {
    const html = document.documentElement;
    if (lang === 'en') {
      html.setAttribute('lang', 'en');
      html.setAttribute('dir', 'ltr');
      translateNode(document.body);
      startObserver();
    } else {
      stopObserver();
      html.setAttribute('lang', 'ar');
      html.setAttribute('dir', 'rtl');
      restoreNode(document.body);
    }
    if (persist !== false) {
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    }
    updateButton(lang);
    document.dispatchEvent(new CustomEvent('taqa:langchange', { detail: { lang: lang } }));
  }

  function updateButton(lang) {
    const btn = document.getElementById('btn-lang-toggle');
    if (!btn) return;
    const label = btn.querySelector('.lang-label');
    // The button shows the language you switch TO
    if (label) label.textContent = lang === 'en' ? 'عربي' : 'English';
    btn.setAttribute('title', lang === 'en' ? 'التبديل إلى العربية' : 'Switch to English');
  }

  window.I18n = {
    current: current,
    apply: apply,
    toggle() { apply(current() === 'en' ? 'ar' : 'en'); },
    t(arabic) { return current() === 'en' ? (translate(arabic) || arabic) : arabic; }
  };

  // ---------------------------------------------------------------- bootstrap
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-lang-toggle');
    if (btn) btn.addEventListener('click', () => window.I18n.toggle());
    if (current() === 'en') apply('en', false);
    else updateButton('ar');
  });

})();
