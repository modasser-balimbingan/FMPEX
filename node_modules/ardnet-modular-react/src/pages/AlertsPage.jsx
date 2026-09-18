import AlertPanel from '../features/alerts/AlertPanel';
export default function AlertsPage()
{return <div className="page">
    <p className="eyebrow">PRICE ALERTS</p>
    <h1>Alerts and notifications</h1>
    <p className="muted">Triggered price conditions can be queued through RabbitMQ and processed by a notification worker.</p>
    <div style={{marginTop:25}}>
        <AlertPanel/>
    </div>
</div>}
