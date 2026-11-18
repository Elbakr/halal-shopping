from ana9 import *
import random
def ff_street(ff):
    parts=[x.strip() for x in ff.split(",")]
    s=parts[0]
    if re.fullmatch(r"[\d\w/-]{1,6}",s) and len(parts)>1 and re.search(r"\d",s): s=parts[1]
    s=re.sub(r"\s+(No|Nr|no|nr|n°|N°)[:.]?\s*\S+.*$","",s)
    s=re.sub(r"\s+(Unit|Suite|Ste|Apt|#|Local|D:|Kat)\b.*$","",s,flags=re.I)
    s=re.sub(r"^\d[\w/-]*\s+|\s+\d[\w/-]*[a-zA-Z]?$","",s.strip())
    return s.strip()
def ff_num(ff):
    m=re.match(r"^(\d[\w/-]*)\s",ff.strip()) or re.search(r"(?:No|Nr)[:.]?\s*(\d[\w/-]*)",ff) or re.search(r"\s(\d[\w/-]*)\s*(?:,|$)",ff)
    return m.group(1) if m else None
def host(u): return re.sub(r"^www\.","",re.sub(r"^https?://","",u.lower())).split("/")[0]
if __name__=="__main__":
    random.seed(4); bad=[];n=ok=nok=0;pb=[];wb=[]
    for s in P:
        if s not in OV: continue
        r=ovm(s,50,0.9,0.7)
        if r in (None,"amb"): continue
        p=P[s]
        if 'a' in p and re.search(r"[^\W\d_]{3}",p['a']) and r['ad'] and r['ad'][0]['freeform']:
            ff=r['ad'][0]['freeform']; n+=1
            if ok_street([ff_street(ff)],p['a']):
                ok+=1; nok+= num_ok(ff_num(ff),p['a'])
            else: bad.append((p['a'],'|',ff,'->',ff_street(ff)))
        if 'ph' in p and r['ph'] and not any(re.sub(r"\D","",x)[-9:]==re.sub(r"\D","",p['ph'])[-9:] for x in r['ph']): pb.append((p['ph'],r['ph'],p['n'],r['name']))
        if 'w' in p and r['w'] and not any(host(x)==host(p['w']) for x in r['w']): wb.append((p['w'],r['w']))
    print("adresse",n,ok/n*100,"num",nok/ok*100)
    random.shuffle(bad); random.shuffle(pb); random.shuffle(wb)
    for b in bad[:20]: print(*b)
    for b in pb[:10]: print(*b)
    for b in wb[:10]: print(*b)
