import StatCard from '../../components/ui/StatCard';
import Card from '../../components/common/Card';
import { useApp } from '../../context/AppContext';

export default function AdminOverview() {
  const { supportRequests, updateSupportRequest, notify } = useApp();
  const pendingRequests = supportRequests.filter((request) => request.status === 'New');
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">RESTRICTED ADMINISTRATOR WORKSPACE</p>
          <h1>System Overview</h1>
          <p className="muted">Manage users, categories, listings, prices, alerts, notifications, audit records, and integrations.</p>
        </div>
      </div>

      <div>
          <div className="grid grid-4">
            <StatCard label="Total users" value="248" note="Registered accounts" />
            <StatCard label="Active listings" value="136" note="Current listings" />
            <StatCard label="Price alerts" value="42" note="Configured alerts" />
            <StatCard label="Integrations" value="5" note="Connected services" />
          </div>

          <div className="grid grid-2 admin-panels">
            <Card style={{ padding: 22 }}>
              <div className="panel-heading"><div><p className="eyebrow">AUDIT</p><h3>Recent activity</h3></div></div>
              <div className="activity-list">
                <div><b>New farmer account</b><span>2 minutes ago</span></div>
                <div><b>Rice listing marked sold</b><span>18 minutes ago</span></div>
                <div><b>Market price record updated</b><span>34 minutes ago</span></div>
                <div><b>Price alert processed</b><span>1 hour ago</span></div>
              </div>
              <Card style={{ padding: 22, marginTop: 16 }}>
                <div className="panel-heading"><div><p className="eyebrow">HELP & SUPPORT</p><h3>Support requests</h3></div><span className={`status ${pendingRequests.length ? 'status-warning' : 'status-online'}`}>{pendingRequests.length} new</span></div>
                {supportRequests.length === 0 ? <p className="muted">No support requests have been received from farmers or vendors.</p> : <div className="support-request-list">{supportRequests.slice(0, 6).map((request) => <div className="support-request" key={request.id}><div><strong>{request.subject}</strong><span>{request.sender} · {request.role} · {request.email}</span><p>{request.message}</p></div><div><span className={`status ${request.status === 'New' ? 'status-warning' : 'status-online'}`}>{request.status}</span>{request.status === 'New' && <button className="btn btn-primary btn-small" type="button" onClick={() => { updateSupportRequest(request.id, 'Resolved'); notify('Support request marked as resolved.', 'success'); }}>Resolve</button>}</div></div>)}</div>}
              </Card>
            </Card>

            <Card style={{ padding: 22 }}>
              <div className="panel-heading"><div><p className="eyebrow">INTEGRATIONS</p><h3>Service health</h3></div></div>
              <div className="integration-list">
                <div><span>REST / JSON</span><b className="status-online">Operational</b></div>
                <div><span>SOAP / WSDL</span><b className="status-online">Operational</b></div>
                <div><span>Weather API</span><b className="status-online">Operational</b></div>
                <div><span>RabbitMQ</span><b className="status-warning">Pending queue</b></div>
                <div><span>PostgreSQL</span><b className="status-online">Operational</b></div>
              </div>
            </Card>
        </div>
      </div>
    </div>
  );
}
