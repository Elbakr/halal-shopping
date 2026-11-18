import sys,glob,json,collections,pickle,re
sys.path.insert(0,'/home/claude/halal-shopping/scripts')
import enrich as E
ADR=collections.defaultdict(list); ST=collections.defaultdict(list); ccs=set()
for f in glob.glob('osm2/adr_*.tsv'):
    cc=f.split('_')[-1][:2]
    if not glob.glob(f'osm2/str_{cc}.tsv'): continue
    ccs.add(cc)
    for l in open(f).read().split("\n")[1:]:
        c=l.split("\t")
        if len(c)<11: continue
        s,a=E.oid(c[0]),E.oid(c[1])
        if s and a and s!=a: ADR[s].append({"a":a,"st":E.lit(c[2]),"pc":E.lit(c[4]),"bd":bool(c[7].strip()),"d":float(E.lit(c[6]))})
    for l in open(f'osm2/str_{cc}.tsv').read().split("\n")[1:]:
        c=l.split("\t")
        if len(c)<5: continue
        ST[E.oid(c[0])].append({"st":E.lit(c[2]),"d":float(E.lit(c[4]))})
P=[]
for f in glob.glob('/home/claude/halal-shopping/data/places/*_*.json'): P+=json.load(open(f))
P=[p for p in P if p.get('cc') in ccs]
print("countries",len(ccs),sorted(ccs),"venues",len(P))
BAN=E.ban(P); BEST=E.best(P)
pickle.dump((dict(ADR),dict(ST),BAN,dict(BEST)),open('cands33.pkl','wb'))
res=E.qc(P,ADR,ST,BAN,BEST)
for k,v in res.items(): print("%-10s n=%-6d concordance=%s%%"%(k,v[0],v[1]))
json.dump(res,open('qc33.json','w'),indent=1)
