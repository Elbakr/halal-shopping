import sys, urllib.request, urllib.parse, time
E="https://qlever.dev/api/osm-planet"
H={"User-Agent":"halal.shopping/1.0 (places builder)","Accept":"text/tab-separated-values"}
P="""PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:> PREFIX geo: <http://www.opengis.net/ont/geosparql#> PREFIX geof: <http://www.opengis.net/def/function/geosparql/> PREFIX ogc: <http://www.opengis.net/rdf#> PREFIX osm: <https://www.openstreetmap.org/> PREFIX osmnode: <https://www.openstreetmap.org/node/> PREFIX osmway: <https://www.openstreetmap.org/way/> PREFIX qlss: <https://qlever.cs.uni-freiburg.de/spatialSearch/> PREFIX osm2rdf: <https://osm2rdf.cs.uni-freiburg.de/rdf#> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> """
q=open(sys.argv[1]).read()
t=time.time()
r=urllib.request.urlopen(urllib.request.Request(E,data=urllib.parse.urlencode({"query":P+q}).encode(),headers=H),timeout=900).read().decode()
l=r.split("\n"); print(len(l)-2,"rows",round(time.time()-t,1),"s",file=sys.stderr)
print("\n".join(l[:int(sys.argv[2]) if len(sys.argv)>2 else 15]))
