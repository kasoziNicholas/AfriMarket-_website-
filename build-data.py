import json
# id|name|ticker|exchange|country|region|sector|capBn|price|chg1y|founded|hq|description|h1;h2;h3
C = """naspers|Naspers Ltd|NPN|JSE|South Africa|Southern Africa|Technology|38.5|ZAR 3,120.00|18.5|1915 / Listed 1994|Cape Town, South Africa|Global consumer internet group and a major technology investor, with large stakes through Prosus and Tencent.|Holding structure via Prosus N.V.;Exposure to emerging-market tech across Asia, Latin America and Europe
firstrand|FirstRand Limited|FSR|JSE|South Africa|Southern Africa|Financial Services|21.8|ZAR 68.40|12.3|1998|Johannesburg, South Africa|One of Africa's largest financial services groups, offering retail, commercial and investment banking through FNB, RMB and WesBank.|Strong return on equity among African banks;Digital retail banking pioneer in Southern Africa
mtn-group|MTN Group Limited|MTN|JSE|South Africa|Southern Africa|Telecommunications|13.2|ZAR 112.50|14.8|1994|Johannesburg, South Africa|Pan-African mobile operator serving hundreds of millions of subscribers across Africa and the Middle East.|Leading positions in Nigeria, Ghana and South Africa;Growing MoMo mobile money business
dangote-cement|Dangote Cement Plc|DANGCEM|NGX|Nigeria|West Africa|Industrial|11.9|NGN 650.00|34.2|1992|Lagos, Nigeria|Sub-Saharan Africa's largest cement producer, operating in multiple African countries.|Dominant domestic market share in Nigeria;Exports clinker across West and Central Africa
cib-egypt|Commercial International Bank (CIB)|COMI|EGX|Egypt|North Africa|Financial Services|6.8|EGP 82.50|28.1|1975|Cairo, Egypt|Egypt's leading private-sector bank, with corporate, commercial and retail services.|Heavy weight in the EGX 30 index;Strong trade finance and digital banking
maroc-telecom|Maroc Telecom (Itissalat Al-Maghrib)|IAM|CSE|Morocco|North Africa|Telecommunications|8.9|MAD 96.50|6.4|1998|Rabat, Morocco|Morocco's incumbent telecom operator with subsidiaries across West and Central Africa.|Operates in Morocco and several African markets;Consistently high dividend payouts
safaricom|Safaricom Plc|SCOM|NSE|Kenya|East Africa|Telecommunications|4.2|KES 16.80|8.9|1997|Nairobi, Kenya|East Africa's largest telecom firm, known for pioneering the M-PESA mobile money platform.|M-PESA is central to Kenya's payments system;Expanding into Ethiopia
standard-bank|Standard Bank Group|SBK|JSE|South Africa|Southern Africa|Financial Services|17.8|ZAR 205.00|15.6|1862|Johannesburg, South Africa|Africa's largest banking group by assets, active across Sub-Saharan Africa.|Wide geographic footprint;ICBC is a major strategic shareholder
anglogold-ashanti|AngloGold Ashanti plc|ANG|JSE|South Africa|Southern Africa|Mining & Resources|10.4|ZAR 420.00|26.8|2004|Johannesburg / London|Global gold producer with operations across Africa, Australia and the Americas.|Assets include Geita (Tanzania) and Obuasi (Ghana);Earnings sensitive to gold prices
airtel-africa|Airtel Africa Plc|AIRTELAFRI|NGX|Nigeria|West Africa|Telecommunications|6.3|NGN 2,200.00|21.0|2010|London / Lagos|Telecom and mobile money provider in 14 Sub-Saharan African countries.|Large subscriber base across Nigeria and East Africa;Growing Airtel Money business
gold-fields|Gold Fields Limited|GFI|JSE|South Africa|Southern Africa|Mining & Resources|14.2|ZAR 285.00|22.4|1887|Johannesburg, South Africa|Diversified gold producer with mines in Australia, South Africa, Ghana, Chile and Peru.|Owns the deep-level South Deep mine;Dual-listed on JSE and NYSE
seplat-energy|Seplat Energy Plc|SEPLAT|NGX|Nigeria|West Africa|Energy & Utilities|2.1|NGN 3,400.00|41.5|2009|Lagos, Nigeria|Indigenous Nigerian oil and gas producer supplying gas to the domestic power sector.|Key gas supplier to Nigeria's grid;Dual-listed on NGX and LSE
ecobank-transnational|Ecobank Transnational Incorporated|ETI|BRVM|Togo / BRVM Region|West Africa|Financial Services|1.1|XOF 115.00|11.2|1985|Lome, Togo|Pan-African banking group present in over 30 African countries.|Broad West, Central and East African footprint;Cross-border trade settlement focus
attijariwafa-bank|Attijariwafa Bank|ATW|CSE|Morocco|North Africa|Financial Services|11.5|MAD 510.00|17.3|1904|Casablanca, Morocco|Morocco's largest bank and a major institution in North and Francophone West Africa.|Large network across Africa and Europe;Dominant in Moroccan retail and corporate banking
eabl|East African Breweries PLC (EABL)|EABL|NSE|Kenya|East Africa|Consumer Goods|0.92|KES 145.00|5.2|1922|Nairobi, Kenya|East Africa's leading beverage company with brands such as Tusker and Guinness.|Majority-owned by Diageo;Operates in Kenya, Uganda and Tanzania
mtn-nigeria|MTN Nigeria Communications Plc|MTNN|NGX|Nigeria|West Africa|Telecommunications|4.8|NGN 230.00|-2.4|2001|Lagos, Nigeria|Largest telecom operator in Nigeria, offering voice, data and fintech services.|Early 5G deployment in West Africa;Growing MoMo Payment Service Bank
sonatel|Sonatel|SNTS|BRVM|Senegal|West Africa|Telecommunications|2.9|XOF 18,200|15.1|1985|Dakar, Senegal|One of the largest companies on the BRVM regional exchange; telecom services in Senegal, Mali, Guinea and more.|Heavyweight BRVM constituent;Orange Group is the strategic shareholder
equity-group|Equity Group Holdings Plc|EQTY|NSE|Kenya|East Africa|Financial Services|1.25|KES 42.00|11.8|1984|Nairobi, Kenya|Large East and Central African financial group with banks in Kenya, DRC, Uganda, Rwanda and more.|Expansion in DRC via Equity BCDC;Strong SME and agency banking
fnb-botswana|First National Bank of Botswana|FNBB|BSE|Botswana|Southern Africa|Financial Services|0.85|BWP 4.10|9.3|1991|Gaborone, Botswana|One of Botswana's largest commercial banks, offering retail and commercial banking.|Strong domestic market position;Part of the FirstRand group
eastern-company|Eastern Company S.A.E.|EAST|EGX|Egypt|North Africa|Consumer Goods|1.4|EGP 27.50|31.0|1920|Giza, Egypt|Egypt's main tobacco manufacturer and distributor.|Cash-generative domestic business;Regular dividends
zambian-breweries|Zambian Breweries Plc|ZAMBREW|LuSE|Zambia|Southern Africa|Consumer Goods|0.28|ZMW 8.50|14.5|1968|Lusaka, Zambia|Largest beer maker in Zambia, part of AB InBev, producing Mosi and Castle Lager.|Anchor stock on the Lusaka exchange;Local barley and maize supply chains
gcb-bank|GCB Bank PLC|GCB|GSE|Ghana|West Africa|Financial Services|0.31|GHS 3.80|7.1|1953|Accra, Ghana|One of Ghana's largest indigenous banks with a nationwide branch network.|Wide branch and agent network;Active in government securities
mtn-ghana|Scancom PLC (MTN Ghana)|MTNGH|GSE|Ghana|West Africa|Telecommunications|1.65|GHS 1.60|28.0|1996|Accra, Ghana|Leading telecom provider in Ghana, operating MobileMoney Limited.|One of the largest companies on the Ghana Stock Exchange;Large mobile money base
shoprite|Shoprite Holdings Ltd|SHP|JSE|South Africa|Southern Africa|Consumer Goods|8.2|ZAR 268.00|19.8|1979|Cape Town, South Africa|Africa's largest food retailer, operating thousands of stores across several African countries.|Strong supply-chain network;Sixty60 on-demand delivery growth
vodacom-group|Vodacom Group Limited|VOD|JSE|South Africa|Southern Africa|Telecommunications|11.4|ZAR 102.00|3.8|1993|Midrand, South Africa|African connectivity and financial services provider majority-owned by Vodafone.|Operations in South Africa, DRC, Tanzania, Mozambique and Egypt;M-Pesa and VodaPay platforms
tmg-holding|Talaat Moustafa Group Holding (TMG)|TMGH|EGX|Egypt|North Africa|Real Estate|2.8|EGP 58.00|82.5|1970|Cairo, Egypt|Egypt's largest real estate developer, known for Madinaty and Noor.|Large land bank near Cairo;Hospitality and urban projects
kcb-group|KCB Group Plc|KCB|NSE|Kenya|East Africa|Financial Services|0.81|KES 32.50|24.1|1896|Nairobi, Kenya|One of East Africa's oldest and largest banking networks, active in Kenya, Tanzania, Rwanda, Uganda and DRC.|Regional footprint expanded through acquisitions;Major lender to infrastructure
bua-cement|BUA Cement Plc|BUACEMENT|NGX|Nigeria|West Africa|Industrial|5.9|NGN 140.00|38.6|2008|Lagos / Sokoto, Nigeria|Nigeria's second-largest cement producer with plants in Sokoto and Edo States.|Ongoing capacity expansion;Constituent of the NGX 30 index
lafargeholcim-maroc|LafargeHolcim Maroc|LHM|CSE|Morocco|North Africa|Industrial|4.1|MAD 1,820.00|11.2|1928|Casablanca, Morocco|Leading building materials company in Morocco.|Supplies major infrastructure projects;Large weight on the Casablanca bourse
sasol|Sasol Limited|SOL|JSE|South Africa|Southern Africa|Energy & Utilities|5.2|ZAR 148.00|-28.4|1950|Johannesburg, South Africa|Integrated chemicals and energy company known for coal-to-liquids technology.|Fischer-Tropsch synthetic fuels pioneer;Pivoting toward lower-carbon energy
zenith-bank|Zenith Bank Plc|ZENITHBANK|NGX|Nigeria|West Africa|Financial Services|1.85|NGN 38.50|29.5|1990|Lagos, Nigeria|One of Nigeria's largest banks, noted for profitability and digital banking.|Strong capital base;Corporate and institutional focus
palm-hills|Palm Hills Developments|PHDC|EGX|Egypt|North Africa|Real Estate|0.48|EGP 3.90|48.2|1997|Cairo, Egypt|Egyptian developer of residential, commercial and resort communities.|Large land bank around Cairo and the North Coast;Active retail investor trading
nestle-nigeria|Nestle Nigeria Plc|NESTLE|NGX|Nigeria|West Africa|Consumer Goods|0.68|NGN 900.00|-15.2|1961|Lagos, Nigeria|Food and beverage maker producing Maggi, Milo and Nescafe.|Subsidiary of Nestle S.A.;Local raw-material sourcing
letshego|Letshego Holdings Limited|LETSHEGO|BSE|Botswana|Southern Africa|Financial Services|0.21|BWP 1.35|6.8|1998|Gaborone, Botswana|Retail financial services group focused on inclusive finance and micro-lending across Africa.|Lends mainly to public-sector employees;Digital app expansion
sidpec|Sidi Kerir Petrochemicals (Sidpec)|SKPC|EGX|Egypt|North Africa|Energy & Utilities|0.72|EGP 30.50|36.4|1997|Alexandria, Egypt|Egypt's leading petrochemical producer of ethylene and polyethylene.|Key to Egypt's industrial supply chain;Export earnings in foreign currency
seed-co|Seed Co International Limited|SCIL|LuSE|Zambia / Zimbabwe|Southern Africa|Agriculture|0.14|USD 0.28|4.2|1940|Gaborone / Lusaka|Major certified seed company in Sub-Saharan Africa, producing hybrid maize, wheat and soya seed.|Climate-resilient seed breeding;Listed on LuSE and VFEX
gtco|Guaranty Trust Holding Co (GTCO)|GTCO|NGX|Nigeria|West Africa|Financial Services|1.45|NGN 45.00|33.1|1990|Lagos, Nigeria|Financial holding company with banking operations in West Africa, East Africa and the UK.|Known for cost efficiency;Expanding into asset management and payments
sg-cote-divoire|Societe Generale Cote d'Ivoire|SGBC|BRVM|Cote d'Ivoire|West Africa|Financial Services|0.98|XOF 18,500|19.4|1962|Abidjan, Cote d'Ivoire|Leading bank in the Ivorian market and a major BRVM constituent.|Strong balance sheet growth;Constituent of BRVM 30
sanlam|Sanlam Limited|SLM|JSE|South Africa|Southern Africa|Financial Services|9.1|ZAR 76.50|16.2|1918|Cape Town, South Africa|Large African non-banking financial services group covering insurance and asset management.|Presence across many African countries;Large assets under management
centum-investment|Centum Investment Company Plc|CTUM|NSE|Kenya|East Africa|Financial Services|0.085|KES 8.80|-4.5|1967|Nairobi, Kenya|East African investment company with stakes in real estate, financial services and energy.|Developer of Two Rivers in Nairobi;Cross-listed on the Uganda Securities Exchange"""

# code|name|country|city|est|listed|cap|index|currency|hours|description|icon
E = """JSE|Johannesburg Stock Exchange|South Africa|Johannesburg|1887|~330|~$1.1 Trillion|FTSE/JSE Top 40|ZAR (South African Rand)|09:00 - 17:00 SAST|The largest and most liquid exchange in Africa, with equity, derivatives, debt and commodity markets.|fa-chart-line
EGX|Egyptian Exchange|Egypt|Cairo / Alexandria|1883|~210|~$65 Billion|EGX 30|EGP (Egyptian Pound)|10:00 - 14:30 EET|One of the oldest exchanges in the region and a main gateway to Egyptian capital markets.|fa-landmark
NGX|Nigerian Exchange Group|Nigeria|Lagos|1960|~155|~$35 Billion|NGX All-Share Index (ASI)|NGN (Nigerian Naira)|10:00 - 14:30 WAT|West Africa's largest market, covering equities, REITs and fixed income.|fa-money-bill-trend-up
CSE|Casablanca Stock Exchange|Morocco|Casablanca|1929|~75|~$68 Billion|MASI|MAD (Moroccan Dirham)|09:30 - 15:30 WET|North Africa's second-largest exchange, led by financials, telecoms and building materials.|fa-building-columns
BRVM|Bourse Regionale des Valeurs Mobilieres|Regional (8 WAEMU countries)|Abidjan, Cote d'Ivoire|1998|~46|~$14 Billion|BRVM Composite / BRVM 30|XOF (CFA Franc)|09:00 - 15:00 GMT|Regional exchange shared by eight West African francophone countries.|fa-globe
NSE|Nairobi Securities Exchange|Kenya|Nairobi|1954|~62|~$11 Billion|NASI / NSE 20|KES (Kenyan Shilling)|09:00 - 15:00 EAT|East Africa's main capital market, strong in telecoms, fintech and banking.|fa-chart-simple
GSE|Ghana Stock Exchange|Ghana|Accra|1990|~38|~$6 Billion|GSE Composite Index|GHS (Ghanaian Cedi)|10:00 - 15:00 GMT|West African market hosting telecoms, mining, banking and consumer companies.|fa-coins
BSE|Botswana Stock Exchange|Botswana|Gaborone|1989|~34|~$3.8 Billion|Domestic Companies Index (DCI)|BWP (Botswana Pula)|10:00 - 14:00 CAT|Known for stability and strong institutional investor participation.|fa-gem
LuSE|Lusaka Securities Exchange|Zambia|Lusaka|1993|~24|~$2.2 Billion|LuSE All Share Index (LASI)|ZMW (Zambian Kwacha)|10:00 - 13:00 CAT|Zambia's main capital platform, with brewing, agriculture and retail companies.|fa-wheat-awn"""

comps = []
for line in C.split("\n"):
    f = line.split("|")
    assert len(f) == 14, (len(f), line[:40])
    comps.append(dict(id=f[0], name=f[1], ticker=f[2], exchange=f[3], country=f[4], region=f[5], sector=f[6],
        marketCapUsd=round(float(f[7]) * 1e9), price=f[8], change1Y=float(f[9]), founded=f[10], headquarters=f[11],
        description=f[12], highlights=f[13].split(";")))
exs = []
for line in E.split("\n"):
    f = line.split("|")
    assert len(f) == 12, (len(f), line[:30])
    exs.append(dict(code=f[0], name=f[1], country=f[2], city=f[3], established=int(f[4]), listedCount=f[5], marketCap=f[6],
        benchmarkIndex=f[7], currency=f[8], tradingHours=f[9], description=f[10], icon=f[11]))
ids = [c["id"] for c in comps]
assert len(ids) == len(set(ids))
codes = {e["code"] for e in exs}
assert all(c["exchange"] in codes for c in comps)
meta = {"asOf": "2026-10-11", "dataStatus": "illustrative"}
json.dump({"meta": meta, "companies": comps}, open("data/companies.json", "w"), ensure_ascii=False, indent=1)
json.dump({"meta": meta, "exchanges": exs}, open("data/exchanges.json", "w"), ensure_ascii=False, indent=1)
print(len(comps), "companies;", len(exs), "exchanges")
