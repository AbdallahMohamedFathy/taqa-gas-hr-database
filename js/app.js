// Main Application Logic & Event Controller
(function() {
  // App State
  const state = {
    page: 1,
    pageSize: window.APP_CONFIG.DEFAULT_PAGE_SIZE,
    searchQuery: '',
    filters: {
      company: '',
      department: '',
      status: '',
      gender: '',
      company_sector: '',
      division: '',
      job_tree: ''
    },
    sortField: 'id',
    sortAsc: true,
    totalRecords: 0,
    parsedExcelData: null,
    deletingEmployeeId: null,
    editingEmployeeId: null,
    // Column visibility set
    visibleColumns: new Set(window.COLUMN_DEFINITIONS.filter(c => c.defaultVisible !== false).map(c => c.key))
  };

  // DOM Elements Cache
  const els = {
    // Stats
    statTotal: document.getElementById('stat-total'),
    statActive: document.getElementById('stat-active'),
    statCompanies: document.getElementById('stat-companies'),
    statDepartments: document.getElementById('stat-departments'),

    // Search & Filters
    searchInput: document.getElementById('search-input'),
    filterCompany: document.getElementById('filter-company'),
    filterSector: document.getElementById('filter-sector'),
    filterDivision: document.getElementById('filter-division'),
    filterDepartment: document.getElementById('filter-department'),
    filterJobTree: document.getElementById('filter-job-tree'),
    filterStatus: document.getElementById('filter-status'),
    filterGender: document.getElementById('filter-gender'),
    btnResetFilters: document.getElementById('btn-reset-filters'),
    pageSizeSelect: document.getElementById('page-size-select'),
    btnRefresh: document.getElementById('btn-refresh'),

    // Table
    tableHeadRow: document.getElementById('employees-table-head-row'),
    tableBody: document.getElementById('employees-table-body'),
    tableLoader: document.getElementById('table-loader'),
    tableEmpty: document.getElementById('table-empty'),
    filteredCount: document.getElementById('filtered-count'),
    paginationInfo: document.getElementById('pagination-info'),
    paginationControls: document.getElementById('pagination-controls'),

    // Modals
    modalUpload: document.getElementById('modal-upload'),
    modalEmployee: document.getElementById('modal-employee'),
    modalDelete: document.getElementById('modal-delete'),
    modalColumns: document.getElementById('modal-columns'),
    modalLinkGen: document.getElementById('modal-link-gen'),
    modalPendingRequests: document.getElementById('modal-pending-requests'),
    btnOpenLinkGen: document.getElementById('btn-open-link-gen'),
    btnOpenRequests: document.getElementById('btn-open-requests'),
    pendingRequestsBadge: document.getElementById('pending-requests-badge'),
    requestsTableBody: document.getElementById('requests-table-body'),
    requestsLoader: document.getElementById('requests-loader'),
    requestsEmpty: document.getElementById('requests-empty'),
    btnApproveAllPending: document.getElementById('btn-approve-all-pending'),
    btnRefreshRequests: document.getElementById('btn-refresh-requests'),
    btnCopySqlSchema: document.getElementById('btn-copy-sql-schema'),
    btnNoticeCopySql: document.getElementById('btn-notice-copy-sql'),
    requestsCloudNotice: document.getElementById('requests-cloud-notice'),
    tabCountPending: document.getElementById('tab-count-pending'),
    tabCountApproved: document.getElementById('tab-count-approved'),
    tabCountRejected: document.getElementById('tab-count-rejected'),
    modalRequestsTotalCount: document.getElementById('modal-requests-total-count'),
    btnLogout: document.getElementById('btn-logout'),
    hrUserEmail: document.getElementById('hr-user-email'),
    btnOpenUpload: document.getElementById('btn-open-upload'),
    btnOpenAdd: document.getElementById('btn-open-add'),
    btnOpenColumns: document.getElementById('btn-open-columns'),
    btnExportExcel: document.getElementById('btn-export-excel'),

    // Column Picker
    columnsPickerContainer: document.getElementById('columns-picker-container'),
    btnSelectAllCols: document.getElementById('btn-select-all-cols'),
    btnResetCols: document.getElementById('btn-reset-cols'),

    // Upload Elements
    dropzone: document.getElementById('dropzone'),
    fileInput: document.getElementById('excel-file-input'),
    uploadPreview: document.getElementById('upload-preview'),
    previewFilename: document.getElementById('preview-filename'),
    previewValidCount: document.getElementById('preview-valid-count'),
    previewErrors: document.getElementById('preview-errors'),
    btnStartUpload: document.getElementById('btn-start-upload'),
    uploadProgress: document.getElementById('upload-progress'),
    progressText: document.getElementById('progress-text'),
    progressPercentage: document.getElementById('progress-percentage'),
    progressBarFill: document.getElementById('progress-bar-fill'),

    // Employee Form Elements
    employeeForm: document.getElementById('employee-form'),
    employeeModalTitle: document.getElementById('employee-modal-title'),
    btnSaveEmployee: document.getElementById('btn-save-employee'),

    // Delete Modal Elements
    deleteEmployeeName: document.getElementById('delete-employee-name'),
    deleteEmployeeId: document.getElementById('delete-employee-id'),
    btnConfirmDelete: document.getElementById('btn-confirm-delete'),

    // Toast
    toastContainer: document.getElementById('toast-container'),

    // Auth Elements
    authOverlay: document.getElementById('auth-overlay'),
    authForm: document.getElementById('auth-form'),
    authEmail: document.getElementById('auth-email'),
    authPassword: document.getElementById('auth-password'),
    authTogglePwd: document.getElementById('auth-toggle-pwd'),
    authEyeIcon: document.getElementById('auth-eye-icon'),
    authRemember: document.getElementById('auth-remember'),
    authError: document.getElementById('auth-error'),
    authErrorText: document.getElementById('auth-error-text'),
    btnAuthLogin: document.getElementById('btn-auth-login')
  };

  // Toast Notification System
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    else if (type === 'error') icon = 'fa-triangle-exclamation';
    else if (type === 'warning') icon = 'fa-circle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${icon}" style="font-size: 1.15rem;"></i>
      <div style="flex: 1;">${message}</div>
    `;

    els.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // Modal Manager
  function openModal(modalEl) {
    modalEl.classList.add('active');
  }

  function closeModal(modalEl) {
    modalEl.classList.remove('active');
  }

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-close');
      const targetModal = document.getElementById(targetId);
      if (targetModal) closeModal(targetModal);
    });
  });

  [els.modalUpload, els.modalEmployee, els.modalDelete, els.modalColumns, els.modalLinkGen, els.modalPendingRequests].forEach(modal => {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  // Load and refresh stats
  async function loadStats() {
    try {
      const stats = await API.getStatistics();
      els.statTotal.textContent = Number(stats.total).toLocaleString('ar-EG');
      els.statActive.textContent = Number(stats.active).toLocaleString('ar-EG');
      els.statCompanies.textContent = Number(stats.companiesCount).toLocaleString('ar-EG');
      els.statDepartments.textContent = Number(stats.departmentsCount).toLocaleString('ar-EG');
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }

  // Load filter options
  async function loadFilterOptions() {
    try {
      const options = await API.getFilterOptions();

      els.filterCompany.innerHTML = '<option value="">جميع الشركات</option>' +
        options.companies.map(c => `<option value="${c}">${c}</option>`).join('');

      els.filterDepartment.innerHTML = '<option value="">جميع الإدارات</option>' +
        options.departments.map(d => `<option value="${d}">${d}</option>`).join('');

      els.filterStatus.innerHTML = '<option value="">جميع الحالات</option>' +
        options.statuses.map(s => `<option value="${s}">${s}</option>`).join('');

      els.filterSector.innerHTML = '<option value="">جميع القطاعات (Sector)</option>' +
        (options.sectors || []).map(s => `<option value="${s}">${s}</option>`).join('');

      els.filterDivision.innerHTML = '<option value="">جميع القطاعات الرئيسية (Division)</option>' +
        (options.divisions || []).map(d => `<option value="${d}">${d}</option>`).join('');

      els.filterJobTree.innerHTML = '<option value="">كل شجرة الوظائف (Job Tree)</option>' +
        (options.jobTrees || []).map(j => `<option value="${j}">${j}</option>`).join('');
    } catch (err) {
      console.error('Error loading filters:', err);
    }
  }

  // Render Table Headers Dynamically
  function renderTableHeaders() {
    let html = `
      <th class="sticky-action">إجراءات</th>
      <th class="sticky-id sortable" data-field="id">
        <span>كود ID</span>
        <i class="fa-solid fa-sort"></i>
      </th>
    `;

    window.COLUMN_DEFINITIONS.forEach(col => {
      if (col.key === 'id') return; // ID is already sticky on the right
      if (!state.visibleColumns.has(col.key)) return;

      const isCurrentSort = state.sortField === col.key;
      const sortIcon = isCurrentSort 
        ? (state.sortAsc ? 'fa-sort-up' : 'fa-sort-down') 
        : 'fa-sort';

      html += `
        <th class="sortable" data-field="${col.key}" title="${col.label}">
          <span>${col.label}</span>
          <i class="fa-solid ${sortIcon}"></i>
        </th>
      `;
    });

    els.tableHeadRow.innerHTML = html;

    // Attach click events for sorting
    els.tableHeadRow.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.getAttribute('data-field');
        if (state.sortField === field) {
          state.sortAsc = !state.sortAsc;
        } else {
          state.sortField = field;
          state.sortAsc = true;
        }
        renderTableHeaders();
        state.page = 1;
        loadEmployeesTable();
      });
    });
  }

  // Helper to parse dates in DD/MM/YYYY, YYYY-MM-DD, or ISO strings
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

  // Format date for HTML5 <input type="date"> (must be YYYY-MM-DD)
  function formatDateForInput(dateVal) {
    if (!dateVal) return '';
    const d = parseDateRobust(dateVal);
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Format date for Table display (DD/MM/YYYY)
  function formatDateDisplay(dateVal) {
    if (!dateVal) return '';
    const d = parseDateRobust(dateVal);
    if (!d) return String(dateVal);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function getCalculatedAge(birthDateStr) {
    const d = parseDateRobust(birthDateStr);
    if (!d) return '';
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age > 0 ? String(age) : '';
  }

  function getCalculatedYOE(startDateStr, resignationDateStr) {
    const d = parseDateRobust(startDateStr);
    if (!d) return '';
    const end = resignationDateStr ? (parseDateRobust(resignationDateStr) || new Date()) : new Date();
    const diff = end.getTime() - d.getTime();
    if (diff <= 0) return '0';
    return String(Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)));
  }

  // Format Status Badge & Cell Values
  function renderBadgeOrText(key, val, emp) {
    // If YOE or Age are empty, calculate dynamically
    if (key === 'yoe' && (!val || val === '') && emp && emp.start_date) {
      val = getCalculatedYOE(emp.start_date, emp.resignation_date);
    }
    if (key === 'age' && (!val || val === '') && emp && emp.birth_date) {
      val = getCalculatedAge(emp.birth_date);
    }

    if (!val) return '<span style="color: #cbd5e1;">-</span>';

    // Format Dates nicely in the table
    if (['start_date', 'birth_date'].includes(key)) {
      return formatDateDisplay(val);
    }
    if (key === 'resignation_date') {
      const formatted = formatDateDisplay(val);
      return `<span class="badge badge-resigned" style="font-size: 0.8rem;"><i class="fa-solid fa-calendar-xmark me-1"></i> ${formatted}</span>`;
    }

    if (key === 'status') {
      const s = String(val).toLowerCase();
      if (s.includes('active') || s.includes('شغال') || s.includes('قائم')) {
        return `<span class="badge badge-active">${val}</span>`;
      }
      if (s.includes('resigned') || s.includes('مستقيل')) {
        return `<span class="badge badge-resigned">${val}</span>`;
      }
      if (s.includes('personal') || s.includes('خاص')) {
        return `<span class="badge badge-personal">${val}</span>`;
      }
      return `<span class="badge badge-neutral">${val}</span>`;
    }
    return String(val);
  }

  // Helper to render indicator badge for who made the last change
  function renderModifierBadge(emp) {
    const source = API.getModifierSource(emp);
    if (source === 'employee') {
      return `<span class="mod-badge mod-employee" title="آخر تعديل: تم تحديثه من الموظف واعتماده من الـ HR"><i class="fa-solid fa-user-check"></i> موظف</span>`;
    }
    if (source === 'hr') {
      return `<span class="mod-badge mod-hr" title="آخر تعديل: بواسطة مسؤول HR"><i class="fa-solid fa-user-tie"></i> HR</span>`;
    }
    return '';
  }

  // Fetch and Render Table Data (All rows continuously under each other)
  async function loadEmployeesTable() {
    els.tableLoader.style.display = 'block';
    els.tableEmpty.style.display = 'none';
    els.tableBody.innerHTML = '';

    try {
      const result = await API.getEmployees({
        searchQuery: state.searchQuery,
        filters: state.filters,
        sortField: state.sortField,
        sortAsc: state.sortAsc
      });

      els.tableLoader.style.display = 'none';
      state.totalRecords = result.totalCount;
      const count = (result.data || []).length;
      els.filteredCount.textContent = `${count.toLocaleString('ar-EG')} سجل معروض`;

      if (count === 0) {
        els.tableEmpty.style.display = 'block';
        updatePagination(0, result.totalCount);
        return;
      }

      // Render All Rows under each other
      const rowsHtml = result.data.map((emp) => {
        let cellsHtml = `
          <td class="sticky-action">
            <div class="row-actions">
              <button class="action-btn btn-share" title="إنشاء رابط / QR لهذا الموظف" onclick="window.openShareModalForEmployee('${emp.id}')">
                <i class="fa-solid fa-qrcode"></i>
              </button>
              <button class="action-btn btn-edit" title="تعديل الموظف" onclick="window.editEmployee('${emp.id}')">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="action-btn btn-delete" title="حذف الموظف" onclick="window.confirmDeleteEmployee('${emp.id}', '${(emp.employee_name_ar || emp.employee_name || '').replace(/'/g, "\\'")}')">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
          <td class="sticky-id">
            <div class="emp-id-cell">
              <span class="emp-id-val">${emp.id || '-'}</span>
              ${renderModifierBadge(emp)}
            </div>
          </td>
        `;

        window.COLUMN_DEFINITIONS.forEach(col => {
          if (col.key === 'id') return; // Handled in sticky column
          if (!state.visibleColumns.has(col.key)) return;

          const val = emp[col.key];
          cellsHtml += `<td>${renderBadgeOrText(col.key, val, emp)}</td>`;
        });

        return `<tr data-id="${emp.id}">${cellsHtml}</tr>`;
      }).join('');

      els.tableBody.innerHTML = rowsHtml;
      updatePagination(count, result.totalCount);

    } catch (err) {
      els.tableLoader.style.display = 'none';
      els.tableEmpty.style.display = 'block';
      showToast('تعذر جلب البيانات: ' + err.message, 'error');
    }
  }

  // Update Footer Summary (Continuous display, all rows under each other)
  function updatePagination(displayedCount, totalCount) {
    if (!els.paginationInfo) return;
    if (totalCount === 0 || displayedCount === 0) {
      els.paginationInfo.textContent = 'لا توجد سجلات لعرضها';
      if (els.paginationControls) els.paginationControls.innerHTML = '';
      return;
    }

    if (displayedCount === totalCount) {
      els.paginationInfo.innerHTML = `<i class="fa-solid fa-circle-check text-success me-1"></i> عرض كافة السجلات كاملة (<strong>${displayedCount.toLocaleString('ar-EG')}</strong> سجل تحت بعضها)`;
    } else {
      els.paginationInfo.innerHTML = `<i class="fa-solid fa-filter text-primary me-1"></i> تم تصفية وعرض <strong>${displayedCount.toLocaleString('ar-EG')}</strong> سجل من إجمالي <strong>${totalCount.toLocaleString('ar-EG')}</strong>`;
    }

    if (els.paginationControls) {
      els.paginationControls.innerHTML = `
        <button class="page-btn" onclick="document.querySelector('.table-responsive')?.scrollTo({top: 0, behavior: 'smooth'})" title="الرجوع للأعلى" style="width: auto; padding: 0.35rem 0.85rem; border-radius: 6px; font-size: 0.82rem; display: flex; align-items: center; gap: 0.4rem; background: #ffffff; border: 1px solid #cbd5e1; cursor: pointer;">
          <i class="fa-solid fa-arrow-up text-primary"></i>
          <span>الرجوع لأعلى الجدول</span>
        </button>
      `;
    }
  }

  window.goToPage = function() {};

  // Debounced Live Search
  let searchTimeout = null;
  els.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.searchQuery = e.target.value.trim();
      loadEmployeesTable();
    }, 350);
  });

  // Filter Change Listeners
  [els.filterCompany, els.filterSector, els.filterDivision, els.filterDepartment,
   els.filterJobTree, els.filterStatus, els.filterGender].forEach(select => {
    select.addEventListener('change', () => {
      state.filters.company = els.filterCompany.value;
      state.filters.department = els.filterDepartment.value;
      state.filters.status = els.filterStatus.value;
      state.filters.gender = els.filterGender.value;
      state.filters.company_sector = els.filterSector.value;
      state.filters.division = els.filterDivision.value;
      state.filters.job_tree = els.filterJobTree.value;
      loadEmployeesTable();
    });
  });

  // Reset Filters
  els.btnResetFilters.addEventListener('click', () => {
    els.searchInput.value = '';
    els.filterCompany.value = '';
    els.filterSector.value = '';
    els.filterDivision.value = '';
    els.filterDepartment.value = '';
    els.filterJobTree.value = '';
    els.filterStatus.value = '';
    els.filterGender.value = '';
    state.searchQuery = '';
    state.filters = { company: '', department: '', status: '', gender: '', company_sector: '', division: '', job_tree: '' };
    loadEmployeesTable();
    showToast('تمت إعادة ضبط جميع الفلاتر', 'info');
  });

  // Page Size Change (Legacy safeguard)
  if (els.pageSizeSelect) {
    els.pageSizeSelect.addEventListener('change', () => {
      loadEmployeesTable();
    });
  }

  // Refresh Button
  els.btnRefresh.addEventListener('click', () => {
    loadEmployeesTable();
    loadStats();
    loadFilterOptions();
    showToast('تم تحديث البيانات بنجاح', 'success');
  });

  // ==========================================
  // COLUMN PICKER WORKFLOW
  // ==========================================
  function initColumnPicker() {
    els.columnsPickerContainer.innerHTML = window.COLUMN_DEFINITIONS.map(col => {
      const isChecked = state.visibleColumns.has(col.key);
      const isLocked = col.key === 'id'; // ID is always visible
      return `
        <label class="column-checkbox-card">
          <input type="checkbox" value="${col.key}" ${isChecked ? 'checked' : ''} ${isLocked ? 'disabled' : ''}>
          <span><strong>${col.label}</strong> ${col.labelAr ? `<span style="color: var(--text-muted); font-size: 0.76rem;">(${col.labelAr})</span>` : ''}</span>
        </label>
      `;
    }).join('');

    els.columnsPickerContainer.querySelectorAll('input[type="checkbox"]').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const key = e.target.value;
        if (e.target.checked) {
          state.visibleColumns.add(key);
        } else {
          state.visibleColumns.delete(key);
        }
        renderTableHeaders();
        loadEmployeesTable();
      });
    });
  }

  els.btnOpenColumns.addEventListener('click', () => {
    initColumnPicker();
    openModal(els.modalColumns);
  });

  els.btnSelectAllCols.addEventListener('click', () => {
    window.COLUMN_DEFINITIONS.forEach(c => state.visibleColumns.add(c.key));
    initColumnPicker();
    renderTableHeaders();
    loadEmployeesTable();
  });

  els.btnResetCols.addEventListener('click', () => {
    state.visibleColumns = new Set(window.COLUMN_DEFINITIONS.filter(c => c.defaultVisible !== false).map(c => c.key));
    initColumnPicker();
    renderTableHeaders();
    loadEmployeesTable();
  });

  // ==========================================
  // EXCEL UPLOAD WORKFLOW
  // ==========================================
  els.btnOpenUpload.addEventListener('click', () => {
    state.parsedExcelData = null;
    els.fileInput.value = '';
    els.uploadPreview.style.display = 'none';
    els.uploadProgress.style.display = 'none';
    els.btnStartUpload.disabled = true;
    openModal(els.modalUpload);
  });

  els.dropzone.addEventListener('click', () => els.fileInput.click());

  els.dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    els.dropzone.classList.add('dragover');
  });

  els.dropzone.addEventListener('dragleave', () => {
    els.dropzone.classList.remove('dragover');
  });

  els.dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    els.dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  });

  els.fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  });

  async function processSelectedFile(file) {
    els.uploadPreview.style.display = 'block';
    els.previewFilename.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    els.previewValidCount.textContent = 'جاري قراءة وتجهيز الـ 44 حقلاً...';
    els.previewErrors.innerHTML = '';
    els.btnStartUpload.disabled = true;

    try {
      const parsed = await ExcelHandler.parseFile(file);
      state.parsedExcelData = parsed;

      els.previewValidCount.textContent = `${parsed.validCount.toLocaleString('ar-EG')} موظف صالح للرفع`;
      els.previewValidCount.className = 'badge badge-active';

      if (parsed.errors.length > 0) {
        els.previewErrors.innerHTML = `⚠️ تنبيهات (${parsed.errors.length}):<br>` + parsed.errors.slice(0, 5).join('<br>') + (parsed.errors.length > 5 ? `<br>وغيرها ${parsed.errors.length - 5}...` : '');
      }

      els.btnStartUpload.disabled = parsed.validCount === 0;
      showToast(`تم التعرف على ${parsed.validCount} موظف بجميع بياناتهم!`, 'success');
    } catch (err) {
      els.previewValidCount.textContent = 'خطأ في معالجة الملف';
      els.previewValidCount.className = 'badge badge-resigned';
      els.previewErrors.innerHTML = err.message;
      showToast(err.message, 'error');
    }
  }

  els.btnStartUpload.addEventListener('click', async () => {
    if (!state.parsedExcelData || state.parsedExcelData.validCount === 0) return;

    const strategy = document.querySelector('input[name="sync-strategy"]:checked').value;
    els.btnStartUpload.disabled = true;
    els.uploadProgress.style.display = 'block';
    els.progressBarFill.style.width = '0%';
    els.progressPercentage.textContent = '0%';
    els.progressText.textContent = 'جاري الاتصال بالسحابة...';

    try {
      if (strategy === 'overwrite') {
        els.progressText.textContent = 'جاري تفريغ قاعدة البيانات السحابية واستبدال السجلات...';
        await API.clearAllEmployees();
      }

      await API.batchUpsert(state.parsedExcelData.records, (completed, total) => {
        const pct = Math.round((completed / total) * 100);
        els.progressBarFill.style.width = `${pct}%`;
        els.progressPercentage.textContent = `${pct}%`;
        els.progressText.textContent = `تم رفع وتحديث ${completed} من إجمالي ${total} موظف...`;
      });

      showToast(`اكتملت المزامنة بنجاح! تم رفع وتحديث ${state.parsedExcelData.validCount} موظف.`, 'success');
      setTimeout(() => {
        closeModal(els.modalUpload);
        loadEmployeesTable();
        loadStats();
        loadFilterOptions();
      }, 700);

    } catch (err) {
      els.progressText.textContent = 'حدث خطأ أثناء الرفع!';
      els.btnStartUpload.disabled = false;
      showToast('خطأ: ' + err.message, 'error');
    }
  });

  // ==========================================
  // ADD / EDIT EMPLOYEE WORKFLOW
  // ==========================================
  els.btnOpenAdd.addEventListener('click', async () => {
    state.editingEmployeeId = null;
    els.employeeForm.reset();
    document.getElementById('inp-id').readOnly = false;
    els.employeeModalTitle.innerHTML = '<i class="fa-solid fa-user-plus text-primary"></i> <span>إضافة موظف جديد</span>';
    openModal(els.modalEmployee);
  });

  window.editEmployee = async function(id) {
    state.editingEmployeeId = id;
    els.employeeForm.reset();
    openModal(els.modalEmployee);
    els.employeeModalTitle.innerHTML = `<i class="fa-solid fa-user-pen text-primary"></i> <span>تعديل بيانات الموظف (كود: ${id})</span>`;

    try {
      const emp = await API.getEmployeeById(id);
      if (!emp) throw new Error('لم يتم العثور على بيانات الموظف');

      Object.keys(emp).forEach(key => {
        const input = document.getElementById(`inp-${key}`);
        if (input) {
          if (input.type === 'date') {
            input.value = formatDateForInput(emp[key]);
          } else {
            input.value = emp[key] != null ? emp[key] : '';
          }
        }
      });

      // Auto-compute YOE, Age, Birth Month if not yet filled
      const modalBirthInp = document.getElementById('inp-birth_date');
      const modalStartInp = document.getElementById('inp-start_date');
      const modalResignInp = document.getElementById('inp-resignation_date');
      const modalAgeInp = document.getElementById('inp-age');
      const modalMonthInp = document.getElementById('inp-birth_month');
      const modalYoeInp = document.getElementById('inp-yoe');

      if (modalBirthInp && modalBirthInp.value) {
        if (modalAgeInp && (!modalAgeInp.value || modalAgeInp.value === '')) {
          modalAgeInp.value = getCalculatedAge(modalBirthInp.value);
        }
        if (modalMonthInp && (!modalMonthInp.value || modalMonthInp.value === '')) {
          const bd = parseDateRobust(modalBirthInp.value);
          if (bd) modalMonthInp.value = String(bd.getMonth() + 1);
        }
      }

      if (modalStartInp && modalStartInp.value) {
        if (modalYoeInp && (!modalYoeInp.value || modalYoeInp.value === '')) {
          modalYoeInp.value = getCalculatedYOE(modalStartInp.value, modalResignInp ? modalResignInp.value : '');
        }
      }

      document.getElementById('inp-id').readOnly = true;
    } catch (err) {
      showToast('تعذر جلب تفاصيل الموظف: ' + err.message, 'error');
      closeModal(els.modalEmployee);
    }
  };

  els.btnSaveEmployee.addEventListener('click', async (e) => {
    e.preventDefault();
    const form = els.employeeForm;

    const idVal = document.getElementById('inp-id').value.trim();
    const nameVal = document.getElementById('inp-employee_name').value.trim();
    if (!idVal) {
      showToast('يرجى إدخال كود الموظف (ID)', 'warning');
      document.getElementById('inp-id').focus();
      return;
    }
    if (!nameVal) {
      showToast('يرجى إدخال اسم الموظف بالإنجليزية', 'warning');
      document.getElementById('inp-employee_name').focus();
      return;
    }

    const formData = new FormData(form);
    const employeeData = {};
    formData.forEach((val, key) => {
      employeeData[key] = val ? String(val).trim() : null;
    });

    // توحيد إملاء أسماء الشركات والقطاعات
    if (typeof window.normalizeEmployeeRecord === 'function') {
      window.normalizeEmployeeRecord(employeeData);
    }

    els.btnSaveEmployee.disabled = true;
    els.btnSaveEmployee.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>جاري الحفظ...</span>';

    try {
      await API.upsertEmployee(employeeData);
      showToast('تم حفظ كافة البيانات في قاعدة البيانات بنجاح!', 'success');
      closeModal(els.modalEmployee);
      loadEmployeesTable();
      loadStats();
      loadFilterOptions();
    } catch (err) {
      showToast('خطأ في حفظ البيانات: ' + err.message, 'error');
    } finally {
      els.btnSaveEmployee.disabled = false;
      els.btnSaveEmployee.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> <span>حفظ البيانات في السحابة</span>';
    }
  });

  // ==========================================
  // DELETE EMPLOYEE WORKFLOW
  // ==========================================
  window.confirmDeleteEmployee = function(id, name) {
    state.deletingEmployeeId = id;
    els.deleteEmployeeId.textContent = id;
    els.deleteEmployeeName.textContent = name || 'غير مسمى';
    openModal(els.modalDelete);
  };

  els.btnConfirmDelete.addEventListener('click', async () => {
    if (!state.deletingEmployeeId) return;

    els.btnConfirmDelete.disabled = true;
    els.btnConfirmDelete.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>جاري الحذف...</span>';

    try {
      await API.deleteEmployee(state.deletingEmployeeId);
      showToast(`تم حذف الموظف (كود ${state.deletingEmployeeId}) بنجاح`, 'success');
      closeModal(els.modalDelete);
      loadEmployeesTable();
      loadStats();
      loadFilterOptions();
    } catch (err) {
      showToast('فشل حذف الموظف: ' + err.message, 'error');
    } finally {
      els.btnConfirmDelete.disabled = false;
      els.btnConfirmDelete.innerHTML = '<i class="fa-solid fa-trash-can"></i> <span>نعم، قم بالحذف</span>';
    }
  });

  // ==========================================
  // EXPORT EXCEL WORKFLOW
  // ==========================================
  els.btnExportExcel.addEventListener('click', async () => {
    els.btnExportExcel.disabled = true;
    els.btnExportExcel.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>جاري التصدير...</span>';

    try {
      const records = await API.getAllForExport(state.searchQuery, state.filters, state.sortField, state.sortAsc);
      if (!records || records.length === 0) {
        showToast('لا توجد بيانات مطابقة لتصديرها!', 'warning');
        return;
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const colsToExport = state.visibleColumns && state.visibleColumns.size > 0 ? state.visibleColumns : null;
      const countCols = colsToExport ? colsToExport.size : window.COLUMN_DEFINITIONS.length;

      ExcelHandler.exportToExcel(records, `TAQA_Gas_Employees_${dateStr}.xlsx`, colsToExport);
      
      const hasFilters = !!state.searchQuery || Object.values(state.filters).some(Boolean);
      const filterNote = hasFilters ? ' (حسب نتائج البحث والفلترة)' : '';
      showToast(`تم تصدير ${records.length.toLocaleString('ar-EG')} موظف و ${countCols} عمود مختار بنجاح!${filterNote}`, 'success');
    } catch (err) {
      showToast('خطأ أثناء تصدير الإكسيل: ' + err.message, 'error');
    } finally {
      els.btnExportExcel.disabled = false;
      els.btnExportExcel.innerHTML = '<i class="fa-solid fa-download"></i> <span>تصدير إكسيل</span>';
    }
  });

  // ==========================================
  // REAL-TIME AUTO-CALCULATION IN MODAL
  // ==========================================
  const liveBirthInp = document.getElementById('inp-birth_date');
  const liveStartInp = document.getElementById('inp-start_date');
  const liveResignInp = document.getElementById('inp-resignation_date');
  const liveAgeInp = document.getElementById('inp-age');
  const liveMonthInp = document.getElementById('inp-birth_month');
  const liveYoeInp = document.getElementById('inp-yoe');
  const liveNidInp = document.getElementById('inp-national_id');
  const liveGenderInp = document.getElementById('inp-gender');

  function updateLiveYOE() {
    if (liveStartInp && liveStartInp.value) {
      liveYoeInp.value = getCalculatedYOE(liveStartInp.value, liveResignInp ? liveResignInp.value : '');
    } else {
      liveYoeInp.value = '';
    }
  }

  function updateLiveAge() {
    if (liveBirthInp && liveBirthInp.value) {
      liveAgeInp.value = getCalculatedAge(liveBirthInp.value);
      const bd = parseDateRobust(liveBirthInp.value);
      if (bd && liveMonthInp) {
        liveMonthInp.value = String(bd.getMonth() + 1);
      }
    } else {
      liveAgeInp.value = '';
      liveMonthInp.value = '';
    }
  }

  if (liveStartInp) liveStartInp.addEventListener('change', updateLiveYOE);
  if (liveResignInp) liveResignInp.addEventListener('change', updateLiveYOE);
  if (liveBirthInp) liveBirthInp.addEventListener('change', updateLiveAge);

  // Auto-extract Birth Date, Month, Age & Gender from 14-digit Egyptian National ID
  if (liveNidInp) {
    liveNidInp.addEventListener('input', () => {
      const nid = liveNidInp.value.trim();
      if (/^[23]\d{13}$/.test(nid)) {
        const century = nid[0] === '2' ? '19' : '20';
        const year = century + nid.slice(1, 3);
        const month = nid.slice(3, 5);
        const day = nid.slice(5, 7);
        const formatted = `${year}-${month}-${day}`;
        const dt = parseDateRobust(formatted);
        if (dt && !isNaN(dt.getTime())) {
          if (liveBirthInp && !liveBirthInp.value) {
            liveBirthInp.value = formatted;
            updateLiveAge();
          }
        }
        if (liveGenderInp && !liveGenderInp.value) {
          const genderDigit = parseInt(nid[12], 10);
          liveGenderInp.value = (genderDigit % 2 === 1) ? 'Male' : 'Female';
        }
      }
    });
  }


  // ==========================================
  // LINK & QR CODE GENERATOR WORKFLOW
  // ==========================================
  let qrCodeInstance = null;

  const linkTabs = {
    general: document.getElementById('tab-link-general'),
    specific: document.getElementById('tab-link-specific'),
    manager: document.getElementById('tab-link-manager')
  };
  const specificBox = document.getElementById('specific-emp-box');
  const specificInput = document.getElementById('gen-specific-id');
  const btnFetchSpecific = document.getElementById('btn-fetch-specific-emp');
  const specificPreview = document.getElementById('specific-emp-preview');

  // Manager Elements
  const managerBox = document.getElementById('manager-emp-box');
  const managerInput = document.getElementById('gen-manager-id');
  const btnFetchManagerTeam = document.getElementById('btn-fetch-manager-team');
  const managerInfoPreview = document.getElementById('manager-info-preview');
  const managerTeamContainer = document.getElementById('manager-team-container');
  const managerTeamList = document.getElementById('manager-team-list');
  const managerTeamCount = document.getElementById('manager-team-count');
  const btnTeamSelectAll = document.getElementById('btn-team-select-all');
  const btnTeamClearAll = document.getElementById('btn-team-clear-all');

  const fieldsCheckboxesContainer = document.getElementById('gen-fields-checkboxes');
  const qrDisplay = document.getElementById('qr-code-display');
  const genUrlInput = document.getElementById('gen-url-input');
  const btnCopyGenLink = document.getElementById('btn-copy-gen-link');
  const btnDownloadQr = document.getElementById('btn-download-qr');
  const btnPreviewLink = document.getElementById('btn-preview-link');

  // Quick preset buttons
  const btnQuickContact = document.getElementById('btn-quick-contact');
  const btnQuickIdentity = document.getElementById('btn-quick-identity');
  const btnQuickAppraisal = document.getElementById('btn-quick-appraisal');
  const btnQuickAll = document.getElementById('btn-quick-all');
  const btnQuickClear = document.getElementById('btn-quick-clear');

  let linkGenState = {
    type: 'general', // 'general', 'specific', 'manager'
    specificId: '',
    managerId: '',
    teamEmployees: [],
    selectedTeamIds: new Set()
  };

  function getSelectedFieldKeys() {
    const checked = [];
    fieldsCheckboxesContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(chk => {
      checked.push(chk.value);
    });
    return checked;
  }

  function setCheckedFields(keys) {
    fieldsCheckboxesContainer.querySelectorAll('input[type="checkbox"]').forEach(chk => {
      chk.checked = keys.includes(chk.value);
    });
    updateGeneratedLinkAndQR();
  }

  if (btnQuickContact) {
    btnQuickContact.addEventListener('click', () => {
      setCheckedFields(['mobile_numbers', 'bank_name', 'account_numbers', 'insurance_number', 'floor', 'telephone_extension', 'email']);
    });
  }

  if (btnQuickIdentity) {
    btnQuickIdentity.addEventListener('click', () => {
      setCheckedFields(['employee_name_ar', 'national_id', 'birth_date', 'gender']);
    });
  }

  if (btnQuickAppraisal) {
    btnQuickAppraisal.addEventListener('click', () => {
      setCheckedFields(['pa_2024', 'pa_2025', 'promo_2024', 'promo_2025', 'promo_2026', 'job_title', 'job_post', 'managerial_level']);
    });
  }

  if (btnQuickAll) {
    btnQuickAll.addEventListener('click', () => {
      fieldsCheckboxesContainer.querySelectorAll('input[type="checkbox"]').forEach(chk => chk.checked = true);
      updateGeneratedLinkAndQR();
    });
  }

  if (btnQuickClear) {
    btnQuickClear.addEventListener('click', () => {
      fieldsCheckboxesContainer.querySelectorAll('input[type="checkbox"]').forEach(chk => chk.checked = false);
      updateGeneratedLinkAndQR();
    });
  }

  // Tab switching
  function switchLinkTab(type) {
    linkGenState.type = type;
    Object.keys(linkTabs).forEach(k => {
      if (linkTabs[k]) linkTabs[k].classList.toggle('active', k === type);
    });

    if (specificBox) specificBox.style.display = type === 'specific' ? 'block' : 'none';
    if (managerBox) managerBox.style.display = type === 'manager' ? 'flex' : 'none';

    if (type === 'manager') {
      if (managerInput) managerInput.focus();
      // Preset appraisal fields for convenience
      setCheckedFields(['pa_2024', 'pa_2025', 'promo_2024', 'promo_2025', 'promo_2026', 'job_title', 'job_post', 'managerial_level']);
    } else if (type === 'specific') {
      if (specificInput) specificInput.focus();
    }
    updateGeneratedLinkAndQR();
  }

  if (linkTabs.general) linkTabs.general.addEventListener('click', () => switchLinkTab('general'));
  if (linkTabs.specific) linkTabs.specific.addEventListener('click', () => switchLinkTab('specific'));
  if (linkTabs.manager) linkTabs.manager.addEventListener('click', () => switchLinkTab('manager'));

  // Specific employee input change
  if (specificInput) {
    specificInput.addEventListener('input', () => {
      linkGenState.specificId = specificInput.value.trim();
      if (specificPreview) specificPreview.style.display = 'none';
      updateGeneratedLinkAndQR();
    });
  }

  // Fetch and verify specific employee ID
  if (btnFetchSpecific) {
    btnFetchSpecific.addEventListener('click', async () => {
      const id = specificInput.value.trim();
      if (!id) {
        showToast('يرجى إدخال كود الموظف أولاً', 'warning');
        return;
      }
      try {
        const emp = await API.getEmployeeById(id);
        if (emp) {
          const name = emp.employee_name_ar || emp.employee_name || 'موظف';
          specificPreview.textContent = `تم العثور على الموظف: ${name} (${emp.job_title || emp.job_post || ''})`;
          specificPreview.style.display = 'block';
          showToast(`تم التعرف على كود الموظف: ${name}`, 'success');
        } else {
          specificPreview.textContent = 'كود الموظف غير موجود بقاعدة البيانات!';
          specificPreview.style.display = 'block';
          specificPreview.style.color = '#dc2626';
        }
      } catch (e) {
        showToast('خطأ أثناء فحص الكود', 'error');
      }
    });
  }

  // Manager Input & Team Fetching
  async function fetchAndRenderManagerTeam() {
    const mgrId = managerInput.value.trim();
    if (!mgrId) {
      showToast('يرجى إدخال كود المدير المباشر (Id manager)', 'warning');
      return;
    }

    btnFetchManagerTeam.disabled = true;
    btnFetchManagerTeam.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>جاري البحث...</span>';

    try {
      const { manager, team } = await API.getTeamByManager(mgrId);
      btnFetchManagerTeam.disabled = false;
      btnFetchManagerTeam.innerHTML = '<i class="fa-solid fa-users-viewfinder"></i> <span>جلب فريق العمل</span>';

      if (!manager && (!team || team.length === 0)) {
        managerInfoPreview.textContent = `لم يتم العثور على مدير أو موظفين مسجلين بكود المدير: ${mgrId}`;
        managerInfoPreview.style.display = 'block';
        managerInfoPreview.style.color = '#dc2626';
        managerTeamContainer.style.display = 'none';
        return;
      }

      linkGenState.managerId = mgrId;
      linkGenState.teamEmployees = team || [];
      linkGenState.selectedTeamIds = new Set((team || []).map(e => String(e.id)));

      const mgrName = manager ? (manager.employee_name_ar || manager.employee_name) : mgrId;
      managerInfoPreview.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> المدير: <strong>${mgrName}</strong> (${manager?.job_title || manager?.job_post || 'مدير مباشر'})`;
      managerInfoPreview.style.display = 'block';
      managerInfoPreview.style.color = '#028090';

      // Render Team list
      if (team && team.length > 0) {
        managerTeamCount.textContent = `${team.length.toLocaleString('ar-EG')} موظف`;
        managerTeamList.innerHTML = team.map(emp => `
          <label style="display: flex; align-items: center; justify-content: space-between; padding: 0.35rem 0.5rem; border-radius: 4px; border-bottom: 1px dashed #e2e8f0; cursor: pointer; font-size: 0.85rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <input type="checkbox" class="team-member-chk" value="${emp.id}" checked>
              <span><strong>${emp.employee_name_ar || emp.employee_name}</strong> <small style="color: #64748b;">(${emp.job_title || emp.job_post || 'موظف'})</small></span>
            </div>
            <span style="font-family: monospace; font-size: 0.78rem; font-weight: 700; color: var(--primary);">${emp.id}</span>
          </label>
        `).join('');

        // Attach change listeners to team checkboxes
        managerTeamList.querySelectorAll('.team-member-chk').forEach(chk => {
          chk.addEventListener('change', () => {
            if (chk.checked) {
              linkGenState.selectedTeamIds.add(chk.value);
            } else {
              linkGenState.selectedTeamIds.delete(chk.value);
            }
            updateGeneratedLinkAndQR();
          });
        });

        managerTeamContainer.style.display = 'block';
        showToast(`تم العثور على ${team.length} موظف تابع للمدير`, 'success');
      } else {
        managerTeamCount.textContent = '0 موظف';
        managerTeamList.innerHTML = '<div style="color: #64748b; font-size: 0.82rem; text-align: center; padding: 0.5rem;">لا يوجد موظفون مسجلون تحت هذا المدير بعد</div>';
        managerTeamContainer.style.display = 'block';
      }

      updateGeneratedLinkAndQR();

    } catch (err) {
      btnFetchManagerTeam.disabled = false;
      btnFetchManagerTeam.innerHTML = '<i class="fa-solid fa-users-viewfinder"></i> <span>جلب فريق العمل</span>';
      showToast('خطأ أثناء جلب فريق العمل: ' + err.message, 'error');
    }
  }

  if (btnFetchManagerTeam) btnFetchManagerTeam.addEventListener('click', fetchAndRenderManagerTeam);
  if (managerInput) {
    managerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        fetchAndRenderManagerTeam();
      }
    });
    managerInput.addEventListener('input', () => {
      linkGenState.managerId = managerInput.value.trim();
      updateGeneratedLinkAndQR();
    });
  }

  if (btnTeamSelectAll) {
    btnTeamSelectAll.addEventListener('click', () => {
      managerTeamList.querySelectorAll('.team-member-chk').forEach(chk => {
        chk.checked = true;
        linkGenState.selectedTeamIds.add(chk.value);
      });
      updateGeneratedLinkAndQR();
    });
  }

  if (btnTeamClearAll) {
    btnTeamClearAll.addEventListener('click', () => {
      managerTeamList.querySelectorAll('.team-member-chk').forEach(chk => {
        chk.checked = false;
        linkGenState.selectedTeamIds.delete(chk.value);
      });
      updateGeneratedLinkAndQR();
    });
  }

  // Regenerate URL & QR Code whenever checkboxes change
  if (fieldsCheckboxesContainer) {
    fieldsCheckboxesContainer.addEventListener('change', () => {
      updateGeneratedLinkAndQR();
    });
  }

  function updateGeneratedLinkAndQR() {
    if (!genUrlInput || !qrDisplay) return;

    // Base URL resolving
    let origin = window.location.origin;
    let pathname = window.location.pathname;
    if (pathname.endsWith('/') || pathname.endsWith('\\')) {
      pathname += 'update.html';
    } else if (pathname.includes('.')) {
      pathname = pathname.substring(0, pathname.lastIndexOf('/') + 1) + 'update.html';
    } else {
      pathname += '/update.html';
    }
    const baseUrl = `${origin}${pathname}`;

    const selectedKeys = getSelectedFieldKeys();
    const params = new URLSearchParams();

    if (selectedKeys.length > 0) {
      params.set('f', selectedKeys.join(','));
    }

    if (linkGenState.type === 'specific' && linkGenState.specificId) {
      params.set('id', linkGenState.specificId);
    } else if (linkGenState.type === 'manager' && linkGenState.managerId) {
      params.set('manager_id', linkGenState.managerId);
      // If subset of team is selected, specify the exact IDs
      if (linkGenState.selectedTeamIds.size > 0 && linkGenState.selectedTeamIds.size < linkGenState.teamEmployees.length) {
        params.set('emps', Array.from(linkGenState.selectedTeamIds).join(','));
      }
    }

    const fullUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    genUrlInput.value = fullUrl;

    // Render QR Code using QRCode.js
    qrDisplay.innerHTML = '';
    if (typeof QRCode !== 'undefined') {
      try {
        qrCodeInstance = new QRCode(qrDisplay, {
          text: fullUrl,
          width: 160,
          height: 160,
          colorDark: '#002060',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      } catch (err) {
        console.warn('QRCode render error:', err);
      }
    }
  }

  // Copy Link
  if (btnCopyGenLink) {
    btnCopyGenLink.addEventListener('click', async () => {
      const url = genUrlInput.value;
      if (!url) return;
      try {
        await navigator.clipboard.writeText(url);
        showToast('تم نسخ الرابط إلى الحافظة بنجاح!', 'success');
      } catch (err) {
        genUrlInput.select();
        document.execCommand('copy');
        showToast('تم نسخ الرابط!', 'success');
      }
    });
  }

  // Download QR as PNG
  if (btnDownloadQr) {
    btnDownloadQr.addEventListener('click', () => {
      const img = qrDisplay.querySelector('img') || qrDisplay.querySelector('canvas');
      if (!img) {
        showToast('لم يتم إنشاء رمز QR بعد', 'warning');
        return;
      }
      let dataUrl = '';
      if (img.tagName.toLowerCase() === 'img') {
        dataUrl = img.src;
      } else if (img.tagName.toLowerCase() === 'canvas') {
        dataUrl = img.toDataURL('image/png');
      }
      if (dataUrl) {
        const a = document.createElement('a');
        a.href = dataUrl;
        const targetName = linkGenState.type === 'specific' && linkGenState.specificId 
          ? `TAQA_Gas_QR_Emp_${linkGenState.specificId}.png` 
          : 'TAQA_Gas_General_Update_QR.png';
        a.download = targetName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('جاري تحميل صورة QR Code...', 'info');
      }
    });
  }

  // Preview Link in new tab
  if (btnPreviewLink) {
    btnPreviewLink.addEventListener('click', () => {
      const url = genUrlInput.value;
      if (url) window.open(url, '_blank');
    });
  }

  // Open modal from Header button
  if (els.btnOpenLinkGen) {
    els.btnOpenLinkGen.addEventListener('click', () => {
      linkTabs.general.click();
      openModal(els.modalLinkGen);
      setTimeout(updateGeneratedLinkAndQR, 100);
    });
  }

  // Open modal from Table Row (Specific Employee)
  window.openShareModalForEmployee = function(empId) {
    openModal(els.modalLinkGen);
    linkTabs.specific.click();
    specificInput.value = empId;
    linkGenState.specificId = empId;
    btnFetchSpecific.click();
    updateGeneratedLinkAndQR();
  };

  // ==========================================
  // HR AUTHENTICATION CONTROLLER & SECURITY
  // ==========================================
  // Password Visibility Toggle
  if (els.authTogglePwd && els.authPassword && els.authEyeIcon) {
    els.authTogglePwd.addEventListener('click', () => {
      const isPwd = els.authPassword.type === 'password';
      els.authPassword.type = isPwd ? 'text' : 'password';
      els.authEyeIcon.className = isPwd ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    });
  }

  // Handle Login Form Submit
  if (els.authForm) {
    els.authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = els.authEmail.value.trim();
      const pwd = els.authPassword.value;
      const remember = els.authRemember ? els.authRemember.checked : true;

      els.authError.style.display = 'none';
      els.btnAuthLogin.disabled = true;
      els.btnAuthLogin.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>جاري التحقق من الصلاحيات...</span>';

      try {
        const session = await AuthManager.login(email, pwd, remember);
        showToast('تم تسجيل الدخول بنجاح، مرحباً بك!', 'success');
        
        // Hide overlay and load dashboard
        els.authOverlay.classList.add('hidden');
        if (els.hrUserEmail) els.hrUserEmail.textContent = session.email;
        initDashboard();
      } catch (err) {
        els.authErrorText.textContent = err.message;
        els.authError.style.display = 'flex';
      } finally {
        els.btnAuthLogin.disabled = false;
        els.btnAuthLogin.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> <span>تسجيل الدخول إلى النظام</span>';
      }
    });
  }

  // Handle Logout
  if (els.btnLogout) {
    els.btnLogout.addEventListener('click', () => {
      if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج من لوحة الـ HR؟')) {
        AuthManager.logout();
      }
    });
  }



  // ==========================================
  // EMPLOYEE UPDATE REQUESTS (STAGING & APPROVAL QUEUE)
  // ==========================================
  const SQL_SCHEMA_TEXT = `-- كود إنشاء جدول طلبات الموظفين في Supabase
CREATE TABLE IF NOT EXISTS public.employee_update_requests (
    id BIGSERIAL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    employee_name TEXT,
    requested_changes JSONB NOT NULL,
    original_data JSONB,
    status TEXT NOT NULL DEFAULT 'pending',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    notes TEXT
);

ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS last_modified_by TEXT DEFAULT 'hr',
ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.employee_update_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all employee_update_requests" ON public.employee_update_requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);`;

  let currentRequestsFilter = 'pending';
  let cachedRequests = [];

  async function updateRequestsBadgeCount() {
    if (!els.pendingRequestsBadge) return;
    try {
      const count = await API.getPendingRequestsCount();
      if (count > 0) {
        els.pendingRequestsBadge.style.display = 'inline-flex';
        els.pendingRequestsBadge.textContent = count > 99 ? '99+' : String(count);
      } else {
        els.pendingRequestsBadge.style.display = 'none';
      }
    } catch (e) {
      els.pendingRequestsBadge.style.display = 'none';
    }
  }

  async function loadPendingRequests(statusFilter = 'pending') {
    if (!els.requestsTableBody) return;

    currentRequestsFilter = statusFilter;
    if (els.requestsLoader) els.requestsLoader.style.display = 'block';
    if (els.requestsEmpty) els.requestsEmpty.style.display = 'none';
    els.requestsTableBody.innerHTML = '';

    try {
      const result = await API.getUpdateRequests('all'); // fetch all to calculate tab badges
      cachedRequests = result.requests || [];

      // Cloud notice banner
      if (els.requestsCloudNotice) {
        els.requestsCloudNotice.style.display = result.isCloudAvailable ? 'none' : 'flex';
      }

      // Update Tab Counts
      const pendingCount = cachedRequests.filter(r => r.status === 'pending').length;
      const approvedCount = cachedRequests.filter(r => r.status === 'approved').length;
      const rejectedCount = cachedRequests.filter(r => r.status === 'rejected').length;

      if (els.tabCountPending) els.tabCountPending.textContent = pendingCount;
      if (els.tabCountApproved) els.tabCountApproved.textContent = approvedCount;
      if (els.tabCountRejected) els.tabCountRejected.textContent = rejectedCount;
      if (els.modalRequestsTotalCount) els.modalRequestsTotalCount.textContent = `${cachedRequests.length} طلب`;

      updateRequestsBadgeCount();

      // Filter for active tab
      const displayRequests = (statusFilter === 'all')
        ? cachedRequests
        : cachedRequests.filter(r => r.status === statusFilter);

      if (els.requestsLoader) els.requestsLoader.style.display = 'none';

      if (displayRequests.length === 0) {
        if (els.requestsEmpty) els.requestsEmpty.style.display = 'block';
        return;
      }

      // Render Staging Rows
      const rowsHtml = displayRequests.map(req => {
        const changes = req.requested_changes || {};
        const original = req.original_data || {};
        const changeKeys = Object.keys(changes).filter(k => {
          if (['updated_at', 'id', 'created_at', 'is_local', 'status', 'submitted_at', 'employee_id', 'employee_name'].includes(k)) return false;

          let oldVal = (original[k] !== null && original[k] !== undefined) ? String(original[k]).trim() : '';
          let newVal = (changes[k] !== null && changes[k] !== undefined) ? String(changes[k]).trim() : '';

          if (oldVal === newVal) return false;

          // Date normalization check
          if (['birth_date', 'start_date', 'resignation_date'].includes(k)) {
            const dOld = parseDateRobust(oldVal);
            const dNew = parseDateRobust(newVal);
            if (dOld && dNew && dOld.getTime() === dNew.getTime()) return false;
          }

          // Check if age or birth_month are redundant (only show if birth_date actually changed)
          if (['age', 'birth_month'].includes(k)) {
            const bdOld = parseDateRobust(original['birth_date']);
            const bdNew = parseDateRobust(changes['birth_date']);
            const bdChanged = (bdOld && bdNew) ? (bdOld.getTime() !== bdNew.getTime()) : (changes['birth_date'] && changes['birth_date'] !== original['birth_date']);
            if (!bdChanged) return false;
          }

          return true;
        });

        let diffHtml = '';
        if (changeKeys.length === 0) {
          diffHtml = '<span style="color: var(--text-muted);">(لا توجد تعديلات جديدة)</span>';
        } else {
          diffHtml = '<div class="diff-list">' + changeKeys.map(k => {
            const colDef = window.COLUMN_DEFINITIONS.find(c => c.key === k);
            const label = colDef?.labelAr || colDef?.label || k;
            const oldVal = (original[k] !== null && original[k] !== undefined && String(original[k]).trim() !== '') ? String(original[k]) : '(فارغ)';
            const newVal = (changes[k] !== null && changes[k] !== undefined && String(changes[k]).trim() !== '') ? String(changes[k]) : '(فارغ)';

            return `
              <div class="diff-row">
                <span class="diff-label">${label}:</span>
                <span class="diff-old">${oldVal}</span>
                <i class="fa-solid fa-arrow-left diff-arrow"></i>
                <span class="diff-new">${newVal}</span>
              </div>
            `;
          }).join('') + '</div>';
        }

        // Format Date
        let dateDisplay = '-';
        if (req.submitted_at) {
          const d = new Date(req.submitted_at);
          if (!isNaN(d.getTime())) {
            dateDisplay = d.toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' }) + ' ' + d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
          }
        }

        // Status Pill
        let statusBadge = '';
        if (req.status === 'approved') {
          statusBadge = '<span class="status-pill status-approved"><i class="fa-solid fa-circle-check"></i> معتمد</span>';
        } else if (req.status === 'rejected') {
          statusBadge = '<span class="status-pill status-rejected"><i class="fa-solid fa-circle-xmark"></i> مرفوض</span>';
        } else {
          statusBadge = '<span class="status-pill status-pending"><i class="fa-solid fa-hourglass-half"></i> قيد المراجعة</span>';
        }

        // Actions
        let actionButtons = '';
        if (req.status === 'pending') {
          actionButtons = `
            <div style="display: flex; gap: 0.35rem; justify-content: center;">
              <button type="button" class="btn btn-sm btn-primary" onclick="window.approveSingleRequest('${req.id}')" title="اعتماد التعديل وتطبيقه في قاعدة البيانات فوراً">
                <i class="fa-solid fa-check"></i>
                <span>اعتماد</span>
              </button>
              <button type="button" class="btn btn-sm btn-outline" style="color: var(--danger); border-color: #fca5a5;" onclick="window.rejectSingleRequest('${req.id}')" title="رفض التعديل">
                <i class="fa-solid fa-xmark"></i>
                <span>رفض</span>
              </button>
            </div>
          `;
        } else if (req.status === 'approved') {
          actionButtons = `<span style="font-size: 0.76rem; color: #16a34a; font-weight: 700;"><i class="fa-solid fa-check-double"></i> تم اعتماده وحفظه</span>`;
        } else {
          actionButtons = `<span style="font-size: 0.76rem; color: #dc2626;" title="${req.notes || ''}"><i class="fa-solid fa-ban"></i> مرفوض</span>`;
        }

        return `
          <tr data-req-id="${req.id}">
            <td style="color: var(--text-muted); font-size: 0.78rem;">${dateDisplay}</td>
            <td>
              <div style="font-weight: 700; color: var(--navy-900);">${req.employee_name || 'موظف'}</div>
              <div style="display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; margin-top: 2px;">
                <span style="font-size: 0.75rem; color: var(--primary); font-weight: 600;">كود: ${req.employee_id}</span>
                ${req.submitted_by === 'manager' ? `<span style="background: rgba(2, 128, 144, 0.1); color: #028090; font-size: 0.7rem; font-weight: 600; padding: 1px 6px; border-radius: 4px;" title="تم إرسال هذا التعديل بواسطة المدير المباشر"><i class="fa-solid fa-user-tie"></i> بواسطة المدير (${req.manager_id || ''})</span>` : ''}
              </div>
            </td>
            <td>${diffHtml}</td>
            <td style="text-align: center;">${statusBadge}</td>
            <td style="text-align: center;">${actionButtons}</td>
          </tr>
        `;
      }).join('');

      els.requestsTableBody.innerHTML = rowsHtml;

    } catch (err) {
      if (els.requestsLoader) els.requestsLoader.style.display = 'none';
      if (els.requestsEmpty) els.requestsEmpty.style.display = 'block';
      showToast('تعذر تحميل طلبات الموظفين: ' + err.message, 'error');
    }
  }

  // Global window functions for table action buttons
  window.approveSingleRequest = async function(reqId) {
    const req = cachedRequests.find(r => String(r.id) === String(reqId));
    if (!req) return;

    try {
      await API.approveUpdateRequest(req);
      showToast(`تم اعتماد بيانات الموظف (كود: ${req.employee_id}) وتحديث قاعدة البيانات بنجاح!`, 'success');
      loadPendingRequests(currentRequestsFilter);
      loadEmployeesTable();
      loadStats();
    } catch (err) {
      showToast('حدث خطأ أثناء الاعتماد: ' + err.message, 'error');
    }
  };

  window.rejectSingleRequest = async function(reqId) {
    const req = cachedRequests.find(r => String(r.id) === String(reqId));
    if (!req) return;

    const reason = prompt('سبب رفض طلب التعديل (اختياري):', 'بيانات غير مطابقة');
    if (reason === null) return; // user cancelled

    try {
      await API.rejectUpdateRequest(req, reason);
      showToast(`تم رفض طلب التعديل للموظف (كود: ${req.employee_id})`, 'info');
      loadPendingRequests(currentRequestsFilter);
    } catch (err) {
      showToast('حدث خطأ أثناء الرفض: ' + err.message, 'error');
    }
  };

  function initRequestsWorkflow() {
    updateRequestsBadgeCount();

    // Check periodically for new incoming requests every 30 seconds
    setInterval(updateRequestsBadgeCount, 30000);

    // Open Requests Modal
    if (els.btnOpenRequests) {
      els.btnOpenRequests.addEventListener('click', () => {
        openModal(els.modalPendingRequests);
        loadPendingRequests('pending');
      });
    }

    // Tab buttons click
    document.querySelectorAll('.req-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.req-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const st = tab.getAttribute('data-status');
        loadPendingRequests(st);
      });
    });

    // Refresh Requests List
    if (els.btnRefreshRequests) {
      els.btnRefreshRequests.addEventListener('click', () => {
        loadPendingRequests(currentRequestsFilter);
        showToast('تم تحديث قائمة الطلبات', 'info');
      });
    }

    // Approve All Pending Requests
    if (els.btnApproveAllPending) {
      els.btnApproveAllPending.addEventListener('click', async () => {
        const pendingList = cachedRequests.filter(r => r.status === 'pending');
        if (pendingList.length === 0) {
          showToast('لا توجد طلبات معلقة قيد المراجعة للاعتماد', 'info');
          return;
        }

        if (!confirm(`هل أنت متأكد من رغبتك في اعتماد جميع الطلبات المعلقة (${pendingList.length} طلب) دفعة واحدة وحفظها في قاعدة البيانات؟`)) {
          return;
        }

        els.btnApproveAllPending.disabled = true;
        els.btnApproveAllPending.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>جاري الاعتماد...</span>';

        let approvedCount = 0;
        for (const req of pendingList) {
          try {
            await API.approveUpdateRequest(req);
            approvedCount++;
          } catch (e) {
            console.error('Error approving request:', req.id, e);
          }
        }

        showToast(`تم بنجاح اعتماد وتحديث ${approvedCount} طلب في قاعدة البيانات!`, 'success');
        els.btnApproveAllPending.disabled = false;
        els.btnApproveAllPending.innerHTML = '<i class="fa-solid fa-check-double"></i> <span>اعتماد الكل</span>';

        loadPendingRequests(currentRequestsFilter);
        loadEmployeesTable();
        loadStats();
      });
    }

    // Copy SQL Schema Script
    function copySql() {
      navigator.clipboard.writeText(SQL_SCHEMA_TEXT).then(() => {
        showToast('تم نسخ سكريبت SQL لإنشاء الجدول في Supabase إلى الحافظة!', 'success');
      }).catch(() => {
        showToast('يرجى نسخ الكود من ملف supabase_schema.sql الموجود بالمشروع', 'info');
      });
    }

    if (els.btnCopySqlSchema) els.btnCopySqlSchema.addEventListener('click', copySql);
    if (els.btnNoticeCopySql) els.btnNoticeCopySql.addEventListener('click', copySql);
  }

  // Dashboard Loader (only runs after authentication)
  async function initDashboard() {
    renderTableHeaders();
    await Promise.all([
      loadStats(),
      loadFilterOptions(),
      loadEmployeesTable()
    ]);
    initRequestsWorkflow();
  }

  // App Entry Point with Security Gate
  function init() {
    if (typeof AuthManager !== 'undefined' && AuthManager.isAuthenticated()) {
      // User is authenticated: hide login overlay and load data
      if (els.authOverlay) els.authOverlay.classList.add('hidden');
      const user = AuthManager.getCurrentUser();
      if (user && els.hrUserEmail) els.hrUserEmail.textContent = user.email;
      initDashboard();
    } else {
      // User is NOT authenticated: keep overlay visible and block data fetching
      if (els.authOverlay) {
        els.authOverlay.classList.remove('hidden');
        if (els.authEmail) els.authEmail.focus();
      }
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
