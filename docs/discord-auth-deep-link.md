# Connexion Discord via deep link (Tauri) — notes d'architecture

Statut : **implémenté** côté `dofus-dispo` et `dofusin-api`. Ce document
garde la trace du flux et des pièges rencontrés, pour ne pas les redécouvrir.

## Pourquoi un deep link ?

Une app desktop ne peut pas recevoir une redirection HTTP classique comme un
site web (pas de serveur qui écoute sur le port 443 du domaine de l'app). Le
pattern standard pour un flux OAuth "Autoriser dans le navigateur puis revenir
dans l'app" est d'enregistrer un **schéma d'URL personnalisé** auprès de l'OS
(ex. `dofusin://...`) : quand le navigateur est redirigé vers cette URL,
l'OS relance l'app (ou la réactive) au lieu d'essayer de charger une page web.

C'est un pattern très courant, pas une bidouille spécifique à ce projet :
Slack, Spotify, VS Code, GitHub Desktop, l'app Discord elle-même, Steam...
toutes les apps desktop qui font du "login via navigateur" fonctionnent
comme ça. Discord documente explicitement ce cas d'usage dans son OAuth2
(native apps / custom redirect scheme), donc rien d'exotique côté
fournisseur non plus.

**Alternative existante** : un petit serveur loopback local
(`http://127.0.0.1:<port>/callback`) au lieu d'un schéma custom — utilisé par
`tauri-plugin-oauth`. Certains fournisseurs (Google, historiquement) exigent
ce mode. Discord accepte le schéma custom, donc pas besoin de cette
complexité ici, mais à garder en tête si un jour on ajoute un autre
fournisseur OAuth plus strict.

## Flux complet

1. `AuthProvider.loginWithDiscord()` (`src/context/auth-context.tsx`) ouvre
   le navigateur système via `openUrl()` (`@tauri-apps/plugin-opener`) sur
   l'URL d'autorisation Discord :
   `https://discord.com/api/v10/oauth2/authorize?client_id=...&redirect_uri=dofusin://auth/callback&response_type=code&scope=identify&state=<random>`
   (version pinnée, `v10` — voir https://docs.discord.com/developers/reference).
2. L'utilisateur valide dans son navigateur (déjà connecté à Discord la
   plupart du temps → un clic).
3. Discord redirige le navigateur vers `dofusin://auth/callback?code=...&state=...`.
   L'OS reconnaît le schéma `dofusin://` (enregistré par l'app) et
   relance/réactive l'app Tauri au lieu d'essayer de charger une page.
4. L'écouteur `onOpenUrl` (`@tauri-apps/plugin-deep-link`, enregistré une
   fois dans `AuthProvider`) reçoit l'URL, vérifie que `state` correspond à
   celui généré à l'étape 1 (protection CSRF — sinon l'URL est ignorée),
   extrait `code`.
5. L'app envoie `code` à `dofusin-api` : `POST /api/auth/discord { code }`
   (via `HttpApiClient.loginWithDiscord`, `src/lib/api/http-api-client.ts`).
6. **C'est le serveur, jamais l'app desktop, qui parle à Discord avec le
   `client_secret`** (`dofusin-api/src/lib/discord.ts`) : il échange `code`
   contre un access token (`POST discord.com/api/v10/oauth2/token`), puis
   récupère l'identité (`GET discord.com/api/v10/users/@me`).
7. Le serveur retrouve/crée l'utilisateur local par id Discord, émet une
   session/JWT, et renvoie `{ token, user }` — contrairement à un ancien
   login pseudo/mot de passe, le frontend ne connaît pas le pseudo à
   l'avance (il vient de Discord), donc le serveur renvoie le `user`
   directement plutôt que de le faire reconstruire depuis le JWT.

## Fallback hors Tauri / en stratégie mock

Décision prise avec l'utilisateur : hors de Tauri (`npm run dev` dans un
onglet navigateur classique) ou en stratégie mock (même dans Tauri), le
round-trip navigateur+deep link est impossible ou inutile. Dans ces cas,
`loginWithDiscord()` appelle directement
`getApiClient().loginWithDiscord("mock")` sans ouvrir de navigateur — la
condition exacte est `isTauri() && VITE_API_STRATEGY === "http"` pour
déclencher le vrai flux, sinon le raccourci. `MockApiClient.loginWithDiscord`
ignore le code et réutilise un compte factice déterministe (`{id:"u1",
username:"test"}`), comme l'ancien login mocké.

## Côté Tauri (implémenté)

Package JS : `@tauri-apps/plugin-deep-link` + `@tauri-apps/plugin-opener`
(pas `tauri-plugin-shell`, plus étroit et suffisant pour juste ouvrir une
URL — `openUrl()`). Crates Rust : `tauri-plugin-deep-link`,
`tauri-plugin-opener`, `tauri-plugin-single-instance`.

- `src-tauri/Cargo.toml` — les 3 dépendances (single-instance avec la
  feature `deep-link`).
- `src-tauri/capabilities/default.json` — `"deep-link:default"` et
  `"opener:default"` ajoutés aux permissions (même fichier où vivent déjà
  `core:window:allow-close` etc., voir CLAUDE.md § Custom title bar).
- `src-tauri/tauri.conf.json` — `plugins.deep-link.desktop.schemes: ["dofusin"]`.
- `src-tauri/src/lib.rs` — `tauri_plugin_single_instance::init(...)` est
  enregistré **en premier** dans le `Builder` (contrainte de l'écosystème
  Tauri), avec un callback vide : `tauri-plugin-deep-link` transmet déjà
  l'URL entrante au listener JS `onOpenUrl` tout seul une fois
  single-instance actif — pas besoin de forwarder l'event manuellement (une
  première version de ce fichier le faisait, c'était inutile). Dans
  `.setup()`, `app.deep_link().register_all()` (via `DeepLinkExt`,
  `#[cfg(any(windows, target_os = "linux"))]` uniquement) pour que le
  schéma marche en dev sans installer l'app.

### Piège Windows/Linux : pourquoi single-instance est obligatoire

Sur Windows et Linux, activer un schéma custom **relance une nouvelle
instance** de l'app avec l'URL en argument CLI, au lieu d'émettre un
événement dans l'instance déjà ouverte (comportement de macOS). Sans
`tauri-plugin-single-instance`, cliquer "Autoriser" dans le navigateur
pendant que DofusIn tourne déjà ouvrirait une 2ᵉ fenêtre au lieu de
compléter la connexion dans celle déjà ouverte.

## Côté Discord Developer Portal

- Créer une application sur https://discord.com/developers/applications.
- Onglet OAuth2 → ajouter `dofusin://auth/callback` comme Redirect URI (et
  temporairement une URI `http://localhost:3000/callback` si besoin de
  tester manuellement sans deep link, voir `dofusin-api`'s `GET /callback`).
- Récupérer `client_id` (public, va dans `VITE_DISCORD_CLIENT_ID` côté
  `dofus-dispo`) et `client_secret` (uniquement dans `dofusin-api/.env`,
  jamais dans ce repo ni dans le binaire Tauri).
- Scope minimal : `identify` (id, username, avatar).

## Côté API (`dofusin-api`, repo séparé)

`POST /api/auth/discord` implémentée — voir `dofusin-api/docs/api.md` pour
le contrat complet et `dofusin-api/docs/data-model.md` pour le modèle
`User` (`discordId`, `avatarUrl`, plus de mot de passe stocké nulle part).

## Ce qui reste ouvert

- Gestion de l'échec/annulation (l'utilisateur ferme l'onglet du navigateur
  sans valider) : `cancelDiscordLogin()` existe côté contexte, câblé à un
  bouton "Annuler" dans `LoginForm` pendant l'attente — mais pas de timeout
  automatique si l'utilisateur ne fait ni l'un ni l'autre.
- Build/installation réels (`npm run tauri build`) pas encore testés — le
  schéma `dofusin://` n'est actif sans installation qu'en dev grâce à
  `register_all()`.
