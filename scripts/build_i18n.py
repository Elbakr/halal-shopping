"""Write i18n/<code>.json from scripts/i18n_src.py. Run after editing translations."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from i18n_src import L, ADD_KEYS
from i18n_extra import KEYS, X, KEYS2, X2, KEYS3, X3, KEYS4, X4, KEYS5, X5
for _c in L: L[_c].update(dict(zip(KEYS5, X5[_c])))
for _c in L: L[_c].update(dict(zip(KEYS4, X4[_c])))
for _c in L: L[_c].update(dict(zip(KEYS3, X3[_c])))
for _c in L: L[_c].update(dict(zip(KEYS, X[_c]))); L[_c].update(dict(zip(KEYS2, X2[_c])))
REQ = ["byname","h1","sub","camera","check","photo","placeholder","t1","t2","t3","loading","notfound","offline","nocam","nobar","camhint",
       "s_ok","s_bad","s_conflict","s_check","s_none","s_empty","e_ok","e_bad","e_conflict","e_check","e_none","e_empty",
       "label","share","copied","source","add","shelvesT","shelvesL","empty","trapsT","trapsL","allAdd","howT","s1","s1p","s2","s2p","s3","s3p","legal","data"]
os.makedirs("i18n", exist_ok=True)
for code, d in L.items():
    miss = [k for k in REQ if not d.get(k)] + [k for k in ADD_KEYS if k not in d["adds"]] + [k for k in ["pork","alcohol","gelatin","rennet","aroma"] if k not in d["words"]]
    if miss: raise SystemExit(f"{code}: missing {miss}")
    json.dump(d, open(f"i18n/{code}.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print(code, "ok")
