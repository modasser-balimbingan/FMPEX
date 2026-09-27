import { Link } from 'react-router-dom';
import Brand from '../components/common/Brand';
import RegisterForm from '../features/auth/RegisterForm';
export default function RegisterPage()
{return <main className="auth-page"><div className="auth-wrap"><Brand/><RegisterForm/>
<p className="auth-foot">Already registered? <Link to="/login">Sign in</Link></p>
</div>
</main>
}
