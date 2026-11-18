# Les 4 pièces de l'autonomie — halal.shopping (build by Uxlab.ai)

1. **PORTE** — rien n'est appliqué sans passer le test zéro (`tests/zero/`, 2 téléphones, 4G ralentie, lecture seule).
   - Site : pousser sur la branche `proposition` (jamais directement sur `main`). `.github/workflows/porte.yml` teste la
     version proposée (AVANT) ; rouge = refusée, `main` intacte. Vert = fusion, mise en ligne, test sur halal.shopping
     (APRÈS) ; rouge = retour automatique. Un envoi direct sur `main` passe quand même par APRÈS.
   - Serveur : `server/deploy.sh` (toutes les 3 min) lance `porte-serveur.sh avant` sur un PocketBase d'essai
     (copie de la base, clés effacées), puis applique, puis `porte-serveur.sh apres` ; rouge = retour automatique.
   - Cliquet : seuls les rouges NOUVEAUX ferment la porte ; un rouge connu guéri sort de la liste et ne peut plus revenir
     (`tests/zero/rouges-connus.json` pour le site, `/opt/hs/etat/rouges-connus-serveur.json` pour le serveur).
   - Un rouge doit apparaître sur deux passages de suite ; un serveur malade AVANT le test = « non valable », rien n'est jugé.
   - Essai à blanc : pousser une version sur la branche `essai-serveur` ; la porte la juge, rien n'est jamais appliqué.
     Verdict : https://api.halal.shopping/_etat/porte-essai.txt
2. **ROBOT UNIVERSEL** — `server/robot/` chaque nuit à 04:17 UTC (hs-robot.timer), après la génération des lieux,
   utilisateur sans droits `hsrobot`, toute écriture bloquée, contrôle de santé avant de partir.
   Rapport : https://api.halal.shopping/_etat/robot/dernier/rapport.json — relance : changer `server/robot-run`.
3. **FILE QUI SE REMPLIT SEULE** — `registre.py` : chaque rouge (porte serveur, porte site, robot, valeur) ouvre une tâche,
   qui se ferme seule au retour du vert. https://api.halal.shopping/_etat/registre.json
4. **VALEUR** — audience sans cookie ni stockage navigateur (`server/pb_hooks/hs_aud.js`) : visiteurs, recherches,
   contributions par jour, robots exclus. `valeur.py` : un jour sous 50 % de la moyenne des 7 jours précédents désigne
   les déploiements de ce jour pour retour (tâche au registre). Chiffres : `/api/hs/audience?device=<clé admin>`.

État de tout cela en une page : https://api.halal.shopping/_status.txt
