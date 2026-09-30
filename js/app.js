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
      gender: ''
    },
    sortField: 'id',
    sortAsc: true,
    totalRecords: 0,
    parsedExcelData: null,
    deletingEmployeeId: null,
    editingEmployeeId: null
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
    filterDepartment: document.getElementById('filter-department'),
    filterStatus: document.getElementById('filter-status'),
    filterGender: document.getElementById('filter-gender'),
    btnResetFilters: document.getElementById('btn-reset-filters'),
    pageSizeSelect: document.getElementById('page-size-select'),
    btnRefresh: document.getElementById('btn-refresh'),

    // Table
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
    btnOpenUpload: document.getElementById('btn-open-upload'),
    btnOpenAdd: document.getElementById('btn-open-add'),
    btnExportExcel: document.getElementById('btn-export-excel'),

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
    toastContainer: document.getElementById('toast-container')
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

  // Attach modal close handlers
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-close');
      const targetModal = document.getElementById(targetId);
      if (targetModal) closeModal(targetModal);
    });
  });

  // Close modal when clicking outside container
  [els.modalUpload, els.modalEmployee, els.modalDelete].forEach(modal => {
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

  // Load filter options into select elements
  async function loadFilterOptions() {
    try {
      const options = await API.getFilterOptions();

      // Populate companies
      els.filterCompany.innerHTML = '<option value="">جميع الشركات</option>' +
        options.companies.map(c => `<option value="${c}">${c}</option>`).join('');

      // Populate departments
      els.filterDepartment.innerHTML = '<option value="">جميع الإدارات</option>' +
        options.departments.map(d => `<option value="${d}">${d}</option>`).join('');

      // Populate statuses
      els.filterStatus.innerHTML = '<option value="">جميع الحالات</option>' +
        options.statuses.map(s => `<option value="${s}">${s}</option>`).join('');
    } catch (err) {
      console.error('Error loading filters:', err);
    }
  }

  // Format status badge helper
  function renderStatusBadge(status) {
    if (!status) return '<span class="badge badge-neutral">-</span>';
    const s = status.toLowerCase();
    if (s.includes('active') || s.includes('شغال') || s.includes('قائم')) {
      return `<span class="badge badge-active">${status}</span>`;
    }
    if (s.includes('resigned') || s.includes('مستقيل')) {
      return `<span class="badge badge-resigned">${status}</span>`;
    }
    if (s.includes('personal') || s.includes('خاص')) {
      return `<span class="badge badge-personal">${status}</span>`;
    }
    return `<span class="badge badge-neutral">${status}</span>`;
  }

  // Fetch and Render Table Data
  async function loadEmployeesTable() {
    els.tableLoader.style.display = 'block';
    els.tableEmpty.style.display = 'none';
    els.tableBody.innerHTML = '';

    try {
      const result = await API.getEmployees({
        page: state.page,
        pageSize: state.pageSize,
        searchQuery: state.searchQuery,
        filters: state.filters,
        sortField: state.sortField,
        sortAsc: state.sortAsc
      });

      els.tableLoader.style.display = 'none';
      state.totalRecords = result.totalCount;

      els.filteredCount.textContent = `${result.totalCount.toLocaleString('ar-EG')} سجل`;

      if (result.data.length === 0) {
        els.tableEmpty.style.display = 'block';
        updatePagination(0, 0, 0);
        return;
      }

      // Render Rows
      const rowsHtml = result.data.map((emp, index) => {
        const rowNum = (state.page - 1) * state.pageSize + index + 1;
        return `
          <tr data-id="${emp.id}">
            <td style="text-align: center; color: var(--text-light); font-size: 0.8rem;">${rowNum}</td>
            <td style="font-weight: 700; color: var(--primary-hover); font-family: monospace; font-size: 0.95rem;">${emp.id || '-'}</td>
            <td style="font-weight: 600;">${emp.employee_name_ar || '-'}</td>
            <td>${emp.employee_name || '-'}</td>
            <td>
              <div style="font-weight: 600;">${emp.job_title || emp.job_post || '-'}</div>
              ${emp.job_post && emp.job_title && emp.job_post !== emp.job_title ? `<div style="font-size: 0.78rem; color: var(--text-muted);">${emp.job_post}</div>` : ''}
            </td>
            <td><span class="badge badge-neutral">${emp.company || '-'}</span></td>
            <td>${emp.department || '-'}</td>
            <td style="font-family: monospace; font-size: 0.85rem;">${emp.national_id || '-'}</td>
            <td style="font-family: monospace; font-size: 0.85rem;">${emp.mobile_numbers || '-'}</td>
            <td>${renderStatusBadge(emp.status)}</td>
            <td style="font-size: 0.82rem; color: var(--text-muted);">${emp.start_date || '-'}</td>
            <td>
              <div class="row-actions">
                <button class="action-btn btn-edit" title="تعديل الموظف" onclick="window.editEmployee('${emp.id}')">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="action-btn btn-delete" title="حذف الموظف" onclick="window.confirmDeleteEmployee('${emp.id}', '${(emp.employee_name_ar || emp.employee_name || '').replace(/'/g, "\\'")}')">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      els.tableBody.innerHTML = rowsHtml;
      updatePagination(result.currentPage, result.totalPages, result.totalCount);

    } catch (err) {
      els.tableLoader.style.display = 'none';
      els.tableEmpty.style.display = 'block';
      showToast('تعذر جلب البيانات: ' + err.message, 'error');
    }
  }

  // Update Pagination Controls
  function updatePagination(currentPage, totalPages, totalCount) {
    if (totalCount === 0) {
      els.paginationInfo.textContent = 'لا توجد سجلات لعرضها';
      els.paginationControls.innerHTML = '';
      return;
    }

    const start = (currentPage - 1) * state.pageSize + 1;
    const end = Math.min(currentPage * state.pageSize, totalCount);
    els.paginationInfo.textContent = `عرض السجلات من ${start.toLocaleString('ar-EG')} إلى ${end.toLocaleString('ar-EG')} من إجمالي ${totalCount.toLocaleString('ar-EG')}`;

    let pagesHtml = '';

    // First & Prev
    pagesHtml += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="window.goToPage(1)" title="الصفحة الأولى"><i class="fa-solid fa-angles-right"></i></button>`;
    pagesHtml += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="window.goToPage(${currentPage - 1})" title="السابق"><i class="fa-solid fa-angle-right"></i></button>`;

    // Page numbers with smart window
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    for (let p = startPage; p <= endPage; p++) {
      pagesHtml += `<button class="page-btn ${p === currentPage ? 'active' : ''}" onclick="window.goToPage(${p})">${p}</button>`;
    }

    // Next & Last
    pagesHtml += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.goToPage(${currentPage + 1})" title="التالي"><i class="fa-solid fa-angle-left"></i></button>`;
    pagesHtml += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.goToPage(${totalPages})" title="الصفحة الأخيرة"><i class="fa-solid fa-angles-left"></i></button>`;

    els.paginationControls.innerHTML = pagesHtml;
  }

  // Pagination navigation helper
  window.goToPage = function(pageNumber) {
    state.page = pageNumber;
    loadEmployeesTable();
  };

  // Sorting Handler
  document.querySelectorAll('table.data-table th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.getAttribute('data-field');
      if (state.sortField === field) {
        state.sortAsc = !state.sortAsc;
      } else {
        state.sortField = field;
        state.sortAsc = true;
      }

      // Update icons
      document.querySelectorAll('table.data-table th.sortable i').forEach(icon => {
        icon.className = 'fa-solid fa-sort';
      });
      const icon = th.querySelector('i');
      if (icon) {
        icon.className = state.sortAsc ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down';
      }

      state.page = 1;
      loadEmployeesTable();
    });
  });

  // Debounced Live Search
  let searchTimeout = null;
  els.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.searchQuery = e.target.value.trim();
      state.page = 1;
      loadEmployeesTable();
    }, 350);
  });

  // Filter Change Listeners
  [els.filterCompany, els.filterDepartment, els.filterStatus, els.filterGender].forEach(select => {
    select.addEventListener('change', () => {
      state.filters.company = els.filterCompany.value;
      state.filters.department = els.filterDepartment.value;
      state.filters.status = els.filterStatus.value;
      state.filters.gender = els.filterGender.value;
      state.page = 1;
      loadEmployeesTable();
    });
  });

  // Reset Filters
  els.btnResetFilters.addEventListener('click', () => {
    els.searchInput.value = '';
    els.filterCompany.value = '';
    els.filterDepartment.value = '';
    els.filterStatus.value = '';
    els.filterGender.value = '';
    state.searchQuery = '';
    state.filters = { company: '', department: '', status: '', gender: '' };
    state.page = 1;
    loadEmployeesTable();
    showToast('تمت إعادة ضبط جميع الفلاتر', 'info');
  });

  // Page Size Change
  els.pageSizeSelect.addEventListener('change', (e) => {
    state.pageSize = parseInt(e.target.value, 10);
    state.page = 1;
    loadEmployeesTable();
  });

  // Refresh Button
  els.btnRefresh.addEventListener('click', () => {
    loadEmployeesTable();
    loadStats();
    loadFilterOptions();
    showToast('تم تحديث البيانات بنجاح', 'success');
  });

  // ==========================================
  // EXCEL UPLOAD WORKFLOW
  // ==========================================
  els.btnOpenUpload.addEventListener('click', () => {
    // Reset modal state
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
    els.previewValidCount.textContent = 'جاري قراءة الملف...';
    els.previewErrors.innerHTML = '';
    els.btnStartUpload.disabled = true;

    try {
      const parsed = await ExcelHandler.parseFile(file);
      state.parsedExcelData = parsed;

      els.previewValidCount.textContent = `${parsed.validCount.toLocaleString('ar-EG')} سجل موظف صالح للرفع`;
      els.previewValidCount.className = 'badge badge-active';

      if (parsed.errors.length > 0) {
        els.previewErrors.innerHTML = `⚠️ تنبيهات (${parsed.errors.length}):<br>` + parsed.errors.slice(0, 5).join('<br>') + (parsed.errors.length > 5 ? `<br>وغيرها ${parsed.errors.length - 5}...` : '');
      }

      els.btnStartUpload.disabled = parsed.validCount === 0;
      showToast(`تم التعرف على ${parsed.validCount} موظف بنجاح! جاهز للرفع.`, 'success');
    } catch (err) {
      els.previewValidCount.textContent = 'خطأ في معالجة الملف';
      els.previewValidCount.className = 'badge badge-resigned';
      els.previewErrors.innerHTML = err.message;
      showToast(err.message, 'error');
    }
  }

  // Start Batch Upload to Supabase
  els.btnStartUpload.addEventListener('click', async () => {
    if (!state.parsedExcelData || state.parsedExcelData.validCount === 0) return;

    const strategy = document.querySelector('input[name="sync-strategy"]:checked').value;
    els.btnStartUpload.disabled = true;
    els.uploadProgress.style.display = 'block';
    els.progressBarFill.style.width = '0%';
    els.progressPercentage.textContent = '0%';
    els.progressText.textContent = 'جاري الاتصال بقاعدة البيانات السحابية...';

    try {
      // If full overwrite requested
      if (strategy === 'overwrite') {
        els.progressText.textContent = 'جاري تهيئة قاعدة البيانات واستبدال السجلات...';
        await API.clearAllEmployees();
      }

      // Upsert batch by batch
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
  els.btnOpenAdd.addEventListener('click', () => {
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

      // Populate form
      Object.keys(emp).forEach(key => {
        const input = document.getElementById(`inp-${key}`);
        if (input) {
          input.value = emp[key] || '';
        }
      });

      document.getElementById('inp-id').readOnly = true; // ID cannot be changed once created
    } catch (err) {
      showToast('تعذر جلب تفاصيل الموظف: ' + err.message, 'error');
      closeModal(els.modalEmployee);
    }
  };

  els.btnSaveEmployee.addEventListener('click', async (e) => {
    e.preventDefault();
    const form = els.employeeForm;

    // Validation
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

    els.btnSaveEmployee.disabled = true;
    els.btnSaveEmployee.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>جاري الحفظ...</span>';

    try {
      await API.upsertEmployee(employeeData);
      showToast('تم حفظ بيانات الموظف في قاعدة البيانات بنجاح!', 'success');
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
      const records = await API.getAllForExport(state.searchQuery, state.filters);
      if (!records || records.length === 0) {
        showToast('لا توجد بيانات مطابقة لتصديرها!', 'warning');
        return;
      }

      const dateStr = new Date().toISOString().split('T')[0];
      ExcelHandler.exportToExcel(records, `TAQA_Gas_Employees_${dateStr}.xlsx`);
      showToast(`تم تصدير ${records.length} موظف إلى إكسيل بنجاح!`, 'success');
    } catch (err) {
      showToast('خطأ أثناء تصدير الإكسيل: ' + err.message, 'error');
    } finally {
      els.btnExportExcel.disabled = false;
      els.btnExportExcel.innerHTML = '<i class="fa-solid fa-download"></i> <span>تصدير إكسيل</span>';
    }
  });

  // App Initialization
  async function init() {
    await Promise.all([
      loadStats(),
      loadFilterOptions(),
      loadEmployeesTable()
    ]);
  }

  // Run on page load
  document.addEventListener('DOMContentLoaded', init);
})();
