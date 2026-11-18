from ana4 import *
B={r['id']:r for r in json.load(open('ban/ban.json'))}
fq=[s for s in B if s in P and 'a' in P[s] and re.search(r"[^\W\d_]{3}",P[s]['a'])]
print("FR QC pool",len(fq))
def ban(s,D,typ=("housenumber",)):
    r=B.get(s)
    if not r or r['result_type'] not in typ or not r['result_distance'] or float(r['result_distance'])>D: return None
    return {'st':r['result_street'] or r['result_name'],'hn':r['result_housenumber'],'pc':r['result_postcode']}
for D in (5,10,15,20,30,50): rate2(fq,lambda s:ban(s,D),f"BAN housenumber <= {D}m")
rate2(fq,lambda s:ban(s,100,("street",)),"BAN street")
# BeST
c=duckdb.connect('best/best.db',read_only=True)
BE=collections.defaultdict(list)
for row in c.execute("select i,sfr,snl,sde,hn,bx,pc,mfr,d from m").fetchall():
    BE[row[0]].append(dict(names=[x for x in row[1:4] if x],hn=row[4],pc=row[6],d=row[8]))
bq=[s for s in BE if s in P and 'a' in P[s] and re.search(r"[^\W\d_]{3}",P[s]['a'])]
print("BE QC pool",len(bq))
def best(s,D,R):
    c=[x for x in BE.get(s,[]) if x['d']<=D]
    if not c: return None
    r=min(c,key=lambda x:x['d'])
    if any(set(map(norm,x['names']))!=set(map(norm,r['names'])) for x in BE[s] if x['d']<=R): return "amb"
    return dict(st=r['names'][0],names=r['names'],hn=r['hn'],pc=r['pc'])
def rate3(pool,fn,label):
    n=ok=h=0
    for s in pool:
        r=fn(s)
        if r in (None,"amb"): continue
        n+=1; a,b=concord(r['names'],P[s]['a'],r['hn']); ok+=a; h+=b
    print(f"{label}: n={n} rue={ok/max(n,1)*100:.1f}% num={h/max(ok,1)*100:.1f}%")
for D in (5,10,20,30):
    for R in (0,15,25): rate3(bq,lambda s:best(s,D,max(R,D)),f"BeST <= {D}m, no other street <= {max(R,D)}m")
