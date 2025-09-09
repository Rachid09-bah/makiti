import { useState } from 'react';
import { api } from '../lib/api';
import { Mail, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null); setMessage(null);
		if (!email) { setError('Email requis'); return; }
		setLoading(true);
		try {
			await api.post('/auth/forgot-password', { email });
			setMessage('Si un compte correspond, un email a été envoyé.');
		} catch (err: any) {
			setError(err?.response?.data?.message || 'Impossible d’envoyer la demande');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="auth">
			<div className="card">
				<h1>Mot de passe oublié</h1>
				<p className="muted">Entrez votre email pour recevoir les instructions</p>
				<form onSubmit={onSubmit}>
					<div className="field">
						<label>Email</label>
						<div className="input-wrapper">
							<span className="input-icon"><Mail size={16} /></span>
							<input className="with-leading-icon" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" type="email" />
						</div>
					</div>
					{error ? <div className="error" role="alert">{error}</div> : null}
					{message ? <div className="error" style={{ color:'#166534', background:'#dcfce7', borderColor:'#86efac' }} role="status">{message}</div> : null}
					<div className="actions">
						<button type="submit" className="btn primary" disabled={loading}>{loading ? 'Envoi...' : (<span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Send size={16} /> Envoyer</span>)}</button>
						<div>
							Retour à la <Link to="/login">connexion</Link>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}

