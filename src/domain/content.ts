// Contenu intégré, en français : fonctionne hors ligne et sans appel réseau.
import type { StatId } from "./types";

export interface BonusQuest {
  title: string;
  stat: StatId;
}

export const BONUS_QUESTS: readonly BonusQuest[] = [
  { title: "Faire 20 pompes, même en plusieurs fois", stat: "force" },
  { title: "Marcher 30 minutes sans téléphone", stat: "force" },
  { title: "Se coucher avant 23 h ce soir", stat: "force" },
  { title: "Faire 10 minutes d'étirements", stat: "force" },
  { title: "Monter les escaliers au lieu de l'ascenseur toute la journée", stat: "force" },
  { title: "Cuisiner un vrai repas maison", stat: "force" },
  { title: "Regarder un documentaire sur un sujet inconnu", stat: "intel" },
  { title: "Lire un article de fond jusqu'au bout", stat: "intel" },
  { title: "Apprendre 10 mots dans une langue étrangère", stat: "intel" },
  { title: "Refaire de tête un exercice raté en cours", stat: "intel" },
  { title: "Expliquer un cours à voix haute comme un prof", stat: "intel" },
  { title: "Écouter un podcast éducatif", stat: "intel" },
  { title: "Envoyer un message à quelqu'un que tu n'as pas vu depuis longtemps", stat: "charisme" },
  { title: "Faire un compliment sincère à quelqu'un", stat: "charisme" },
  { title: "Appeler un membre de ta famille", stat: "charisme" },
  { title: "Proposer une sortie à un ami", stat: "charisme" },
  { title: "Parler à une nouvelle personne", stat: "charisme" },
  { title: "Aider quelqu'un sans qu'on te le demande", stat: "charisme" },
  { title: "Ranger ton bureau pendant 15 minutes", stat: "discipline" },
  { title: "Une heure sans réseaux sociaux", stat: "discipline" },
  { title: "Préparer tes affaires de demain dès ce soir", stat: "discipline" },
  { title: "Faire la tâche que tu repousses depuis une semaine", stat: "discipline" },
  { title: "Trier 20 photos ou fichiers inutiles", stat: "discipline" },
  { title: "Écrire 3 choses positives de ta journée", stat: "discipline" },
  { title: "Noter toutes tes dépenses de la journée", stat: "richesse" },
  { title: "Résilier un abonnement que tu n'utilises pas", stat: "richesse" },
  { title: "Mettre 5 € de côté", stat: "richesse" },
  { title: "Mettre à jour ton CV ou ton profil LinkedIn", stat: "richesse" },
  { title: "Une journée sans achat superflu", stat: "richesse" },
  { title: "Comparer les prix avant un achat prévu", stat: "richesse" },
];

export interface Quote {
  text: string;
  author: string;
}

export const QUOTES: readonly Quote[] = [
  { text: "Ce que tu fais chaque jour compte plus que ce que tu fais de temps en temps.", author: "Gretchen Rubin" },
  { text: "La motivation te fait démarrer. L'habitude te fait continuer.", author: "Jim Ryun" },
  { text: "Le secret pour avancer, c'est de commencer.", author: "Mark Twain" },
  { text: "Il n'est pas nécessaire d'espérer pour entreprendre, ni de réussir pour persévérer.", author: "Guillaume d'Orange" },
  { text: "La seule façon de faire du bon travail est d'aimer ce que vous faites.", author: "Steve Jobs" },
  { text: "Le succès, c'est tomber sept fois et se relever huit.", author: "Proverbe japonais" },
  { text: "Un voyage de mille lieues commence par un pas.", author: "Lao Tseu" },
  { text: "Nous sommes ce que nous faisons de manière répétée.", author: "Will Durant, d'après Aristote" },
  { text: "La discipline est le pont entre les objectifs et les accomplissements.", author: "Jim Rohn" },
  { text: "Fais de ta vie un rêve, et d'un rêve, une réalité.", author: "Antoine de Saint-Exupéry" },
  { text: "Ce n'est pas parce que les choses sont difficiles que nous n'osons pas, c'est parce que nous n'osons pas qu'elles sont difficiles.", author: "Sénèque" },
  { text: "Le meilleur moment pour planter un arbre était il y a 20 ans. Le deuxième meilleur moment est maintenant.", author: "Proverbe chinois" },
  { text: "On ne subit pas l'avenir, on le fait.", author: "Georges Bernanos" },
  { text: "Petit à petit, l'oiseau fait son nid.", author: "Proverbe" },
  { text: "La persévérance, c'est ce qui rend l'impossible possible.", author: "Jean Chrétien" },
  { text: "Choisis un travail que tu aimes et tu n'auras pas à travailler un seul jour de ta vie.", author: "Confucius" },
  { text: "Ils ne savaient pas que c'était impossible, alors ils l'ont fait.", author: "Mark Twain" },
  { text: "Le talent, c'est d'avoir envie de faire quelque chose.", author: "Jacques Brel" },
  { text: "Rien n'est plus puissant qu'une idée dont l'heure est venue.", author: "Victor Hugo" },
  { text: "Celui qui déplace une montagne commence par déplacer de petites pierres.", author: "Confucius" },
  { text: "Tu n'as pas besoin d'être parfait pour commencer, mais tu dois commencer pour être parfait.", author: "Zig Ziglar" },
  { text: "L'échec est le fondement de la réussite.", author: "Lao Tseu" },
  { text: "Une victoire sur soi-même est la plus grande des victoires.", author: "Platon" },
  { text: "Le courage n'est pas l'absence de peur, mais la capacité de la vaincre.", author: "Nelson Mandela" },
  { text: "Ne compte pas les jours, fais que les jours comptent.", author: "Mohamed Ali" },
  { text: "Chaque matin, nous renaissons. Ce que nous faisons aujourd'hui est ce qui importe le plus.", author: "Bouddha" },
  { text: "La simplicité est la sophistication suprême.", author: "Léonard de Vinci" },
  { text: "Agis comme s'il était impossible d'échouer.", author: "Dorothea Brande" },
  { text: "Le plus grand risque est de ne prendre aucun risque.", author: "Mark Zuckerberg" },
  { text: "Ce qui ne me tue pas me rend plus fort.", author: "Friedrich Nietzsche" },
];

export const MONSTER_NAMES: readonly string[] = [
  "Gobelin des Partiels",
  "Hydre de la Procrastination",
  "Golem du Ménage",
  "Liche des Factures",
  "Dragon du Dimanche Soir",
  "Spectre de la Flemme",
  "Troll des Notifications",
  "Basilic du Réveil",
  "Minotaure des Révisions",
  "Chimère des Dossiers",
  "Kraken de la Boîte Mail",
  "Sphinx des Examens",
  "Ogre du Linge Sale",
  "Vampire du Sommeil",
  "Wyverne du Lundi Matin",
  "Cyclope des Écrans",
  "Banshee des Rappels",
  "Hydre des Abonnements",
  "Golem de la Paperasse",
  "Démon du Scroll Infini",
  "Gargouille des Devoirs",
  "Léviathan du Découvert",
  "Manticore du Réveil Raté",
  "Chevalier Noir de la Deadline",
  "Nécromancien des Projets Abandonnés",
];
