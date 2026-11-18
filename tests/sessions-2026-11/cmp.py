import re, unicodedata
ABBR={"av":"avenue","ave":"avenue","bd":"boulevard","bld":"boulevard","blvd":"boulevard","boul":"boulevard","pl":"place","rte":"route","chee":"chaussee","ch":"chemin",
"imp":"impasse","all":"allee","sq":"square","gen":"general","gal":"general","pdt":"president","pres":"president","dr":"docteur","doct":"docteur","mal":"marechal","st":"saint","ste":"sainte",
"str":"strasse","cad":"caddesi","cd":"caddesi","sk":"sokak","sok":"sokagi","sokak":"sokagi","bulv":"bulvari","rd":"road","ln":"lane","sq":"square","dr.":"drive","mah":"mahallesi","ul":"ulica","al":"aleja","os":"osiedle"}
STOP={"de","du","des","la","le","les","l","d","der","die","das","den","van","het","of","the","di","del","della","dei","da","do","dos","y","e","et","und","en","a","au","aux"}
def toks(s):
    s=unicodedata.normalize("NFKD",(s or "").lower().replace("ß","ss")); s="".join(c for c in s if not unicodedata.combining(c))
    s=re.sub(r"strasse\b|straße\b"," strasse",s)
    t=[w for w in re.split(r"[^0-9a-zЀ-ӿ؀-ۿ฀-๿぀-鿿]+",s) if w]
    return [ABBR.get(w,w) for w in t if w not in STOP]
def same_street(a,b):
    """Same street name, tolerant to articles, accents, punctuation and common abbreviations. Never tolerant to a different street type or name."""
    ta,tb=toks(a),toks(b)
    if not ta or not tb: return False
    if ta==tb or "".join(ta)=="".join(tb): return True
    short,long_=(ta,tb) if len(ta)<=len(tb) else (tb,ta)
    if len(short)>=2 and short[0]==long_[0] and short[-1]==long_[-1]:  # same type and same last word, middle names may be shortened
        it=iter(long_); return all(w in it for w in short)
    return False
def split_addr(a,hn_hint=None):
    """OSM 'a' = 'street housenumber' -> (street, number). Number = trailing token(s) starting with a digit."""
    m=re.match(r"^(.*?)\s+(\d[\w/\-;,. ]*)$",a.strip())
    return (m.group(1),m.group(2)) if m else (a.strip(),"")
