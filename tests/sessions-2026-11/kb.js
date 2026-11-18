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
  {re:/\b(ar[ôo]me naturel|natural flavou?r|natuurlijk aroma)/i,lvl:"check",k:"aroma"}
];
var WTXT = {
  pork:{fr:"Ingrédient de porc cité dans la liste.",nl:"Varkensingrediënt in de lijst.",en:"Pork ingredient listed.",ar:"مكوّن من الخنزير مذكور في القائمة."},
  alcohol:{fr:"Alcool ou boisson alcoolisée cité dans la liste.",nl:"Alcohol of alcoholische drank in de lijst.",en:"Alcohol or an alcoholic drink is listed.",ar:"كحول أو مشروب كحولي مذكور في القائمة."},
  gelatin:{fr:"Gélatine sans origine indiquée : souvent de porc.",nl:"Gelatine zonder herkomst: vaak van varken.",en:"Gelatine with no stated origin: often pork.",ar:"جيلاتين بدون مصدر محدد، غالباً من الخنزير."},
  rennet:{fr:"Présure : peut être animale. Demandez l'origine.",nl:"Stremsel: kan dierlijk zijn. Vraag de herkomst.",en:"Rennet: may be animal. Ask for the origin.",ar:"المنفحة قد تكون حيوانية، اسأل عن المصدر."},
  aroma:{fr:"Arôme naturel : le support peut contenir de l'alcool.",nl:"Natuurlijk aroma: de drager kan alcohol bevatten.",en:"Natural flavouring: the carrier can contain alcohol.",ar:"نكهة طبيعية: قد تحتوي المادة الحاملة على كحول."}
};
var SAFE_GEL = /(g[ée]latine?|gelatine)\s*(de|of|van)?\s*(b(oe|œ)uf|bovine?|beef|rund\w*|poisson|fish|vis)\b/i;

