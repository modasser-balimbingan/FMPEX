import { Link } from 'react-router-dom';
export default function NotFoundPage()
{return <main className="auth-page">
    <div className="auth-wrap card" style={{padding:40,textAlign:'center'}}>
        <h1>Page not found</h1>
        <p className="muted">The page you requested does not exist.</p>
        <Link className="btn btn-primary" to="/">Back to ArdNet</Link>
        </div>
        </main>
        }
