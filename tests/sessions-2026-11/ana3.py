from ana import *
qc=[s for s,p in P.items() if 'a' in p and re.search(r"[^\W\d_]{3}",p['a']) and (s in ADR or s in STR)]
print("QC pool (street with letters)",len(qc))
def b_nocorner(s,R):
    r=osm_building(s)
    if r in (None,"amb"): return r
    if any(norm(x['st'])!=norm(r['st']) for x in ADR.get(s,[]) if x['d']<=R): return "amb"
    return r
def b_street(s,R):
    r=osm_building(s)
    if r in (None,"amb"): return r
    near=[x['st'] for x in STR.get(s,[]) if x['d']<=R]
    if not near: return "amb"
    nn=min((x for x in STR.get(s,[]) if x['d']<=R),key=lambda x:x['d'])['st']
    return r if norm(nn)==norm(r['st']) else "amb"
def node_nocorner(s,D,R):
    r=osm_node(s,D,True)
    if r in (None,"amb"): return r
    if any(norm(x['st'])!=norm(r['st']) for x in ADR.get(s,[]) if x['d']<=R): return "amb"
    return r
def node_street(s,D,R):
    r=osm_node(s,D,True)
    if r in (None,"amb"): return r
    c=[x for x in STR.get(s,[]) if x['d']<=R]
    if not c: return "amb"
    return r if norm(min(c,key=lambda x:x['d'])['st'])==norm(r['st']) else "amb"
rate(qc,osm_building,"building")
for R in (10,20,30): rate(qc,lambda s:b_nocorner(s,R),f"building+no other street <= {R}m")
for R in (20,30,50): rate(qc,lambda s:b_street(s,R),f"building+nearest street same <= {R}m")
for D in (5,10,20):
  for R in (20,30): rate(qc,lambda s:node_nocorner(s,D,R),f"node<={D} no other street<={R}")
  rate(qc,lambda s:node_street(s,D,30),f"node<={D} + nearest street same <=30")
for D in (20,30,50): rate(qc,lambda s:street(s,D),f"street<={D}m")
