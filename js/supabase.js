// Supabase API Operations Client
(function() {
  const { createClient } = supabase;
  const client = createClient(window.APP_CONFIG.SUPABASE_URL, window.APP_CONFIG.SUPABASE_ANON_KEY);
  window.dbClient = client;

  window.API = {
    // Fetch unique options for dropdown filters
    async getFilterOptions() {
      try {
        const [compRes, deptRes, statusRes] = await Promise.all([
          client.from('employees').select('company').not('company', 'is', null).limit(2000),
          client.from('employees').select('department').not('department', 'is', null).limit(2000),
          client.from('employees').select('status').not('status', 'is', null).limit(2000)
        ]);

        const unique = (arr, key) => Array.from(new Set((arr || []).map(x => (x[key] || '').trim()).filter(Boolean))).sort();

        return {
          companies: unique(compRes.data, 'company'),
          departments: unique(deptRes.data, 'department'),
          statuses: unique(statusRes.data, 'status')
        };
      } catch (err) {
        console.error('Error fetching filter options:', err);
        return { companies: [], departments: [], statuses: [] };
      }
    },

    // Fetch dashboard quick statistics
    async getStatistics() {
      try {
        const { count: total, error: errTotal } = await client
          .from('employees')
          .select('*', { count: 'exact', head: true });

        const { data: allData, error } = await client
          .from('employees')
          .select('company, department, status, gender');

        if (error || !allData) {
          return { total: total || 0, active: 0, companiesCount: 0, departmentsCount: 0 };
        }

        const companies = new Set();
        const departments = new Set();
        let activeCount = 0;

        allData.forEach(row => {
          if (row.company) companies.add(row.company.trim());
          if (row.department) departments.add(row.department.trim());
          const st = (row.status || '').toLowerCase();
          if (st.includes('active') || st.includes('شغال') || st.includes('قائم') || st === 'personal' || !st.includes('resigned')) {
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

    // Get paginated, searched, and filtered employees
    async getEmployees({ page = 1, pageSize = 25, searchQuery = '', filters = {}, sortField = 'id', sortAsc = true }) {
      try {
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

        // Apply Sorting
        query = query.order(sortField, { ascending: sortAsc });

        // Pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data, count, error } = await query;
        if (error) throw error;

        return {
          data: data || [],
          totalCount: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
          currentPage: page
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
      const { data, error } = await client
        .from('employees')
        .upsert(employeeData, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return data;
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

    // Fetch all records for Excel Export
    async getAllForExport(searchQuery = '', filters = {}) {
      let allRows = [];
      let page = 0;
      const step = 1000;
      let hasMore = true;

      while (hasMore) {
        let query = client.from('employees').select('*').range(page * step, (page + 1) * step - 1);

        if (searchQuery && searchQuery.trim()) {
          const q = searchQuery.trim();
          query = query.or(`id.ilike.%${q}%,employee_name.ilike.%${q}%,employee_name_ar.ilike.%${q}%,national_id.ilike.%${q}%,email.ilike.%${q}%,mobile_numbers.ilike.%${q}%`);
        }
        if (filters.company) query = query.eq('company', filters.company);
        if (filters.department) query = query.eq('department', filters.department);
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.gender) query = query.eq('gender', filters.gender);

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
    }
  };
})();
