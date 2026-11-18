#!/usr/bin/env python3
"""REGISTRE — la file qui se remplit seule (build by Uxlab.ai).

Chaque rouge (porte du serveur, porte du site, robot de nuit, mesure de valeur) devient une tâche de correction.
Une tâche se ferme seule quand sa source redevient verte ; elle se rouvre (même numéro) si le rouge revient.

  registre.py <source> <rouges.json>        rouges.json : [{"cle": ..., "titre": ..., "detail": ...}, ...]
      remplace l'état de cette source : les tâches ouvertes absentes de la liste sont fermées.
  registre.py --depuis-porte <source> <porte.json> [contexte]   (verdict de porte.js)
  registre.py --depuis-robot <rapport.json>                     (rapport du robot universel)

Publié en lecture à https://api.halal.shopping/_etat/registre.json (aucun secret, aucune donnée de visiteur).
"""
import json, os, re, sys, time, fcntl

ETAT = os.environ.get("ETAT", "/var/www/status/etat")
F = os.path.join(ETAT, "registre.json")
now = lambda: time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def charger():
    try:
        return json.load(open(F, encoding="utf-8"))
    except Exception:
        return {"note": "Tâches de correction ouvertes automatiquement par la porte, le robot et la mesure de valeur.", "taches": []}


def appliquer(source, rouges):
    os.makedirs(ETAT, exist_ok=True)
    with open(F + ".lock", "w") as lk:
        fcntl.flock(lk, fcntl.LOCK_EX)
        R = charger()
        T = R["taches"]
        par_cle = {t["cle"]: t for t in T if t["source"] == source}
        vus, ouvertes, fermees = set(), 0, 0
        for r in rouges:
            k = r["cle"]
            vus.add(k)
            t = par_cle.get(k)
            if not t:
                t = {"id": "R%04d" % (len(T) + 1), "source": source, "cle": k, "etat": "ouverte", "ouverte": now(), "fermee": None, "vue": 0}
                T.append(t)
                par_cle[k] = t
                ouvertes += 1
            elif t["etat"] != "ouverte":
                t.update(etat="ouverte", rouverte=now(), fermee=None)
                ouvertes += 1
            t.update(titre=r.get("titre", k)[:200], detail=r.get("detail", "")[:600], derniere=now(), vue=t.get("vue", 0) + 1)
        for k, t in par_cle.items():
            if t["etat"] == "ouverte" and k not in vus:
                t.update(etat="fermée", fermee=now(), raison="redevenu vert")
                fermees += 1
        R["mis_a_jour"] = now()
        R["ouvertes"] = sum(1 for t in T if t["etat"] == "ouverte")
        tmp = F + ".tmp"
        json.dump(R, open(tmp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        os.replace(tmp, F)
    print(f"registre {source} : {len(rouges)} rouge(s), {ouvertes} tâche(s) ouverte(s), {fermees} fermée(s), {R['ouvertes']} ouverte(s) au total")


def depuis_porte(source, f, ctx=""):
    try:
        v = json.load(open(f, encoding="utf-8"))
    except Exception:
        v = {"verdict": "ROUGE", "nouveaux": [{"cle": "porte|illisible", "note": "verdict illisible"}]}
    if v.get("verdict") == "NON VALABLE":
        return  # serveur malade avant le test : ni vert ni rouge, on ne touche à rien
    out = []
    for n in v.get("nouveaux", []):
        out.append({"cle": n["cle"], "titre": f"{ctx} : écran rouge {n['cle']}".strip(" :"),
                    "detail": "; ".join([n.get("note") or ""] + (n.get("erreurs") or [])[:2] + (n.get("echecs") or [])[:2])})
    if v.get("raison") and not out:
        out.append({"cle": "porte|" + v["raison"][:40], "titre": f"{ctx} : {v['raison']}", "detail": v.get("detail", "")})
    appliquer(source, out)


def depuis_robot(f):
    try:
        r = json.load(open(f, encoding="utf-8"))
    except Exception:
        return appliquer("robot", [{"cle": "robot|sans-rapport", "titre": "Robot de nuit : pas de rapport", "detail": f}])
    if not r.get("valable", True):
        return appliquer("robot", [{"cle": "robot|serveur-malade", "titre": "Robot de nuit non lancé : site malade au contrôle de santé",
                                    "detail": json.dumps(r.get("sante"), ensure_ascii=False)}])
    out = []
    for e in r.get("rouges", []):
        for p in e["problemes"]:
            genre = re.sub(r"\d+", "#", p.split(":")[0])[:60]
            out.append({"cle": f"robot|{e['url']}|{genre}", "titre": f"Robot de nuit : {e['url']} — {p[:120]}", "detail": p})
    appliquer("robot", out)


if __name__ == "__main__":
    a = sys.argv[1:]
    if a[0] == "--depuis-porte":
        depuis_porte(a[1], a[2], a[3] if len(a) > 3 else "")
    elif a[0] == "--depuis-robot":
        depuis_robot(a[1])
    else:
        appliquer(a[0], json.load(open(a[1], encoding="utf-8")))
