import json,glob,re,unicodedata,collections,os,duckdb,sys
P={}
for f in glob.glob('/home/claude/halal-shopping/data/places/*_*.json'):
    for p in json.load(open(f)): P[p['i']]=p
def lit(v):
    v=v.strip()
    if v.startswith('"'): v=v[1:v.rfind('"')].replace('\\"','"')
    return v
def oid(v):
    m=re.match(r"<https://www\.openstreetmap\.org/(node|way|relation)/(\d+)>",v.strip()); return m.group(1)[0]+m.group(2) if m else None
def norm(s):
    s=unicodedata.normalize("NFKD",s.lower()); s="".join(ch for ch in s if not unicodedata.combining(ch))
    return re.sub(r"[^0-9a-zЀ-ӿ؀-ۿ฀-๿぀-鿿]","",s.replace("ß","ss"))
def parts(s): return {norm(x) for x in re.split(r" - | / |;",s)}|{norm(s)}
def same(a,b): return bool(parts(a)&parts(b))
ADR=collections.defaultdict(list); STR=collections.defaultdict(list)
for f in glob.glob('osm2/adr_*.tsv'):
    for l in open(f).read().split("\n")[1:]:
        c=l.split("\t")
        if len(c)<11: continue
        s,a=oid(c[0]),oid(c[1])
        if not s or s==a: continue
        ADR[s].append(dict(a=a,st=lit(c[2]),hn=lit(c[3]),pc=lit(c[4]),ci=lit(c[5]),d=float(lit(c[6])),bd=bool(c[7].strip()),poi=bool(c[8].strip() or c[9].strip() or c[10].strip())))
for f in glob.glob('osm2/str_*.tsv'):
    for l in open(f).read().split("\n")[1:]:
        c=l.split("\t")
        if len(c)<5: continue
        s=oid(c[0])
        STR[s].append(dict(st=lit(c[2]),hw=lit(c[3]),d=float(lit(c[4]))))
print("venues with adr cands",len(ADR),"with street cands",len(STR))
def concord(cands, a, hn=None):
    """cands: candidate street names; a: OSM 'street housenumber'. Returns (street_ok, number_ok)."""
    pieces=[norm(x) for x in re.split(r" - | / ",a)]+[norm(a)]
    for c in cands:
        n=norm(c)
        if not n: continue
        for pc in pieces:
            if pc.startswith(n):
                rest=pc[len(n):]
                if rest=="" or rest[0].isdigit():
                    return True, (hn is not None and rest==norm(hn))
    return False, False
def osm_building(s):
    c=[x for x in ADR.get(s,[]) if x['bd'] and x['d']==0 and x['a'][0] in 'wr']
    sts={norm(x['st']) for x in c}
    if len(sts)==1: return c[0]
    return "amb" if c else None
def osm_node(s,D,poi_ok):
    c=[x for x in ADR.get(s,[]) if x['d']<=D and not (x['bd'] and x['d']==0) and (poi_ok or not x['poi'])]
    if not c: return None
    if len({norm(x['st']) for x in c})>1: return "amb"
    return min(c,key=lambda x:x['d'])
def street(s,D):
    c=sorted([x for x in STR.get(s,[]) if x['d']<=D],key=lambda x:x['d'])
    return c[0] if c else None
def rate(pool,fn,label,names=lambda r:[r['st']]):
    n=ok=amb=hok=0
    for s in pool:
        r=fn(s)
        if r is None: continue
        if r=="amb": amb+=1; continue
        n+=1; a,b=concord(names(r),P[s]['a'],r.get('hn')); ok+=a; hok+=b
    print(f"{label}: n={n} rue={ok/n*100 if n else 0:.1f}% numero={hok/n*100 if n else 0:.1f}% ambigus={amb}",flush=True)
    return n, ok
if __name__=="__main__" and sys.argv[1:]==["osm"]:
    qc=[s for s,p in P.items() if 'a' in p and (s in ADR or s in STR)]
    print("QC pool",len(qc))
    rate(qc,osm_building,"building")
    for D in (3,5,10,15,20,30):
        rate(qc,lambda s:osm_node(s,D,False),f"addrnode<={D}m nopoi")
        rate(qc,lambda s:osm_node(s,D,True),f"addrnode<={D}m poi_ok")
    for D in (10,20,30,50,80):
        rate(qc,lambda s:street(s,D),f"street<={D}m")
