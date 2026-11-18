import json,glob,collections,sys,time,urllib.request,urllib.parse,re
E="https://qlever.dev/api/osm-planet"
H={"User-Agent":"halal.shopping/1.0 (places builder)","Accept":"text/tab-separated-values"}
PFX="PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:> PREFIX geo: <http://www.opengis.net/ont/geosparql#> PREFIX ogc: <http://www.opengis.net/rdf#> PREFIX qlss: <https://qlever.cs.uni-freiburg.de/spatialSearch/> "
P=[]
for f in glob.glob('/home/claude/halal-shopping/data/places/*_*.json'): P+=json.load(open(f))
by=collections.defaultdict(list)
for p in P: by[p.get('cc')].append(p['i'])
C={}
for l in open('countries.tsv').read().split('\n')[1:]:
    c=l.split('\t')
    if len(c)>1: C.setdefault(c[1].strip('"'),c[0])
def iri(i): return "<https://www.openstreetmap.org/%s/%s>"%({"n":"node","w":"way","r":"relation"}[i[0]],i[1:])
def q(cc,ids,kind):
    right = ("{ %s ogc:sfContains ?a . ?a osmkey:addr:housenumber ?hn ; osmkey:addr:street ?st ; geo:hasGeometry/geo:asWKT ?ag . OPTIONAL { ?a osmkey:addr:postcode ?pc } OPTIONAL { ?a osmkey:addr:city ?ci } OPTIONAL { ?a osmkey:building ?bd } OPTIONAL { ?a osmkey:name ?an } OPTIONAL { ?a osmkey:shop ?sh } OPTIONAL { ?a osmkey:amenity ?am } }"%C[cc]) if kind=="adr" else \
            ("{ ?a ogc:sfIntersects %s . ?a osmkey:highway ?hw ; osmkey:name ?st ; geo:hasGeometry/geo:asWKT ?ag . FILTER(?hw IN (\"residential\",\"primary\",\"secondary\",\"tertiary\",\"unclassified\",\"living_street\",\"pedestrian\",\"trunk\",\"primary_link\",\"secondary_link\",\"tertiary_link\",\"road\")) }"%C[cc])
    md = 40 if kind=="adr" else 80
    sel = "?s ?a ?st ?hn ?pc ?ci ?d ?bd ?an ?sh ?am" if kind=="adr" else "?s ?a ?st ?hw ?d"
    return PFX+"SELECT %s WHERE { VALUES ?s { %s } ?s geo:hasGeometry/geo:asWKT ?sg . SERVICE qlss: { _:c qlss:algorithm qlss:libspatialjoin ; qlss:left ?sg ; qlss:right ?ag ; qlss:joinType qlss:within-dist ; qlss:maxDistance %d ; qlss:bindDistance ?d ; qlss:payload qlss:all . %s } }"%(sel," ".join(iri(i) for i in ids),md,right)
def run(cc,kind):
    t=time.time()
    r=urllib.request.urlopen(urllib.request.Request(E,data=urllib.parse.urlencode({"query":q(cc,by[cc],kind)}).encode(),headers=H),timeout=900).read().decode()
    return r, time.time()-t
if __name__=="__main__":
  import os
  for cc in sorted(by, key=lambda c: -len(by[c])):
   if cc not in C: print("no relation", cc, len(by[cc])); continue
   for kind in ("adr","str"):
    if os.path.exists(f"osm2/{kind}_{cc}.tsv"): continue
    try:
      r,t=run(cc,kind)
      open(f"osm2/{kind}_{cc}.tsv","w").write(r)
      print(cc,kind,len(by[cc]),"venues",r.count("\n")-1,"rows",round(t,1),"s",flush=True)
    except Exception as e: print(cc,kind,"FAILED",e,flush=True)
