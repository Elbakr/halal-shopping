import sys,json
sys.path.insert(0,'scripts')
from i18n_extra import KEYS13,X13
s=open('index.html').read()
def rep(a,c):
    global s
    assert a in s,("MISSING",a[:90]); s=s.replace(a,c,1)
for l in ["fr","nl","en","ar"]:
    extra=",".join('%s:%s'%(k,json.dumps(v,ensure_ascii=False)) for k,v in zip(KEYS13,X13[l]))
    rep(l+':{ph_title:',l+':{'+extra+',ph_title:')
WA='<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.2-.2-.5-.3z"/></svg>'
# --- videos per additive (checked one by one: existing, embeddable, identified channel)
rep('function renderGuide(){','''// "See to understand": real footage of how some additives are made. Only identified sources, checked one by one.
var VIDS={e120:[["iBNySB2jpVg","Business Insider"],["0g3YcqrfiKQ","Le Parisien"],["JuGfWVBjOxU","Deep Look (PBS)"]],
  e441:[["6bYIow9pc6M","GELITA"]], e904:[["iEkKwOWZS_E","Business Insider"]], e920:[["ipTB2rgxQwk","New York Post"]],
  e471:[["yk1Pfsuf83Y","Yasir Qadhi"],["zEGV9qwLulQ","Assim al-Hakeem"]]};
var PLAY='<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z"/></svg>';
function vidBtn(k){return VIDS[k]?'<button type="button" class="vb" data-vid="'+k+'">'+PLAY+esc(t("vid_btn"))+'</button>':""}
function wa(text,url){return "https://wa.me/?text="+encodeURIComponent(text+" "+url)}
function openVid(k,i){ var v=VIDS[k]; if(!v)return; i=i||0; if(L==="fr"&&!arguments[1]){for(var j=0;j<v.length;j++)if(v[j][1]==="Le Parisien"){i=j;break}}
  var url="https://halal.shopping/#a="+k;
  $("vmb").innerHTML='<h2><code>'+k.toUpperCase()+'</code> '+esc(addN(k))+'</h2><p class="vw">⚠ '+esc(t("vid_warn"))+'</p>'+
    '<div class="vf"><iframe src="https://www.youtube-nocookie.com/embed/'+v[i][0]+'?rel=0&playsinline=1&modestbranding=1" title="'+esc(addN(k))+'" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>'+
    '<p class="src">'+esc(t("vid_src"))+' : '+v.map(function(x,j){return '<button type="button" class="vs'+(j===i?" on":"")+'" data-vid="'+k+'" data-vi="'+j+'">'+esc(x[1])+'</button>'}).join(" ")+'</p>'+
    '<p>'+esc(addW(k))+'</p><div class="ppacts"><a class="btn wa" target="_blank" rel="noopener" href="'+wa(t("wa_add").replace("{x}",k.toUpperCase()+" ("+addN(k)+")"),url)+'">'+'''+json.dumps(WA)+'''+esc(t("wa"))+'</a></div>';
  $("vm").hidden=false; document.body.style.overflow="hidden";
  try{if(location.hash!=="#a="+k)history.pushState(null,"",location.pathname+location.search+"#a="+k)}catch(e){} }
function closeVid(){ if($("vm").hidden)return; $("vmb").innerHTML=""; $("vm").hidden=true; if($("pp").hidden)document.body.style.overflow="";
  if(/^#a=/.test(location.hash)){try{history.pushState(null,"",location.pathname+location.search)}catch(e){}} }
function renderGuide(){''')
rep('''  $("guide").innerHTML=Object.keys(ADD).map(function(k){var a=ADD[k];return "<tr><td><code>"+k.toUpperCase()+"</code></td><td><b>"+esc(addN(k))+"</b><br>"+esc(addW(k))+"</td></tr>"}).join("");''','''  $("guide").innerHTML=Object.keys(ADD).map(function(k){var a=ADD[k];return "<tr><td><code>"+k.toUpperCase()+"</code></td><td><b>"+esc(addN(k))+"</b><br>"+esc(addW(k))+vidBtn(k)+"</td></tr>"}).join("");''')
rep('''+'</b><p>'+esc(addW(k))+'</p></div>'}).join("");''','''+'</b><p>'+esc(addW(k))+'</p>'+vidBtn(k)+'</div>'}).join("");''')
rep('''    return '<div class="flag"><code class="'+f.lvl+'">'+esc(f.code)+'</code><p>'+esc(nm+why)+'</p></div>'}).join("");''','''    return '<div class="flag"><code class="'+f.lvl+'">'+esc(f.code)+'</code><p>'+esc(nm+why)+(f.type==="add"?" "+vidBtn(f.key):"")+'</p></div>'}).join("");''')
# modal
rep('<div id="pp" hidden>','<div id="vm" hidden><div class="ppin"><button type="button" class="btn" id="vmx">← <span data-t="pg_back"></span></button><div id="vmb"></div><p class="ppby">build by Uxlab.ai</p></div></div>\n<div id="pp" hidden>')
rep('''  var op=e.target.closest("[data-open]");''','''  var vb=e.target.closest("[data-vid]"); if(vb){openVid(vb.dataset.vid,vb.dataset.vi?+vb.dataset.vi:0);return}
  if(e.target.closest("#vmx")){closeVid();return}
  var op=e.target.closest("[data-open]");''')
rep('''function fromHash(){''','''function fromHash(){ var av=location.hash.match(/^#a=(e\\d{3,4}[a-z]?)$/); if(av){openVid(av[1]);return} if(!$("vm").hidden){$("vmb").innerHTML="";$("vm").hidden=true;document.body.style.overflow=""}
  ''')
rep('''document.addEventListener("keydown",function(e){if(e.key==="Escape"){if(!$("lb").hidden)$("lb").hidden=true;else closePlace()}});''','''document.addEventListener("keydown",function(e){if(e.key==="Escape"){if(!$("lb").hidden)$("lb").hidden=true;else if(!$("vm").hidden)closeVid();else closePlace()}});''')
# --- WhatsApp: product, venue, invitation
rep('''<button type="button" class="btn" id="follow">''','''<a class="btn wa" id="waP" target="_blank" rel="noopener" href="'+wa(pname(p)+" — "+t("s_"+r.status)+" :","https://halal.shopping/#p"+p.code)+'">'''+WA+''''+esc(t("wa"))+'</a><button type="button" class="btn" id="follow">''')
rep(''''<button type="button" class="btn" id="ppshare">'+esc(t("share"))+'</button></div>''',''''<a class="btn wa" target="_blank" rel="noopener" href="'+wa(t("wa_place")+" "+p.name+(placeAddr(p)?" ("+placeAddr(p)+")":""),"https://halal.shopping/#l"+p.id)+'">'''+WA+''''+esc(t("wa"))+'</a><button type="button" class="btn" id="ppshare">'+esc(t("share"))+'</button></div>''')
rep('''    <div class="cstat" id="cstat" hidden></div>''','''    <div class="cstat" id="cstat" hidden></div>
    <div class="invite"><b data-t="inv_t"></b><span data-t="inv_l"></span><a class="btn wa" id="inv" target="_blank" rel="noopener" href="https://wa.me/">'''+WA+'''<span data-t="inv_btn"></span></a></div>''')
rep('''  renderShelves(); renderTraps(); renderGuide();''','''  $("inv").href=wa(t("inv_msg"),"https://halal.shopping/?lang="+L);
  renderShelves(); renderTraps(); renderGuide();''')
rep('.see{display:flex;','''.vb{font:inherit;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:6px;margin-top:6px;padding:6px 11px;border-radius:999px;border:1.5px solid var(--stop);color:var(--stop);background:transparent;cursor:pointer}
#vm{position:fixed;inset:0;z-index:45;background:var(--paper);overflow:auto;-webkit-overflow-scrolling:touch}
#vmb{display:flex;flex-direction:column;gap:12px}#vmb h2{margin:0;font-family:var(--f-display);font-size:26px;line-height:1.15}#vmb h2 code{font-family:var(--f-mono);font-size:.8em}
.vw{margin:0;font-weight:700;color:var(--stop)}
.vf{position:relative;width:100%;aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#000}.vf iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.vs{font:inherit;font-size:13px;padding:5px 10px;border-radius:999px;border:1.5px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer}.vs.on{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.btn.wa{display:inline-flex;align-items:center;gap:8px;background:#1f9d55;border-color:#1f9d55;color:#fff;text-decoration:none}
.invite{display:flex;flex-direction:column;gap:6px;align-items:flex-start;border:1px solid rgba(255,255,255,.25);border-radius:16px;padding:12px 14px;font-size:14px}
.invite b{font-size:15px}
.see{display:flex;''')
open('index.html','w').write(s)
print("ok")
