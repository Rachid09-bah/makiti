import { useState } from 'react';
import { X, CreditCard, Smartphone } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onPayment: (method: string, data: any) => void;
}

export default function PaymentModal({ isOpen, onClose, total, onPayment }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMethod === 'card') {
      onPayment(selectedMethod, cardData);
    } else {
      onPayment(selectedMethod, { phoneNumber });
    }
  };

  const formatPrice = (n: number) => `${n.toLocaleString('fr-FR')} GNF`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Paiement</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={20} />
            </button>
          </div>

          {/* Total */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total à payer :</span>
              <span className="text-xl font-bold text-[var(--brand)]">{formatPrice(total)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Payment Methods */}
            <div className="space-y-3 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Choisir un mode de paiement</h3>
              
              {/* Orange Money */}
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedMethod === 'orange' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="orange"
                  checked={selectedMethod === 'orange'}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-8 bg-orange-500 rounded flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Orange Money</div>
                    <div className="text-sm text-gray-500">Paiement mobile</div>
                  </div>
                </div>
              </label>

              {/* Mobile Money */}
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedMethod === 'mobile' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="mobile"
                  checked={selectedMethod === 'mobile'}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-8 bg-blue-500 rounded flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Mobile Money</div>
                    <div className="text-sm text-gray-500">MTN, Moov, etc.</div>
                  </div>
                </div>
              </label>

              {/* Carte Bancaire */}
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedMethod === 'card' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={selectedMethod === 'card'}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-8 bg-green-500 rounded flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Carte Bancaire</div>
                    <div className="text-sm text-gray-500">Visa, Mastercard</div>
                  </div>
                </div>
              </label>
            </div>

            {/* Payment Details */}
            {(selectedMethod === 'orange' || selectedMethod === 'mobile') && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de téléphone
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="620 00 00 00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)]"
                    required
                  />
                </div>
              </div>
            )}

            {selectedMethod === 'card' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom sur la carte
                  </label>
                  <input
                    type="text"
                    value={cardData.name}
                    onChange={(e) => setCardData({...cardData, name: e.target.value})}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de carte
                  </label>
                  <input
                    type="text"
                    value={cardData.number}
                    onChange={(e) => setCardData({...cardData, number: e.target.value})}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)]"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date d'expiration
                    </label>
                    <input
                      type="text"
                      value={cardData.expiry}
                      onChange={(e) => setCardData({...cardData, expiry: e.target.value})}
                      placeholder="MM/AA"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      value={cardData.cvv}
                      onChange={(e) => setCardData({...cardData, cvv: e.target.value})}
                      placeholder="123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)]"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedMethod}
              className="w-full bg-[var(--brand)] text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              Payer {formatPrice(total)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}