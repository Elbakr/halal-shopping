from ana11 import *
for D,S,C,NS in ((50,0.9,0.7,1),(30,0.95,0.9,1),(30,0.95,0.95,1),(20,0.98,0.9,1),(50,0.9,0.7,2),(30,0.95,0.9,2),(30,0.95,0.9,3),(15,0.98,0.95,2)):
    n=pn=pok=wn=wok=an=aok=0
    for s in P:
        if s not in OV: continue
        r=ovm(s,D,S,C)
        if r in (None,"amb"): continue
        if len({x.split('|')[0] for x in r['src'] if x.split('|')[0] not in ('Overture','Overture-signals')})<NS: continue
        n+=1; p=P[s]
        if 'ph' in p and r['ph']: pn+=1; pok+=any(re.sub(r"\D","",x)[-9:]==re.sub(r"\D","",p['ph'])[-9:] for x in r['ph'])
        if 'w' in p and r['w']: wn+=1; wok+=any(host(x)==host(p['w']) for x in r['w'])
        if 'a' in p and re.search(r"[^\W\d_]{3}",p['a']) and r['ad'] and r['ad'][0]['freeform']:
            an+=1; aok+=ok_street([ff_street(r['ad'][0]['freeform'])],p['a'])
    print(f"D<={D} sim>={S} conf>={C} sources>={NS}: n={n} tel {pn} {pok/max(pn,1)*100:.1f}% | site {wn} {wok/max(wn,1)*100:.1f}% | rue {an} {aok/max(an,1)*100:.1f}%",flush=True)
