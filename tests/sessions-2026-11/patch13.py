import sys,json
sys.path.insert(0,'scripts')
from i18n_extra import KEYS12,X12
s=open('index.html').read()
def rep(a,c):
    global s
    assert a in s,("MISSING",a[:90]); s=s.replace(a,c,1)
for l in ["fr","nl","en","ar"]:
    extra=",".join('%s:%s'%(k,json.dumps(v,ensure_ascii=False)) for k,v in zip(KEYS12,X12[l]))
    rep(l+':{p_chain:',l+':{'+extra+',p_chain:')
CAM='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.500"/></svg>'
a=s.index('function seeLinks(p){'); b=s.index('function routeURL(p){')
s=s[:a]+'''var PLAT={ubereats:"Uber Eats",deliveroo:"Deliveroo",takeaway:"Takeaway.com",website:"Site web",instagram:"Instagram",facebook:"Facebook",tiktok:"TikTok"},
    LINKS={}, MEDIA={}, MFLAG={}, phKind="other";
// The exact page brought by a member wins; otherwise a plain search (name, commune, platform), clearly labelled as a search.
function bestLink(id,pl){var a=(LINKS[id]||[]).filter(function(x){return x.platform===pl});a.sort(function(x,y){return ((y.w||1)-(x.w||1))||(y.created>x.created?1:-1)});return a[0]}
function gq(p,word){return "https://www.google.com/search?q="+encodeURIComponent(p.name+(p.city?" "+p.city.split(" - ")[0]:"")+" "+word)}
function seeLinks(p){
  var o=lnk("https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(p.name)+"%20"+p.lat+"%2C"+p.lon,"Google Maps")+lnk("https://www.tripadvisor.com/Search?q="+encodeURIComponent(p.name+(p.city?" "+p.city.split(" - ")[0]:"")),"TripAdvisor");
  ["website","instagram","facebook","tiktok"].forEach(function(k){var x=bestLink(p.id,k);if(x)o+='<a class="exact" target="_blank" rel="noopener nofollow" href="'+esc(x.url)+'">✓ '+esc(k==="website"?t("pg_site"):PLAT[k])+'</a>'});
  if(p.type==="t_rest"||p.type==="t_fast"){ var d='<span class="seeT">'+esc(t("pg_order"))+'</span>';
    [["ubereats","Uber Eats"],DLV[p.cc]?["deliveroo","Deliveroo"]:null,TKW[p.cc]?["takeaway",TKW[p.cc][0]]:null].forEach(function(q){ if(!q)return; var x=bestLink(p.id,q[0]);
      d+=x?'<a class="exact" target="_blank" rel="noopener nofollow" href="'+esc(x.url)+'">✓ '+esc(q[1])+'</a>':lnk(gq(p,q[1]),t("lk_search").replace("{x}",q[1])) });
    o+='</div><div class="see">'+d }
  o+='</div><div class="see"><button type="button" class="pb" id="lkOpen"'+(HSAPI_OK?"":" disabled")+'>＋ '+esc(t("lk_add"))+'</button></div>'+
    '<form id="lkF" class="lkF" hidden><select id="lkP">'+Object.keys(PLAT).map(function(k){return '<option value="'+k+'">'+esc(k==="website"?t("pg_site"):PLAT[k])+'</option>'}).join("")+'</select>'+
    '<input id="lkU" type="url" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="'+esc(t("lk_ph"))+'"><button class="btn solid" type="submit">OK</button></form><div class="see" hidden>';
  return o}
var PHK=[["front","ph_front"],["menu","ph_menu"],["certificate","ph_cert"],["hours","ph_hours"],["alcohol","ph_alc"],["other","ph_other"]];
function mediaURL(x,thumb){return HSAPI+"/api/files/place_media/"+x.id+"/"+encodeURIComponent(x.photo)+(thumb?"?thumb="+thumb:"")}
function mediaHTML(p){
  var V=(MEDIA[p.id]||[]).filter(function(x){return !((MFLAG[x.id]||0)>=3)});
  var g=V.map(function(x){var lab=(PHK.filter(function(k){return k[0]===x.kind})[0]||PHK[5])[1];
    return '<figure class="ph"><button type="button" class="zoom" data-zoom="'+esc(mediaURL(x))+'"><img loading="lazy" src="'+esc(mediaURL(x,"400x0"))+'" alt="'+esc(t(lab))+'"></button><figcaption><b>'+esc(t(lab))+'</b>'+(x.dist>=0&&x.dist<=150?'<span class="onsite">✓ '+esc(t("ph_onsite"))+'</span>':"")+'<button type="button" class="phr" data-flag="'+x.id+'">'+esc(t("ph_report"))+'</button></figcaption></figure>'}).join("");
  return '<div class="ppbox"><h3>'+esc(t("ph_title"))+'</h3>'+(g?'<div class="phg">'+g+'</div>':'<p class="src" style="margin:0">'+esc(t("ph_none"))+'</p>')+
    '<button type="button" class="btn" id="phOpen"'+(HSAPI_OK?"":" disabled")+'>'''+CAM+'''<span>'+esc(t("ph_add"))+'</span></button>'+
    '<div id="phKinds" class="chips" hidden><span class="src" style="width:100%;margin:0">'+esc(t("ph_pick"))+'</span>'+PHK.map(function(k){return '<button type="button" class="chip" data-phk="'+k[0]+'">'+esc(t(k[1]))+'</button>'}).join("")+'</div></div>'}
function loadProof(p){ if(!HSAPI_OK)return; var f=encodeURIComponent("(osm='"+p.id+"')");
  Promise.all([fetch(HSAPI+"/api/collections/place_media/records?perPage=40&sort=-created&filter="+f).then(function(r){return r.ok?r.json():{items:[]}}),
               fetch(HSAPI+"/api/collections/place_links/records?perPage=40&filter="+f).then(function(r){return r.ok?r.json():{items:[]}})]).then(function(a){
    MEDIA[p.id]=a[0].items||[]; LINKS[p.id]=a[1].items||[];
    var ids=MEDIA[p.id].map(function(x){return "media='"+x.id+"'"});
    return ids.length?fetch(HSAPI+"/api/collections/media_flag_sum/records?perPage=40&filter="+encodeURIComponent("("+ids.join("||")+")")).then(function(r){return r.ok?r.json():{items:[]}}).then(function(j){(j.items||[]).forEach(function(x){MFLAG[x.media]=+x.wt})}):null
  }).then(function(){if(CUR===p)renderPage()}).catch(function(){}) }
function sendMedia(p,file,kind){ toast(t("loading"));
  var pos=new Promise(function(ok){ if(!navigator.geolocation)return ok(null); navigator.geolocation.getCurrentPosition(function(g){ok(g.coords)},function(){ok(null)},{timeout:6000,maximumAge:120000}) });
  Promise.all([shrink(file).catch(function(){return file}),pos]).then(function(a){ var f=new FormData();
      f.append("osm",p.id);f.append("kind",kind||"other");f.append("device",device());f.append("lang",L);f.append("vlat",p.lat);f.append("vlon",p.lon);
      if(a[1]){f.append("lat",a[1].latitude);f.append("lon",a[1].longitude)} f.append("photo",a[0],"photo.jpg");
      return fetch(HSAPI+"/api/collections/place_media/records",{method:"POST",body:f}) })
    .then(function(r){ if(!r.ok)throw 0; markDone("ph:"+p.id+":"+Date.now()); toast(t("ph_sent")); loadProof(p) }).catch(function(){toast(t("sendFail"))}) }
function sendLink(p){ var pl=$("lkP").value, u=$("lkU").value.trim(); if(!u){$("lkU").focus();return} if(!/^https?:\\/\\//i.test(u))u="https://"+u;
  fetch(HSAPI+"/api/collections/place_links/records",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({osm:p.id,platform:pl,url:u,device:device()})})
    .then(function(r){ if(r.ok){markDone("lk:"+p.id+":"+pl);toast(t("lk_ok"));loadProof(p)} else toast(t("lk_bad")) }).catch(function(){toast(t("sendFail"))}) }
function flagMedia(id){ fetch(HSAPI+"/api/collections/media_flags/records",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({media:id,device:device()})})
    .then(function(r){ if(r.ok||r.status===400){toast(t("thanks"));if(r.ok)MFLAG[id]=(MFLAG[id]||0)+(ME&&ME.w||1);if(CUR)renderPage()} }).catch(function(){toast(t("sendFail"))}) }
'''+s[b:]
rep('''    chainSrc(p)+'<div class="ppbox help2"><h3>'+esc(t("pg_help"))+'</h3>''','''    chainSrc(p)+mediaHTML(p)+'<div class="ppbox help2"><h3>'+esc(t("pg_help"))+'</h3>''')
rep('<div id="pp" hidden><div class="ppin">','<div id="pp" hidden><input type="file" id="mediaIn" accept="image/*" capture="environment" hidden><div class="ppin">')
rep('''    if(HSAPI_OK)pageCounts(p);''','''    if(HSAPI_OK){pageCounts(p);loadProof(p)}''')
rep('''  var op=e.target.closest("[data-open]");''','''  if(e.target.closest("#phOpen")){$("phKinds").hidden=!$("phKinds").hidden;return}
  var pk2=e.target.closest("[data-phk]"); if(pk2){phKind=pk2.dataset.phk;$("mediaIn").click();return}
  var fl=e.target.closest("[data-flag]"); if(fl){flagMedia(fl.dataset.flag);fl.disabled=true;return}
  if(e.target.closest("#lkOpen")){$("lkF").hidden=!$("lkF").hidden;if(!$("lkF").hidden)$("lkU").focus();return}
  var op=e.target.closest("[data-open]");''')
rep('''$("psort").addEventListener("change",''','''$("mediaIn").addEventListener("change",function(){var f=this.files&&this.files[0];this.value="";if(f&&CUR)sendMedia(CUR,f,phKind)});
document.addEventListener("submit",function(e){if(e.target&&e.target.id==="lkF"){e.preventDefault();if(CUR)sendLink(CUR)}});
$("psort").addEventListener("change",''')
rep('.see{display:flex;','''.phg{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-bottom:6px}
.ph{margin:0;display:flex;flex-direction:column;gap:4px}.ph .zoom{width:100%;height:auto;aspect-ratio:1}.ph .zoom img{object-fit:cover}
.ph figcaption{font-size:12px;display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center}.onsite{color:var(--go);font-weight:700}
.phr{font:inherit;font-size:12px;background:none;border:0;padding:0;color:var(--muted);text-decoration:underline;cursor:pointer;margin-inline-start:auto}
#phOpen{align-self:flex-start;display:inline-flex;gap:8px;align-items:center}
.see a.exact{border-color:var(--go);color:var(--go);font-weight:700}
.lkF{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.lkF select,.lkF input{font:inherit;font-size:16px;padding:9px 12px;border-radius:12px;border:1.5px solid var(--line);background:var(--card);color:var(--ink)}.lkF input{flex:1 1 200px;min-width:0}
.see{display:flex;''')
open('index.html','w').write(s)
print("ok")
