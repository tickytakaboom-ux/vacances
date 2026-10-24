# Les Zigotos à Embrun

Site statique mobile-first pour centraliser le voyage à Embrun en 2027.

## Publication avec GitHub Pages

1. Créer un dépôt GitHub et y déposer le contenu de ce dossier.
2. Dans les réglages du dépôt, ouvrir **Pages**.
3. Choisir **Deploy from a branch**, la branche `main`, puis le dossier `/ (root)`.
4. GitHub affiche ensuite l'adresse publique du site.

Selon le type de compte GitHub, la publication Pages depuis un dépôt privé peut ne pas être proposée. Dans ce cas, garder les données non sensibles et utiliser un dépôt public dédié au site, ou choisir une autre solution d'hébergement.

## Modifications

Le bouton **Modifier** permet de changer le texte du programme et certaines présentations. Les modifications sont enregistrées localement puis synchronisées en direct dans Cloud Firestore. Si Firebase est momentanément indisponible, la copie locale reste accessible et sera remplacée par la version partagée à la prochaine connexion.

## Configuration Firebase

- Activer l'authentification anonyme dans Firebase Authentication.
- Créer une base Cloud Firestore.
- Copier le contenu de `firestore.rules` dans l'onglet **Rules** de Firestore, puis publier les règles.
- Ajouter le domaine GitHub Pages dans **Authentication > Settings > Authorized domains** si Firebase ne l'accepte pas automatiquement.

Les visiteurs choisissent leur prénom au premier passage, puis sont connectés anonymement : aucun compte ni mot de passe n'est demandé. Chaque sauvegarde conserve le prénom, les sections modifiées et une copie du contenu dans la sous-collection Firestore `history`. Les nouvelles règles réservent la synchronisation aux appareils autorisés. Leur publication manuelle dans Firebase reste nécessaire.

## Météo Embrun

Bloc compact, prévisions actualisées chaque heure et secours automatique, sans clé API.
Voir [le guide météo](docs/weather.md) pour les tests et l’activation gratuite de GitHub Actions / Pages.

## Carte du voyage

Carte compacte avec les dix lieux choisis et une sélection alentour actualisée chaque jour. Voir [la documentation de la carte](docs/map.md) pour les sources, le cache, les tests et la publication.


## Retouche du carnet

Direction dans [DESIGN.md](DESIGN.md). Voir [le livrable](docs/design-retouche.md) pour les changements, les vérifications et les informations à compléter.

- [Corrections juridiques et non-indexation](docs/corrections-juridiques.md) : résultat adapté au carnet, vérifications et informations à compléter.

## Autorisation des appareils — activation manuelle

Aucun compte ou mot de passe à créer ; chaque navigateur conserve son compte anonyme. Un nouveau navigateur, la navigation privée ou l’effacement du stockage peuvent créer un nouvel identifiant. Les données existantes sont conservées. Le site statique reste public.

1. Publier les fichiers du site, puis ouvrir le carnet dans le navigateur habituel. Copier le **code de cet appareil** affiché en haut de page. Même si les anciennes règles empêchent la vérification, le code est visible.
2. Dans Firebase Console → Firestore Database → Données, ouvrir le document existant **trips/embrun-2027**. Ajouter sa sous-collection **members**, puis un document dont l’identifiant est exactement le code copié. Ajouter le champ **active**, type **booléen**, valeur **true**. Ne remplacer ni le document du voyage ni son historique.
3. Dans Firestore Database → Règles, remplacer les règles par le contenu complet de **firestore.rules**, puis publier. La publication GitHub ne déploie pas ces règles.
4. Cliquer « Vérifier l’accès » : la version partagée doit se charger. Refaire uniquement l’étape 2 pour chaque appareil ami. Un appareil inconnu doit rester en attente et ne pas synchroniser.
5. Pour retirer un accès, passer **active** à **false** dans son document membre. Les règles bloquent les nouvelles opérations sans effacer les contributions ni les copies déjà obtenues.

Si un accès manque, ajouter son identifiant via la console ; ne pas rouvrir les règles à tous. Aucun envoi automatique des modifications effectuées avant autorisation ou de l’ancien cache lors de l’activation. Conserver ces éventuelles modifications à part avant de vérifier l’accès : le carnet en ligne remplace sa copie locale à la réception. Les amis autorisés disposent tous des mêmes droits sur le contenu ; les autorisations restent administrées uniquement dans la console.

### Tests de règles locaux

Tests durables : tests/firestore-rules.test.mjs. Ils refusent de fonctionner sans émulateur local explicite et utilisent uniquement le projet fictif demo-vacances-access. Java 21 et Node 20+ nécessaires. Les dépendances restent dans le dossier ignoré .preview/firebase-tests ; aucune dépendance supplémentaire dans le site. Voir tests/run-firestore-rules.ps1 pour préparer puis lancer les tests avec pnpm ou npm installé.

## Protection contre les données mal formées

Le site valide les types, champs obligatoires du carnet, lignes du programme, activités, FAQ, listes, contacts et budgets avant toute migration et avant d’accepter une version reçue. Les anciens champs facultatifs peuvent être complétés par les valeurs prévues. Les textes personnalisés valides sont préservés. Limites de protection : carnet sérialisé de 200 000 caractères, texte de 20 000 caractères, 1 000 éléments par liste, 100 activités/FAQ/lignes de budget et 31 journées. Les identifiants de listes doivent être uniques ; les montants sont des nombres finis positifs ou nuls. Ces limites sont volontairement supérieures aux besoins du séjour.

Une version partagée refusée laisse la dernière copie utilisable et son cache intacts et affiche un message. Les envois restent bloqués jusqu’à réception d’une version saine pour éviter de remplacer automatiquement le document problématique. Au démarrage, si la seule copie locale est illisible, le carnet initial est affiché en attendant Firebase ; la copie enregistrée n’est pas effacée. La valise locale bénéficie aussi d’un contrôle de structure, avant sa migration. Aucun nettoyage du carnet ou de l’historique en ligne n’est exécuté.

Les nouvelles règles de ce correctif contrôlent les champs externes, les types, la taille du contenu, les UID et les dates serveur des futures sauvegardes. Elles doivent être publiées manuellement, après le site, dans Firestore → Règles, comme lors de l’activation des appareils. Les documents members existants restent valables. Les lectures des anciennes données restent autorisées pour les membres. Le contenu JSON interne reste validé côté site : les règles ne savent pas analyser une chaîne contentJson. Un client autorisé modifié peut encore déposer une chaîne incorrecte ; les navigateurs corrigés la refusent sans perdre leur copie saine. Une validation métier complète côté serveur nécessiterait un changement de format, hors de ce correctif.

Vérification : suite Node habituelle (incluant tests/site.test.mjs et tests/firebase-access.test.mjs), tests/budget-browser.cjs et tests/firebase-access-browser.cjs avec Playwright/Edge, puis tests/run-firestore-rules.ps1 pour l’émulateur. Les contrôles ne se connectent pas au Firebase réel.
