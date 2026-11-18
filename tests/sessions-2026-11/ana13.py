from ana7 import *
def nearest_st(s,D=30):
    c=[x for x in STR.get(s,[]) if x['d']<=D]; return min(c,key=lambda x:x['d'])['st'] if c else None
def ban_osm(s,D):
    r=ban(s,D)
    if not r: return None
    ns=nearest_st(s)
    return r if ns and same_street(r['st'],ns) else "amb"
for D in (10,20,30): R(fq,lambda s:ban_osm(s,D),f"BAN <= {D}m + même rue que la rue OSM la plus proche")
# postcodes
def zc(pool,fn,label):
    n=ok=0
    for s in pool:
        if 'z' not in P[s]: continue
        r=fn(s)
        if r in (None,"amb") or not r.get('pc'): continue
        n+=1; ok+= norm(r['pc'])==norm(P[s]['z'])
    print(f"{label} code postal: n={n} concordance={ok/max(n,1)*100:.1f}%",flush=True)
qz=[s for s in P if 'z' in P[s] and (s in ADR)]
zc(qz,lambda s:b_nocorner(s,10),"OSM bâtiment")
zc(qz,osm_building,"OSM bâtiment brut")
zc(qz,lambda s:node_nocorner(s,10,20),"OSM adresse <=10m")
def anyaddr(s,D):
    c=[x for x in ADR.get(s,[]) if x['d']<=D and x['pc']]
    if not c: return None
    if len({norm(x['pc']) for x in c})>1: return "amb"
    return c[0]
for D in (10,20,40): zc(qz,lambda s:anyaddr(s,D),f"OSM toutes adresses <= {D}m concordantes")
zc([s for s in fq if 'z' in P[s]],lambda s:ban(s,50),"BAN <=50m")
zc([s for s in fq if 'z' in P[s]],lambda s:ban(s,20),"BAN <=20m")
zc([s for s in bq if 'z' in P[s]],lambda s:best(s,20,20),"BeST <=20m")
def best_any(s,D):
    c=[x for x in BE.get(s,[]) if x['d']<=D]
    if not c: return None
    if len({x['pc'] for x in c})>1: return "amb"
    return c[0]
zc([s for s in BE if s in P and 'z' in P[s]],lambda s:best_any(s,30),"BeST toutes <=30m concordantes")
