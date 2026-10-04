// Employee Data Collection & Verification Script for TAQA Gas
(function() {
  const { createClient } = supabase;
  const client = createClient(window.APP_CONFIG.SUPABASE_URL, window.APP_CONFIG.SUPABASE_ANON_KEY);

  // Field metadata dictionary with Arabic labels, icons, types, and descriptions
  const FIELD_DICTIONARY = {
    employee_name_ar: {
      label: 'الاسم باللغة العربية رباعياً',
      type: 'text',
      icon: 'fa-user',
      placeholder: 'مثال: أحمد محمد علي حسن',
      desc: 'الاسم كما هو مدون في بطاقة الرقم القومي'
    },
    mobile_numbers: {
      label: 'رقم الموبايل الشخصي (للتواصل السريع)',
      type: 'tel',
      icon: 'fa-phone',
      placeholder: 'مثال: 01012345678',
      desc: 'رقم الهاتف المحمول للتواصل الإداري'
    },
    national_id: {
      label: 'الرقم القومي (14 رقماً)',
      type: 'text',
      icon: 'fa-id-card',
      placeholder: '14 رقم قومي بالإنجليزية',
      desc: 'الرقم القومي المكون من 14 رقماً بالبطاقة'
    },
    birth_date: {
      label: 'تاريخ الميلاد (Birth Date)',
      type: 'date',
      icon: 'fa-cake-candles',
      desc: 'يتم استخراجه تلقائياً من الرقم القومي'
    },
    gender: {
      label: 'النوع (Gender)',
      type: 'select',
      icon: 'fa-venus-mars',
      options: [
        { value: '', label: 'اختر...' },
        { value: 'Male', label: 'ذكر (Male)' },
        { value: 'Female', label: 'أنثى (Female)' }
      ]
    },
    bank_name: {
      label: 'اسم البنك المحول عليه الراتب',
      type: 'text',
      icon: 'fa-building-columns',
      placeholder: 'مثال: بنك مصر / البنك الأهلي / CIB'
    },
    account_numbers: {
      label: 'رقم الحساب البنكي / IBAN',
      type: 'text',
      icon: 'fa-money-check',
      placeholder: 'رقم الحساب البنكي لتحويل المرتبات'
    },
    insurance_number: {
      label: 'الرقم التأميني',
      type: 'text',
      icon: 'fa-shield-heart',
      placeholder: 'الرقم التأميني بمكتب التأمينات الاجتماعية'
    },
    floor: {
      label: 'الدور / مكان التواجد',
      type: 'text',
      icon: 'fa-layer-group',
      placeholder: 'مثال: الدور الثاني / مبنى العمليات'
    },
    telephone_extension: {
      label: 'رقم التليفون الداخلي (Extension)',
      type: 'text',
      icon: 'fa-phone-flip',
      placeholder: 'الداخلي بالمكتب إن وُجد'
    },
    email: {
      label: 'البريد الإلكتروني الشخصي',
      type: 'email',
      icon: 'fa-envelope',
      placeholder: 'name@example.com'
    },

    // تقييمات الأداء والترقيات والبيانات الوظيفية (للمدير المباشر والـ HR)
    pa_2024: {
      label: 'تقييم الأداء 2024 (PA 2024)',
      type: 'select',
      icon: 'fa-star',
      options: [
        { value: '', label: 'اختر التقييم...' },
        { value: 'A', label: 'A - ممتاز (Excellent)' },
        { value: 'B', label: 'B - جيد جداً (Very Good)' },
        { value: 'C', label: 'C - جيد (Good)' },
        { value: 'D', label: 'D - مقبول (Fair)' },
        { value: 'E', label: 'E - ضعيف (Poor)' }
      ]
    },
    pa_2025: {
      label: 'تقييم الأداء 2025 (PA 2025)',
      type: 'select',
      icon: 'fa-star',
      options: [
        { value: '', label: 'اختر التقييم...' },
        { value: 'A', label: 'A - ممتاز (Excellent)' },
        { value: 'B', label: 'B - جيد جداً (Very Good)' },
        { value: 'C', label: 'C - جيد (Good)' },
        { value: 'D', label: 'D - مقبول (Fair)' },
        { value: 'E', label: 'E - ضعيف (Poor)' }
      ]
    },
    promo_2024: {
      label: 'ترقية 2024 (Promotion)',
      type: 'select',
      icon: 'fa-arrow-trend-up',
      options: [
        { value: '', label: 'لا توجد ترقية (-)' },
        { value: 'P', label: 'P - تمت الترقية' }
      ]
    },
    promo_2025: {
      label: 'ترقية 2025 (Promotion)',
      type: 'select',
      icon: 'fa-arrow-trend-up',
      options: [
        { value: '', label: 'لا توجد ترقية (-)' },
        { value: 'P', label: 'P - تمت الترقية' }
      ]
    },
    promo_2026: {
      label: 'ترقية 2026 (Promotion)',
      type: 'select',
      icon: 'fa-arrow-trend-up',
      options: [
        { value: '', label: 'لا توجد ترقية (-)' },
        { value: 'P', label: 'P - تمت الترقية' }
      ]
    },
    job_title: {
      label: 'الوظيفة (Job Title)',
      type: 'text',
      icon: 'fa-briefcase',
      placeholder: 'الوظيفة الحالية'
    },
    job_post: {
      label: 'المسمى الوظيفي (Job Post)',
      type: 'text',
      icon: 'fa-user-tag',
      placeholder: 'المسمى الوظيفي'
    },
    managerial_level: {
      label: 'المستوى الإداري (Managerial Level)',
      type: 'text',
      icon: 'fa-sitemap',
      placeholder: 'مثال: Second Level'
    },
    department: {
      label: 'الإدارة (Department)',
      type: 'text',
      icon: 'fa-building-user',
      placeholder: 'الإدارة'
    }
  };

  // Safe list of fields that can be updated via links
  const SAFE_EDITABLE_KEYS = Object.keys(FIELD_DICTIONARY);

  // State
  let currentEmployee = null;
  let targetFields = [];
  let currentManager = null;
  let currentTeamEmployees = [];

  // Parse URL Parameters
  const urlParams = new URLSearchParams(window.location.search);
  const paramId = (urlParams.get('id') || '').trim();
  const paramManagerId = (urlParams.get('manager_id') || urlParams.get('mgr') || '').trim();
  const paramEmps = (urlParams.get('emps') || '').trim();
  const paramFields = urlParams.get('f') || urlParams.get('fields') || '';
  const isManagerMode = !!paramManagerId;

  // Determine allowed fields from URL, or fallback to all safe fields
  if (paramFields) {
    const rawList = paramFields.split(',').map(s => s.trim().toLowerCase());
    targetFields = SAFE_EDITABLE_KEYS.filter(k => rawList.includes(k.toLowerCase()));
  }
  if (!targetFields || targetFields.length === 0) {
    targetFields = isManagerMode 
      ? ['pa_2024', 'pa_2025', 'promo_2024', 'promo_2025', 'job_title', 'job_post'] 
      : SAFE_EDITABLE_KEYS.filter(k => !k.startsWith('pa_') && !k.startsWith('promo_'));
  }

  // DOM Elements
  const verifySection = document.getElementById('verify-section');
  const formSection = document.getElementById('form-section');
  const managerPortalSection = document.getElementById('manager-portal-section');
  const successSection = document.getElementById('success-section');
  const lockedSection = document.getElementById('locked-section');
  const verifyEmpId = document.getElementById('verify-emp-id');
  const verifySecret = document.getElementById('verify-secret');
  const btnVerify = document.getElementById('btn-verify');
  const dynamicContainer = document.getElementById('dynamic-fields-container');
  const updateForm = document.getElementById('update-form');
  const btnSaveUpdate = document.getElementById('btn-save-update');

  // Manager Portal DOM Elements
  const mgrPortalName = document.getElementById('mgr-portal-name');
  const mgrPortalId = document.getElementById('mgr-portal-id');
  const mgrPortalTeamCount = document.getElementById('mgr-portal-team-count');
  const managerTeamCards = document.getElementById('manager-team-cards');
  const btnManagerSubmitAll = document.getElementById('btn-manager-submit-all');

  const STORAGE_KEY = 'taqa_pending_update_requests';

  // Customize UI for Manager Mode if manager_id is present
  if (isManagerMode) {
    const verifyTitleEl = document.querySelector('label[for="verify-emp-id"] span');
    if (verifyTitleEl) {
      verifyTitleEl.innerHTML = '<i class="fa-solid fa-user-tie text-accent"></i> كود المدير المباشر (Id manager) <span class="req">*</span>';
    }
    const bannerTitle = document.querySelector('.banner-content h2');
    const bannerSubtitle = document.querySelector('.banner-content p');
    if (bannerTitle) bannerTitle.textContent = 'بوابة المدير المباشر لاستيفاء وتقييم بيانات الفريق';
    if (bannerSubtitle) bannerSubtitle.textContent = 'يرجى تأكيد هويتك لعرض أعضاء فريق عملك وتحديث بياناتهم وتقييماتهم';
    if (verifyEmpId) {
      verifyEmpId.value = paramManagerId;
      verifyEmpId.placeholder = 'مثال: 000019';
    }
  }

  // Display Locked Screen if employee already has a submitted request
  function showLockedScreen(lockInfo, emp) {
    if (verifySection) verifySection.style.display = 'none';
    if (formSection) formSection.style.display = 'none';
    if (successSection) successSection.style.display = 'none';
    if (!lockedSection) return;

    lockedSection.style.display = 'block';

    const empName = emp ? (emp.employee_name_ar || emp.employee_name || 'موظف طاقة غاز') : (lockInfo.employee_name || 'موظف طاقة غاز');
    const empCode = emp ? emp.id : (lockInfo.employee_id || verifyEmpId.value.trim() || paramId || '-');

    const codeEl = document.getElementById('locked-emp-code');
    const nameEl = document.getElementById('locked-emp-name');
    const dateEl = document.getElementById('locked-request-date');
    const badgeEl = document.getElementById('locked-status-badge');
    const titleEl = document.getElementById('locked-title');
    const msgEl = document.getElementById('locked-message');

    if (codeEl) codeEl.textContent = empCode;
    if (nameEl) nameEl.textContent = empName;

    const reqDate = lockInfo.submitted_at 
      ? new Date(lockInfo.submitted_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) 
      : 'مسجل مسبقاً';
    if (dateEl) dateEl.textContent = reqDate;

    if (lockInfo.status === 'approved') {
      if (titleEl) titleEl.textContent = 'تم استيفاء واعتماد بياناتك مسبقاً';
      if (msgEl) msgEl.textContent = 'تم استيفاء واعتماد بيانات هذا الموظف مسبقاً بنجاح في قاعدة البيانات بواسطة إدارة الموارد البشرية (HR). هذا الرابط لم يعد متاحاً للاستخدام مرة أخرى.';
      if (badgeEl) {
        badgeEl.textContent = 'معتمد ومكتمل';
        badgeEl.style.background = '#dcfce7';
        badgeEl.style.color = '#15803d';
      }
    } else {
      if (titleEl) titleEl.textContent = 'الرابط غير متاح للتعديل حالياً';
      if (msgEl) msgEl.textContent = 'لديك طلب تحديث بيانات تم إرساله بالفعل وهو قيد المراجعة والاعتماد لدى إدارة الموارد البشرية (HR). لا يمكن إرسال طلب جديد حتى يتم مراجعة طلبك السابق.';
      if (badgeEl) {
        badgeEl.textContent = 'قيد المراجعة (معلق)';
        badgeEl.style.background = '#fef08a';
        badgeEl.style.color = '#854d0e';
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Check if an employee is locked (already submitted a pending or approved request)
  async function checkEmployeeLocked(empId) {
    if (!empId) return null;
    const cleanId = String(empId).trim();

    // 1. Check Cloud Database (employee_update_requests)
    try {
      const { data, error } = await client
        .from('employee_update_requests')
        .select('*')
        .eq('employee_id', cleanId)
        .order('submitted_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // If there's any pending request, lock!
        const pending = data.find(r => r.status === 'pending');
        if (pending) return pending;

        // If there's an approved request, lock!
        const approved = data.find(r => r.status === 'approved');
        if (approved) return approved;
      }
    } catch (e) {
      console.warn('Error checking cloud update requests:', e);
    }

    // 2. Check localStorage fallback
    try {
      const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const localPending = local.find(r => String(r.employee_id).trim() === cleanId && (r.status === 'pending' || r.status === 'approved'));
      if (localPending) return localPending;
    } catch (e) {}

    return null;
  }

  // Pre-fill ID if passed in URL and check immediately if locked
  if (paramId) {
    verifyEmpId.value = paramId;
    (async () => {
      try {
        const lockInfo = await checkEmployeeLocked(paramId);
        if (lockInfo) {
          const { data } = await client.from('employees').select('id, employee_name, employee_name_ar').eq('id', paramId).maybeSingle();
          showLockedScreen(lockInfo, data);
        } else {
          verifySecret.focus();
        }
      } catch (e) {
        verifySecret.focus();
      }
    })();
  }

  // Toast Notification Helper
  function showToast(message, type = 'info') {
    const t = document.getElementById('toast');
    t.textContent = message;
    t.className = `toast show ${type}`;
    setTimeout(() => {
      t.className = 'toast';
    }, 4000);
  }

  // Robust Date Parser
  function parseDateRobust(dateStr) {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;
    const s = String(dateStr).trim();
    if (s.includes('/')) {
      const parts = s.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        const dt = new Date(y, m, d);
        if (!isNaN(dt.getTime())) return dt;
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

  // Format Date for <input type="date">
  function formatDateForInput(dateVal) {
    if (!dateVal) return '';
    const d = parseDateRobust(dateVal);
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Calculate age
  function calculateAge(birthDateStr) {
    const d = parseDateRobust(birthDateStr);
    if (!d) return '';
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age > 0 ? String(age) : '';
  }

  // Step 1: Verify Employee Identity
  btnVerify.addEventListener('click', async () => {
    const empId = verifyEmpId.value.trim();
    const secret = verifySecret.value.trim();

    if (!empId) {
      showToast('يرجى إدخال كود الموظف (ID)', 'error');
      verifyEmpId.focus();
      return;
    }
    if (!secret) {
      showToast('يرجى إدخال الرقم القومي أو رقم الموبايل للتأكيد', 'error');
      verifySecret.focus();
      return;
    }

    btnVerify.disabled = true;
    btnVerify.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>جاري التحقق من البيانات...</span>';

    try {
      const { data, error } = await client
        .from('employees')
        .select('*')
        .eq('id', empId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('كود الموظف غير مسجل في قاعدة البيانات، يرجى مراجعة كودك الوظيفي');
      }

      // Security check: Match either national_id or mobile_numbers if already on file
      const dbNid = (data.national_id || '').trim();
      const dbMobile = (data.mobile_numbers || '').trim().replace(/\D/g, '');
      const cleanSecret = secret.replace(/\D/g, '');

      let verified = false;
      // If DB has no National ID and no Mobile on file, allow access to complete them
      if (!dbNid && !dbMobile) {
        verified = true;
      } else {
        if (dbNid && (secret === dbNid || cleanSecret === dbNid)) {
          verified = true;
        } else if (dbMobile && cleanSecret && (cleanSecret === dbMobile || dbMobile.includes(cleanSecret) || cleanSecret.includes(dbMobile))) {
          verified = true;
        }
      }

      if (!verified) {
        throw new Error('الرقم القومي أو رقم الموبايل غير مطابق للمسجل لدينا بالكود ' + empId);
      }

      // If Manager Mode: Enter Team Update Portal
      if (isManagerMode) {
        currentManager = data;
        await renderManagerPortal(data, paramEmps);
        return;
      }

      // Check if this employee already submitted a request (Pending or Approved)
      const lockInfo = await checkEmployeeLocked(empId);
      if (lockInfo) {
        showLockedScreen(lockInfo, data);
        return;
      }

      // Identity Verified Successfully!
      currentEmployee = data;
      renderEmployeeForm(data);

    } catch (err) {
      showToast(err.message, 'error');
      btnVerify.disabled = false;
      btnVerify.innerHTML = '<i class="fa-solid fa-arrow-left"></i> <span>التحقق ومتابعة التحديث</span>';
    }
  });

  // Step 2: Render Form with ONLY the Requested Fields
  function renderEmployeeForm(emp) {
    verifySection.style.display = 'none';
    formSection.style.display = 'block';

    // Update Employee Header Badge
    const displayName = emp.employee_name_ar || emp.employee_name || 'موظف طاقة غاز';
    const firstLetter = displayName.trim().charAt(0) || 'م';
    document.getElementById('emp-avatar-letter').textContent = firstLetter;
    document.getElementById('emp-display-name').textContent = displayName;
    document.getElementById('emp-display-title').textContent = emp.job_title || emp.job_post || emp.department || 'طاقة غاز';
    document.getElementById('emp-display-code').textContent = `كود: ${emp.id}`;

    // Generate Dynamic Fields
    dynamicContainer.innerHTML = '';

    targetFields.forEach(key => {
      const meta = FIELD_DICTIONARY[key];
      if (!meta) return;

      const group = document.createElement('div');
      group.className = 'field-group';

      const label = document.createElement('label');
      label.className = 'field-label';
      label.htmlFor = `field-${key}`;
      label.innerHTML = `
        <span><i class="fa-solid ${meta.icon} text-primary" style="margin-left: 6px;"></i> ${meta.label}</span>
      `;

      let inputEl;
      if (meta.type === 'select') {
        inputEl = document.createElement('select');
        inputEl.className = 'form-control';
        inputEl.id = `field-${key}`;
        inputEl.name = key;

        meta.options.forEach(opt => {
          const optEl = document.createElement('option');
          optEl.value = opt.value;
          optEl.textContent = opt.label;
          if (emp[key] && emp[key].toString().toLowerCase() === opt.value.toLowerCase()) {
            optEl.selected = true;
          }
          inputEl.appendChild(optEl);
        });
      } else {
        inputEl = document.createElement('input');
        inputEl.className = 'form-control';
        inputEl.id = `field-${key}`;
        inputEl.name = key;
        inputEl.type = meta.type || 'text';
        if (meta.placeholder) inputEl.placeholder = meta.placeholder;

        let val = emp[key] || '';
        if (meta.type === 'date' && val) {
          val = formatDateForInput(val);
        }
        inputEl.value = val;
      }

      group.appendChild(label);
      if (meta.desc) {
        const descEl = document.createElement('div');
        descEl.className = 'field-desc';
        descEl.textContent = meta.desc;
        group.appendChild(descEl);
      }
      group.appendChild(inputEl);
      dynamicContainer.appendChild(group);
    });

    // Attach Smart Real-time Auto-Calculations
    attachLiveHelpers();
  }

  // Smart Live Listeners (National ID extraction & Age calculation)
  function attachLiveHelpers() {
    const nidInput = document.getElementById('field-national_id');
    const birthDateInput = document.getElementById('field-birth_date');
    const genderSelect = document.getElementById('field-gender');

    if (nidInput) {
      nidInput.addEventListener('input', () => {
        const nid = nidInput.value.trim();
        // Egyptian 14-digit National ID validation & birth date extractor
        if (/^[23]\d{13}$/.test(nid)) {
          const century = nid[0] === '2' ? '19' : '20';
          const year = century + nid.slice(1, 3);
          const month = nid.slice(3, 5);
          const day = nid.slice(5, 7);
          const dateStr = `${year}-${month}-${day}`;

          const dt = parseDateRobust(dateStr);
          if (dt && !isNaN(dt.getTime())) {
            if (birthDateInput) {
              birthDateInput.value = dateStr;
            }
          }

          if (genderSelect && !genderSelect.value) {
            const genderDigit = parseInt(nid[12], 10);
            genderSelect.value = (genderDigit % 2 === 1) ? 'Male' : 'Female';
          }
        }
      });
    }
  }

  // Step 2B: Render Manager Portal (For direct manager evaluating or updating their team)
  async function renderManagerPortal(manager, empsFilterStr) {
    if (verifySection) verifySection.style.display = 'none';
    if (formSection) formSection.style.display = 'none';
    if (managerPortalSection) managerPortalSection.style.display = 'block';

    const mgrName = manager.employee_name_ar || manager.employee_name || 'المدير المباشر';
    if (mgrPortalName) mgrPortalName.textContent = mgrName;
    if (mgrPortalId) mgrPortalId.textContent = `${manager.id} (${manager.job_title || manager.job_post || 'مدير مباشر'})`;

    if (managerTeamCards) {
      managerTeamCards.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #64748b;">
          <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.75rem; color: var(--accent); margin-bottom: 0.5rem;"></i>
          <p>جاري تحميل بيانات وأعضاء فريق العمل...</p>
        </div>
      `;
    }

    let team = [];
    try {
      // 1. Fetch team by manager_id (Id manager)
      const cleanMgrId = String(manager.id).trim();
      let { data, error } = await client
        .from('employees')
        .select('*')
        .eq('manager_id', cleanMgrId)
        .order('id', { ascending: true });

      // Fallback: If no records match manager_id yet, fallback to manager name
      if (!data || data.length === 0) {
        const mgrNameEn = manager.employee_name;
        const mgrNameAr = manager.employee_name_ar;
        let query = client.from('employees').select('*');
        if (mgrNameEn && mgrNameAr) {
          query = query.or(`manager.eq."${mgrNameEn}",manager.eq."${mgrNameAr}"`);
        } else if (mgrNameEn) {
          query = query.eq('manager', mgrNameEn);
        }
        const res = await query.order('id', { ascending: true });
        if (res.data && res.data.length > 0) {
          data = res.data;
        }
      }

      team = data || [];
    } catch (err) {
      console.error('Error fetching manager team:', err);
    }

    // If specific subset was requested in the URL (emps=...)
    if (empsFilterStr) {
      const allowedSet = new Set(empsFilterStr.split(',').map(s => s.trim().toLowerCase()));
      team = team.filter(emp => allowedSet.has(String(emp.id).toLowerCase()));
    }

    currentTeamEmployees = team;

    if (mgrPortalTeamCount) {
      mgrPortalTeamCount.textContent = `${team.length} موظف`;
    }

    if (team.length === 0) {
      managerTeamCards.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; background: #f8fafc; border-radius: var(--radius-md); border: 1px dashed #cbd5e1;">
          <i class="fa-solid fa-users-slash" style="font-size: 2.5rem; color: #94a3b8; margin-bottom: 0.75rem;"></i>
          <h4 style="color: #334155; margin-bottom: 0.35rem;">لا يوجد موظفون تابعون لهذا الكود حالياً</h4>
          <p style="color: #64748b; font-size: 0.85rem; max-width: 420px; margin: 0 auto;">
            لم يتم العثور على موظفين مسجلين بكود المدير (Id manager: ${manager.id}). يرجى التأكد من إدارة الموارد البشرية (HR).
          </p>
        </div>
      `;
      if (btnManagerSubmitAll) btnManagerSubmitAll.style.display = 'none';
      return;
    }

    if (btnManagerSubmitAll) btnManagerSubmitAll.style.display = 'flex';

    // Render team member cards
    managerTeamCards.innerHTML = team.map((emp, index) => {
      const empName = emp.employee_name_ar || emp.employee_name || 'موظف';
      const firstLetter = empName.trim().charAt(0) || 'م';
      const jobDesc = [emp.job_title || emp.job_post, emp.department].filter(Boolean).join(' • ') || 'طاقة غاز';

      const fieldsHtml = targetFields.map(key => {
        const meta = FIELD_DICTIONARY[key];
        if (!meta) return '';

        let inputHtml = '';
        if (meta.type === 'select') {
          const optionsHtml = meta.options.map(opt => {
            const isSelected = emp[key] && String(emp[key]).trim().toLowerCase() === String(opt.value).trim().toLowerCase();
            return `<option value="${opt.value}" ${isSelected ? 'selected' : ''}>${opt.label}</option>`;
          }).join('');

          inputHtml = `
            <select class="form-control" data-emp-id="${emp.id}" data-field="${key}">
              ${optionsHtml}
            </select>
          `;
        } else {
          let val = emp[key] || '';
          if (meta.type === 'date' && val) val = formatDateForInput(val);

          inputHtml = `
            <input 
              type="${meta.type || 'text'}" 
              class="form-control" 
              data-emp-id="${emp.id}" 
              data-field="${key}" 
              value="${val ? String(val).replace(/"/g, '&quot;') : ''}" 
              placeholder="${meta.placeholder || ''}"
            />
          `;
        }

        return `
          <div class="field-group" style="margin-bottom: 0.5rem;">
            <label class="field-label" style="font-size: 0.8rem; margin-bottom: 0.25rem;">
              <span><i class="fa-solid ${meta.icon} text-primary" style="margin-left: 5px;"></i> ${meta.label}</span>
            </label>
            ${inputHtml}
          </div>
        `;
      }).join('');

      return `
        <div class="team-member-card" style="background: #ffffff; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.15rem; box-shadow: var(--shadow-sm); transition: var(--transition);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.75rem; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #028090, #002060); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.95rem;">
                ${firstLetter}
              </div>
              <div>
                <div style="font-weight: 700; color: var(--navy-900); font-size: 0.95rem;">
                  <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 4px;">#${index + 1}</span>
                  ${empName}
                </div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">${jobDesc}</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-family: monospace; font-weight: 700; background: #e0f2fe; color: #0369a1; padding: 0.2rem 0.55rem; border-radius: 4px; font-size: 0.82rem;">
                كود: ${emp.id}
              </span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem;">
            ${fieldsHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  // Step 3: Handle Form Submission & Route to HR Approval Queue
  updateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentEmployee) return;

    btnSaveUpdate.disabled = true;
    btnSaveUpdate.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>جاري إرسال الطلب للمراجعة...</span>';

    try {
      const formData = new FormData(updateForm);
      const actualChanges = {};
      const actualOriginals = {};
      const changedFields = [];

      // STRICT SECURITY SANITIZATION & PRECISE DIFF CALCULATION:
      targetFields.forEach(key => {
        if (SAFE_EDITABLE_KEYS.includes(key)) {
          const rawVal = formData.get(key);
          const newVal = (rawVal !== null && rawVal !== undefined) ? String(rawVal).trim() : '';

          let oldVal = (currentEmployee[key] !== null && currentEmployee[key] !== undefined)
            ? String(currentEmployee[key]).trim()
            : '';

          let isSame = (newVal === oldVal);

          // For date fields, compare actual parsed timestamps to avoid format mismatch false-positives
          if (!isSame && ['birth_date', 'start_date', 'resignation_date'].includes(key)) {
            const d1 = parseDateRobust(oldVal);
            const d2 = parseDateRobust(newVal);
            if (d1 && d2 && d1.getTime() === d2.getTime()) {
              isSame = true;
            }
          }

          if (!isSame) {
            actualChanges[key] = newVal;
            actualOriginals[key] = oldVal;
            changedFields.push({
              key,
              label: FIELD_DICTIONARY[key]?.label || key,
              oldVal: oldVal || '(فارغ)',
              newVal: newVal || '(فارغ)'
            });
          }
        }
      });

      // Auto-calculate age and birth_month ONLY IF birth_date was ACTUALLY changed by the user
      const birthDateChanged = changedFields.some(f => f.key === 'birth_date');
      if (birthDateChanged && actualChanges.birth_date) {
        const bd = parseDateRobust(actualChanges.birth_date);
        if (bd) {
          actualChanges.birth_month = String(bd.getMonth() + 1);
          actualChanges.age = calculateAge(actualChanges.birth_date);
          actualOriginals.birth_month = currentEmployee.birth_month ? String(currentEmployee.birth_month).trim() : '';
          actualOriginals.age = currentEmployee.age ? String(currentEmployee.age).trim() : '';
        }
      }

      if (changedFields.length === 0) {
        showToast('لم يتم تغيير أي بيانات، البيانات المدخلة مطابقة للمسجل حالياً', 'warning');
        btnSaveUpdate.disabled = false;
        btnSaveUpdate.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span>إرسال طلب التعديل للمراجعة والاعتماد</span>';
        return;
      }

      // Prepare staging record for HR review (Contains ONLY the fields that changed!)
      const requestRecord = {
        employee_id: String(currentEmployee.id),
        employee_name: currentEmployee.employee_name_ar || currentEmployee.employee_name || '',
        requested_changes: actualChanges,
        original_data: actualOriginals,
        status: 'pending',
        submitted_at: new Date().toISOString()
      };

      // Try inserting into Cloud Staging Table
      let isCloudSaved = false;
      try {
        const { data, error } = await client
          .from('employee_update_requests')
          .insert(requestRecord)
          .select()
          .single();

        if (!error && data) {
          isCloudSaved = true;
        }
      } catch (cloudErr) {
        console.warn('Cloud table not created yet, queuing locally:', cloudErr);
      }

      // Also persist to local queue for immediate fallback and multi-tab synchronization
      try {
        const STORAGE_KEY = 'taqa_pending_update_requests';
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        existing.unshift({
          id: 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          ...requestRecord,
          is_local: !isCloudSaved
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      } catch (storageErr) {}

      // Build Summary of submitted fields
      const summaryBox = document.getElementById('submitted-fields-summary');
      if (summaryBox) {
        summaryBox.style.display = 'block';
        summaryBox.innerHTML = `
          <div style="font-weight: 700; color: var(--primary); margin-bottom: 0.5rem;">
            <i class="fa-solid fa-list-check"></i> الحقول التي تم إرسال تعديلاتها للمراجعة (${changedFields.length}):
          </div>
          <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.35rem;">
            ${changedFields.map(f => `
              <li style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--border-color); padding-bottom: 0.25rem;">
                <span style="font-weight: 600; color: var(--text-main);">${f.label}:</span>
                <span style="color: var(--accent); font-weight: 700;">${f.newVal}</span>
              </li>
            `).join('')}
          </ul>
        `;
      }

      // Show Success Phase
      formSection.style.display = 'none';
      successSection.style.display = 'block';

      const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('ar-EG');
      document.getElementById('success-time').textContent = nowTime;

      showToast('تم إرسال طلب التحديث بنجاح للمراجعة والاعتماد!', 'success');

      // Scroll smoothly to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      showToast('حدث خطأ أثناء إرسال الطلب: ' + err.message, 'error');
      btnSaveUpdate.disabled = false;
      btnSaveUpdate.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span>إرسال طلب التعديل للمراجعة والاعتماد</span>';
    }
  });

  // Step 3B: Handle Manager Batch Submission for Team Members
  if (btnManagerSubmitAll) {
    btnManagerSubmitAll.addEventListener('click', async () => {
      if (!currentManager || !currentTeamEmployees || currentTeamEmployees.length === 0) return;

      btnManagerSubmitAll.disabled = true;
      btnManagerSubmitAll.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>جاري إرسال تقييمات وبيانات الفريق...</span>';

      try {
        const teamUpdates = [];
        let totalChangedFieldsCount = 0;

        currentTeamEmployees.forEach(emp => {
          const empInputs = managerTeamCards.querySelectorAll(`[data-emp-id="${emp.id}"]`);
          const actualChanges = {};
          const actualOriginals = {};
          const changedFields = [];

          empInputs.forEach(input => {
            const key = input.getAttribute('data-field');
            if (!key || !SAFE_EDITABLE_KEYS.includes(key)) return;

            const newVal = String(input.value || '').trim();
            const oldVal = (emp[key] !== null && emp[key] !== undefined) ? String(emp[key]).trim() : '';

            let isSame = (newVal === oldVal);

            if (!isSame && ['birth_date', 'start_date', 'resignation_date'].includes(key)) {
              const d1 = parseDateRobust(oldVal);
              const d2 = parseDateRobust(newVal);
              if (d1 && d2 && d1.getTime() === d2.getTime()) isSame = true;
            }

            if (!isSame) {
              actualChanges[key] = newVal;
              actualOriginals[key] = oldVal;
              changedFields.push({
                key,
                label: FIELD_DICTIONARY[key]?.label || key,
                oldVal: oldVal || '(فارغ)',
                newVal: newVal || '(فارغ)'
              });
            }
          });

          if (changedFields.length > 0) {
            totalChangedFieldsCount += changedFields.length;
            teamUpdates.push({
              employee: emp,
              actualChanges,
              actualOriginals,
              changedFields
            });
          }
        });

        if (teamUpdates.length === 0) {
          showToast('لم يتم تعديل أي حقول أو تقييمات لأي موظف!', 'warning');
          btnManagerSubmitAll.disabled = false;
          btnManagerSubmitAll.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span>إرسال بيانات وتقييمات الفريق بالكامل للمراجعة والاعتماد</span>';
          return;
        }

        // Build request records
        const recordsToInsert = teamUpdates.map(u => ({
          employee_id: String(u.employee.id),
          employee_name: u.employee.employee_name_ar || u.employee.employee_name || '',
          requested_changes: u.actualChanges,
          original_data: u.actualOriginals,
          status: 'pending',
          submitted_at: new Date().toISOString(),
          submitted_by: 'manager',
          manager_id: String(currentManager.id)
        }));

        // Send to Cloud Table
        let isCloudSaved = false;
        try {
          const { data, error } = await client
            .from('employee_update_requests')
            .insert(recordsToInsert)
            .select();

          if (!error && data && data.length > 0) {
            isCloudSaved = true;
          }
        } catch (cloudErr) {
          console.warn('Cloud table not ready, queuing locally:', cloudErr);
        }

        // Fallback / sync local storage
        try {
          const STORAGE_KEY = 'taqa_pending_update_requests';
          const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
          recordsToInsert.forEach(rec => {
            existing.unshift({
              id: 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
              ...rec,
              is_local: !isCloudSaved
            });
          });
          localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
        } catch (storageErr) {}

        // Show Success Phase
        if (managerPortalSection) managerPortalSection.style.display = 'none';
        if (successSection) successSection.style.display = 'block';

        const successMsg = document.getElementById('success-message');
        if (successMsg) {
          successMsg.textContent = `تم إرسال تقييمات وتحديثات (${teamUpdates.length}) من موظفي فريق عملك بنجاح إلى إدارة الموارد البشرية (HR) للمراجعة والاعتماد.`;
        }

        // Build Summary of submitted fields grouped by employee
        const summaryBox = document.getElementById('submitted-fields-summary');
        if (summaryBox) {
          summaryBox.style.display = 'block';
          summaryBox.innerHTML = `
            <div style="font-weight: 700; color: var(--primary); margin-bottom: 0.65rem;">
              <i class="fa-solid fa-users-gear text-accent"></i> ملخص التحديثات والتقييمات المرسلة (${teamUpdates.length} موظف - إجمالي ${totalChangedFieldsCount} بيان مُعدّل):
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${teamUpdates.map(u => `
                <div style="background: white; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.65rem 0.85rem;">
                  <div style="font-weight: 700; color: var(--navy-900); font-size: 0.85rem; margin-bottom: 0.35rem; display: flex; justify-content: space-between;">
                    <span>${u.employee.employee_name_ar || u.employee.employee_name}</span>
                    <span style="font-family: monospace; color: var(--primary); font-size: 0.8rem;">كود: ${u.employee.id}</span>
                  </div>
                  <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.25rem;">
                    ${u.changedFields.map(f => `
                      <li style="display: flex; justify-content: space-between; font-size: 0.8rem; border-bottom: 1px dashed #f1f5f9; padding-bottom: 2px;">
                        <span style="color: var(--text-muted);">${f.label}:</span>
                        <span style="color: var(--accent); font-weight: 600;">${f.newVal}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
              `).join('')}
            </div>
          `;
        }

        const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('ar-EG');
        const successTimeEl = document.getElementById('success-time');
        if (successTimeEl) successTimeEl.textContent = nowTime;

        showToast(`تم إرسال تعديلات ${teamUpdates.length} موظف بنجاح!`, 'success');
        window.scrollTo({ top: 0, behavior: 'smooth' });

      } catch (err) {
        showToast('حدث خطأ أثناء إرسال البيانات: ' + err.message, 'error');
        btnManagerSubmitAll.disabled = false;
        btnManagerSubmitAll.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span>إرسال بيانات وتقييمات الفريق بالكامل للمراجعة والاعتماد</span>';
      }
    });
  }

})();
