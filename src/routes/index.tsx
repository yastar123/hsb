import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import demoImageAsset from "@/assets/images/welcome_demo_yellow_1791431074942.jpg";
const demoImage = demoImageAsset;
import bonusImageAsset from "@/assets/images/welcome_bonus_yellow_1791431085533.jpg";
const bonusImage = bonusImageAsset;
import rewardsImageAsset from "@/assets/images/welcome_rewards_yellow_1791431096756.jpg";
const rewardsImage = rewardsImageAsset;

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Selamat Datang — HSB Trading" },
    { name: "description", content: "Kenali HSB Trading: trading aman, akun demo, welcome bonus, dan Smart Reward." },
    { property: "og:title", content: "Selamat Datang — HSB Trading" },
    { property: "og:description", content: "Mulai perjalanan trading Anda bersama HSB." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

const slides = [
  { image: "/logo.jpg", label: "Trading aman dan terpercaya", title: <>Trading <span className="text-primary">Aman dan Nyaman di<br />Platform Terpercaya</span></>, alt: "Logo Platform Trading" },
  { image: demoImage, label: "Belajar dengan akun demo", title: <><span className="text-primary">Belajar Trading</span> Sambil<br />Berlatih dengan <span className="text-primary">Akun Demo</span></>, alt: "Perempuan belajar trading dengan ponsel dan ilustrasi candlestick" },
  { image: bonusImage, label: "Welcome bonus", title: <><span className="text-primary">Mulai Trading</span> dan Langsung<br />Dapatkan <span className="text-primary">Welcome Bonus</span></>, alt: "Ilustrasi welcome bonus hingga 350 dolar" },
  { image: rewardsImage, label: "Promo Smart Reward", title: <>Nikmati <span className="text-primary">Promo Menarik</span><br />dengan <span className="text-primary">Smart Reward</span><br />untuk <span className="text-primary">Setiap Trader</span></>, alt: "Perempuan dengan ilustrasi hadiah dan fitur trading" },
];

function Index() {
  const [active, setActive] = useState(0);
  const touchStart = useRef<number | null>(null);
  const slide = slides[active];
  if (!slide) return null;
  const changeSlide = (index: number) => { setActive((index + slides.length) % slides.length); };

  return (
    <main className="welcome-page bg-background">
      <section className="welcome-screen" aria-label="Selamat datang di HSB Trading" aria-roledescription="carousel"
        onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
        onTouchEnd={(event) => { const end = event.changedTouches[0]?.clientX; if (touchStart.current !== null && end !== undefined && Math.abs(end - touchStart.current) > 45) changeSlide(active + (end < touchStart.current ? 1 : -1)); touchStart.current = null; }}
        onKeyDown={(event) => { if (event.key === 'ArrowRight') changeSlide(active + 1); if (event.key === 'ArrowLeft') changeSlide(active - 1); }}>
        <div key={active} className="welcome-enter" aria-live="polite">
          <img className={`welcome-art ${active === 0 ? 'object-contain p-8 bg-zinc-950/90 border border-border/30' : 'object-cover'}`} src={slide.image} alt={slide.alt} width={1024} height={1024} draggable={false} />
          <div className="welcome-message">
            <h1 className="welcome-title">{slide.title}</h1>
          </div>
        </div>
        <nav className="welcome-pagination" aria-label="Pilih slide welcome">
          {slides.map((item, index) => <Button key={item.label} variant="ghost" className="welcome-dot" aria-label={`Slide ${index + 1}: ${item.label}`} aria-current={active === index ? 'true' : undefined} onClick={() => changeSlide(index)}><span /></Button>)}
        </nav>
        <Button className="welcome-register" asChild><Link to="/register">Daftar Sekarang</Link></Button>
        <div className="welcome-login">Sudah punya akun? <Button variant="link" className="welcome-login-link" asChild><Link to="/login">Masuk</Link></Button></div>
      </section>
    </main>
  );
}
