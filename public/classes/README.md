# Icônes de classe

Dépose ici un PNG par classe de `CLASSES` (`src/lib/game-data.ts`). Le nom de
fichier attendu est le nom de la classe en minuscules, sans accents ni
espaces (voir `slugify()` dans `game-data.ts`) :

- `cra.png`
- `ecaflip.png`
- `eliotrope.png`
- `eniripsa.png`
- `enutrof.png`
- `feca.png`
- `forgelance.png`
- `huppermage.png`
- `iop.png`
- `osamodas.png`
- `ouginak.png`
- `pandawa.png`
- `roublard.png`
- `sacrieur.png`
- `sadida.png`
- `sram.png`
- `steamer.png`
- `xelor.png`
- `zobal.png`

Si une nouvelle classe est ajoutée à `CLASSES`, dépose simplement le PNG
correspondant ici — aucun changement de code n'est nécessaire, `classIcon()`
calcule le chemin automatiquement.

Format recommandé : carré, fond transparent, ~64×64px (affiché en ~16px, la
haute résolution évite le flou sur les écrans HiDPI).
