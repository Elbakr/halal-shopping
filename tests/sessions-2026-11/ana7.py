from ana5 import *
from cmp import same_street, split_addr
def ok_street(names, a):
    w=a.split(); sts=[a]
    if len(w)>1 and w[-1][0].isdigit(): sts.append(" ".join(w[:-1]))
    if len(w)>2 and w[-2][0].isdigit(): sts.append(" ".join(w[:-2]))
    sts+= [p for x in list(sts) for p in re.split(r" - | / ",x)]
    return any(same_street(n,x) for n in names for x in sts)
def num_ok(hn,a):
    w=a.split(); return bool(w) and norm(w[-1])==norm(hn or "")
def R(pool,fn,label,names=lambda r:r.get('names') or [r['st']]):
    n=ok=h=amb=0
    for s in pool:
        r=fn(s)
        if r is None: continue
        if r=="amb": amb+=1; continue
        n+=1; a=ok_street(names(r),P[s]['a']); ok+=a; h+= a and num_ok(r.get('hn'),P[s]['a'])
    print(f"{label}: n={n} rue={ok/max(n,1)*100:.1f}% num={h/max(ok,1)*100:.1f}% amb={amb}",flush=True); return n,ok
if __name__=="__main__":
    R(qc,osm_building,"OSM bâtiment englobant (brut)")
    for r_ in (0,10,20): R(qc,lambda s:b_nocorner(s,r_) if r_ else osm_building(s),f"OSM bâtiment + pas d'autre rue <= {r_}m")
    for D in (3,5,10,20): R(qc,lambda s:node_nocorner(s,D,max(D,20)),f"OSM adresse <= {D}m + pas d'autre rue <= {max(D,20)}m")
    for D in (20,30,50): R(qc,lambda s:street(s,D),f"OSM rue la plus proche <= {D}m")
    for D in (5,10,20,30): R(fq,lambda s:ban(s,D),f"BAN numéro <= {D}m")
    for D in (5,10,20): R(bq,lambda s:best(s,D,max(D,15)),f"BeST <= {D}m, pas d'autre rue <= {max(D,15)}m")
