<p align="center">
  <img src="public/assets/lockup.svg" alt="DofusIn" width="220" />
</p>

<p align="center">
  L'outil communautaire d'entraide entre joueurs Dofus.
  <br />
  <a href="https://dofusin.fr">dofusin.fr</a>
</p>

---

**DofusIn** est une application de bureau (Windows) qui permet de marquer un
de ses personnages comme "disponible pour dépanner" le temps d'une journée
(ouverture de Kralamour, quête d'alignement, craft…), et de retrouver en un
clin d'œil qui est disponible chez les autres joueurs. Gratuit, sans
publicité, projet fan-made non affilié à Ankama.

## Fonctionnalités

- **Connexion Discord** — pas de mot de passe, juste un compte Discord.
- **Personnages & métiers** — plusieurs personnages par serveur, niveaux de
  métier partagés entre eux (Bûcheron, Forgemage, etc.).
- **Disponibilité** — activez un personnage ou un métier pour la journée,
  gratuitement ou contre rémunération.
- **Recherche** — filtrez par serveur, classe/métier et niveau minimum, puis
  copiez un message de chuchotement prêt à coller en jeu.
- **Entraide en direct** — envoyez une demande d'aide, tous les joueurs
  disponibles qui correspondent sont notifiés en temps réel (WebSocket),
  même en arrière-plan.
- **XP & classement** — chaque aide acceptée puis validée rapporte de l'XP,
  visible sur un profil et un classement général.
- **Intégration système** — barre de titre personnalisée, minimisation dans
  la zone de notification, fermeture avec confirmation.

Un tour guidé en images est disponible sur [dofusin.fr/tuto-installation](https://dofusin.fr/tuto-installation).

## Stack technique

- [React 19](https://react.dev/) + TypeScript, [Vite](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) (style `base-rhea`, sur [Base UI](https://base-ui.com/))
- [TanStack Router](https://tanstack.com/router) (routing par fichiers)
- [Tauri 2](https://v2.tauri.app/) pour le shell desktop

## Développement

```bash
npm install
npm run dev          # serveur Vite (web only)
npm run tauri dev    # shell desktop complet
```

Par défaut l'app tourne en mode "mock" (données fictives, aucun backend
requis). Voir `.env.example` pour brancher une vraie API.

```bash
npm run typecheck
npm run lint
npm run build         # web
npm run tauri build   # installeur desktop
```

## Projets liés

- [dofusin-nextjs](https://github.com/lorenzo-237/dofusin-nextjs) — site
  vitrine et téléchargement ([dofusin.fr](https://dofusin.fr))

## Licence

[GPL-3.0](./LICENSE)
