import sys,glob,json,pickle,collections
sys.path.insert(0,'/home/claude/halal-shopping/scripts')
import enrich as E
ADR,ST,BAN,BEST=pickle.load(open('cands33.pkl','rb'))
P=[]
for f in glob.glob('/home/claude/halal-shopping/data/places/*_*.json'): P+=json.load(open(f))
by=collections.defaultdict(list)
for p in P: by[p.get('cc')].append(p)
rows=[]
for cc,L in by.items():
    if cc not in {p.get('cc') for p in L if p['i'] in ADR}: continue
    r=E.qc(L,ADR,ST,BAN,BEST).get('a:FINAL')
    if r and r[0]>=50: rows.append((r[1],cc,r[0]))
for x in sorted(rows): print(x)
