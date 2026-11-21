#!/usr/bin/env python3
"""RELÈVE DeepSeek de la session halal.shopping (build by Uxlab.ai).

Quand la session Claude ne travaille plus (quota atteint, absence), la file des tâches ne doit pas dormir :
toutes les 2 h, ce script prend la plus ancienne tâche ouverte du registre (porte, robot), demande un correctif
à DeepSeek, l'applique sur une copie de main et le pousse sur la branche « proposition ». La PORTE décide :
rien n'arrive en ligne sans test zéro vert, et un rouge en ligne est retiré automatiquement.

Règles :
- jamais en même temps que Claude : rien si un humain ou Claude a poussé sur main depuis moins de 2 h ;
- une tâche n'est tentée qu'UNE fois (règle de l'usine : une fiche n'échoue qu'une fois) ; un échec est marqué
  « à escalader » dans l'état de la relève, pour un moteur plus fort ou la session Claude ;
- plafond : 1 tâche par passage, 0,50 $ par jour ;
- la clé DeepSeek vient du secret DEEPSEEK_API_KEY du dépôt ; elle n'est jamais affichée.

Sortie : releve.json (état, publié sur la branche « releve ») ; code 0 toujours, sauf erreur de programme.
"""
import datetime, json, os, re, subprocess, sys, urllib.request

REG = "https://api.halal.shopping/_etat/registre.json"
API = "https://api.deepseek.com"
ETAT = os.environ.get("RELEVE_ETAT", "releve.json")
PLAFOND_JOUR_USD = 0.50
now = datetime.datetime.utcnow()
jour = now.strftime("%Y-%m-%d")


def sh(*a):
    return subprocess.run(a, capture_output=True, text=True).stdout.strip()


def http(url, data=None, key=None, timeout=60):
    h = {"Content-Type": "application/json", "User-Agent": "halal-shopping-releve"}
    if key:
        h["Authorization"] = "Bearer " + key
    req = urllib.request.Request(url, data=json.dumps(data).encode() if data is not None else None, headers=h)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def charger():
    try:
        return json.load(open(ETAT))
    except Exception:
        return {"tentatives": {}, "depense": {}, "journal": []}


def sauver(e, msg):
    e["journal"] = (e.get("journal", []) + [f"{now.isoformat(timespec='seconds')}Z {msg}"])[-200:]
    json.dump(e, open(ETAT, "w"), ensure_ascii=False, indent=1)
    print(msg)


def main():
    e = charger()
    key = os.environ.get("DEEPSEEK_API_KEY", "")
    if not key:
        return sauver(e, "relève non armée : secret DEEPSEEK_API_KEY absent du dépôt")
    # Claude ou un humain travaille-t-il ? (dernier envoi sur main qui n'est pas un robot)
    last = sh("git", "log", "origin/main", "-1", "--format=%ct",
              "--perl-regexp", "--author=^(?!.*(bot|porte|releve)).*$")
    if last and (now.timestamp() - int(last)) < 2 * 3600:
        return sauver(e, "relève en veille : la session travaille (envoi sur main il y a moins de 2 h)")
    if e["depense"].get(jour, 0) >= PLAFOND_JOUR_USD:
        return sauver(e, f"relève en pause : plafond du jour atteint ({e['depense'][jour]:.3f} $)")
    reg = http(REG)
    ouvertes = [t for t in reg.get("taches", []) if t["etat"] == "ouverte" and t["source"] in ("robot", "porte-site", "porte-serveur")]
    a_faire = [t for t in ouvertes if t["cle"] not in e["tentatives"]]
    if not a_faire:
        return sauver(e, f"rien à faire : {len(ouvertes)} tâche(s) ouverte(s), toutes déjà tentées")
    t = sorted(a_faire, key=lambda x: x["ouverte"])[0]
    site = open("index.html", encoding="utf-8").read()
    modeles = [m["id"] for m in http(API + "/models", key=key).get("data", [])]
    modele = next((m for m in modeles if "flash" in m), "deepseek-chat" if "deepseek-chat" in modeles else modeles[0])
    consigne = (
        "Tu corriges le site halal.shopping (un seul fichier index.html, HTML + CSS + JavaScript sans dépendance de build).\n"
        "Tâche ouverte automatiquement par le robot de test (lecture seule, téléphone, 4G) :\n"
        f"TITRE : {t['titre']}\nDÉTAIL : {t.get('detail', '')}\n\n"
        "Réponds UNIQUEMENT par un ou plusieurs blocs exacts de la forme :\n"
        "<<<<<<< CHERCHER\n(texte copié à l'identique depuis index.html, unique dans le fichier)\n=======\n(remplacement)\n>>>>>>> REMPLACER\n"
        "Change le moins possible. Ne casse aucune fonction existante. Si la tâche est un faux positif du robot ou si tu "
        "n'es pas sûr, réponds seulement : AUCUN CHANGEMENT : <raison en une phrase>.\n\n"
        "index.html :\n" + site)
    r = http(API + "/chat/completions", {"model": modele, "temperature": 0, "max_tokens": 4000,
                                          "messages": [{"role": "user", "content": consigne}]}, key=key, timeout=300)
    u = r.get("usage", {})
    cout = (u.get("prompt_tokens", 0) * 0.27 + u.get("completion_tokens", 0) * 1.10) / 1e6  # borne haute, tarif plein
    e["depense"][jour] = round(e["depense"].get(jour, 0) + cout, 4)
    rep = r["choices"][0]["message"]["content"]
    tent = {"quand": now.isoformat(timespec="seconds") + "Z", "titre": t["titre"][:160], "modele": modele, "cout_usd": round(cout, 4)}
    e["tentatives"][t["cle"]] = tent
    if rep.strip().startswith("AUCUN CHANGEMENT"):
        tent["resultat"] = "à escalader : " + rep.strip()[:300]
        return sauver(e, f"{t['cle']} : DeepSeek ne propose rien ({rep.strip()[:120]})")
    blocs = re.findall(r"<<<<<<< CHERCHER\n(.*?)\n=======\n(.*?)\n>>>>>>> REMPLACER", rep, re.S)
    nouveau = site
    for a, b in blocs:
        if nouveau.count(a) != 1:
            tent["resultat"] = "à escalader : bloc introuvable ou non unique"
            return sauver(e, f"{t['cle']} : correctif inapplicable (bloc introuvable ou ambigu)")
        nouveau = nouveau.replace(a, b)
    if not blocs or nouveau == site:
        tent["resultat"] = "à escalader : réponse sans bloc exploitable"
        return sauver(e, f"{t['cle']} : réponse sans bloc exploitable")
    open("index.html", "w", encoding="utf-8").write(nouveau)
    tent["resultat"] = "poussé sur proposition, jugé par la porte"
    tent["blocs"] = len(blocs)
    with open(os.environ.get("GITHUB_OUTPUT", "/dev/null"), "a") as o:
        o.write("pousser=1\n")
        o.write("message=Relève DeepSeek : " + t["titre"][:120].replace("\n", " ") + "\n")
    return sauver(e, f"{t['cle']} : {len(blocs)} bloc(s) appliqué(s), envoi à la porte ({cout:.4f} $)")


if __name__ == "__main__":
    main()
