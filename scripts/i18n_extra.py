# -*- coding: utf-8 -*-
KEYS = ["cert","certT","certL","follow","following","watchT","changed","lost","fix","changesT","chAdd","chIng"]
X = {
"fr":["Organisme cité","Qui certifie quoi","Les organismes cités sur les emballages, parmi les 3 000 produits halal les plus scannés.","Suivre ce produit","Suivi","Mes produits suivis","a changé depuis votre dernière visite","ne porte plus de mention halal","Compléter la fiche","Changements détectés","additifs modifiés","liste d'ingrédients modifiée"],
"nl":["Vermelde instantie","Wie certificeert wat","De instanties op de verpakkingen, bij de 3 000 meest gescande halalproducten.","Product volgen","Gevolgd","Mijn gevolgde producten","is veranderd sinds je laatste bezoek","heeft geen halalvermelding meer","Fiche aanvullen","Vastgestelde wijzigingen","additieven gewijzigd","ingrediëntenlijst gewijzigd"],
"en":["Certifier named","Who certifies what","Certifiers named on packs, among the 3,000 most scanned halal products.","Follow this product","Following","My followed products","has changed since your last visit","no longer carries a halal claim","Complete this record","Changes detected","additives changed","ingredient list changed"],
"ar":["الهيئة المذكورة","من يمنح الشهادة","الهيئات المذكورة على العبوات، ضمن أكثر 3000 منتج حلال مسحاً.","تابع هذا المنتج","متابَع","منتجاتي المتابَعة","تغيّر منذ زيارتك الأخيرة","لم يعد يحمل إشارة حلال","أكمل البطاقة","تغييرات مرصودة","تغيّرت الإضافات","تغيّرت قائمة المكونات"],
"es":["Organismo citado","Quién certifica qué","Organismos citados en los envases, entre los 3000 productos halal más escaneados.","Seguir este producto","Siguiendo","Mis productos seguidos","ha cambiado desde su última visita","ya no lleva mención halal","Completar la ficha","Cambios detectados","aditivos modificados","lista de ingredientes modificada"],
"pt":["Certificadora citada","Quem certifica o quê","Certificadoras citadas nas embalagens, entre os 3000 produtos halal mais digitalizados.","Seguir este produto","Seguindo","Meus produtos seguidos","mudou desde a sua última visita","não tem mais menção halal","Completar a ficha","Mudanças detectadas","aditivos alterados","lista de ingredientes alterada"],
"de":["Genannte Stelle","Wer zertifiziert was","Auf Verpackungen genannte Stellen, unter den 3.000 meistgescannten Halal-Produkten.","Produkt folgen","Gefolgt","Meine gefolgten Produkte","hat sich seit Ihrem letzten Besuch geändert","trägt keine Halal-Angabe mehr","Datensatz ergänzen","Erkannte Änderungen","Zusatzstoffe geändert","Zutatenliste geändert"],
"tr":["Belirtilen kuruluş","Kim neyi sertifikalandırıyor","En çok taranan 3.000 helal ürün arasında ambalajlarda adı geçen kuruluşlar.","Bu ürünü takip et","Takipte","Takip ettiğim ürünler","son ziyaretinizden beri değişti","artık helal ibaresi taşımıyor","Kaydı tamamla","Tespit edilen değişiklikler","katkı maddeleri değişti","içerik listesi değişti"],
"id":["Lembaga yang disebut","Siapa menyertifikasi apa","Lembaga yang tertera di kemasan, di antara 3.000 produk halal yang paling sering dipindai.","Ikuti produk ini","Diikuti","Produk yang saya ikuti","berubah sejak kunjungan terakhir Anda","tidak lagi memiliki keterangan halal","Lengkapi data","Perubahan terdeteksi","bahan tambahan berubah","daftar bahan berubah"],
"ms":["Badan yang dinyatakan","Siapa mensijilkan apa","Badan yang tertera pada pembungkusan, antara 3,000 produk halal paling kerap diimbas.","Ikuti produk ini","Diikuti","Produk yang saya ikuti","telah berubah sejak lawatan terakhir anda","tidak lagi mempunyai pernyataan halal","Lengkapkan rekod","Perubahan dikesan","bahan tambah berubah","senarai ramuan berubah"],
"ru":["Указанный орган","Кто что сертифицирует","Органы, указанные на упаковках, среди 3000 самых сканируемых халяль-товаров.","Следить за товаром","Отслеживается","Мои отслеживаемые товары","изменился с вашего последнего визита","больше не имеет отметки халяль","Дополнить карточку","Обнаруженные изменения","изменились добавки","изменился состав"],
"zh":["标注的认证机构","谁在认证","在扫描量最高的 3000 款清真商品中，包装上标注的认证机构。","关注此商品","已关注","我关注的商品","自您上次访问后已发生变化","已不再带有清真标识","完善信息","检测到的变化","添加剂有变化","配料表有变化"],
"ja":["記載の認証機関","どこが認証しているか","最もスキャンされたハラール商品 3,000 点のパッケージに記載された認証機関。","この商品をフォロー","フォロー中","フォロー中の商品","前回の訪問から変更がありました","ハラール表示がなくなりました","情報を補う","検出された変更","添加物が変更","原材料表が変更"],
"hi":["उल्लिखित संस्था","कौन क्या प्रमाणित करता है","सबसे ज़्यादा स्कैन किए गए 3,000 हलाल उत्पादों के पैकेट पर लिखी संस्थाएँ।","इस उत्पाद को फ़ॉलो करें","फ़ॉलो किया","मेरे फ़ॉलो किए उत्पाद","आपकी पिछली विज़िट के बाद बदल गया है","अब हलाल का उल्लेख नहीं है","जानकारी पूरी करें","पाए गए बदलाव","एडिटिव बदले","सामग्री सूची बदली"],
"bn":["উল্লিখিত সংস্থা","কে কী সনদ দেয়","সবচেয়ে বেশি স্ক্যান করা ৩,০০০ হালাল পণ্যের প্যাকেটে লেখা সংস্থাগুলো।","এই পণ্য অনুসরণ করুন","অনুসরণ করছেন","আমার অনুসরণ করা পণ্য","আপনার শেষ ভিজিটের পর বদলেছে","আর হালাল উল্লেখ নেই","তথ্য সম্পূর্ণ করুন","শনাক্ত পরিবর্তন","সংযোজক বদলেছে","উপাদান তালিকা বদলেছে"],
"ur":["مذکورہ ادارہ","کون کیا تصدیق کرتا ہے","سب سے زیادہ اسکین ہونے والی 3,000 حلال مصنوعات کے پیکٹ پر درج ادارے۔","اس پروڈکٹ کو فالو کریں","فالو ہو رہا ہے","میری فالو کردہ مصنوعات","آپ کے پچھلے دورے کے بعد بدل گیا ہے","اب حلال کا ذکر نہیں","ریکارڈ مکمل کریں","معلوم شدہ تبدیلیاں","اضافی اجزاء بدل گئے","اجزاء کی فہرست بدل گئی"],
}

KEYS2 = ["sendLogo", "sent", "sendFail"]
X2 = {
"fr":["Envoyer une photo du logo halal","Merci, photo reçue. Elle sera vérifiée avant d'enrichir la fiche.","L'envoi n'a pas abouti. Réessayez dans un instant."],
"nl":["Foto van het halallogo sturen","Bedankt, foto ontvangen. Ze wordt gecontroleerd voor ze de fiche aanvult.","Verzenden mislukt. Probeer zo opnieuw."],
"en":["Send a photo of the halal logo","Thanks, photo received. It will be checked before it enriches the record.","Sending failed. Try again in a moment."],
"ar":["أرسل صورة لشعار الحلال","شكراً، وصلت الصورة. ستُراجع قبل إضافتها إلى البطاقة.","تعذّر الإرسال. حاول بعد قليل."],
"es":["Enviar una foto del logotipo halal","Gracias, foto recibida. Se revisará antes de completar la ficha.","El envío falló. Inténtelo de nuevo en un momento."],
"pt":["Enviar uma foto do logotipo halal","Obrigado, foto recebida. Será verificada antes de completar a ficha.","O envio falhou. Tente de novo daqui a pouco."],
"de":["Foto des Halal-Logos senden","Danke, Foto erhalten. Es wird geprüft, bevor es den Datensatz ergänzt.","Senden fehlgeschlagen. Bitte gleich noch einmal versuchen."],
"tr":["Helal logosunun fotoğrafını gönder","Teşekkürler, fotoğraf alındı. Kayda eklenmeden önce kontrol edilecek.","Gönderilemedi. Birazdan tekrar deneyin."],
"id":["Kirim foto logo halal","Terima kasih, foto diterima. Akan diperiksa sebelum melengkapi data.","Pengiriman gagal. Coba lagi sebentar lagi."],
"ms":["Hantar foto logo halal","Terima kasih, foto diterima. Ia akan disemak sebelum melengkapkan rekod.","Penghantaran gagal. Cuba lagi sebentar."],
"ru":["Отправить фото логотипа халяль","Спасибо, фото получено. Его проверят перед добавлением в карточку.","Не удалось отправить. Попробуйте чуть позже."],
"zh":["上传清真标志照片","谢谢，照片已收到。审核后将用于完善商品信息。","发送失败，请稍后再试。"],
"ja":["ハラールロゴの写真を送る","ありがとうございます。写真を受け取りました。確認後に情報へ反映します。","送信できませんでした。少し後にもう一度お試しください。"],
"hi":["हलाल लोगो की फ़ोटो भेजें","धन्यवाद, फ़ोटो मिल गई। जाँच के बाद इसे जानकारी में जोड़ा जाएगा।","भेजना नहीं हो सका। थोड़ी देर में फिर कोशिश करें।"],
"bn":["হালাল লোগোর ছবি পাঠান","ধন্যবাদ, ছবি পাওয়া গেছে। যাচাইয়ের পর তথ্যে যোগ হবে।","পাঠানো যায়নি। একটু পরে আবার চেষ্টা করুন।"],
"ur":["حلال لوگو کی تصویر بھیجیں","شکریہ، تصویر مل گئی۔ جانچ کے بعد ریکارڈ میں شامل ہوگی۔","بھیجنا ممکن نہ ہوا۔ تھوڑی دیر بعد دوبارہ کوشش کریں۔"],
}
