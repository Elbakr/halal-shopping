
(function(){
"use strict";
// ---------- Ingredient knowledge (the product's core) ----------
// level: bad = animal/alcohol origin that excludes halal unless certified; check = origin can be animal, ask the brand
var ADD = {
  "e120":{lvl:"bad",n:{fr:"Carmin (cochenille)",nl:"Karmijn (cochenille)",en:"Carmine (cochineal)",ar:"الكارمين (قرمز)"},w:{fr:"Colorant tiré d'insectes. Refusé par la plupart des organismes halal.",nl:"Kleurstof uit insecten. Door de meeste halalinstanties geweigerd.",en:"Dye made from insects. Rejected by most halal bodies.",ar:"صبغة من الحشرات، ترفضها معظم هيئات الحلال."}},
  "e441":{lvl:"bad",n:{fr:"Gélatine",nl:"Gelatine",en:"Gelatine",ar:"الجيلاتين"},w:{fr:"Souvent de porc. Acceptable seulement si l'origine bovine halal ou poisson est indiquée.",nl:"Vaak van varken. Alleen aanvaardbaar als halal rund of vis vermeld staat.",en:"Often from pork. Acceptable only if halal beef or fish origin is stated.",ar:"غالباً من الخنزير، مقبول فقط إذا ذُكر مصدر بقري حلال أو سمكي."}},
  "e542":{lvl:"bad",n:{fr:"Phosphate d'os",nl:"Beenderfosfaat",en:"Bone phosphate",ar:"فوسفات العظام"},w:{fr:"Fabriqué à partir d'os d'animaux.",nl:"Gemaakt van dierenbeenderen.",en:"Made from animal bones.",ar:"مصنوع من عظام الحيوانات."}},
  "e904":{lvl:"check",n:{fr:"Gomme-laque",nl:"Schellak",en:"Shellac",ar:"اللك"},w:{fr:"Sécrétion d'insecte. Les avis divergent.",nl:"Afscheiding van insecten. Meningen verschillen.",en:"Insect secretion. Opinions differ.",ar:"إفراز حشري، الآراء مختلفة."}},
  "e920":{lvl:"check",n:{fr:"L-cystéine",nl:"L-cysteïne",en:"L-cysteine",ar:"إل-سيستين"},w:{fr:"Peut venir de plumes ou de poils. Demandez l'origine.",nl:"Kan uit veren of haar komen. Vraag de herkomst.",en:"Can come from feathers or hair. Ask for the origin.",ar:"قد يأتي من الريش أو الشعر، اسأل عن المصدر."}},
  "e422":{lvl:"check",n:{fr:"Glycérol",nl:"Glycerol",en:"Glycerol",ar:"الجليسرول"},w:{fr:"Végétal ou animal selon le fabricant.",nl:"Plantaardig of dierlijk, afhankelijk van de fabrikant.",en:"Plant or animal, depending on the maker.",ar:"نباتي أو حيواني حسب المصنع."}},
  "e470":{lvl:"check",n:{fr:"Sels d'acides gras",nl:"Zouten van vetzuren",en:"Fatty acid salts",ar:"أملاح الأحماض الدهنية"},w:{fr:"Origine animale possible.",nl:"Dierlijke herkomst mogelijk.",en:"May be of animal origin.",ar:"قد يكون من أصل حيواني."}},
  "e471":{lvl:"check",n:{fr:"Mono- et diglycérides",nl:"Mono- en diglyceriden",en:"Mono- and diglycerides",ar:"أحادي وثنائي الجليسريد"},w:{fr:"Très courant, végétal ou animal. Seule la marque peut répondre.",nl:"Zeer gangbaar, plantaardig of dierlijk. Alleen het merk weet het.",en:"Very common, plant or animal. Only the brand can tell.",ar:"شائع جداً، نباتي أو حيواني، الشركة وحدها تعرف."}},
  "e472":{lvl:"check",n:{fr:"Esters de mono- et diglycérides",nl:"Esters van mono- en diglyceriden",en:"Esters of mono- and diglycerides",ar:"إسترات أحادي وثنائي الجليسريد"},w:{fr:"Même question d'origine que E471.",nl:"Zelfde herkomstvraag als E471.",en:"Same origin question as E471.",ar:"نفس سؤال المصدر مثل E471."}},
  "e473":{lvl:"check",n:{fr:"Sucroesters",nl:"Sucrose-esters",en:"Sucrose esters",ar:"إسترات السكروز"},w:{fr:"Acides gras d'origine variable.",nl:"Vetzuren van wisselende herkomst.",en:"Fatty acids of varying origin.",ar:"أحماض دهنية متنوعة المصدر."}},
  "e481":{lvl:"check",n:{fr:"Stéaroyl-lactylate de sodium",nl:"Natriumstearoyllactylaat",en:"Sodium stearoyl lactylate",ar:"ستيرويل لاكتيلات الصوديوم"},w:{fr:"Acide stéarique végétal ou animal.",nl:"Stearinezuur plantaardig of dierlijk.",en:"Stearic acid, plant or animal.",ar:"حمض دهني نباتي أو حيواني."}},
  "e570":{lvl:"check",n:{fr:"Acide stéarique",nl:"Stearinezuur",en:"Stearic acid",ar:"حمض الستياريك"},w:{fr:"Végétal ou animal.",nl:"Plantaardig of dierlijk.",en:"Plant or animal.",ar:"نباتي أو حيواني."}},
  "e631":{lvl:"check",n:{fr:"Inosinate disodique",nl:"Dinatriuminosinaat",en:"Disodium inosinate",ar:"إينوسينات ثنائي الصوديوم"},w:{fr:"Parfois tiré de viande ou de poisson.",nl:"Soms uit vlees of vis.",en:"Sometimes made from meat or fish.",ar:"يُستخرج أحياناً من اللحم أو السمك."}},
  "e635":{lvl:"check",n:{fr:"Ribonucléotides",nl:"Ribonucleotiden",en:"Ribonucleotides",ar:"ريبونوكليوتيدات"},w:{fr:"Contient E631, même question d'origine.",nl:"Bevat E631, zelfde herkomstvraag.",en:"Contains E631, same origin question.",ar:"يحتوي على E631، نفس سؤال المصدر."}}
};
var WORDS = [
  {re:/\b(porc|pork|varken\w*|lard|saindoux|bacon|jambon|ham\b|chorizo|pepperoni|schweine\w*)/i,lvl:"bad",k:"pork"},
  {re:/\b(alcool|alcohol|ethanol|éthanol|vin\b|wine|wijn|rhum|rum\b|bi[eè]re|beer|bier\b|liqueur|likeur|cognac|brandy|whisky|vodka|kirsch|marsala|amaretto)/i,lvl:"bad",k:"alcohol"},
  {re:/\b(g[ée]latine?)\b/i,lvl:"bad",k:"gelatin"},
  {re:/\b(pr[ée]sure|rennet|stremsel|lebferment)/i,lvl:"check",k:"rennet"},
  {re:/\b(ar[ôo]me naturel|natural flavou?r|natuurlijk aroma)/i,lvl:"info",k:"aroma"}
];
var WTXT = {
  pork:{fr:"Ingrédient de porc cité dans la liste.",nl:"Varkensingrediënt in de lijst.",en:"Pork ingredient listed.",ar:"مكوّن من الخنزير مذكور في القائمة."},
  alcohol:{fr:"Alcool ou boisson alcoolisée cité dans la liste.",nl:"Alcohol of alcoholische drank in de lijst.",en:"Alcohol or an alcoholic drink is listed.",ar:"كحول أو مشروب كحولي مذكور في القائمة."},
  gelatin:{fr:"Gélatine sans origine indiquée : souvent de porc.",nl:"Gelatine zonder herkomst: vaak van varken.",en:"Gelatine with no stated origin: often pork.",ar:"جيلاتين بدون مصدر محدد، غالباً من الخنزير."},
  rennet:{fr:"Présure : peut être animale. Demandez l'origine.",nl:"Stremsel: kan dierlijk zijn. Vraag de herkomst.",en:"Rennet: may be animal. Ask for the origin.",ar:"المنفحة قد تكون حيوانية، اسأل عن المصدر."},
  aroma:{fr:"Arôme naturel : le support peut contenir de l'alcool.",nl:"Natuurlijk aroma: de drager kan alcohol bevatten.",en:"Natural flavouring: the carrier can contain alcohol.",ar:"نكهة طبيعية: قد تحتوي المادة الحاملة على كحول."}
};
var SAFE_GEL = /(g[ée]latine?|gelatine)\s*(de|of|van)?\s*(b(oe|œ)uf|bovine?|beef|rund\w*|poisson|fish|vis)\b/i;


// Pure analysis: product -> {status, flags[]}
function analyse(p){
  var labels=(p.labels_tags||[]).concat(p.labels_hierarchy||[]).map(function(s){return String(s).toLowerCase()});
  var halal=labels.some(function(l){return /halal|hallal|helal/.test(l)});
  var certTag=labels.filter(function(l){return /halal|hallal|helal/.test(l)})[0]||"";
  var flags=[], seen={};
  var txt0=(p.ingredients_text||"")+" "+(p.ingredients_text_fr||"")+" "+(p.ingredients_text_en||"");
  (p.additives_tags||[]).forEach(function(t){
    var m=String(t).toLowerCase().replace(/^[a-z]{2}:/,"").match(/^(e\d{3})/); var k=m?m[1]:"";
    if(ADD[k]&&!seen[k]){seen[k]=1;flags.push({code:k.toUpperCase(),lvl:(k==="e441"&&SAFE_GEL.test(txt0))?"ok":ADD[k].lvl,key:k,type:"add"})}
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


// ---------- Text ----------
var T={
fr:{p_decl:"Déclaré halal",pg_back:"Retour",pg_hours:"Horaires",pg_call:"Appeler",pg_site:"Site web",pg_near:"Près de",pg_src:"Informations issues d'OpenStreetMap et des membres. Aucune certification de notre part.",pg_noinfo:"Pas encore d'horaires ni de téléphone pour cette adresse.",pg_more:"Voir la fiche",pg_take:"À emporter",pg_deliv:"Livraison",pg_help:"Vous connaissez cette adresse ? Votre avis guide les autres.",f_all:"Tout",f_todo:"À confirmer",missionT:"Mission du quartier",missionL:"{n} adresses attendent votre avis près de vous.",missionGo:"Commencer",m_q:"Cet endroit est-il halal ?",m_yes:"Oui, halal",m_no:"Non",m_skip:"Je ne connais pas",m_done:"Mission terminée. Merci !",addBtn:"Ajouter une adresse manquante",addName:"Nom de l'adresse",addHere:"Placez-vous devant l'adresse : nous prenons votre position.",addSend:"Ajouter",addOk:"Adresse ajoutée. Merci !",addedBy:"Ajouté par un membre",lvl1:"Éclaireur",lvl2:"Guide",lvl3:"Sentinelle",lvl4:"Référent",lvlNext:"Encore {n} pour devenir {x}",stats:"{n} contributions de la communauté",addPhoto:"Photo de la devanture (facultatif)",undone:"Signalement annulé.",undoHint:"Une erreur ? Touchez à nouveau votre réponse pour l'annuler.",placesT:"Commerces et restaurants halal",placesL:"Les adresses déclarées halal autour de vous. Confirmez ou corrigez d'un geste.",near:"Autour de moi",cityPh:"Ville ou adresse",find:"Chercher",p_none:"Aucune adresse déclarée halal trouvée ici pour le moment.",p_src:"« Déclaré halal » : indiqué sur OpenStreetMap. « À confirmer » : cuisine habituellement halal, pas encore vérifiée. Votre confirmation fait foi pour les autres. Aucune certification de notre part.",p_maybe:"Souvent halal · à confirmer",p_conf:"Confirmé par {n} membres",route:"Itinéraire",pc_confirm:"Je confirme",pc_not:"Plus halal",pc_closed:"Fermé",geoFail:"Position indisponible. Tapez une ville.",t_rest:"Restaurant",t_fast:"Restauration rapide",t_butcher:"Boucherie",t_shop:"Commerce",helpT:"Aidez la communauté en un geste",q_logo:"Voyez-vous un logo halal sur l'emballage ?",yes:"Oui, je le vois",no:"Non, aucun logo",changedBtn:"La recette a changé",photoIng:"Photo des ingrédients",photoFront:"Photo du produit",thanks:"Merci ! Votre signalement compte.",c_seen:"Logo halal vu par {n} membres",c_notseen:"Aucun logo vu par {n} membres",c_changed:"Recette signalée changée par {n} membres",mine:"Vos contributions : {n}",unknownT:"Produit inconnu. Ajoutez-le en deux photos, sans quitter la page.",sendLogo:"Envoyer une photo du logo halal",sent:"Merci, photo reçue. Elle sera vérifiée avant d'enrichir la fiche.",sendFail:"L'envoi n'a pas abouti. Réessayez dans un instant.",cert:"Organisme cité",certT:"Qui certifie quoi",certL:"Les organismes cités sur les emballages, parmi les 3 000 produits halal les plus scannés.",follow:"Suivre ce produit",following:"Suivi",watchT:"Mes produits suivis",changed:"a changé depuis votre dernière visite",lost:"ne porte plus de mention halal",fix:"Compléter la fiche",changesT:"Changements détectés",chAdd:"additifs modifiés",chIng:"liste d'ingrédients modifiée",byname:"La recherche par nom est saturée en ce moment. Tapez les chiffres du code-barres ou scannez.",h1:"Halal ou pas ?<br><em>Scannez.</em> La réponse en 2 secondes.",sub:"Visez le code-barres d'un produit. Vous voyez s'il porte une mention halal, et chaque ingrédient qui pose question.",camera:"Scanner un produit",check:"Vérifier",photo:"ou envoyer une photo du code-barres",placeholder:"Code-barres ou nom du produit",
 t1:"Gratuit, sans inscription",t2:"Base mondiale de produits",t3:"Plus de 15 langues",
 loading:"Recherche du produit…",notfound:"Ce produit n'est pas encore dans la base. Ajoutez-le en 1 minute, il servira à tout le monde.",offline:"La base produits ne répond pas. Réessayez dans un instant.",nocam:"Caméra indisponible sur cet appareil. Envoyez une photo du code-barres ou tapez les chiffres.",nobar:"Aucun code-barres lu. Reprenez la photo plus près.",camhint:"Visez le code-barres, la lecture est automatique.",
 s_ok:"Halal déclaré",s_bad:"Pas halal",s_conflict:"Halal déclaré, à contrôler",s_check:"À vérifier",s_none:"Aucune mention halal",s_empty:"Ingrédients inconnus",
 e_ok:"La marque déclare ce produit halal. Repérez le logo de l'organisme sur l'emballage.",e_bad:"Un ingrédient de la liste n'est pas halal sans certification.",e_conflict:"Mention halal présente, mais un ingrédient sensible figure dans la liste.",e_check:"L'origine d'un ingrédient n'est pas précisée. Seule la marque peut répondre.",e_none:"Aucun ingrédient à risque trouvé, mais la marque ne déclare pas le produit halal.",e_empty:"La base n'a pas encore la liste d'ingrédients de ce produit.",
 label:"Mention",share:"Partager",copied:"Lien copié",source:"Fiche source",add:"Ajouter ce produit",
 shelvesT:"Produits déclarés halal, rayon par rayon",shelvesL:"Touchez un produit pour voir sa fiche complète.",empty:"Aucun produit trouvé dans ce rayon pour le moment.",
 trapsT:"Les pièges à connaître",trapsL:"Ce que nous traquons dans chaque liste d'ingrédients.",allAdd:"Voir tous les additifs suivis",
 howT:"Comment ça marche",s1:"Scannez",s1p:"Le code-barres suffit. Aucune inscription.",s2:"Lisez le verdict",s2p:"Vert, orange ou rouge, avec la raison écrite en clair.",s3:"Choisissez mieux",s3p:"Des produits du même rayon qui déclarent une mention halal.",
 legal:"halal.shopping ne certifie aucun produit. Nous lisons les mentions déclarées par les marques et les listes d'ingrédients. En cas de doute, l'emballage et l'organisme certificateur font foi.",data:"Données produits : Open Food Facts, licence ODbL.",
 sh:{candies:"Bonbons",chocolates:"Chocolats",biscuits:"Biscuits",sausages:"Charcuterie",meats:"Viandes",cheeses:"Fromages",frozen:"Surgelés",snacks:"Apéritif",beverages:"Boissons"}},
nl:{p_decl:"Opgegeven als halal",pg_back:"Terug",pg_hours:"Openingsuren",pg_call:"Bellen",pg_site:"Website",pg_near:"Dicht bij",pg_src:"Informatie uit OpenStreetMap en van leden. Geen certificering door ons.",pg_noinfo:"Nog geen openingsuren of telefoon voor dit adres.",pg_more:"Fiche bekijken",pg_take:"Afhalen",pg_deliv:"Levering",pg_help:"Ken je dit adres? Jouw mening helpt de anderen.",f_all:"Alles",f_todo:"Te bevestigen",missionT:"Missie in de buurt",missionL:"{n} adressen wachten op jouw mening in de buurt.",missionGo:"Starten",m_q:"Is deze plek halal?",m_yes:"Ja, halal",m_no:"Nee",m_skip:"Ken ik niet",m_done:"Missie volbracht. Bedankt!",addBtn:"Ontbrekend adres toevoegen",addName:"Naam van het adres",addHere:"Ga voor het adres staan: we nemen je locatie.",addSend:"Toevoegen",addOk:"Adres toegevoegd. Bedankt!",addedBy:"Toegevoegd door een lid",lvl1:"Verkenner",lvl2:"Gids",lvl3:"Wachter",lvl4:"Referent",lvlNext:"Nog {n} om {x} te worden",stats:"{n} bijdragen van de gemeenschap",addPhoto:"Foto van de gevel (optioneel)",undone:"Melding ingetrokken.",undoHint:"Vergist? Tik opnieuw op je antwoord om het in te trekken.",placesT:"Halalwinkels en -restaurants",placesL:"Adressen in je buurt die als halal zijn opgegeven. Bevestig of verbeter met één tik.",near:"In mijn buurt",cityPh:"Stad of adres",find:"Zoeken",p_none:"Hier is nog geen als halal opgegeven adres gevonden.",p_src:"'Opgegeven als halal': vermeld op OpenStreetMap. 'Te bevestigen': keuken die meestal halal is, nog niet nagekeken. Jouw bevestiging helpt de anderen. Geen certificering door ons.",p_maybe:"Vaak halal · te bevestigen",p_conf:"Bevestigd door {n} leden",route:"Route",pc_confirm:"Ik bevestig",pc_not:"Niet meer halal",pc_closed:"Gesloten",geoFail:"Locatie niet beschikbaar. Typ een stad.",t_rest:"Restaurant",t_fast:"Fastfood",t_butcher:"Slagerij",t_shop:"Winkel",helpT:"Help de gemeenschap met één tik",q_logo:"Zie je een halallogo op de verpakking?",yes:"Ja, ik zie het",no:"Nee, geen logo",changedBtn:"Het recept is veranderd",photoIng:"Foto van de ingrediënten",photoFront:"Foto van het product",thanks:"Bedankt! Je melding telt mee.",c_seen:"Halallogo gezien door {n} leden",c_notseen:"Geen logo gezien door {n} leden",c_changed:"Recept als gewijzigd gemeld door {n} leden",mine:"Jouw bijdragen: {n}",unknownT:"Onbekend product. Voeg het toe met twee foto's, zonder de pagina te verlaten.",sendLogo:"Foto van het halallogo sturen",sent:"Bedankt, foto ontvangen. Ze wordt gecontroleerd voor ze de fiche aanvult.",sendFail:"Verzenden mislukt. Probeer zo opnieuw.",cert:"Vermelde instantie",certT:"Wie certificeert wat",certL:"De instanties op de verpakkingen, bij de 3 000 meest gescande halalproducten.",follow:"Product volgen",following:"Gevolgd",watchT:"Mijn gevolgde producten",changed:"is veranderd sinds je laatste bezoek",lost:"heeft geen halalvermelding meer",fix:"Fiche aanvullen",changesT:"Vastgestelde wijzigingen",chAdd:"additieven gewijzigd",chIng:"ingrediëntenlijst gewijzigd",byname:"Zoeken op naam is nu overbelast. Typ de cijfers van de barcode of scan.",h1:"Halal of niet?<br><em>Scan.</em> Het antwoord in 2 seconden.",sub:"Richt op de barcode van een product. Je ziet of het een halalvermelding heeft, en elk ingrediënt dat vragen oproept.",camera:"Product scannen",check:"Controleren",photo:"of stuur een foto van de barcode",placeholder:"Barcode of productnaam",
 t1:"Gratis, zonder account",t2:"Wereldwijde productdatabank",t3:"Meer dan 15 talen",
 loading:"Product zoeken…",notfound:"Dit product staat nog niet in de databank. Voeg het in 1 minuut toe, iedereen heeft er baat bij.",offline:"De productdatabank antwoordt niet. Probeer zo opnieuw.",nocam:"Camera niet beschikbaar op dit toestel. Stuur een foto van de barcode of typ de cijfers.",nobar:"Geen barcode gelezen. Neem de foto van dichterbij.",camhint:"Richt op de barcode, het lezen gaat vanzelf.",
 s_ok:"Halal vermeld",s_bad:"Niet halal",s_conflict:"Halal vermeld, te controleren",s_check:"Na te vragen",s_none:"Geen halalvermelding",s_empty:"Ingrediënten onbekend",
 e_ok:"Het merk vermeldt dit product als halal. Zoek het logo van de instantie op de verpakking.",e_bad:"Een ingrediënt in de lijst is niet halal zonder certificering.",e_conflict:"Halalvermelding aanwezig, maar er staat een gevoelig ingrediënt in de lijst.",e_check:"De herkomst van een ingrediënt is niet vermeld. Alleen het merk kan antwoorden.",e_none:"Geen risicovol ingrediënt gevonden, maar het merk vermeldt geen halal.",e_empty:"De databank heeft de ingrediëntenlijst nog niet.",
 label:"Vermelding",share:"Delen",copied:"Link gekopieerd",source:"Bronfiche",add:"Product toevoegen",
 shelvesT:"Producten met halalvermelding, per afdeling",shelvesL:"Tik op een product voor de volledige fiche.",empty:"Nog geen producten gevonden in deze afdeling.",
 trapsT:"De valkuilen",trapsL:"Waar we in elke ingrediëntenlijst naar zoeken.",allAdd:"Alle gevolgde additieven",
 howT:"Zo werkt het",s1:"Scan",s1p:"De barcode volstaat. Geen account.",s2:"Lees het oordeel",s2p:"Groen, oranje of rood, met de reden in gewone taal.",s3:"Kies beter",s3p:"Producten uit dezelfde afdeling met halalvermelding.",
 legal:"halal.shopping certificeert geen enkel product. We lezen de vermeldingen van de merken en de ingrediëntenlijsten. Bij twijfel gelden de verpakking en de certificerende instantie.",data:"Productgegevens: Open Food Facts, ODbL-licentie.",
 sh:{candies:"Snoep",chocolates:"Chocolade",biscuits:"Koekjes",sausages:"Vleeswaren",meats:"Vlees",cheeses:"Kaas",frozen:"Diepvries",snacks:"Aperitief",beverages:"Dranken"}},
en:{p_decl:"Declared halal",pg_back:"Back",pg_hours:"Opening hours",pg_call:"Call",pg_site:"Website",pg_near:"Near",pg_src:"Information from OpenStreetMap and members. No certification on our part.",pg_noinfo:"No opening hours or phone yet for this place.",pg_more:"View details",pg_take:"Takeaway",pg_deliv:"Delivery",pg_help:"Do you know this place? Your opinion guides others.",f_all:"All",f_todo:"To confirm",missionT:"Neighbourhood mission",missionL:"{n} places near you are waiting for your opinion.",missionGo:"Start",m_q:"Is this place halal?",m_yes:"Yes, halal",m_no:"No",m_skip:"I don't know it",m_done:"Mission complete. Thank you!",addBtn:"Add a missing place",addName:"Name of the place",addHere:"Stand in front of the place: we use your position.",addSend:"Add",addOk:"Place added. Thank you!",addedBy:"Added by a member",lvl1:"Scout",lvl2:"Guide",lvl3:"Sentinel",lvl4:"Authority",lvlNext:"{n} more to become {x}",stats:"{n} community contributions",addPhoto:"Photo of the storefront (optional)",undone:"Report withdrawn.",undoHint:"A mistake? Tap your answer again to withdraw it.",placesT:"Halal shops and restaurants",placesL:"Places declared halal around you. Confirm or correct in one tap.",near:"Near me",cityPh:"City or address",find:"Search",p_none:"No place declared halal found here yet.",p_src:"\"Declared halal\": stated on OpenStreetMap. \"To confirm\": a cuisine that is usually halal, not yet checked. Your confirmation guides others. No certification on our part.",p_maybe:"Often halal · to confirm",p_conf:"Confirmed by {n} members",route:"Directions",pc_confirm:"I confirm",pc_not:"No longer halal",pc_closed:"Closed",geoFail:"Location unavailable. Type a city.",t_rest:"Restaurant",t_fast:"Fast food",t_butcher:"Butcher",t_shop:"Shop",helpT:"Help the community in one tap",q_logo:"Do you see a halal logo on the pack?",yes:"Yes, I see it",no:"No logo",changedBtn:"The recipe changed",photoIng:"Photo of the ingredients",photoFront:"Photo of the product",thanks:"Thanks! Your report counts.",c_seen:"Halal logo seen by {n} members",c_notseen:"No logo seen by {n} members",c_changed:"Recipe reported changed by {n} members",mine:"Your contributions: {n}",unknownT:"Unknown product. Add it with two photos, without leaving the page.",sendLogo:"Send a photo of the halal logo",sent:"Thanks, photo received. It will be checked before it enriches the record.",sendFail:"Sending failed. Try again in a moment.",cert:"Certifier named",certT:"Who certifies what",certL:"Certifiers named on packs, among the 3,000 most scanned halal products.",follow:"Follow this product",following:"Following",watchT:"My followed products",changed:"has changed since your last visit",lost:"no longer carries a halal claim",fix:"Complete this record",changesT:"Changes detected",chAdd:"additives changed",chIng:"ingredient list changed",byname:"Search by name is overloaded right now. Type the barcode digits or scan.",h1:"Halal or not?<br><em>Scan.</em> The answer in 2 seconds.",sub:"Point at a product's barcode. See whether it carries a halal claim, and every ingredient that raises a question.",camera:"Scan a product",check:"Check",photo:"or send a photo of the barcode",placeholder:"Barcode or product name",
 t1:"Free, no sign-up",t2:"Worldwide product database",t3:"Over 15 languages",
 loading:"Looking up the product…",notfound:"This product is not in the database yet. Add it in 1 minute, it helps everyone.",offline:"The product database is not answering. Try again in a moment.",nocam:"Camera unavailable on this device. Send a photo of the barcode or type the digits.",nobar:"No barcode read. Take the photo closer.",camhint:"Point at the barcode, it reads automatically.",
 s_ok:"Halal claimed",s_bad:"Not halal",s_conflict:"Halal claimed, check it",s_check:"Needs checking",s_none:"No halal claim",s_empty:"Ingredients unknown",
 e_ok:"The brand claims this product is halal. Look for the certifier's logo on the pack.",e_bad:"An ingredient in the list is not halal without certification.",e_conflict:"Halal claim present, but a sensitive ingredient is listed.",e_check:"An ingredient's origin is not stated. Only the brand can tell.",e_none:"No risky ingredient found, but the brand makes no halal claim.",e_empty:"The database does not have this product's ingredients yet.",
 label:"Claim",share:"Share",copied:"Link copied",source:"Source record",add:"Add this product",
 shelvesT:"Halal-claimed products, aisle by aisle",shelvesL:"Tap a product to see its full record.",empty:"No products found in this aisle yet.",
 trapsT:"The traps to know",trapsL:"What we look for in every ingredient list.",allAdd:"See all tracked additives",
 howT:"How it works",s1:"Scan",s1p:"The barcode is enough. No sign-up.",s2:"Read the verdict",s2p:"Green, amber or red, with the reason in plain words.",s3:"Choose better",s3p:"Products from the same aisle that carry a halal claim.",
 legal:"halal.shopping certifies no product. We read the claims made by brands and the ingredient lists. When in doubt, the pack and the certifying body prevail.",data:"Product data: Open Food Facts, ODbL licence.",
 sh:{candies:"Sweets",chocolates:"Chocolate",biscuits:"Biscuits",sausages:"Cold cuts",meats:"Meat",cheeses:"Cheese",frozen:"Frozen",snacks:"Snacks",beverages:"Drinks"}},
ar:{p_decl:"معلن حلالاً",pg_back:"رجوع",pg_hours:"ساعات العمل",pg_call:"اتصال",pg_site:"الموقع الإلكتروني",pg_near:"بالقرب من",pg_src:"معلومات من OpenStreetMap ومن الأعضاء. لا نمنح أي شهادة.",pg_noinfo:"لا توجد بعد ساعات عمل أو هاتف لهذا العنوان.",pg_more:"عرض البطاقة",pg_take:"طلبات خارجية",pg_deliv:"توصيل",pg_help:"هل تعرف هذا المكان؟ رأيك يفيد الآخرين.",f_all:"الكل",f_todo:"بانتظار التأكيد",missionT:"مهمة الحي",missionL:"{n} عنواناً بالقرب منك بانتظار رأيك.",missionGo:"ابدأ",m_q:"هل هذا المكان حلال؟",m_yes:"نعم، حلال",m_no:"لا",m_skip:"لا أعرفه",m_done:"انتهت المهمة. شكراً!",addBtn:"أضف عنواناً ناقصاً",addName:"اسم المكان",addHere:"قف أمام المكان: سنأخذ موقعك.",addSend:"أضف",addOk:"تمت إضافة العنوان. شكراً!",addedBy:"أضافه أحد الأعضاء",lvl1:"مستكشف",lvl2:"دليل",lvl3:"حارس",lvl4:"مرجع",lvlNext:"بقي {n} لتصبح {x}",stats:"{n} مساهمة من المجتمع",addPhoto:"صورة الواجهة (اختياري)",undone:"تم إلغاء البلاغ.",undoHint:"خطأ؟ المس إجابتك مرة أخرى لإلغائها.",placesT:"متاجر ومطاعم حلال",placesL:"العناوين المعلنة حلالاً بالقرب منك. أكّد أو صحّح بلمسة واحدة.",near:"بالقرب مني",cityPh:"مدينة أو عنوان",find:"بحث",p_none:"لم نجد هنا بعد عناوين معلنة حلالاً.",p_src:"«معلن حلالاً»: مذكور في OpenStreetMap. «بانتظار التأكيد»: مطبخ حلال في العادة ولم يُتحقق منه بعد. تأكيدك يفيد الآخرين. لا نمنح أي شهادة.",p_maybe:"غالباً حلال · بانتظار التأكيد",p_conf:"أكّده {n} عضواً",route:"الاتجاهات",pc_confirm:"أؤكد",pc_not:"لم يعد حلالاً",pc_closed:"مغلق",geoFail:"الموقع غير متاح. اكتب اسم مدينة.",t_rest:"مطعم",t_fast:"وجبات سريعة",t_butcher:"ملحمة",t_shop:"متجر",helpT:"ساعد المجتمع بلمسة واحدة",q_logo:"هل ترى شعار حلال على العبوة؟",yes:"نعم، أراه",no:"لا، لا يوجد شعار",changedBtn:"تغيّرت المكونات",photoIng:"صورة المكونات",photoFront:"صورة المنتج",thanks:"شكراً! بلاغك محسوب.",c_seen:"شعار الحلال رآه {n} عضواً",c_notseen:"لم يرَ الشعار {n} عضواً",c_changed:"أبلغ {n} عضواً عن تغيّر المكونات",mine:"مساهماتك: {n}",unknownT:"منتج غير معروف. أضفه بصورتين دون مغادرة الصفحة.",sendLogo:"أرسل صورة لشعار الحلال",sent:"شكراً، وصلت الصورة. ستُراجع قبل إضافتها إلى البطاقة.",sendFail:"تعذّر الإرسال. حاول بعد قليل.",cert:"الهيئة المذكورة",certT:"من يمنح الشهادة",certL:"الهيئات المذكورة على العبوات، ضمن أكثر 3000 منتج حلال مسحاً.",follow:"تابع هذا المنتج",following:"متابَع",watchT:"منتجاتي المتابَعة",changed:"تغيّر منذ زيارتك الأخيرة",lost:"لم يعد يحمل إشارة حلال",fix:"أكمل البطاقة",changesT:"تغييرات مرصودة",chAdd:"تغيّرت الإضافات",chIng:"تغيّرت قائمة المكونات",byname:"البحث بالاسم مزدحم حالياً. اكتب أرقام الرمز الشريطي أو امسح.",h1:"حلال أم لا؟<br><em>امسح.</em> الجواب في ثانيتين.",sub:"وجّه الكاميرا نحو الرمز الشريطي. سترى إن كان المنتج يحمل إشارة حلال، وكل مكوّن يثير سؤالاً.",camera:"امسح منتجاً",check:"تحقق",photo:"أو أرسل صورة للرمز الشريطي",placeholder:"الرمز الشريطي أو اسم المنتج",
 t1:"مجاني وبدون تسجيل",t2:"قاعدة منتجات عالمية",t3:"أكثر من 15 لغة",
 loading:"جارٍ البحث عن المنتج…",notfound:"هذا المنتج غير موجود بعد في القاعدة. أضفه في دقيقة ليستفيد الجميع.",offline:"قاعدة المنتجات لا تستجيب. حاول بعد قليل.",nocam:"الكاميرا غير متاحة على هذا الجهاز. أرسل صورة للرمز أو اكتب الأرقام.",nobar:"لم يُقرأ أي رمز. التقط الصورة عن قرب.",camhint:"وجّه الكاميرا نحو الرمز، القراءة تلقائية.",
 s_ok:"حلال حسب الشركة",s_bad:"غير حلال",s_conflict:"حلال معلن، يحتاج تحققاً",s_check:"يحتاج تحققاً",s_none:"لا إشارة حلال",s_empty:"المكونات غير معروفة",
 e_ok:"تعلن الشركة أن المنتج حلال. ابحث عن شعار الهيئة على العبوة.",e_bad:"أحد المكونات غير حلال دون شهادة.",e_conflict:"توجد إشارة حلال، لكن القائمة تتضمن مكوّناً حساساً.",e_check:"مصدر أحد المكونات غير محدد، الشركة وحدها تعرف.",e_none:"لم نجد مكوّناً خطراً، لكن الشركة لا تعلن أنه حلال.",e_empty:"لا تتوفر قائمة المكونات بعد.",
 label:"الإشارة",share:"مشاركة",copied:"تم نسخ الرابط",source:"المصدر",add:"أضف المنتج",
 shelvesT:"منتجات تحمل إشارة حلال حسب القسم",shelvesL:"المس منتجاً لعرض بطاقته الكاملة.",empty:"لا توجد منتجات في هذا القسم حالياً.",
 trapsT:"فخاخ يجب معرفتها",trapsL:"ما نبحث عنه في كل قائمة مكونات.",allAdd:"كل الإضافات المتابعة",
 howT:"كيف يعمل",s1:"امسح",s1p:"الرمز الشريطي يكفي، بدون تسجيل.",s2:"اقرأ الحكم",s2p:"أخضر أو برتقالي أو أحمر، مع السبب بوضوح.",s3:"اختر الأفضل",s3p:"منتجات من نفس القسم تحمل إشارة حلال.",
 legal:"لا يمنح halal.shopping أي شهادة. نقرأ إشارات الشركات وقوائم المكونات. عند الشك، العبرة بالعبوة وبالهيئة المانحة.",data:"بيانات المنتجات: Open Food Facts، رخصة ODbL.",
 sh:{candies:"حلويات",chocolates:"شوكولاتة",biscuits:"بسكويت",sausages:"لحوم مصنعة",meats:"لحوم",cheeses:"أجبان",frozen:"مجمدات",snacks:"مقبلات",beverages:"مشروبات"}}
};
var SHELVES=[["candies","en:candies"],["chocolates","en:chocolates"],["biscuits","en:biscuits"],["sausages","en:sausages"],["meats","en:meats"],["cheeses","en:cheeses"],["frozen","en:frozen-foods"],["snacks","en:salty-snacks"],["beverages","en:beverages"]];
var TRAPS=["e441","e120","e471","e904"];

var L="fr", last=null, shelf="candies";
function $(id){return document.getElementById(id)}
function img400(u){return String(u||"").replace(/\.(100|200)\.jpg$/,".400.jpg")}
function imgFull(u){return String(u||"").replace(/\.(100|200|400)\.jpg$/,".full.jpg")}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function t(k){return (T[L]&&T[L][k])||T.fr[k]||""}
function addN(k){var x=T[L]&&T[L].adds&&T[L].adds[k];return x?x[0]:(ADD[k].n[L]||ADD[k].n.fr)}
function addW(k){var x=T[L]&&T[L].adds&&T[L].adds[k];return x?x[1]:(ADD[k].w[L]||ADD[k].w.fr)}
function wordW(k){var x=T[L]&&T[L].words&&T[L].words[k];return x||WTXT[k][L]||WTXT[k].fr}
function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
function toast(s){var d=document.createElement("div");d.className="toast";d.textContent=s;document.body.appendChild(d);setTimeout(function(){d.remove()},Math.max(2200,s.length*55))}

var LANGS={fr:"Français",en:"English",ar:"العربية",es:"Español",pt:"Português",de:"Deutsch",nl:"Nederlands",tr:"Türkçe",id:"Bahasa Indonesia",ms:"Bahasa Melayu",ru:"Русский",zh:"中文",ja:"日本語",hi:"हिन्दी",bn:"বাংলা",ur:"اردو"};
var RTL={ar:1,ur:1};
function loadLang(l){ if(T[l])return Promise.resolve(); return getJSON("i18n/"+l+".json").then(function(j){j.sh=j.sh||{};T[l]=j}) }
function applyLang(l){
  if(!LANGS[l])l="en";
  loadLang(l).then(function(){paint(l)},function(){paint("en")});
}
function paint(l){
  L=l; var h=document.documentElement; h.lang=L; h.dir=RTL[L]?"rtl":"ltr";
  document.querySelectorAll("[data-t]").forEach(function(el){el.textContent=t(el.dataset.t)});
  document.querySelectorAll("[data-th]").forEach(function(el){el.innerHTML=t(el.dataset.th)});
  $("q").placeholder=t("placeholder"); $("lang").value=L;
  renderShelves(); renderTraps(); renderGuide(); renderCerts(); renderWatch(); renderChanges(); renderMine(); $("city").placeholder=t("cityPh"); renderFilters(); if($("cstat").dataset.n)$("cstat").textContent=t("stats").replace("{n}",$("cstat").dataset.n); if(PLACES.length)renderPlaces(); if(SHELFDATA)loadShelf(shelf); if(last)render(last.p,last.r);
  document.querySelectorAll(".alert").forEach(function(b){b.textContent=b.dataset.n+" "+t(b.dataset.m)});
}
function renderShelves(){
  $("shelves").innerHTML=SHELVES.map(function(s){return '<button type="button" class="shelf" data-shelf="'+s[0]+'" aria-pressed="'+(s[0]===shelf)+'">'+esc((T[L].sh&&T[L].sh[s[0]])||T.fr.sh[s[0]])+'</button>'}).join("");
}
function renderTraps(){
  $("traps").innerHTML=TRAPS.map(function(k){var a=ADD[k];return '<div class="trap"><code class="'+(a.lvl==="bad"?"":"w")+'">'+k.toUpperCase()+'</code><b>'+esc(addN(k))+'</b><p>'+esc(addW(k))+'</p></div>'}).join("");
}
function renderGuide(){
  $("guide").innerHTML=Object.keys(ADD).map(function(k){var a=ADD[k];return "<tr><td><code>"+k.toUpperCase()+"</code></td><td><b>"+esc(addN(k))+"</b><br>"+esc(addW(k))+"</td></tr>"}).join("");
}

// ---------- Data ----------
var API="https://world.openfoodfacts.org", SEARCH="https://search.openfoodfacts.org/search";
function brand(x){return Array.isArray(x.brands)?x.brands.join(", "):(x.brands||"")}
var FIELDS="code,product_name,product_name_fr,product_name_nl,product_name_en,product_name_es,product_name_pt,product_name_de,product_name_ar,product_name_tr,product_name_ru,brands,image_front_small_url,image_front_url,labels_tags,additives_tags,ingredients_text,ingredients_text_fr,ingredients_text_en,categories_tags";
function getJSON(u){return fetch(u).then(function(r){if(!r.ok)throw new Error("http "+r.status);return r.json()})}
function pname(p){return p["product_name_"+L]||p.product_name_fr||p.product_name||p.product_name_en||p.code}
function msg(s){$("msg").textContent=s||""}

function lookup(q,push){
  q=String(q||"").trim(); if(!q)return; $("q").value=q; msg(t("loading"));
  var isCode=/^\d{8,14}$/.test(q);
  var req=isCode? getJSON(API+"/api/v2/product/"+q+"?fields="+FIELDS).then(function(j){return j&&j.status===1?j.product:null})
               : getJSON(API+"/cgi/search.pl?search_terms="+encodeURIComponent(q)+"&search_simple=1&json=1&page_size=1&fields="+FIELDS).then(function(j){return j&&j.products&&j.products[0]||null})
                 .catch(function(){return getJSON(SEARCH+"?q="+encodeURIComponent(q)+"&page_size=1&fields=code").then(function(j){var c=j&&j.hits&&j.hits[0]&&j.hits[0].code;return c?getJSON(API+"/api/v2/product/"+c+"?fields="+FIELDS).then(function(k){return k&&k.status===1?k.product:null}):null})});
  req.then(function(p){
    msg(""); var out=$("out"); out.hidden=false;
    if(!p){last=null;curCode=isCode?q:null;out.innerHTML=(HSAPI_OK&&isCode)?'<div class="note"><b>'+esc(t("unknownT"))+'</b><div class="hbtns" style="margin-top:10px"><button type="button" class="hb" data-photo="front">'+CAM+esc(t("photoFront"))+'</button><button type="button" class="hb" data-photo="ingredients">'+CAM+esc(t("photoIng"))+'</button></div></div>':'<div class="note">'+esc(t("notfound"))+'</div>';out.scrollIntoView({behavior:"smooth"});return}
    var r=analyse(p); last={p:p,r:r}; curCode=p.code; render(p,r);
    if(p.code&&push!==false){try{history.replaceState(null,"","#p"+p.code)}catch(e){}}
    out.scrollIntoView({behavior:"smooth"});
  }).catch(function(){msg(isCode?t("offline"):t("byname"))});
}

var ICON={ok:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',check:'<path d="M12 7v6M12 17h.01"/>',bad:'<path d="M7 7l10 10M17 7L7 17"/>',none:'<path d="M7 12h10"/>'};
function render(p,r){
  var key={ok:"ok",bad:"bad",conflict:"check",check:"check",none:"none",empty:"none"}[r.status];
  var flags=r.flags.map(function(f){
    var why=f.type==="add"?addW(f.key):wordW(f.key);
    var nm=f.type==="add"?addN(f.key)+" : ":"";
    return '<div class="flag"><code class="'+f.lvl+'">'+esc(f.code)+'</code><p>'+esc(nm+why)+'</p></div>'}).join("");
  var c=certOf(p);
  if(c)flags='<div class="flag"><code class="ok">'+esc(t("cert"))+'</code><p><b>'+esc(c.name)+'</b> · '+esc(region(c.country))+(c.url?' · <a href="'+esc(c.url)+'" target="_blank" rel="noopener">'+esc(c.url.replace(/^https?:\/\/(www\.)?/,""))+'</a>':"")+'</p></div>'+flags;
  if(r.halal)flags='<div class="flag"><code class="ok">'+esc(t("label"))+'</code><p>'+esc(r.certTag.replace(/^[a-z]{2}:/,"").replace(/-/g," "))+'</p></div>'+flags;
  var img=p.image_front_url||img400(p.image_front_small_url);
  $("out").innerHTML='<article class="answer"><div class="banner '+key+'"><span class="sig"><svg viewBox="0 0 24 24">'+ICON[key]+'</svg></span><div class="btxt"><strong>'+esc(t("s_"+r.status))+'</strong><span>'+esc(t("e_"+r.status))+'</span></div></div>'+
   '<div class="prod">'+(img?'<button type="button" class="zoom" data-zoom="'+esc(imgFull(img))+'"><img src="'+esc(img)+'" alt=""><span class="zi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5M8.5 11h5M11 8.5v5"/></svg></span></button>':"")+'<div style="min-width:0"><h2>'+esc(pname(p))+'</h2><div class="meta">'+esc(brand(p)+(p.code?" · "+p.code:""))+'</div></div></div>'+
   (flags?'<div class="flags">'+flags+'</div>':"")+
   helpHTML(p.code)+
   '<div class="acts"><span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn solid" id="share">'+esc(t("share"))+'</button><button type="button" class="btn" id="follow">'+esc(watched(p.code)?t("following"):t("follow"))+'</button></span><a class="src" href="https://world.openfoodfacts.org/product/'+esc(p.code)+'" target="_blank" rel="noopener">'+esc(t("source"))+' · Open Food Facts</a></div></article>';
  $("follow").onclick=function(){var w=getWatch();if(w[p.code])delete w[p.code];else w[p.code]=sigOf(p,r);setWatch(w);this.textContent=w[p.code]?t("following"):t("follow");renderWatch()};
  loadCounts(p.code);
  $("share").onclick=function(){
    var url="https://halal.shopping/#p"+p.code, title=pname(p)+" — "+t("s_"+r.status);
    if(navigator.share){navigator.share({title:title,url:url}).catch(function(){})}
    else if(navigator.clipboard){navigator.clipboard.writeText(url).then(function(){toast(t("copied"))},function(){})}
  };
}

var HSAPI="https://api.halal.shopping", HSAPI_OK=false;
var curCode=null, pendingKind="logo";
var CAM='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';
function device(){var d=store("hs_dev");if(!d){d="";for(var i=0;i<16;i++)d+="abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random()*36)];store("hs_dev",d)}return d}
function getDone(){try{return JSON.parse(store("hs_done")||"{}")||{}}catch(e){return {}}}
var LV=[1,10,30,100];
function level(n){var i=0;while(i<LV.length&&n>=LV[i])i++;return i}
function markDone(k){var d=getDone();if(d[k])return;var n0=Object.keys(d).length;d[k]=1;store("hs_done",JSON.stringify(d));renderMine();
  if(level(n0+1)>level(n0))setTimeout(function(){toast("★ "+t("lvl"+level(n0+1)))},2400)}
function renderMine(){var n=Object.keys(getDone()).length,el=$("mine");el.hidden=!n;if(!n)return;var lv=level(n),h='<span>★ '+esc(t("lvl"+lv))+' · '+esc(t("mine").replace("{n}",n))+'</span>';
  if(lv<LV.length){var lo=LV[lv-1]||0,hi=LV[lv];h+='<i class="bar"><i style="width:'+Math.round(100*(n-lo)/(hi-lo))+'%"></i></i><span class="nx">'+esc(t("lvlNext").replace("{n}",hi-n).replace("{x}",t("lvl"+(lv+1))))+'</span>'}
  el.innerHTML=h}
function unDone(k){var d=getDone();if(!d[k])return;delete d[k];store("hs_done",JSON.stringify(d));renderMine()}
var ONE={fr:["membres","membre"],en:["members","member"],nl:["leden","lid"],es:["miembros","miembro"],pt:["membros","membro"],de:["Mitgliedern","Mitglied"]};
function cnt(key,n){var s=t(key).replace("{n}",n);if(n===1&&ONE[L])s=s.replace(ONE[L][0],ONE[L][1]);return s}
// withdraw one of this device's own signals: find it, delete it
function withdraw(coll,filter){var q="device="+device();
  return fetch(HSAPI+"/api/collections/"+coll+"/records?perPage=1&"+q+"&filter="+encodeURIComponent(filter)).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){var it=j.items&&j.items[0];if(!it)return true;
    return fetch(HSAPI+"/api/collections/"+coll+"/records/"+it.id+"?"+q,{method:"DELETE"}).then(function(r){if(!r.ok&&r.status!==404)throw 0;return true})})}
function helpHTML(code){
  if(!HSAPI_OK||!code)return ""; var d=getDone();
  function b(kind,label,cls){var on=d[code+":"+kind];return '<button type="button" class="hb '+cls+(on?" on":"")+'" data-sig="'+kind+'" aria-pressed="'+(on?"true":"false")+'">'+esc(label)+'</button>'}
  function ph(kind,label){var on=d[code+":p:"+kind];return '<button type="button" class="hb'+(on?" on":"")+'" data-photo="'+kind+'">'+CAM+esc(label)+'</button>'}
  return '<div class="help"><div class="helpT">'+esc(t("helpT"))+'</div><div id="comm" class="comm"></div><div id="undoH" class="undoH"'+(["seen","notseen","changed"].some(function(k){return d[code+":"+k]})?"":" hidden")+'>'+esc(t("undoHint"))+'</div><div class="helpQ">'+esc(t("q_logo"))+'</div><div class="hbtns">'+b("seen",t("yes"),"yes")+b("notseen",t("no"),"no")+b("changed",t("changedBtn"),"")+'</div><div class="hbtns">'+ph("logo",t("sendLogo"))+ph("ingredients",t("photoIng"))+'</div></div>';
}
function loadCounts(code){
  if(!HSAPI_OK||!code)return;
  fetch(HSAPI+"/api/collections/signal_counts/records?perPage=10&filter="+encodeURIComponent("code='"+code+"'")).then(function(r){return r.ok?r.json():null}).then(function(j){
    var el=$("comm"); if(!el||!j||curCode!==code)return; var m={}; (j.items||[]).forEach(function(x){m[x.kind]=x.n});
    el.innerHTML=["seen","notseen","changed"].filter(function(k){return m[k]}).map(function(k){return '<span class="cm '+k+'">'+esc(cnt("c_"+k,m[k]))+'</span>'}).join("");
  }).catch(function(){});
}
function sendSignal(kind,btn){
  var code=curCode; if(!code||btn.dataset.busy)return; var key=code+":"+kind, was=!!getDone()[key];
  function end(){delete btn.dataset.busy} function hint(){var h=$("undoH"),d=getDone();if(h)h.hidden=!["seen","notseen","changed"].some(function(k){return d[code+":"+k]})}
  btn.dataset.busy=1;
  if(was){ btn.classList.remove("on");
    withdraw("signals","code='"+code+"'&&kind='"+kind+"'").then(function(){unDone(key);toast(t("undone"));loadCounts(code);hint();end()}).catch(function(){btn.classList.add("on");toast(t("sendFail"));end()});
    return }
  btn.classList.add("on");
  // "seen" and "not seen" cannot both stand: the new answer replaces the other one
  var opp=kind==="seen"?"notseen":kind==="notseen"?"seen":null, pre=Promise.resolve();
  if(opp&&getDone()[code+":"+opp]) pre=withdraw("signals","code='"+code+"'&&kind='"+opp+"'").then(function(){unDone(code+":"+opp);var o=document.querySelector('[data-sig="'+opp+'"]');if(o)o.classList.remove("on")}).catch(function(){});
  pre.then(function(){return fetch(HSAPI+"/api/collections/signals/records",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:code,kind:kind,device:device(),lang:L})})})
   .then(function(r){ if(r.ok||r.status===400){markDone(key);toast(t("thanks"));loadCounts(code);hint()} else {btn.classList.remove("on");toast(t("sendFail"))} end() })
   .catch(function(){btn.classList.remove("on");toast(t("sendFail"));end()});
}
function shrink(file){return createImageBitmap(file).then(function(b){var m=1600,k=Math.min(1,m/Math.max(b.width,b.height)),c=document.createElement("canvas");c.width=Math.round(b.width*k);c.height=Math.round(b.height*k);c.getContext("2d").drawImage(b,0,0,c.width,c.height);return new Promise(function(ok){c.toBlob(ok,"image/jpeg",0.85)})})}
function sendPhoto(file){
  var code=curCode, kind=pendingKind; if(!code)return;
  shrink(file).then(function(blob){var f=new FormData();f.append("code",code);f.append("kind",kind);f.append("lang",L);f.append("photo",blob,code+".jpg");
    return fetch(HSAPI+"/api/collections/contributions/records",{method:"POST",body:f})}).then(function(r){ if(r.ok){markDone(code+":p:"+kind);toast(t("sent"));var b=document.querySelector('[data-photo="'+kind+'"]');if(b)b.classList.add("on")} else toast(t("sendFail")) }).catch(function(){toast(t("sendFail"))});
}
// ---------- Places (OpenStreetMap)
var PLACES=[], PCOUNTS={}, pmap=null, player=null, pcenter=null;
function dist(a,b,c,d){var R=6371,x=(c-a)*Math.PI/180,y=(d-b)*Math.PI/180,h=Math.sin(x/2)*Math.sin(x/2)+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(y/2)*Math.sin(y/2);return 2*R*Math.asin(Math.sqrt(h))}
function ptype(g){if(g.shop==="butcher")return "t_butcher";if(g.amenity==="fast_food")return "t_fast";if(g.amenity==="restaurant"||g.amenity==="cafe"||g.amenity==="food_court")return "t_rest";return "t_shop"}
function pmsg(s){$("pmsg").textContent=s||""}
function loadLeaflet(){ if(window.L)return Promise.resolve(); return new Promise(function(ok,no){var c=document.createElement("link");c.rel="stylesheet";c.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";document.head.appendChild(c);var j=document.createElement("script");j.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";j.onload=ok;j.onerror=no;document.head.appendChild(j)}) }
var PIDX=null, PTYPE={b:"t_butcher",f:"t_fast",r:"t_rest",s:"t_shop"}, pfilter="all", addKind="f", MISSION=null, SKIP={};
function renderFilters(){
  $("pfilt").innerHTML=[["all","f_all"],["t_rest","t_rest"],["t_fast","t_fast"],["t_butcher","t_butcher"],["t_shop","t_shop"],["todo","f_todo"]].map(function(f){return '<button type="button" class="chip" data-pf="'+f[0]+'" aria-pressed="'+(pfilter===f[0])+'">'+esc(t(f[1]))+'</button>'}).join("");
  $("addKinds").innerHTML=["f","r","b","s"].map(function(k){return '<button type="button" class="chip" data-ak="'+k+'" aria-pressed="'+(addKind===k)+'">'+esc(t(PTYPE[k]))+'</button>'}).join("");
  $("addName").placeholder=t("addName");
}
function hiddenPlace(p){var c=PCOUNTS[p.id]||{};return ((c.nothalal||0)>=(p.added?2:3)&&(c.nothalal||0)>(c.confirm||0))||((c.closed||0)>=(p.added?2:3))}
// "low": a butcher nobody declared halal, away from halal streets. Listed under the Butcher filter only, until a member confirms it.
function visiblePlaces(){return PLACES.filter(function(p){ if(hiddenPlace(p))return false; var cf=(PCOUNTS[p.id]||{}).confirm; if(pfilter==="all")return !p.low||cf; if(pfilter==="todo")return p.maybe&&!p.low&&!cf; return p.type===pfilter }).slice(0,60)}
function todoPlaces(){var d=getDone();return PLACES.filter(function(p){return p.maybe&&!p.low&&!hiddenPlace(p)&&!((PCOUNTS[p.id]||{}).confirm)&&!d["pl:"+p.id+":confirm"]&&!d["pl:"+p.id+":nothalal"]&&!d["pl:"+p.id+":closed"]&&!SKIP[p.id]})}
function km(p){return p.d==null?"":p.d<1?Math.round(p.d*1000)+" m":p.d.toFixed(1)+" km"}
function near(p){try{var c=JSON.parse(store("hs_rev")||"{}");return c[p.id]||""}catch(e){return ""}}
function placeAddr(p){var s=p.addr||(p.ap?"≈ "+p.ap:"")||(near(p)?"≈ "+near(p):""),c=[p.zip,p.city].filter(Boolean).join(" ");return [s,c].filter(Boolean).join(", ")}
function placeMeta(p){return [p.cuisine,km(p)].filter(Boolean).join(" · ")}
function statusHTML(p){var cf=(PCOUNTS[p.id]||{}).confirm||0;return cf?'<span class="pt ok">'+esc(cnt("p_conf",cf))+'</span>':p.maybe?'<span class="pt mb">'+esc(t(p.added?"addedBy":"p_maybe"))+'</span>':'<span class="pt dc">'+esc(t("p_decl"))+'</span>'}
function sigBtns(p){var d=getDone();function b(kind,key,cls){var on=d["pl:"+p.id+":"+kind],n=(PCOUNTS[p.id]||{})[kind]||0;return '<button type="button" class="pb '+cls+(on?" on":"")+'" data-pl="'+p.id+'" data-pk="'+kind+'"'+(HSAPI_OK?"":" disabled")+' aria-pressed="'+(on?"true":"false")+'">'+esc(t(key))+(n?' <i>'+n+'</i>':"")+'</button>'}
  return b("confirm","pc_confirm","c")+b("nothalal","pc_not","n")+b("closed","pc_closed","")}
function routeURL(p){return "https://www.google.com/maps/dir/?api=1&destination="+p.lat+","+p.lon}
// a street for a venue that has none on the map: nearest address, shown with "≈", fetched once and kept
var revBusy={};
function reverse(p,cb){ if(p.addr||p.ap||near(p)||revBusy[p.id])return; revBusy[p.id]=1;
  fetch("https://photon.komoot.io/reverse?lat="+p.lat+"&lon="+p.lon).then(function(r){return r.json()}).then(function(j){var f=j.features&&j.features[0],q=f&&f.properties; if(!q)return; var s=q.street||(q.type==="street"?q.name:""); if(!s)return;
    try{var c=JSON.parse(store("hs_rev")||"{}");var k=Object.keys(c);if(k.length>400)c={};c[p.id]=s;store("hs_rev",JSON.stringify(c))}catch(e){} if(!p.city)p.city=q.city||q.town||q.village||q.county||""; if(!p.zip&&q.postcode)p.zip=q.postcode; if(cb)cb()}).catch(function(){}) }
var DAYS=["Mo","Tu","We","Th","Fr","Sa","Su"];
function hoursHTML(h){ if(!h)return ""; var names={}; try{DAYS.forEach(function(d,i){names[d]=new Intl.DateTimeFormat(L,{weekday:"short"}).format(new Date(Date.UTC(2024,0,1+i)))})}catch(e){}
  return h.split(";").map(function(x){x=x.trim();if(!x)return "";return '<div>'+esc(x.replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su)\b/g,function(m){return names[m]||m}).replace(/-/g,"–"))+'</div>'}).join("") }
var CUR=null, ppmap=null;
function findPlace(id){for(var i=0;i<PLACES.length;i++)if(PLACES[i].id===id)return Promise.resolve(PLACES[i]);
  if(id[0]==="u")return fetch(HSAPI+"/api/collections/added_public/records/"+id.slice(1)).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(x){return {id:id,name:x.name,lat:x.lat,lon:x.lon,type:PTYPE[x.kind]||"t_shop",addr:"",city:"",cuisine:"",maybe:true,added:true}});
  var ty={n:"node",w:"way",r:"relation"}[id[0]];
  return fetch("https://api.openstreetmap.org/api/0.6/"+ty+"/"+id.slice(1)+(ty==="node"?"":"/full")+".json").then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){
    var el=null,la=0,lo=0,n=0;(j.elements||[]).forEach(function(e){if(e.type===ty&&String(e.id)===id.slice(1))el=e;if(e.type==="node"){la+=e.lat;lo+=e.lon;n++}}); if(!el||!n)throw 0; var g=el.tags||{};
    return {id:id,name:g.name||"",lat:el.lat||la/n,lon:el.lon||lo/n,type:ptype(g),addr:[g["addr:street"],g["addr:housenumber"]].filter(Boolean).join(" "),city:g["addr:city"]||"",zip:g["addr:postcode"]||"",phone:g.phone||g["contact:phone"]||"",web:g.website||g["contact:website"]||"",hours:g.opening_hours||"",cuisine:(g.cuisine||"").split(";")[0].replace(/_/g," "),
      maybe:!(g["diet:halal"]==="yes"||g["diet:halal"]==="only"||g.halal==="yes"||g.butcher==="halal"||/halal|helal|حلال/i.test(g.name||""))}}) }
function renderPage(){
  var p=CUR; if(!p)return; var tel=(p.phone||"").replace(/[^+0-9]/g,""), web=/^https?:\/\//.test(p.web||"")?p.web:"", ad=placeAddr(p);
  $("ppb").innerHTML='<div class="ptr"><span class="pt">'+esc(t(p.type))+'</span>'+statusHTML(p)+'</div><h2>'+esc(p.name)+'</h2>'+
    (ad?'<p class="ppa">'+esc(ad)+'</p>':"")+(placeMeta(p)?'<p class="ppm">'+esc(placeMeta(p))+'</p>':"")+
    '<div class="ppacts"><a class="btn solid" target="_blank" rel="noopener" href="'+routeURL(p)+'">'+esc(t("route"))+'</a>'+(tel?'<a class="btn" href="tel:'+esc(tel)+'">'+esc(t("pg_call"))+'</a>':"")+(web?'<a class="btn" target="_blank" rel="noopener nofollow" href="'+esc(web)+'">'+esc(t("pg_site"))+'</a>':"")+'<button type="button" class="btn" id="ppshare">'+esc(t("share"))+'</button></div>'+
    '<div id="ppmap"></div>'+
    (p.hours?'<div class="ppbox"><h3>'+esc(t("pg_hours"))+'</h3>'+hoursHTML(p.hours)+'</div>':"")+
    (tel?'<div class="ppbox"><h3>'+esc(t("pg_call"))+'</h3><a href="tel:'+esc(tel)+'">'+esc(p.phone)+'</a></div>':"")+
    (!p.hours&&!tel?'<p class="src">'+esc(t("pg_noinfo"))+'</p>':"")+
    '<div class="ppbox help2"><h3>'+esc(t("pg_help"))+'</h3><div class="pa">'+sigBtns(p)+'</div></div><p class="src">'+esc(t("pg_src"))+'</p>';
  loadLeaflet().then(function(){ if(CUR!==p)return; if(ppmap){ppmap.remove();ppmap=null}
    ppmap=window.L.map("ppmap",{scrollWheelZoom:false,dragging:!("ontouchstart" in window)}).setView([p.lat,p.lon],16); window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(ppmap);
    window.L.circleMarker([p.lat,p.lon],{radius:10,color:"#0a7550",fillColor:"#34d399",fillOpacity:.95,weight:3}).addTo(ppmap)}).catch(function(){});
}
function openPlace(id,push){
  findPlace(id).then(function(p){ if(!p.name)throw 0; CUR=p; $("pp").hidden=false; document.body.style.overflow="hidden"; $("pp").scrollTop=0; renderPage(); reverse(p,function(){if(CUR===p){var a=$("ppb").querySelector(".ppa");if(a)a.textContent=placeAddr(p);else renderPage()}});
    if(push){try{history.pushState(null,"",location.pathname+location.search+"#l"+id)}catch(e){}}
    if(HSAPI_OK)fetch(HSAPI+"/api/collections/place_counts/records?filter="+encodeURIComponent("(osm='"+id+"')")).then(function(r){return r.ok?r.json():null}).then(function(j){if(!j||CUR!==p)return;delete PCOUNTS[id];(j.items||[]).forEach(function(x){(PCOUNTS[x.osm]=PCOUNTS[x.osm]||{})[x.kind]=x.n});renderPage()}).catch(function(){});
  }).catch(function(){toast(t("offline"))});
}
function closePlace(){ if($("pp").hidden)return; $("pp").hidden=true; document.body.style.overflow=""; CUR=null; if(ppmap){ppmap.remove();ppmap=null} if(/^#l/.test(location.hash)){try{history.pushState(null,"",location.pathname+location.search)}catch(e){}} }
function renderMission(){
  var el=$("mission"); if(!HSAPI_OK){el.hidden=true;return}
  if(MISSION){ var p=MISSION.list[MISSION.i]; el.hidden=false;
    el.innerHTML='<span class="mp">'+(MISSION.i+1)+' / '+MISSION.list.length+' · '+esc(t(p.type))+'</span><div class="mn">'+esc(p.name)+'</div><p>'+esc(placeMeta(p))+'</p><p><b>'+esc(t("m_q"))+'</b></p><div class="mb3"><button type="button" class="my" data-m="confirm">'+esc(t("m_yes"))+'</button><button type="button" class="mx" data-m="nothalal">'+esc(t("m_no"))+'</button><button type="button" class="ms" data-m="skip">'+esc(t("m_skip"))+'</button></div>';
    return }
  var n=Math.min(10,todoPlaces().length); el.hidden=!n; if(!n)return;
  el.innerHTML='<h3>'+esc(t("missionT"))+'</h3><p>'+esc(t("missionL").replace("{n}",n))+'</p><div class="mb3"><button type="button" class="my" id="missionGo">'+esc(t("missionGo"))+'</button></div>';
}
function missionAnswer(kind){
  if(!MISSION||MISSION.busy)return; var p=MISSION.list[MISSION.i];
  function next(){MISSION.busy=false;MISSION.i++; if(MISSION.i>=MISSION.list.length){MISSION=null;toast(t("m_done"));renderPlaces();loadPlaceCounts()} else renderMission()}
  if(kind==="skip"){SKIP[p.id]=1;next();return}
  MISSION.busy=true;
  fetch(HSAPI+"/api/collections/place_signals/records",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({osm:p.id,kind:kind,device:device(),lang:L})})
   .then(function(r){ if(r.ok||r.status===400){markDone("pl:"+p.id+":"+kind);if(r.ok){var c=PCOUNTS[p.id]=PCOUNTS[p.id]||{};c[kind]=(c[kind]||0)+1}next()} else {MISSION.busy=false;toast(t("sendFail"))} })
   .catch(function(){MISSION.busy=false;toast(t("sendFail"))});
}
function addPlace(){
  var name=$("addName").value.trim(); if(name.length<2){$("addName").focus();return}
  if(!navigator.geolocation){toast(t("geoFail"));return}
  var btn=$("addF").querySelector("[type=submit]"); btn.disabled=true;
  navigator.geolocation.getCurrentPosition(function(g){
    var f=new FormData(),file=$("addPhoto").files&&$("addPhoto").files[0];
    f.append("name",name);f.append("kind",addKind);f.append("lat",g.coords.latitude);f.append("lon",g.coords.longitude);f.append("device",device());f.append("lang",L);
    (file?shrink(file).then(function(b){f.append("photo",b,"place.jpg")}).catch(function(){}):Promise.resolve()).then(function(){return fetch(HSAPI+"/api/collections/added_places/records",{method:"POST",body:f})})
     .then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){
       markDone("add:"+j.id); toast(t("addOk")); $("addF").reset(); $("addF").hidden=true; btn.disabled=false;
       var la=g.coords.latitude,lo=g.coords.longitude; if(!pcenter)pcenter=[la,lo];
       PLACES.unshift({id:"u"+j.id,name:name,lat:la,lon:lo,type:PTYPE[addKind],addr:"",city:"",cuisine:"",maybe:true,added:true,d:dist(pcenter[0],pcenter[1],la,lo)}); pmsg(""); renderPlaces(); drawMap();
     }).catch(function(){btn.disabled=false;toast(t("sendFail"))});
  },function(){btn.disabled=false;toast(t("geoFail"))},{enableHighAccuracy:true,timeout:15000,maximumAge:0});
}
function addedNear(lat,lon){
  var R=0.3,dl=R/Math.max(0.2,Math.cos(lat*Math.PI/180)),f="lat>"+(lat-R).toFixed(4)+"&&lat<"+(lat+R).toFixed(4)+"&&lon>"+(lon-dl).toFixed(4)+"&&lon<"+(lon+dl).toFixed(4);
  return fetch(HSAPI+"/api/collections/added_public/records?perPage=200&filter="+encodeURIComponent("("+f+")")).then(function(r){return r.ok?r.json():{items:[]}}).then(function(j){
    return (j.items||[]).map(function(x){return {id:"u"+x.id,name:x.name,lat:x.lat,lon:x.lon,type:PTYPE[x.kind]||"t_shop",addr:"",city:"",cuisine:"",maybe:true,added:true,d:dist(lat,lon,x.lat,x.lon)}})}).catch(function(){return []});
}
function showPlaces(list,lat,lon){
  PLACES=list.sort(function(a,b){return a.d-b.d}).slice(0,600);
  pmsg(PLACES.length?"":t("p_none")); renderPlaces(); drawMap(); loadPlaceCounts();
}
// Nightly tiles (1 degree) generated from OpenStreetMap: instant, no third-party wait
function loadPlaces(lat,lon){
  pcenter=[lat,lon]; pmsg("…");
  (PIDX?Promise.resolve(PIDX):fetch("data/places/index.json").then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){PIDX=j;return j})).then(function(ix){
    var keys=[],R=0.3,dl=R/Math.max(0.2,Math.cos(lat*Math.PI/180));
    for(var a=Math.floor(lat-R);a<=Math.floor(lat+R);a++)for(var o=Math.floor(lon-dl);o<=Math.floor(lon+dl);o++){var k=a+"_"+o;if(ix.tiles[k])keys.push(k)}
    return Promise.all([addedNear(lat,lon)].concat(keys.map(function(k){return fetch("data/places/"+k+".json").then(function(r){return r.ok?r.json():[]}).catch(function(){return []})})));
  }).then(function(ts){
    var all=ts.shift(); ts.forEach(function(v){v.forEach(function(p){all.push({id:p.i,name:p.n,lat:p.la,lon:p.lo,type:PTYPE[p.t]||"t_shop",addr:p.a||"",ap:p.ap||"",city:p.c||"",zip:p.z||"",cc:p.cc||"",phone:p.ph||"",web:p.w||"",hours:p.h||"",cuisine:p.k||"",maybe:!!p.p,d:dist(lat,lon,p.la,p.lo)})})});
    var hi=function(r){return all.filter(function(p){return p.d<=r&&!p.low}).length}, R2=hi(3)>=20?3:hi(8)>=12?8:30, near=all.filter(function(p){return p.d<=R2});
    showPlaces(near,lat,lon);
  }).catch(function(){livePlaces(lat,lon,4000)});
}
function livePlaces(lat,lon,radius){
  var q='[out:json][timeout:25];(nwr["diet:halal"~"^(yes|only)$"](around:'+radius+','+lat+','+lon+');nwr["halal"="yes"](around:'+radius+','+lat+','+lon+');nwr["shop"="butcher"]["butcher"="halal"](around:'+radius+','+lat+','+lon+'););out center tags 150;';
  fetch("https://overpass-api.de/api/interpreter?data="+encodeURIComponent(q)).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){
    showPlaces((j.elements||[]).map(function(e){var g=e.tags||{},la=e.lat||(e.center&&e.center.lat),lo=e.lon||(e.center&&e.center.lon);return {id:e.type[0]+e.id,name:g.name,lat:la,lon:lo,type:ptype(g),addr:[g["addr:street"],g["addr:housenumber"]].filter(Boolean).join(" "),city:g["addr:city"]||"",cuisine:(g.cuisine||"").split(";")[0].replace(/_/g," "),d:dist(lat,lon,la,lo)}}).filter(function(p){return p.name&&p.lat}),lat,lon);
  }).catch(function(){pmsg(t("offline"))});
}
function renderPlaces(){
  var d=getDone();
  renderMission();
  var V=visiblePlaces();
  $("plist").innerHTML=V.map(function(p){ var ad=placeAddr(p), tel=(p.phone||"").replace(/[^+0-9]/g,"");
    return '<div class="pl" data-id="'+p.id+'"><div class="ptr"><span class="pt">'+esc(t(p.type))+'</span>'+statusHTML(p)+'</div><a class="pln" href="#l'+p.id+'" data-open="'+p.id+'">'+esc(p.name)+'</a>'+(ad?'<span class="pad">'+esc(ad)+'</span>':"")+'<span class="pm">'+esc(placeMeta(p))+'</span><div class="pa">'+sigBtns(p)+'</div><div class="pa"><a class="pb" target="_blank" rel="noopener" href="'+routeURL(p)+'">'+esc(t("route"))+'</a>'+(tel?'<a class="pb" href="tel:'+esc(tel)+'">'+esc(t("pg_call"))+'</a>':"")+'<a class="pb go" href="#l'+p.id+'" data-open="'+p.id+'">'+esc(t("pg_more"))+' →</a></div></div>'}).join("");
  // streets for the first cards that have none on the map
  V.filter(function(p){return !p.addr&&!p.ap&&!near(p)}).slice(0,8).forEach(function(p){reverse(p,function(){var c=document.querySelector('.pl[data-id="'+p.id+'"]');if(!c)return;var a=c.querySelector(".pad");if(!a){a=document.createElement("span");a.className="pad";c.insertBefore(a,c.querySelector(".pm"))}a.textContent=placeAddr(p)})});
  if(CUR)renderPage();
}
function drawMap(){
  var VIS=visiblePlaces(); if(!VIS.length){$("pmap").hidden=true;return}
  loadLeaflet().then(function(){
    $("pmap").hidden=false;
    if(!pmap){pmap=window.L.map("pmap",{scrollWheelZoom:false});window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(pmap)}
    if(player)player.remove(); player=window.L.layerGroup().addTo(pmap);
    VIS.forEach(function(p){window.L.circleMarker([p.lat,p.lon],{radius:p.maybe?6:8,color:p.maybe?"#a86a00":"#0a7550",fillColor:p.maybe?"#f5c451":"#34d399",fillOpacity:.9,weight:2}).bindPopup("<b>"+esc(p.name)+"</b>").addTo(player)});
    window.L.circleMarker(pcenter,{radius:6,color:"#0f211b",fillColor:"#0f211b",fillOpacity:1}).addTo(player);
    pmap.fitBounds(VIS.slice(0,15).map(function(p){return [p.lat,p.lon]}).concat([pcenter]),{padding:[24,24],maxZoom:16}); setTimeout(function(){pmap.invalidateSize()},200);
  }).catch(function(){});
}
function loadPlaceCounts(){
  if(!HSAPI_OK||!PLACES.length)return;
  var V=visiblePlaces(), f=V.map(function(p){return "osm='"+p.id+"'"}).join("||"); if(!V.length)return;
  fetch(HSAPI+"/api/collections/place_counts/records?perPage=200&filter="+encodeURIComponent("("+f+")")).then(function(r){return r.ok?r.json():null}).then(function(j){
    if(!j)return; V.forEach(function(p){delete PCOUNTS[p.id]}); (j.items||[]).forEach(function(x){(PCOUNTS[x.osm]=PCOUNTS[x.osm]||{})[x.kind]=x.n}); renderPlaces();
  }).catch(function(){});
}
function sendPlace(id,kind,btn){
  if(btn.dataset.busy)return; btn.dataset.busy=1; var key="pl:"+id+":"+kind;
  function end(){delete btn.dataset.busy}
  if(getDone()[key]){ btn.classList.remove("on");
    withdraw("place_signals","osm='"+id+"'&&kind='"+kind+"'").then(function(){unDone(key);toast(t("undone"));if(PCOUNTS[id])delete PCOUNTS[id][kind];renderPlaces();loadPlaceCounts()}).catch(function(){btn.classList.add("on");toast(t("sendFail"));end()});
    return }
  btn.classList.add("on");
  fetch(HSAPI+"/api/collections/place_signals/records",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({osm:id,kind:kind,device:device(),lang:L})})
   .then(function(r){ if(r.ok||r.status===400){markDone(key);toast(t("thanks")+" "+t("undoHint"));renderPlaces();loadPlaceCounts()} else {btn.classList.remove("on");toast(t("sendFail"));end()} })
   .catch(function(){btn.classList.remove("on");toast(t("sendFail"));end()});
}
function nearMe(){
  if(!navigator.geolocation){pmsg(t("geoFail"));return} pmsg("…");
  navigator.geolocation.getCurrentPosition(function(p){$("city").value="";loadPlaces(p.coords.latitude,p.coords.longitude)},function(){pmsg(t("geoFail"));$("city").focus()},{timeout:10000,maximumAge:300000});
}
function findCity(q){
  q=String(q||"").trim(); if(!q)return; pmsg("…");
  fetch("https://photon.komoot.io/api/?limit=1&q="+encodeURIComponent(q)).then(function(r){return r.json()}).then(function(j){var f=j.features&&j.features[0]; if(!f){pmsg(t("p_none"));return} loadPlaces(f.geometry.coordinates[1],f.geometry.coordinates[0])}).catch(function(){pmsg(t("offline"))});
}
var CERTS=null, certSel=null;
function region(cc){try{return new Intl.DisplayNames([L],{type:"region"}).of(cc)||cc}catch(e){return cc}}
function certOf(p){ if(!CERTS)return null; var tags=p.labels_tags||[]; for(var i=0;i<CERTS.list.length;i++){var c=CERTS.list[i]; if(c.tags.some(function(x){return tags.indexOf(x)>=0}))return c} return null }
function tileHTML(x){return '<button type="button" class="tile" data-code="'+esc(x.code)+'"><span class="ph"><img loading="lazy" src="'+esc(img400(x.image_front_small_url))+'" alt=""></span><span class="tag">'+esc(t("s_ok"))+'</span><b>'+esc(pname(x))+'</b><small>'+esc(brand(x))+'</small></button>'}
function renderCerts(){
  if(!CERTS)return; var list=CERTS.list.filter(function(c){return c.count>0}); $("certBox").hidden=!list.length;
  $("certs").innerHTML=list.map(function(c){return '<button type="button" class="certc" data-cert="'+c.id+'" aria-pressed="'+(c.id===certSel)+'"><i>'+c.count+'</i><b>'+esc(c.name)+'</b><span>'+esc(region(c.country))+'</span></button>'}).join("");
  var sel=list.filter(function(c){return c.id===certSel})[0];
  $("certgrid").innerHTML=sel?sel.products.map(tileHTML).join(""):"";
}
function getWatch(){try{return JSON.parse(store("hs_watch")||"{}")||{}}catch(e){return {}}}
function setWatch(w){store("hs_watch",JSON.stringify(w))}
function watched(c){return !!getWatch()[c]}
function sigOf(p,r){return {n:pname(p),h:r.halal,a:r.flags.filter(function(f){return f.lvl!=="info"}).map(function(f){return f.code}).sort().join(",")}}
function renderWatch(){var w=getWatch(),k=Object.keys(w);$("watchBox").hidden=!k.length;$("watch").innerHTML=k.map(function(c){return '<button type="button" class="chip" data-code="'+esc(c)+'">'+esc(w[c].n||c)+'</button>'}).join("")}
function checkWatch(){
  var w=getWatch(),codes=Object.keys(w).slice(0,20),alerts=[]; if(!codes.length)return;
  Promise.all(codes.map(function(c){return getJSON(API+"/api/v2/product/"+c+"?fields="+FIELDS).then(function(j){
    if(!j||j.status!==1)return; var r=analyse(j.product),s=sigOf(j.product,r),o=w[c];
    if(o.h&&!s.h)alerts.push({c:c,n:s.n,m:"lost"}); else if(o.a!==s.a)alerts.push({c:c,n:s.n,m:"changed"});
    w[c]=s;
  }).catch(function(){})})).then(function(){
    setWatch(w); if(!alerts.length)return; $("alerts").hidden=false;
    $("alerts").innerHTML=alerts.map(function(a){return '<button type="button" class="alert" data-code="'+esc(a.c)+'" data-m="'+a.m+'" data-n="'+esc(a.n)+'">'+esc(a.n+" "+t(a.m))+'</button>'}).join("");
  });
}
var CHANGES=null;
function renderChanges(){
  if(!CHANGES)return; var l=(CHANGES.changes||[]).slice(0,12); $("chBox").hidden=!l.length;
  $("chlist").innerHTML=l.map(function(x){return '<button type="button" class="chrow" data-code="'+esc(x.c)+'"><time>'+esc(x.d)+'</time><span><b>'+esc(x.n||x.c)+'</b> · '+esc(t(x.t==="additives"?"chAdd":"chIng"))+'</span></button>'}).join("");
}
var SHELFDATA=null;
function shelfData(){ if(SHELFDATA)return Promise.resolve(SHELFDATA); return getJSON("data/shelves.json?d="+new Date().toISOString().slice(0,10)).then(function(j){SHELFDATA=j;return j}) }
function loadShelf(k){
  shelf=k; renderShelves();
  if(!SHELFDATA)$("grid").innerHTML=new Array(9).join('<div class="skel"></div>');
  shelfData().then(function(j){
    var list=(j.shelves&&j.shelves[k])||[];
    $("grid").innerHTML=list.length?list.map(function(x){return '<button type="button" class="tile" data-code="'+esc(x.code)+'"><span class="ph"><img loading="lazy" src="'+esc(img400(x.image_front_small_url))+'" alt=""></span><span class="tag">'+esc(t("s_ok"))+'</span><b>'+esc(pname(x))+'</b><small>'+esc(brand(x))+'</small></button>'}).join(""):'<p class="src">'+esc(t("empty"))+'</p>';
  }).catch(function(){ $("grid").innerHTML='<p class="src">'+esc(t("empty"))+'</p>' });
}

// ---------- Camera / photo ----------
var stream=null, det=null;
function detector(){ if(det)return det; if("BarcodeDetector" in window){try{det=new BarcodeDetector({formats:["ean_13","ean_8","upc_a","upc_e"]})}catch(e){}} return det }
$("cam").addEventListener("click",function(){
  if(stream){stopCam();return}
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!detector()){msg(t("nocam"));$("q").focus();return}
  navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}}).then(function(s){
    stream=s; var v=$("v"); v.srcObject=s; v.hidden=false; v.play(); msg(t("camhint"));
    (function loop(){ if(!stream)return; det.detect(v).then(function(c){ if(c&&c[0]){stopCam();lookup(c[0].rawValue)} else requestAnimationFrame(loop)}).catch(function(){requestAnimationFrame(loop)}) })();
  }).catch(function(){msg(t("nocam"))});
});
function stopCam(){ if(stream){stream.getTracks().forEach(function(x){x.stop()});stream=null} $("v").hidden=true }
$("photo").addEventListener("change",function(e){
  var f=e.target.files&&e.target.files[0]; if(!f)return;
  if(!detector()){msg(t("nocam"));return}
  createImageBitmap(f).then(function(b){return det.detect(b)}).then(function(c){ if(c&&c[0])lookup(c[0].rawValue); else msg(t("nobar")) }).catch(function(){msg(t("nobar"))});
  e.target.value="";
});

// ---------- Wiring ----------
$("f").addEventListener("submit",function(e){e.preventDefault();lookup($("q").value)});
document.addEventListener("click",function(e){
  var b=e.target.closest("[data-code]"); if(b){lookup(b.dataset.code);return}
  var s=e.target.closest("[data-shelf]"); if(s){loadShelf(s.dataset.shelf);return}
  var z=e.target.closest("[data-zoom]"); if(z){var im=$("lbi");im.src=z.querySelector("img").src;$("lb").classList.remove("big");$("lb").hidden=false;var hi=new Image();hi.onload=function(){im.src=hi.src};hi.src=z.dataset.zoom;return}
  if(e.target.id==="lbi"){$("lb").classList.toggle("big");return}
  if(e.target.closest("#lbx")||e.target.classList.contains("lbs")){$("lb").hidden=true;return}
  var op=e.target.closest("[data-open]"); if(op){e.preventDefault();openPlace(op.dataset.open,true);return}
  if(e.target.closest("#ppx")){closePlace();return}
  if(e.target.closest("#ppshare")&&CUR){var u=location.origin+location.pathname+"#l"+CUR.id; if(navigator.share)navigator.share({title:CUR.name+" · halal.shopping",url:u}).catch(function(){}); else if(navigator.clipboard)navigator.clipboard.writeText(u).then(function(){toast(t("copied"))}); return}
  var pf=e.target.closest("[data-pf]"); if(pf){pfilter=pf.dataset.pf;renderFilters();renderPlaces();drawMap();loadPlaceCounts();return}
  var ak=e.target.closest("[data-ak]"); if(ak){addKind=ak.dataset.ak;renderFilters();return}
  if(e.target.closest("#missionGo")){var q=todoPlaces().slice(0,10);if(q.length){MISSION={list:q,i:0};renderMission()}return}
  var mm=e.target.closest("[data-m]"); if(mm){missionAnswer(mm.dataset.m);return}
  if(e.target.closest("#addBtn")){$("addF").hidden=!$("addF").hidden;if(!$("addF").hidden)$("addName").focus();return}
  var pk=e.target.closest("[data-pk]"); if(pk){sendPlace(pk.dataset.pl,pk.dataset.pk,pk);return}
  if(e.target.closest("#near")){nearMe();return}
  var sg=e.target.closest("[data-sig]"); if(sg){sendSignal(sg.dataset.sig,sg);return}
  var pb=e.target.closest("[data-photo]"); if(pb){pendingKind=pb.dataset.photo;$("logoPhoto").click();return}
  var ce=e.target.closest("[data-cert]"); if(ce){certSel=certSel===ce.dataset.cert?null:ce.dataset.cert;renderCerts();return}
});
function fromHash(){var m=location.hash.match(/^#p(\d{8,14})$/); if(m)lookup(m[1],false); var l=location.hash.match(/^#l([nwr]\d{1,20}|u[a-z0-9]{15})$/); if(l){if(!CUR||CUR.id!==l[1])openPlace(l[1],false)} else if(CUR){$("pp").hidden=true;document.body.style.overflow="";CUR=null}}
window.addEventListener("popstate",fromHash);
window.addEventListener("hashchange",fromHash);
var COUNTRY={};
function cc(list,langs){list.split(" ").forEach(function(c){COUNTRY[c]=langs})}
cc("FR MC SN CI ML BF NE GN CM TG BJ CD CG GA CF TD BI RW MG HT NC PF RE GP MQ GF YT","fr fr");
cc("BE","fr nl de"); cc("CH","de fr"); cc("LU","fr de"); cc("CA","en fr"); cc("DJ","fr ar"); cc("KM","ar fr");
cc("MA DZ TN MR","ar fr"); cc("SA AE EG IQ JO KW LB LY OM QA SY YE BH PS SD","ar");
cc("NL SR AW CW SX","nl"); cc("DE AT LI","de");
cc("ES MX AR CO PE VE CL EC GT CU BO DO HN PY SV NI CR PA UY GQ","es"); cc("PR","es en");
cc("PT BR AO MZ GW CV ST TL","pt"); cc("TR","tr"); cc("CY","tr en"); cc("ID","id"); cc("MY BN","ms en"); cc("SG","en zh ms");
cc("RU BY KZ KG","ru"); cc("CN TW HK MO","zh"); cc("JP","ja"); cc("IN","hi en bn"); cc("BD","bn"); cc("PK","ur en");
Object.keys(COUNTRY).forEach(function(k){COUNTRY[k]=COUNTRY[k].split(" ")});
function browserLangs(){return (navigator.languages||[navigator.language||""]).map(function(x){return String(x).slice(0,2).toLowerCase()}).filter(function(x){return LANGS[x]})}
function pickFor(country){var langs=COUNTRY[country]||["en"], b=browserLangs();for(var i=0;i<b.length;i++){if(langs.indexOf(b[i])>=0)return b[i]}return langs[0]}
$("lang").innerHTML=Object.keys(LANGS).map(function(k){return '<option value="'+k+'">'+LANGS[k]+'</option>'}).join("");
$("lang").addEventListener("change",function(){store("hs_lang_choice",this.value);applyLang(this.value);try{history.replaceState(null,"","?lang="+this.value+location.hash)}catch(e){}});
var urlLang=(location.search.match(/[?&]lang=([a-z]{2})/)||[])[1];
var chosen=store("hs_lang_choice");
var first=(urlLang&&LANGS[urlLang])?urlLang:(chosen&&LANGS[chosen])?chosen:(browserLangs()[0]||"en");
applyLang(first);
if(!urlLang&&!chosen){
  var geo=function(u,f){return Promise.race([fetch(u).then(function(r){if(!r.ok)throw 0;return r.json()}).then(f),new Promise(function(_,no){setTimeout(no,2500)})])};
  geo("https://api.country.is/",function(j){return j.country})
   .catch(function(){return geo("https://ipapi.co/json/",function(j){return j.country_code})})
   .then(function(c){ if(!c)return; c=String(c).toUpperCase(); var l=pickFor(c); if(l!==L)applyLang(l) }).catch(function(){});
}
loadShelf("candies");
var day=new Date().toISOString().slice(0,10);
getJSON("data/certifiers.json?d="+day).then(function(j){CERTS=j;renderCerts();if(last)render(last.p,last.r)}).catch(function(){});
getJSON("data/changes.json?d="+day).then(function(j){CHANGES=j;renderChanges()}).catch(function(){});
renderWatch(); checkWatch();
document.addEventListener("keydown",function(e){if(e.key==="Escape"){if(!$("lb").hidden)$("lb").hidden=true;else closePlace()}});
$("pf").addEventListener("submit",function(e){e.preventDefault();findCity($("city").value)});
$("addF").addEventListener("submit",function(e){e.preventDefault();addPlace()});
$("addPhoto").addEventListener("change",function(){$("addPhotoL").textContent=(this.files&&this.files[0])?"✓ "+t("addPhoto"):t("addPhoto")});
// approximate position from the connection, no permission prompt: the section opens already filled
fetch("https://ipapi.co/json/").then(function(r){return r.ok?r.json():null}).then(function(j){ if(j&&j.latitude&&!PLACES.length){ if(j.city)$("city").value=j.city; loadPlaces(j.latitude,j.longitude) } }).catch(function(){});
$("logoPhoto").addEventListener("change",function(e){var f=e.target.files&&e.target.files[0];if(f)sendPhoto(f);e.target.value=""});
fetch(HSAPI+"/api/health").then(function(r){if(r.ok){HSAPI_OK=true;if(last)render(last.p,last.r);if(PLACES.length){renderPlaces();loadPlaceCounts()}
  fetch(HSAPI+"/api/collections/community_stats/records/all").then(function(r){return r.ok?r.json():null}).then(function(j){if(j&&j.n>=50){$("cstat").hidden=false;$("cstat").dataset.n=j.n;$("cstat").textContent=t("stats").replace("{n}",j.n)}}).catch(function(){})}}).catch(function(){});
fromHash();
})();
