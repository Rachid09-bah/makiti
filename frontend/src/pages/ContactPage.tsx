import { useState } from 'react';
import { api } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/send-mail', {
        to: 'contact@makiti.local',
        subject: `[Contact] ${form.subject}`,
        html: `<p><b>Nom:</b> ${form.name}<br/><b>Email:</b> ${form.email}<br/><b>Sujet:</b> ${form.subject}<br/><b>Message:</b><br/>${form.message.replace(/\n/g, '<br/>')}</p>`,
        text: `Nom: ${form.name}\nEmail: ${form.email}\nSujet: ${form.subject}\nMessage:\n${form.message}`
      });
      setSuccess(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="flex flex-1 justify-center py-16 px-4">
        <div className="w-full max-w-lg text-center space-y-8">
          <div className="space-y-4">
            <div className="text-6xl">✅</div>
            <h2 className="text-4xl font-bold tracking-tight text-stone-900">Message envoyé !</h2>
            <p className="text-stone-600 text-lg">Merci pour votre message. Nous vous répondrons dans les plus brefs délais.</p>
          </div>
          <button 
            onClick={() => setSuccess(false)}
            className="flex items-center justify-center rounded-full bg-[var(--brand)] px-10 py-3 text-base font-bold text-white shadow-sm transition-transform hover:scale-105"
          >
            Envoyer un autre message
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 justify-center py-8 md:py-16 px-4">
      <div className="w-full max-w-lg space-y-8 md:space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold tracking-tight text-stone-900">Contactez-nous</h2>
          <p className="text-stone-600 text-lg">Nous serions ravis d'avoir de vos nouvelles. Remplissez le formulaire ci-dessous.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-800" htmlFor="nom">Nom</label>
            <input 
              className="form-input w-full rounded-xl border-stone-300 bg-white p-4 text-base placeholder:text-stone-500 focus:border-[var(--brand)] focus:ring-[var(--brand)]" 
              id="nom" 
              placeholder="Votre nom complet"
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-800" htmlFor="email">Email</label>
            <input 
              className="form-input w-full rounded-xl border-stone-300 bg-white p-4 text-base placeholder:text-stone-500 focus:border-[var(--brand)] focus:ring-[var(--brand)]" 
              id="email" 
              placeholder="Votre adresse email" 
              type="email"
              value={form.email} 
              onChange={(e) => setForm({ ...form, email: e.target.value })} 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-800" htmlFor="subject">Sujet</label>
            <input 
              className="form-input w-full rounded-xl border-stone-300 bg-white p-4 text-base placeholder:text-stone-500 focus:border-[var(--brand)] focus:ring-[var(--brand)]" 
              id="subject" 
              placeholder="Sujet de votre message"
              value={form.subject} 
              onChange={(e) => setForm({ ...form, subject: e.target.value })} 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-800" htmlFor="message">Message</label>
            <textarea 
              className="form-textarea w-full rounded-xl border-stone-300 bg-white p-4 text-base placeholder:text-stone-500 focus:border-[var(--brand)] focus:ring-[var(--brand)] min-h-40" 
              id="message" 
              placeholder="Laissez votre message ici..."
              value={form.message} 
              onChange={(e) => setForm({ ...form, message: e.target.value })} 
              required 
            />
          </div>
          
          {error && (
            <div className="error-message">
              <div className="error-content">
                <span>⚠️</span>
                <p>{error}</p>
              </div>
            </div>
          )}
          
          <div className="flex justify-center pt-4">
            <button 
              className="flex items-center justify-center rounded-full bg-[var(--brand)] px-10 py-3 text-base font-bold text-white shadow-sm transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Envoi...
                </>
              ) : (
                'Envoyer'
              )}
            </button>
          </div>
        </form>

        {/* Social Media */}
        <div className="text-center space-y-4 pt-8">
          <p className="text-stone-600 text-base">Suivez-nous sur les réseaux sociaux</p>
          <div className="flex justify-center gap-6">
            <a className="text-stone-500 hover:text-[var(--brand)] transition-colors" href="#">
              <svg className="h-8 w-8" fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z"></path>
              </svg>
            </a>
            <a className="text-stone-500 hover:text-[var(--brand)] transition-colors" href="#">
              <svg className="h-8 w-8" fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm8,191.63V152h24a8,8,0,0,0,0-16H136V112a16,16,0,0,1,16-16h16a8,8,0,0,0,0-16H152a32,32,0,0,0-32,32v24H96a8,8,0,0,0,0-16h24v63.63a88,88,0,1,1,16,0Z"></path>
              </svg>
            </a>
            <a className="text-stone-500 hover:text-[var(--brand)] transition-colors" href="#">
              <svg className="h-8 w-8" fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M247.39,68.94A8,8,0,0,0,240,64H209.57A48.66,48.66,0,0,0,168.1,40a46.91,46.91,0,0,0-33.75,13.7A47.9,47.9,0,0,0,120,88v6.09C79.74,83.47,46.81,50.72,46.46,50.37a8,8,0,0,0-13.65,4.92c-4.31,47.79,9.57,79.77,22,98.18a110.93,110.93,0,0,0,21.88,24.2c-15.23,17.53-39.21,26.74-39.47,26.84a8,8,0,0,0-3.85,11.93c.75,1.12,3.75,5.05,11.08,8.72C53.51,229.7,65.48,232,80,232c70.67,0,129.72-54.42,135.75-124.44l29.91-29.9A8,8,0,0,0,247.39,68.94Zm-45,29.41a8,8,0,0,0-2.32,5.14C196,166.58,143.28,216,80,216c-10.56,0-18-1.4-23.22-3.08,11.51-6.25,27.56-17,37.88-32.48A8,8,0,0,0,92,169.08c-.47-.27-43.91-26.34-44-96,16,13,45.25,33.17,78.67,38.79A8,8,0,0,0,136,104V88a32,32,0,0,1,9.6-22.92A30.94,30.94,0,0,1,167.9,56c12.66.16,24.49,7.88,29.44,19.21A8,8,0,0,0,204.67,80h16Z"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}