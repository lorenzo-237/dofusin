# Comment fonctionnent les notifications — guide pas à pas

Ce doc explique, en partant de zéro, comment DofusIn prévient l'utilisateur
qu'il se passe quelque chose (nouvelle demande d'aide, demande acceptée,
aide validée/contestée) — que ce soit sous forme d'un petit message dans
l'app, ou d'une fenêtre qui apparaît même quand l'app est réduite.

Statut : **implémenté et testé** (toasts + fenêtre popup ; la notification
OS native de Windows a été essayée puis abandonnée, voir plus bas pourquoi).

## Le problème de départ

Le système "recherche intelligente" (`HelpRequest`, voir `docs/help-requests.md`
côté `dofusin-api`) fait vivre des évènements en direct via WebSocket : "quelqu'un
a besoin d'aide", "ta demande a été acceptée", etc. (`src/lib/ws-client.ts`
reçoit ça, `AuthProvider` dans `src/context/auth-context.tsx` l'écoute).

Recevoir la donnée ne suffit pas — il faut aussi le **montrer** à
l'utilisateur. Deux cas très différents :

1. **L'app est ouverte et visible** → un petit message discret dans l'app
   suffit (ce qu'on appelle un "toast").
2. **L'app est réduite / en arrière-plan** → il faut quelque chose de visible
   *même sans regarder l'app*, comme le font Discord ou un jeu quand on
   reçoit un message.

## Vue d'ensemble du pipeline

```
Événement WebSocket (ex: "help-request:incoming")
        │
        ▼
AuthProvider — le listener onWsEvent (auth-context.tsx)
        │
        ├─► toujours : toast.info(...) / toast.success(...)  (sonner)
        │
        └─► si la fenêtre principale n'a PAS le focus :
                showNotificationPopup(titre, message)
                        │
                        ▼
                Nouvelle fenêtre Tauri (notification-window.ts)
                        │
                        ▼
                Affiche public/notification.html
                (positionnée en bas à droite de l'écran)
```

Tout part du **même endroit** : le `useEffect` avec `onWsEvent(...)` dans
`src/context/auth-context.tsx`. C'est volontaire — peu importe l'écran que
l'utilisateur regarde dans l'app, la notification se déclenche pareil,
puisqu'elle ne dépend d'aucun composant de route.

## Étape 1 — le toast (message dans l'app)

C'est le plus simple : la librairie [`sonner`](https://sonner.emilkowal.ski/)
est déjà utilisée partout dans l'app (ex. "Message copié !" dans
`copy-command-button.tsx`). Le `<Toaster />` est monté une fois pour toute
dans `src/routes/__root.tsx`, donc n'importe quel fichier peut juste faire
`toast.success("...")` et un petit message apparaît en bas de l'écran.

Dans `auth-context.tsx`, chaque type d'événement WS a son message :

```ts
case "help-request:incoming":
  toast.info(`Nouvelle demande d'aide : ${target}`)
  break
case "help-request:accepted":
  toast.success("Quelqu'un a accepté ta demande !")
  break
```

Limite du toast : il ne s'affiche que **dans** la fenêtre de l'app. Si l'app
est réduite ou cachée derrière une autre fenêtre, personne ne le voit.

## Étape 2 — pourquoi pas simplement la notification native de Windows ?

La première version utilisait `tauri-plugin-notification`, le plugin
officiel qui déclenche une vraie notification "Windows" (celle qui apparaît
dans le coin de l'écran et dans le centre de notifications). Ça marche...
mais avec un piège découvert en testant : **en développement (`npm run
tauri dev`), la notification s'affichait sous le nom "Windows PowerShell"**
au lieu de "DofusIn".

### Pourquoi ça arrive

Windows a besoin de savoir *quelle application* envoie une notification pour
afficher le bon nom et la bonne icône. Cette identité s'appelle un
**AppUserModelID (AUMID)**. Un AUMID n'existe que si l'app a été **installée
correctement** (le raccourci créé dans le menu Démarrer par l'installeur
NSIS/MSI de Tauri enregistre cet AUMID). Pendant le développement, l'app
tourne directement depuis un terminal sans jamais passer par cette
installation — Windows retombe alors sur l'identité du terminal qui a lancé
le process (`PowerShell`), faute de mieux.

C'est documenté par le plugin lui-même
([v2.tauri.app/plugin/notification](https://v2.tauri.app/plugin/notification/)) :
*"Only works for installed apps. Shows powershell name & icon in
development."* Autrement dit : ça aurait fini par afficher "DofusIn"
correctement une fois l'app réellement installée via `npm run tauri build`
— mais ça reste invérifiable tant qu'on ne teste qu'en dev, et ça ne
ressemble pas à ce que font les jeux (popup entièrement stylée à leurs
couleurs, jamais un encart générique de l'OS).

## Étape 3 — la solution retenue : une fenêtre popup maison

Plutôt que de dépendre du système de notification de Windows, DofusIn ouvre
**sa propre petite fenêtre** — exactement le principe utilisé par Discord ou
la plupart des jeux pour leurs popups "vous avez reçu...". Avantages : le
style est 100% custom (couleurs/logo DofusIn), et ça marche pareil qu'on
soit en dev ou installé, sans dépendre d'un AUMID.

### C'est quoi "une fenêtre" pour Tauri ?

Tauri est un framework qui permet d'empaqueter une app web (React ici) dans
une vraie application desktop. La fenêtre principale de DofusIn (celle avec
la barre de titre custom, 430×900) est *une* fenêtre Tauri parmi
potentiellement plusieurs — Tauri permet d'en ouvrir d'autres à la volée,
chacune avec sa propre taille, position, et son propre contenu HTML.

C'est exactement ce qu'on fait ici : à chaque notification (si la fenêtre
principale n'est pas au premier plan), on crée une **deuxième petite
fenêtre**, sans bordures ni barre de titre, "toujours au-dessus" des autres
fenêtres, absente de la barre des tâches — bref, une popup, pas une vraie
fenêtre d'application.

### Le code, étape par étape

**`src/lib/notification-window.ts`** — la fonction `showNotificationPopup(titre, message)` :

1. Si on n'est pas dans Tauri (ex. `npm run dev` dans un simple onglet
   navigateur), on ne fait rien — pas de fenêtres possibles hors Tauri.
2. Elle vérifie si la fenêtre principale a le focus
   (`getCurrentWindow().isFocused()`) — si oui, le toast de l'étape 1
   suffit déjà, pas la peine d'en rajouter.
3. Elle ferme une éventuelle popup précédente encore ouverte (pour ne
   jamais en empiler plusieurs si deux notifications arrivent vite).
4. Elle demande à Tauri la taille de l'écran principal
   (`primaryMonitor()`) pour calculer une position en bas à droite.
5. Elle crée la fenêtre avec `new WebviewWindow(...)`, en pointant son
   contenu vers `public/notification.html?title=...&body=...` (le
   titre/message passés directement dans l'URL, le plus simple pour
   transmettre du texte à une fenêtre qui vient d'être créée).

```ts
new WebviewWindow(POPUP_LABEL, {
  url: `/notification.html?${params.toString()}`,
  width: POPUP_WIDTH,
  height: POPUP_HEIGHT,
  x, y,                    // calculés à partir de la taille de l'écran
  decorations: false,      // pas de barre de titre système
  alwaysOnTop: true,       // reste visible par-dessus les autres fenêtres
  skipTaskbar: true,       // invisible dans la barre des tâches
  resizable: false,
  focus: false,            // n'interrompt pas ce que fait l'utilisateur
  shadow: true,
})
```

### Pourquoi une page HTML statique, pas une route de l'app

Le reste de DofusIn est une "SPA" (Single Page Application) : une seule page
HTML (`index.html`) dans laquelle React affiche différents écrans selon
l'URL (`/`, `/login`, `/characters`...), tous gérés par un routeur
(TanStack Router). On aurait pu ajouter une route `/notification-popup` à
ce routeur pour la popup — mais ce routeur est monté sous `__root.tsx`, qui
démarre *tout* : la connexion, le chargement des personnages, la connexion
WebSocket... Ouvrir une deuxième fenêtre sur cette même app aurait donc
relancé une deuxième fois toute cette mécanique, juste pour afficher deux
lignes de texte — inutilement lourd et risqué (deux connexions WebSocket au
lieu d'une, par exemple).

À la place, `public/notification.html` est un fichier **HTML/CSS/JS tout
simple**, sans React, sans build, indépendant du reste de l'app. Il ne fait
que :
- lire le `title`/`body` dans l'URL et les afficher,
- fermer la fenêtre tout seul après 6 secondes,
- si on clique dessus, remettre la fenêtre principale au premier plan puis
  se fermer.

Comme ce fichier n'est pas "compilé" par Vite (il est juste copié tel quel
dans le dossier final, comme n'importe quel fichier dans `public/`), il ne
peut pas faire `import { ... } from "@tauri-apps/api/window"` comme le reste
du code TypeScript — ces imports ont besoin d'un bundler pour être résolus.
La solution : `src-tauri/tauri.conf.json` active
`app.withGlobalTauri: true`, qui expose automatiquement toutes les
fonctions Tauri sur une variable globale `window.__TAURI__`, utilisable
directement dans du JavaScript classique sans aucun `import` :

```js
var tauriWindow = window.__TAURI__.window
tauriWindow.getCurrentWindow().close()
```

## Étape 4 — les permissions ("capabilities")

Par sécurité, Tauri ne laisse pas le code web faire n'importe quoi avec le
système (fermer une fenêtre, en créer une nouvelle, etc.) sans autorisation
explicite. Ces autorisations sont listées dans
`src-tauri/capabilities/default.json`, sous la forme de chaînes comme
`"core:window:allow-close"`. Pour la popup, il a fallu en ajouter plusieurs
au fichier existant :

- `core:webview:allow-create-webview-window` — le droit de créer une
  nouvelle fenêtre depuis le JS (sans ça, `new WebviewWindow(...)`
  échouerait silencieusement).
- `core:window:allow-primary-monitor` — le droit de demander la taille de
  l'écran (pour positionner la popup).
- `core:window:allow-show` / `allow-set-focus` / `allow-unminimize` — le
  droit, au clic sur la popup, de rappeler la fenêtre principale au premier
  plan.

Et `"notification-popup"` (le nom/label choisi pour cette fenêtre popup) a
été ajouté à la liste des fenêtres couvertes par ce fichier de permissions,
à côté de `"main"`.

## Comment tester

Deux choses à vérifier, qui nécessitent une vraie fenêtre Tauri (pas
possible dans le navigateur ni juste avec `npm run dev`) :

1. **Toast** : garder l'app au premier plan, déclencher un événement (ex.
   accepter une demande depuis un deuxième compte, voir plus haut la
   discussion sur le test à deux comptes Discord) → un message doit
   apparaître en bas de l'app.
2. **Popup** : réduire la fenêtre DofusIn ou passer sur une autre
   application, puis déclencher le même événement → une petite fenêtre doit
   apparaître en bas à droite de l'écran, se fermer après ~6 secondes, et
   ramener DofusIn au premier plan si on clique dessus avant.

## Petit glossaire Tauri

- **Webview / fenêtre (window)** — une fenêtre desktop qui affiche du
  contenu web (HTML/CSS/JS). DofusIn en a une par défaut (`"main"`) et peut
  en créer d'autres à la volée, comme la popup de ce doc.
- **Capability / permission** — dans Tauri 2, le code web n'a accès à rien
  côté système (fichiers, fenêtres, notifications...) sans autorisation
  explicite listée dans un fichier de capabilities. C'est un modèle de
  sécurité : même si du code malveillant s'exécutait dans la webview, il ne
  pourrait pas faire plus que ce qui est explicitement permis.
- **`withGlobalTauri`** — option qui expose l'API Tauri sur
  `window.__TAURI__`, pour du JS qui n'est pas passé par le bundler (utile
  seulement pour des pages "à part" comme `notification.html`).
- **AUMID (AppUserModelID)** — l'identité qu'utilise Windows pour savoir
  quelle app envoie une notification, un raccourci, etc. Seulement
  enregistrée correctement une fois l'app installée, pas en dev — la
  raison pour laquelle la notification native de Windows montrait
  "Windows PowerShell" pendant les tests (voir étape 2).
