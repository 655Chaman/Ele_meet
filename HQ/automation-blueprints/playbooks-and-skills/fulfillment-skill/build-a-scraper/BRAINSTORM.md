# Custom Scrapers — Brainstorm

## Architecture
```
Apify Actor (we build) → Dataset ID → Station → I Layer → MCP → Intros
```
Every scraper is a tap that feeds fresh deal flow into the platform.
Double monetization: scraper revenue (Apify Store) + platform revenue (Connector OS).

## Apify Basics
- Stack: Node.js/TypeScript, Crawlee framework
- Deploy: `apify push` → runs in cloud → outputs dataset ID
- Monetization: Pay per result ($3-5/1K), rental ($30-50/mo), Apify takes 20%
- Anti-scraping included: proxy rotation, browser fingerprinting, session mgmt
- Top creators: $10K+/month

---

## Scraper Ideas

### 1. VC/PE Fund Team Scraper
- **Source:** Fund websites (team pages), Crunchbase, PitchBook public profiles
- **Output:** first_name, last_name, company_name, job_title, investment_stage, sector_focus, location
- **Signal:** Who manages what fund, what stage, what sector — supply side for capital markets
- **Pricing:** $3-5/1,000 contacts
- **Why first:** We already tested this exact dataset format (50 contacts, 70% hit rate, 26s)

### 2. SaaS Hiring Signal Scraper
- **Source:** Lever, Greenhouse, Ashby job boards (public APIs)
- **Output:** company, department, role_count, seniority, growth_rate, tech_stack
- **Signal:** Hiring 5 engineers = expansion = demand for tooling/services
- **Pricing:** $2-4/1,000 signals
- **Why:** Hiring IS the demand signal. Company scaling engineering = needs infra, tooling, consulting

### 3. Conference/Event Speaker Scraper
- **Source:** Event websites (Web Summit, SaaStr, Money2020, Collision)
- **Output:** person, company, role, event, speaking_topic, panel_title, date
- **Signal:** Speaking topic = intent. CEO on "Scaling GTM" panel = demand for sales infra
- **Pricing:** $5-10/1,000 speakers (high value, low volume)
- **Why:** Conference speakers are decision-makers publicly broadcasting their priorities

### 4. Service Provider Directory Scraper
- **Source:** Clutch, G2, Capterra, GoodFirms
- **Output:** company, service_category, pricing_tier, client_count, avg_rating, location, specialties
- **Signal:** Pre-built supply side for any market
- **Pricing:** $2-3/1,000 companies
- **Why:** Automates what we do manually for pre-built markets. Scrape → classify → match

### 5. LinkedIn Company Updates Scraper
- **Source:** LinkedIn company pages (public data)
- **Output:** company, headcount_now, headcount_6mo_ago, recent_posts, key_hires, industry
- **Signal:** Headcount delta = growth/contraction. Key hires = strategic shift
- **Pricing:** $3/1,000 companies
- **Why:** Employee count changes are the strongest leading indicator of company intent

### 6. Funding Round Scraper
- **Source:** Crunchbase, TechCrunch, press releases
- **Output:** company, round_type, amount, lead_investor, date, sector, description
- **Signal:** Series A = hiring spree incoming. Series B = scaling ops. Acquisition = integration needs
- **Pricing:** $5/1,000 rounds
- **Why:** Funding is the strongest demand trigger — money in = money out on tools/services

### 7. Government Contract / RFP Scraper
- **Source:** SAM.gov, state procurement portals, FBO
- **Output:** agency, title, description, value, deadline, naics_code, set_aside_type
- **Signal:** Active demand with budget attached. Literal RFPs.
- **Pricing:** $10/1,000 contracts (high value)
- **Why:** Government procurement is public, structured, and has explicit demand signals

### 8. Tech Stack / Built With Scraper
- **Source:** BuiltWith, Wappalyzer, job postings (infer stack from requirements)
- **Output:** company, domain, technologies[], category, monthly_traffic_estimate
- **Signal:** Company using Segment + Salesforce + HubSpot = specific integration needs
- **Pricing:** $2/1,000 companies
- **Why:** Tech stack = precise targeting for SaaS supply matching

---

## Priority Matrix

| Scraper | Difficulty | Market Size | Signal Value | Revenue Potential |
|---------|-----------|-------------|--------------|-------------------|
| VC/PE Fund Teams | Low | Medium | High | Medium |
| SaaS Hiring Signals | Medium | Large | Very High | High |
| Conference Speakers | Low | Medium | Very High | Medium |
| Service Directories | Low | Large | Medium | High |
| LinkedIn Updates | High | Very Large | High | Very High |
| Funding Rounds | Medium | Large | Very High | High |
| Gov Contracts/RFPs | Medium | Large | Very High | High |
| Tech Stack | Low | Large | Medium | Medium |

## Build Order (Recommended)
1. **Conference Speakers** — low difficulty, very high signal, unique data nobody else has
2. **SaaS Hiring Signals** — job boards have public APIs, hiring = demand
3. **Funding Rounds** — structured data, strong trigger signal
4. **Service Directories** — automates pre-built market creation
