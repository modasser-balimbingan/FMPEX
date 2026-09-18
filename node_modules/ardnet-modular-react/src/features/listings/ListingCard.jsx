import { peso } from '../../utils/format';
import Button from '../../components/common/Button';

export default function ListingCard({ listing, canManage, onEdit, onSold, onDelete, onToggle }) 
{ return <article className="listing-card card">
    <div className="listing-top">
        <span className="listing-category">{listing.category}</span>
    <span className={`listing-status ${listing.status === 'Active' ? 'status-online' : 'status-warning'}`}>● {listing.status}</span></div>
    <h3>{listing.produce}</h3>
    <div className="listing-meta">
        <span>{listing.quantity} {listing.unit}</span>
        <span>{listing.location}</span><span>Farmer: {listing.farmer}</span></div>
        <div className="listing-price">{listing.price == null ? 'Price on request' : `${peso(listing.price)} / ${listing.unit}`}</div>
        <div className="listing-contact">{listing.farmerEmail && <a href={`mailto:${listing.farmerEmail}`}>Email: {listing.farmerEmail}</a>
        }
        {listing.farmerContact ? <a href={`tel:${listing.farmerContact}`}> Contact: {listing.farmerContact}</a> 
        : <span className="muted">Contact number unavailable</span>}</div>
        <div className="listing-actions">
            <Button variant="outline" className="btn-small" onClick={()=>alert(`Produce: ${listing.produce}
            \nLocation: ${listing.location}
            \nFarmer: ${listing.farmer}`)}
            >View details</Button>
            {canManage&&<>
            <Button variant="outline" className="btn-small" onClick={()=>onEdit(listing)}>Edit</Button>
            <Button variant="outline" className="btn-small" onClick={()=>onToggle(listing.id)}
                >{listing.status === 'Active' ? 'Deactivate' : 'Activate'}</Button>
                <Button variant="outline" className="btn-small" onClick={()=>onSold(listing.id)}>Mark sold</Button>
                <Button variant="danger" className="btn-small" onClick={()=>onDelete(listing.id)}>Delete</Button></>}</div></article>;}
