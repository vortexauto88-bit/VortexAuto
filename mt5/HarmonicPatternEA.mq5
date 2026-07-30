//+------------------------------------------------------------------+
//|                                            HarmonicPatternEA.mq5  |
//|   Advanced harmonic-pattern trading robot for MetaTrader 5       |
//|                                                                  |
//|   Strategy layers (the "advanced" part):                        |
//|     1. Non-repainting swing detection (confirmed fractal ZigZag) |
//|     2. Pattern gating on X-A-B-C ratios (rAB, rBC)               |
//|     3. Forward PRZ projection for the D point (rAD, rCD)         |
//|     4. Live entry only when price reacts inside the PRZ with     |
//|        candle + RSI confirmation (BAMM / divergence aware)       |
//|     5. 0-100 confluence score gate (PRZ tightness, HTF trend,    |
//|        RSI divergence, AB=CD confluence, pattern reliability)    |
//|     6. Risk-based sizing, structural stops, scaled take-profits, |
//|        break-even and optional ATR trailing.                     |
//|                                                                  |
//|   Patterns: Gartley, Bat, Butterfly, Crab, Deep Crab, Cypher.    |
//|                                                                  |
//|   NOTE: This is a decision-support / automation tool, not a      |
//|   guaranteed profit system. Harmonic edges are modest and        |
//|   regime-dependent. Backtest and forward-test on a demo account  |
//|   before risking real capital.                                   |
//+------------------------------------------------------------------+
#property copyright "VortexAuto"
#property link      ""
#property version   "1.00"
#property strict

#include <Trade/Trade.mqh>

//====================================================================
//  INPUTS
//====================================================================
input group "=== General ==="
input long   InpMagic            = 880088;   // Magic number (unique per chart)
input bool   InpAllowLong        = true;     // Trade bullish patterns (buy)
input bool   InpAllowShort       = true;     // Trade bearish patterns (sell)
input bool   InpAllowConcurrent  = false;    // Allow a new setup while a trade is open
input int    InpMaxSpreadPoints  = 30;       // Max spread (points) to allow entry (0 = ignore)

input group "=== Swing / pattern detection ==="
input int    InpLookbackBars     = 400;      // Bars to scan for swing structure
input int    InpPivotDepth       = 3;        // Fractal depth (bars each side; higher = fewer, cleaner pivots)
input double InpRatioTolerance   = 0.06;     // Fibonacci tolerance (0.06 = +/-6%)
input bool   InpUseGartley       = true;
input bool   InpUseBat           = true;
input bool   InpUseButterfly     = true;
input bool   InpUseCrab          = true;
input bool   InpUseDeepCrab      = true;
input bool   InpUseCypher        = true;

input group "=== Confluence scoring ==="
input double InpMinScore         = 55.0;     // Minimum 0-100 confluence score to trade
input bool   InpUseTrendFilter   = true;     // Require HTF trend alignment
input ENUM_TIMEFRAMES InpTrendTF = PERIOD_H4;// Higher timeframe for trend filter
input int    InpTrendMAPeriod    = 50;       // MA period on the trend timeframe
input bool   InpUseRSIFilter     = true;     // Require RSI extreme / divergence
input int    InpRSIPeriod        = 14;       // RSI period
input double InpRSIBuyLevel      = 40.0;     // RSI must be <= this for buys
input double InpRSISellLevel     = 60.0;     // RSI must be >= this for sells
input bool   InpRequireCandle    = true;     // Require reversal candle confirmation at PRZ

input group "=== Risk & money management ==="
input double InpRiskPercent      = 1.0;      // Risk per setup (% of balance)
input double InpFixedLots         = 0.0;     // If > 0, use this fixed lot size instead of % risk
input int    InpNumScaleOuts     = 3;        // Number of scale-out positions (1-3)
input ENUM_TIMEFRAMES InpATRTF   = PERIOD_CURRENT; // Timeframe for ATR
input int    InpATRPeriod        = 14;       // ATR period
input double InpSLATRmult        = 1.2;      // Extra SL buffer beyond D/X (in ATR)
input bool   InpMoveToBE         = true;     // Move stop to break-even after TP1
input double InpBEplusATR        = 0.1;      // Break-even offset in ATR (lock small profit)
input bool   InpUseTrailing      = true;     // ATR-trail the runner after TP2
input double InpTrailATRmult     = 1.5;      // Trailing distance in ATR
input bool   InpTP3AtPointA      = false;    // TP3 at point A instead of point C

input group "=== Display ==="
input bool   InpShowPanel        = true;     // Show status panel on chart
input bool   InpVerboseLog       = true;     // Verbose journal logging

//====================================================================
//  TYPES
//====================================================================
struct SPivot
  {
   datetime time;
   double   price;
   bool     isHigh;
   int      shift;
  };

struct SPatternDef
  {
   string name;
   double abLo, abHi;   // AB/XA band
   double bcLo, bcHi;   // BC/AB band (BC/XA for Cypher)
   double cdLo, cdHi;   // CD/BC band
   double adLo, adHi;   // AD/XA band
   double reliability;  // 0..1 base quality weight
   bool   isRetracement;// true = D inside XA (stop beyond X); false = extension
   bool   isCypher;     // special measurement rules
   bool   enabled;
  };

//====================================================================
//  GLOBALS
//====================================================================
CTrade        trade;
SPatternDef   g_patterns[];
SPivot        g_pivots[];
MqlRates      g_rates[];

int           g_atrHandle   = INVALID_HANDLE;
int           g_rsiHandle   = INVALID_HANDLE;
int           g_trendHandle = INVALID_HANDLE;

datetime      g_lastBarTime = 0;
datetime      g_tradedKey   = 0;      // pivot-C time of the last setup we traded (dedupe)

// Active setup state (single active setup unless InpAllowConcurrent)
bool          g_active      = false;
int           g_dir         = 0;      // +1 long, -1 short
double        g_entry       = 0.0;
double        g_beTrigger   = 0.0;    // TP1 level -> triggers break-even
double        g_tp2Level    = 0.0;    // triggers trailing
string        g_lastInfo    = "Initializing...";

//====================================================================
//  INIT / DEINIT
//====================================================================
int OnInit()
  {
   trade.SetExpertMagicNumber(InpMagic);
   trade.SetDeviationInPoints(20);
   trade.SetTypeFillingBySymbol(_Symbol);

   ArraySetAsSeries(g_rates, true);

   g_atrHandle   = iATR(_Symbol, InpATRTF, InpATRPeriod);
   g_rsiHandle   = iRSI(_Symbol, PERIOD_CURRENT, InpRSIPeriod, PRICE_CLOSE);
   g_trendHandle = iMA(_Symbol, InpTrendTF, InpTrendMAPeriod, 0, MODE_EMA, PRICE_CLOSE);

   if(g_atrHandle == INVALID_HANDLE || g_rsiHandle == INVALID_HANDLE || g_trendHandle == INVALID_HANDLE)
     {
      Print("ERROR: failed to create indicator handles");
      return(INIT_FAILED);
     }

   BuildPatternTable();

   if(InpVerboseLog)
      PrintFormat("HarmonicPatternEA initialized on %s / %s. Patterns enabled: %s",
                  _Symbol, EnumToString((ENUM_TIMEFRAMES)_Period), EnabledPatternList());

   return(INIT_SUCCEEDED);
  }

void OnDeinit(const int reason)
  {
   if(g_atrHandle   != INVALID_HANDLE) IndicatorRelease(g_atrHandle);
   if(g_rsiHandle   != INVALID_HANDLE) IndicatorRelease(g_rsiHandle);
   if(g_trendHandle != INVALID_HANDLE) IndicatorRelease(g_trendHandle);
   Comment("");
  }

//====================================================================
//  MAIN TICK
//====================================================================
void OnTick()
  {
   // Manage anything already open on every tick (break-even, trailing).
   ManageOpenPositions();

   // Detection / entry only once per completed bar (non-repainting).
   datetime barTime = iTime(_Symbol, PERIOD_CURRENT, 0);
   if(barTime == g_lastBarTime)
     {
      if(InpShowPanel) UpdatePanel();
      return;
     }
   g_lastBarTime = barTime;

   ScanAndTrade();

   if(InpShowPanel) UpdatePanel();
  }

//====================================================================
//  PATTERN TABLE
//====================================================================
void BuildPatternTable()
  {
   ArrayResize(g_patterns, 0);
   // name,            abLo, abHi, bcLo, bcHi, cdLo, cdHi, adLo, adHi, reliab, retrace, cypher, enabled
   AddPattern("Gartley",   0.618,0.618, 0.382,0.886, 1.130,1.618, 0.786,0.786, 0.90, true,  false, InpUseGartley);
   AddPattern("Bat",       0.382,0.500, 0.382,0.886, 1.618,2.618, 0.886,0.886, 1.00, true,  false, InpUseBat);
   AddPattern("Butterfly", 0.786,0.786, 0.382,0.886, 1.618,2.240, 1.270,1.618, 0.75, false, false, InpUseButterfly);
   AddPattern("Crab",      0.382,0.618, 0.382,0.886, 2.240,3.618, 1.618,1.618, 0.85, false, false, InpUseCrab);
   AddPattern("DeepCrab",  0.886,0.886, 0.382,0.886, 2.000,3.618, 1.618,1.618, 0.72, false, false, InpUseDeepCrab);
   // Cypher: bcLo/bcHi are BC/XA; adLo/adHi unused (D = 0.786 of XC)
   AddPattern("Cypher",    0.382,0.618, 1.130,1.414, 0.000,0.000, 0.786,0.786, 0.65, true,  true,  InpUseCypher);
  }

void AddPattern(string name,double abLo,double abHi,double bcLo,double bcHi,
                double cdLo,double cdHi,double adLo,double adHi,
                double reliab,bool retrace,bool cypher,bool enabled)
  {
   int n = ArraySize(g_patterns);
   ArrayResize(g_patterns, n+1);
   g_patterns[n].name         = name;
   g_patterns[n].abLo         = abLo;  g_patterns[n].abHi = abHi;
   g_patterns[n].bcLo         = bcLo;  g_patterns[n].bcHi = bcHi;
   g_patterns[n].cdLo         = cdLo;  g_patterns[n].cdHi = cdHi;
   g_patterns[n].adLo         = adLo;  g_patterns[n].adHi = adHi;
   g_patterns[n].reliability  = reliab;
   g_patterns[n].isRetracement= retrace;
   g_patterns[n].isCypher     = cypher;
   g_patterns[n].enabled      = enabled;
  }

string EnabledPatternList()
  {
   string s = "";
   for(int i=0;i<ArraySize(g_patterns);i++)
      if(g_patterns[i].enabled) s += (s=="" ? "" : ", ") + g_patterns[i].name;
   return (s=="" ? "(none)" : s);
  }

//====================================================================
//  CORE: scan structure, project PRZ, confirm, trade
//====================================================================
void ScanAndTrade()
  {
   // Skip if we already hold a setup and concurrency is off.
   if(!InpAllowConcurrent && CountOwnPositions() > 0)
     {
      g_lastInfo = "In trade - waiting for exit.";
      return;
     }

   int need = InpLookbackBars + InpPivotDepth + 5;
   int copied = CopyRates(_Symbol, PERIOD_CURRENT, 0, need, g_rates);
   if(copied < InpPivotDepth*3 + 5)
     {
      g_lastInfo = "Not enough bars yet.";
      return;
     }

   DetectPivots();
   int np = ArraySize(g_pivots);
   if(np < 4)
     {
      g_lastInfo = StringFormat("Only %d confirmed pivots.", np);
      return;
     }

   // Last four confirmed pivots = X, A, B, C. D is the forming leg (current price).
   SPivot X = g_pivots[np-4];
   SPivot A = g_pivots[np-3];
   SPivot B = g_pivots[np-2];
   SPivot C = g_pivots[np-1];

   // Direction: C high -> expect a low D (bullish buy). C low -> expect a high D (bearish sell).
   int dir = C.isHigh ? +1 : -1;
   if(dir > 0 && !InpAllowLong)  { g_lastInfo = "Long setup skipped (longs disabled)."; return; }
   if(dir < 0 && !InpAllowShort) { g_lastInfo = "Short setup skipped (shorts disabled)."; return; }

   // Dedupe: one setup per swing (keyed on pivot C).
   if(C.time == g_tradedKey)
     {
      g_lastInfo = "Setup already traded on this swing.";
      return;
     }

   double XAm = MathAbs(A.price - X.price);
   double ABm = MathAbs(B.price - A.price);
   double BCm = MathAbs(C.price - B.price);
   double XCm = MathAbs(C.price - X.price);
   if(XAm <= 0 || ABm <= 0 || BCm <= 0) { g_lastInfo="Degenerate legs."; return; }

   double rAB    = ABm / XAm;
   double rBC    = BCm / ABm;
   double rBC_XA = BCm / XAm;

   double tol = InpRatioTolerance;

   // Confirmation candle values (bar 1 = last closed bar).
   double b1o = g_rates[1].open,  b1c = g_rates[1].close;
   double b1h = g_rates[1].high,  b1l = g_rates[1].low;
   double b2o = g_rates[2].open,  b2c = g_rates[2].close;

   double atr = GetBuf(g_atrHandle, 0);
   if(atr <= 0) { g_lastInfo="ATR not ready."; return; }

   // Evaluate each enabled pattern; keep the best-scoring valid one.
   int    bestIdx   = -1;
   double bestScore = -1.0;
   double bestPrzLo=0, bestPrzHi=0, bestDprice=0;

   for(int i=0;i<ArraySize(g_patterns);i++)
     {
      if(!g_patterns[i].enabled) continue;
      SPatternDef p = g_patterns[i];

      // --- Gate on established (X-A-B-C) ratios ---
      if(p.isCypher)
        {
         if(!InBand(rAB,   p.abLo, p.abHi, tol)) continue;
         if(!InBand(rBC_XA,p.bcLo, p.bcHi, tol)) continue;
        }
      else
        {
         if(!InBand(rAB, p.abLo, p.abHi, tol)) continue;
         if(!InBand(rBC, p.bcLo, p.bcHi, tol)) continue;
        }

      // --- Project the PRZ for D ---
      double przLo, przHi;
      if(!ProjectPRZ(p, dir, X.price, A.price, C.price, XAm, BCm, XCm, tol, przLo, przHi))
         continue;

      // --- Did price react inside the PRZ on the last closed bar? ---
      double Dprice;
      if(dir > 0)
        {
         // Buy: bar low must dip into the zone, close must reject back up above the zone floor.
         if(!(b1l <= przHi && b1l >= przLo - atr*0.25 && b1c > przLo)) continue;
         Dprice = b1l;
        }
      else
        {
         if(!(b1h >= przLo && b1h <= przHi + atr*0.25 && b1c < przHi)) continue;
         Dprice = b1h;
        }

      // --- Candle confirmation ---
      if(InpRequireCandle && !CandleConfirms(dir, b1o, b1c, b1h, b1l, b2o, b2c))
         continue;

      // --- RSI / trend filters ---
      double rsiNow = GetBuf(g_rsiHandle, 1);
      if(InpUseRSIFilter)
        {
         if(dir > 0 && rsiNow > InpRSIBuyLevel)  continue;
         if(dir < 0 && rsiNow < InpRSISellLevel) continue;
        }
      bool trendOK = TrendAligned(dir);
      if(InpUseTrendFilter && !trendOK) continue;

      // --- Confluence score ---
      double score = ScoreSetup(p, dir, X, A, B, C, Dprice,
                                XAm, ABm, BCm, XCm, rAB, rBC,
                                przLo, przHi, atr, rsiNow, trendOK);

      if(score > bestScore)
        {
         bestScore = score;
         bestIdx   = i;
         bestPrzLo = przLo; bestPrzHi = przHi; bestDprice = Dprice;
        }
     }

   if(bestIdx < 0)
     {
      g_lastInfo = "No valid pattern in PRZ this bar.";
      return;
     }

   g_lastInfo = StringFormat("%s %s | score %.0f",
                             (g_patterns[bestIdx].isRetracement?"[R]":"[X]"),
                             g_patterns[bestIdx].name, bestScore);

   if(bestScore < InpMinScore)
     {
      if(InpVerboseLog)
         PrintFormat("Skip %s (%s): score %.0f < min %.0f",
                     g_patterns[bestIdx].name, (dir>0?"BUY":"SELL"), bestScore, InpMinScore);
      return;
     }

   // Spread guard
   long spread = (long)SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   if(InpMaxSpreadPoints > 0 && spread > InpMaxSpreadPoints)
     {
      if(InpVerboseLog) PrintFormat("Skip: spread %d > max %d", (int)spread, InpMaxSpreadPoints);
      return;
     }

   ExecuteTrade(g_patterns[bestIdx], dir, X, A, C, bestDprice, atr, bestScore, C.time);
  }

//====================================================================
//  PIVOT DETECTION (confirmed fractal ZigZag, non-repainting)
//====================================================================
void DetectPivots()
  {
   SPivot temp[];
   ArrayResize(temp, 0);

   int depth = InpPivotDepth;
   int total = ArraySize(g_rates);
   int maxS  = MathMin(InpLookbackBars, total - depth - 1);

   // Iterate oldest -> newest so pivots come out in time order.
   for(int s = maxS; s >= depth+1; s--)
     {
      bool ph = IsPivotHigh(s, depth);
      bool pl = IsPivotLow(s, depth);
      if(ph && !pl) PushPivot(temp, s, g_rates[s].high, true);
      else if(pl && !ph) PushPivot(temp, s, g_rates[s].low, false);
     }

   // Alternate: collapse consecutive same-type pivots to the more extreme one.
   ArrayResize(g_pivots, 0);
   for(int i=0;i<ArraySize(temp);i++)
     {
      int n = ArraySize(g_pivots);
      if(n == 0) { AppendPivot(temp[i]); continue; }
      if(temp[i].isHigh == g_pivots[n-1].isHigh)
        {
         bool moreExtreme = temp[i].isHigh ? (temp[i].price > g_pivots[n-1].price)
                                           : (temp[i].price < g_pivots[n-1].price);
         if(moreExtreme) g_pivots[n-1] = temp[i];
        }
      else
         AppendPivot(temp[i]);
     }
  }

bool IsPivotHigh(int s,int depth)
  {
   double h = g_rates[s].high;
   for(int k=1;k<=depth;k++)
     {
      if(g_rates[s+k].high >= h) return false;
      if(g_rates[s-k].high >= h) return false;
     }
   return true;
  }

bool IsPivotLow(int s,int depth)
  {
   double l = g_rates[s].low;
   for(int k=1;k<=depth;k++)
     {
      if(g_rates[s+k].low <= l) return false;
      if(g_rates[s-k].low <= l) return false;
     }
   return true;
  }

void PushPivot(SPivot &arr[], int shift, double price, bool isHigh)
  {
   int n = ArraySize(arr);
   ArrayResize(arr, n+1);
   arr[n].time   = g_rates[shift].time;
   arr[n].price  = price;
   arr[n].isHigh = isHigh;
   arr[n].shift  = shift;
  }

void AppendPivot(const SPivot &p)
  {
   int n = ArraySize(g_pivots);
   ArrayResize(g_pivots, n+1);
   g_pivots[n] = p;
  }

//====================================================================
//  PRZ PROJECTION
//====================================================================
bool ProjectPRZ(const SPatternDef &p,int dir,double Xp,double Ap,double Cp,
                double XAm,double BCm,double XCm,double tol,
                double &przLo,double &przHi)
  {
   if(p.isCypher)
     {
      // D = 0.786 of XC, measured from C toward X.
      double center = (p.adLo+p.adHi)*0.5; // 0.786
      double band   = center*tol + tol*0.02;
      double lo = center - band, hi = center + band;
      if(dir > 0) { przHi = Cp - lo*XCm; przLo = Cp - hi*XCm; }
      else        { przLo = Cp + lo*XCm; przHi = Cp + hi*XCm; }
      return (przLo < przHi);
     }

   // Standard XABCD: intersect the AD projection with the CD projection.
   double adLo = p.adLo*(1.0-tol), adHi = p.adHi*(1.0+tol);
   double cdLo = p.cdLo*(1.0-tol), cdHi = p.cdHi*(1.0+tol);

   double dAdLo, dAdHi, dCdLo, dCdHi;
   if(dir > 0) // buy: D below A and below C
     {
      dAdHi = Ap - adLo*XAm;  dAdLo = Ap - adHi*XAm;
      dCdHi = Cp - cdLo*BCm;  dCdLo = Cp - cdHi*BCm;
     }
   else        // sell: D above A and above C
     {
      dAdLo = Ap + adLo*XAm;  dAdHi = Ap + adHi*XAm;
      dCdLo = Cp + cdLo*BCm;  dCdHi = Cp + cdHi*BCm;
     }

   przLo = MathMax(dAdLo, dCdLo);
   przHi = MathMin(dAdHi, dCdHi);
   return (przLo < przHi);
  }

//====================================================================
//  CONFLUENCE SCORE (0-100)
//====================================================================
double ScoreSetup(const SPatternDef &p,int dir,
                  const SPivot &X,const SPivot &A,const SPivot &B,const SPivot &C,
                  double Dprice,double XAm,double ABm,double BCm,double XCm,
                  double rAB,double rBC,double przLo,double przHi,
                  double atr,double rsiNow,bool trendOK)
  {
   // Weights (sum = 100).
   const double W_RATIO = 20.0, W_PRZ = 15.0, W_TREND = 15.0,
                W_RSI   = 20.0, W_ABCD = 15.0, W_REL = 15.0;

   // 1) Ratio fit: how centred rAB, rBC and (now that D exists) rAD are.
   double rAD = MathAbs(A.price - Dprice) / XAm;
   double fAB = BandCenterFit(rAB, p.abLo, p.abHi);
   double fBC = BandCenterFit(rBC, p.bcLo, p.bcHi);
   double fAD = BandCenterFit(rAD, p.adLo, p.adHi);
   double ratioFit = (fAB + fBC + fAD) / 3.0;

   // 2) PRZ tightness relative to ATR (tighter = stronger).
   double przW = MathAbs(przHi - przLo);
   double tight = 1.0 - Clamp((przW/atr - 0.5) / 2.5, 0.0, 1.0); // <=0.5 ATR ->1, >=3 ATR ->0

   // 3) Trend alignment.
   double trend = trendOK ? 1.0 : 0.0;

   // 4) RSI extreme + divergence (BAMM-style).
   double rsiScore = 0.0;
   if(dir > 0 && rsiNow <= InpRSIBuyLevel)  rsiScore = 0.6;
   if(dir < 0 && rsiNow >= InpRSISellLevel) rsiScore = 0.6;
   if(HasDivergence(dir, B, Dprice)) rsiScore += 0.4;
   rsiScore = Clamp(rsiScore, 0.0, 1.0);

   // 5) AB=CD confluence: does an AB=CD projection land inside the PRZ?
   double abcd = ABCDConfluence(dir, C.price, ABm, przLo, przHi);

   // 6) Base pattern reliability.
   double rel = p.reliability;

   double score = ratioFit*W_RATIO + tight*W_PRZ + trend*W_TREND
                + rsiScore*W_RSI   + abcd*W_ABCD + rel*W_REL;
   return Clamp(score, 0.0, 100.0);
  }

double ABCDConfluence(int dir,double Cp,double ABm,double przLo,double przHi)
  {
   double mults[3]; mults[0]=1.0; mults[1]=1.272; mults[2]=1.618;
   double best = 0.0;
   for(int i=0;i<3;i++)
     {
      double d = (dir>0) ? (Cp - mults[i]*ABm) : (Cp + mults[i]*ABm);
      if(d >= przLo && d <= przHi) return 1.0;
      double dist = (d < przLo) ? (przLo - d) : (d - przHi);
      double przW = MathMax(przHi - przLo, _Point);
      double near = 1.0 - Clamp(dist/(przW*2.0), 0.0, 1.0);
      if(near > best) best = near;
     }
   return best;
  }

bool HasDivergence(int dir,const SPivot &B,double Dprice)
  {
   // Compare RSI at pivot B against RSI at the last closed bar (near D).
   double rsiB = GetBuf(g_rsiHandle, B.shift);
   double rsiD = GetBuf(g_rsiHandle, 1);
   if(rsiB <= 0 || rsiD <= 0) return false;
   if(dir > 0) return (Dprice < B.price && rsiD > rsiB);  // lower low, higher RSI
   else        return (Dprice > B.price && rsiD < rsiB);  // higher high, lower RSI
  }

//====================================================================
//  CONFIRMATION HELPERS
//====================================================================
bool CandleConfirms(int dir,double o1,double c1,double h1,double l1,double o2,double c2)
  {
   double body   = MathAbs(c1 - o1);
   double range  = MathMax(h1 - l1, _Point);
   double upWick = h1 - MathMax(o1, c1);
   double dnWick = MathMin(o1, c1) - l1;

   if(dir > 0)
     {
      bool bull      = c1 > o1;
      bool engulf    = bull && (c1 >= c2) && (o1 <= o2) && (c2 < o2); // bullish engulf of a bear bar
      bool hammer    = (dnWick >= body*1.5) && (body/range <= 0.5) && (c1 >= o1 - range*0.1);
      return (engulf || hammer || (bull && body/range > 0.5));
     }
   else
     {
      bool bear      = c1 < o1;
      bool engulf    = bear && (c1 <= c2) && (o1 >= o2) && (c2 > o2);
      bool star      = (upWick >= body*1.5) && (body/range <= 0.5) && (c1 <= o1 + range*0.1);
      return (engulf || star || (bear && body/range > 0.5));
     }
  }

bool TrendAligned(int dir)
  {
   double ma = GetBuf(g_trendHandle, 0);
   if(ma <= 0) return false;
   double price = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   // Retracement patterns trade WITH the higher-timeframe trend.
   if(dir > 0) return (price > ma);
   else        return (price < ma);
  }

//====================================================================
//  EXECUTION
//====================================================================
void ExecuteTrade(const SPatternDef &p,int dir,const SPivot &X,const SPivot &A,
                  const SPivot &C,double Dprice,double atr,double score,datetime key)
  {
   double ask  = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double bid  = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double entry= (dir > 0) ? ask : bid;
   double buf  = atr * InpSLATRmult;

   // --- Stop loss ---
   double sl;
   if(p.isRetracement)
      sl = (dir > 0) ? (X.price - buf) : (X.price + buf);   // beyond structural X
   else
      sl = (dir > 0) ? (Dprice - buf) : (Dprice + buf);     // beyond D for extensions
   sl = NP(sl);

   double slDist = MathAbs(entry - sl);
   if(slDist < atr*0.2)
     {
      if(InpVerboseLog) Print("Skip: stop distance too small.");
      return;
     }

   // --- Take-profit ladder (reaction off D back toward A) ---
   double adLeg = MathAbs(A.price - Dprice);
   double tp1, tp2, tp3;
   if(dir > 0)
     {
      tp1 = Dprice + 0.382*adLeg;
      tp2 = Dprice + 0.618*adLeg;
      tp3 = InpTP3AtPointA ? A.price : C.price;
      if(tp3 <= tp2) tp3 = A.price;
     }
   else
     {
      tp1 = Dprice - 0.382*adLeg;
      tp2 = Dprice - 0.618*adLeg;
      tp3 = InpTP3AtPointA ? A.price : C.price;
      if(tp3 >= tp2) tp3 = A.price;
     }
   tp1 = NP(tp1); tp2 = NP(tp2); tp3 = NP(tp3);

   // --- Position sizing ---
   int n = MathMax(1, MathMin(3, InpNumScaleOuts));
   double totalLots = CalcLots(slDist);
   if(totalLots <= 0)
     {
      if(InpVerboseLog) Print("Skip: computed lot size is zero (check risk % / stop distance).");
      return;
     }

   double minLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);

   // Reduce scale-outs if we cannot split the volume into that many min lots.
   while(n > 1 && (totalLots/n) < minLot) n--;

   double tps[3]; tps[0]=tp1; tps[1]=tp2; tps[2]=tp3;
   string cmt = StringFormat("Harm-%s-%.0f", p.name, score);

   int opened = 0;
   double placed = 0.0;
   for(int i=0;i<n;i++)
     {
      // Last slice gets the remainder so total volume is preserved.
      double vol = (i==n-1) ? NormalizeLot(totalLots - placed) : NormalizeLot(totalLots/n);
      if(vol < minLot) vol = minLot;
      placed += vol;

      double tpUse = (n==1) ? tp2 : tps[i];   // single position aims at TP2
      bool ok;
      if(dir > 0) ok = trade.Buy(vol, _Symbol, ask, sl, tpUse, cmt);
      else        ok = trade.Sell(vol, _Symbol, bid, sl, tpUse, cmt);

      if(ok) opened++;
      else if(InpVerboseLog)
         PrintFormat("Order %d failed: %d - %s", i+1, trade.ResultRetcode(), trade.ResultRetcodeDescription());
     }

   if(opened > 0)
     {
      g_active    = true;
      g_dir       = dir;
      g_entry     = entry;
      g_beTrigger = tp1;
      g_tp2Level  = tp2;
      g_tradedKey = key;
      PrintFormat("OPENED %s %s x%d | entry %.5f SL %.5f TP1 %.5f TP2 %.5f TP3 %.5f | score %.0f",
                  (dir>0?"BUY":"SELL"), p.name, opened, entry, sl, tp1, tp2, tp3, score);
     }
  }

double CalcLots(double slDist)
  {
   if(InpFixedLots > 0.0) return NormalizeLot(InpFixedLots);

   double tickVal  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   if(tickVal <= 0 || tickSize <= 0) return 0.0;

   double balance   = AccountInfoDouble(ACCOUNT_BALANCE);
   double riskMoney = balance * (InpRiskPercent/100.0);
   double moneyPerLot = (slDist / tickSize) * tickVal;
   if(moneyPerLot <= 0) return 0.0;

   return NormalizeLot(riskMoney / moneyPerLot);
  }

double NormalizeLot(double lot)
  {
   double minLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double step    = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   if(step <= 0) step = 0.01;
   lot = MathFloor(lot/step + 1e-8) * step;
   if(lot < minLot) lot = minLot;
   if(lot > maxLot) lot = maxLot;
   return NormalizeDouble(lot, 2);
  }

//====================================================================
//  POSITION MANAGEMENT: break-even + trailing
//====================================================================
void ManageOpenPositions()
  {
   int own = CountOwnPositions();
   if(own == 0) { g_active = false; return; }

   double atr = GetBuf(g_atrHandle, 0);
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);

   for(int i=PositionsTotal()-1;i>=0;i--)
     {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if(!PositionSelectByTicket(tk)) continue;
      if(PositionGetInteger(POSITION_MAGIC) != InpMagic) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol)  continue;

      long   type  = PositionGetInteger(POSITION_TYPE);
      double entry = PositionGetDouble(POSITION_PRICE_OPEN);
      double sl    = PositionGetDouble(POSITION_SL);
      double tp    = PositionGetDouble(POSITION_TP);

      if(type == POSITION_TYPE_BUY)
        {
         // Break-even once price reaches TP1.
         if(InpMoveToBE && g_beTrigger > 0 && bid >= g_beTrigger)
           {
            double be = NP(entry + InpBEplusATR*atr);
            if(sl < be) trade.PositionModify(tk, be, tp);
           }
         // Trail the runner after TP2.
         if(InpUseTrailing && g_tp2Level > 0 && bid >= g_tp2Level)
           {
            double newSl = NP(bid - InpTrailATRmult*atr);
            if(newSl > sl) trade.PositionModify(tk, newSl, tp);
           }
        }
      else if(type == POSITION_TYPE_SELL)
        {
         if(InpMoveToBE && g_beTrigger > 0 && ask <= g_beTrigger)
           {
            double be = NP(entry - InpBEplusATR*atr);
            if(sl == 0 || sl > be) trade.PositionModify(tk, be, tp);
           }
         if(InpUseTrailing && g_tp2Level > 0 && ask <= g_tp2Level)
           {
            double newSl = NP(ask + InpTrailATRmult*atr);
            if(sl == 0 || newSl < sl) trade.PositionModify(tk, newSl, tp);
           }
        }
     }
  }

int CountOwnPositions()
  {
   int c = 0;
   for(int i=PositionsTotal()-1;i>=0;i--)
     {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if(!PositionSelectByTicket(tk)) continue;
      if(PositionGetInteger(POSITION_MAGIC) != InpMagic) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol)  continue;
      c++;
     }
   return c;
  }

//====================================================================
//  SMALL HELPERS
//====================================================================
double GetBuf(int handle,int shift)
  {
   double b[];
   if(CopyBuffer(handle, 0, shift, 1, b) <= 0) return 0.0;
   return b[0];
  }

bool InBand(double v,double lo,double hi,double tol)
  {
   double l = lo*(1.0-tol);
   double h = hi*(1.0+tol);
   return (v >= l && v <= h);
  }

double BandCenterFit(double v,double lo,double hi)
  {
   double c = (lo+hi)*0.5;
   double half = MathMax((hi-lo)*0.5, c*InpRatioTolerance);
   if(half <= 0) half = 0.01;
   double d = MathAbs(v - c)/half;
   return Clamp(1.0 - d, 0.0, 1.0);
  }

double Clamp(double v,double lo,double hi)
  {
   if(v < lo) return lo;
   if(v > hi) return hi;
   return v;
  }

double NP(double price)
  {
   return NormalizeDouble(price, _Digits);
  }

//====================================================================
//  ON-CHART PANEL
//====================================================================
void UpdatePanel()
  {
   string s = "";
   s += "Harmonic Pattern EA\n";
   s += "------------------------------\n";
   s += StringFormat("Symbol/TF : %s / %s\n", _Symbol, EnumToString((ENUM_TIMEFRAMES)_Period));
   s += StringFormat("Patterns  : %s\n", EnabledPatternList());
   s += StringFormat("Min score : %.0f   Risk: %.2f%%\n", InpMinScore, InpRiskPercent);
   s += StringFormat("Open pos  : %d\n", CountOwnPositions());
   s += StringFormat("Confirmed pivots: %d\n", ArraySize(g_pivots));
   s += "------------------------------\n";
   s += "Status: " + g_lastInfo + "\n";
   Comment(s);
  }
//+------------------------------------------------------------------+
