# Connexion Discord via serveur loopback local (Tauri) — notes d'architecture

Statut : **implémenté et testé** côté `dofus-dispo` et `dofusin-api`.

## Historique : pourquoi pas un deep link `dofusin://` ?

Première implémentation : schéma d'URL personnalisé (`dofusin://auth/callback`)
via `tauri-plugin-deep-link`, pattern courant pour ce genre de flux (Slack,
Spotify, VS Code...). **Ça ne marche pas avec Discord** : son OAuth2 rejette
les redirect_uri qui ne commencent pas par `http://`/`https://` — erreur
`"dofusin://auth/callback is not supported by client"` à l'autorisation,
confirmé par un [issue ouvert de longue date sur discord-api-docs](https://github.com/discord/discord-api-docs/issues/450)
demandant ce support (jamais accordé).

Le pattern de repli standard pour les apps natives dans ce cas est un
**serveur HTTP loopback local** (RFC 8252) : l'app ouvre elle-même un mini
serveur sur `127.0.0.1`, et c'est *cette* URL `http://localhost:<port>/...`
qui est enregistrée comme redirect_uri — Discord accepte ça sans problème
(vérifié en pratique).

## Flux complet

1. `AuthProvider.loginWithDiscord()` (`src/context/auth-context.tsx`) appelle
   la commande Tauri `start_oauth_callback_server` (`invoke()`), qui démarre
   (une seule fois par run de l'app — no-op ensuite) un serveur `tiny_http`
   côté Rust sur `127.0.0.1:48991` (`src-tauri/src/oauth.rs`).
2. Il ouvre ensuite le navigateur système via `openUrl()`
   (`@tauri-apps/plugin-opener`) sur l'URL d'autorisation Discord :
   `https://discord.com/api/v10/oauth2/authorize?client_id=...&redirect_uri=http://localhost:48991/callback&response_type=code&scope=identify&state=<random>`
   (version pinnée, `v10` — voir https://docs.discord.com/developers/reference).
3. L'utilisateur valide dans son navigateur (déjà connecté à Discord la
   plupart du temps → un clic).
4. Discord redirige le navigateur vers
   `http://localhost:48991/callback?code=...&state=...` — une requête HTTP
   normale, reçue par le serveur loopback. Celui-ci répond une page HTML
   ("tu peux fermer cet onglet") et émet l'event Tauri `oauth://callback`
   avec la query string.
5. Le listener JS (`listen("oauth://callback", ...)`, enregistré une fois
   dans `AuthProvider`) vérifie que `state` correspond à celui généré à
   l'étape 2 (protection CSRF — sinon ignoré), extrait `code`.
6. L'app envoie `code` à `dofusin-api` : `POST /api/auth/discord { code }`
   (via `HttpApiClient.loginWithDiscord`, `src/lib/api/http-api-client.ts`).
7. **C'est le serveur, jamais l'app desktop, qui parle à Discord avec le
   `client_secret`** (`dofusin-api/src/lib/discord.ts`) : il échange `code`
   contre un access token (`POST discord.com/api/v10/oauth2/token`), puis
   récupère l'identité (`GET discord.com/api/v10/users/@me`).
8. Le serveur retrouve/crée l'utilisateur local par id Discord, émet une
   session/JWT, et renvoie `{ token, user }` — contrairement à un ancien
   login pseudo/mot de passe, le frontend ne connaît pas le pseudo à
   l'avance (il vient de Discord), donc le serveur renvoie le `user`
   directement plutôt que de le faire reconstruire depuis le JWT.

## Pourquoi un serveur qui boucle plutôt qu'un serveur à usage unique

`start_oauth_callback_server` ne s'arrête jamais une fois lancé (boucle sur
`server.incoming_requests()` pour la durée de vie de l'app) plutôt que de
répondre une seule fois puis se fermer. Raison : si l'utilisateur annule
(`cancelDiscordLogin()`) ou ferme l'onglet sans autoriser, il n'y a pas de
requête à traiter — un serveur à usage unique resterait bloqué sur son
unique `accept()`, et la tentative de connexion suivante échouerait à
re-binder le port fixe (`48991`, déjà occupé par le thread précédent
toujours en attente). En bouclant indéfiniment, une tentative annulée
laisse simplement le serveur inactif jusqu'à la prochaine vraie requête —
aucune gestion d'arrêt/relance à écrire.

## Fallback hors Tauri / en stratégie mock

Hors de Tauri (`npm run dev` dans un onglet navigateur classique) ou en
stratégie mock (même dans Tauri), le round-trip navigateur+serveur loopback
est impossible ou inutile. Dans ces cas, `loginWithDiscord()` appelle
directement `getApiClient().loginWithDiscord("mock")` sans rien ouvrir — la
condition exacte est `isTauri() && VITE_API_STRATEGY === "http"` pour
déclencher le vrai flux, sinon le raccourci. `MockApiClient.loginWithDiscord`
ignore le code et réutilise un compte factice déterministe (`{id:"u1",
username:"test"}`).

## Côté Tauri

- `src-tauri/Cargo.toml` — `tauri-plugin-opener` (ouvrir le navigateur) et
  `tiny_http` (le serveur loopback, pas besoin d'un runtime async pour une
  poignée de requêtes).
- `src-tauri/capabilities/default.json` — `"opener:default"`. La commande
  `start_oauth_callback_server` n'a besoin d'aucune permission particulière :
  c'est une commande de l'app elle-même (pas d'un plugin), toujours
  invocable via `invoke()`.
- `src-tauri/src/oauth.rs` — la commande elle-même (voir docstring dans le
  fichier pour le détail).
- `src-tauri/src/lib.rs` — enregistre `tauri_plugin_opener::init()` et
  la commande via `invoke_handler`.

Plus besoin de `tauri-plugin-deep-link` ni de `tauri-plugin-single-instance`
(retirés) — ce dernier n'existait que pour gérer le problème de relance de
process propre aux schémas custom sur Windows/Linux, qui ne se pose pas avec
un serveur HTTP local (le navigateur fait juste une requête normale vers un
process déjà en cours d'exécution).

## Côté Discord Developer Portal

- Créer une application sur https://discord.com/developers/applications.
- Onglet OAuth2 → ajouter `http://localhost:48991/callback` comme Redirect
  URI (URL exacte, port fixe).
- Récupérer `client_id` (public, va dans `VITE_DISCORD_CLIENT_ID` côté
  `dofus-dispo`) et `client_secret` (uniquement dans `dofusin-api/.env`,
  jamais dans ce repo ni dans le binaire Tauri).
- Scope minimal : `identify` (id, username, avatar).

## Côté API (`dofusin-api`, repo séparé)

`POST /api/auth/discord` — voir `dofusin-api/docs/api.md` pour le contrat
complet et `dofusin-api/docs/data-model.md` pour le modèle `User`
(`discordId`, `avatarUrl`, plus de mot de passe stocké nulle part).

## Ce qui reste ouvert

- Gestion de l'échec/annulation (l'utilisateur ferme l'onglet du navigateur
  sans valider) : `cancelDiscordLogin()` existe côté contexte, câblé à un
  bouton "Annuler" dans `LoginForm` pendant l'attente — mais pas de timeout
  automatique si l'utilisateur ne fait ni l'un ni l'autre.
- Build/installation réels (`npm run tauri build`) pas encore testés.
