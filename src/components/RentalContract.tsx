'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface RentalContractProps {
  open: boolean
  onClose: () => void
  onAccept: () => void
  checkIn?: string
  checkOut?: string
  guestCount?: number
  totalAmount?: number
  nights?: number
}

export default function RentalContract({
  open,
  onClose,
  onAccept,
  checkIn,
  checkOut,
  guestCount,
  totalAmount,
  nights,
}: RentalContractProps) {
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose()
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-xl font-bold text-foreground">
            Contrat de location saisonniere
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 py-6 space-y-6 text-sm leading-relaxed text-foreground">
          {/* Preambule */}
          <section>
            <p className="text-muted text-xs mb-4">
              Le present contrat est conclu entre le proprietaire (ci-apres &laquo;&nbsp;le Bailleur&nbsp;&raquo;) et le locataire (ci-apres &laquo;&nbsp;le Preneur&nbsp;&raquo;) aux conditions suivantes&nbsp;:
            </p>
          </section>

          {/* Article 1 */}
          <section>
            <h3 className="font-semibold text-base mb-2">Article 1 &mdash; Identification du logement</h3>
            <p>
              Le Bailleur met a la disposition du Preneur le logement suivant&nbsp;:
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Type&nbsp;: Appartement T2 d&apos;environ 45&nbsp;m&sup2;</li>
              <li>Adresse&nbsp;: communiquee par email 48h avant l&apos;arrivee</li>
              <li>Etage&nbsp;: 3eme etage avec ascenseur</li>
              <li>Composition&nbsp;: sejour avec cuisine equipee, 1 chambre, 1 salle de bain, 1 WC, 1 loggia fermee</li>
              <li>Equipements inclus&nbsp;: climatisation, Wi-Fi, place de parking privee</li>
            </ul>
          </section>

          {/* Article 2 */}
          <section>
            <h3 className="font-semibold text-base mb-2">Article 2 &mdash; Duree du sejour</h3>
            {checkIn && checkOut && nights ? (
              <p>
                Le sejour est prevu du <strong>{checkIn}</strong> au <strong>{checkOut}</strong>, soit <strong>{nights} nuit{nights > 1 ? 's' : ''}</strong>.
              </p>
            ) : (
              <p className="text-muted italic">
                Les dates seront precisees lors de la reservation.
              </p>
            )}
            <p className="mt-2">
              Arrivee&nbsp;: entre 15h et 17h le jour d&apos;arrivee.
              Depart&nbsp;: avant 10h le jour du depart.
            </p>
          </section>

          {/* Article 3 */}
          <section>
            <h3 className="font-semibold text-base mb-2">Article 3 &mdash; Capacite d&apos;accueil</h3>
            <p>
              La capacite maximale du logement est de <strong>4 personnes</strong>.
              {guestCount && (
                <> Le nombre de voyageurs declares pour ce sejour est de <strong>{guestCount}</strong>.</>
              )}
            </p>
            <p className="mt-1">
              Tout depassement de la capacite maximale sans accord prealable du Bailleur pourra entrainer la resiliation immediate du contrat, sans remboursement.
            </p>
          </section>

          {/* Article 4 */}
          <section>
            <h3 className="font-semibold text-base mb-2">Article 4 &mdash; Prix et conditions de paiement</h3>
            {totalAmount ? (
              <p>
                Le montant total du sejour s&apos;eleve a <strong>{totalAmount.toFixed(2)}&nbsp;&euro;</strong>, incluant l&apos;hebergement, les frais de menage, le linge de lit et serviettes, et la taxe de sejour.
              </p>
            ) : (
              <p className="text-muted italic">
                Le montant total sera calcule en fonction des dates selectionnees.
              </p>
            )}
            <p className="mt-2">
              Le paiement integral est exige a la reservation, par carte bancaire via la plateforme securisee Stripe.
            </p>
          </section>

          {/* Article 5 */}
          <section>
            <h3 className="font-semibold text-base mb-2">Article 5 &mdash; Depot de garantie (caution)</h3>
            <p>
              Un depot de garantie de <strong>300&nbsp;&euro;</strong> est collecte sous forme d&apos;empreinte bancaire lors de la reservation. Ce montant ne sera pas debite sauf en cas de dommages constates lors de l&apos;etat des lieux de sortie.
            </p>
            <p className="mt-1">
              La caution est restituee (liberation de l&apos;empreinte) sous 7 jours apres le depart, deduction faite des eventuelles reparations ou remplacements necessaires.
            </p>
          </section>

          {/* Article 6 */}
          <section>
            <h3 className="font-semibold text-base mb-2">Article 6 &mdash; Reglement interieur</h3>
            <p className="mb-2">Le Preneur s&apos;engage a respecter les regles suivantes&nbsp;:</p>
            <ul className="list-disc ml-5 space-y-1.5">
              <li>
                <strong>Non-fumeur</strong>&nbsp;: le logement est strictement non-fumeur (interieur et balcon). En cas de non-respect, des frais de desodorisation d&apos;un montant minimum de 500&nbsp;&euro; seront factures et debites de la caution.
              </li>
              <li>
                <strong>Animaux interdits</strong>&nbsp;: aucun animal n&apos;est admis dans le logement, quelle que soit sa taille ou son espece.
              </li>
              <li>
                <strong>Fetes et evenements interdits</strong>&nbsp;: les fetes, soirees et rassemblements sont strictement interdits. Les visiteurs non declares ne sont pas autorises.
              </li>
              <li>
                <strong>Horaires calmes</strong>&nbsp;: le calme doit etre respecte entre 22h et 9h, conformement au reglement de copropriete.
              </li>
              <li>
                <strong>Respect du voisinage</strong>&nbsp;: le Preneur s&apos;engage a respecter le reglement interieur de la copropriete et a ne causer aucune nuisance aux autres residents.
              </li>
            </ul>
          </section>

          {/* Article 7 */}
          <section>
            <h3 className="font-semibold text-base mb-2">Article 7 &mdash; Linge de lit et serviettes</h3>
            <p>
              Le linge de lit et les serviettes de toilette sont fournis pour la duree du sejour. Le Preneur est invite a preciser sa preference de literie (1 lit double 160x200 cm ou 2 lits simples 80x200 cm) lors de la reservation.
            </p>
            <p className="mt-2">
              Un lit parapluie et une chaise haute pour bebe sont disponibles gratuitement sur demande.
            </p>
          </section>

          {/* Article 8 */}
          <section>
            <h3 className="font-semibold text-base mb-2">Article 8 &mdash; Conditions d&apos;annulation</h3>
            <ul className="list-disc ml-5 space-y-1.5">
              <li>
                <strong>Plus de 30 jours avant l&apos;arrivee</strong>&nbsp;: annulation gratuite, remboursement integral.
              </li>
              <li>
                <strong>Entre 30 et 14 jours avant l&apos;arrivee</strong>&nbsp;: remboursement de 50&nbsp;% du montant total.
              </li>
              <li>
                <strong>Moins de 14 jours avant l&apos;arrivee</strong>&nbsp;: non remboursable.
              </li>
            </ul>
            <p className="mt-2">
              Toute demande d&apos;annulation doit etre faite par ecrit (email). La date de reception de l&apos;email fait foi.
            </p>
          </section>

          {/* Article 9 */}
          <section>
            <h3 className="font-semibold text-base mb-2">Article 9 &mdash; Assurance</h3>
            <p>
              Le Preneur est tenu de disposer d&apos;une assurance responsabilite civile villegiature couvrant les risques locatifs (incendie, degat des eaux, etc.) pendant toute la duree du sejour. Le Bailleur se reserve le droit de demander un justificatif.
            </p>
          </section>

          {/* Article 10 */}
          <section>
            <h3 className="font-semibold text-base mb-2">Article 10 &mdash; Etat des lieux</h3>
            <p>
              Un etat des lieux d&apos;entree sera effectue a l&apos;arrivee du Preneur. Un etat des lieux de sortie sera realise au depart. Toute degradation constatee sera a la charge du Preneur et debitee de la caution.
            </p>
          </section>

          {/* Article 11 */}
          <section>
            <h3 className="font-semibold text-base mb-2">Article 11 &mdash; Responsabilite</h3>
            <p>
              Le Preneur est responsable des dommages causes au logement, aux equipements et au mobilier pendant la duree du sejour. Le Bailleur ne saurait etre tenu responsable en cas de vol, perte ou dommage aux effets personnels du Preneur.
            </p>
          </section>

          {/* Article 12 */}
          <section>
            <h3 className="font-semibold text-base mb-2">Article 12 &mdash; Copropriete</h3>
            <p>
              Le logement fait partie d&apos;une copropriete. Le Preneur s&apos;engage a respecter le reglement interieur de la copropriete, notamment en ce qui concerne l&apos;utilisation des parties communes, le tri des dechets et le stationnement.
            </p>
          </section>

          {/* Article 13 */}
          <section>
            <h3 className="font-semibold text-base mb-2">Article 13 &mdash; Droit applicable</h3>
            <p>
              Le present contrat est regi par le droit francais. En cas de litige, les parties s&apos;engagent a rechercher une solution amiable. A defaut, le tribunal competent sera celui du lieu de situation du logement.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0">
          <button
            onClick={() => {
              onAccept()
              onClose()
            }}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition"
          >
            J&apos;accepte les conditions
          </button>
        </div>
      </div>
    </div>
  )
}
