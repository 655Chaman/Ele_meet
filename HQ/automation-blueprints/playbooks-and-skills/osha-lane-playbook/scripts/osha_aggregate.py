import json, re
from collections import defaultdict, Counter

insp = {r['activity_nr']: r for r in json.load(open('/tmp/osha_inspections.json'))}
viols = json.load(open('/tmp/osha_violations.json'))

# Fortune-500 / giant blocklist (post-pull, per spec: no F500, they have safety armies)
BLOCK = re.compile(r'\b(ford motor|general motors|honda|toyota|stellantis|chrysler|hitachi|whirlpool|procter|kraft|nestle|pepsico|coca[- ]cola|tyson|cargill|dupont|sherwin[- ]williams|goodyear tire|caterpillar|john deere|boeing|general electric|amazon|walmart|target corp|kroger|abbott lab|abbvie|eaton corp|parker hannifin|cummins|borgwarner|magna international|denso|robert bosch|siemens|novelis|alcoa|arcelormittal|u\.?s\.? steel|cleveland[- ]cliffs|nucor|steel dynamics|international paper|georgia[- ]pacific|owens[- ](corning|illinois)|ball corp|crown holdings|berry global|sealed air|smithfield|jbs usa|conagra|general mills|kellogg|post holdings|molson coors|millercoors|anheuser|oshkosh corp|harley[- ]davidson|polaris ind|rockwell automation|emerson electric|honeywell|raytheon|lockheed|northrop|l3harris|textron|illinois tool works|stanley black|snap[- ]on inc|kohler co|lg energy|3m company|dow chemical|dow inc)\b', re.I)

byact = defaultdict(list)
for v in viols: byact[v['activity_nr']].append(v)

companies = defaultdict(lambda: {"sites": set(), "inspections": [], "s":0,"w":0,"r":0,
                                  "penalty":0.0,"latest_issuance":"","abate_open":0,"naics":set(),
                                  "states":set(),"hc":[]})
def norm(name):
    n = name.upper().strip()
    n = re.sub(r'[.,]', '', n)
    n = re.sub(r'\b(INC|LLC|LTD|CORP|CORPORATION|COMPANY|CO|USA|US|OF|THE)\b', '', n)
    return re.sub(r'\s+', ' ', n).strip()

for act, vlist in byact.items():
    r = insp.get(act)
    if not r: continue
    key = norm(r['estab_name'])
    c = companies[key]
    c.setdefault('display', r['estab_name'].title())
    c['sites'].add((r.get('site_address') or '', r.get('site_city') or '', r['site_state']))
    c['inspections'].append(act)
    c['states'].add(r['site_state']); c['naics'].add(r.get('naics_code') or '')
    if r.get('nr_in_estab'): c['hc'].append(int(r['nr_in_estab']))
    for v in vlist:
        t = v['viol_type'].lower()
        if t in ('s','w','r'): c[t]+=1
        c['penalty'] += float(v.get('current_penalty') or 0)
        d = (v.get('issuance_date') or '')[:10]
        if d > c['latest_issuance']: c['latest_issuance']=d
        if not v.get('abate_complete') and (v.get('abate_date') or '') >= '2026-06-04':
            c['abate_open']+=1

rows=[]
for key,c in companies.items():
    name = c['display']
    site_hc = max(c['hc']) if c['hc'] else None
    f500 = bool(BLOCK.search(name))
    band = ('unknown' if site_hc is None else
            'under_50' if site_hc < 50 else 'sub_100' if site_hc < 100 else
            'fit_100_1000' if site_hc <= 1000 else 'over_1000')
    rows.append({"company": name, "sites": len(c['sites']), "multi_site": len(c['sites'])>1,
        "states": sorted(c['states']), "naics": sorted(x for x in c['naics'] if x),
        "serious": c['s'], "willful": c['w'], "repeat": c['r'],
        "total_current_penalty": round(c['penalty']), "latest_issuance": c['latest_issuance'],
        "abatement_items_open": c['abate_open'], "site_headcount": site_hc,
        "size_band": band, "f500_block": f500,
        "city": sorted(c['sites'])[0][1], "address": sorted(c['sites'])[0][0]})

rows.sort(key=lambda r: (-(r['willful']+r['repeat']), -r['serious'], -r['total_current_penalty']))
json.dump(rows, open('/tmp/lane_companies.json','w'), indent=1)

keep = [r for r in rows if not r['f500_block'] and r['size_band'] not in ('under_50',)]
fit  = [r for r in keep if r['size_band']=='fit_100_1000']
print(f"companies w/ S/W/R: {len(rows)}")
print(f"after F500 + under-50 cut: {len(keep)}")
print(Counter(r['size_band'] for r in keep))
print(f"multi-site: {sum(1 for r in keep if r['multi_site'])}")
print(f"blocked as F500/giant: {[r['company'] for r in rows if r['f500_block']][:12]}")
print("\nTOP 12 by severity:")
for r in [x for x in keep][:12]:
    print(f"  {r['company'][:40]:40} | {'/'.join(r['states'])} | S{r['serious']} W{r['willful']} R{r['repeat']} | ${r['total_current_penalty']:,} | hc {r['site_headcount']} | sites {r['sites']} | issued {r['latest_issuance']}")
