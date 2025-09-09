import { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, Lock, Send } from 'lucide-react';
import { api } from '../lib/api';
import { useUser } from '../store/user';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const login = useUser((s) => s.login);
	const navigate = useNavigate();

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		if (!email || !password) {
			const m = 'Email et mot de passe requis';
			setError(m);
			toast.error(m);
			return;
		}
		setLoading(true);
		try {
			const res = await api.post('/auth/login', { email, password });
			const { user, token } = res.data;
			login({ ...user, token });
			toast.success('Connexion réussie');
			if (user.role === 'admin') {
				navigate('/admin');
			} else {
				navigate('/');
			}
		} catch (err: any) {
			const msg = err?.response?.data?.message || 'Identifiants invalides';
			setError(msg);
			toast.error(msg);
		} finally {
			setLoading(false);
		}
	}

	function onSocial(provider: 'google' | 'facebook') {
		const base = (api.defaults.baseURL || '').replace(/\/$/, '');
		window.location.href = `${base}/auth/oauth/${provider}`;
	}

	return (
		<div className="auth">
			<div className="card">
				<h1>Se connecter</h1>
				<p className="muted">Accédez à votre compte Makiti</p>
				<div className="social-login" style={{ display:'grid', gap:8, margin:'12px 0' }}>
					<button type="button" onClick={() => onSocial('google')} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'#ffffff', color:'#0f172a', border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 12px', cursor:'pointer' }}>Continuer avec Google</button>
					<button type="button" onClick={() => onSocial('facebook')} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'#1877F2', color:'#ffffff', border:'1px solid #1877F2', borderRadius:8, padding:'10px 12px', cursor:'pointer' }}>Continuer avec Facebook</button>
				</div>
				<div style={{ display:'flex', alignItems:'center', gap:10, margin:'12px 0' }}>
					<div style={{ height:1, background:'#e5e7eb', flex:1 }} />
					<span style={{ color:'#64748b', fontSize:12 }}>ou</span>
					<div style={{ height:1, background:'#e5e7eb', flex:1 }} />
				</div>
				<form onSubmit={onSubmit}>
					<div className="field">
						<label>Email</label>
						<div className="input-wrapper">
							<span className="input-icon"><Mail size={16} /></span>
							<input className="with-leading-icon" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" type="email" />
						</div>
					</div>
					<div className="field">
						<label>Mot de passe</label>
						<div className="input-wrapper">
							<span className="input-icon"><Lock size={16} /></span>
							<input className="with-leading-icon" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" type="password" />
						</div>
					</div>
					{error ? <div className="error" role="alert">{error}</div> : null}
					<div className="actions">
						<button type="submit" className="btn primary" disabled={loading}>{loading ? 'Connexion...' : 'Connexion'}</button>
						<div>
							Pas de compte ? <Link to="/register">Créer un compte</Link>
						</div>
						<div style={{ marginTop: 6 }}>
							<Link to="/forgot" className="btn outline" style={{ padding: '8px 12px' }}>
								<Send size={14} />&nbsp;Mot de passe oublié
							</Link>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
