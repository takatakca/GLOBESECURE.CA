export const services = [
  {
    slug: "evenementiel",
    number: "01",
    label: "Événementiel",
    summary: "Des dispositifs de sécurité adaptés à la réalité de vos rassemblements.",
    detail: "Préparation des accès, accueil et contrôle des flux, surveillance des zones sensibles et coordination avec vos équipes sur place.",
    points: ["Planification des accès et des zones", "Surveillance et gestion de l'achalandage", "Coordination et comptes rendus"]
  },
  {
    slug: "sante",
    number: "02",
    label: "Établissements de santé",
    summary: "Une présence professionnelle dans les environnements où l'humain passe d'abord.",
    detail: "Une approche de prévention, d'observation et de communication adaptée aux établissements de soins et aux lieux d'accueil.",
    points: ["Prévention et rondes", "Contrôle des accès", "Communication et rapports d'incident"]
  },
  {
    slug: "entreprises",
    number: "03",
    label: "Entreprises et commerces",
    summary: "Protégez vos équipes, vos installations et la continuité de vos activités.",
    detail: "Des services de surveillance et de contrôle d'accès organisés selon les horaires, les risques et les particularités de vos installations.",
    points: ["Accueil et contrôle d'accès", "Rondes et surveillance", "Rapports adaptés au client"]
  },
  {
    slug: "chantiers",
    number: "04",
    label: "Chantiers et construction",
    summary: "Une vigilance adaptée aux sites temporaires et aux environnements évolutifs.",
    detail: "Surveillance préventive des accès, contrôle des présences et observations documentées sur vos sites de construction.",
    points: ["Sécurisation des accès", "Rondes préventives", "Rapports de quart"]
  }
];
export function serviceBySlug(slug) {
  return services.find((item) => item.slug === slug);
}
