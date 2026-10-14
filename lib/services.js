// Services repris du site public globesecure.ca (inventaire du 14 octobre 2026).
// Les formulations françaises rendent le contenu anglais original sans inventer de nouveaux services.
export const services = [
  {
    slug: "evenementiel",
    number: "01",
    label: "Sécurité événementielle",
    labelEn: "EVENT SECURITY",
    image: "/original-site/event-security.jpeg",
    summary: "Des services de sécurité professionnelle pour des événements de toutes tailles.",
    detail: "Gestion des foules, des accès et des situations d'urgence pour des événements publics et privés, avec des mesures adaptées à chaque rassemblement.",
    points: ["Gestion des foules", "Contrôle des accès", "Intervention en situation d'urgence", "Protection VIP"]
  },
  {
    slug: "chantiers",
    number: "02",
    label: "Surveillance de chantiers",
    labelEn: "CONSTRUCTION SITE SURVEILLANCE",
    image: "/original-site/contruction.jpeg",
    summary: "Surveillance et protection des chantiers et des équipements.",
    detail: "Des mesures adaptées aux zones de construction et aux espaces en évolution, comprenant la surveillance du site et le signalement des incidents.",
    points: ["Surveillance 24 h/24 et 7 j/7", "Protection de l'équipement", "Contrôle des accès", "Rapports d'incident"]
  },
  {
    slug: "sante",
    number: "03",
    label: "Sécurité hospitalière",
    labelEn: "HOSPITAL SECURITY",
    image: "/original-site/hospital.jpeg",
    summary: "Une sécurité adaptée aux établissements de soins et aux environnements médicaux.",
    detail: "Une présence professionnelle centrée sur la protection du personnel, des patients et des visiteurs en établissement de santé.",
    points: ["Sécurité des patients", "Protection du personnel", "Intervention d'urgence", "Gestion des visiteurs"]
  },
  {
    slug: "entreprises",
    number: "04",
    label: "Sécurité d'entreprise",
    labelEn: "CORPORATE SECURITY",
    image: "/original-site/corporate.jpeg",
    summary: "Des solutions de protection pour vos bureaux et installations d'entreprise.",
    detail: "Des dispositifs destinés aux activités des entreprises, incluant la maîtrise des accès, les rondes et l'évaluation des risques.",
    points: ["Contrôle d'accès", "Services de patrouille", "Protection des actifs", "Évaluation des risques"]
  },
  {
    slug: "commerces",
    number: "05",
    label: "Sécurité des commerces",
    labelEn: "RETAIL SECURITY",
    image: "/original-site/retail.jpeg",
    summary: "Prévention des pertes et sécurité des clients en environnement commercial.",
    detail: "Une présence adaptée aux magasins, aux zones de vente et aux espaces accessibles au public.",
    points: ["Prévention des pertes", "Sécurité des clients", "Dissuasion du vol", "Patrouilles en magasin"]
  },
  {
    slug: "alarmes",
    number: "06",
    label: "Réponse aux alarmes",
    labelEn: "ALARM RESPONSE",
    image: "/original-site/alarm.jpeg",
    summary: "Des services d'intervention en cas d'alarme et de situation urgente.",
    detail: "Évaluation des situations déclenchant une alarme et coordination avec les intervenants selon les besoins du mandat.",
    points: ["Disponibilité 24 h/24 et 7 j/7", "Déploiement rapide", "Évaluation de l'incident", "Coordination des interventions d'urgence"]
  }
];
export function serviceBySlug(slug) {
  return services.find((service) => service.slug === slug);
}
