# Cahier des charges - Application desktop React + Tauri

## 1. Objectif

Créer une application desktop gratuite permettant aux joueurs d'un jeu en ligne de :
- trouver des joueurs disponibles ;
- copier rapidement une commande de message privé vers le personnage aidant ;
- gérer leurs personnages et disponibilités.

L'application est distribuée sous forme d'exécutable.

## 2. Stack technique

- React + TypeScript
- Tauri
- API REST HTTPS
- Build Tauri (.exe)

## 3. Fonctionnalités

### Compte utilisateur

L'utilisateur peut :
- créer un compte ;
- se connecter.

Lors de la première inscription, il doit créer au moins un personnage.

### Personnages

Un compte peut posséder plusieurs personnages.

Un personnage contient :
- nom exact en jeu ;
- serveur ;
- classe.

L'utilisateur peut :
- ajouter ;
- modifier ;
- supprimer ses personnages.

### Disponibilité quotidienne

Un joueur peut rendre un personnage disponible pour aider.

Informations :
- personnage utilisé ;
- serveur ;
- prix :
  - gratuit ;
  - montant en monnaie du jeu.

La disponibilité est valable uniquement pour la journée en cours.

Le lendemain, le joueur doit refaire l'action "Disponible aujourd'hui".

Aucun heartbeat n'est nécessaire.

### Recherche

L'utilisateur recherche des aides selon :
- serveur ;
- classe (optionnel) ;

Les résultats affichent :
- personnage ;
- serveur ;
- classe ;
- prix.

Un bouton permet de copier une commande :

/w NomDuPersonnage Bonjour, j'ai besoin d'aide.

## 4. Règles métier

- Un utilisateur possède plusieurs personnages.
- Un personnage appartient à un seul utilisateur.
- Une disponibilité concerne un personnage précis.
- Une disponibilité expire automatiquement le jour suivant.
- Seules les disponibilités du jour courant sont visibles.
- Le pseudo du personnage est déclaré par l'utilisateur.
- L'application ne vérifie pas l'existence réelle du personnage en jeu.

## 5. Écrans

- Connexion
- Inscription
- Accueil
- Mes personnages
- Gestion disponibilité
- Recherche d'aides

## 6. Contraintes

- Aucun stockage serveur local.
- Toutes les données transitent par l'API REST.
- Gestion des erreurs réseau.
- Protection des données sensibles.
"""

api_md = r"""# Cahier des charges - API REST Express.js

## 1. Objectif

Fournir une API permettant à l'application desktop de gérer :
- les comptes ;
- les personnages ;
- les disponibilités ;
- la recherche d'aides.

## 2. Stack

- Node.js
- Express.js
- PostgreSQL recommandé
- JWT pour authentification

## 3. Modèle de données

### users

Champs :
- id
- username
- password_hash
- created_at

### characters

Champs :
- id
- user_id
- name
- server
- class
- created_at

Relation :
Un utilisateur possède plusieurs personnages.

### availability

Champs :
- id
- character_id
- available_date
- price
- created_at

Une disponibilité est valide uniquement si : available_date = CURRENT_DATE

## 4. Routes authentification

### POST /api/auth/register

Création d'un compte.

Body :

```json
{
  "username": "Pseudo",
  "password": "motdepasse"
}

POST /api/auth/login

Connexion.

Retourne un JWT.

5. Routes personnages

JWT obligatoire.

GET /api/characters

Retourne les personnages du compte connecté.

POST /api/characters

Ajoute un personnage.

Body :

{
  "name": "NomPersonnage",
  "server": "Serveur",
  "class": "Classe"
}
PUT /api/characters/:id

Modifie un personnage.

DELETE /api/characters/:id

Supprime un personnage.

6. Routes disponibilité
POST /api/availability

Rend un personnage disponible aujourd'hui.

Body :

{
  "characterId": 12,
  "price": 5000
}

Le serveur crée ou remplace la disponibilité du jour.

DELETE /api/availability/:characterId

Retire la disponibilité du jour.

7. Recherche publique

GET /api/helpers

Recherche les personnages disponibles.

Exemple :

GET /api/helpers?server=Draconiros

Réponse :

[
  {
    "character": "Dark-Toto",
    "server": "Draconiros",
    "class": "Panda",
    "price": 0
  }
]

La recherche doit filtrer :

availability.available_date = CURRENT_DATE

8. Sécurité

Hashage des mots de passe.
Vérification JWT sur les routes privées.
Validation des entrées.
Protection contre abus sur routes publiques.