# Incident RCA Report — INC-1042
## UPI Payment Failure
**Generated**: 2026-10-09T02:10:36.884Z
**Domain**: Banking / Payments
**Incident Window**: 09:52 — 10:40 IST
**Services Affected**: upi-gateway, txn-orchestrator, cbs-connector, core-banking, vpa-lookup-service, redis-vpa-cache, notify-service, settlement-worker
**Peak Error Rate**: 22%
**MTTR**: 38 min

---

## Root Cause
**Deploy D104 — pool.max_size 50 → 8**
Confidence: 87% (evidence-weighted)

### Causal Chain
1. Deploy D104 (pool 50→8)
2. CBS Connector pool exhaustion
3. Txn Orchestrator timeouts
4. UPI Gateway failures (22%)
5. Pending debits (4,800)
6. HTTP 500s to users

---

## Supporting Evidence
- **E-01** [change]: Deploy D104 changed pool.max_size from 50 to 8 _(D104 @ 09:52:10)_
- **E-02** [metric]: Pool utilization pinned at 100% from 10:03 _(cbs_connector_pool_utilization @ 10:03)_
- **E-03** [metric]: p99 latency jumped 180ms → 6,200ms at onset _(cbs_connector_p99_latency @ 10:03)_
- **E-04** [trace]: Trace shows 6,110ms blocked at cbs-connector _(trace t-9f2a)_
- **E-05** [metric]: Failure rate recovered after D104 rollback _(upi_gateway_failure_rate @ 10:31)_

## Misleading Signals
- **E-06** [misleading]: DB timeout at 10:01:38 preceded onset
- **E-07** [contradicting]: DB timeout recurs daily — not novel
- **E-08** [misleading]: Redis memory is a slow 3-week drift
- **E-09** [contradicting]: Tuning Redis at 10:15 had no effect on payments
- **E-10** [contradicting]: notify-service has no path to payment nodes

---

## Scoring Breakdown (D104)
| Temporal Precedence | weight=0.25 | score=0.92 | contribution=0.230 |
| Topological Proximity | weight=0.25 | score=0.96 | contribution=0.240 |
| Anomaly Onset Ordering | weight=0.2 | score=0.85 | contribution=0.170 |
| Blast Radius Coverage | weight=0.15 | score=0.80 | contribution=0.120 |
| Change Correlation | weight=0.15 | score=0.73 | contribution=0.110 |
**Composite**: 0.87

## Counterfactual Test
Remove: Deploy D104 — pool.max_size 50 → 8
Verdict: **NECESSARY**
- UPI gateway failure rate 22%: ✓ resolved
- Pending debits reaching 4,800: ✓ resolved
- CBS connector pool at 100%: ✓ resolved
- DB timeout at 10:01:38: ⚠ still occurs
- notify-service SMS 503s: ⚠ still occurs

Primary symptoms disappear when D104 is removed. The DB timeout still fires and is harmless. The notify-service 503s are chronic daily noise.

---

## Recommended Actions
1. **Roll back D104** — Leading hypothesis is a deployment-induced pool exhaustion
   Verify: Pool utilization drops below 50%; p99 returns below 200ms
2. **Reconcile 4,800 pending debits** — Transactions were debited but not credited
   Verify: Pending transaction count returns to baseline (<20)
3. **Add config-schema guard on pool sizes** — Prevent pool.max_size below minimum threshold
   Verify: CI rejects pool.max_size < 20
4. **Add saturation alert at 80% pool utilization** — Early warning before pool exhaustion
   Verify: Alert fires in staging at 80%

---
_Pygenic Arc · Anvation 2026 · AI-03_
