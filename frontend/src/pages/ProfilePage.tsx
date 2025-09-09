import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useUser } from '../store/user';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Phone, Image as ImageIcon, Mail, Save, CheckCircle2, AlertCircle } from 'lucide-react';

const MAX_PHOTO_MB = 5;

export default function ProfilePage() {
  const user = useUser((s) => s.user);
  const login = useUser((s) => s.login);
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState((user as any)?.phone || '');
  const [currentPhoto, setCurrentPhoto] = useState<string | undefined>((user as any)?.photoUrl);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const initialNameRef = useRef(name);
  const initialPhoneRef = useRef(phone);
  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const isDirty = useMemo(() => {
    return (
      name.trim() !== (initialNameRef.current || '').trim() ||
      (phone || '').trim() !== (initialPhoneRef.current || '').trim() ||
      !!photo
    );
  }, [name, phone, photo]);

  function validate(): string | null {
    if (!name.trim()) return 'Le nom est requis';
    if (photo) {
      if (!photo.type.startsWith('image/')) return 'Veuillez choisir une image (jpg, png, ...).';
      if (photo.size > MAX_PHOTO_MB * 1024 * 1024) return `Image trop lourde (> ${MAX_PHOTO_MB}Mo)`;
    }
    // Téléphone optionnel: 6 à 15 chiffres (GN/intl)
    if (phone && !/^\+?[0-9\s-]{6,15}$/.test(phone)) return 'Numéro de téléphone invalide';
    return null;
  }

  function onPickPhoto(file: File | null) {
    setError(null);
    setSuccess(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Veuillez choisir une image (jpg, png, ...).'); return; }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) { setError(`Image trop lourde (> ${MAX_PHOTO_MB}Mo)`); return; }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const v = validate();
    if (v) { setError(v); return; }
    if (!isDirty) { setSuccess('Aucun changement à enregistrer'); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      if (name.trim() !== initialNameRef.current) fd.append('name', name.trim());
      if ((phone || '').trim() !== (initialPhoneRef.current || '')) fd.append('phone', (phone || '').trim());
      if (photo) fd.append('photo', photo);
      const res = await api.patch('/users/me', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const updated = res.data;
      if (user) login({ ...user, name: updated.name, email: updated.email, role: updated.role, token: user.token, photoUrl: updated.photoUrl, phone: updated.phone } as any);
      setCurrentPhoto(updated.photoUrl);
      // Reset refs et états
      initialNameRef.current = updated.name || name;
      initialPhoneRef.current = updated.phone || '';
      setPhoto(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
      setSuccess('Profil mis à jour avec succès');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Impossible de mettre à jour');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 920, margin: '24px auto', padding: '0 16px', display: 'grid', gap: 16 }}>
      <div>
        <h1 style={{ margin: '0 0 6px' }}>Mon profil</h1>
        <p className="muted" style={{ margin: 0 }}>Gérez vos informations personnelles et votre photo de profil</p>
      </div>

      {success ? (
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#ecfdf5', color:'#065f46', border:'1px solid #a7f3d0', borderRadius:10, padding:'10px 12px' }}>
          <CheckCircle2 size={16} /> {success}
        </div>
      ) : null}
      {error ? (
        <div className="error" role="alert" style={{ display:'flex', alignItems:'center', gap:8 }}>
          <AlertCircle size={16} /> {error}
        </div>
      ) : null}

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
        {/* Section infos */}
        <section style={{ background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:12, padding:16, display:'grid', gap:12 }}>
          <h2 style={{ margin:0, fontSize:16 }}>Informations personnelles</h2>
          <div className="field">
            <label>Nom</label>
            <div className="input-wrapper">
              <span className="input-icon"><UserIcon size={16} /></span>
              <input className="with-leading-icon" value={name} onChange={(e) => { setName(e.target.value); setSuccess(null); }} placeholder="Votre nom" />
            </div>
          </div>
          <div className="field">
            <label>Email</label>
            <div className="input-wrapper">
              <span className="input-icon"><Mail size={16} /></span>
              <input className="with-leading-icon" value={user?.email || ''} disabled />
            </div>
            <small className="muted">Non modifiable</small>
          </div>
          <div className="field">
            <label>Téléphone (optionnel)</label>
            <div className="input-wrapper">
              <span className="input-icon"><Phone size={16} /></span>
              <input className="with-leading-icon" value={phone} onChange={(e) => { setPhone(e.target.value); setSuccess(null); }} placeholder="Ex: +224 620 12 34 56" />
            </div>
            <small className="muted">Format accepté: 6 à 15 chiffres, éventuellement avec + et espaces</small>
          </div>
        </section>

        {/* Section photo */}
        <section style={{ background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:12, padding:16, display:'grid', gap:12 }}>
          <h2 style={{ margin:0, fontSize:16 }}>Photo de profil</h2>
          <div className="upload-card">
            <div className="avatar-preview">
              {photoPreview ? (
                <img src={photoPreview} alt="Prévisualisation" />
              ) : currentPhoto ? (
                <img src={currentPhoto} alt="Photo actuelle" />
              ) : (
                <div className="avatar-initials"><ImageIcon size={18} /></div>
              )}
            </div>
            <div className="upload-actions">
              <label className="btn small" htmlFor="photo-input">Choisir une image</label>
              <input id="photo-input" type="file" accept="image/*" onChange={(e) => onPickPhoto(e.target.files?.[0] || null)} hidden />
              {(currentPhoto || photoPreview) ? (
                <button type="button" className="btn outline small" onClick={() => { onPickPhoto(null); setCurrentPhoto(undefined); }}>Retirer</button>
              ) : null}
            </div>
            <p className="muted small">PNG, JPG. Taille max {MAX_PHOTO_MB}Mo.</p>
          </div>
          <small className="muted">Astuce: si vous retirez la photo mais n'en téléversez pas une nouvelle, l'ancienne sera conservée.</small>
        </section>

        <div className="actions" style={{ display:'flex', gap:12, alignItems:'center' }}>
          <button className="btn primary" type="submit" disabled={saving || !isDirty}>{saving ? 'Enregistrement...' : (<span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Save size={16} /> Enregistrer</span>)}</button>
          <button type="button" className="btn outline" onClick={() => navigate('/account')}>Retour à Mon espace</button>
        </div>
      </form>
    </div>
  );
}
