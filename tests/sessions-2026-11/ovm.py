import duckdb,json,glob
P=[]
for f in glob.glob('/home/claude/halal-shopping/data/places/*_*.json'): P+=json.load(open(f))
c=duckdb.connect('ovm.db'); c.execute("SET threads=2"); c.execute("SET memory_limit='5GB'")
c.execute("CREATE OR REPLACE TABLE v(i VARCHAR, n VARCHAR, la DOUBLE, lo DOUBLE)"); c.executemany("INSERT INTO v VALUES (?,?,?,?)", [(p['i'],p['n'],p['la'],p['lo']) for p in P])
c.execute("""CREATE OR REPLACE TABLE m AS
WITH vg AS (SELECT v.i, v.n vn, v.la vla, v.lo vlo, floor(v.la*1000)::BIGINT+dy gy, floor(v.lo*1000)::BIGINT+dx gx FROM v, range(-1,2) t1(dy), range(-1,2) t2(dx)),
og AS (SELECT *, floor(la*1000)::BIGINT gy, floor(lo*1000)::BIGINT gx FROM 'ov/*.parquet' WHERE name IS NOT NULL AND (st IS NULL OR st='open'))
SELECT vg.i, vn, og.id, og.name, og.conf, og.w, og.ph, og.ad, og.cat, og.src,
 6371000*2*asin(sqrt(pow(sin(radians(og.la-vla)/2),2)+cos(radians(vla))*cos(radians(og.la))*pow(sin(radians(og.lo-vlo)/2),2))) d
FROM vg JOIN og USING (gy,gx) WHERE d<=80""")
print(c.execute("select count(*), count(distinct i) from m").fetchall())
