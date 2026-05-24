import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Mentions légales · Appartement du Port Hyères',
}

export default function MentionsLegales() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 prose prose-gray">
          <h1>Mentions légales</h1>

          <h2>Éditeur du site</h2>
          <p>
            Thomas Manuguerra<br />
            Port de Hyères, 83400 Hyères, Var, France<br />
            Email : thomasmanuguerra@gmail.com
          </p>

          <h2>Hébergement</h2>
          <p>
            Ce site est hébergé par Vercel Inc., 440 N Bashaw Ave #100, Covina, CA 91723, États-Unis.
          </p>

          <h2>Meublé de tourisme</h2>
          <p>
            N° d&apos;enregistrement : en cours d&apos;obtention auprès de la mairie de Hyères.
          </p>

          <h2>Politique d&apos;annulation</h2>
          <ul>
            <li>Annulation gratuite jusqu&apos;à 14 jours avant l&apos;arrivée : remboursement intégral.</li>
            <li>Annulation entre 14 et 7 jours avant l&apos;arrivée : remboursement de 50%.</li>
            <li>Annulation moins de 7 jours avant l&apos;arrivée : aucun remboursement.</li>
          </ul>

          <h2>Protection des données personnelles (RGPD)</h2>
          <p>
            Les données personnelles collectées (nom, email, téléphone) sont utilisées exclusivement
            pour la gestion de votre réservation et, si vous y avez consenti, pour l&apos;envoi d&apos;offres
            et actualités.
          </p>
          <p>
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez
            d&apos;un droit d&apos;accès, de rectification, d&apos;effacement et de portabilité de vos données.
            Pour exercer ces droits, contactez-nous à thomasmanuguerra@gmail.com.
          </p>
          <p>
            Vos données ne sont jamais transmises à des tiers à des fins commerciales. Les paiements
            sont traités de manière sécurisée par Stripe, qui dispose de sa propre politique de
            confidentialité.
          </p>

          <h2>Cookies</h2>
          <p>
            Ce site utilise uniquement des cookies techniques nécessaires au bon fonctionnement du
            service et des outils d&apos;analyse anonymisés (Vercel Analytics).
          </p>

          <h2>Propriété intellectuelle</h2>
          <p>
            L&apos;ensemble des contenus (textes, images, design) de ce site est protégé par le droit
            d&apos;auteur. Toute reproduction est interdite sans autorisation préalable.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
