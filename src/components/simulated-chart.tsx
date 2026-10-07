import { useEffect, useRef } from 'react';
import { buildIllustrativeHistory, type Product } from '@/lib/market-data';

export function SimulatedChart({
  product,
  price,
  interval,
  line,
  indicator,
}: {
  product: Product;
  price: number;
  interval: string;
  line: boolean;
  indicator: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const latestPrice = useRef(price);
  const updateLatest = useRef<((nextPrice: number) => void) | null>(null);
  latestPrice.current = price;

  useEffect(() => {
    updateLatest.current?.(price);
  }, [price]);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    updateLatest.current = null;
    const element = container.current;
    if (!element) return;

    import('lightweight-charts').then(({ createChart, CandlestickSeries, LineSeries, ColorType }) => {
      if (disposed) return;
      const css = getComputedStyle(element);
      const colorContext = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
      if (!colorContext) throw new Error('Canvas color conversion is unavailable.');
      const token = (name: string) => {
        colorContext.clearRect(0, 0, 1, 1);
        colorContext.fillStyle = css.getPropertyValue(name).trim();
        colorContext.fillRect(0, 0, 1, 1);
        const pixel = colorContext.getImageData(0, 0, 1, 1).data;
        const r = pixel[0] ?? 0;
        const g = pixel[1] ?? 0;
        const b = pixel[2] ?? 0;
        const a = pixel[3] ?? 255;
        return `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`;
      };
      const chart = createChart(element, {
        autoSize: true,
        layout: { background: { type: ColorType.Solid, color: token('--background') }, textColor: token('--muted-foreground'), fontSize: 10, attributionLogo: false },
        grid: { vertLines: { color: token('--market-grid') }, horzLines: { color: token('--market-grid') } },
        rightPriceScale: {
          visible: true,
          autoScale: true,
          minimumWidth: 72,
          borderVisible: true,
          borderColor: token('--market-grid'),
          scaleMargins: { top: 0.12, bottom: 0.12 },
        },
        timeScale: {
          visible: true,
          borderVisible: true,
          borderColor: token('--market-grid'),
          timeVisible: true,
          secondsVisible: false,
          ticksVisible: true,
          minimumHeight: 32,
          rightOffset: 3,
        },
        localization: { priceFormatter: (value: number) => value.toFixed(product.decimals) },
      });

      const step = interval === '1m' ? 60 : interval === '5m' ? 300 : interval === '15m' ? 900 : interval === '1h' ? 3600 : 86400;
      const bucketTime = () => Math.floor(Date.now() / 1000 / step) * step;
      const end = bucketTime();
      const candles = buildIllustrativeHistory(product, interval, end * 1000).map((candle) => ({
        ...candle,
        time: candle.time as import('lightweight-charts').UTCTimestamp,
      }));

      let currentTime = candles[candles.length - 1]?.time ?? (end as import('lightweight-charts').UTCTimestamp);
      let currentOpen = candles[candles.length - 1]?.open ?? product.ask;
      let currentHigh = candles[candles.length - 1]?.high ?? product.ask;
      let currentLow = candles[candles.length - 1]?.low ?? product.ask;
      let previousPrice = candles[candles.length - 1]?.close ?? product.ask;
      const completedCloses = candles.slice(0, -1).map((candle) => candle.close);

      const updateMovingAverage = (series: { update: (point: { time: import('lightweight-charts').UTCTimestamp; value: number }) => void }, time: import('lightweight-charts').UTCTimestamp, nextPrice: number) => {
        const recent = completedCloses.slice(-8);
        const values = [...recent, nextPrice];
        series.update({ time, value: values.reduce((sum, value) => sum + value, 0) / values.length });
      };

      let priceSeries: { update: (point: { time: import('lightweight-charts').UTCTimestamp; value: number }) => void } | null = null;
      let candleSeries: { update: (point: { time: import('lightweight-charts').UTCTimestamp; open: number; high: number; low: number; close: number }) => void } | null = null;

      if (line) {
        const series = chart.addSeries(LineSeries, { color: token('--market-candle-up'), lineWidth: 2 });
        series.setData(candles.map((candle) => ({ time: candle.time, value: candle.close })));
        priceSeries = series;
      } else {
        const series = chart.addSeries(CandlestickSeries, {
          upColor: token('--market-candle-up'),
          downColor: token('--market-candle-down'),
          wickUpColor: token('--market-candle-up'),
          wickDownColor: token('--market-candle-down'),
          borderVisible: false,
        });
        series.setData(candles);
        candleSeries = series;
      }

      let movingAverage: typeof priceSeries = null;
      if (indicator) {
        const series = chart.addSeries(LineSeries, { color: token('--primary'), lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        series.setData(candles.slice(8).map((candle, index) => ({
          time: candle.time,
          value: candles.slice(index, index + 9).reduce((sum, item) => sum + item.close, 0) / 9,
        })));
        movingAverage = series;
      }

      const applyPrice = (nextPrice: number) => {
        const time = bucketTime() as import('lightweight-charts').UTCTimestamp;
        if (time > currentTime) {
          completedCloses.push(previousPrice);
          currentTime = time;
          currentOpen = previousPrice;
          currentHigh = nextPrice;
          currentLow = nextPrice;
        } else {
          currentHigh = Math.max(currentHigh, nextPrice);
          currentLow = Math.min(currentLow, nextPrice);
        }
        priceSeries?.update({ time, value: nextPrice });
        candleSeries?.update({ time, open: currentOpen, high: currentHigh, low: currentLow, close: nextPrice });
        if (movingAverage) updateMovingAverage(movingAverage, time, nextPrice);
        previousPrice = nextPrice;
      };

      chart.timeScale().fitContent();
      updateLatest.current = applyPrice;
      applyPrice(latestPrice.current);
      cleanup = () => chart.remove();
    });

    return () => {
      disposed = true;
      updateLatest.current = null;
      cleanup();
    };
  }, [product.symbol, product.ask, product.decimals, interval, line, indicator]);

  return <div ref={container} className="market-chart" aria-label={`Grafik simulasi ${product.symbol}, ${interval}`} />;
}
