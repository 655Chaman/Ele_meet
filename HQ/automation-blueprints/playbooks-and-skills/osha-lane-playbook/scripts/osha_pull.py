#!/usr/bin/env python3
"""
OSHA enforcement lane — pull S/W/R-cited companies from DOL API v4.

Usage: python3 osha_pull.py <api_key> <out_prefix> [start_date] [end_date]
  states/NAICS configured below; dates default to a 2-10 month trailing window
  (citations post ~30 days after issuance; fresher inspections have nothing public yet).

Outputs: <out_prefix>_inspections.json, <out_prefix>_violations.json

API facts (validated 2026-06-04):
  - base: https://apiprod.dol.gov/v4/get/osha/{inspection|violation}/json
    NOTE: path uses api_url ("inspection"), NOT tablename ("OSHA_inspection") -> 500
  - auth: X-API-KEY as query param (free key from dataportal.dol.gov)
  - filter_object: {"and":[...]}, operators eq/in/gt/lt/like ("33%" wildcard form)
  - limit max 10000, offset paging
  - URL length cap ~2-3KB: keep "in" lists to <=100 activity_nrs per call
  - rate limit: short-window bucket (429s clear in ~90s); sleep 2s between calls,
    back off 45s on 429
  - inspection has nr_in_estab (site headcount) + site address; violation has
    viol_type S/W/R, current_penalty, issuance_date, abate_date/abate_complete
"""
import json, sys, time, urllib.request, urllib.parse
from datetime import date, timedelta

KEY = sys.argv[1]
PREFIX = sys.argv[2]
START = sys.argv[3] if len(sys.argv) > 3 else str(date.today() - timedelta(days=300))
END = sys.argv[4] if len(sys.argv) > 4 else str(date.today() - timedelta(days=60))

STATES = ["OH", "IN", "MI", "IL", "WI"]
NAICS_PREFIXES = ["31%", "32%", "33%", "493%"]
BASE = "https://apiprod.dol.gov/v4/get/osha"


def query(endpoint, filt, limit=10000, offset=0, retries=4):
    q = urllib.parse.urlencode({"filter_object": json.dumps(filt), "limit": limit,
                                "offset": offset, "X-API-KEY": KEY})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(f"{BASE}/{endpoint}/json?{q}", timeout=120) as r:
                body = r.read()
                d = json.loads(body) if body.strip() else []
                return d if isinstance(d, list) else d.get("data") or []
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < retries - 1:
                print(f"  429, backing off 45s", flush=True)
                time.sleep(45); continue
            raise
        except (urllib.error.URLError, ConnectionError, TimeoutError, OSError) as e:
            # transient network failure (connection reset, DNS, timeout) — retry, don't die
            if attempt < retries - 1:
                print(f"  network error ({e}), retry in 20s", flush=True)
                time.sleep(20); continue
            raise
    return []


def main():
    import os
    insp_path = f"{PREFIX}_inspections.json"
    if os.path.exists(insp_path):
        inspections = json.load(open(insp_path))
        print(f"inspections: {len(inspections)} loaded from checkpoint", flush=True)
    else:
        insp_filter = {"and": [
            {"field": "site_state", "operator": "in", "value": STATES},
            {"field": "open_date", "operator": "gt", "value": START},
            {"field": "open_date", "operator": "lt", "value": END},
            {"or": [{"field": "naics_code", "operator": "like", "value": p} for p in NAICS_PREFIXES]},
        ]}
        inspections, offset = [], 0
        while True:
            batch = query("inspection", insp_filter, offset=offset)
            inspections += batch
            print(f"inspections: +{len(batch)} (total {len(inspections)})", flush=True)
            if len(batch) < 10000: break
            offset += 10000; time.sleep(2)
        json.dump(inspections, open(insp_path, "w"))

    # violation join with per-chunk checkpoint (JSONL: one line per chunk, resumable)
    ids = [r["activity_nr"] for r in inspections]
    ck_path = f"{PREFIX}_violations.ckpt.jsonl"
    done_chunks, violations = set(), []
    if os.path.exists(ck_path):
        for ln in open(ck_path):
            rec = json.loads(ln)
            done_chunks.add(rec["chunk"])
            violations += rec["rows"]
        print(f"violations: resumed {len(violations)} rows from {len(done_chunks)} chunks", flush=True)
    with open(ck_path, "a") as ck:
        for i in range(0, len(ids), 100):
            if i in done_chunks:
                continue
            filt = {"and": [
                {"field": "activity_nr", "operator": "in", "value": ids[i:i + 100]},
                {"field": "viol_type", "operator": "in", "value": ["S", "W", "R"]},
            ]}
            rows = query("violation", filt)
            violations += rows
            ck.write(json.dumps({"chunk": i, "rows": rows}) + "\n"); ck.flush()
            if (i // 100) % 5 == 4:
                print(f"violations: {i + 100}/{len(ids)} ids -> {len(violations)}", flush=True)
            time.sleep(2)
    json.dump(violations, open(f"{PREFIX}_violations.json", "w"))
    print(f"DONE: {len(inspections)} inspections, {len(violations)} S/W/R violations, "
          f"{len({v['activity_nr'] for v in violations})} cited inspections", flush=True)


if __name__ == "__main__":
    main()
