# Leonida HR — SIRH interne

SIRH interne de Leonida (télécoms : réseaux, fibre, cloud télécom — 100 collaborateurs).

## Modules

- **Tableau de bord** : effectifs, contrats, ancienneté, soldes CP/RTT, masse salariale (RH_ADMIN), échéances de contrat.
- **Collaborateurs (Core RH)** : annuaire paginé (15 / page), recherche instantanée nom/prénom, filtres service / contrat / profil, fiche complète (âge, ancienneté, compétences, manager cliquable, équipe directe).
- **Import CSV** (RH_ADMIN) : fichier `;`, encodage UTF-8 ou Windows-1252 détecté automatiquement, rapport détaillé (lignes importées, rejetées avec ligne / colonne / motif, avertissements), mode simulation, historique.
- **Temps & Absences (GTA)** et **Recrutement** : emplacements prêts, modules à développer.

## Comptes de démonstration

Mot de passe commun : `Leonida2026!`

| Profil | Email | Droits |
| --- | --- | --- |
| RH_ADMIN | m.durand@leonida.fr | Tous les collaborateurs, import CSV, statistiques |
| MANAGER | a.francois@leonida.fr | Sa fiche + ses 5 collaborateurs directs |
| COLLABORATEUR | s.meyer@leonida.fr | Sa fiche uniquement (403 sur les autres) |

Tout collaborateur présent dans la base peut se connecter avec son email et ce mot de passe : son compte est créé à la première connexion. L'inscription libre est désactivée.

## Règles d'accès

Les droits sont appliqués par la base de données (Row Level Security), pas seulement par l'interface :
- RH_ADMIN : lecture / écriture de toutes les fiches, import, journal des imports.
- MANAGER : sa fiche + collaborateurs dont il est `id_manager`.
- COLLABORATEUR : sa propre fiche. L'URL d'une autre fiche affiche « Erreur 403 — Accès refusé ».
- Le rôle vient de la colonne `profil_acces` et est synchronisé automatiquement dans une table de rôles séparée.

## Procédure d'import

1. Se connecter en RH_ADMIN → menu **Import CSV**.
2. Déposer le fichier (19 colonnes : `id_collaborateur;nom;prenom;email;date_naissance;date_embauche;type_contrat;code_service;intitule_poste;niveau_classification;salaire_brut_mensuel;taux_temps_travail;solde_cp;solde_rtt;id_manager;profil_acces;niveau_formation;competences_cles;date_fin_contrat`).
3. **Simuler** pour voir le rapport sans rien enregistrer, puis **Lancer l'import**.

Contrôles : colonnes obligatoires (sinon import refusé), valeurs obligatoires, dates `JJ/MM/AAAA`, `type_contrat` ∈ CDI/CDD/Alternance/Stage/Freelance, `profil_acces` ∈ RH_ADMIN/MANAGER/COLLABORATEUR, unicité `id_collaborateur` et email (2ᵉ occurrence rejetée), `id_manager` vide ou introuvable → avertissement non bloquant (importé sans manager), CDD/Stage sans date de fin → avertissement. Un collaborateur existant (même `id_collaborateur`) est mis à jour.

Avec le fichier fourni : 100 lignes, 98 importées, 2 rejetées (emails en doublon lignes 39 et 101), 7 avertissements (managers vides de la direction).

## Stack

TanStack Start (React 19, TypeScript), Tailwind CSS v4, Lovable Cloud (base PostgreSQL, authentification, fonctions serveur).

Tests : `bunx vitest run` (règles d'import, calculs d'âge et d'ancienneté).

## Limites connues

- Mot de passe de démo commun à tous les comptes (en production : invitation par email et mot de passe personnel).
- Modules GTA et Recrutement non développés.
- Pas d'export PDF pour le moment.
