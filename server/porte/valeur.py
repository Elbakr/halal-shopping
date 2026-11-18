#!/usr/bin/env python3
"""VALEUR — chaque jour, la veille est comparée à la moyenne des 7 jours qui la précèdent (build by Uxlab.ai).

Si les visiteurs (ou les recherches) tombent sous 50 % de cette moyenne, les déploiements de ce jour-là
(serveur et site) sont désignés pour retour : une tâche s'ouvre dans le registre avec la liste des versions.
Les chiffres restent privés (/opt/hs/etat/audience.json) ; seule la désignation va au registre.
Lancé par deploy.sh une fois par jour, après le passage de nuit de l'audience (00:20 UTC).
"""
import datetime, json, os, subprocess, sys, urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import registre

PRIVE = "/opt/hs/etat"
os.makedirs(PRIVE, exist_ok=True)
j = json.load(urllib.request.urlopen("http://127.0.0.1:8090/api/hs/audience", timeout=20))
json.dump(j, open(os.path.join(PRIVE, "audience.json"), "w"), ensure_ascii=False, indent=1)
jours = {d["day"]: d for d in j.get("jours", [])}
D = (datetime.datetime.utcnow().date() - datetime.timedelta(days=1))
prev = [jours.get(str(D - datetime.timedelta(days=i))) for i in range(1, 8)]
hier = jours.get(str(D))
out = []
if hier and all(prev):
    for m, nom in (("visiteurs", "visiteurs"), ("recherches", "recherches")):
        moy = sum(p[m] for p in prev) / 7
        if moy >= 5 and hier[m] < 0.5 * moy:  # en dessous de 5 par jour, le bruit domine : pas de verdict
            srv = []
            try:
                for l in open(os.path.join(PRIVE, "deploiements.log"), encoding="utf-8"):
                    if l.startswith(str(D)):
                        srv.append(l.strip())
            except FileNotFoundError:
                pass
            site = subprocess.run(["git", "-C", "/opt/hs/repo", "log", "origin/main", f"--since={D}T00:00:00Z", f"--until={D + datetime.timedelta(days=1)}T00:00:00Z",
                                   "--format=%h %an %s"], capture_output=True, text=True).stdout.splitlines()
            site = [s for s in site if "bot" not in s.split(" ")[1].lower() and "Rayons" not in s and "Lieux" not in s]
            liste = ["serveur " + s for s in srv] + ["site " + s for s in site]
            out.append({"cle": f"valeur|{D}|{m}",
                        "titre": f"Valeur : {nom} du {D} = {hier[m]}, sous 50 % de la moyenne des 7 jours ({moy:.0f}) — "
                                 + ("déploiement(s) du jour désigné(s) pour retour" if liste else "aucun déploiement ce jour-là : cause extérieure probable"),
                        "detail": " | ".join(liste)[:600]})
    registre.appliquer("valeur", out)
else:
    print(f"valeur : pas encore 8 jours de mesure ({len(jours)} jour(s)) — pas de verdict")
