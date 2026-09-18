import Card from '../common/Card';
export default function StatCard({ label, value, note }) 
{ return <Card className="stat-card">
    <span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</Card>; }
