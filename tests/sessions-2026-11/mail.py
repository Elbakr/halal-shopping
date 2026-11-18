import os
from urllib.parse import quote
D=[("ideliver.fr",2089,10.99),("dabadrive.com",1355,21.99),("dabamusic.com",1327,21.99),("ineed.shopping",1280,41.28),("moroccandresss.com",946,21.99),("electrozeyn.com",920,21.99),("ideliver.be",919,12.99),("kareem.be",640,12.99),("leroidulustre.com",560,21.99),("thetoys.be",522,12.99),("kadeaux.be",390,12.99),("montaf.be",339,12.99),("superaction.be",330,12.99),("electrozeyn.be",313,12.99),("superaction.nl",258,7.99),("leroidulustre.eu",242,10.99),("investigators.news",236,50.25),("leroidulustre.be",190,12.99)]
r=lambda x:int(round(x/10.0)*10)
TO=os.environ.get("HS_MAIL_TO","")
def link(d,label,txt):
    href="mailto:%s?subject=%s&body=%s"%(TO,quote("Domaine "+d),quote(d+" : "+txt))
    return '<a href="%s" style="display:inline-block;margin:2px 4px 2px 0;padding:4px 8px;border:1px solid #999;border-radius:4px;text-decoration:none;color:#111">%s</a>'%(href,label)
rows=[]
for d,v,c in D:
    a,b,m=r(v),r(v*1.5),r(v*0.7)
    rows.append('<tr><td style="padding:6px 8px;border-bottom:1px solid #ddd"><b>%s</b><br><span style="color:#666;font-size:12px">estimé %s $ · coûte %s €/an</span></td><td style="padding:6px 8px;border-bottom:1px solid #ddd">%s%s%s%s</td></tr>'%(d,v,("%.2f"%c).replace(".",","),link(d,"Vendre %s $"%m,"VENDRE à %s $"%m),link(d,"Vendre %s $"%a,"VENDRE à %s $"%a),link(d,"Vendre %s $"%b,"VENDRE à %s $"%b),link(d,"Garder","GARDER")))
tot=sum(c for _,_,c in D)
html='''<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">
<p>Kamal,</p>
<p>On paie chaque année des domaines qui ne servent à rien. J'aimerais mettre en vente ceux de la liste ci-dessous sur Afternic, la plateforme de revente de GoDaddy. Un acheteur paie, GoDaddy fait le transfert et garde une commission. Rien d'autre à gérer.</p>
<p>Ces 18 noms nous coûtent %s € par an. Les prix sont l'estimation automatique de GoDaddy, ce n'est pas une offre.</p>
<p>Pour chaque domaine, clique sur ton choix : le prix bas vend plus vite, le prix haut rapporte plus. Un mail se prépare tout seul, tu n'as qu'à l'envoyer. Ceux que tu ne valides pas restent chez nous.</p>
<table style="border-collapse:collapse;width:100%%;max-width:640px">%s</table>
<p>Merci.</p><p>Karim</p></div>'''%(("%.2f"%tot).replace(".",","),"".join(rows))
open("kamal.html","w").write(html)
print(len(D),round(tot,2),len(html))
