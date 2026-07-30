# Harmonic Pattern EA (MetaTrader 5)

An Expert Advisor that trades **advanced harmonic patterns** — Gartley, Bat,
Butterfly, Crab, Deep Crab and Cypher — using confirmed swing structure, a
Potential Reversal Zone (PRZ) projection, a 0–100 confluence score, and
risk-based scaled exits.

> **Reality check first.** Harmonic trading has a modest, regime-dependent
> edge at best. Most of what actually works here is *generic good practice the
> method forces on you*: enter at a level, in the trend, with confirmation,
> defined risk, and scaled exits. Treat this as a disciplined automation of
> that process — **not** a guaranteed money machine. Backtest and demo-test
> before risking real capital.

---

## What it does

1. **Non-repainting swing detection.** A confirmed fractal ZigZag builds the
   swing points. A pivot only counts once `InpPivotDepth` bars have closed on
   *both* sides, so the structure the EA sees live is the same one you'd see
   after the fact — no lookahead, no repaint.
2. **Pattern gating.** The last four confirmed pivots are treated as X‑A‑B‑C.
   The EA checks the *established* ratios (AB/XA and BC/AB — or BC/XA for
   Cypher) against each pattern's Fibonacci band, with a configurable
   tolerance.
3. **PRZ projection.** For every surviving pattern it projects where **D**
   should complete (the overlap of the AD and CD Fibonacci projections; for
   Cypher, the 0.786 retracement of XC).
4. **Confirmation entry.** It does **not** fire a blind limit at D. It waits
   for price to react *inside* the PRZ on a closed bar, with:
   - a reversal candle (engulfing / pin / strong body), and
   - an RSI extreme, and optionally RSI divergence (BAMM-style), and
   - higher-timeframe trend alignment.
5. **Confluence score (0–100).** PRZ tightness vs ATR, trend alignment, RSI +
   divergence, AB=CD confluence inside the PRZ, and per-pattern reliability are
   combined. Only setups scoring `>= InpMinScore` are traded, and the
   best-scoring pattern on the bar wins.
6. **Risk & exits.** Position size from `% risk` and stop distance; structural
   stop (beyond X for retracement patterns, beyond D for extensions); up to 3
   scale-out targets at 0.382 / 0.618 of the D→A leg and point C (or A);
   break-even after TP1 and optional ATR trailing after TP2.

---

## Install

1. In MetaTrader 5: **File → Open Data Folder**.
2. Copy `HarmonicPatternEA.mq5` into `MQL5/Experts/`.
3. Open **MetaEditor** (F4), open the file, press **Compile** (F7). It should
   compile with 0 errors.
4. Back in MT5, refresh the **Navigator**, drag the EA onto a chart.
5. On the **Common** tab, tick **Allow Algo Trading**, and make sure the global
   **Algo Trading** button in the toolbar is on.

---

## Recommended starting setup

- **Instruments:** liquid FX majors, indices, or large-cap crypto.
- **Timeframe:** H1 and above. Sub-15m is mostly noise for harmonics.
- **Trend timeframe:** 3–6× the chart TF (default H4 while trading H1).
- Start on a **demo account**, then a **Strategy Tester** run over several
  years / regimes before going live.

### Key inputs to tune

| Input | Effect |
|---|---|
| `InpPivotDepth` | Swing sensitivity. Higher = fewer, cleaner patterns but later entries. This is a real hyperparameter — walk-forward test it. |
| `InpRatioTolerance` | Fib band width. ~0.05–0.08 is sane. Too tight finds nothing; too loose finds "patterns" everywhere. |
| `InpMinScore` | Selectivity. Raise it to trade only A+ confluence setups (fewer trades, higher quality). |
| `InpRiskPercent` | Risk per setup. Keep it small (0.5–1%). The full setup may open up to 3 positions sharing this risk. |
| `InpNumScaleOuts` | 1–3 scale-out positions. Auto-reduced if your lot size can't be split into broker min lots. |
| `InpUseTrendFilter` / `InpUseRSIFilter` / `InpRequireCandle` | The three confirmation gates. Turning them off increases trade count and lowers quality. |

---

## How it manages a trade

- **Entry:** market order(s) on the open of the bar after price confirms in the
  PRZ.
- **Stop:** beyond point X (Gartley / Bat / Cypher) or beyond D (Butterfly /
  Crab / Deep Crab), plus an ATR buffer.
- **Targets:** TP1 = 0.382 and TP2 = 0.618 of the D→A leg; TP3 = point C (or A).
- **Break-even:** once price reaches TP1, remaining positions move to
  break-even (+ a small ATR offset).
- **Trailing:** after TP2, the runner trails by `InpTrailATRmult × ATR`.

---

## Honest limitations

- **Subjectivity is real.** Different `InpPivotDepth` values produce entirely
  different pattern sets on the same chart. There is no single "correct"
  sensitivity — test it.
- **Published win rates (60–70%) are mostly unaudited.** Expect closer to
  40–50% with a 2:1+ reward:risk, which is still tradeable *with* the
  confirmation filters — but only then.
- **Cypher, Shark and 5-0** use non-standard measurement. Cypher is
  implemented; Shark and 5-0 are intentionally left out to keep the ratio math
  provably correct. They can be added later as their own special cases.
- **Spreads, slippage and swap** matter a lot at the timeframes this trades.
  Use realistic tester settings.

---

## Disclaimer

This software is provided for educational and research purposes. Trading
leveraged instruments carries a high risk of loss. Nothing here is financial
advice. You are solely responsible for any trades placed with this EA.
