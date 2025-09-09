import { useState } from 'react';
import { api } from '../lib/api';
import { Mail, User, Type, MessageSquare, Send, CheckCircle2, AlertCircle, Phone } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!name.trim()) return 'Le nom est requis';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email invalide';
    if (!subject.trim()) return 'Le sujet est requis';
    if (!message.trim() || message.trim().length < 10) return 'Message trop court (min 10 caractères)';
    return null;
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null);
    const v = validate();
    if (v) { setError(v); return; }
    setLoading(true);
    try {
      const res = await api.post('/send-mail', {
        to: 'contact@makiti.local',
        subject: `[Contact] ${subject}`,
        html: `<p><b>Nom:</b> ${name}<br/><b>Email:</b> ${email}<br/><b>Message:</b><br/>${message.replace(/\n/g, '<br/>')}</p>`,
        text: `Nom: ${name}\nEmail: ${email}\nMessage:\n${message}`
      });
      if (res.data?.success) {
        setSuccess('Votre message a été envoyé. Nous vous répondrons rapidement.');
        setName(''); setEmail(''); setSubject(''); setMessage('');
      } else {
        setError('Impossible d\'envoyer le message');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 920, margin: '24px auto', padding: '0 16px', display: 'grid', gap: 16 }}>
      <div>
        <h1 style={{ margin: '0 0 6px' }}>Contact</h1>
        <p className="muted" style={{ margin: 0 }}>Une question ? Besoin d\'aide ? Écrivez-nous</p>
      </div>

      {success && (
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#ecfdf5', color:'#065f46', border:'1px solid #a7f3d0', borderRadius:10, padding:'10px 12px' }}>
          <CheckCircle2 size={16} /> {success}
        </div>
      )}
      {error && (
        <div className="error" role="alert" style={{ display:'flex', alignItems:'center', gap:8 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        <form onSubmit={onSubmit} style={{ background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:12, padding:16, display:'grid', gap:12 }}>
          <div className="field">
            <label>Nom</label>
            <div className="input-wrapper">
              <span className="input-icon"><User size={16} /></span>
              <input className="with-leading-icon" value={name} onChange={e => setName(e.target.value)} placeholder="Votre nom" />
            </div>
          </div>
          <div className="field">
            <label>Email</label>
            <div className="input-wrapper">
              <span className="input-icon"><Mail size={16} /></span>
              <input className="with-leading-icon" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemple.com" />
            </div>
          </div>
          <div className="field">
            <label>Sujet</label>
            <div className="input-wrapper">
              <span className="input-icon"><Type size={16} /></span>
              <input className="with-leading-icon" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Sujet du message" />
            </div>
          </div>
          <div className="field">
            <label>Message</label>
            <div className="input-wrapper">
              <span className="input-icon"><MessageSquare size={16} /></span>
              <textarea rows={6} value={message} onChange={e => setMessage(e.target.value)} placeholder="Décrivez votre demande" style={{ padding: '12px 12px', borderRadius: 10, border: '1px solid #e5e7eb' }} />
            </div>
            <small className="muted">Minimum 10 caractères</small>
          </div>
          <div className="actions" style={{ display:'flex', gap: 10 }}>
            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? 'Envoi...' : (<span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Send size={16} /> Envoyer</span>)}
            </button>
          </div>
        </form>

        <aside style={{ display:'grid', gap: 12 }}>
          <div style={{ background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:12, padding:16 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Coordonnées</h3>
            <div style={{ display:'grid', gap: 6, color:'#334155' }}>
              <div>Makiti • Conakry, Guinée</div>
              <div><a href="mailto:contact@makiti.local">contact@makiti.local</a></div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Phone size={14} /> +224 620 00 00 00</div>
            </div>
          </div>
          <div style={{ background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:12, padding:16 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Support</h3>
            <p className="muted" style={{ margin: 0 }}>Notre équipe vous répond sous 24h ouvrées.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
