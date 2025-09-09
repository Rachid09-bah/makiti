import React from 'react';

export type ProductCardProps = {
  image: string;
  badge?: string; // Exemples: 'Produit local', 'Promo', 'Nouveauté'
  title: string;
  price: number | string;
  actionLabel?: string; // Par défaut: 'Acheter maintenant'
  onAction?: () => void;
  className?: string;
};

function badgeClasses(label?: string): string {
  const v = (label || '').toLowerCase();
  if (v.includes('promo') || v.includes('promotion')) return 'bg-red-600 text-white';
  if (v.includes('nouveau') || v.includes('nouveauté') || v.includes('new')) return 'bg-indigo-600 text-white';
  if (v.includes('local')) return 'bg-emerald-600 text-white';
  return 'bg-slate-800 text-white';
}

function formatPrice(value: number | string): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    try {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'GNF', maximumFractionDigits: 0 }).format(value);
    } catch {
      return `${value.toLocaleString('fr-FR')} GNF`;
    }
  }
  return String(value);
}

export default function ProductCard({
  image,
  badge,
  title,
  price,
  actionLabel = 'Acheter maintenant',
  onAction,
  className,
}: ProductCardProps) {
  return (
    <div
      className={[
        'group bg-white rounded-2xl shadow-sm ring-1 ring-gray-200/70 transition-all duration-300 overflow-hidden',
        'hover:shadow-xl hover:-translate-y-1 hover:ring-orange-400/40',
        className || '',
      ].join(' ')}
      style={{ willChange: 'transform, box-shadow' }}
    >
      {/* Media */}
  <div className="relative bg-slate-50 aspect-[4/3] overflow-hidden">
        {badge ? (
          <span className={[
            'absolute top-3 left-3 z-10 px-2.5 py-1 text-[11px] font-semibold rounded-full shadow-sm',
            badgeClasses(badge),
          ].join(' ')}>
            {badge}
          </span>
        ) : null}
        {/* image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110 group-hover:brightness-95 group-hover:contrast-105"
          loading="lazy"
          style={{ willChange: 'transform, filter' }}
        />
      </div>

      {/* Body */}
      <div className="p-4 grid gap-2">
        <h3 className="text-slate-900 font-semibold leading-snug min-h-[2.5rem]">{title}</h3>
        <div className="flex items-center justify-between">
          <div className="text-orange-600 font-extrabold text-lg">{formatPrice(price)}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 pt-0 flex items-center gap-3">
        <button
          type="button"
          onClick={onAction}
          disabled={!onAction}
          className="flex-1 inline-flex justify-center items-center gap-2 rounded-lg bg-gradient-to-b from-orange-400 to-orange-500 text-white font-medium px-4 py-2.5 hover:from-orange-500 hover:to-orange-600 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm transition-all duration-200"
          style={{ willChange: 'transform, box-shadow' }}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
