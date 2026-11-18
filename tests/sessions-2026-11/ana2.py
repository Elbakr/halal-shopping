from ana import *
import random
qc=[s for s,p in P.items() if 'a' in p and (s in ADR or s in STR)]
random.seed(1); bad=[]
for s in qc:
    r=osm_building(s)
    if r and r!="amb" and not concord([r['st']],P[s]['a'])[0]: bad.append((P[s].get('cc'),P[s]['a'],'|',r['st'],r['hn']))
random.shuffle(bad)
for b in bad[:40]: print(*b)
