from ana7 import *
k=0
for s in qc:
    r=osm_building(s)
    if r in (None,"amb"): continue
    if concord([r['st']],P[s]['a'])[0] and not ok_street([r['st']],P[s]['a']):
        print(repr(P[s]['a']),'|',r['st'], split_addr(P[s]['a'])); k+=1
        if k>15: break
