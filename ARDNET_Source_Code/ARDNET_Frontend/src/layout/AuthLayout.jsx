import { Link } from 'react-router-dom';
import Brand from '../components/common/Brand';
import ListingIcon from '../features/listings/ListingIcon';
import AuthGarden from '../features/auth/AuthGarden';
import '../styles/auth-pages.scss';
import '../styles/recovery-pages.scss';

const recoveryStories = {
  forgot: { title: <>A little reset.<br /><span>A fresh start.</span></>, copy: 'Your local market will be right here. Let’s get you back to the connections that matter.', features: ['One secure link', 'A fresh password', 'Back to your community'] },
  verify: { title: <>One small step.<br /><span>A stronger connection.</span></>, copy: 'Confirm your email and make yourself at home among local farmers, buyers, and vendors.', features: ['Your email, verified', 'Your community, closer'] },
  reset: { title: <>A fresh password.<br /><span>A familiar welcome.</span></>, copy: 'A little care keeps your account protected. Choose a new password and pick up where you left off.', features: ['A secure account', 'A fresh start'] },
};

export default function AuthLayout({ children, register = false, admin = false, recovery }) {
  const story = recoveryStories[recovery];
  return <main id="main-content" className={`auth-experience${admin ? ' auth-experience--admin' : ''}${story ? ' auth-experience--recovery' : ''}`}>
    <header className="auth-experience__header"><Brand /><div className="auth-header-actions"><span className="theme-slot" data-theme-slot /><Link className="auth-home-link" to="/"><ListingIcon name="left" size={15} /> Back to home</Link></div></header>
    <div className="auth-experience__frame">
      <aside className="auth-story" aria-label={admin ? 'Administrator workspace' : 'Welcome to ArdNet'}>
        <span className="auth-story__badge"><ListingIcon name={admin ? 'check' : 'leaf'} size={15} /> {admin ? 'ADMINISTRATOR WORKSPACE' : 'ROOTED IN LOCAL CONNECTIONS'}</span>
        <h2>{story ? story.title : admin ? <>A little oversight.<br /><span>A stronger community.</span></> : register ? <>Good things grow<br /><span>when we connect.</span></> : <>Your local market.<br /><span>A fresh perspective.</span></>}</h2>
        <p>{story ? story.copy : admin ? 'Help keep the ArdNet community connected, informed, and moving forward.' : 'A place for farmers, buyers, and vendors to discover produce and make informed market decisions.'}</p>
        <AuthGarden admin={admin} />
        <div className="auth-story__features">{(story ? story.features : admin ? ['Users & listings', 'Market records', 'Community activity'] : ['Local produce', 'Market insights', 'Price alerts']).map(text => <span key={text}><ListingIcon name="check" size={13} />{text}</span>)}</div>
      </aside>
      <div className="auth-experience__form">
        {children}
        <p className="auth-experience__foot">{story ? <>Ready to return? <Link to="/login">Back to sign in</Link></> : admin ? <><ListingIcon name="check" size={14} /> Authorized administrators only. <Link to="/login">Member sign in</Link></> : register ? <>Already part of the community? <Link to="/login">Sign in</Link></> : <>New to ArdNet? <Link to="/register">Create an account</Link></>}</p>
      </div>
    </div>
    <footer className="auth-experience__footer"><span>© {new Date().getFullYear()} ArdNet</span><span>Connecting farms. Growing possibilities.</span></footer>
  </main>;
}
