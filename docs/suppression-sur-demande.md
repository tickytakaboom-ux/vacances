# Traiter une demande de suppression

Procédure convenue avec Julian STEHLIN le 11 octobre 2026. Contact : julwan@icloud.com. Aucune suppression exécutée à la création de ce guide.

1. Accuser réception et préciser avec l’ami quelles informations retirer. Vérifier son identité par le contact habituel du groupe, sans demander systématiquement une pièce d’identité.
2. Avant intervention, prévenir les participants et leur demander de fermer le carnet pour éviter des modifications simultanées ou le réenvoi d’une copie locale ancienne.
3. Dans le carnet courant, retirer les informations concernées puis enregistrer. Vérifier dans Firebase, projet vacances-73619, Firestore, document trips/embrun-2027, que contentJson ne les contient plus. Le contenu, les auteurs et les champs updatedByName / updatedByUid doivent être examinés selon la demande. Ne pas supprimer tout le carnet.
4. Examiner chaque document de trips/embrun-2027/history : contentJson contient une copie complète du carnet, pas seulement le changement de son auteur. Chercher aussi changedByName et changedByUid. Le filtrage par auteur seul ne suffit pas. Une suppression du carnet courant crée elle-même une nouvelle entrée d’historique ; traiter donc l’historique après le contenu courant.
5. Nettoyer les données concernées dans les anciennes copies avec un accès d’administration Firebase. Conserver les données des autres amis. Les règles client interdisent les modifications/suppressions d’historique : ne pas les ouvrir pour cette démarche. Si la modification d’un contentJson est nécessaire, préparer un JSON valide et vérifier le résultat avant tout remplacement. Revenir demander une assistance ciblée pour cette intervention plutôt que manipuler une longue chaîne à l’aveugle.
6. Si la demande concerne aussi la connexion technique, identifier avec certitude les UID Firebase associés à cette personne avant toute action dans Authentication. Un prénom seul peut correspondre à plusieurs personnes, et un ami peut avoir plusieurs connexions anonymes. Effacer un compte Authentication ne supprime pas automatiquement les contenus Firestore.
7. Vérifier les copies/sauvegardes administrées par le responsable et demander aux participants de retirer les anciennes copies locales concernées si nécessaire. Éviter toute restauration qui réintroduirait les informations retirées. Les journaux et sauvegardes internes des fournisseurs dépendent de leurs propres procédures ; ne pas promettre leur effacement immédiat.
8. Vérifier le contenu courant, les anciennes copies concernées et la portée réelle de l’intervention. Répondre à l’ami en indiquant ce qui a été retiré et les éventuelles limites. Conserver seulement la trace minimale nécessaire de la demande et de son traitement.

La console d’administration est distincte du mode « administrateur » du site. Aucune extension payante, aucun abonnement et aucun script de suppression automatique n’est prévu.

Référence technique :
https://firebase.google.com/docs/firestore/manage-data/delete-data

Ce guide décrit la préparation d’une intervention. Toute suppression réelle nécessite une demande précise, l’identification des éléments concernés et une vérification avant application.
