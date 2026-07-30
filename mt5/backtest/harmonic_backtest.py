#!/usr/bin/env python3
"""
Harmonic Pattern EA - Python backtester
=======================================

A faithful Python port of the decision logic in HarmonicPatternEA.mq5, wrapped
in a bar-by-bar backtest loop. Use it to sanity-check the strategy and to test
on your OWN historical data.

IMPORTANT
---------
This is NOT the MetaTrader 5 Strategy Tester. It approximates the EA's logic on
bar OHLC data. It cannot reproduce tick-level fills, real spreads/slippage,
swap, or broker execution. Treat results as directional evidence about the
*logic*, not as a promise of live performance. Always validate in the real MT5
tester and on a demo account before risking capital.

Data input
----------
    python3 harmonic_backtest.py --csv mydata.csv
CSV must have columns: time,open,high,low,close  (volume optional).
Export from MT5: right-click a symbol in Market Watch -> "Bars"/"Ticks" ->
export, or use your broker's history.

No CSV? It generates synthetic data so you can see the engine run:
    python3 harmonic_backtest.py --synthetic gbm      # random walk (no edge)
    python3 harmonic_backtest.py --synthetic planted  # with injected patterns
"""

import argparse
import math
import sys
from dataclasses import dataclass, field

import numpy as np
import pandas as pd

# ----------------------------------------------------------------------------
# Pattern table  (mirrors BuildPatternTable() in the .mq5)
#   name, abLo,abHi, bcLo,bcHi, cdLo,cdHi, adLo,adHi, reliability, retracement, cypher
# ----------------------------------------------------------------------------
PATTERNS = [
    dict(name="Gartley",   ab=(0.618, 0.618), bc=(0.382, 0.886), cd=(1.130, 1.618), ad=(0.786, 0.786), rel=0.90, retr=True,  cypher=False),
    dict(name="Bat",       ab=(0.382, 0.500), bc=(0.382, 0.886), cd=(1.618, 2.618), ad=(0.886, 0.886), rel=1.00, retr=True,  cypher=False),
    dict(name="Butterfly", ab=(0.786, 0.786), bc=(0.382, 0.886), cd=(1.618, 2.240), ad=(1.270, 1.618), rel=0.75, retr=False, cypher=False),
    dict(name="Crab",      ab=(0.382, 0.618), bc=(0.382, 0.886), cd=(2.240, 3.618), ad=(1.618, 1.618), rel=0.85, retr=False, cypher=False),
    dict(name="DeepCrab",  ab=(0.886, 0.886), bc=(0.382, 0.886), cd=(2.000, 3.618), ad=(1.618, 1.618), rel=0.72, retr=False, cypher=False),
    dict(name="Cypher",    ab=(0.382, 0.618), bc=(1.130, 1.414), cd=(0.0, 0.0),     ad=(0.786, 0.786), rel=0.65, retr=True,  cypher=True),
]


@dataclass
class Config:
    # detection
    pivot_depth: int = 3
    lookback: int = 400
    tol: float = 0.06
    # filters / score
    min_score: float = 55.0
    use_trend: bool = True
    trend_factor: int = 4        # HTF = base TF * this (for the trend EMA proxy)
    trend_ma: int = 50
    use_rsi: bool = True
    rsi_period: int = 14
    rsi_buy: float = 40.0
    rsi_sell: float = 60.0
    require_candle: bool = True
    # risk / money
    risk_pct: float = 1.0
    num_scaleouts: int = 3
    atr_period: int = 14
    sl_atr_mult: float = 1.2
    move_be: bool = True
    be_plus_atr: float = 0.1
    use_trailing: bool = True
    trail_atr_mult: float = 1.5
    tp3_at_a: bool = False
    allow_long: bool = True
    allow_short: bool = True
    # costs
    spread_price: float = 0.0    # round-trip cost in price units (set per instrument)
    start_equity: float = 10_000.0
    max_hold_bars: int = 300


# ----------------------------------------------------------------------------
# Indicators (Wilder RSI/ATR, EMA) - vectorised, no lookahead
# ----------------------------------------------------------------------------
def ema(series: np.ndarray, period: int) -> np.ndarray:
    out = np.full_like(series, np.nan, dtype=float)
    if len(series) == 0:
        return out
    k = 2.0 / (period + 1.0)
    out[0] = series[0]
    for i in range(1, len(series)):
        out[i] = series[i] * k + out[i - 1] * (1 - k)
    return out


def wilder_rma(series: np.ndarray, period: int) -> np.ndarray:
    out = np.full_like(series, np.nan, dtype=float)
    if len(series) < period:
        return out
    out[period - 1] = np.mean(series[:period])
    for i in range(period, len(series)):
        out[i] = (out[i - 1] * (period - 1) + series[i]) / period
    return out


def rsi(close: np.ndarray, period: int) -> np.ndarray:
    delta = np.diff(close, prepend=close[0])
    gain = np.where(delta > 0, delta, 0.0)
    loss = np.where(delta < 0, -delta, 0.0)
    avg_gain = wilder_rma(gain, period)
    avg_loss = wilder_rma(loss, period)
    rs = np.divide(avg_gain, avg_loss, out=np.full_like(avg_gain, np.inf), where=avg_loss != 0)
    return 100.0 - 100.0 / (1.0 + rs)


def atr(high, low, close, period: int) -> np.ndarray:
    prev_close = np.roll(close, 1)
    prev_close[0] = close[0]
    tr = np.maximum(high - low, np.maximum(np.abs(high - prev_close), np.abs(low - prev_close)))
    return wilder_rma(tr, period)


def htf_trend_ema(close: np.ndarray, factor: int, period: int) -> np.ndarray:
    """Approximate a higher-timeframe EMA: EMA over an effective longer period."""
    return ema(close, max(period, period * max(1, factor)))


# ----------------------------------------------------------------------------
# Confirmed fractal ZigZag pivots (non-repainting)
# Each pivot carries the bar index at which it becomes CONFIRMED (idx + depth).
# ----------------------------------------------------------------------------
@dataclass
class Pivot:
    idx: int
    price: float
    is_high: bool
    confirm_idx: int


def detect_pivots(high, low, depth) -> list:
    n = len(high)
    raw = []
    for i in range(depth, n - depth):
        hh = high[i]
        is_high = all(high[i + k] < hh and high[i - k] < hh for k in range(1, depth + 1))
        if is_high:
            raw.append(Pivot(i, hh, True, i + depth))
            continue
        ll = low[i]
        is_low = all(low[i + k] > ll and low[i - k] > ll for k in range(1, depth + 1))
        if is_low:
            raw.append(Pivot(i, ll, False, i + depth))
    # collapse consecutive same-type pivots to the more extreme one
    zz = []
    for p in raw:
        if zz and zz[-1].is_high == p.is_high:
            more = p.price > zz[-1].price if p.is_high else p.price < zz[-1].price
            if more:
                zz[-1] = p
        else:
            zz.append(p)
    return zz


def in_band(v, lo, hi, tol):
    return lo * (1 - tol) <= v <= hi * (1 + tol)


def band_fit(v, lo, hi, tol):
    c = (lo + hi) * 0.5
    half = max((hi - lo) * 0.5, c * tol, 1e-9)
    return max(0.0, min(1.0, 1.0 - abs(v - c) / half))


def clamp(v, lo, hi):
    return lo if v < lo else hi if v > hi else v


def project_prz(p, direction, Xp, Ap, Cp, XAm, BCm, XCm, tol):
    if p["cypher"]:
        center = sum(p["ad"]) * 0.5
        band = center * tol + tol * 0.02
        lo, hi = center - band, center + band
        if direction > 0:
            return (Cp - hi * XCm, Cp - lo * XCm)
        return (Cp + lo * XCm, Cp + hi * XCm)
    adLo, adHi = p["ad"][0] * (1 - tol), p["ad"][1] * (1 + tol)
    cdLo, cdHi = p["cd"][0] * (1 - tol), p["cd"][1] * (1 + tol)
    if direction > 0:
        d_ad = (Ap - adHi * XAm, Ap - adLo * XAm)
        d_cd = (Cp - cdHi * BCm, Cp - cdLo * BCm)
    else:
        d_ad = (Ap + adLo * XAm, Ap + adHi * XAm)
        d_cd = (Cp + cdLo * BCm, Cp + cdHi * BCm)
    lo = max(d_ad[0], d_cd[0])
    hi = min(d_ad[1], d_cd[1])
    return (lo, hi) if lo < hi else None


def candle_confirms(direction, o1, c1, h1, l1, o2, c2):
    body = abs(c1 - o1)
    rng = max(h1 - l1, 1e-9)
    up_wick = h1 - max(o1, c1)
    dn_wick = min(o1, c1) - l1
    if direction > 0:
        bull = c1 > o1
        engulf = bull and c1 >= c2 and o1 <= o2 and c2 < o2
        hammer = dn_wick >= body * 1.5 and body / rng <= 0.5 and c1 >= o1 - rng * 0.1
        return engulf or hammer or (bull and body / rng > 0.5)
    bear = c1 < o1
    engulf = bear and c1 <= c2 and o1 >= o2 and c2 > o2
    star = up_wick >= body * 1.5 and body / rng <= 0.5 and c1 <= o1 + rng * 0.1
    return engulf or star or (bear and body / rng > 0.5)


def abcd_confluence(direction, Cp, ABm, prz_lo, prz_hi):
    best = 0.0
    for m in (1.0, 1.272, 1.618):
        d = Cp - m * ABm if direction > 0 else Cp + m * ABm
        if prz_lo <= d <= prz_hi:
            return 1.0
        dist = prz_lo - d if d < prz_lo else d - prz_hi
        w = max(prz_hi - prz_lo, 1e-9)
        best = max(best, 1.0 - clamp(dist / (w * 2.0), 0.0, 1.0))
    return best


def score_setup(p, direction, X, A, B, C, Dprice, XAm, ABm, rAB, rBC,
                prz_lo, prz_hi, atr_v, rsi_now, trend_ok, rsi_at, cfg):
    W = dict(ratio=20, prz=15, trend=15, rsi=20, abcd=15, rel=15)
    rAD = abs(A.price - Dprice) / XAm
    f_ab = band_fit(rAB, p["ab"][0], p["ab"][1], cfg.tol)
    f_bc = band_fit(rBC, p["bc"][0], p["bc"][1], cfg.tol)
    f_ad = band_fit(rAD, p["ad"][0], p["ad"][1], cfg.tol)
    ratio_fit = (f_ab + f_bc + f_ad) / 3.0

    prz_w = abs(prz_hi - prz_lo)
    tight = 1.0 - clamp((prz_w / atr_v - 0.5) / 2.5, 0.0, 1.0)
    trend = 1.0 if trend_ok else 0.0

    rsi_score = 0.0
    if direction > 0 and rsi_now <= cfg.rsi_buy:
        rsi_score = 0.6
    if direction < 0 and rsi_now >= cfg.rsi_sell:
        rsi_score = 0.6
    rsi_B = rsi_at(B.idx)
    if not math.isnan(rsi_B):
        if direction > 0 and Dprice < B.price and rsi_now > rsi_B:
            rsi_score += 0.4
        if direction < 0 and Dprice > B.price and rsi_now < rsi_B:
            rsi_score += 0.4
    rsi_score = clamp(rsi_score, 0.0, 1.0)

    abcd = abcd_confluence(direction, C.price, ABm, prz_lo, prz_hi)
    score = (ratio_fit * W["ratio"] + tight * W["prz"] + trend * W["trend"]
             + rsi_score * W["rsi"] + abcd * W["abcd"] + p["rel"] * W["rel"])
    return clamp(score, 0.0, 100.0)


# ----------------------------------------------------------------------------
# Trade record + simulation
# ----------------------------------------------------------------------------
@dataclass
class Trade:
    entry_idx: int
    direction: int
    pattern: str
    entry: float
    sl: float
    tps: list
    r_result: float = 0.0
    money: float = 0.0
    bars_held: int = 0
    outcome: str = ""


def simulate_trade(df, cfg, atr_arr, entry_idx, direction, pattern, entry,
                   sl_init, tp1, tp2, tp3, equity):
    """Walk bars forward; conservative stop-first fill model."""
    n = len(df)
    high = df["high"].values
    low = df["low"].values
    close = df["close"].values
    risk_dist = abs(entry - sl_init)
    if risk_dist <= 0:
        return None

    tps = [tp1, tp2, tp3][: max(1, min(3, cfg.num_scaleouts))]
    if cfg.num_scaleouts == 1:
        tps = [tp2]
    weight = 1.0 / len(tps)
    remaining = list(tps)          # tp price per open slice
    sl = sl_init
    be_done = False
    trail_on = False
    realized_R = 0.0

    j_end = min(n - 1, entry_idx + cfg.max_hold_bars)
    exit_reason = "timeout"
    for j in range(entry_idx, j_end + 1):
        hi, lo = high[j], low[j]
        # stop-first (conservative)
        stopped = (lo <= sl) if direction > 0 else (hi >= sl)
        if stopped:
            for _ in remaining:
                realized_R += weight * ((sl - entry) if direction > 0 else (entry - sl)) / risk_dist
            remaining = []
            exit_reason = "stop" if sl <= sl_init and direction > 0 or (sl >= sl_init and direction < 0) else "be/stop"
            break
        # take-profits reached this bar
        still = []
        for tp in remaining:
            hit = (hi >= tp) if direction > 0 else (lo <= tp)
            if hit:
                realized_R += weight * ((tp - entry) if direction > 0 else (entry - tp)) / risk_dist
            else:
                still.append(tp)
        remaining = still
        if not remaining:
            exit_reason = "targets"
            break
        # break-even after TP1
        if cfg.move_be and not be_done:
            reached = (hi >= tp1) if direction > 0 else (lo <= tp1)
            if reached:
                sl = (entry + cfg.be_plus_atr * atr_arr[j]) if direction > 0 else (entry - cfg.be_plus_atr * atr_arr[j])
                be_done = True
        # trailing after TP2
        if cfg.use_trailing:
            act = (hi >= tp2) if direction > 0 else (lo <= tp2)
            if act:
                trail_on = True
            if trail_on:
                a = atr_arr[j]
                if direction > 0:
                    sl = max(sl, hi - cfg.trail_atr_mult * a)
                else:
                    sl = min(sl, lo + cfg.trail_atr_mult * a)
    else:
        j = j_end

    # any slices still open at horizon -> mark out at last close
    for tp in remaining:
        px = close[j]
        realized_R += weight * ((px - entry) if direction > 0 else (entry - px)) / risk_dist

    # spread cost (round trip) expressed in R
    if cfg.spread_price > 0:
        realized_R -= cfg.spread_price / risk_dist

    money = equity * (cfg.risk_pct / 100.0) * realized_R
    t = Trade(entry_idx, direction, pattern, entry, sl_init, tps)
    t.r_result = realized_R
    t.money = money
    t.bars_held = j - entry_idx
    t.outcome = exit_reason
    return t


# ----------------------------------------------------------------------------
# Backtest engine
# ----------------------------------------------------------------------------
def backtest(df: pd.DataFrame, cfg: Config):
    df = df.reset_index(drop=True)
    o = df["open"].values
    h = df["high"].values
    l = df["low"].values
    c = df["close"].values
    n = len(df)

    rsi_arr = rsi(c, cfg.rsi_period)
    atr_arr = atr(h, l, c, cfg.atr_period)
    trend_arr = htf_trend_ema(c, cfg.trend_factor, cfg.trend_ma)

    def rsi_at(idx):
        return rsi_arr[idx] if 0 <= idx < n else float("nan")

    pivots = detect_pivots(h, l, cfg.pivot_depth)

    equity = cfg.start_equity
    peak = equity
    max_dd = 0.0
    trades = []
    equity_curve = [equity]
    busy_until = -1  # index until which we're in a trade (no concurrency)

    enabled = [p for p in PATTERNS]

    for i in range(cfg.lookback, n):
        if i <= busy_until:
            continue
        if math.isnan(atr_arr[i]) or atr_arr[i] <= 0:
            continue

        # confirmed pivots available strictly before bar i (uses bar i-1 as D reaction)
        conf = [p for p in pivots if p.confirm_idx <= i - 1 and p.idx <= i - 1]
        if len(conf) < 4:
            continue
        X, A, B, C = conf[-4], conf[-3], conf[-2], conf[-1]
        direction = 1 if C.is_high else -1
        if direction > 0 and not cfg.allow_long:
            continue
        if direction < 0 and not cfg.allow_short:
            continue

        XAm = abs(A.price - X.price)
        ABm = abs(B.price - A.price)
        BCm = abs(C.price - B.price)
        XCm = abs(C.price - X.price)
        if min(XAm, ABm, BCm) <= 0:
            continue
        rAB = ABm / XAm
        rBC = BCm / ABm
        rBC_XA = BCm / XAm

        o1, c1, h1, l1 = o[i - 1], c[i - 1], h[i - 1], l[i - 1]
        o2, c2 = o[i - 2], c[i - 2]
        a_v = atr_arr[i]

        best = None
        for p in enabled:
            if p["cypher"]:
                if not in_band(rAB, *p["ab"], cfg.tol):
                    continue
                if not in_band(rBC_XA, *p["bc"], cfg.tol):
                    continue
            else:
                if not in_band(rAB, *p["ab"], cfg.tol):
                    continue
                if not in_band(rBC, *p["bc"], cfg.tol):
                    continue
            prz = project_prz(p, direction, X.price, A.price, C.price, XAm, BCm, XCm, cfg.tol)
            if prz is None:
                continue
            prz_lo, prz_hi = prz
            if direction > 0:
                if not (l1 <= prz_hi and l1 >= prz_lo - a_v * 0.25 and c1 > prz_lo):
                    continue
                Dprice = l1
            else:
                if not (h1 >= prz_lo and h1 <= prz_hi + a_v * 0.25 and c1 < prz_hi):
                    continue
                Dprice = h1
            if cfg.require_candle and not candle_confirms(direction, o1, c1, h1, l1, o2, c2):
                continue
            rsi_now = rsi_arr[i - 1]
            if cfg.use_rsi:
                if direction > 0 and rsi_now > cfg.rsi_buy:
                    continue
                if direction < 0 and rsi_now < cfg.rsi_sell:
                    continue
            trend_ok = (c[i - 1] > trend_arr[i - 1]) if direction > 0 else (c[i - 1] < trend_arr[i - 1])
            if cfg.use_trend and not trend_ok:
                continue
            sc = score_setup(p, direction, X, A, B, C, Dprice, XAm, ABm, rAB, rBC,
                             prz_lo, prz_hi, a_v, rsi_now, trend_ok, rsi_at, cfg)
            if best is None or sc > best[1]:
                best = (p, sc, Dprice)

        if best is None or best[1] < cfg.min_score:
            continue

        p, score, Dprice = best
        entry = o[i]
        buf = a_v * cfg.sl_atr_mult
        if p["retr"]:
            sl = (X.price - buf) if direction > 0 else (X.price + buf)
        else:
            sl = (Dprice - buf) if direction > 0 else (Dprice + buf)
        if abs(entry - sl) < a_v * 0.2:
            continue
        ad_leg = abs(A.price - Dprice)
        if direction > 0:
            tp1 = Dprice + 0.382 * ad_leg
            tp2 = Dprice + 0.618 * ad_leg
            tp3 = A.price if cfg.tp3_at_a else C.price
            if tp3 <= tp2:
                tp3 = A.price
        else:
            tp1 = Dprice - 0.382 * ad_leg
            tp2 = Dprice - 0.618 * ad_leg
            tp3 = A.price if cfg.tp3_at_a else C.price
            if tp3 >= tp2:
                tp3 = A.price

        t = simulate_trade(df, cfg, atr_arr, i, direction, p["name"], entry,
                           sl, tp1, tp2, tp3, equity)
        if t is None:
            continue
        equity += t.money
        equity_curve.append(equity)
        peak = max(peak, equity)
        max_dd = max(max_dd, (peak - equity) / peak if peak > 0 else 0.0)
        trades.append(t)
        busy_until = i + t.bars_held  # single-setup concurrency

    return trades, equity, max_dd, equity_curve


# ----------------------------------------------------------------------------
# Reporting
# ----------------------------------------------------------------------------
def report(name, trades, start_eq, end_eq, max_dd):
    print(f"\n===== {name} =====")
    if not trades:
        print("No trades taken.")
        return
    R = np.array([t.r_result for t in trades])
    wins = R[R > 0]
    losses = R[R <= 0]
    gp = wins.sum()
    gl = -losses.sum()
    pf = gp / gl if gl > 0 else float("inf")
    print(f"Trades          : {len(trades)}")
    print(f"Win rate        : {len(wins)/len(trades)*100:5.1f}%")
    print(f"Avg R / trade   : {R.mean():+.3f}")
    print(f"Expectancy (R)  : {R.mean():+.3f}  (sum {R.sum():+.1f}R)")
    print(f"Profit factor   : {pf:.2f}")
    print(f"Best / worst    : {R.max():+.2f}R / {R.min():+.2f}R")
    print(f"Start -> End eq : {start_eq:,.0f} -> {end_eq:,.0f}  ({(end_eq/start_eq-1)*100:+.1f}%)")
    print(f"Max drawdown    : {max_dd*100:.1f}%")
    # per pattern
    print("  by pattern:")
    from collections import defaultdict
    agg = defaultdict(list)
    for t in trades:
        agg[t.pattern].append(t.r_result)
    for k, v in sorted(agg.items()):
        v = np.array(v)
        print(f"    {k:10s} n={len(v):3d}  win={ (v>0).mean()*100:4.0f}%  sumR={v.sum():+6.1f}")


# ----------------------------------------------------------------------------
# Synthetic data
# ----------------------------------------------------------------------------
def gen_gbm(n=20000, start=1.1000, vol=0.0009, seed=0):
    rng = np.random.default_rng(seed)
    rets = rng.normal(0, vol, n)
    close = start * np.exp(np.cumsum(rets))
    # build OHLC around the close path with intrabar noise
    o = np.empty(n); h = np.empty(n); lo = np.empty(n)
    prev = start
    for i in range(n):
        op = prev
        cl = close[i]
        wick = abs(rng.normal(0, vol)) * op
        h[i] = max(op, cl) + wick
        lo[i] = min(op, cl) - wick
        o[i] = op
        prev = cl
    idx = pd.date_range("2015-01-01", periods=n, freq="h")
    return pd.DataFrame({"time": idx, "open": o, "high": h, "low": lo, "close": close})


def gen_planted(n=20000, seed=1):
    """GBM with a handful of textbook bullish Gartleys injected, so we can
    confirm the detector fires and the trade logic runs. This is a FUNCTIONAL
    test, not an edge test (we plant the patterns, so of course it 'works')."""
    df = gen_gbm(n=n, seed=seed).copy()
    c = df["close"].values.copy()
    step = n // 40
    for s in range(step, n - step, step):
        base = c[s]
        u = base * 0.02
        # X low, A high, B low, C high, D low (~0.786 AD) then rally
        pts = [(0, 0.0), (6, 1.0), (12, 0.382), (18, 0.80), (26, 0.214), (40, 0.9)]
        for k in range(1, len(pts)):
            (b0, v0), (b1, v1) = pts[k - 1], pts[k]
            for j in range(b0, b1):
                if s + j >= n:
                    break
                frac = (j - b0) / max(1, (b1 - b0))
                c[s + j] = base + u * (v0 + (v1 - v0) * frac)
    df["close"] = c
    df["open"] = np.roll(c, 1); df.loc[0, "open"] = c[0]
    noise = np.abs(np.random.default_rng(seed + 7).normal(0, base * 0.001, n))
    df["high"] = np.maximum(df["open"], df["close"]) + noise
    df["low"] = np.minimum(df["open"], df["close"]) - noise
    return df


# ----------------------------------------------------------------------------
def load_csv(path):
    df = pd.read_csv(path)
    df.columns = [x.strip().lower() for x in df.columns]
    need = {"open", "high", "low", "close"}
    if not need.issubset(df.columns):
        sys.exit(f"CSV must contain columns {need}; got {list(df.columns)}")
    if "time" not in df.columns:
        df["time"] = pd.RangeIndex(len(df))
    return df[["time", "open", "high", "low", "close"]]


def main():
    ap = argparse.ArgumentParser(description="Harmonic Pattern EA backtester")
    ap.add_argument("--csv", help="OHLC CSV: time,open,high,low,close")
    ap.add_argument("--synthetic", choices=["gbm", "planted"], default="gbm")
    ap.add_argument("--bars", type=int, default=20000)
    ap.add_argument("--min-score", type=float, default=55.0)
    ap.add_argument("--risk", type=float, default=1.0)
    ap.add_argument("--spread", type=float, default=0.0, help="round-trip cost in price units")
    ap.add_argument("--seeds", type=int, default=1, help="synthetic seeds to average over")
    args = ap.parse_args()

    cfg = Config(min_score=args.min_score, risk_pct=args.risk, spread_price=args.spread)

    if args.csv:
        df = load_csv(args.csv)
        trades, end_eq, dd, _ = backtest(df, cfg)
        report(f"REAL DATA: {args.csv}", trades, cfg.start_equity, end_eq, dd)
        return

    print("No --csv supplied: running on SYNTHETIC data (illustrative only).")
    for seed in range(args.seeds):
        if args.synthetic == "planted":
            df = gen_planted(n=args.bars, seed=seed + 1)
            label = f"SYNTHETIC planted-patterns (seed {seed})"
        else:
            df = gen_gbm(n=args.bars, seed=seed + 1)
            label = f"SYNTHETIC random-walk / NO EDGE (seed {seed})"
        trades, end_eq, dd, _ = backtest(df, cfg)
        report(label, trades, cfg.start_equity, end_eq, dd)


if __name__ == "__main__":
    main()
