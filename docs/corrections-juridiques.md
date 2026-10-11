# Corrections adaptées au carnet — 11 octobre 2026

Périmètre validé : particulier en France, vacances entre amis, aucun salarié, aucune activité commerciale ni chiffre d’affaires, aucune vente ou paiement, pas de données sensibles prévues. GitHub Pages et Firebase conservés, budget de 0 €. Corrections d’information et non-indexation seulement : aucune restriction nouvelle des accès Firebase, aucune modification des règles ou de leur déploiement.

## Changements, dans l’ordre du diagnostic

| Point | Résultat adapté au projet |
| --- | --- |
| 1. Mentions légales | Page réécrite pour un éditeur particulier, hébergement GitHub Pages et stockage Google Firebase. La possibilité d’anonymat non professionnel est conditionnelle, pas activée par défaut. Identité/contact et coordonnées officielles des prestataires restent à renseigner. LCEN article 1-1, y compris entités tierces de stockage. |
| 2. Confidentialité | Données réellement relevées : surnom, contenus du carnet, auteurs, UID, dates, historique contenant une copie complète à chaque modification. Valise locale distinguée des contributions partagées. Finalités, destinataires, conservation actuelle, demandes et transferts décrits. Exception personnelle/domestique nuancée ; fondement RGPD à décider si elle ne s’applique pas. Aucune durée ni région Firestore inventée. |
| 3. Cookies et stockages | Inventaire des neuf entrées/groupes de clés et du stockage Firebase sur la page de confidentialité. Suppression de la clé facultative de dernière visite et des badges « Nouveau ». Restent les stockages utilisés pour le carnet demandé, la valise, l’état d’édition, la préférence d’onglet, la connexion et les caches de continuité. Pas de traceur d’audience/publicitaire repéré dans le code, donc pas de bandeau ajouté pour ces seules fonctions. Toute extension de finalité devra être revue avant son ajout. |
| 4. CGV | Non applicables : aucun contrat de vente ou paiement. Pas de page artificielle. |
| 5. Règles d’usage | Page courte propre au carnet : participation, contenus, données, retrait, limites de disponibilité, droits sur les contributions et information en cas de changement. Case obligatoire non précochée à la première entrée, conformément au livrable demandé ; accord d’usage volontairement prévu, pas consentement RGPD ni obligation légale universelle. Aucune preuve contractuelle serveur n’est créée. Les participants déjà reconnus ne sont pas bloqués. |
| 6. Médiation de la consommation | Non applicable à ce carnet sans activité professionnelle ni vente. |
| 7. Formulaires | Champs obligatoires/facultatifs explicités. Notices près des listes communes, courses, valise, activité et contacts d’assistance : local ou partagé, attribution, lien de confidentialité. Contacts d’assistance : ne pas saisir le numéro de contrat. Le prénom peut être un surnom. |
| 8. Tiers | Google Fonts remplacé par quatre fichiers WOFF2 locaux et licences SIL OFL. Firebase reste chargé depuis Google et utilise les services Google. Carte OSM à l’ouverture seulement ; Leaflet et Lucide locaux. Open-Meteo/MET Norway/Photon interrogés côté workflow, pas avec les données des visiteurs. Documents et vidéos restent des liens, sans intégration. |
| 9. Accessibilité | Onglets avec identifiants, panneau associé, aria-selected, tabulation unique et touches flèches/Début/Fin. Illustration dotée de role=img. Ajustements des cartes budget et titres d’activités pour les vraies polices sur mobile. Focus et réduction d’animations conservés. Contrôles partiels, aucune déclaration de conformité inventée. |
| 10. Moteurs et IA | Les quatre pages HTML portent robots=noindex,nofollow,noarchive. Pas de llms.txt, sitemap promotionnel ou données structurées de référencement. Aucun blocage global des moteurs qui les empêcherait de lire noindex. La consigne n’est pas un contrôle d’accès et tous les robots ne la respectent pas. |
| 11. Contenu | Pas de faux avis ou promesses commerciales identifiés. Tarifs décrits comme estimations à confirmer. Notices Lucide, Leaflet et nouvelles licences des fontes conservées. Droits sur logo et illustration existants à confirmer ; rien remplacé sur une supposition. |
| 12. Contact et footer | Même navigation d’information sur les quatre pages : confidentialité, mentions et règles ; retour au carnet sur les pages secondaires. Aucun faux e-mail ni téléphone d’éditeur. Le téléphone du camping n’est pas présenté comme celui de l’éditeur. Contact réel encore manquant. |
| 13. Risques spécifiques | Connexion anonyme et mode administrateur côté navigateur ne réservent pas les données aux amis. Historique sans expiration et sans suppression utilisateur. Ces limites sont documentées ; elles ne sont pas corrigées techniquement car le périmètre choisi exclut les permissions Firebase. Les règles réellement déployées restent à vérifier. |

## Fichiers créés ou modifiés pour ce chantier

- DESIGN.md : consigne de polices locales.
- index.html : fontes locales, non-indexation, formulaires, panneaux d’onglets, règles et footer.
- app.js : suppression ciblée du repère de visite, navigation clavier, notices des contacts d’assistance.
- styles.css : suppression des anciens badges, accord d’usage, tableaux d’information et corrections mobiles.
- fonts.css : déclarations locales DM Sans et Fraunces.
- assets/fonts/font-0.woff2 : DM Sans latin-ext.
- assets/fonts/font-1.woff2 : DM Sans latin.
- assets/fonts/font-2.woff2 : Fraunces latin-ext.
- assets/fonts/font-3.woff2 : Fraunces latin.
- assets/fonts/dmsans-OFL.txt : licence officielle DM Sans.
- assets/fonts/fraunces-OFL.txt : licence officielle Fraunces.
- assets/fonts/SOURCES.md : provenance et date de téléchargement.
- mentions-legales.html : édition, hébergeur, stockage, crédits et informations à compléter.
- confidentialite.html : traitements, stockages, durées, prestataires, droits et limites d’accès.
- regles-utilisation.html : règles propres à la participation au carnet.
- assets/partage-embrun.png : aperçu de partage régénéré avec les fontes locales ; usage entre amis conservé.
- .github/workflows/weather-pages.yml : inclut fonts.css et les règles dans le paquet publié.
- docs/corrections-juridiques.md : présent livrable.
- README.md : lien vers ce livrable.
- .preview/legal-browser-check.cjs : contrôle local de première entrée, fontes, clavier et noindex (dossier ignoré).
- .preview/design-browser-check.cjs : contrôle local étendu à la quatrième page et aux vraies fontes (dossier ignoré).

firestore.rules et firebase-sync.js ne sont pas modifiés par ce chantier. Aucun compte, réglage cloud, suppression Firebase, abonnement ou publication n’a été effectué.

## À FAIRE PAR UN HUMAIN

1. Compléter les mentions avec l’identité et les coordonnées de l’éditeur ou vérifier avec l’hébergeur les conditions exactes de l’anonymat non professionnel ; renseigner le responsable de publication.
2. Fournir un contact réel et fonctionnel, puis le reporter de façon cohérente dans les trois pages d’information. Le lien vers cette page n’est pas un moyen de contact tant que son champ est vide.
3. Vérifier dans les conditions du compte GitHub et Google les entités contractuelles, leurs adresses et le téléphone de l’hébergeur. Les anciennes adresses trouvées en ligne ne sont pas copiées sans preuve.
4. Contrôler la région Firestore, les conditions de traitement/transfert applicables au compte et les règles effectivement déployées. Authentication fonctionne aux États-Unis d’après Google, quelle que soit la région Firestore.
5. Fixer la durée de conservation du carnet, de l’historique et des comptes anonymes ; prévoir leur suppression administrative, y compris les copies détenues par le responsable. Les pages décrivent honnêtement l’absence actuelle de purge.
6. Si l’usage sort du cadre strictement personnel/domestique, vérifier l’application du RGPD et documenter les bases juridiques, la nécessité de l’historique complet et les garanties de transfert. Ne pas utiliser l’accord aux règles comme un consentement fourre-tout.
7. Confirmer les droits sur le logo et l’illustration déjà présents, et les tarifs/horaires auprès des établissements. Vérifier les permissions des documents externes avant de diffuser leurs liens.
8. Informer les amis des règles et des limites d’accès. Si une vraie protection devient nécessaire, elle demandera un chantier d’autorisations Firebase séparé, expressément exclu ici.
9. Faire une relecture avec clavier et lecteur d’écran sur les appareils du groupe ; les contrôles effectués ne constituent pas un audit RGAA complet.
10. Publier les changements seulement après finalisation des champs inconnus. Si la destination change vers une vente ou des données sensibles, réévaluer les obligations et faire relire les textes par un professionnel.

Les champs inconnus restent visibles [À COMPLÉTER]. Ce résultat n’est donc pas présenté comme un site juridiquement complet.

## Vérifications et limites

- 16 tests hors réseau : météo, lieux, conservation des contenus personnalisés et compte à rebours.
- Edge : 320, 390 et 1365 px, polices locales réellement chargées, absence de débordement, icônes, édition, activités, valise, pages d’information, contraste des textes ciblés et réduction d’animations.
- Premier accès : case non cochée, validation obligatoire de l’accord d’usage, accueil opérationnel après validation ; aucune donnée partagée existante effacée.
- Clavier : changement de liste avec flèches/Début/Fin, sélection ARIA cohérente et un seul onglet dans l’ordre de tabulation.
- Quatre pages : noindex présent, fontes distantes retirées, footer cohérent.
- Carte : essais avec tuiles simulées pour ne pas générer de téléchargements automatisés OSM.
- Contrôles navigateur : requêtes Firebase externes bloquées volontairement ; pas de création de compte, lecture de données réelles ou écriture cloud. Ce contrôle ne certifie pas les cookies/journaux propres aux fournisseurs en production.
- git diff --check : aucun problème d’espaces.
- Aucune vérification d’un retrait réel des résultats des moteurs : cela ne peut être mesuré avant publication et nouvelle exploration.

### Particularité GitHub Pages

Le site est un projet sous /vacances/ sur tickytakaboom-ux.github.io. Un robots.txt placé dans ce dépôt serait servi sous /vacances/robots.txt, alors que les moteurs lisent celui à la racine du domaine. Aucun robots.txt local trompeur n’a donc été ajouté. La balise noindex agit directement dans chacune des pages ; le propriétaire du domaine peut gérer séparément des préférences de robots à la racine. Des moteurs peuvent prendre du temps à retirer une page déjà connue, et des robots non coopératifs peuvent ignorer la consigne. Les JSON publics et le dépôt public restent accessibles ; le budget de 0 € et le périmètre choisi sont conservés.

## Références vérifiées pour l’audit

- [LCEN, article 1-1](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000801164) : identification et anonymat conditionnel des particuliers.
- [RGPD, considérant 18](https://www.cnil.fr/fr/reglement-europeen-protection-donnees) : activité personnelle/domestique et rôle des prestataires.
- [CNIL : traceurs](https://www.cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi) : exemption des fonctions strictement nécessaires, pas de bandeau automatique fondé seulement sur localStorage.
- [CNIL : information](https://www.cnil.fr/fr/conformite-rgpd-information-des-personnes-et-transparence) : information des personnes.
- [Firebase : confidentialité](https://firebase.google.com/support/privacy) : localisation Authentication aux États-Unis, localisation et garanties propres aux autres services à vérifier.
- [Firebase : persistance Auth](https://firebase.google.com/docs/auth/web/auth-state-persistence) : connexion persistante dans le navigateur.
- [GitHub : confidentialité](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement) : prestataire d’hébergement.
- [RGAA : champ d’application](https://accessibilite.numerique.gouv.fr/obligations/champ-application/) : pas d’obligation de déclaration générale déduite du seul seuil de dix salariés.
- [Google : noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing) : laisser les robots lire la directive ; ne pas confondre désindexation et protection d’accès.
- [Polices locales : sources](../assets/fonts/SOURCES.md) : provenance des fontes et licences distribuées.

## Non applicables

CGV, médiateur de consommation, rétractation, facturation, SIRET d’entreprise, politique de paiement, newsletter et marketing : pas de vente ni activité professionnelle déclarée. Bannière de consentement publicitaire/statistique : aucun outil de cette nature identifié dans le code, fonctionnalités locales limitées au carnet demandé. llms.txt, sitemap et référencement IA : contraire au souhait exprimé. Déclaration officielle de conformité accessibilité : pas de fondement établi pour ce carnet particulier, et aucun audit complet réalisé. Restriction réelle aux amis : utile pour protéger les données, mais non autorisée dans le périmètre choisi.
