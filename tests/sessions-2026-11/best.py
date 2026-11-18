import duckdb,json,glob
P=[]
for f in glob.glob('/home/claude/halal-shopping/data/places/*_*.json'): P+=json.load(open(f))
be=[(p['i'],p['la'],p['lo']) for p in P if p.get('cc')=='BE' or (49.4<p['la']<51.6 and 2.5<p['lo']<6.5)]
c=duckdb.connect('best/best.db')
c.execute("""CREATE OR REPLACE TABLE a AS SELECT "EPSG:4326_lat"::DOUBLE la, "EPSG:4326_lon"::DOUBLE lo, house_number hn, box_number bx, postcode pc,
 coalesce(municipality_name_fr, municipality_name_nl, municipality_name_de) mfr, municipality_name_nl mnl, municipality_name_de mde,
 streetname_fr sfr, streetname_nl snl, streetname_de sde, region_code rg, status
 FROM read_csv('best/openaddress-be*.csv', all_varchar=true, header=true, quote='"') WHERE status='current' AND "EPSG:4326_lat" IS NOT NULL AND "EPSG:4326_lat"<>''""")
print(c.execute("select count(*), count(distinct rg) from a").fetchall())
c.execute("CREATE OR REPLACE TABLE v(i VARCHAR, la DOUBLE, lo DOUBLE)"); c.executemany("INSERT INTO v VALUES (?,?,?)", be)
c.execute("""CREATE OR REPLACE TABLE m AS
WITH ag AS (SELECT *, floor(la*1000)::BIGINT gy, floor(lo*1000)::BIGINT gx FROM a),
vg AS (SELECT v.i, v.la vla, v.lo vlo, floor(v.la*1000)::BIGINT+dy gy, floor(v.lo*1000)::BIGINT+dx gx FROM v, range(-1,2) t1(dy), range(-1,2) t2(dx))
SELECT vg.i, ag.*, 6371000*2*asin(sqrt(pow(sin(radians(ag.la-vla)/2),2)+cos(radians(vla))*cos(radians(ag.la))*pow(sin(radians(ag.lo-vlo)/2),2))) d
FROM vg JOIN ag USING (gy,gx) WHERE d<=40""")
print(c.execute("select count(*), count(distinct i) from m").fetchall(), len(be))
