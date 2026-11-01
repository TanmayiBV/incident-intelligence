from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, HTMLResponse
import asyncio, json, time, random

app = FastAPI(
    title="Pygenic Arc — Incident Intelligence API",
    description="Production Incident Intelligence System. Correlates operational evidence, reconstructs incidents, and identifies probable root cause.",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

SCENARIOS = {
    "INC-1042": {
        "id": "INC-1042", "title": "UPI Payment Failure", "subtitle": "CBS Connector Pool Exhaustion",
        "domain": "Banking / Payments", "incidentWindow": "09:52 — 10:40 IST",
        "servicesAffected": ["upi-gateway","txn-orchestrator","cbs-connector","core-banking","vpa-lookup-service","redis-vpa-cache","notify-service","settlement-worker"],
        "peakErrorRate": "22%", "mttr": "38 min",
        "rootCause": "Deploy D104 — pool.max_size 50 → 8", "confidence": 0.87,
        "scoringMethod": "Weighted Bayesian Inference",
        "candidates": [
            {"id":"D104","label":"Deploy D104 — pool.max_size 50 → 8","composite":0.87,"verdict":"PROBABLE_ROOT_CAUSE"},
            {"id":"DB_TIMEOUT","label":"DB Timeout at 10:01:38","composite":0.42,"verdict":"INSUFFICIENT"},
            {"id":"REDIS_VPA_94","label":"Redis VPA Cache Memory 94%","composite":0.16,"verdict":"REJECTED"},
            {"id":"NOTIFY_503","label":"notify-service SMS 503 errors","composite":0.06,"verdict":"REJECTED"},
        ],
        "causalChain": ["Deploy D104 (pool 50→8)","CBS Connector pool exhaustion","Transaction orchestrator timeouts","UPI Gateway failures (22%)","Pending debits (4,800)","HTTP 500s to users"],
        "nextActions": ["Roll back D104","Reconcile 4,800 pending debits","Add config-schema guard on pool sizes","Add saturation alert at 80% pool utilization"],
        "counterfactual": {"removedEvent":"D104","verdict":"NECESSARY","symptomsResolved":3,"symptomsRemain":2},
    },
    "INC-2057": {
        "id": "INC-2057", "title": "Food Delivery Ordering Errors", "subtitle": "Pricing Service Thread Saturation",
        "domain": "Food Delivery", "incidentWindow": "19:24 — 20:12 IST",
        "servicesAffected": ["app-gateway","order-service","cart-service","pricing-service","promo-engine","restaurant-catalog","redis-menu-cache","payment-service","dispatch-service","notify-worker"],
        "peakErrorRate": "19%", "mttr": "37 min",
        "rootCause": "Deploy D221 — promo_lookup.per_item = true", "confidence": 0.89,
        "scoringMethod": "Gradient Descent Convergence",
        "candidates": [
            {"id":"D221","label":"Deploy D221 — promo_lookup.per_item = true","composite":0.89,"verdict":"PROBABLE_ROOT_CAUSE"},
            {"id":"PROMO_503","label":"promo-engine 503 at 19:33:12","composite":0.38,"verdict":"INSUFFICIENT"},
            {"id":"REDIS_MENU_91","label":"Redis Menu Cache Memory 91%","composite":0.15,"verdict":"REJECTED"},
            {"id":"NOTIFY_PUSH","label":"notify-worker push 503 errors","composite":0.05,"verdict":"REJECTED"},
        ],
        "causalChain": ["Deploy D221 (per_item=true)","Pricing service thread saturation","Order service timeouts","App gateway failures (19%)","Failed orders (2,100)","Conversion drop 34%"],
        "nextActions": ["Roll back D221","Add thread-pool saturation alert","Require load-test for promo config changes","Add circuit breaker on pricing-service"],
        "counterfactual": {"removedEvent":"D221","verdict":"NECESSARY","symptomsResolved":3,"symptomsRemain":2},
    },
}

INVESTIGATION_STAGES = {
    "INC-1042": [
        {"stage":"INGEST","messages":["INGEST started for INC-1042","Loading 27 log entries...","Loading 5 metric series (70 points)...","Loading 3 traces, 3 change events...","INGEST completed. 482 raw events."]},
        {"stage":"NORMALIZE","messages":["NORMALIZE started","Normalizing logs and metrics...","Normalizing traces and deployments...","NORMALIZE completed. 213 canonical events."]},
        {"stage":"BASELINE","messages":["BASELINE started","BASELINE completed. Thresholds for 8 services."]},
        {"stage":"DETECT","messages":["DETECT started","DETECT found cbs-connector pool anomaly (z=8.4)","DETECT found cbs-connector latency anomaly (z=12.1)","DETECT found 6 anomalies across services"]},
        {"stage":"MAP","messages":["MAP started","MAP completed. Service topology: 8 nodes, 7 edges."]},
        {"stage":"HYPOTHESIZE","messages":["HYPOTHESIZE generated H1: Deploy D104","HYPOTHESIZE generated H2: DB Timeout","HYPOTHESIZE generated H3: Redis VPA 94%","HYPOTHESIZE generated H4: notify-service 503"]},
        {"stage":"TEST","messages":["TEST completed for D104. Score: 0.87","TEST completed for DB_TIMEOUT. Score: 0.42","TEST completed for REDIS_VPA_94. Score: 0.16","TEST completed for NOTIFY_503. Score: 0.06"]},
        {"stage":"REJECT","messages":["REJECT: REDIS_VPA_94 — RED HERRING (R1, R2, R5)","REJECT: NOTIFY_503 — NOISE (R3)","REJECT: DB_TIMEOUT — INSUFFICIENT (R5)"]},
        {"stage":"COUNTERFACTUAL","messages":["COUNTERFACTUAL CHECK: removed D104","Result: NECESSARY. 3 symptoms resolved."]},
        {"stage":"RCA","messages":["RCA started","RCA finalized: Deploy D104 -> Confidence 0.87","RCA complete. 4 actions generated."]},
    ],
    "INC-2057": [
        {"stage":"INGEST","messages":["INGEST started for INC-2057","Loading 25 log entries...","Loading 5 metric series (69 points)...","Loading 2 traces, 3 change events...","INGEST completed. 458 raw events."]},
        {"stage":"NORMALIZE","messages":["NORMALIZE started","Normalizing logs and metrics...","Normalizing traces and deployments...","NORMALIZE completed. 198 canonical events."]},
        {"stage":"BASELINE","messages":["BASELINE started","BASELINE completed. Thresholds for 10 services."]},
        {"stage":"DETECT","messages":["DETECT started","DETECT found pricing-service latency anomaly (z=11.8)","DETECT found order-service timeout spike (z=8.9)","DETECT found 6 anomalies across services"]},
        {"stage":"MAP","messages":["MAP started","MAP completed. Service topology: 10 nodes, 9 edges."]},
        {"stage":"HYPOTHESIZE","messages":["HYPOTHESIZE generated H1: Deploy D221","HYPOTHESIZE generated H2: promo-engine 503","HYPOTHESIZE generated H3: Redis Menu 91%","HYPOTHESIZE generated H4: notify-worker push"]},
        {"stage":"TEST","messages":["TEST completed for D221. Score: 0.89","TEST completed for PROMO_503. Score: 0.38","TEST completed for REDIS_MENU_91. Score: 0.15","TEST completed for NOTIFY_PUSH. Score: 0.05"]},
        {"stage":"REJECT","messages":["REJECT: REDIS_MENU_91 — RED HERRING (R1, R2, R5)","REJECT: NOTIFY_PUSH — NOISE (R3)","REJECT: PROMO_503 — INSUFFICIENT (R5)"]},
        {"stage":"COUNTERFACTUAL","messages":["COUNTERFACTUAL CHECK: removed D221","Result: NECESSARY. 3 symptoms resolved."]},
        {"stage":"RCA","messages":["RCA started","RCA finalized: Deploy D221 -> Confidence 0.89","RCA complete. 4 actions generated."]},
    ],
}

@app.get("/api/scenarios")
def list_scenarios():
    return [{"id":s["id"],"title":s["title"],"domain":s["domain"]} for s in SCENARIOS.values()]

@app.get("/api/rca/{scenario_id}")
def get_rca(scenario_id: str):
    if scenario_id not in SCENARIOS:
        raise HTTPException(404, f"Scenario {scenario_id} not found")
    s = SCENARIOS[scenario_id]
    return {"scenarioId":s["id"],"title":s["title"],"rootCause":s["rootCause"],"confidence":s["confidence"],
            "scoringMethod":s["scoringMethod"],"candidates":s["candidates"],"causalChain":s["causalChain"],
            "counterfactual":s["counterfactual"],"nextActions":s["nextActions"]}

@app.get("/api/investigate/{scenario_id}")
async def investigate_sse(scenario_id: str):
    if scenario_id not in SCENARIOS:
        raise HTTPException(404, f"Scenario {scenario_id} not found")
    stages = INVESTIGATION_STAGES[scenario_id]
    async def gen():
        for sd in stages:
            for msg in sd["messages"]:
                ts = time.strftime("%H:%M:%S")
                yield f"data: {json.dumps({'stage':sd['stage'],'message':msg,'timestamp':ts})}\n\n"
                await asyncio.sleep(0.25 + 0.15 * random.random())
            await asyncio.sleep(0.3)
        yield f"data: {json.dumps({'stage':'DONE','message':'Investigation complete','timestamp':time.strftime('%H:%M:%S')})}\n\n"
    return StreamingResponse(gen(), media_type="text/event-stream", headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"})

# Vercel handler
handler = app
