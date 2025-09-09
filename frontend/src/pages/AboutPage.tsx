import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">À propos de Makiti</h1>
        <p className="text-slate-600 mt-2">La marketplace guinéenne qui met en avant les produits locaux et l'artisanat.</p>
      </header>

      <section className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-lg mb-2">Notre mission</h3>
          <p className="text-slate-600">Faciliter la rencontre entre vendeurs locaux et clients, promouvoir le savoir-faire et créer de la valeur en Guinée.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-lg mb-2">Nos valeurs</h3>
          <p className="text-slate-600">Authenticité, qualité, proximité. Nous soutenons les artisans, producteurs et commerçants du pays.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-lg mb-2">Nos engagements</h3>
          <p className="text-slate-600">Expérience d'achat simple, paiement sécurisé, accompagnement des vendeurs et écoute des clients.</p>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-lg mb-2">Pour les clients</h3>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li>Découvrir des produits locaux (Leppi, Bazin, artisanat, etc.).</li>
            <li>Commander facilement et être livré partout en Guinée.</li>
            <li>Bénéficier d'un support réactif 7j/7.</li>
          </ul>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-lg mb-2">Pour les vendeurs</h3>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li>Vitrine en ligne professionnelle et rapide à mettre en place.</li>
            <li>Outils de gestion (produits, commandes, clients).</li>
            <li>Accompagnement pour développer votre activité.</li>
          </ul>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="grid md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold mb-1">Envie d'en savoir plus ou de rejoindre Makiti ?</h3>
            <p className="text-slate-600">Parcourez le catalogue ou contactez-nous pour toute question.</p>
          </div>
          <div className="flex gap-2 justify-start md:justify-end">
            <Link to="/catalog" className="inline-flex items-center justify-center rounded-lg bg-orange-500 text-white px-4 py-2 font-medium hover:bg-orange-600">Découvrir les produits</Link>
            <Link to="/contact" className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium hover:bg-slate-50">Nous contacter</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
