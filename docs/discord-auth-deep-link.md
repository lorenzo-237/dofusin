# Connexion Discord via deep link (Tauri) — notes d'architecture

Statut : **pas implémenté**. Ce document décrit le plan discuté pour remplacer
l'auth pseudo/mot de passe par "Se connecter avec Discord", et sert de
référence avant de s'y mettre. Rien ici n'est encore câblé dans le code.

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
comme ça. Discord documente explicitement ce cas d'usage dans son OAuth2 (native
apps / custom redirect scheme), donc rien d'exotique côté fournisseur non
plus.

**Alternative existante** : un petit serveur loopback local
(`http://127.0.0.1:<port>/callback`) au lieu d'un schéma custom — utilisé par
`tauri-plugin-oauth`. Certains fournisseurs (Google, historiquement) exigent
ce mode. Discord accepte le schéma custom, donc pas besoin de cette
complexité ici, mais à garder en tête si un jour on ajoute un autre
fournisseur OAuth plus strict.

## Flux complet pour Dofus-Dispo

1. L'app Tauri ouvre le navigateur système sur l'URL d'autorisation Discord :
   `https://discord.com/api/oauth2/authorize?client_id=...&redirect_uri=dofusin://auth/callback&response_type=code&scope=identify&state=<random>`.
2. L'utilisateur valide dans son navigateur (déjà connecté à Discord la
   plupart du temps → un clic).
3. Discord redirige le navigateur vers `dofusin://auth/callback?code=...&state=...`.
   L'OS reconnaît le schéma `dofusin://` (enregistré par l'app, cf. plus bas)
   et relance/réactive l'app Tauri au lieu d'essayer de charger une page.
4. Le plugin deep-link émet l'URL reçue côté JS ; l'app vérifie `state`
   (protection CSRF — doit correspondre à celui généré à l'étape 1) et extrait
   `code`.
5. L'app envoie `code` à **notre serveur Express** : `POST /api/auth/discord { code }`.
6. **C'est le serveur, jamais l'app desktop, qui parle à Discord avec le
   `client_secret`** : il échange `code` contre un access token
   (`POST discord.com/api/oauth2/token`), puis récupère l'identité
   (`GET discord.com/api/users/@me`).
7. Express retrouve/crée l'utilisateur local à partir de l'id Discord, émet
   sa propre session/JWT (même mécanisme qu'aujourd'hui), et la renvoie à
   l'app. Le reste ne change pas : `auth-store.ts`, `beforeLoad` guards,
   `AuthProvider` restent identiques, seule la façon d'obtenir la session
   change.

## Côté Tauri — ce qu'il faudrait ajouter

Package JS : `@tauri-apps/plugin-deep-link`. Crate Rust : `tauri-plugin-deep-link`.

**`src-tauri/Cargo.toml`** — ajouter la dépendance.

**`src-tauri/capabilities/default.json`** — ajouter `"deep-link:default"` aux
permissions (même fichier où vivent déjà `core:window:allow-close` etc., voir
CLAUDE.md § Custom title bar).

**`src-tauri/tauri.conf.json`** — déclarer le schéma :

```json
{
  "plugins": {
    "deep-link": {
      "desktop": { "schemes": ["dofusin"] }
    }
  }
}
```

**`src-tauri/src/lib.rs`** — enregistrer le plugin dans le `Builder` via
`tauri_plugin_deep_link::init()` puis `DeepLinkExt::register_all()` (Windows/
Linux : les schémas ne sont actifs qu'une fois l'app installée ; `register_all()`
en dev permet de tester sans installer).

**Côté JS** (probablement dans `AuthProvider` ou un hook dédié) :

```ts
import { onOpenUrl, getCurrent } from "@tauri-apps/plugin-deep-link"

// app relancée via le deep link
const startUrls = await getCurrent()

// app déjà ouverte, deep link reçu pendant que ça tourne
await onOpenUrl((urls) => { /* parser le code/state, appeler Express */ })
```

### Piège Windows/Linux : plugin single-instance

Sur Windows et Linux, activer un schéma custom **relance une nouvelle
instance** de l'app avec l'URL en argument CLI, au lieu d'émettre un
événement dans l'instance déjà ouverte (comportement de macOS). Si l'app
tourne déjà (cas normal : l'utilisateur clique "Autoriser" dans le
navigateur pendant que Dofus-Dispo est ouvert en arrière-plan), il faut le
plugin `tauri-plugin-single-instance` (feature `deep-link` activée) pour que
la 2ᵉ instance transmette l'URL à la 1ʳᵉ puis se ferme, au lieu d'ouvrir deux
fenêtres. À ajouter en même temps que le plugin deep-link, pas après coup.

## Côté Discord Developer Portal

- Créer une application sur https://discord.com/developers/applications.
- Onglet OAuth2 → ajouter `dofusin://auth/callback` comme Redirect URI.
- Récupérer `client_id` (peut vivre côté frontend, ce n'est pas un secret) et
  `client_secret` (va uniquement dans les variables d'env du serveur Express,
  jamais dans le repo ni dans le binaire Tauri).
- Scope minimal : `identify` (id, username, avatar). Ajouter `email` seulement
  si on en a un usage réel.

## Côté Express (cahier des charges)

Nouvelle route à documenter dans `project/cahier_charges.md` au même niveau
que les routes `auth` existantes : `POST /api/auth/discord`. Comportement :
échange le code, upsert un utilisateur par id Discord (remplace l'upsert par
pseudo/mot de passe), retourne la même forme de réponse que `POST /api/auth/login`
aujourd'hui (session/JWT + user). Si on supprime complètement pseudo/mot de
passe comme demandé, les routes `register`/`login` actuelles et les écrans
`login.tsx`/`register.tsx` correspondants disparaissent à terme — à faire une
fois le flux Discord validé de bout en bout, pas avant (garder l'ancien flux
en parallèle le temps de tester).

## Ce qui n'est pas encore décidé

- Où stocker l'avatar/pseudo Discord côté `User` (nouveau champ `discordId`,
  `avatarUrl` ?) — impacte `src/lib/types.ts`.
- Ce que devient `MockApiClient` : simuler un faux écran "Autoriser" sans
  vraie fenêtre Discord, ou basculer ce flux entièrement en stratégie `http`
  pour le tester (le deep link réel ne peut pas être mocké facilement côté
  navigateur `npm run dev`, seulement en `npm run tauri dev`).
- Gestion de l'échec/annulation (l'utilisateur ferme l'onglet du navigateur
  sans valider) côté UI.
