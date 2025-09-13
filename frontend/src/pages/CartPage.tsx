import { Link } from 'react-router-dom';
import { useCart } from '../store/cart';
import { Trash2, Plus, Minus } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function CartPage() {
  const items = useCart((s) => s.items);
  const updateQty = useCart((s) => s.updateQty);
  const removeItem = useCart((s) => s.removeItem);
  const clear = useCart((s) => s.clear);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const formatPrice = (n: number) => `${n.toLocaleString('fr-FR')} GNF`;
  const subtotal = items.reduce((acc, it) => acc + it.price * it.qty, 0);

  const changeQty = (id: string, qty: number) => {
    if (qty <= 0) {
      removeItem(id);
    } else {
      updateQty(id, qty);
    }
  };

  const handleCheckout = () => {
    setShowPaymentModal(true);
  };

  const handlePayment = (method: string, data: any) => {
    toast.success(`Paiement ${method} en cours...`);
    setShowPaymentModal(false);
    
    setTimeout(() => {
      toast.success('Paiement réussi ! Commande confirmée.');
      clear();
    }, 2000);
  };

  return (
    <div style={{ maxWidth: 960, margin: '16px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, margin: '8px 0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3h2l.4 2M7 13h10l3-7H6.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="9" cy="21" r="1" fill="currentColor"/>
            <circle cx="20" cy="21" r="1" fill="currentColor"/>
          </svg>
          <h1 style={{ margin: 0 }}>Mon panier</h1>
          <span style={{ background:'#f1f5f9', color:'#0f172a', border:'1px solid #e5e7eb', borderRadius:9999, padding:'4px 10px', fontSize:12 }}>{items.length} article{items.length>1?'s':''}</span>
        </div>
        {items.length > 0 && (
          <button className="btn outline" onClick={() => clear()}>Vider</button>
        )}
      </div>

      {items.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
          Votre panier est vide. <Link to="/catalog">Parcourir le catalogue</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          {/* Liste des articles */}
          <div style={{ display: 'grid', gap: 12 }}>
            {items.map((it) => (
              <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '72px 1fr auto auto', gap: 12, alignItems: 'center', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
                <div style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden', background: '#f1f5f9', border: '1px solid #e5e7eb', display: 'grid', placeItems: 'center' }}>
                  {it.image ? (
                    <img src={it.image} alt={it.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>Aucune image</span>
                  )}
                </div>
                <div style={{ display: 'grid', gap: 4 }}>
                  <div style={{ fontWeight: 600 }}>{it.title}</div>
                  <div style={{ color: '#64748b' }}>Prix unitaire: {formatPrice(it.price)}</div>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', border:'1px solid #e5e7eb', borderRadius:9999, overflow:'hidden' }}>
                  <button onClick={() => changeQty(it.id, it.qty - 1)} aria-label="Diminuer la quantité" style={{ width:36, height:36, display:'grid', placeItems:'center', background:'#f8fafc', border:'none', cursor:'pointer' }}>
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={it.qty}
                    onChange={(e) => changeQty(it.id, Math.max(1, Number(e.target.value)))}
                    style={{ width: 56, textAlign: 'center', padding: '0 6px', border: 'none', outline:'none' }}
                  />
                  <button onClick={() => changeQty(it.id, it.qty + 1)} aria-label="Augmenter la quantité" style={{ width:36, height:36, display:'grid', placeItems:'center', background:'#f8fafc', border:'none', cursor:'pointer' }}>
                    <Plus size={14} />
                  </button>
                </div>
                <div style={{ display: 'grid', gap: 8, justifyItems: 'end' }}>
                  <div style={{ fontWeight: 700, color: 'var(--brand)' }}>{formatPrice(it.price * it.qty)}</div>
                  <button className="btn outline small" onClick={() => removeItem(it.id)} aria-label="Supprimer">
                    <Trash2 size={14} />&nbsp;Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Récapitulatif */}
          <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, alignSelf: 'start' }}>
            <h3 style={{ marginTop: 0 }}>Résumé</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Sous-total</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Livraison</span>
                <span>Calculée à l'étape suivante</span>
              </div>
            </div>
            <div style={{ height: 1, background: '#e5e7eb', margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}>
              <span>Total</span>
              <span style={{ fontWeight: 800 }}>{formatPrice(subtotal)}</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <button onClick={handleCheckout} className="btn" style={{ width: '100%', justifyContent: 'center' }}>Passer la commande</button>
            </div>
            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <Link to="/catalog" className="btn outline small" style={{ justifyContent: 'center' }}>Continuer vos achats</Link>
            </div>
          </div>
        </div>
      )}
      
      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={subtotal}
        onPayment={handlePayment}
      />
    </div>
  );
}
