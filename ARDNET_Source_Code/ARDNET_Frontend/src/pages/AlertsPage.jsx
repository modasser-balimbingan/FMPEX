import AlertPanel from '../features/alerts/AlertPanel';

export default function AlertsPage() {
  return (
    <div className="page alerts-page">
      <header className="workspace-banner"><p className="member-kicker">KEEP YOUR TARGETS IN SIGHT</p><h1>A price worth watching.</h1><p>Set a target for Region IX and follow your produce’s reference prices in one place.</p></header>
      <div>
        <AlertPanel />
      </div>
    </div>
  );
}
