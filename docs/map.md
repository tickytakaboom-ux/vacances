# Carte des lieux du voyage

La carte, après les activités, affiche les dix lieux choisis avec des repères numérotés orange. Les Orres correspond au centre de la **station 1650**, et non au village. Les autres points sont une sélection autour du camping : restaurants, supermarchés et attractions. La liste et les liens d’itinéraire restent utilisables indépendamment du fond de carte. Bouton d’ouverture volontaire, filtres, vue des dix lieux, agrandissement et réduction avec Échap.

## Sources et coût

- [Leaflet 1.9.4](https://leafletjs.com/download.html), bibliothèque libre, livrée localement avec sa licence BSD.
- [OpenStreetMap](https://www.openstreetmap.org/copyright), données ODbL et fond de carte. Attribution visible. Les images sont chargées directement par le navigateur après ouverture volontaire, avec les en-têtes et le cache ordinaires du navigateur. Aucun préchargement massif ou téléchargement hors ligne. [Politique des tuiles](https://operations.osmfoundation.org/policies/tiles/).
- [Photon](https://github.com/komoot/photon), service de démonstration public gratuit, sans clé, autorisant un usage raisonnable mais sans garantie de disponibilité. Trois requêtes au maximum par actualisation quotidienne, rayon de 4 km autour de La Clapière, limite de 20 résultats par catégorie. Ce n’est pas un inventaire exhaustif. Les filtres osm_tag ont été vérifiés sur les réponses réelles du service ; ils sont annoncés comme dépréciés par sa documentation, à surveiller si son contrat évolue.
- [Nominatim](https://operations.osmfoundation.org/policies/nominatim/) a servi uniquement à la préparation des coordonnées, avec des requêtes espacées et mises en cache. Aucun appel automatique à ce service en production. Certains points ont été corrigés à partir des sites officiels : chaque lieu conserve sa source et, si utile, une précision.
- Les liens Google Maps ouvrent un itinéraire via une URL, sans API, compte de développeur ni clé payante.

Aucun abonnement, moyen de paiement ou secret à ajouter. Le workflow GitHub Pages existant reste limité au dépôt public et aux machines standard. Les appels Photon sont faits par Node dans GitHub Actions, pas par les visiteurs. Seules les images du fond OSM viennent directement du fournisseur, conformément à sa politique. Le caractère privé de votre liste Google n’est pas importé : les dix lieux fournis sont enregistrés dans les fichiers publics du site.

## Cache et panne

Chaque catégorie a son propre cache de 24 heures. Le workflow météo tourne chaque heure mais ne rappelle Photon que lorsque ce cache expire. Une catégorie en panne conserve sa dernière liste valide et sa date de relevé ; une nouvelle tentative est permise après une heure. Aucune réponse invalide n’écrase une liste correcte. Overpass a été testé, mais ses services n’étaient pas disponibles lors des essais : il n’est pas un fournisseur de secours fonctionnel dans cette version.

Dans le navigateur, les JSON du site sont conservés en local comme dernier recours. Sans aucune donnée alentour, les dix lieux restent affichés. Sans fond de carte, les repères et liens d’itinéraire restent accessibles. L’interface affiche la date la plus ancienne des catégories et prévient si les données sont conservées après une panne ou vieillissent.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| index.html, map.css, map.js | Bloc carte, présentation, filtres et interactions |
| assets/vendor/leaflet/ | Leaflet et sa licence, sans dépendance à un CDN lors de la visite |
| data/selected-places.json | Dix lieux, coordonnées, adresses et provenance |
| data/nearby-places.json | Dernières réponses Photon normalisées, dates et états |
| server/places/photon.mjs | Appels, délai de 8 secondes, validation, rayon et déduplication |
| server/places/service.mjs | Cache quotidien et conservation de la dernière liste |
| scripts/update-places.mjs | Actualisation du fichier publié |
| tests/places.test.mjs | Cache, panne partielle, première panne, données invalides, coordonnées de la station |
| tests/places-live.mjs | Contrat des trois requêtes réelles Photon |
| .github/workflows/weather-pages.yml | Actualisation et publication, avec la météo |

## Vérifier et publier

Node 24, aucune installation de paquet nécessaire pour les scripts et tests :

~~~sh
node --test tests/weather.test.mjs tests/places.test.mjs
node --test tests/places-live.mjs
node scripts/update-places.mjs
~~~

Les vérifications navigateur locales sont dans .preview/map-browser-check.cjs (ignoré par Git). Elles utilisent Edge et Playwright du runtime Codex. Les tuiles y sont simulées pour éviter des téléchargements automatisés sur OSM ; les captures ne représentent donc pas le vrai fond géographique. Les appels Photon, les coordonnées sélectionnées et le fond OSM ont été vérifiés séparément avec des requêtes réelles.

Publier les changements avec un commit et Push origin sur main dans GitHub Desktop. Le workflow déjà configuré prépare les seuls fichiers publics et les déploie sur GitHub Pages. Aucune nouvelle configuration Pages ou clé n’est nécessaire. Vérifier que le dernier workflow est vert, puis recharger le site.

Pour ajouter ou corriger un lieu choisi, modifier data/selected-places.json : id unique, nom, latitude et longitude numériques, adresse, sourceUrl ; osmId facultatif permet d’éviter un doublon avec les lieux alentour. Les dix lieux actuels ne sont pas synchronisés automatiquement avec la liste privée Google.
