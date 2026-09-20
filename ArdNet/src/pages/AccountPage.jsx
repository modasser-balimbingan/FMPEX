import { useState } from 'react';
import { useDispatch } from 'react-redux';
import Card from '../components/common/Card';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../context/AppContext';
import { updateProfile } from '../redux/slices/authSlice';
import { useListings } from '../hooks/useListings';

export default function AccountPage({ type = 'settings' }) {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const { syncContact } = useListings();
  const { notify, submitSupportRequest, supportRequests, replyToSupportRequest } = useApp();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [replies, setReplies] = useState({});
  const [contact, setContact] = useState(user?.contact || '');
  const help = type === 'help';
  const admin = user?.role === 'admin';
  const ownRequests = supportRequests.filter((request) => request.email === user?.email);
  const submit = (event) => {
    event.preventDefault();
    if (!subject.trim() || !message.trim()) {
      notify('Add a subject and message before sending your request.', 'error');
      return;
    }
    submitSupportRequest({
      subject: subject.trim(),
      message: message.trim(),
      sender: user?.name || 'Unknown user',
      email: user?.email || 'Not provided',
      role: user?.role === 'buyer' ? 'Vendor' : 'Farmer',
    });
    setSubject('');
    setMessage('');
    notify('Your support request was sent to the administrator.', 'success');
  };

  const sendReply = (event, request) => {
    event.preventDefault();
    const reply = (replies[request.id] || '').trim();
    if (!reply) {
      notify('Enter a reply before sending.', 'error');
      return;
    }
    replyToSupportRequest(request.id, reply);
    setReplies((current) => ({ ...current, [request.id]: '' }));
    notify('Reply sent to the user.', 'success');
  };

  const saveContact = (event) => {
    event.preventDefault();
    const normalized = contact.trim();
    if (!normalized) {
      notify('Enter a contact number before saving.', 'error');
      return;
    }
    dispatch(updateProfile({ contact: normalized }));
    syncContact(user.name, normalized, user.email);
    notify('Contact number saved successfully.', 'success');
  };

  const deleteContact = () => {
    dispatch(updateProfile({ contact: '' }));
    syncContact(user.name, '', user.email);
    setContact('');
    notify('Contact number deleted.', 'success');
  };

  return <div className="page"><p className="eyebrow">{help ? 'SUPPORT' : 'ACCOUNT SETTINGS'}</p><h1>{help ? (admin ? 'Help & support inbox' : 'Help & support') : 'Settings'}</h1><p className="muted">{help ? (admin ? 'Review and reply to support requests from farmers and vendors.' : 'Send a request directly to the ArdNet administrator.') : 'Review your profile and account preferences.'}</p><Card style={{ padding: 24, marginTop: 20 }}><h3>{help ? (admin ? 'Requests from farmers and vendors' : 'Contact ArdNet support') : 'Profile'}</h3>{help && admin ? <div className="support-request-list">{supportRequests.length === 0 ? <p className="muted">No support requests have been received.</p> : supportRequests.map((request) => <div className="support-request support-request-thread" key={request.id}><div><strong>{request.subject}</strong><span>{request.sender} · {request.role} · {request.email}</span><p>{request.message}</p>{(request.replies || []).map((reply, index) => <div className="support-reply" key={`${request.id}-reply-${index}`}><strong>{reply.sender}</strong><span>{reply.message}</span></div>)}</div><form className="form" onSubmit={(event) => sendReply(event, request)}><textarea className="input" rows="3" placeholder="Write a reply..." value={replies[request.id] || ''} onChange={(event) => setReplies((current) => ({ ...current, [request.id]: event.target.value }))} required /><button className="btn btn-primary btn-small" type="submit">Reply</button></form></div>)}</div> : help ? <><form className="form" onSubmit={submit}><p className="muted">Your request will appear in the administrator’s support inbox.</p><label className="form-group">Subject<input className="input" value={subject} onChange={(event) => setSubject(event.target.value)} required /></label><label className="form-group">Message<textarea className="input" rows="5" value={message} onChange={(event) => setMessage(event.target.value)} required /></label><div className="form-actions"><button className="btn btn-primary" type="submit">Send support request</button></div></form>{ownRequests.length > 0 && <div className="support-history"><h3>My support requests</h3>{ownRequests.map((request) => <div className="support-request" key={request.id}><div><strong>{request.subject}</strong><span>{request.status}</span><p>{request.message}</p>{(request.replies || []).map((reply, index) => <div className="support-reply" key={`${request.id}-reply-${index}`}><strong>{reply.sender}</strong><span>{reply.message}</span></div>)}</div></div>)}</div>}</> : <><form className="form" onSubmit={saveContact}><div className="activity-list"><div><b>Name</b><span>{user?.name || 'Guest visitor'}</span></div><div><b>Email</b><span>{user?.email || 'Not provided'}</span></div><div><b>Role</b><span>{user?.role || 'Guest'}</span></div></div><label className="form-group">Contact number<input className="input" type="tel" value={contact} onChange={(event) => setContact(event.target.value)} placeholder="09XXXXXXXXX" /></label><div className="form-actions"><button className="btn btn-danger" type="button" onClick={deleteContact}>Delete contact</button><button className="btn btn-primary" type="submit">Save contact</button></div></form></>}</Card></div>;
}
