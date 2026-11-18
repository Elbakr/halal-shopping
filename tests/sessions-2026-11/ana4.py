from ana3 import *
def firstint(x):
    m=re.search(r"\d+",x or ""); return m.group(0) if m else None
def rate2(pool,fn,label):
    n=ok=h=hl=0
    for s in pool:
        r=fn(s)
        if r in (None,"amb"): continue
        n+=1; a,b=concord([r['st']],P[s]['a'],r.get('hn')); ok+=a
        if a:
            o=P[s]['a']; 
            h+=b; hl+= firstint(o.split()[-1] if o.split() else "")==firstint(r.get('hn'))
    print(f"{label}: n={n} rue={ok/n*100:.1f}% num_strict={h/max(ok,1)*100:.1f}% num_premier_entier={hl/max(ok,1)*100:.1f}% (parmi rue juste)")
rate2(qc,lambda s:b_nocorner(s,10),"building nocorner10")
rate2(qc,lambda s:node_nocorner(s,3,20),"node<=3 nocorner20")
rate2(qc,lambda s:node_nocorner(s,10,20),"node<=10 nocorner20")
