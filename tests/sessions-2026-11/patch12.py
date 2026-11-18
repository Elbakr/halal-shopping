import sys,json,re
sys.path.insert(0,'scripts')
from i18n_extra import KEYS10,X10
s=open('index.html').read()
def rep(a,c,n=1):
    global s
    assert s.count(a)>=1,("MISSING",a[:90]); s=s.replace(a,c,n)
for l in ["fr","nl","en","ar"]:
    extra=",".join('%s:%s'%(k,json.dumps(v,ensure_ascii=False)) for k,v in zip(KEYS10,X10[l]))
    rep(l+':{pc_alcohol:',l+':{'+extra+',pc_alcohol:')

a=s.index('var stream=null, det=null;'); b=s.index('// ---------- Wiring ----------')
s=s[:a]+'''var stream=null, det=null, detP=null, FMT=["ean_13","ean_8","upc_a","upc_e"];
// Safari (iPhone, iPad) has no built-in barcode reader: the open-source "barcode-detector" library stands in for it.
function getDetector(){ if(det)return Promise.resolve(det); if(detP)return detP;
  var native=window.BarcodeDetector&&BarcodeDetector.getSupportedFormats?BarcodeDetector.getSupportedFormats().then(function(f){if(f.indexOf("ean_13")<0)throw 0;return new BarcodeDetector({formats:FMT})}):Promise.reject(0);
  detP=native.catch(function(){return new Promise(function(ok,no){
      if(window.BarcodeDetectionAPI){try{ok(new BarcodeDetectionAPI.BarcodeDetector({formats:FMT}))}catch(e){no(e)}return}
      var j=document.createElement("script");j.src="https://cdn.jsdelivr.net/npm/barcode-detector@3.2.2/dist/iife/ponyfill.js";j.crossOrigin="anonymous";
      j.onload=function(){try{ok(new BarcodeDetectionAPI.BarcodeDetector({formats:FMT}))}catch(e){no(e)}};j.onerror=no;document.head.appendChild(j)})})
    .then(function(d){det=d;return d}).catch(function(e){detP=null;throw e});
  return detP }
$("cam").addEventListener("click",function(){
  if(stream){stopCam();return}
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){msg(t("nocam"));$("q").focus();return}
  var dp=getDetector(); dp.catch(function(){});
  navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}}}).then(function(s){
    stream=s; var v=$("v"); v.setAttribute("playsinline",""); v.muted=true; v.srcObject=s; v.hidden=false; var pl=v.play(); if(pl&&pl.catch)pl.catch(function(){}); msg(t("camhint"));
    return dp.then(function(d){ var busy=false;
      (function loop(){ if(!stream)return; if(busy||v.readyState<2){setTimeout(loop,120);return} busy=true;
        d.detect(v).then(function(c){busy=false; var code=c&&c[0]&&c[0].rawValue; if(code){stopCam();lookup(code)} else setTimeout(loop,150)}).catch(function(){busy=false;setTimeout(loop,300)}) })();
    });
  }).catch(function(){stopCam();msg(t("nocam"))});
});
function stopCam(){ if(stream){stream.getTracks().forEach(function(x){x.stop()});stream=null} $("v").hidden=true }
$("photo").addEventListener("change",function(e){
  var f=e.target.files&&e.target.files[0]; if(!f)return; e.target.value=""; msg(t("loading"));
  getDetector().then(function(d){return (window.createImageBitmap?createImageBitmap(f).catch(function(){return f}):Promise.resolve(f)).then(function(b){return d.detect(b)})})
    .then(function(c){ if(c&&c[0]&&c[0].rawValue)lookup(c[0].rawValue); else msg(t("nobar")) }).catch(function(){msg(t("nobar"))});
});

'''+s[b:]

rep('function device(){','''// Administrator link: https://halal.shopping/#k=<key>. The key becomes this browser's contributor id; only its hash is on the server.
(function(){var m=location.hash.match(/^#k=([a-z0-9]{20,40})$/); if(!m)return; try{localStorage.setItem("hs_dev",m[1])}catch(e){}
  try{history.replaceState(null,"",location.pathname+location.search)}catch(e){} setTimeout(function(){toast(t("adminOn"))},1800)})();
var ME=null, meT=null;
function loadMe(){ if(!HSAPI_OK)return; clearTimeout(meT); meT=setTimeout(function(){
  fetch(HSAPI+"/api/hs/me?device="+device()).then(function(r){return r.ok?r.json():null}).then(function(j){if(j){ME=j;renderMine()}}).catch(function(){}) },400) }
function device(){''')
rep('''function renderMine(){var n=Object.keys(getDone()).length,el=$("mine");el.hidden=!n;if(!n)return;var lv=level(n),h=''','''var NEED=[[1,1],[10,2],[30,5],[100,10]];
function renderMine(){var el=$("mine");
  if(ME&&(ME.n||ME.admin)){var n=ME.n,lv=ME.level,h='<span>★ '+esc(ME.admin?t("admin"):t("lvl"+Math.max(1,lv)))+' · '+esc(t("mine").replace("{n}",n))+'</span>';
    if(!ME.admin&&lv<4){var nx=NEED[lv],lo=lv?NEED[lv-1][0]:0; h+='<i class="bar"><i style="width:'+Math.min(100,Math.round(100*(n-lo)/(nx[0]-lo)))+'%"></i></i><span class="nx">'+esc(n>=nx[0]?t("lvlDay").replace("{x}",t("lvl"+(lv+1))):t("lvlNext").replace("{n}",nx[0]-n).replace("{x}",t("lvl"+(lv+1))))+'</span>'}
    el.hidden=false; el.innerHTML=h; return}
  var n=Object.keys(getDone()).length;el.hidden=!n;if(!n)return;var lv=level(n),h=''')
rep('function markDone(k){var d=getDone();if(d[k])return;','function markDone(k){loadMe();var d=getDone();if(d[k])return;')
rep('function unDone(k){var d=getDone();','function unDone(k){loadMe();var d=getDone();')
rep('''if(PLACES.length){renderPlaces();loadPlaceCounts()}''','''loadMe(); if(PLACES.length){renderPlaces();loadPlaceCounts()}''')

a=s.index('function withdraw(coll,filter){'); b=s.index('function helpHTML(code){')
s=s[:a]+'''function withdraw(coll,key,kind){
  return fetch(HSAPI+"/api/hs/withdraw",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({coll:coll,key:key,kind:kind||"",device:device()})}).then(function(r){if(!r.ok)throw 0;return true})}
'''+s[b:]
s=re.sub(r'''withdraw\("(\w+)","(?:code|osm)='"\+([\w.]+)\+"'(?:&&kind='"\+(\w+)\+"')?"\)''',lambda m:'withdraw("%s",%s,%s)'%(m.group(1),m.group(2),m.group(3) or '""'),s)
assert not re.search(r'''withdraw\("\w+","(code|osm)=''',s), "withdraw left"

rep('var PIDX=null,','var PNUM={}, PIDX=null,')
rep('''    if(a[0]){PCOUNTS={};(a[0].items||[]).forEach(function(x){(PCOUNTS[x.osm]=PCOUNTS[x.osm]||{})[x.kind]=x.n})}''','''    if(a[0]){PCOUNTS={};PNUM={};(a[0].items||[]).forEach(function(x){(PCOUNTS[x.osm]=PCOUNTS[x.osm]||{})[x.kind]=+(x.wt||x.n);(PNUM[x.osm]=PNUM[x.osm]||{})[x.kind]=x.n})}''')
rep('''delete PCOUNTS[id];(j.items||[]).forEach(function(x){(PCOUNTS[x.osm]=PCOUNTS[x.osm]||{})[x.kind]=x.n});renderPage()}''','''delete PCOUNTS[id];delete PNUM[id];(j.items||[]).forEach(function(x){(PCOUNTS[x.osm]=PCOUNTS[x.osm]||{})[x.kind]=+(x.wt||x.n);(PNUM[x.osm]=PNUM[x.osm]||{})[x.kind]=x.n});renderPage()}''')
rep('''if(r.ok){var c=PCOUNTS[p.id]=PCOUNTS[p.id]||{};c[kind]=(c[kind]||0)+1}''','''if(r.ok)bump(p.id,kind)''')
rep('''if(r.ok){var c=PCOUNTS[id]=PCOUNTS[id]||{};c[kind]=(c[kind]||0)+1}''','''if(r.ok)bump(id,kind)''')
rep('''if(PCOUNTS[id])delete PCOUNTS[id][kind];''','''if(PCOUNTS[id])delete PCOUNTS[id][kind];if(PNUM[id])delete PNUM[id][kind];''')
rep('var OPP={alcohol:"noalcohol"','''function bump(id,kind){var c=PCOUNTS[id]=PCOUNTS[id]||{},m=PNUM[id]=PNUM[id]||{};c[kind]=(c[kind]||0)+(ME&&ME.w||1);m[kind]=(m[kind]||0)+1;var o=OPP[kind];if(o&&c[o]){c[o]=Math.max(0,c[o]-(ME&&ME.w||1));m[o]=Math.max(0,(m[o]||0)-1)}}
var OPP={alcohol:"noalcohol"''')
rep('''function statusHTML(p){var cf=(PCOUNTS[p.id]||{}).confirm||0;''','''function statusHTML(p){var cf=(PCOUNTS[p.id]||{}).confirm||0, cfn=(PNUM[p.id]||{}).confirm||0;''')
rep('''esc(cnt("p_conf",cf))''','''esc(cnt("p_conf",cfn||1))''')

rep('''function sigBtns(p){var d=getDone();function b(kind,key,cls){var on=d["pl:"+p.id+":"+kind],n=(PCOUNTS[p.id]||{})[kind]||0;''','''function sigBtns(p,page){var d=getDone();function b(kind,key,cls){var on=d["pl:"+p.id+":"+kind],n=(PNUM[p.id]||{})[kind]||0;''')
rep('''  return b("confirm","pc_confirm","c")+b("nothalal","pc_not","n")+b("alcohol","pc_alcohol","n")+(alc(p)||d["pl:"+p.id+":noalcohol"]?b("noalcohol","pc_noalc","c"):"")+b("closed","pc_closed","")}''','''  return b("confirm","pc_confirm","c")+b("nothalal","pc_not","n")+(page?b("alcohol","pc_alcohol","n")+b("noalcohol","pc_noalc","c"):"")+b("closed","pc_closed","")}''')
rep('''<div class="pa">'+sigBtns(p)+'</div><p class="src" style="margin:4px 0 0">''','''<div class="pa">'+sigBtns(p,true)+'</div><p class="src" style="margin:4px 0 0">''')

a=s.index('function seeLinks(p){'); b=s.index('\n',s.index('Uber Eats</a>\';return o}'))
s=s[:a]+'''var DLV={BE:"deliveroo.be",FR:"deliveroo.fr",GB:"deliveroo.co.uk",IT:"deliveroo.it",IE:"deliveroo.ie",AE:"deliveroo.ae",KW:"deliveroo.com.kw",QA:"deliveroo.qa",HK:"deliveroo.hk",SG:"deliveroo.com.sg"},
    TKW={BE:["Takeaway.com","takeaway.com"],NL:["Thuisbezorgd","thuisbezorgd.nl"],DE:["Lieferando","lieferando.de"],AT:["Lieferando","lieferando.at"],GB:["Just Eat","just-eat.co.uk"],FR:["Just Eat","just-eat.fr"],CH:["Just Eat","just-eat.ch"],ES:["Just Eat","just-eat.es"],IE:["Just Eat","just-eat.ie"],IT:["Just Eat","justeat.it"],DK:["Just Eat","just-eat.dk"]};
function gsite(site,p){return "https://www.google.com/search?q="+encodeURIComponent("site:"+site+" "+p.name+(p.city?" "+p.city.split(" - ")[0]:""))}
function lnk(u,t){return '<a target="_blank" rel="noopener nofollow" href="'+u+'">'+esc(t)+'</a>'}
function seeLinks(p){
  var o=lnk("https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(p.name)+"%20"+p.lat+"%2C"+p.lon,"Google Maps")+lnk("https://www.tripadvisor.com/Search?q="+encodeURIComponent(p.name+(p.city?" "+p.city.split(" - ")[0]:"")),"TripAdvisor");
  if(p.type==="t_rest"||p.type==="t_fast"){ var d='<span class="seeT">'+esc(t("pg_order"))+'</span>'+lnk(gsite("ubereats.com",p),"Uber Eats");
    if(DLV[p.cc])d+=lnk(gsite(DLV[p.cc],p),"Deliveroo"); if(TKW[p.cc])d+=lnk(gsite(TKW[p.cc][1],p),TKW[p.cc][0]); o+='</div><div class="see">'+d }
  return o}'''+s[b:]
rep('.see{display:flex;gap:8px;flex-wrap:wrap}','.see{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.see+.see{margin-top:8px}.seeT{font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;width:100%}')
rep('p.deliv=!!x.dv;p.take=!!x.tk;break}','p.deliv=!!x.dv;p.take=!!x.tk;p.cc=x.cc||p.cc;break}')

rep('<input id="addName" maxlength="80" minlength="2" required autocomplete="off">','<input id="venueIn" name="venue_q" type="search" maxlength="80" minlength="2" required autocomplete="off" autocorrect="off" autocapitalize="words" spellcheck="false" enterkeyhint="done">')
s=s.replace('$("addName")','$("venueIn")')
s=s.replace('.addF #addName','.addF #venueIn')
assert '$("addName")' not in s and 'id="addName"' not in s
rep('addKind="f", MISSION=null','addKind="f", addManual=false, PFK={t_rest:"r",t_fast:"f",t_butcher:"b",t_shop:"s"}, MISSION=null')
rep('''  $("addKinds").innerHTML=''','''  if(!addManual&&PFK[pfilter])addKind=PFK[pfilter];
  $("addKinds").innerHTML=''')
rep('''if(ak){addKind=ak.dataset.ak;renderFilters();return}''','''if(ak){addKind=ak.dataset.ak;addManual=true;renderFilters();return}''')
rep('''  if(e.target.closest("#addBtn")){$("addF").hidden=!$("addF").hidden;if(!$("addF").hidden)$("venueIn").focus();return}''','''  if(e.target.closest("#addBtn")||e.target.closest("[data-addnow]")){var open=!!e.target.closest("[data-addnow]")||$("addF").hidden; addManual=false; renderFilters(); $("addF").hidden=!open;
    if(open){$("addF").scrollIntoView({block:"center",behavior:"smooth"});setTimeout(function(){$("venueIn").focus()},350)} return}''')

rep('function km(p){','''// Opening hours (OpenStreetMap syntax, common forms). Unknown or unusual syntax -> null: nothing is shown rather than a guess.
var DI={Mo:0,Tu:1,We:2,Th:3,Fr:4,Sa:5,Su:6}, OHC={};
function ohParse(h){ h=String(h||"").trim(); if(!h)return null; if(OHC.hasOwnProperty(h))return OHC[h]; var out=null;
  try{ if(h==="24/7")out="all"; else { var days=[[],[],[],[],[],[],[]], set=[0,0,0,0,0,0,0], ok=true;
    h.replace(/(\\d)\\s*,\\s*(?=(?:Mo|Tu|We|Th|Fr|Sa|Su|PH)\\b)/g,"$1;").split(/\\s*;\\s*/).forEach(function(r){ if(!ok||!r)return; if(/^PH\\b/.test(r))return;
      var m=r.match(/^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?(?:\\s*,\\s*(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?)*)?(?:\\s*,\\s*PH)?\\s*(.*)$/); if(!m){ok=false;return}
      var sel=[0,1,2,3,4,5,6]; if(m[1]){sel=[];m[1].split(/\\s*,\\s*/).forEach(function(p){var a=p.split("-"),x=DI[a[0]],y=a[1]?DI[a[1]]:x;for(var i=x,g=0;g<8;i=(i+1)%7,g++){sel.push(i);if(i===y)break}})}
      var tm=m[2].trim(), sp=[]; if(tm==="off"||tm==="closed"){} else { if(!tm){ok=false;return} tm.split(/\\s*,\\s*/).forEach(function(x){var q=x.match(/^(\\d{1,2}):(\\d{2})\\s*-\\s*(\\d{1,2}):(\\d{2})\\+?$/);if(!q){ok=false;return}sp.push([+q[1]*60+ +q[2],+q[3]*60+ +q[4]])}) }
      sel.forEach(function(d){days[d]=sp.slice();set[d]=1}) });
    if(ok&&set.some(Boolean))out=days } }catch(e){out=null}
  OHC[h]=out; return out }
function isOpen(h,now){ var o=ohParse(h); if(!o)return null; if(o==="all")return true; now=now||new Date();
  var d=(now.getDay()+6)%7, m=now.getHours()*60+now.getMinutes(), i, a, b, y=o[(d+6)%7];
  for(i=0;i<o[d].length;i++){a=o[d][i][0];b=o[d][i][1];if(b<=a)b+=1440;if(m>=a&&m<b)return true}
  for(i=0;i<y.length;i++){a=y[i][0];b=y[i][1];if(b<=a&&m<b)return true; if(b>1440&&m<b-1440)return true}
  return false }
function openHTML(p){var o=isOpen(p.hours);return o===true?'<span class="pt op">'+esc(t("p_open"))+'</span>':o===false?'<span class="pt cl">'+esc(t("p_closedNow"))+'</span>':""}
function km(p){''')
rep('''["deliv","pg_deliv"],["alc","f_alc"]]''','''["open","f_open"],["deliv","pg_deliv"],["alc","f_alc"]]''')
rep('''if(pfilter==="deliv")return p.deliv;''','''if(pfilter==="deliv")return p.deliv; if(pfilter==="open")return isOpen(p.hours)===true;''')
rep('''    return '<div class="pl" data-id="'+p.id+'"><div class="ptr"><span class="pt">'+esc(t(p.type))+'</span>'+statusHTML(p)+'</div>''','''    return '<div class="pl" data-id="'+p.id+'"><div class="ptr"><span class="pt">'+esc(t(p.type))+'</span>'+statusHTML(p)+openHTML(p)+'</div>''')
rep('''  $("ppb").innerHTML='<div class="ptr"><span class="pt">'+esc(t(p.type))+'</span>'+statusHTML(p)+'</div>''','''  $("ppb").innerHTML='<div class="ptr"><span class="pt">'+esc(t(p.type))+'</span>'+statusHTML(p)+openHTML(p)+'</div>''')
rep('.pl .pt.al,#ppb .pt.al{','.pl .pt.op,#ppb .pt.op{color:#05211a;background:var(--go-bright)}.pl .pt.cl,#ppb .pt.cl{color:var(--muted);background:transparent;border:1px solid var(--line)}\n.pl .pt.al,#ppb .pt.al{')

rep('''  var V=visiblePlaces();
  $("plist").innerHTML=V.map(''','''  var V=visiblePlaces();
  if(!V.length&&PLACES.length){$("plist").innerHTML='<div class="pl"><span class="pm">'+esc(t("p_none"))+'</span><button type="button" class="btn" data-addnow><span aria-hidden="true">＋</span> '+esc(t("addBtn"))+'</button></div>';renderMission();return}
  $("plist").innerHTML=V.map(''')
open('index.html','w').write(s)
print("ok")
