# Retouche du carnet des Zigotos

Direction validée : conserver le style existant, les couleurs et les deux polices, avec une ambiance chaleureuse de carnet entre amis. Action principale : participer à l’organisation du programme, des listes et du budget. Séjour confirmé du 11 au 18 juillet 2027. Aucun achat ou nouvel hébergement.

Le document de référence est [DESIGN.md](../DESIGN.md), créé avant les modifications.

## Textes avant et après

| Élément | Avant | Après |
| --- | --- | --- |
| Titre d’accueil | Direction Embrun | Notre semaine à Embrun |
| Introduction d’accueil | Une semaine entre lac et montagnes, à sept, au Camping de la Clapière. | Du 11 au 18 juillet 2027, on prépare notre semaine à sept au camping La Clapière. |
| Bouton principal | Voir le programme | Préparer le programme |
| Bouton carte | Voir la carte avec une flèche texte | Voir la carte avec l’icône commune |
| Dates | 4–11 ou 11–18 juillet | 11 au 18 juillet 2027 |
| Compte à rebours | 4 juillet 2027 ; avant le premier départ possible | 11 juillet 2027 à minuit, heure française ; avant notre semaine à Embrun |
| Titre d’introduction | Le grand air, sans prise de tête. | Notre semaine au bord du lac. |
| Introduction | Le lac à quelques pas, les montagnes tout autour et assez d’activités pour remplir la semaine, suivies d’une formule avec un tiret long | On loge à sept au camping La Clapière. Le programme, les idées et les affaires à emporter se préparent ici, ensemble. |
| Explication du programme | En mode édition, chacun peut compléter les journées sur son appareil. | Clique sur Modifier pour compléter les journées. Les changements sont partagés avec le groupe. |
| Rubrique Idées | Rien n’est encore décidé | À proposer au groupe |
| Titre budget | Simple, clair, partagé. | Le budget du séjour. |
| Réponse Courses par défaut | Dans un magasin, avec un emoji | On prépare la liste ensemble dans l’onglet Courses. |
| Accueil prénom | Ton prénom permettra au groupe de savoir qui a apporté les dernières modifications. | Ton prénom permet de reconnaître tes modifications. Tu peux utiliser un surnom. Voir les données utilisées. |

Les clins d’œil « On anticipe comme L. » et le pied de page sont conservés. Les activités, budgets, tarifs et informations confirmées ne sont pas réinventés. Les textes personnalisés ne sont pas réécrits. Seuls les anciens textes identiques aux versions par défaut sont remplacés, sans augmenter les versions qui réinitialiseraient les données du groupe.

## Fichiers créés ou modifiés

- DESIGN.md : palette, typographie, formes, icônes, mouvement et ton de référence.
- index.html : dates, textes, boutons, métadonnées de partage, liens d’information et retrait du chargement décoratif.
- app.js : nouveau compte à rebours, migration ciblée des textes par défaut, icônes et suppression des délais et animations au défilement.
- icons.js : rendu contrôlé des icônes locales, avec compatibilité des anciens codes emoji.
- styles.css : couleurs centralisées, arrondi commun de 16 px, espacements harmonisés, contraste du bouton orange, accueil mobile sans superposition, pages d’information.
- weather.js : conditions météo en texte et icônes SVG à la place des emojis.
- weather.css : palette et arrondi communs, disposition des conditions météo.
- map.js : icônes des itinéraires et agrandissement, couleurs des points prises dans les variables CSS.
- map.css : palette et arrondi communs, ouverture sobre, repères géographiques circulaires conservés.
- confidentialite.html : usages des données, stockage local, Firebase, services tiers et informations à compléter.
- mentions-legales.html : trame de mentions, hébergement et crédits, informations inconnues à compléter.
- assets/vendor/lucide/sprite.svg : sélection d’icônes Lucide 0.468.0 livrées localement.
- assets/vendor/lucide/LICENSE : licence Lucide et crédits Feather conservés.
- assets/partage-embrun.png : aperçu 1200 × 630 créé à partir de l’emblème existant et des informations confirmées, environ 125 ko.
- tests/site.test.mjs : tests des dates, de la migration et de la conservation des données personnalisées.
- .github/workflows/weather-pages.yml : publication des nouveaux fichiers publics et exécution des tests du carnet.
- docs/design-retouche.md : ce livrable et ses limites.
- README.md : lien vers le livrable.

Les fichiers de vérification et captures dans .preview sont ignorés par Git et ne sont pas publiés.

## Vérification

- 16 tests hors réseau : météo, carte, date de départ et conservation des contenus personnalisés.
- Vérification du carnet dans Edge : petit mobile 320 px, mobile 390 px et ordinateur 1365 px, chaque section sans débordement horizontal.
- Édition et sortie d’édition, ouverture des fiches activités, ajout et suppression d’un objet dans Ma valise.
- SVG analysés sans erreur, icônes présentes, liens internes vers des sections existantes, pages d’information accessibles et aucun fichier local manquant.
- Contrastes des textes principaux, légendes des activités, états météo et carte, et liens du pied de page vérifiés ; boutons et carte sans superposition sur mobile.
- Réglage système « réduire les animations » respecté, aucune animation d’apparition au défilement ni écran d’attente imposé.
- Vérification de la carte : dix repères, 29 points alentour dans le relevé initial, filtres, Les Orres 1650, agrandissement, cache et panne sans cache.
- Les tuiles OSM sont simulées dans ces tests navigateur pour éviter leur téléchargement automatisé. Les sources API avaient été testées en conditions réelles lors de leur intégration.
- Google Fonts et Firebase sont bloqués pendant les tests locaux : ce contrôle ne valide pas la synchronisation réelle du groupe ni le rendu des polices téléchargées. Le code Firebase et les règles restent inchangés.

Commande de contrôle reproductible : node --test tests/weather.test.mjs tests/places.test.mjs tests/site.test.mjs.

## À FAIRE PAR UN HUMAIN

- Compléter l’identité et le contact de l’éditeur, les coordonnées requises et les coordonnées officielles de l’hébergeur dans les mentions légales.
- Définir la durée de conservation du carnet et de son historique, le fondement applicable et la procédure de suppression ; vérifier la localisation de Firebase et les informations de transferts. La version actuelle n’a aucune suppression automatique.
- Confirmer les droits d’utilisation de l’emblème existant ; son origine ne peut pas être prouvée à partir du fichier seul.
- Vérifier les liens vers les documents privés, le calendrier et la présentation avec les comptes du groupe. Leur accès ne peut pas être confirmé sans ces comptes.
- Facultatif : prendre une photo du groupe avec son accord et quelques photos du séjour. Aucune photo ni témoignage n’est nécessaire pour publier cette retouche.
- Publier avec un commit puis Push origin sur main dans GitHub Desktop. Vérifier que le workflow Pages est vert et recharger le site.
- Le site et la connexion anonyme ne constituent pas un espace réservé sur invitation. Un accès restreint aux seuls amis demanderait un chantier distinct, pas une simple retouche graphique.

Les pages d’information constituent une trame à compléter, sans déclaration de conformité juridique. Leur liste d’informations s’appuie sur [les explications de la CNIL](https://www.cnil.fr/fr/conformite-rgpd-information-des-personnes-et-transparence). Les services et traitements décrits viennent du code vérifié.

## Non applicable ou conservé volontairement

- Domaine personnalisé et redirection www : non demandés, adresse GitHub Pages gratuite conservée conformément au choix de l’utilisateur. Aucun domaine acheté.
- Avis clients, chiffres marketing et logos commerciaux : aucun à ajouter pour un carnet personnel ; aucun faux contenu trouvé.
- Photos d’équipe ou de banque d’images : aucune photo dans le site. Illustrations existantes conservées.
- Paiement, réservation commerciale, newsletter et formulaire de contact : aucun de ces usages.
- Badge de générateur et filigrane de fournisseur : aucun trouvé dans le code et aucun abonnement nécessaire pour les retirer.
- Bibliothèques Leaflet et Lucide : styles et notices tierces conservés avec leurs licences. Le rayon commun concerne nos composants ; les cercles des repères et dessins restent des formes géométriques.
- HTTPS : pas de changement d’hébergement ou de domaine ; la configuration déjà utilisée sur GitHub Pages est conservée. Aucune nouvelle redirection configurée.
- Favicon : variantes existantes 32, 180, 192 et 512 px conservées ; aucun faux logo ajouté.
