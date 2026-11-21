import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import apiClient from '../api/apiClient';
import DashboardIcon from '../components/ui/DashboardIcon';
import PasswordInput from '../features/auth/PasswordInput';

export default function AccountPage({ type = 'settings' }) {
  const { user, updateProfile } = useAuth();
  const { notify, supportRequests, submitSupportRequest, replyToSupportRequest } = useApp();
  const { theme, preference, chooseTheme } = useTheme();
  const help = type === 'help';
  const admin = user?.role === 'admin';
  const base = admin ? '/admin' : user?.role === 'buyer' ? '/buyer' : '/dashboard';
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [dirty, setDirty] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [support, setSupport] = useState({ subject: '', message: '' });
  const [replies, setReplies] = useState({});
  const requests = admin ? supportRequests : supportRequests.filter(row => row.email === user?.email);
  useEffect(() => { if (!dirty) setProfile({ name: user?.name || '', email: user?.email || '' }); }, [user?.name, user?.email, dirty]);
  async function saveProfile(event) {
    event.preventDefault(); if (saving) return;
    setSaving('profile'); setProfileError('');
    try {
      const result = await updateProfile({ name: profile.name.trim(), email: profile.email.trim().toLowerCase() });
      if (!result.success) throw new Error(result.error || 'Could not update your profile.');
      setDirty(false); notify('Your profile has been updated.');
    } catch (error) { setProfileError(error.message); } finally { setSaving(''); }
  }
  async function changePassword(event) {
    event.preventDefault(); if (saving) return;
    setPasswordError('');
    if (passwords.newPassword !== passwords.confirmPassword) { setPasswordError('Your new passwords do not match.'); return; }
    if (passwords.currentPassword === passwords.newPassword) { setPasswordError('Choose a password different from your current one.'); return; }
    setSaving('password');
    try {
      const result = await apiClient.put('/api/auth/change-password', passwords);
      if (!result.success) throw new Error(result.error || 'Could not change your password.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' }); notify('Your password has been changed.');
    } catch (error) { setPasswordError(error.message); } finally { setSaving(''); }
  }
  function saveSupport(event) {
    event.preventDefault();
    if (!support.subject.trim() || !support.message.trim()) { notify('Enter a subject and message before saving.', 'error'); return; }
    submitSupportRequest({ subject: support.subject.trim(), message: support.message.trim(), sender: user?.name || 'ArdNet member', email: user?.email, role: user?.role === 'buyer' ? 'Buyer / Vendor' : 'Farmer' });
    setSupport({ subject: '', message: '' }); notify('Support request saved in this browser.');
  }
  function reply(event, request) { event.preventDefault(); const message = (replies[request.id] || '').trim(); if (!message) return; replyToSupportRequest(request.id, message); setReplies(value => ({ ...value, [request.id]: '' })); notify('Reply saved in this browser.'); }
  return <div className={`page account-workspace${help ? ' support-workspace' : ''}`}>
    <header className="workspace-banner"><p className="member-kicker">{help ? 'A LITTLE HELP ALONG THE WAY' : 'MAKE YOURSELF AT HOME'}</p><h1>{help ? admin ? 'Community support inbox.' : 'We’re here to help.' : 'Your account. Your preferences.'}</h1><p>{help ? 'Find helpful answers and keep your questions in one place.' : 'Keep your profile up to date, protect your account, and choose a look that feels right.'}</p></header>
    {help ? <>
      <div className="support-layout">
        <section className="workspace-panel support-guide"><span className="workspace-icon"><DashboardIcon name="help" size={25} /></span><h2>A good place to start</h2><p>Looking for a listing, following a price target, or updating your profile? Here are a few quick answers.</p>
          {[['How do I find produce?', 'Use Browse produce in the sidebar to see current active listings, including your own. You can search by produce, farmer, or location.'], ['How do price alerts work?', 'Choose a produce name, unit, target price, and comparison. Alerts monitor reference prices in Region IX and can appear in your notifications and email.'], ['Where are my saved listings?', 'Open Favorites to revisit saved produce. Use its search and filters to find a particular listing.'], ['Why can’t I see an inactive listing in the market?', 'Only active produce is shown in the marketplace. Farmers can manage active, inactive, and sold produce under My listings.']].map(([question, answer]) => <details className="support-faq" key={question}><summary>{question}</summary><p>{answer}</p></details>)}
          <Link className="workspace-text-link" to={`${base}/notifications`}>Check your notifications <DashboardIcon name="arrowRight" size={16} /></Link>
        </section>
        {!admin && <section className="workspace-panel"><div className="workspace-section-title"><span className="workspace-icon"><DashboardIcon name="message" size={22} /></span><div><h2>Keep a support request</h2><p>Describe what you need help with.</p></div></div><form className="workspace-form" onSubmit={saveSupport}><label className="form-group">Subject<input className="input" value={support.subject} onChange={event => setSupport(value => ({ ...value, subject: event.target.value }))} placeholder="What can we help you with?" maxLength={150} required /></label><label className="form-group">Your message<textarea className="input" rows={6} value={support.message} onChange={event => setSupport(value => ({ ...value, message: event.target.value }))} placeholder="Tell us what happened and what you were trying to do…" maxLength={2000} required /></label><p className="workspace-callout"><DashboardIcon name="help" size={18} /> Support requests and replies currently stay in this browser. They are not delivered to an administrator on another device.</p><button className="member-button" type="submit">Save support request <DashboardIcon name="arrowRight" size={16} /></button></form></section>}
      </div>
      <section className="support-history"><div className="workspace-section-heading"><div><p className="member-kicker">KEEP THE CONVERSATION TOGETHER</p><h2>{admin ? 'Support inbox' : 'Your saved requests'}</h2></div><span className="workspace-status">{requests.length} request{requests.length === 1 ? '' : 's'}</span></div>{!requests.length ? <div className="workspace-panel workspace-empty"><DashboardIcon name="message" size={29} /><h3>No requests yet</h3><p>Your saved questions and replies will appear here.</p></div> : requests.map(request => <article className="workspace-panel support-thread" key={request.id}><header><div><h3>{request.subject}</h3><small>{request.sender} · {new Date(request.createdAt).toLocaleDateString()}</small></div><span className="workspace-status">{request.status}</span></header><p>{request.message}</p>{(request.replies || []).map((message, index) => <div className="support-thread__reply" key={index}><strong>{message.sender}</strong><p>{message.message}</p></div>)}{admin && <form className="workspace-form" onSubmit={event => reply(event, request)}><label className="form-group">Reply<textarea className="input" value={replies[request.id] || ''} onChange={event => setReplies(value => ({ ...value, [request.id]: event.target.value }))} required /></label><button className="member-button" type="submit">Save reply</button></form>}</article>)}</section>
    </> : <>
      <div className="account-summary workspace-panel"><span className="account-summary__avatar">{(user?.name || 'A').slice(0, 1).toUpperCase()}</span><div><h2>{user?.name}</h2><p>{user?.email}</p></div><span className="workspace-status is-active">{admin ? 'Administrator' : user?.role === 'buyer' ? 'Buyer / Vendor' : 'Farmer'}</span></div>
      <div className="account-settings-grid">
        <section className="workspace-panel"><div className="workspace-section-title"><span className="workspace-icon"><DashboardIcon name="user" size={24} /></span><div><h2>Profile details</h2><p>The name and email connected to your account.</p></div></div><form className="workspace-form" onSubmit={saveProfile}><label className="form-group">Full name<input className="input" autoComplete="name" value={profile.name} onChange={event => { setDirty(true); setProfile(value => ({ ...value, name: event.target.value })); }} required /></label><label className="form-group">Email address<input className="input" type="email" autoComplete="email" value={profile.email} onChange={event => { setDirty(true); setProfile(value => ({ ...value, email: event.target.value })); }} required /></label>{profileError && <p className="form-message error" role="alert">{profileError}</p>}<button className="member-button" type="submit" disabled={Boolean(saving)}>{saving === 'profile' ? 'Saving…' : 'Save profile'}</button></form></section>
        <section className="workspace-panel"><div className="workspace-section-title"><span className="workspace-icon"><DashboardIcon name="shield" size={24} /></span><div><h2>Account security</h2><p>A fresh password helps keep your account protected.</p></div></div><form className="workspace-form" onSubmit={changePassword}>{[['currentPassword', 'Current password'], ['newPassword', 'New password'], ['confirmPassword', 'Confirm new password']].map(([name, label]) => <div className="form-group" key={name}><label htmlFor={`settings-${name}`}>{label}</label><PasswordInput id={`settings-${name}`} value={passwords[name]} onChange={event => setPasswords(value => ({ ...value, [name]: event.target.value }))} autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'} minLength={name === 'currentPassword' ? undefined : 8} placeholder={name === 'currentPassword' ? 'Your current password' : 'At least 8 characters'} required /></div>)}{passwordError && <p className="form-message error" role="alert">{passwordError}</p>}<button className="member-button" type="submit" disabled={Boolean(saving)}>{saving === 'password' ? 'Updating…' : 'Update password'}</button></form></section>
      </div>
      <section className="workspace-panel account-appearance"><div className="workspace-section-title"><span className="workspace-icon"><DashboardIcon name="settings" size={24} /></span><div><h2>A look that suits you</h2><p>Your preference follows you across ArdNet. Currently using {theme} mode.</p></div></div><div className="appearance-options">{[['light', 'Light', 'A fresh, bright workspace'], ['dark', 'Dark', 'Soft contrast for darker surroundings'], ['system', 'Match device', 'Follow your device’s appearance']].map(([value, title, text]) => <button type="button" key={value} aria-pressed={preference === value} onClick={() => chooseTheme(value)}><span className={`appearance-preview appearance-preview--${value}`} /><strong>{title}</strong><small>{text}</small></button>)}</div></section>
    </>}
  </div>;
}
