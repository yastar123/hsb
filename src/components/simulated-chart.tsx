import { useEffect, useRef } from 'react';
import type { Product } from '@/lib/market-data';
export function SimulatedChart({product,interval,line,indicator}:{product:Product;interval:string;line:boolean;indicator:boolean}) {
  const container=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    let disposed=false;let cleanup=()=>{};
    const element=container.current;if(!element)return;
    import('lightweight-charts').then(({createChart,CandlestickSeries,LineSeries,ColorType})=>{
      if(disposed)return;
      const css=getComputedStyle(element);const colorContext=document.createElement('canvas').getContext('2d',{willReadFrequently:true});if(!colorContext)throw new Error('Canvas color conversion is unavailable.');
      const token=(name:string)=>{colorContext.clearRect(0,0,1,1);colorContext.fillStyle=css.getPropertyValue(name).trim();colorContext.fillRect(0,0,1,1);const pixel=colorContext.getImageData(0,0,1,1).data;const r=pixel[0]??0;const g=pixel[1]??0;const b=pixel[2]??0;const a=pixel[3]??255;return `rgba(${r},${g},${b},${(a/255).toFixed(3)})`;};
      const chart=createChart(element,{autoSize:true,layout:{background:{type:ColorType.Solid,color:token('--background')},textColor:token('--muted-foreground'),fontSize:10,attributionLogo:false},grid:{vertLines:{color:token('--market-grid')},horzLines:{color:token('--market-grid')}},rightPriceScale:{borderColor:token('--market-grid')},timeScale:{borderColor:token('--market-grid'),timeVisible:true,secondsVisible:false},localization:{priceFormatter:(value:number)=>value.toFixed(product.decimals)}});
      const seed=product.symbol.split('').reduce((a,c)=>a+c.charCodeAt(0),0);const step=interval==='1m'?60:interval==='5m'?300:interval==='15m'?900:interval==='1h'?3600:86400;
      const start=1791283500;const range=product.ask*0.0018;let previous=product.ask-range*0.65;
      const data=Array.from({length:90},(_,i)=>{const trend=i<40?i/40:(i<76?1-(i-40)/43:0.17+(i-76)/35);const close=product.ask+range*(trend-0.4)+Math.sin(i*1.8+seed)*range*0.055;const open=previous;previous=close;return {time:(start+i*step) as import('lightweight-charts').UTCTimestamp,open,close,high:Math.max(open,close)+range*(0.018+Math.abs(Math.sin(i))*0.035),low:Math.min(open,close)-range*0.035};});
      if(line){const series=chart.addSeries(LineSeries,{color:token('--market-candle-up'),lineWidth:2});series.setData(data.map(d=>({time:d.time,value:d.close})));}
      else {const series=chart.addSeries(CandlestickSeries,{upColor:token('--market-candle-up'),downColor:token('--market-candle-down'),wickUpColor:token('--market-candle-up'),wickDownColor:token('--market-candle-down'),borderVisible:false});series.setData(data);}
      if(indicator){const moving=chart.addSeries(LineSeries,{color:token('--primary'),lineWidth:1,priceLineVisible:false,lastValueVisible:false});moving.setData(data.slice(8).map((d,i)=>({time:d.time,value:data.slice(i,i+9).reduce((sum,c)=>sum+c.close,0)/9})));}
      chart.timeScale().fitContent();cleanup=()=>chart.remove();
    });
    return ()=>{disposed=true;cleanup();};
  },[product,interval,line,indicator]);
  return <div ref={container} className="market-chart" aria-label={`Grafik simulasi ${product.symbol}, ${interval}`} />;
}