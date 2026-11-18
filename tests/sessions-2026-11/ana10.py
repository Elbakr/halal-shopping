from ana9 import *
import random
random.seed(3); A=[];T=[];W=[]
for s in P:
    if s not in OV: continue
    r=ovm(s,50,0.9,0.7)
    if r in (None,"amb"): continue
    p=P[s]
    if 'a' in p and r['ad'] and r['ad'][0]['freeform']: A.append((p.get('cc'),p['a'],'|',r['ad'][0]['freeform']))
    if 'ph' in p and r['ph']: T.append((p['ph'],'|',r['ph']))
    if 'w' in p and r['w']: W.append((p['w'],'|',r['w']))
for L in (A,T,W):
    random.shuffle(L); print("----")
    for x in L[:14]: print(*x)
