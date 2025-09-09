import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Lock, Phone, Image as ImageIcon, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

const MAX_PHOTO_MB = 5;

export default function RegisterPage() {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [phone, setPhone] = useState('');
	const [photo, setPhoto] = useState<File | null>(null);
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const navigate = useNavigate();

	function handlePhotoChange(file: File | null) {
		setError(null);
		setPhoto(null);
		setPhotoPreview(null);
		if (!file) return;
		if (!file.type.startsWith('image/')) {
			setError('Veuillez choisir une image (jpg, png, ...).'); toast.error('Veuillez choisir une image (jpg, png, ...).');
			return;
		}
		if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
			setError(`Image trop lourde (>${MAX_PHOTO_MB}Mo).`); toast.error(`Image trop lourde (>${MAX_PHOTO_MB}Mo).`);
			return;
		}
		setPhoto(file);
		const url = URL.createObjectURL(file);
		setPhotoPreview(url);
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		if (!name || !email || !password) {
			setError('Nom, email et mot de passe requis (6 caractères minimum)'); toast.error('Nom, email et mot de passe requis (6 caractères minimum)');
			return;
		}
		if (password.length < 6) {
			setError('Le mot de passe doit contenir au moins 6 caractères'); toast.error('Le mot de passe doit contenir au moins 6 caractères');
			return;
		}
		if (password !== confirmPassword) {
			setError('Les mots de passe ne correspondent pas'); toast.error('Les mots de passe ne correspondent pas');
			return;
		}
		setLoading(true);
		try {
			if (photo) {
				const fd = new FormData();
				fd.append('name', name);
				fd.append('email', email);
				fd.append('password', password);
				if (phone) fd.append('phone', phone);
				fd.append('photo', photo);
				await api.post('/auth/register', fd);
			} else {
				await api.post('/auth/register', { name, email, password, phone });
			}
			toast.success('Compte créé. Vous pouvez vous connecter');
				navigate('/login');
		} catch (err: any) {
			const msg = err?.response?.data?.message;
			if (msg) { setError(msg); toast.error(msg); }
			else if (err?.response?.data?.errors) { const m = 'Veuillez vérifier les champs saisis'; setError(m); toast.error(m); }
			else { const m = 'Impossible de créer le compte'; setError(m); toast.error(m); }
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="auth">
			<div className="card">
				<h1>Créer un compte</h1>
				<p className="muted">Rejoignez Makiti en quelques secondes</p>
				<form onSubmit={onSubmit}>
					<div className="field">
						<label>Nom</label>
						<div className="input-wrapper">
							<span className="input-icon"><UserIcon size={16} /></span>
							<input className="with-leading-icon" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" />
						</div>
					</div>
					<div className="field">
						<label>Email</label>
						<div className="input-wrapper">
							<span className="input-icon"><Mail size={16} /></span>
							<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" type="email" />
						</div>
					</div>
					<div className="field">
						<label>Mot de passe</label>
						<div className="input-wrapper">
							<span className="input-icon"><Lock size={16} /></span>
							<input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Au moins 6 caractères" type={showPassword ? 'text' : 'password'} />
							<button type="button" className="input-action" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
								{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
							</button>
						</div>
						<small className="muted">Utilisez une combinaison de lettres, chiffres et symboles.</small>
					</div>
					<div className="field">
						<label>Confirmer le mot de passe</label>
						<div className="input-wrapper">
							<span className="input-icon"><Lock size={16} /></span>
							<input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Répétez le mot de passe" type={showPassword ? 'text' : 'password'} />
							<button type="button" className="input-action" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
								{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
							</button>
						</div>
					</div>
					<div className="field">
						<label>Téléphone (optionnel)</label>
						<div className="input-wrapper">
							<span className="input-icon"><Phone size={16} /></span>
							<input className="with-leading-icon" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex: 620123456" />
						</div>
					</div>
					<div className="field">
						<label>Photo (optionnelle)</label>
						<div className="upload-card">
							<div className="avatar-preview">
								{photoPreview ? (
									<img src={photoPreview} alt="Prévisualisation" />
								) : (
									<div className="avatar-initials"><ImageIcon size={18} /></div>
								)}
							</div>
							<div className="upload-actions">
								<label className="btn small" htmlFor="photo-input">Choisir une image</label>
								<input id="photo-input" type="file" accept="image/*" onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)} hidden />
								{photoPreview ? (
									<button type="button" className="btn outline small" onClick={() => handlePhotoChange(null)}>Retirer</button>
								) : null}
							</div>
							<p className="muted small">PNG, JPG. Taille max {MAX_PHOTO_MB}Mo.</p>
						</div>
					</div>
					{error ? <div className="error" role="alert">{error}</div> : null}
					<div className="actions">
						<button type="submit" className="btn primary" disabled={loading}>{loading ? 'Création...' : 'Créer le compte'}</button>
					</div>
				</form>
			</div>
		</div>
	);
}
