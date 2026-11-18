// Pure analysis: product -> {status, flags[]}
function analyse(p){
  var labels=(p.labels_tags||[]).concat(p.labels_hierarchy||[]).map(function(s){return String(s).toLowerCase()});
  var halal=labels.some(function(l){return /halal|hallal|helal/.test(l)});
  var certTag=labels.filter(function(l){return /halal|hallal|helal/.test(l)})[0]||"";
  var flags=[], seen={};
  (p.additives_tags||[]).forEach(function(t){
    var m=String(t).toLowerCase().replace(/^[a-z]{2}:/,"").match(/^(e\d{3})/); var k=m?m[1]:"";
    if(ADD[k]&&!seen[k]){seen[k]=1;flags.push({code:k.toUpperCase(),lvl:ADD[k].lvl,key:k,type:"add"})}
  });
  var txt=(p.ingredients_text||"")+" "+(p.ingredients_text_fr||"")+" "+(p.ingredients_text_en||"");
  WORDS.forEach(function(w){
    var m=txt.match(w.re);
    if(!m||seen[w.k])return;
    if(w.k==="gelatin"&&(SAFE_GEL.test(txt)||seen.e441))return;
    seen[w.k]=1; flags.push({code:m[1]||m[0],lvl:w.lvl,key:w.k,type:"word"});
  });
  var bad=flags.some(function(f){return f.lvl==="bad"});
  var check=flags.some(function(f){return f.lvl==="check"});
  var status = bad ? (halal?"conflict":"bad") : halal ? "ok" : check ? "check" : (txt.trim()? "none":"empty");
  return {status:status,halal:halal,certTag:certTag,flags:flags};
}
