
import Card from '../components/common/Card';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useListings } from '../hooks/useListings';
import { useApp } from '../context/AppContext';
import { apiClient } from '../api/apiClient';
import AdminPageHeader from '../features/admin/AdminPageHeader';
import AdminMarketRecords from '../features/admin/AdminMarketRecords';
import { MARKET_REGIONS } from '../features/admin/adminNavigation';

import {
  PHILIPPINES_PRODUCE_CATEGORIES,
} from '../utils/constants';

const getLocalDateInputValue = () => {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localTime.toISOString().slice(0, 10);
};

const modules = {
  users: ['User Management', 'Manage registered accounts and roles.'],
  categories: ['Category Management', 'Manage the master produce category list.'],
  listings: ['Listing Management', 'Review and manage produce listings.'],
  market: ['Market Price Records', 'Manage reference price records and source information.'],
  alerts: ['Price Alerts', 'Monitor active, triggered, and queued alert events.'],
  notifications: ['Notifications', 'Monitor notification activity and read status.'],
  audit: ['Audit Logs', 'Review important administrator and system actions.'],
  integrations: ['Integrations', 'Monitor REST, SOAP/WSDL, weather, RabbitMQ, and database services.'],
};

const emptyMarketForm = () => ({
  category_id: '', produce_name: '', market_name: '', location: '',
  region_code: MARKET_REGIONS[0].code, province: '', location_type: '',
  price: '', unit: 'kg', price_date: getLocalDateInputValue(), source: '',
});

export default function AdminModulePage({ module = 'users' }) {
  const [title, description] = modules[module] || modules.users;
  const { listings, update } = useListings();
  const { notify } = useApp();
  const currentUser = useSelector((state) => state.auth.user);

  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [userActionId, setUserActionId] = useState(null);

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');

  const [marketPrices, setMarketPrices] = useState([]);
  const [marketCategories, setMarketCategories] = useState([]);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState('');
  const [marketSaving, setMarketSaving] = useState(false);
  const [marketDeletingId, setMarketDeletingId] = useState(null);
  const [editingMarketId, setEditingMarketId] = useState(null);
  const [marketForm, setMarketForm] = useState(emptyMarketForm);
  const [listingActionId, setListingActionId] = useState(null);

  useEffect(() => {
    if (module !== 'users') return;

    let cancelled = false;

    const fetchUsers = async () => {
      setUsersLoading(true);
      setUsersError('');

      const params = new URLSearchParams();
      if (userSearch.trim()) params.set('search', userSearch.trim());
      if (userRoleFilter) params.set('role', userRoleFilter);
      if (userStatusFilter) params.set('status', userStatusFilter);

      try {
        const query = params.toString();
        const response = await apiClient.get(
          `/api/admin/users${query ? `?${query}` : ''}`
        );

        if (cancelled) return;

        if (response.success) {
          setUsers(response.data?.users || []);
        } else {
          setUsersError(response.error || 'Failed to load registered users.');
        }
      } catch (error) {
        if (!cancelled) {
          setUsersError('An unexpected error occurred while loading users.');
        }
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    };

    fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [module, userSearch, userRoleFilter, userStatusFilter]);

  useEffect(() => {
    if (module !== 'market') return;

    let cancelled = false;

    const fetchMarketData = async () => {
      setMarketLoading(true);
      setMarketError('');

      try {
        const [pricesResponse, categoriesResponse] = await Promise.all([
          apiClient.get('/api/market-prices'),
          apiClient.get('/api/categories'),
        ]);

        if (cancelled) return;

        if (pricesResponse.success && Array.isArray(pricesResponse.data)) {
          setMarketPrices(pricesResponse.data);
        } else {
          setMarketError(pricesResponse.error || 'Failed to load market price records.');
        }

        if (categoriesResponse.success && Array.isArray(categoriesResponse.data)) {
          setMarketCategories(categoriesResponse.data);
        } else if (!categoriesResponse.success) {
          setMarketError((current) => current || categoriesResponse.error || 'Failed to load produce categories.');
        }
      } catch (error) {
        if (!cancelled) setMarketError('An unexpected error occurred while loading market records.');
      } finally {
        if (!cancelled) setMarketLoading(false);
      }
    };

    fetchMarketData();

    return () => {
      cancelled = true;
    };
  }, [module]);

  useEffect(() => {
    if (module !== 'audit') return;

    let cancelled = false;

    const fetchAuditLogs = async () => {
  setAuditLoading(true);
  setAuditError('');

  try {
    const response = await apiClient.get('/api/admin/audit-logs');

    if (cancelled) return;

    if (response.success) {
      setAuditLogs(response.data?.auditLogs || []);
    } else {
      setAuditError(response.error || 'Failed to load audit logs.');
    }
  } catch (error) {
    if (!cancelled) {
      setAuditError('An unexpected error occurred while loading audit logs.');
    }
  } finally {
    if (!cancelled) {
      setAuditLoading(false);
    }
  }
};

    fetchAuditLogs();

    return () => {
      cancelled = true;
    };
  }, [module]);

  const rows = module === 'users'
    ? users
    : module === 'categories'
      ? PHILIPPINES_PRODUCE_CATEGORIES.map((name, index) => ({
          name,
          scope: 'Philippines produce',
          records: `${index + 4} listings`,
        }))
      : module === 'listings'
        ? listings
        : module === 'market'
          ? listings.slice(0, 6).map((item) => ({
              name: item.produce,
              location: item.location,
              price: `₱${item.price} / ${item.unit}`,
              status: 'Reference',
            }))
          : module === 'alerts'
            ? [
                { name: 'Rice price threshold', owner: 'Juan Dela Cruz', status: 'Triggered' },
                { name: 'Coconut price threshold', owner: 'Maria Santos', status: 'Active' },
              ]
            : module === 'notifications'
              ? [
                  { name: 'Listing status update', recipient: 'Juan Dela Cruz', status: 'Delivered' },
                  { name: 'Market record update', recipient: 'All buyers', status: 'Queued' },
                ]
              : module === 'audit'
                ? auditLogs
                : [
                    { name: 'REST / JSON', status: 'Operational' },
                    { name: 'Weather API', status: 'Operational' },
                    { name: 'Backup service', status: 'Ready' },
                    { name: 'Recovery snapshot', status: 'Available' },
                  ];

  const action = async (row) => {
    if (listingActionId !== null) return;
    setListingActionId(row.id);
    try {
      await update(row.id, { status: row.status === 'Active' ? 'Inactive' : 'Active' });
      notify('Listing availability updated.', 'success');
    } catch (error) { notify(error.message || 'Could not update this listing.', 'error'); }
    finally { setListingActionId(null); }
  };

  const resetMarketForm = () => {
    setEditingMarketId(null);
    setMarketForm(emptyMarketForm());
  };

  const editMarketPrice = (record) => {
    setEditingMarketId(record.market_price_id);
    setMarketForm({
      category_id: String(record.category_id ?? ''),
      produce_name: record.produce_name ?? '',
      market_name: record.market_name ?? '',
      location: record.location ?? '',
      region_code: record.region_code?.trim().toUpperCase() ?? '',
      province: record.province ?? '',
      location_type: record.location_type ?? '',
      price: String(record.price ?? ''),
      unit: record.unit ?? 'kg',
      price_date: record.price_date ? String(record.price_date).slice(0, 10) : '',
      source: record.source ?? '',
    });
    setMarketError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveMarketPrice = async (event) => {
    event.preventDefault();
    if (marketSaving) return;
    setMarketError('');

    const priceValue = Number(marketForm.price);
    if (
      !marketForm.category_id ||
      !marketForm.produce_name.trim() ||
      !marketForm.market_name.trim() ||
      !marketForm.location.trim() ||
      marketForm.price === '' ||
      !Number.isFinite(priceValue) ||
      priceValue <= 0 ||
      !MARKET_REGIONS.some(region => region.code === marketForm.region_code) ||
      !['City', 'Municipality'].includes(marketForm.location_type) ||
      !marketForm.unit.trim() ||
      !marketForm.price_date ||
      !marketForm.source.trim()
    ) {
      setMarketError('Complete the required fields, select Region IX and the location type, and enter a price greater than zero.');
      return;
    }

    const payload = {
      ...marketForm,
      category_id: Number(marketForm.category_id),
      produce_name: marketForm.produce_name.trim(),
      market_name: marketForm.market_name.trim(),
      location: marketForm.location.trim(),
      province: marketForm.province.trim() || null,
      price: priceValue,
      unit: marketForm.unit.trim(),
      source: marketForm.source.trim(),
    };

    setMarketSaving(true);
    try {
      const response = editingMarketId
        ? await apiClient.put(`/api/market-prices/${editingMarketId}`, payload)
        : await apiClient.post('/api/market-prices', payload);

      if (!response.success) {
        setMarketError(response.error || 'Failed to save market price record.');
        notify(response.error || 'Failed to save market price record.', 'error');
        return;
      }

      const savedRecord = response.data;
      if (editingMarketId) {
        setMarketPrices((current) => current.map((record) =>
          Number(record.market_price_id) === Number(editingMarketId) ? savedRecord : record
        ));
        notify('Market price record updated.', 'success');
      } else {
        setMarketPrices((current) => [savedRecord, ...current]);
        notify('Market price record added.', 'success');
      }
      resetMarketForm();
    } catch (error) {
      setMarketError('An unexpected error occurred while saving this record.');
      notify('Failed to save market price record.', 'error');
    } finally {
      setMarketSaving(false);
    }
  };

  const deleteMarketPrice = async (record) => {
    if (!window.confirm(`Delete the ${record.produce_name} price record for ${record.market_name}? This cannot be undone.`)) {
      return;
    }

    setMarketDeletingId(record.market_price_id);
    setMarketError('');
    try {
      const response = await apiClient.delete(`/api/market-prices/${record.market_price_id}`);
      if (!response.success) {
        setMarketError(response.error || 'Failed to delete market price record.');
        notify(response.error || 'Failed to delete market price record.', 'error');
        return;
      }
      setMarketPrices((current) => current.filter((item) => Number(item.market_price_id) !== Number(record.market_price_id)));
      if (Number(editingMarketId) === Number(record.market_price_id)) resetMarketForm();
      notify('Market price record deleted.', 'success');
    } catch (error) {
      setMarketError('An unexpected error occurred while deleting this record.');
      notify('Failed to delete market price record.', 'error');
    } finally {
      setMarketDeletingId(null);
    }
  };

  const changeUserStatus = async (user) => {
    const userId = user.user_id;
    const currentStatus = String(user.status || '').toLowerCase();
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';

    if (
      nextStatus === 'suspended' &&
      !window.confirm(`Suspend ${user.user_name || user.email}? They will be unable to sign in until reactivated.`)
    ) {
      return;
    }

    setUserActionId(userId);
    setUsersError('');

    try {
      const response = await apiClient.patch(
        `/api/admin/users/${userId}/status`,
        { status: nextStatus }
      );

      if (!response.success) {
        setUsersError(response.error || 'Failed to update this account.');
        notify(response.error || 'Failed to update this account.', 'error');
        return;
      }

      const updatedUser = response.data?.user;
      if (updatedUser) {
        setUsers((current) => current.map((item) =>
          item.user_id === updatedUser.user_id ? updatedUser : item
        ));
      } else {
        setUsers((current) => current.map((item) =>
          item.user_id === userId ? { ...item, status: nextStatus } : item
        ));
      }

      notify(response.data?.message || `User account ${nextStatus}.`, 'success');
    } catch (error) {
      setUsersError('An unexpected error occurred while updating this account.');
      notify('Failed to update this account.', 'error');
    } finally {
      setUserActionId(null);
    }
  };

  if (module === 'users') {
    return (
      <div className="page">
        <AdminPageHeader module={module} title={title} description={description} />

        <Card className="admin-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">REGISTERED ACCOUNTS</p>
              <h3>User access management</h3>
            </div>
            <span className="status active">Admin only</span>
          </div>

          <p className="muted">
            Search registered accounts, filter by role or status, and activate or suspend access.
            Changes are saved to PostgreSQL and recorded in the audit log.
          </p>

          <div className="admin-user-filters" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, margin: '18px 0' }}>
            <label className="form-group">
              Search users
              <input
                className="input"
                type="search"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search by name or email"
              />
            </label>
            <label className="form-group">
              Role
              <select className="input" value={userRoleFilter} onChange={(event) => setUserRoleFilter(event.target.value)}>
                <option value="">All roles</option>
                <option value="Farmer">Farmer</option>
                <option value="Buyer/Vendor">Buyer / Vendor</option>
                <option value="Administrator">Administrator</option>
              </select>
            </label>
            <label className="form-group">
              Account status
              <select className="input" value={userStatusFilter} onChange={(event) => setUserStatusFilter(event.target.value)}>
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
          </div>

          {usersError && <p role="alert" className="form-message error">{usersError}</p>}
          {usersLoading ? (
            <p className="muted">Loading registered users...</p>
          ) : users.length === 0 ? (
            <p className="muted">No users match the selected search and filters.</p>
          ) : (
            <div className="table-scroll">
              <table className="market-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Email verified</th>
                    <th>Registered</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const status = String(user.status || '').toLowerCase();
                    const isCurrentUser = Number(currentUser?.id ?? currentUser?.user_id) === Number(user.user_id);
                    const isSuspending = status === 'active';

                    return (
                      <tr key={user.user_id}>
                        <td>
                          <strong>{user.user_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed user'}</strong>
                          <div className="muted">{user.email}</div>
                        </td>
                        <td>{user.role_name || 'Unknown'}</td>
                        <td><span className={`status ${status === 'active' ? 'active' : 'suspended'}`}>{status || 'unknown'}</span></td>
                        <td>{user.email_verified ? 'Yes' : 'No'}</td>
                        <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</td>
                        <td>
                          <button
                            className="btn btn-outline btn-small"
                            type="button"
                            disabled={userActionId === user.user_id || (isCurrentUser && isSuspending)}
                            title={isCurrentUser && isSuspending ? 'You cannot suspend your own account.' : ''}
                            onClick={() => changeUserStatus(user)}
                          >
                            {userActionId === user.user_id ? 'Saving...' : isCurrentUser && isSuspending ? 'Current account' : isSuspending ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="muted" style={{ marginTop: 12 }}>{users.length} matching account{users.length === 1 ? '' : 's'}</p>
        </Card>
      </div>
    );
  }

  if (module === 'market') {
    return <AdminMarketRecords title={title} description={description}
      marketPrices={marketPrices} marketCategories={marketCategories}
      marketForm={marketForm} setMarketForm={setMarketForm}
      marketLoading={marketLoading} marketError={marketError} marketSaving={marketSaving}
      marketDeletingId={marketDeletingId} editingMarketId={editingMarketId}
      onSubmit={saveMarketPrice} onCancel={resetMarketForm} onEdit={editMarketPrice} onDelete={deleteMarketPrice} />;
  }

  if (module === 'audit') {
    return (
      <div className="page">
        <AdminPageHeader module={module} title={title} description={description} />

        <Card className="admin-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">DATABASE ACTIVITY</p>
              <h3>Audit history</h3>
            </div>
            <span className="status active">Protected</span>
          </div>

          {auditLoading ? (
            <p className="muted">Loading audit records...</p>
          ) : auditError ? (
            <p role="alert">{auditError}</p>
          ) : auditLogs.length === 0 ? (
            <p className="muted">
              No audit records yet. Activity will appear here after audit
              logging is implemented and events are recorded.
            </p>
          ) : (
            <div className="table-scroll">
              <table className="market-table">
                <thead>
                  <tr>
                    <th>Date and time</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.audit_id}>
                      <td>
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString()
                          : '—'}
                      </td>
                      <td>
                        {log.actor_name || log.actor_email || 'System'}
                      </td>
                      <td>{log.action || '—'}</td>
                      <td>
                        {log.entity_name || '—'}
                        {log.entity_id != null
                          ? ` #${log.entity_id}`
                          : ''}
                      </td>
                      <td>{log.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="page">
      <AdminPageHeader module={module} title={title} description={description} />

      <Card className="admin-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">MODULE</p>
            <h3>{title}</h3>
          </div>
          <span className="status active">Protected</span>
        </div>

        <p className="muted">
          {module === 'listings' ? 'Review active marketplace listings and update their availability.' : 'This module is currently a prototype view; its data is not yet connected to persistent admin APIs.'}
        </p>

        <div className="table-scroll">
          <table className="market-table">
            <thead>
              <tr>
                <th>Record</th>
                <th>Details</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.name || row.produce}-${index}`}>
                  <td>
                    <strong>{row.name || row.produce}</strong>
                  </td>
                  <td>
                    {row.email ||
                      row.location ||
                      row.actor ||
                      row.owner ||
                      row.recipient ||
                      row.price ||
                      row.scope ||
                      row.records ||
                      ''}
                  </td>
                  <td>{row.status || 'Managed'}</td>
                  <td>
                    {module === 'listings' ? (
                      <button
                        className="btn btn-outline btn-small"
                        type="button"
                        onClick={() => void action(row)}
                        disabled={listingActionId !== null}
                      >
                        {row.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    ) : (
                      <button
                        className="btn btn-outline btn-small"
                        type="button"
                        onClick={() =>
                          notify(`${row.name} reviewed.`, 'success')
                        }
                      >
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
