// ===== Organisations that certify products and venues (certification bodies, authorities, mosques, federations) =====
var OKINDS=["certifier","authority","mosque","federation","association","other"], OCC={}, ORGS=null;
function orgKey(){return store("hs_org")||""}
function orgAPI(path,opt){opt=opt||{};opt.headers=opt.headers||{};opt.headers["X-Org-Key"]=orgKey();return fetch(HSAPI+path,opt)}
function fdate(s){if(!s)return "";var d=new Date(String(s).replace(" ","T"));if(isNaN(d))return "";try{return d.toLocaleDateString(L==="ar"?"ar":L,{day:"numeric",month:"long",year:"numeric"})}catch(e){return d.toISOString().slice(0,10)}}
function logoURL(o,thumb){return o.logo?HSAPI+"/api/files/orgs/"+o.id+"/"+o.logo+(thumb?"?thumb=160x160":""):""}
function docURL(i){return i.doc?HSAPI+"/api/files/org_items/"+i.id+"/"+i.doc:""}
// badge on a product or a venue: "Certified halal by X", number, validity, document
function orgCertsHTML(list){ if(!list||!list.length)return "";
  return list.map(function(i){var o=(i.expand||{}).org||{},exp=i.until&&new Date(String(i.until).replace(" ","T"))<new Date(),lg=logoURL(o,true);
    return '<div class="oc'+(exp?" exp":"")+'">'+(lg?'<img src="'+esc(lg)+'" alt="">':'<span class="ocs">✓</span>')+'<div><b>'+esc(t("oc_by").replace("{x}",o.name||""))+'</b><span>'+
      [i.certno?t("oc_no").replace("{x}",i.certno):"",i.until?(exp?t("oc_exp"):t("oc_until")).replace("{x}",fdate(i.until)):"",i.scope||""].filter(Boolean).map(esc).join(" · ")+'</span><span>'+
      (i.doc?'<a target="_blank" rel="noopener" href="'+esc(docURL(i))+'">'+esc(t("oc_doc"))+'</a> · ':"")+'<a href="#org='+esc(o.id)+'">'+esc(t("oc_page"))+'</a></span></div></div>'}).join("")}
function loadOrgCerts(target,code,elId){ var k=target+":"+code, fill=function(){var el=$(elId);if(el)el.innerHTML=orgCertsHTML(OCC[k])};
  if(OCC[k]){fill();return} if(!HSAPI_OK||!code)return;
  fetch(HSAPI+"/api/collections/org_items/records?perPage=20&expand=org&filter="+encodeURIComponent("target='"+target+"'&&code='"+code+"'")).then(function(r){return r.ok?r.json():{items:[]}}).then(function(j){OCC[k]=j.items||[];fill()}).catch(function(){}) }
// home section: verified organisations
function loadOrgs(){ if(!HSAPI_OK)return; $("orgBox").hidden=false;
  fetch(HSAPI+"/api/collections/orgs/records?perPage=60&sort=name").then(function(r){return r.ok?r.json():{items:[]}}).then(function(j){ORGS=j.items||[];
    $("orgList").innerHTML=ORGS.map(function(o){var lg=logoURL(o,true);return '<a class="orgc" href="#org='+esc(o.id)+'">'+(lg?'<img src="'+esc(lg)+'" alt="">':"")+'<b>'+esc(o.name)+'</b><span>'+esc(t("k_"+o.kind)+(o.country?" · "+region(o.country):""))+'</span></a>'}).join("")}).catch(function(){}) }
function omOpen(h){$("omb").innerHTML=h;$("om").hidden=false;document.body.style.overflow="hidden";$("om").scrollTop=0}
function omClose(){if($("om").hidden)return;$("om").hidden=true;document.body.style.overflow="";if(/^#org=/.test(location.hash)){try{history.pushState(null,"",location.pathname+location.search)}catch(e){}}}
function field(id,label,type,extra){return '<label class="of"><span>'+esc(t(label))+'</span><input id="'+id+'" type="'+(type||"text")+'"'+(extra||"")+'></label>'}
// registration
function orgRegHTML(){ return '<h2>'+esc(t("org_space"))+'</h2><p>'+esc(t("org_cta_l"))+'</p><form id="orgF" class="ofm" novalidate>'+
  field("oName","org_name","text",' maxlength="120" required')+
  '<label class="of"><span>'+esc(t("org_kind"))+'</span><select id="oKind">'+OKINDS.map(function(k){return '<option value="'+k+'">'+esc(t("k_"+k))+'</option>'}).join("")+'</select></label>'+
  '<label class="of"><span>'+esc(t("org_country"))+'</span><select id="oCountry"><option value=""></option>'+Object.keys(COUNTRY).sort(function(a,b){return region(a).localeCompare(region(b))}).map(function(c){return '<option value="'+c+'"'+(c===(store("hs_cc")||"")?" selected":"")+'>'+esc(region(c))+'</option>'}).join("")+'</select></label>'+
  field("oWeb","org_web","url",' placeholder="https://"')+field("oEmail","org_email","email",' required')+field("oPhone","org_phone","tel")+field("oContact","org_contact")+field("oRegno","org_regno")+
  '<label class="of"><span>'+esc(t("org_about"))+'</span><textarea id="oAbout" maxlength="600" rows="3"></textarea></label>'+
  '<button type="submit" class="btn solid">'+esc(t("org_send"))+'</button></form>'}
function orgRegister(){ var b={name:$("oName").value,kind:$("oKind").value,country:$("oCountry").value,website:$("oWeb").value,email:$("oEmail").value,phone:$("oPhone").value,contact:$("oContact").value,regno:$("oRegno").value,about:$("oAbout").value,lang:L};
  if(b.name.trim().length<2||!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(b.email.trim())){toast(t("org_err"));return}
  fetch(HSAPI+"/api/hs/org/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){
    store("hs_org",j.key); var link="https://halal.shopping/#o="+j.key;
    omOpen('<h2>'+esc(t("org_space"))+'</h2><div class="ppbox"><p><b>'+esc(t("org_sent"))+'</b></p><input class="okey" readonly value="'+esc(link)+'"><div class="ppacts"><button type="button" class="btn solid" id="oCopy">'+esc(t("org_copy"))+'</button><a class="btn" href="mailto:'+esc(b.email.trim())+'?subject='+encodeURIComponent("halal.shopping — "+t("org_space"))+'&body='+encodeURIComponent(link)+'">'+esc(t("org_mail"))+'</a></div></div><p>'+esc(t("org_pending"))+'</p>');
    $("oCopy").onclick=function(){if(navigator.clipboard)navigator.clipboard.writeText(link).then(function(){toast(t("copied"))})}
  }).catch(function(){toast(t("org_err"))}) }
// private space of an organisation
function openOrgSpace(){ if(!HSAPI_OK){toast(t("offline"));return} if(!orgKey()){omOpen(orgRegHTML());return}
  orgAPI("/api/hs/org/me").then(function(r){if(r.status===404){try{localStorage.removeItem("hs_org")}catch(e){} omOpen(orgRegHTML());throw 1} if(!r.ok)throw 0;return r.json()}).then(orgDash).catch(function(e){if(e!==1)toast(t("offline"))}) }
function orgDash(j){ var o=j.org, it=j.items, lg=logoURL(o,true), st=o.status;
  var h='<div class="ohead">'+(lg?'<img src="'+esc(lg)+'" alt="">':"")+'<div><h2>'+esc(o.name)+'</h2><p class="src">'+esc(t("k_"+o.kind)+(o.country?" · "+region(o.country):""))+'</p></div></div>'+
    '<div class="ost '+st+'">'+esc(t("org_"+st))+'</div>';
  if(st==="verified"){
    h+='<form id="oiF" class="ppbox ofm" novalidate><h3>'+esc(t("org_add"))+'</h3><div class="seg"><label><input type="radio" name="oiT" value="product" checked> '+esc(t("org_t_product"))+'</label><label><input type="radio" name="oiT" value="place"> '+esc(t("org_t_place"))+'</label></div>'+
      field("oiCode","org_code_p","text",' inputmode="numeric" autocomplete="off"')+field("oiNo","org_certno")+field("oiUntil","org_until","date")+field("oiScope","org_scope")+
      '<label class="of"><span>'+esc(t("org_doc"))+'</span><input id="oiDoc" type="file" accept="application/pdf,image/*"></label><button type="submit" class="btn solid">'+esc(t("org_save"))+'</button></form>'+
      '<div class="ppbox ofm"><h3>'+esc(t("org_bulk_t"))+'</h3><p class="src">'+esc(t("org_bulk"))+'</p><textarea id="oBulk" rows="4" placeholder="3017620422003;HC-2026-01;2027-06-30"></textarea><button type="button" class="btn" id="oBulkGo">'+esc(t("org_bulk_btn"))+'</button></div>'+
      '<div class="ppbox"><h3>'+esc(t("org_list").replace("{n}",it.filter(function(i){return i.active}).length))+'</h3>'+(it.length?'<div class="olist">'+it.map(function(i){return '<div class="oli'+(i.active?"":" off")+'"><div><b>'+esc(i.label||i.code)+'</b><span>'+esc([i.target==="product"?i.code:"",i.certno,i.until?t("oc_until").replace("{x}",fdate(i.until)):""].filter(Boolean).join(" · "))+'</span></div><button type="button" class="btn" data-oi="'+esc(i.id)+'" data-on="'+(i.active?0:1)+'">'+esc(t(i.active?"org_withdraw":"org_restore"))+'</button></div>'}).join("")+'</div>':"")+'</div>'+
      '<div class="ppacts"><a class="btn" href="#org='+esc(o.id)+'">'+esc(t("org_public"))+'</a></div>';
  }
  h+='<div class="ppbox ofm"><h3>'+esc(t("org_logo"))+'</h3><input id="oLogo" type="file" accept="image/*"><label class="of"><span>'+esc(t("org_about"))+'</span><textarea id="oAbout2" maxlength="600" rows="3">'+esc(o.about||"")+'</textarea></label><button type="button" class="btn" id="oSaveCard">'+esc(t("org_save"))+'</button></div>'+
    '<p><button type="button" class="linkb" id="oLeave">'+esc(t("org_leave"))+'</button></p>';
  omOpen(h); ORGME=o; }
var ORGME=null;
function codeOf(target,v){v=String(v||"").trim(); if(target==="product"){v=v.replace(/\D/g,"");return /^\d{8,14}$/.test(v)?v:""} var m=v.match(/(?:^|[#\/l])([nwr]\d{1,20}|u[a-z0-9]{15})(?:$|[?#&])/)||v.match(/^([nwr]\d{1,20}|u[a-z0-9]{15})$/);return m?m[1]:""}
function labelOf(target,code){ if(target==="product")return fetch("https://world.openfoodfacts.org/api/v2/product/"+code+".json?fields=product_name,brands").then(function(r){return r.json()}).then(function(j){var p=j.product||{};return ((p.product_name||"")+(p.brands?" · "+p.brands.split(",")[0]:"")).slice(0,120)}).catch(function(){return ""});
  return findPlace(code).then(function(p){return (p.name||"")+(p.city?" · "+p.city:"")}).catch(function(){return ""}) }
function orgSendItem(){ var target=(document.querySelector('input[name="oiT"]:checked')||{}).value||"product", code=codeOf(target,$("oiCode").value);
  if(!code){toast(t("org_badcode"));return} var btn=document.querySelector("#oiF button[type=submit]"); btn.disabled=true;
  labelOf(target,code).then(function(label){ var f=new FormData(); f.append("org",ORGME.id);f.append("target",target);f.append("code",code);f.append("label",label);f.append("certno",$("oiNo").value.trim());
    if($("oiUntil").value)f.append("until",$("oiUntil").value+" 00:00:00.000Z"); f.append("scope",$("oiScope").value.trim()); if($("oiDoc").files[0])f.append("doc",$("oiDoc").files[0]);
    return orgAPI("/api/collections/org_items/records",{method:"POST",body:f}) }).then(function(r){btn.disabled=false; if(!r.ok)throw 0; toast(t("org_done")); delete OCC[target+":"+code]; openOrgSpace()}).catch(function(){btn.disabled=false;toast(t("org_err"))}) }
function orgBulk(){ var lines=$("oBulk").value.split(/\n/).map(function(s){return s.trim()}).filter(Boolean), ok=0, bad=0, i=0;
  function next(){ if(i>=lines.length){toast(t("org_bulk_res").replace("{n}",ok).replace("{x}",bad));openOrgSpace();return}
    var c=lines[i++].split(/[;,\t]/), code=codeOf("product",c[0]); if(!code){bad++;return next()}
    var b={org:ORGME.id,target:"product",code:code,certno:(c[1]||"").trim().slice(0,60)}; if(/^\d{4}-\d{2}-\d{2}$/.test((c[2]||"").trim()))b.until=c[2].trim()+" 00:00:00.000Z";
    orgAPI("/api/collections/org_items/records",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)}).then(function(r){if(r.ok)ok++;else bad++;next()}).catch(function(){bad++;next()}) }
  if(lines.length)next() }
function orgToggle(id,on){orgAPI("/api/collections/org_items/records/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:!!on})}).then(function(r){if(!r.ok)throw 0;OCC={};openOrgSpace()}).catch(function(){toast(t("org_err"))})}
function orgSaveCard(){var f=new FormData();f.append("about",$("oAbout2").value.trim());if($("oLogo").files[0])f.append("logo",$("oLogo").files[0]);
  orgAPI("/api/collections/orgs/records/"+ORGME.id,{method:"PATCH",body:f}).then(function(r){if(!r.ok)throw 0;toast(t("org_done"));openOrgSpace()}).catch(function(){toast(t("org_err"))})}
// public page of an organisation
function openOrgPublic(id){ if(!HSAPI_OK){setTimeout(function(){if(HSAPI_OK)openOrgPublic(id)},1500);return}
  Promise.all([fetch(HSAPI+"/api/collections/orgs/records/"+id).then(function(r){if(!r.ok)throw 0;return r.json()}),
    fetch(HSAPI+"/api/collections/org_items/records?perPage=200&sort=-created&filter="+encodeURIComponent("org='"+id+"'")).then(function(r){return r.ok?r.json():{items:[]}})]).then(function(a){
    var o=a[0], it=a[1].items||[], lg=logoURL(o,false);
    omOpen('<div class="ohead">'+(lg?'<img src="'+esc(lg)+'" alt="">':"")+'<div><h2>'+esc(o.name)+'</h2><p class="src">'+esc(t("k_"+o.kind)+(o.country?" · "+region(o.country):""))+'</p></div></div><div class="ost verified">'+esc(t("org_verified"))+'</div>'+
      (o.about?'<p>'+esc(o.about)+'</p>':"")+'<div class="ppacts">'+(o.website?'<a class="btn" target="_blank" rel="noopener" href="'+esc(o.website)+'">'+esc(t("pg_site"))+'</a>':"")+(o.regno?'<span class="pt">'+esc(o.regno)+'</span>':"")+'</div>'+
      '<div class="ppbox"><h3>'+esc(t("org_items").replace("{n}",a[1].totalItems||it.length))+'</h3><div class="olist">'+it.map(function(i){var exp=i.until&&new Date(String(i.until).replace(" ","T"))<new Date();
        return '<a class="oli'+(exp?" off":"")+'" href="#'+(i.target==="product"?"p":"l")+esc(i.code)+'"><div><b>'+esc(i.label||i.code)+'</b><span>'+esc([i.certno?t("oc_no").replace("{x}",i.certno):"",i.until?(exp?t("oc_exp"):t("oc_until")).replace("{x}",fdate(i.until)):""].filter(Boolean).join(" · "))+'</span></div></a>'}).join("")+'</div></div>')
  }).catch(function(){toast(t("offline"))}) }
// admin: review organisations
function openOrgAdmin(){ fetch(HSAPI+"/api/hs/org/all?device="+device()).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){
  omOpen('<h2>'+esc(t("org_adm_t"))+'</h2>'+(j.orgs.length?j.orgs.map(function(o){return '<div class="ppbox"><b>'+esc(o.name)+'</b><span class="ost '+o.status+'">'+esc(t("org_"+o.status))+'</span><p class="src">'+esc([t("k_"+o.kind),o.country?region(o.country):"",o.regno,o.items+" ✓"].filter(Boolean).join(" · "))+'</p><p>'+
    [o.website?'<a target="_blank" rel="noopener" href="'+esc(o.website)+'">'+esc(o.website)+'</a>':"",'<a href="mailto:'+esc(o.email)+'">'+esc(o.email)+'</a>',o.phone?esc(o.phone):"",o.contact?esc(o.contact):""].filter(Boolean).join(" · ")+'</p>'+(o.about?'<p class="src">'+esc(o.about)+'</p>':"")+
    '<div class="ppacts">'+(o.status!=="verified"?'<button type="button" class="btn solid" data-orv="'+o.id+'" data-st="verified">'+esc(t("org_ok"))+'</button>':"")+(o.status==="pending"?'<button type="button" class="btn" data-orv="'+o.id+'" data-st="rejected">'+esc(t("org_no"))+'</button>':"")+(o.status==="verified"?'<button type="button" class="btn" data-orv="'+o.id+'" data-st="suspended">'+esc(t("org_susp"))+'</button>':"")+'<button type="button" class="btn" data-orv="'+o.id+'" data-st="newkey">'+esc(t("org_newkey"))+'</button></div><div id="nk'+o.id+'"></div></div>'}).join(""):'<p class="src">—</p>'))
}).catch(function(){toast(t("offline"))}) }
function orgReview(id,st){ fetch(HSAPI+"/api/hs/org/review",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(st==="newkey"?{device:device(),id:id,action:"newkey"}:{device:device(),id:id,status:st})}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){
  if(j.key){$("nk"+id).innerHTML='<input class="okey" readonly value="https://halal.shopping/#o='+esc(j.key)+'">';return} ORGS=null;loadOrgs();openOrgAdmin()}).catch(function(){toast(t("org_err"))}) }
document.addEventListener("click",function(e){var x;
  if(e.target.closest("#orgJoin")){openOrgSpace();return}
  if(e.target.closest("#omx")){omClose();return}
  if(e.target.closest("#oBulkGo")){orgBulk();return}
  if(e.target.closest("#oSaveCard")){orgSaveCard();return}
  if(e.target.closest("#oLeave")){try{localStorage.removeItem("hs_org")}catch(_){} omClose();return}
  if(e.target.closest("#orgAdm")){openOrgAdmin();return}
  if((x=e.target.closest("[data-oi]"))){orgToggle(x.dataset.oi,x.dataset.on==="1");return}
  if((x=e.target.closest("[data-orv]"))){orgReview(x.dataset.orv,x.dataset.st);return}
  if((x=e.target.closest('input[name="oiT"]'))){var p=x.value==="product";$("oiCode").inputMode=p?"numeric":"url";$("oiCode").previousElementSibling.textContent=t(p?"org_code_p":"org_code_l");return}
});
document.addEventListener("submit",function(e){if(e.target.id==="orgF"){e.preventDefault();orgRegister()} if(e.target.id==="oiF"){e.preventDefault();orgSendItem()}});
