import { Link } from 'react-router-dom';
import Brand from '../components/common/Brand';
import LoginForm from '../features/auth/LoginForm';
export default function LoginPage({ admin = false })
{return <main id="main-content" className="auth-page">
    <div className="auth-wrap"><Brand/>
    <LoginForm admin={admin}/>{admin ? 
    <p className="auth-foot">
     <Link to="/">Back to public site</Link></p> 
    : <p className="auth-foot">New to ArdNet? 
    <Link to="/register">Create an account</Link>
    <span aria-hidden="true"> · </span>
    <Link to="/admin/login">Administrator access</Link>
    </p>}
    </div>
    </main>
    }
