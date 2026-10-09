import { useEffect, useRef, useState } from 'react';
import { type Product } from '@/lib/market-data';
import { useAppPreferences } from '@/components/app-preferences';

const getTradingViewSymbol = (symbol: string) => {
  const clean = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.includes('BTC')) return 'BITSTAMP:BTCUSD';
  if (clean.includes('XAU') || clean.includes('GOLD')) return 'OANDA:XAUUSD';
  if (clean.includes('EUR')) return 'FX:EURUSD';
  if (clean.includes('GBP')) return 'FX:GBPUSD';
  if (clean.includes('JPY')) return 'FX:USDJPY';
  if (clean.includes('OIL')) return 'TVC:USOIL';
  return `FX:${clean}`;
};

const getIntervalCode = (tf: string) => {
  const clean = tf.toLowerCase();
  if (clean === '1m') return '1';
  if (clean === '5m') return '5';
  if (clean === '15m') return '15';
  if (clean === '30m') return '30';
  if (clean === '1h') return '60';
  if (clean === '4h') return '240';
  if (clean === '1d') return 'D';
  return '60';
};

export function TradingViewChart({
  product,
  timeframe = '1H',
}: {
  product: Product;
  timeframe?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [iframeError, setIframeError] = useState(false);
  const { theme } = useAppPreferences();
  const isDark = theme === 'dark';

  const tvSymbol = getTradingViewSymbol(product.symbol);
  const intervalCode = getIntervalCode(timeframe);

  useEffect(() => {
    setIframeError(false);
  }, [product.symbol, timeframe, theme]);

  // Construct iframe embed URL for real-time TradingView Chart with side toolbar and Volume study
  const toolbarBg = isDark ? '0a0e17' : 'ffffff';
  const iframeUrl = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_${product.symbol}&symbol=${encodeURIComponent(
    tvSymbol,
  )}&interval=${intervalCode}&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=${toolbarBg}&studies=%5B%22STD%3BVolume%22%5D&theme=${isDark ? 'dark' : 'light'}&style=1&timezone=Asia%2FJakarta&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=&utm_medium=widget&utm_campaign=chart&utm_term=${encodeURIComponent(
    tvSymbol,
  )}`;

  return (
    <div className={`relative w-full ${isDark ? 'bg-[#0a0e17]' : 'bg-card'} rounded-xl overflow-hidden border border-border/80 shadow-md`}>
      {!iframeError ? (
        <div className={`w-full h-[280px] sm:h-[340px] md:h-[450px] relative ${isDark ? 'bg-[#0a0e17]' : 'bg-card'}`}>
          <iframe
            key={`${product.symbol}-${timeframe}-${theme}`}
            src={iframeUrl}
            title={`TradingView chart for ${product.symbol}`}
            className="w-full h-full border-0"
            onError={() => setIframeError(true)}
            allowFullScreen
          />
        </div>
      ) : (
        /* Native TradingView-Styled Interactive Fallback */
        <div className={`w-full h-[280px] sm:h-[340px] md:h-[450px] flex flex-col ${isDark ? 'bg-[#0a0e17] text-[#94a3b8]' : 'bg-card text-foreground'} font-sans select-none`}>
          {/* Top Bar */}
          <div className={`h-9 px-2 ${isDark ? 'bg-[#121826] border-[#1e293b]' : 'bg-muted border-border'} border-b flex items-center justify-between text-xs`}>
            <div className="flex items-center gap-1">
              <span className={`px-2 py-0.5 rounded ${isDark ? 'bg-[#1e293b] text-white' : 'bg-secondary text-foreground font-bold'}`}>{timeframe}</span>
              <span className="text-muted-foreground">v</span>
              <span className="px-2 text-muted-foreground hover:text-foreground cursor-pointer">fx</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 font-mono font-bold">{product.ask.toFixed(product.decimals)}</span>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Left Drawing Tools Sidebar */}
            <div className={`w-10 ${isDark ? 'bg-[#121826] border-[#1e293b]' : 'bg-muted/50 border-border'} border-r flex flex-col items-center py-2 gap-3 text-muted-foreground`}>
              <div className={`w-6 h-6 rounded flex items-center justify-center ${isDark ? 'hover:bg-[#1e293b] hover:text-white' : 'hover:bg-muted hover:text-foreground'} cursor-pointer`}>
                +
              </div>
              <div className={`w-6 h-6 rounded flex items-center justify-center ${isDark ? 'hover:bg-[#1e293b] hover:text-white' : 'hover:bg-muted hover:text-foreground'} cursor-pointer`}>
                ╱
              </div>
              <div className={`w-6 h-6 rounded flex items-center justify-center ${isDark ? 'hover:bg-[#1e293b] hover:text-white' : 'hover:bg-muted hover:text-foreground'} cursor-pointer`}>
                ≡
              </div>
              <div className={`w-6 h-6 rounded flex items-center justify-center ${isDark ? 'hover:bg-[#1e293b] hover:text-white' : 'hover:bg-muted hover:text-foreground'} cursor-pointer`}>
                🖌
              </div>
              <div className={`w-6 h-6 rounded flex items-center justify-center ${isDark ? 'hover:bg-[#1e293b] hover:text-white' : 'hover:bg-muted hover:text-foreground'} cursor-pointer`}>
                T
              </div>
              <div className={`w-6 h-6 rounded flex items-center justify-center ${isDark ? 'hover:bg-[#1e293b] hover:text-white' : 'hover:bg-muted hover:text-foreground'} cursor-pointer`}>
                😀
              </div>
              <div className={`w-6 h-6 rounded flex items-center justify-center ${isDark ? 'hover:bg-[#1e293b] hover:text-white' : 'hover:bg-muted hover:text-foreground'} cursor-pointer`}>
                📏
              </div>
              <div className={`w-6 h-6 rounded flex items-center justify-center ${isDark ? 'hover:bg-[#1e293b] hover:text-white' : 'hover:bg-muted hover:text-foreground'} cursor-pointer`}>
                🔍
              </div>
            </div>

            {/* Main Canvas Area */}
            <div className={`flex-1 flex flex-col relative ${isDark ? 'bg-[#0a0e17]' : 'bg-background'} p-2`}>
              <div className="flex justify-between items-start text-xs font-mono mb-2">
                <div>
                  <span className="font-bold text-foreground text-sm block">{product.symbol}</span>
                  <span className="text-emerald-500 font-bold">
                    {product.ask.toFixed(product.decimals)} ({product.change >= 0 ? '+' : ''}
                    {product.change.toFixed(2)}%)
                  </span>
                </div>
                <div className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-500/40 text-[10px] font-bold">
                  {product.ask.toFixed(product.decimals)}
                </div>
              </div>

              {/* Candlesticks & Volume simulation */}
              <div className={`flex-1 flex items-end gap-1.5 px-2 pt-4 border-b ${isDark ? 'border-[#1e293b]' : 'border-border'} pb-2`}>
                {Array.from({ length: 24 }).map((_, i) => {
                  const isUp = i % 3 !== 0;
                  const height = 30 + ((i * 17) % 120);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                      <div className={`w-[1px] h-full ${isUp ? 'bg-emerald-500' : 'bg-rose-500'} opacity-40`} />
                      <div
                        style={{ height: `${height}px` }}
                        className={`w-full max-w-[8px] rounded-sm ${
                          isUp ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Sub-pane Volume */}
              <div className="h-16 pt-1 flex flex-col justify-end">
                <span className="text-[9px] text-[#64748b]">Vol · {product.symbol}</span>
                <div className="flex-1 flex items-end gap-1 px-2 pt-1">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      style={{ height: `${10 + ((i * 11) % 40)}px` }}
                      className={`flex-1 rounded-t-sm ${i % 3 !== 0 ? 'bg-emerald-500/60' : 'bg-rose-500/60'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className={`h-7 px-3 ${isDark ? 'bg-[#121826] border-[#1e293b]' : 'bg-muted border-border'} border-t flex items-center justify-between text-[10px] text-muted-foreground`}>
            <div className="flex items-center gap-2">
              <span className={`font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>TV</span>
              <span>Date Range v</span>
            </div>
            <span>19:49:27 UTC+7</span>
          </div>
        </div>
      )}
    </div>
  );
}
