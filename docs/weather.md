# Météo Embrun : intégration et activation

## Ce qui est livré
Bloc compact juste avant le programme : aperçu du jour, température minimale et maximale,
risque de pluie, vent maximal, UV et coucher du soleil. Les six prochains jours se déplient.
Les données météo sont indépendantes des modifications partagées Firebase.

Le navigateur lit seulement `data/weather.json` sur le même site. Les appels aux sources
sont exécutés côté serveur par Node.js dans GitHub Actions ; aucun service serveur payant
n'est ajouté. Cache persistant d'une heure dans le JSON, secours MET Norway, puis dernier
relevé connu si toutes les sources tombent. Un relevé trop ancien ou expiré est signalé.
Les visiteurs hors ligne peuvent retrouver le dernier relevé stocké sur leur appareil.

## Sources branchées
| Source | Adresse réellement testée | Clé | Limite | Cache | Secours |
|---|---|---|---|---|---|
| Open-Meteo | https://api.open-meteo.com/v1/forecast?latitude=44.56387&longitude=6.49526&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,uv_index_max,sunset&timezone=Europe%2FParis&forecast_days=7 | Non | 600/min, 5 000/h, 10 000/j, 300 000/mois | 1 h | MET Norway |
| MET Norway Locationforecast | https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=44.5638&lon=6.4952 | Non ; User-Agent identifiant | Respect des en-têtes de cache ; accord au-delà de 20 requêtes/s/application | Au moins 1 h, jamais avant Expires | Dernier relevé connu |
| MET Norway Sunrise | https://api.met.no/weatherapi/sunrise/3.0/sun?lat=44.5638&lon=6.4952&date=2026-10-11&offset=%2B02%3A00 | Non ; User-Agent identifiant | Même politique | Réutilisation du coucher pour la même date | Coucher déjà connu ou indisponible |

Tests du 11 octobre 2026 : HTTP 200 pour les trois services (355, 374 et 281 ms lors
de la sélection). Embrun en France a été géocodé réellement ; les coordonnées MET Norway
sont tronquées à quatre décimales selon leurs conditions.
L'UV MET Norway est par ciel clair et explicitement indiqué comme tel.
Les températures et cumuls du secours concernent les heures disponibles, parfois une
journée partielle ; le risque de pluie en pourcentage et les couchers futurs non disponibles
sont omis. La pluie n'additionne pas des périodes qui se chevauchent.
Les prévisions portent sur les jours à venir, pas sur juillet 2027 à l'avance.

## Tests (Node.js 24, sans installation de paquets)
```powershell
node --test tests/weather.test.mjs
node --test tests/weather-live.mjs
node scripts/update-weather.mjs
```
La première commande est hors ligne (cache et pannes). La deuxième appelle les vraies
sources et nécessite le réseau. La troisième écrit le fichier météo seulement si le cache
est expiré. Les tests live ne tournent pas toutes les heures afin de limiter les appels.

## À FAIRE PAR UN HUMAIN avant activation
1. Relire les changements, puis publier les fichiers sur la branche main du dépôt.
2. Dans Settings > Pages, choisir la source **GitHub Actions** (le README ancien décrit
   une publication depuis une branche). Le workflow prépare tous les fichiers du site et
   actualise la météo à chaque publication.
3. Dans Actions, lancer **Météo et GitHub Pages** avec **Run workflow** pour vérifier le
   premier déploiement. Vérifier que les règles de branche autorisent le bot à modifier
   uniquement le relevé météo. Si main est protégée, adapter ces règles ou le flux de
   publication avant activation.
4. Garder le dépôt public pour ce workflow : les jobs sont désactivés sur un dépôt privé
   avant allocation de machine. Ne pas changer sa visibilité automatiquement : les
   fichiers existants du carnet sont déjà publics sur ce dépôt.
5. Vérifier une fois la page publiée et le bloc météo.

Aucune clé gratuite à créer. Aucune carte bancaire, offre payante ou facturation à activer.
Aucune variable d'hébergement obligatoire. `MET_NO_USER_AGENT` est facultative côté
serveur : valeur réelle du projet par défaut et dans le workflow, sans secret.
Si utilisée localement : `node --env-file=.env scripts/update-weather.mjs`. Ne pas publier
.env ; .env.example contient seulement l'identification publique du projet.

Le workflow utilise une machine Ubuntu standard et les outils GitHub Pages gratuits
sur un dépôt public. Pas de cache Actions supplémentaire ni d'abonnement Firebase Functions.
L'artefact Pages est conservé un jour. Le token intégré GitHub reste côté serveur.
Les exécutions planifiées se font à la minute 17 chaque heure, mais GitHub peut les retarder
ou en omettre ; la page signale les relevés anciens. GitHub désactive les planifications des
dépôts publics après 60 jours sans activité ; vérifier l'activation avant les vacances.
Le traitement publie même en cas de panne API et conserve le relevé antérieur.
Un conflit Git ou un refus de publication n'est pas masqué : consulter Actions.

## Sources évaluées et autres pistes
Open-Meteo et MET Norway retenues après appels réussis.
Aucune API n'a été écartée pour panne lors de ces tests.
Les services nécessitant une clé n'ont pas été explorés : les deux sources gratuites
suffisent. DATAtourisme, Overpass et qualité de l'air restent hors du périmètre validé.

## Fichiers
- index.html : emplacement du bloc et chargement CSS/JS météo.
- weather.css : présentation compacte et responsive.
- weather.js : lecture du relevé du site, détails et cache local en cas de panne réseau.
- server/weather/http.mjs : délai maximal 8 s, validation, localisation et dates.
- server/weather/open-meteo.mjs : source principale normalisée.
- server/weather/met-norway.mjs : secours, conversion vent et coucher du jour.
- server/weather/service.mjs : cache horaire, repli, conservation de la date du relevé.
- scripts/update-weather.mjs : mise à jour du JSON persistant.
- data/weather.json : premier relevé réel et dernière valeur connue.
- tests/weather.test.mjs : scénarios de cache, données invalides et pannes.
- tests/weather-live.mjs : contrat vérifié sur chaque source réelle.
- .github/workflows/weather-pages.yml : actualisation et publication Pages côté serveur.
- .env.example : identification MET Norway facultative, sans secret.
- .gitignore : exclusion des secrets et fichiers de travail.
- README.md : renvoi vers ce guide.
- docs/weather.md : ce livrable et les conditions d'activation.

## Références
- https://open-meteo.com/en/terms
- https://open-meteo.com/en/pricing
- https://api.met.no/doc/TermsOfService
- https://api.met.no/weatherapi/locationforecast/2.0/documentation
- https://api.met.no/weatherapi/sunrise/3.0/documentation
- https://docs.github.com/en/billing/concepts/product-billing/github-actions
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
