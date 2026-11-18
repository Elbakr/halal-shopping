# Scripts de test et d'analyse — sessions du 10 au 11/11/2026

Copiés depuis le dossier temporaire de la session cloud « halal.shopping » le 18/11/2026, pour ne pas les perdre.

- `t*.js`, `ui*.js`, `scan*.js`, `vid*.js`, `proof*.js` : parcours Playwright (iPhone 13) du site — recherche, fiches, glisser, réservation, organismes, certifiés, position GPS, vidéos.
  Ils supposent un PocketBase local de même version sur 127.0.0.1:8099 (hooks et migrations de `server/`) et `python3 -m http.server 8765` à la racine du dépôt ; l'API de production est interceptée et renvoyée vers le banc local. Ne jamais lancer un test qui écrit contre la production.
- `c*.js` : parcours d'inscription coif.me observés de l'extérieur (lecture seule, sauf c4.js qui demande un code SMS au numéro donné).
- `ana*.py`, `best.py`, `cmp.py` : analyses des données OpenStreetMap utilisées pour l'annuaire.
- Les chemins vers le dossier temporaire et le fichier du jeton admin sont à adapter ; le jeton n'est jamais dans ces fichiers.

build by Uxlab.ai
