from ana7 import *
from cmp import toks
import difflib
oc=duckdb.connect('ovm.db',read_only=True)
GEN={"restaurant","cafe","kebab","doner","pizza","pizzeria","grill","halal","market","boucherie","butcher","shop","store","snack","fast","food","bistro","house","the","and","et","le","la"}
def nn(s): return " ".join(toks(s))
def nsim(a,b):
    x,y=nn(a),nn(b)
    if not x or not y: return 0
    return difflib.SequenceMatcher(None,x,y).ratio()
OV=collections.defaultdict(list)
for i,vn,id_,name,conf,w,ph,ad,cat,src,d in oc.execute("select * from m2").fetchall():
    OV[i].append(dict(id=id_,name=name,conf=conf,w=w,ph=ph,ad=ad,d=d,src=src))
def ovm(s,D,S,C):
    p=P[s]; c=[(nsim(p['n'],x['name']),x) for x in OV.get(s,[]) if x['d']<=D and (x['conf'] or 0)>=C]
    c=[(sm,x) for sm,x in c if sm>=S]
    if not c: return None
    c.sort(key=lambda t:(-t[0],t[1]['d']))
    if len(c)>1 and c[1][0]>=S and c[1][0]>c[0][0]-0.02 and c[1][1]['id']!=c[0][1]['id']: return "amb"
    return c[0][1]
if __name__=="__main__":
    import pickle
    have=[s for s in P if s in OV]
    print("venues with overture cands", len(have))
    for D,S,C in ((50,0.9,0.5),(50,0.9,0.7),(50,0.95,0.7),(80,0.9,0.7),(30,0.9,0.7),(50,0.8,0.7)):
        n=amb=0; st=sn=wn=wok=pn=pok=adn=0
        for s in have:
            r=ovm(s,D,S,C)
            if r is None: continue
            if r=="amb": amb+=1; continue
            n+=1; p=P[s]
            if 'a' in p and re.search(r"[^\W\d_]{3}",p['a']) and r['ad'] and r['ad'][0]['freeform']:
                ff=r['ad'][0]['freeform']; adn+=1
                # street ok if some split of freeform matches; number ok if OSM number token appears as a token in freeform
                w=p['a'].split(); osm_st=" ".join(w[:-1]) if len(w)>1 and w[-1][0].isdigit() else p['a']; osm_hn=w[-1] if len(w)>1 and w[-1][0].isdigit() else None
                ffs=re.sub(r"^\d[\w/-]*\s+|\s+\d[\w/-]*$","",ff.strip())
                ok=same_street(ffs,osm_st) or any(same_street(ffs,x) for x in re.split(r" - | / ",osm_st)); st+=ok
                sn+= ok and osm_hn is not None and norm(osm_hn) in [norm(t) for t in re.split(r"[\s,]+",ff)]
            if 'ph' in p and r['ph']:
                pn+=1; a=re.sub(r"\D","",p['ph'])[-9:]; pok+= any(re.sub(r"\D","",x)[-9:]==a for x in r['ph'])
            if 'w' in p and r['w']:
                wn+=1; h=lambda u: re.sub(r"^www\.","",re.sub(r"^https?://","",u.lower())).split("/")[0]; wok+= any(h(x)==h(p['w']) for x in r['w'])
        print(f"D<={D} sim>={S} conf>={C}: matched={n} amb={amb} | adresse n={adn} rue={st/max(adn,1)*100:.1f}% num={sn/max(st,1)*100:.1f}% | tel n={pn} {pok/max(pn,1)*100:.1f}% | site n={wn} {wok/max(wn,1)*100:.1f}%",flush=True)
