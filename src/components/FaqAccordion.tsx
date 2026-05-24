'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqSections = [
  {
    title: 'Réservation & paiement',
    items: [
      {
        question: 'Comment réserver ?',
        answer:
          'Sélectionnez vos dates, remplissez le formulaire et payez en ligne par carte bancaire. Vous recevrez un email de confirmation immédiatement.',
      },
      {
        question: 'Quels moyens de paiement acceptez-vous ?',
        answer:
          'Carte bancaire (Visa, Mastercard, American Express) via Stripe, plateforme 100% sécurisée.',
      },
      {
        question: 'Puis-je annuler ma réservation ?',
        answer:
          'Annulation gratuite jusqu’à 30 jours avant l’arrivée. Entre 30 et 14 jours : remboursement de 50%. Moins de 14 jours : non remboursable.',
      },
      {
        question: 'Qu’est-ce que la caution de 750 € ?',
        answer:
          'Une empreinte bancaire de 750 € est prise lors du paiement. Elle n’est pas débitée. Elle est restituée sous 7 jours après votre départ si aucun dommage n’est constaté.',
      },
    ],
  },
  {
    title: 'Le logement',
    items: [
      {
        question: 'Quelle est la capacité de l’appartement ?',
        answer:
          '4 personnes maximum. L’appartement dispose d’une chambre avec lit modulable (1 lit 160×200 ou 2 lits 80×200) et d’un canapé-lit dans le séjour.',
      },
      {
        question: 'Y a-t-il la climatisation ?',
        answer: 'Oui, dans le séjour et la chambre.',
      },
      {
        question: 'Le parking est-il inclus ?',
        answer:
          'Oui, une place de parking privé sécurisé est incluse, à 50 m de la résidence.',
      },
      {
        question: 'Le Wi-Fi est-il disponible ?',
        answer: 'Oui, connexion haut débit incluse.',
      },
      {
        question: 'L’appartement est-il accessible en ascenseur ?',
        answer: 'Oui, 3ᵉ étage avec ascenseur.',
      },
    ],
  },
  {
    title: 'Arrivée & départ',
    items: [
      {
        question: 'Quels sont les horaires ?',
        answer: 'Arrivée entre 15h et 17h. Départ avant 9h.',
      },
      {
        question: 'Comment accéder à l’appartement ?',
        answer:
          'Les informations d’accès détaillées (code, étage, parking) vous seront envoyées par email 48h avant votre arrivée.',
      },
      {
        question: 'Où se garer ?',
        answer:
          'Place de parking privé incluse. L’emplacement exact vous sera communiqué avant votre arrivée.',
      },
    ],
  },
  {
    title: 'Règles & conditions',
    items: [
      {
        question: 'Les animaux sont-ils acceptés ?',
        answer:
          'Non, les animaux ne sont pas acceptés quelle que soit leur taille.',
      },
      {
        question: 'L’appartement est-il fumeur ?',
        answer:
          'Non, l’appartement est strictement non-fumeur. Des frais de désodorisation (500 € minimum) seront facturés en cas de non-respect.',
      },
      {
        question: 'Y a-t-il des horaires de calme ?',
        answer: 'Oui, les horaires calmes sont de 22h à 9h.',
      },
      {
        question: 'Les fêtes sont-elles autorisées ?',
        answer:
          'Non, les fêtes, soirées et visiteurs non déclarés sont interdits.',
      },
    ],
  },
  {
    title: 'Aux alentours',
    items: [
      {
        question: 'Comment aller à Porquerolles ?',
        answer:
          'Les navettes partent du port (à 20 m de l’appartement) toute la journée. Traversée ~20 min. Pensez à réserver en haute saison sur tlv-tvm.com.',
      },
      {
        question: 'Où sont les plages les plus proches ?',
        answer: 'La plage de l’Almanarre est à 500 m à pied.',
      },
      {
        question: 'Y a-t-il des commerces à proximité ?',
        answer:
          'Oui, restaurants et commerces à 20 m (sur le port). Centre-ville de Hyères à 5,6 km.',
      },
      {
        question: 'Comment accéder depuis l’aéroport ?',
        answer:
          'L’aéroport de Toulon-Hyères est à seulement 1,5 km.',
      },
    ],
  },
]

export default function FaqAccordion() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  function toggle(key: string) {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <div className="space-y-10">
      {faqSections.map((section, si) => (
        <section key={si}>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {section.title}
          </h2>
          <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
            {section.items.map((item, qi) => {
              const key = `${si}-${qi}`
              const isOpen = openItems.has(key)
              return (
                <div key={key}>
                  <button
                    onClick={() => toggle(key)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface transition-colors"
                  >
                    <span className="font-medium text-foreground">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 shrink-0 text-muted transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                    style={{
                      gridTemplateRows: isOpen ? '1fr' : '0fr',
                    }}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-4 text-muted leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
