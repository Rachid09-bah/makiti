import { useState } from 'react';
import { api } from '../lib/api';
import { Lock, CheckCircle2 } from 'lucide-react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';

export default function ResetPasswordPage() {
	const [params] = useSearchParams();
	const navigate = useNavigate();
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [ok, setOk] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null); setOk(false);
		if (!password || password.length < 6) { setError('Mot de passe trop court'); return; }
		if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return; }
		setLoading(true);
		try {
			const token = params.get('token');
			await api.post('/auth/reset-password', { token, password });
			setOk(true);
			setTimeout(() => navigate('/login'), 1200);
		} catch (err: any) {
			setError(err?.response?.data?.message || 'Lien invalide ou expiré');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="auth">
			<div className="card">
				<h1>Réinitialiser le mot de passe</h1>
				<form onSubmit={onSubmit}>
					<div className="field">
						<label>Nouveau mot de passe</label>
						<div className="input-wrapper">
							<span className="input-icon"><Lock size={16} /></span>
							<input className="with-leading-icon" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Au moins 6 caractères" />
						</div>
					</div>
					<div className="field">
						<label>Confirmer</label>
						<div className="input-wrapper">
							<span className="input-icon"><Lock size={16} /></span>
							<input className="with-leading-icon" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Répétez le mot de passe" />
						</div>
					</div>
					{error ? <div className="error" role="alert">{error}</div> : null}
					{ok ? <div className="error" style={{ color:'#166534', background:'#dcfce7', borderColor:'#86efac' }} role="status"><CheckCircle2 size={16} /> Mot de passe mis à jour</div> : null}
					<div className="actions">
						<button type="submit" className="btn primary" disabled={loading}>{loading ? 'Enregistrement...' : 'Réinitialiser'}</button>
						<div>
							Retour à la <Link to="/login">connexion</Link>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}

