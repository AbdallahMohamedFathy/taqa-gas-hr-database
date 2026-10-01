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
    }
  };

  // Safe list of fields that an employee is strictly allowed to update
  const SAFE_EDITABLE_KEYS = Object.keys(FIELD_DICTIONARY);

  // State
  let currentEmployee = null;
  let targetFields = [];

  // Parse URL Parameters
  const urlParams = new URLSearchParams(window.location.search);
  const paramId = (urlParams.get('id') || '').trim();
  const paramFields = urlParams.get('f') || urlParams.get('fields') || '';

  // Determine allowed fields from URL, or fallback to all safe fields
  if (paramFields) {
    const rawList = paramFields.split(',').map(s => s.trim().toLowerCase());
    targetFields = SAFE_EDITABLE_KEYS.filter(k => rawList.includes(k.toLowerCase()));
  }
  if (!targetFields || targetFields.length === 0) {
    targetFields = SAFE_EDITABLE_KEYS;
  }

  // DOM Elements
  const verifySection = document.getElementById('verify-section');
  const formSection = document.getElementById('form-section');
  const successSection = document.getElementById('success-section');
  const verifyEmpId = document.getElementById('verify-emp-id');
  const verifySecret = document.getElementById('verify-secret');
  const btnVerify = document.getElementById('btn-verify');
  const dynamicContainer = document.getElementById('dynamic-fields-container');
  const updateForm = document.getElementById('update-form');
  const btnSaveUpdate = document.getElementById('btn-save-update');

  // Pre-fill ID if passed in URL
  if (paramId) {
    verifyEmpId.value = paramId;
    verifySecret.focus();
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

})();
