import duckdb,time,sys
c=duckdb.connect(); c.execute("LOAD httpfs;"); c.execute("SET http_proxy='127.0.0.1:41067'"); c.execute("SET ca_cert_file='/root/.ccr/ca-bundle.crt'")
c.execute("SET threads=4")
tiles=[l.strip() for l in open("tiles.txt") if l.strip()]
c.execute("CREATE TABLE t(k VARCHAR)"); c.executemany("INSERT INTO t VALUES (?)",[[k] for k in tiles])
fs=["https://overturemaps-us-west-2.s3.amazonaws.com/"+l.strip().replace("=","%3D") for l in open("ov_files.txt") if l.strip().endswith(".parquet")]
for i,f in enumerate(fs):
    t=time.time()
    c.execute(f"""COPY (SELECT p.id, p.names.primary AS name, p.confidence AS conf, p.websites AS w, p.phones AS ph, p.addresses AS ad,
      (p.bbox.xmin+p.bbox.xmax)/2 AS lo, (p.bbox.ymin+p.bbox.ymax)/2 AS la, p.operating_status AS st, p.basic_category AS cat,
      list_transform(p.sources, lambda s: s.dataset || '|' || coalesce(s.license,'')) AS src
      FROM read_parquet('{f}') p WHERE (cast(floor(p.bbox.ymin) AS INT)::VARCHAR || '_' || cast(floor(p.bbox.xmin) AS INT)::VARCHAR) IN (SELECT k FROM t))
      TO 'ov/part{i:02d}.parquet' (FORMAT parquet)""")
    print(i, round(time.time()-t), "s", flush=True)
