// Supabase API Operations Client
(function() {
  const { createClient } = supabase;
  const client = createClient(window.APP_CONFIG.SUPABASE_URL, window.APP_CONFIG.SUPABASE_ANON_KEY);
  const STORAGE_KEY_PENDING = 'taqa_pending_update_requests';
  const STORAGE_KEY_AUDIT = 'taqa_employee_audit_log';

  // Local storage helpers for fallback and audit tracking
  function getLocalAudit() {
    try {
      const s = localStorage.getItem(STORAGE_KEY_AUDIT);
      return s ? JSON.parse(s) : {};
    } catch (e) {
      return {};
    }
  }

  function setLocalAudit(id, source) {
    try {
      const map = getLocalAudit();
      map[String(id)] = {
        modifiedBy: source, // 'employee' | 'hr'
        modifiedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(map));
    } catch (e) {}
  }

  // Helper to sanitize requests so only fields that actually changed are kept
  function sanitizeRequest(req) {
    if (!req || typeof req !== 'object') return req;
    const changes = req.requested_changes || {};
    const orig = req.original_data || {};
    const cleanChanges = {};
    const cleanOrig = {};

    const birthDateChanged = (() => {
      if (!changes.birth_date) return false;
      const o = orig.birth_date ? String(orig.birth_date).trim().split('T')[0] : '';
      const n = String(changes.birth_date).trim().split('T')[0];
      return o !== n;
    })();

    Object.keys(changes).forEach(k => {
      if (['updated_at', 'id', 'created_at', 'is_local', 'status', 'submitted_at', 'employee_id', 'employee_name'].includes(k)) return;
      let oldVal = (orig[k] !== null && orig[k] !== undefined) ? String(orig[k]).trim() : '';
      let newVal = (changes[k] !== null && changes[k] !== undefined) ? String(changes[k]).trim() : '';

      // Date comparison ignoring time
      if (['birth_date', 'start_date', 'resignation_date'].includes(k)) {
        const cleanOld = oldVal.split('T')[0].split(' ')[0];
        const cleanNew = newVal.split('T')[0].split(' ')[0];
        if (cleanOld && cleanNew && cleanOld === cleanNew) return;
      }

      // Ignore birth_month / age if birth_date itself wasn't changed
      if (['age', 'birth_month'].includes(k) && !birthDateChanged) {
        return;
      }

      if (oldVal !== newVal) {
        cleanChanges[k] = changes[k];
        cleanOrig[k] = orig[k];
      }
    });

    return {
      ...req,
      requested_changes: cleanChanges,
      original_data: cleanOrig
    };
  }

  function getLocalRequests() {
    try {
      const s = localStorage.getItem(STORAGE_KEY_PENDING);
      if (!s) return [];
      const list = JSON.parse(s);
      if (!Array.isArray(list)) return [];
      const cleaned = list.map(sanitizeRequest);
      // Auto-save cleaned list if any had redundant fields
      try {
        localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(cleaned));
      } catch (e) {}
      return cleaned;
    } catch (e) {
      return [];
    }
  }

  function saveLocalRequests(arr) {
    try {
      localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(arr));
    } catch (e) {}
  }

  window.API = {
    // Helper to fetch all records for specific columns across Supabase's 1000-row limit
    async _fetchAllRows(columns) {
      const step = 1000;
      let from = 0;
      let allRows = [];
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await client
          .from('employees')
          .select(columns)
          .range(from, from + step - 1);

        if (error) {
          console.error('Error fetching batch in _fetchAllRows:', error);
          break;
        }

        if (data && data.length > 0) {
          allRows = allRows.concat(data);
          if (data.length < step) {
            hasMore = false;
          } else {
            from += step;
          }
        } else {
          hasMore = false;
        }
      }
      return allRows;
    },

    // Fetch unique options for dropdown filters
    async getFilterOptions() {
      try {
        const allData = await this._fetchAllRows('company, department, status, company_sector, division, job_tree');

        const unique = (arr, key) => Array.from(new Set((arr || []).map(x => (x[key] || '').trim()).filter(Boolean))).sort();

        return {
          companies: unique(allData, 'company'),
          departments: unique(allData, 'department'),
          statuses: unique(allData, 'status'),
          sectors: unique(allData, 'company_sector'),
          divisions: unique(allData, 'division'),
          jobTrees: unique(allData, 'job_tree')
        };
      } catch (err) {
        console.error('Error fetching filter options:', err);
        return { companies: [], departments: [], statuses: [], sectors: [], divisions: [], jobTrees: [] };
      }
    },

    // Fetch dashboard quick statistics
    async getStatistics() {
      try {
        const { count: total, error: errTotal } = await client
          .from('employees')
          .select('*', { count: 'exact', head: true });

        const allData = await this._fetchAllRows('company, department, status, resignation_date');

        if (!allData || allData.length === 0) {
          return { total: total || 0, active: 0, companiesCount: 0, departmentsCount: 0 };
        }

        const companies = new Set();
        const departments = new Set();
        let activeCount = 0;

        allData.forEach(row => {
          if (row.company && row.company.trim()) companies.add(row.company.trim());
          if (row.department && row.department.trim()) departments.add(row.department.trim());

          const resig = (row.resignation_date || '').toString().trim();
          const st = (row.status || '').toLowerCase().trim();

          const isResigned = (resig !== '' && resig !== '-') || st.includes('resigned') || st.includes('مستقيل');
          if (!isResigned) {
            activeCount++;
          }
        });

        return {
          total: total || allData.length,
          active: activeCount,
          companiesCount: companies.size,
          departmentsCount: departments.size
        };
      } catch (err) {
        console.error('Error getting stats:', err);
        return { total: 0, active: 0, companiesCount: 0, departmentsCount: 0 };
      }
    },

    // Get all searched, filtered, and sorted employees (continuous rows under each other)
    async getEmployees({ searchQuery = '', filters = {}, sortField = 'id', sortAsc = true } = {}) {
      try {
        const step = 1000;
        let from = 0;
        let allData = [];
        let totalCount = 0;
        let hasMore = true;

        while (hasMore) {
          let query = client.from('employees').select('*', { count: 'exact' });

          // Search in multiple columns (ID, English Name, Arabic Name, National ID, Email, Mobile)
          if (searchQuery && searchQuery.trim()) {
            const q = searchQuery.trim();
            query = query.or(`id.ilike.%${q}%,employee_name.ilike.%${q}%,employee_name_ar.ilike.%${q}%,national_id.ilike.%${q}%,email.ilike.%${q}%,mobile_numbers.ilike.%${q}%`);
          }

          // Apply filters
          if (filters.company) {
            query = query.eq('company', filters.company);
          }
          if (filters.department) {
            query = query.eq('department', filters.department);
          }
          if (filters.status) {
            query = query.eq('status', filters.status);
          }
          if (filters.gender) {
            query = query.eq('gender', filters.gender);
          }
          if (filters.company_sector) {
            query = query.eq('company_sector', filters.company_sector);
          }
          if (filters.division) {
            query = query.eq('division', filters.division);
          }
          if (filters.job_tree) {
            query = query.eq('job_tree', filters.job_tree);
          }

          // Apply Sorting
          if (sortField) {
            query = query.order(sortField, { ascending: sortAsc });
          }

          // Fetch batch
          query = query.range(from, from + step - 1);

          const { data, count, error } = await query;
          if (error) throw error;

          if (totalCount === 0 && typeof count === 'number') {
            totalCount = count;
          }

          if (data && data.length > 0) {
            allData = allData.concat(data);
            if (data.length < step) {
              hasMore = false;
            } else {
              from += step;
            }
          } else {
            hasMore = false;
          }
        }

        return {
          data: allData,
          totalCount: totalCount || allData.length
        };
      } catch (err) {
        console.error('Error fetching employees:', err);
        throw err;
      }
    },

    // Get single employee by ID
    async getEmployeeById(id) {
      const { data, error } = await client.from('employees').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },

    // Create or Update single employee
    async upsertEmployee(employeeData) {
      employeeData.updated_at = new Date().toISOString();
      let res;
      try {
        const payloadWithAudit = {
          ...employeeData,
          last_modified_by: 'hr',
          last_modified_at: new Date().toISOString()
        };
        const { data, error } = await client
          .from('employees')
          .upsert(payloadWithAudit, { onConflict: 'id' })
          .select()
          .single();
        if (error) throw error;
        res = data;
      } catch (err) {
        // Fallback: if last_modified_by column does not exist on Supabase, retry without it
        const { data, error } = await client
          .from('employees')
          .upsert(employeeData, { onConflict: 'id' })
          .select()
          .single();
        if (error) throw error;
        res = data;
      }

      setLocalAudit(employeeData.id, 'hr');
      return res;
    },

    // Compute the next serial number (S.) automatically from existing employees.
    // serial_no may be stored as text, so max is computed numerically, not lexicographically.
    async getNextSerialNo() {
      try {
        const rows = await this._fetchAllRows('serial_no');
        let max = 0;
        (rows || []).forEach(r => {
          const n = parseInt(String(r.serial_no == null ? '' : r.serial_no).replace(/[^0-9]/g, ''), 10);
          if (!isNaN(n) && n > max) max = n;
        });
        return max + 1;
      } catch (err) {
        console.error('getNextSerialNo failed:', err);
        return null;
      }
    },

    // Delete single employee
    async deleteEmployee(id) {
      const { error } = await client.from('employees').delete().eq('id', id);
      if (error) throw error;
      return true;
    },

    // Bulk Delete
    async deleteEmployeesBatch(ids) {
      const { error } = await client.from('employees').delete().in('id', ids);
      if (error) throw error;
      return true;
    },

    // Clear all records (only used when user chooses full overwrite)
    async clearAllEmployees() {
      const { error } = await client.from('employees').delete().neq('id', '___NEVER_MATCH___');
      if (error) throw error;
      return true;
    },

    // Batch Upsert for Excel upload with progress callback
    async batchUpsert(records, onProgress) {
      const batchSize = window.APP_CONFIG.BATCH_SIZE || 100;
      let insertedCount = 0;
      const total = records.length;

      for (let i = 0; i < total; i += batchSize) {
        const chunk = records.slice(i, i + batchSize).map(r => ({
          ...r,
          updated_at: new Date().toISOString()
        }));

        const { error } = await client.from('employees').upsert(chunk, { onConflict: 'id' });
        if (error) {
          throw new Error(`خطأ في رفع الدفعة ${i / batchSize + 1}: ${error.message}`);
        }

        insertedCount += chunk.length;
        if (onProgress) {
          onProgress(insertedCount, total);
        }
      }

      return insertedCount;
    },

    // Fetch all records for Excel Export (matching current search, filters and sort)
    async getAllForExport(searchQuery = '', filters = {}, sortField = 'id', sortAsc = true) {
      let allRows = [];
      let page = 0;
      const step = 1000;
      let hasMore = true;

      while (hasMore) {
        let query = client.from('employees').select('*');

        if (searchQuery && searchQuery.trim()) {
          const q = searchQuery.trim();
          query = query.or(`id.ilike.%${q}%,employee_name.ilike.%${q}%,employee_name_ar.ilike.%${q}%,national_id.ilike.%${q}%,email.ilike.%${q}%,mobile_numbers.ilike.%${q}%`);
        }
        if (filters.company) query = query.eq('company', filters.company);
        if (filters.department) query = query.eq('department', filters.department);
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.gender) query = query.eq('gender', filters.gender);
        if (filters.company_sector) query = query.eq('company_sector', filters.company_sector);
        if (filters.division) query = query.eq('division', filters.division);
        if (filters.job_tree) query = query.eq('job_tree', filters.job_tree);

        if (sortField) {
          query = query.order(sortField, { ascending: sortAsc });
        }

        query = query.range(page * step, (page + 1) * step - 1);

        const { data, error } = await query;
        if (error) throw error;

        if (data && data.length > 0) {
          allRows = allRows.concat(data);
          if (data.length < step) hasMore = false;
          else page++;
        } else {
          hasMore = false;
        }
      }

      return allRows;
    },

    // ========================================================
    // EMPLOYEE UPDATE REQUESTS (STAGING TABLE & APPROVAL QUEUE)
    // ========================================================

    // Submit an update request from employee (Saved to staging table, NOT main DB)
    async submitUpdateRequest({ employeeId, employeeName, changes, originalData }) {
      const record = {
        employee_id: String(employeeId),
        employee_name: employeeName || '',
        requested_changes: changes || {},
        original_data: originalData || {},
        status: 'pending',
        submitted_at: new Date().toISOString()
      };

      try {
        const { data, error } = await client
          .from('employee_update_requests')
          .insert(record)
          .select()
          .single();

        if (!error && data) {
          return { success: true, data, storage: 'cloud' };
        }
      } catch (err) {
        console.warn('Cloud employee_update_requests table not available, using local sync:', err);
      }

      // Fallback to local queue if Supabase table is not yet created
      const localList = getLocalRequests();
      const localRecord = {
        id: 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        ...record,
        is_local: true
      };
      localList.unshift(localRecord);
      saveLocalRequests(localList);

      return { success: true, data: localRecord, storage: 'local' };
    },

    // Fetch all requests (with optional status filter: 'pending', 'approved', 'rejected', 'all')
    async getUpdateRequests(filterStatus = 'all') {
      let cloudRequests = [];
      let isCloudAvailable = true;

      try {
        let q = client.from('employee_update_requests').select('*').order('submitted_at', { ascending: false });
        if (filterStatus && filterStatus !== 'all') {
          q = q.eq('status', filterStatus);
        }
        const { data, error } = await q;
        if (error) throw error;
        cloudRequests = (data || []).map(sanitizeRequest);
      } catch (err) {
        isCloudAvailable = false;
      }

      // Merge local fallback requests
      let localRequests = getLocalRequests();
      if (filterStatus && filterStatus !== 'all') {
        localRequests = localRequests.filter(r => r.status === filterStatus);
      }

      const map = new Map();
      cloudRequests.forEach(r => map.set(String(r.id), r));
      localRequests.forEach(r => {
        if (!map.has(String(r.id))) {
          map.set(String(r.id), r);
        }
      });

      const all = Array.from(map.values()).sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0));

      return {
        requests: all,
        isCloudAvailable
      };
    },

    // Get count of pending requests
    async getPendingRequestsCount() {
      try {
        const { count, error } = await client
          .from('employee_update_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        if (!error && count !== null) {
          const localPending = getLocalRequests().filter(r => r.status === 'pending');
          return Math.max(count, localPending.length);
        }
      } catch (e) {}

      return getLocalRequests().filter(r => r.status === 'pending').length;
    },

    // Approve an employee update request (Commits to main employees DB)
    async approveUpdateRequest(request) {
      if (!request || !request.employee_id) throw new Error('بيانات الطلب غير مكتملة');

      const empId = String(request.employee_id);
      const changes = request.requested_changes || {};
      const original = request.original_data || {};

      // Filter out unchanged values before updating DB
      const cleanChanges = {};
      Object.keys(changes).forEach(k => {
        if (['updated_at', 'id', 'created_at', 'is_local', 'status', 'submitted_at', 'employee_id', 'employee_name'].includes(k)) return;
        const oldVal = (original[k] !== null && original[k] !== undefined) ? String(original[k]).trim() : '';
        const newVal = (changes[k] !== null && changes[k] !== undefined) ? String(changes[k]).trim() : '';
        if (oldVal !== newVal) {
          cleanChanges[k] = changes[k];
        }
      });

      const updatePayload = {
        ...cleanChanges,
        updated_at: new Date().toISOString()
      };

      // Try applying update with last_modified_by = 'employee'
      try {
        const { error } = await client
          .from('employees')
          .update({
            ...updatePayload,
            last_modified_by: 'employee',
            last_modified_at: new Date().toISOString()
          })
          .eq('id', empId);
        if (error) throw error;
      } catch (err) {
        // Fallback: update without last_modified_by if column not created yet
        const { error: err2 } = await client
          .from('employees')
          .update(updatePayload)
          .eq('id', empId);
        if (err2) throw err2;
      }

      // Record in local audit map so badge displays immediately
      setLocalAudit(empId, 'employee');

      // Mark request as approved
      const approvalInfo = {
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'مسؤول الموارد البشرية (HR)'
      };

      try {
        if (!request.is_local) {
          await client
            .from('employee_update_requests')
            .update(approvalInfo)
            .eq('id', request.id);
        }
      } catch (e) {}

      const localList = getLocalRequests();
      const idx = localList.findIndex(r => String(r.id) === String(request.id));
      if (idx !== -1) {
        localList[idx] = { ...localList[idx], ...approvalInfo };
        saveLocalRequests(localList);
      }

      return true;
    },

    // Reject an update request
    async rejectUpdateRequest(request, reason = '') {
      if (!request) throw new Error('طلب غير موجود');

      const rejectionInfo = {
        status: 'rejected',
        notes: reason || 'تم رفض التعديل بواسطة إدارة الموارد البشرية',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'مسؤول الموارد البشرية (HR)'
      };

      try {
        if (!request.is_local) {
          await client
            .from('employee_update_requests')
            .update(rejectionInfo)
            .eq('id', request.id);
        }
      } catch (e) {}

      const localList = getLocalRequests();
      const idx = localList.findIndex(r => String(r.id) === String(request.id));
      if (idx !== -1) {
        localList[idx] = { ...localList[idx], ...rejectionInfo };
        saveLocalRequests(localList);
      }

      return true;
    },

    // Delete a request from the queue
    async deleteUpdateRequest(requestId) {
      try {
        await client.from('employee_update_requests').delete().eq('id', requestId);
      } catch (e) {}

      const localList = getLocalRequests().filter(r => String(r.id) !== String(requestId));
      saveLocalRequests(localList);
      return true;
    },

    // Get modification source for an employee ('employee' | 'hr' | null)
    getModifierSource(emp) {
      if (!emp) return null;
      if (emp.last_modified_by) {
        return emp.last_modified_by;
      }
      const localMap = getLocalAudit();
      const found = localMap[String(emp.id)];
      if (found && found.modifiedBy) {
        return found.modifiedBy;
      }
      return null;
    }
  };
})();
