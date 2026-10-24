# Revue de sécurité du carnet — 24 octobre 2026

Revue réalisée avec le skill ecc:security-review. Dépôt inspecté : C:/Users/julwa/OneDrive/Documents/GitHub/vacances. Révision avant revue : 15cf302cc363b959690fecd85a09da3f9532981c. L’arbre Git était propre avant la création de ce rapport.

**Résultat : deux constats de priorité élevée et un de priorité moyenne.** La faille de rendu du budget est nouvelle et confirmée par un test navigateur local. Le défaut de restriction aux amis est une limite déjà connue, conservée par choix de périmètre. Aucune donnée Firebase réelle n’a été lue ou écrite pour cet audit ; aucune permission, aucun abonnement, aucun code applicatif ni déploiement n’a été modifié.

**Suivi du 24 octobre 2026 : le premier constat est corrigé dans les fichiers locaux.** Les libellés du budget sont affectés avec textContent dans des éléments créés explicitement. Le correctif n’a pas encore été publié ; le constat sur la version publique relevée pendant l’audit reste valable jusqu’à publication. Les constats 2 et 3 ne sont pas traités dans ce changement.

## 1. Élevée — Du JavaScript peut s’exécuter à partir d’un libellé de budget

**Emplacement : app.js:385**, fonction updateBudget. Chemin de lecture des données partagées : firebase-sync.js:88–95, puis app.js:578–581.

Le libellé item[0] est interpolé dans budgetList.innerHTML sans échappement. Une valeur contenant une balise et un gestionnaire d’événement est interprétée comme du code, contrairement aux champs de listes qui utilisent escapeHTML.

L’interface normale ne propose pas de saisir du HTML dans ce budget, mais le budget entier provient des données partagées. Les règles du dépôt permettent à un compte authentifié d’en remplacer le contenu sans valider son schéma. Sous réserve que ces règles soient effectivement appliquées au projet, une écriture directe dans le document peut donc alimenter ce champ sans passer par les formulaires.

**Preuve obtenue :** dans Edge, avec tous les appels Firebase et externes bloqués, une copie des données a été transmise au même événement shared-trip-data que celui utilisé par firebase-sync.js. Un libellé de test a créé une image dans le budget et exécuté un gestionnaire qui positionne uniquement un marqueur local. Le marqueur est réapparu après rechargement, car le contenu injecté était resté dans le cache du navigateur. Aucune exfiltration ni écriture cloud.

**Impact :** exécution de code avec les droits de la page, dont accès aux données locales de la valise et aux opérations accessibles au navigateur. Une valeur stockée dans Firebase atteindrait les visiteurs qui la reçoivent. Le test ne prétend pas qu’une injection existe actuellement dans la base : les données réelles n’ont pas été inspectées.

**Correction recommandée :** construire le libellé avec textContent, ou appliquer escapeHTML au libellé avant insertion dans ce contexte HTML. Ajouter un test qui exige que les balises restent du texte et qu’aucun gestionnaire ne s’exécute. Compléter par la validation des données reçues. Cette correction ne nécessite ni abonnement ni remplacement de Firebase.

**Version publique :** le 24 octobre 2026, les réponses HTTP 200 de index.html, app.js et firebase-sync.js étaient identiques octet pour octet aux fichiers locaux. Le rendu vulnérable est donc présent dans le JavaScript publié. Seuls ces fichiers statiques ont été récupérés ; aucun test d’injection n’a été lancé contre la base.

## 2. Élevée — Connexion anonyme ne signifie pas appartenance au groupe

**Emplacements : firestore.rules:5–14 ; firebase-sync.js:81 ; app.js:121–122 et 555–556.**

Les règles autorisent lecture, création et modification du carnet pour request.auth != null. L’historique est lisible et de nouvelles entrées peuvent être ajoutées dans la même condition. La connexion utilisée par le site est signInAnonymously, sans contrôle d’invitation ou d’appartenance au groupe dans les règles examinées.

**Impact :** une personne extérieure capable d’obtenir un compte anonyme sur ce projet pourrait lire, remplacer les données du carnet et ajouter des entrées d’historique. La configuration Firebase publique identifie le projet ; la cacher n’est pas un mécanisme de sécurité. La suppression du document courant est interdite, mais son remplacement par des données arbitraires reste autorisé.

Le code administrateur ne protège que l’interface. Un test local a rendu accessible la commande de restauration en changeant le drapeau localStorage, sans connaître le code. Aucune restauration n’a été exécutée. Ce comportement n’est pas compté comme une quatrième faille indépendante : c’est une illustration de l’absence d’autorisation côté serveur.

Les noms et UID d’auteur sont eux aussi fournis par le client et ne sont pas comparés à request.auth.uid dans les règles. Ils ne constituent pas une preuve d’identité. Des écritures répétées peuvent aussi consommer les quotas ; aucun essai de charge n’a été réalisé.

**Correction recommandée si le périmètre change :** réserver les opérations aux UID explicitement autorisés, séparer les droits administratifs et lier les UID d’auteur à request.auth.uid. App Check peut compléter la lutte contre l’abus ; il ne remplace pas l’autorisation des amis.

**Contrainte retenue :** l’utilisateur a demandé de garder Firebase et n’a pas autorisé de restriction nouvelle des accès dans le chantier précédent. Ce rapport n’applique donc aucune modification. La présence de cette limite dans la confidentialité informe les participants mais ne la corrige pas techniquement.

**Niveau de vérification :** analyse du fichier de règles actuel et comparaison avec les règles copiées par l’utilisateur dans cette conversation le 11 octobre. Aucun accès à la console ni test des autorisations Firebase déployées aujourd’hui. Les réglages App Check et restrictions de clé API ne sont pas connus.

## 3. Moyenne — Un JSON valide mais de structure incorrecte casse la lecture des données

**Emplacements : app.js:136–150 et 578–581 ; firebase-sync.js:86–95 ; firestore.rules:7 et 13.**

Le code vérifie la syntaxe JSON avec JSON.parse mais traite ensuite les structures comme fiables. normalizeData appelle notamment normalized.faqs.map et normalized.activities.map sans vérifier les types. Les règles ne vérifient ni les champs et types attendus, ni la cohérence des métadonnées et des auteurs.

**Preuve obtenue :** transmettre une copie du carnet contenant faqs:null à l’événement de réception a déclenché une exception non gérée pendant normalizeData. La valeur est valide en JSON, donc le try/catch autour de JSON.parse ne l’empêche pas. Ce test est local ; aucune donnée partagée n’a été corrompue.

**Impact :** une écriture mal formée ou un client défectueux peut empêcher la nouvelle version du carnet de s’afficher correctement. Si cette valeur est dans le document partagé, les autres visiteurs qui la reçoivent rencontreraient aussi le défaut, jusqu’à correction des données. Le carnet peut conserver une vue ancienne plutôt que tomber entièrement : le symptôme dépend du champ et du moment du chargement.

**Correction recommandée :** valider la structure complète avant de remplacer data ou son cache ; refuser proprement une version invalide et conserver la dernière copie saine. Côté règles, imposer les champs autorisés, les types, des tailles raisonnables et la correspondance des auteurs avec l’utilisateur authentifié. La chaîne contentJson n’est pas un schéma métier validé par Firestore : une validation des champs externes seule ne valide pas son contenu JSON. Définir un format vérifiable si une validation côté serveur complète est souhaitée.

## Protections constatées et contrôles négatifs

- Les libellés de matériel, activités, questions et la plupart des attributs interpolés utilisent escapeHTML ; les noms affichés par Firebase utilisent textContent. Un contrôle navigateur a confirmé qu’une balise injectée dans le texte du matériel reste du texte, sans élément img ni exécution.
- Carte et météo construisent leurs textes avec des nœuds DOM. Les liens d’itinéraire sont générés depuis une URL HTTPS fixe avec URLSearchParams.
- Les API météo/Photon sont appelées depuis le workflow, avec des URL définies dans le code, pas avec une URL fournie par un visiteur. Aucun endpoint applicatif recevant une URL arbitraire n’a été trouvé.
- .env et .env.* sont ignorés, sauf .env.example. L’exemple contient un identifiant de contact public pour MET Norway, pas un secret.
- Recherche ciblée sur 140 blobs texte accessibles dans l’historique Git : aucun motif de clé privée, jeton GitHub, identifiant AWS, compte de service ou secret de type OpenAI/Stripe trouvé. Cette recherche par motifs n’est pas un détecteur exhaustif de tous les secrets et ne couvre pas les fichiers locaux ignorés, les réglages du compte ou les secrets des plateformes.
- La clé API du client Firebase n’est pas classée comme secret volé : Firebase documente ce type de clé comme public par conception. Ses restrictions réelles doivent être vérifiées dans la console ; elles ne sont pas déduites du code.
- HTTPS et l’en-tête HSTS étaient présents sur les trois réponses publiques contrôlées.
- Le workflow produit un paquet explicite de fichiers publics ; .env, docs et firestore.rules n’y sont pas copiés. Les fichiers du dépôt public restent néanmoins publics indépendamment du paquet Pages.
- Aucun paiement, upload de fichier, SQL, wallet ou serveur applicatif avec session cookie trouvé. Les exemples génériques SQL, CSRF-cookie et stockage httpOnly du skill ne s’appliquent pas directement à cette architecture statique avec SDK Firebase ; aucune migration de session n’est proposée sur cette seule checklist.

## Durcissements complémentaires, hors des trois constats

**Politique de contenu :** aucune CSP, ni dans les en-têtes publics contrôlés ni dans les pages locales. Une politique adaptée peut réduire l’impact d’injections, sans remplacer la correction du budget. Il faut la tester avec les imports Firebase et la carte avant déploiement. X-Frame-Options est aussi absent dans ces réponses ; cela ne constitue pas à lui seul une preuve d’attaque par cadrage.

**Chaîne de publication :** les actions GitHub sont référencées par tags majeurs et le même job dispose des permissions nécessaires aux commits météo et au déploiement. Épingler les actions à des révisions vérifiées et réduire la durée/portée de disponibilité des droits limite le risque de dépendance compromise. Aucun script déclenché par une pull request externe ni interpolation de texte de pull request dans le shell n’a été trouvé.

**Dépendances :** Firebase JS 12.16.0 via gstatic, Leaflet 1.9.4 local et sprite Lucide local. Pas de package.json/lockfile de l’application, donc npm audit ne fournirait pas un audit de ce projet tel quel. Les pages d’avis de sécurité officielles Firebase JS et Leaflet n’affichaient pas d’avis publié lors de la consultation ; ce constat limité ne garantit pas l’absence de vulnérabilité ni la sécurité de toutes leurs dépendances. Aucun paquet ni mise à jour installé pour cet audit.

## Exécution et preuves

- 16 tests existants réussis : météo, lieux, conservation des contenus du groupe et compte à rebours.
- Cinq contrôles navigateur locaux réussis : drapeau d’interface administrateur, exécution du budget, persistance du budget en cache, échappement du matériel et rejet absent d’une structure incorrecte.
- Les tests de reproduction confirment les défauts ; leur succès ne signifie pas que le site est sécurisé.
- Script de reproduction conservé localement dans .preview/security-review.cjs ; résultats dans .preview/security-review-results.json. Ces fichiers sont ignorés par Git.
- Métadonnées de lecture publique et de recherche Git dans .preview/security-review-static.json, ignoré également.
- Aucun brute force, appel de connexion réel, lecture Firestore, écriture cloud, test de charge ou suppression de données. Toutes les requêtes externes du navigateur de test ont été bloquées.
- Les preuves statiques publiques couvrent seulement les trois URL récupérées le 24 octobre. Les autorisations du compte GitHub, les secrets Actions et les réglages réels Firebase ne sont pas visibles ici.

Les points juridiques précédents sont distincts de cette revue technique et n’ont pas été rouverts.

## Ordre proposé

1. Corriger le rendu du budget et ajouter un test de non-exécution.
2. Valider les données reçues pour conserver le carnet utilisable face aux données incorrectes.
3. Décider séparément si l’accès doit réellement être limité aux amis ; aucune modification de ce périmètre dans la présente revue.
4. Ajouter ensuite les durcissements CSP/publication pertinents.

## Sources primaires

- [Firebase : clés API](https://firebase.google.com/docs/projects/api-keys)
- [Firebase : conditions de règles Firestore](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Firebase : connexion anonyme](https://firebase.google.com/docs/auth/web/anonymous-auth)
- [OWASP : prévention XSS](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet)
- [Avis officiels Firebase JS](https://github.com/firebase/firebase-js-sdk/security/advisories)
- [Avis officiels Leaflet](https://github.com/Leaflet/Leaflet/security/advisories)
- Fichiers publics contrôlés : [accueil](https://tickytakaboom-ux.github.io/vacances/), [app.js](https://tickytakaboom-ux.github.io/vacances/app.js), [firebase-sync.js](https://tickytakaboom-ux.github.io/vacances/firebase-sync.js).

## Correctif du premier constat — état local

Plan exécuté à la demande explicite du responsable :
1. Ajouter une régression et constater son échec avec l’ancien rendu.
2. Construire les lignes du budget avec des balises constantes et textContent, en conservant calculs, données et Firebase.
3. Valider réception, rechargement du cache, tests existants et revues indépendantes.

Fichiers : app.js (rendu updateBudget), index.html (version du script 20261024-1), tests/site.test.mjs (régression ciblée), tests/budget-browser.cjs (contrôle navigateur durable), présent rapport (suivi). La nouvelle régression unitaire appartient à la suite déjà exécutée par le workflow, sans changement du workflow.

Preuve rouge avant correction : 4 tests site passent et le nouveau test échoue ; le test Edge constate une image injectée au lieu de zéro. Preuve verte : 17 tests réussis (16 existants et la régression), contrôle Edge réussi à la réception shared-trip-data puis après rechargement depuis localStorage, pour les budgets de 4, 5, 6 et 7 participants. Les chaînes restent littérales, sans image/script injecté ni exécution du marqueur ; les données et valeurs du cache sont conservées exactement, y compris accents et guillemets.

Revues code-reviewer et security-reviewer : APPROVE, aucun défaut identifié dans le correctif. Mesure V8 locale pendant le contrôle navigateur : 100 % des caractères non blancs de la fonction updateBudget couverts par les plages exécutées ; cette mesure ciblée n’est pas une couverture globale du projet. Résultat conservé dans .preview/budget-coverage.json (ignoré).

Commandes de vérification :

    node --test tests/weather.test.mjs tests/places.test.mjs tests/site.test.mjs
    node tests/budget-browser.cjs

Pour le test navigateur, Playwright doit être accessible par require('playwright') ou par le chemin de module fourni dans PLAYWRIGHT_MODULE ; Microsoft Edge est utilisé. Aucune dépendance ajoutée à l’application. Les requêtes externes sont bloquées : aucun appel ou changement Firebase réel.

Aucun changement de règles, du format ou des versions de données, aucun effacement ni migration. La création du commit a été autorisée explicitement par le responsable après présentation du correctif et des validations. Message retenu : fix: rendre les libellés du budget comme du texte. Aucun push ni déploiement effectué à cette étape. Le rapport d’audit était déjà non suivi avant ce correctif.

## Correctif du deuxième constat — préparé localement, activation en ligne restante

Choix explicite : conserver Firebase Anonymous Auth et autoriser séparément chaque navigateur. Les règles exigent un document trips/embrun-2027/members/{uid} avec active de type booléen à true. Le client peut seulement consulter son propre document membre ; il ne peut ni lister les membres ni accorder un accès. Les UID d’auteur des nouvelles écritures doivent correspondre à la connexion. Les droits des amis sur le contenu restent identiques ; aucun rôle administrateur serveur n’est introduit.

Le client affiche le code d’appareil et attend une autorisation vérifiée par le serveur avant de lire le carnet ou d’envoyer des changements. Retrait d’autorisation : arrêt de l’écoute et blocage des nouveaux envois. Les règles restent l’autorité même pour un client modifié. Aucune réinitialisation du carnet absent, aucun envoi automatique des changements antérieurs à l’autorisation. Données existantes, historique et valise personnelle conservés ; les copies locales antérieures restent consultables.

Preuve rouge sur anciennes règles : les tests détectent notamment l’accès des anonymes extérieurs, les accès révoqués et l’usurpation d’UID auteur. Preuve verte : tests réels Rules Unit Testing sur émulateur Firestore du projet fictif demo-vacances-access. Les refus PERMISSION_DENIED dans les sorties des tests sont attendus. Aucun accès au projet réel. Tests durables : tests/firestore-rules.test.mjs et lanceur tests/run-firestore-rules.ps1.

Tests client : tests/firebase-access.test.mjs vérifie attente, chargement depuis le serveur, révocation, absence de publication du cache et erreurs. tests/firebase-access-browser.cjs vérifie l’interface en Edge à 390 et 1280 pixels avec SDK Firebase simulé et autres requêtes externes bloquées. La régression du budget reste vérifiée séparément.

Déploiement restant : publication des fichiers du site, création par Julian de son propre document membre dans la console, publication manuelle de firestore.rules, puis vérification avec un navigateur autorisé et un navigateur inconnu. Le README détaille ces étapes. Les règles en production n’ont pas été modifiées par ce correctif local. Le constat 2 ne sera considéré résolu en production qu’après activation et contrôle.

## Suivi après activation des appareils

Le responsable confirme dans la conversation avoir publié les règles du constat 2 et créé son document membre. Il confirme la synchronisation de son navigateur autorisé et le blocage d’une fenêtre privée inconnue. Ces confirmations sont fournies par le responsable ; aucune inspection directe de la console n’a été effectuée.

## Correctif du troisième constat — préparé localement

Régression reproduite avant correction : le test exigeant le refus des racines et structures incorrectes échouait. Les nouveaux tests de métadonnées Firestore échouaient également avec les anciennes règles (10 réussites / 2 échecs).

La fonction normalizeData contrôle désormais la structure avant les migrations existantes : racine objet, champs principaux présents, types des textes/auteurs, tuples, listes et identifiants uniques, contacts, budgets et montants finis. Des limites de volume bornent les tableaux, textes et contenu sérialisé. Le contenu est cloné pour ne pas modifier la source reçue. Les migrations et les données personnalisées valides sont conservées.

Réception Firebase : validation avant notification au carnet, puis contrôle au point d’application et avant cache. Une version refusée ne remplace ni data ni le cache sain et affiche un avertissement ; aucun envoi automatique de la version de secours. Les envois restent bloqués jusqu’à une réception valide. Une copie locale incorrecte ne bloque pas le démarrage et n’est pas effacée. Contrôle complémentaire du format de la valise locale avant sa migration.

Règles : champs externes autorisés et obligatoires, contentJson chaîne non vide bornée, noms bornés, UID auteur égal au compte connecté, date de type timestamp égale à request.time, liste des sections bornée et limitée aux sections connues. Les autorisations par appareil sont conservées. Les lectures et anciens historiques ne sont pas migrés. Limite explicite : ces règles ne décodent pas contentJson ; elles ne constituent pas une validation métier du JSON côté serveur. Les clients corrigés refusent son contenu mal formé.

Vérifications : suite Node habituelle, contrôles Edge (390 et 1280 pixels) avec SDK simulé, réception mal formée, rejet sans exception, cache sain intact, reprise après version valide, rechargement, copies locales du carnet et de la valise déjà corrompues sans écrasement automatique. Le test de budget contrôle toujours les libellés inertes et les calculs pour 4 à 7 personnes. L’émulateur local vérifie les nouvelles règles ; les refus attendus apparaissent en PERMISSION_DENIED. Aucun appel Firebase réel, aucune suppression ou modification de données partagées.

Activation restante : publier les fichiers du site, puis republier le contenu complet de firestore.rules dans la console. Aucun nouvel appareil à créer pour les navigateurs déjà autorisés.

Référence technique : [contrôle des champs et types Firestore](https://firebase.google.com/docs/firestore/security/rules-fields).

## Choix ultérieur : accès automatique confirmé par le responsable

Après usage, le responsable demande explicitement de retirer les approbations par appareil et accepte que toute personne découvrant le site puisse lire et modifier le carnet. Le client se connecte anonymement puis écoute directement le carnet ; aucune consultation members. Les règles exigent une connexion et conservent les contrôles de champs, tailles, UID et dates serveur. La protection du budget et les validations des données sont conservées. Les anciennes fiches members restent privées et inutilisées, sans suppression. Le constat d’accès non réservé aux amis devient une limite volontairement acceptée, et non une restriction toujours en vigueur. Activation : publication du site puis publication manuelle des règles correspondantes.
