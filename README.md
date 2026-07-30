# Les Zigotos à Embrun

Site statique mobile-first pour centraliser le voyage à Embrun en 2027.

## Publication avec GitHub Pages

1. Créer un dépôt GitHub et y déposer le contenu de ce dossier.
2. Dans les réglages du dépôt, ouvrir **Pages**.
3. Choisir **Deploy from a branch**, la branche `main`, puis le dossier `/ (root)`.
4. GitHub affiche ensuite l'adresse publique du site.

Selon le type de compte GitHub, la publication Pages depuis un dépôt privé peut ne pas être proposée. Dans ce cas, garder les données non sensibles et utiliser un dépôt public dédié au site, ou choisir une autre solution d'hébergement.

## Modifications

Le bouton **Modifier** permet de changer le texte du programme et certaines présentations. Les modifications sont enregistrées localement puis synchronisées en direct dans Cloud Firestore. Si Firebase est momentanément indisponible, la copie locale reste accessible.

## Configuration Firebase

- Activer l'authentification anonyme dans Firebase Authentication.
- Créer une base Cloud Firestore.
- Copier le contenu de `firestore.rules` dans l'onglet **Rules** de Firestore, puis publier les règles.
- Ajouter le domaine GitHub Pages dans **Authentication > Settings > Authorized domains** si Firebase ne l'accepte pas automatiquement.

Les visiteurs sont connectés anonymement : aucun compte ni mot de passe n'est demandé. Toute personne ayant accès au site peut donc modifier le carnet.
