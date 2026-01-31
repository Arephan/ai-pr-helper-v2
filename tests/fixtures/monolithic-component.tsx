/**
 * Monolithic Component Example
 * 
 * This demonstrates the AI pattern of putting all logic into a single
 * massive component instead of breaking it into smaller, focused pieces.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  lastLogin: string | null;
}

interface FilterOptions {
  role: string;
  status: string;
  search: string;
}

interface SortOptions {
  field: keyof User;
  direction: 'asc' | 'desc';
}

export function UserManagementDashboard() {
  // User state
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and sort state
  const [filters, setFilters] = useState<FilterOptions>({
    role: 'all',
    status: 'all',
    search: ''
  });
  const [sort, setSort] = useState<SortOptions>({
    field: 'name',
    direction: 'asc'
  });
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as User['role'],
    status: 'pending' as User['status']
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
          sortField: sort.field,
          sortDirection: sort.direction,
          role: filters.role,
          status: filters.status,
          search: filters.search
        });
        const response = await fetch(`/api/users?${queryParams}`);
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(Math.ceil(data.total / pageSize));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [page, pageSize, sort, filters]);

  // Validate form
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (formData.name.length > 100) {
      errors.name = 'Name must be less than 100 characters';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!['admin', 'user', 'guest'].includes(formData.role)) {
      errors.role = 'Invalid role';
    }
    if (!['active', 'inactive', 'pending'].includes(formData.status)) {
      errors.status = 'Invalid status';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Create user
  const handleCreate = useCallback(async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Failed to create user');
      const newUser = await response.json();
      setUsers(prev => [...prev, newUser]);
      setShowCreateModal(false);
      setFormData({ name: '', email: '', role: 'user', status: 'pending' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create user');
    } finally {
      setSaving(false);
    }
  }, [formData, validateForm]);

  // Update user
  const handleUpdate = useCallback(async () => {
    if (!editingUser || !validateForm()) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Failed to update user');
      const updatedUser = await response.json();
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      setShowEditModal(false);
      setEditingUser(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  }, [editingUser, formData, validateForm]);

  // Delete users
  const handleDelete = useCallback(async () => {
    if (selectedUsers.length === 0) return;
    setDeleting(true);
    try {
      await Promise.all(
        selectedUsers.map(id =>
          fetch(`/api/users/${id}`, { method: 'DELETE' })
        )
      );
      setUsers(prev => prev.filter(u => !selectedUsers.includes(u.id)));
      setSelectedUsers([]);
      setShowDeleteConfirm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete users');
    } finally {
      setDeleting(false);
    }
  }, [selectedUsers]);

  // Toggle user selection
  const toggleSelection = useCallback((id: number) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  // Select all
  const selectAll = useCallback(() => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  }, [users, selectedUsers]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (filters.role !== 'all' && user.role !== filters.role) return false;
      if (filters.status !== 'all' && user.status !== filters.status) return false;
      if (filters.search && !user.name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !user.email.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [users, filters]);

  // Sort users
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const aVal = a[sort.field];
      const bVal = b[sort.field];
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredUsers, sort]);

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge color
  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'gray';
      case 'pending': return 'yellow';
      default: return 'gray';
    }
  };

  // Get role badge color
  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'purple';
      case 'user': return 'blue';
      case 'guest': return 'gray';
      default: return 'gray';
    }
  };

  if (loading && users.length === 0) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="user-management">
      <header className="header">
        <h1>User Management</h1>
        <button onClick={() => setShowCreateModal(true)}>Add User</button>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="filters">
        <input
          type="text"
          placeholder="Search..."
          value={filters.search}
          onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
        />
        <select
          value={filters.role}
          onChange={e => setFilters(prev => ({ ...prev, role: e.target.value }))}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
          <option value="guest">Guest</option>
        </select>
        <select
          value={filters.status}
          onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {selectedUsers.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedUsers.length} selected</span>
          <button onClick={() => setShowDeleteConfirm(true)}>Delete Selected</button>
        </div>
      )}

      <table className="users-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectedUsers.length === users.length}
                onChange={selectAll}
              />
            </th>
            <th onClick={() => setSort({ field: 'name', direction: sort.field === 'name' && sort.direction === 'asc' ? 'desc' : 'asc' })}>
              Name {sort.field === 'name' && (sort.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => setSort({ field: 'email', direction: sort.field === 'email' && sort.direction === 'asc' ? 'desc' : 'asc' })}>
              Email {sort.field === 'email' && (sort.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th>Role</th>
            <th>Status</th>
            <th>Created</th>
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map(user => (
            <tr key={user.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => toggleSelection(user.id)}
                />
              </td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td><span className={`badge ${getRoleColor(user.role)}`}>{user.role}</span></td>
              <td><span className={`badge ${getStatusColor(user.status)}`}>{user.status}</span></td>
              <td>{formatDate(user.createdAt)}</td>
              <td>{formatDate(user.lastLogin)}</td>
              <td>
                <button onClick={() => {
                  setEditingUser(user);
                  setFormData({ name: user.name, email: user.email, role: user.role, status: user.status });
                  setShowEditModal(true);
                }}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
        <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      {/* Create Modal - would be extracted in real code */}
      {showCreateModal && (
        <div className="modal">
          <h2>Create User</h2>
          <input
            placeholder="Name"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
          {formErrors.name && <span className="error">{formErrors.name}</span>}
          <input
            placeholder="Email"
            value={formData.email}
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
          {formErrors.email && <span className="error">{formErrors.email}</span>}
          <select
            value={formData.role}
            onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as User['role'] }))}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="guest">Guest</option>
          </select>
          <div className="modal-actions">
            <button onClick={() => setShowCreateModal(false)}>Cancel</button>
            <button onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal">
          <h2>Edit User</h2>
          <input
            placeholder="Name"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
          <input
            placeholder="Email"
            value={formData.email}
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
          <select
            value={formData.role}
            onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as User['role'] }))}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="guest">Guest</option>
          </select>
          <select
            value={formData.status}
            onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as User['status'] }))}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
          <div className="modal-actions">
            <button onClick={() => setShowEditModal(false)}>Cancel</button>
            <button onClick={handleUpdate} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="modal">
          <h2>Confirm Delete</h2>
          <p>Are you sure you want to delete {selectedUsers.length} user(s)?</p>
          <div className="modal-actions">
            <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="danger">
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
