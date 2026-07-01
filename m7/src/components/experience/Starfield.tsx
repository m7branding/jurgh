"use client";

import { useEffect, useRef } from "react";

// Geanimeerd sterren- + pixelveld op <canvas>. Twinkelende sterren,
// zwevende pixels en subtiele parallax op muisbeweging. Respecteert
// prefers-reduced-motion.

type Star = {
  x: number;
  y: number;
  z: number; // diepte 0..1 (parallax + grootte)
  r: number;
  tw: number; // twinkle-fase
  tws: number; // twinkle-snelheid
  sq: boolean; // vierkant "pixel" i.p.v. rond sterretje
};

export function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let stars: Star[] = [];
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

    function build() {
      const rect = canvas!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const density = Math.min(220, Math.floor((w * h) / 7000));
      stars = Array.from({ length: density }, () => {
        const z = Math.random();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          z,
          r: 0.4 + z * 1.6,
          tw: Math.random() * Math.PI * 2,
          tws: 0.008 + Math.random() * 0.03,
          sq: Math.random() < 0.32,
        };
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      for (const s of stars) {
        if (!reduce) s.tw += s.tws;
        const twinkle = 0.55 + Math.sin(s.tw) * 0.45;
        const px = s.x + mouse.x * (s.z * 26);
        const py = s.y + mouse.y * (s.z * 26);

        // Sterretjes (magic) krijgen soms een fijne kruisflare.
        const alpha = 0.15 + s.z * 0.7 * twinkle;
        ctx!.globalAlpha = Math.min(1, alpha);

        if (s.sq) {
          ctx!.fillStyle = "#c9c6ff";
          const size = s.r * 1.3;
          ctx!.fillRect(px, py, size, size);
        } else {
          ctx!.beginPath();
          ctx!.arc(px, py, s.r, 0, Math.PI * 2);
          ctx!.fillStyle = "#ffffff";
          ctx!.fill();
          if (s.z > 0.72 && !reduce) {
            const g = s.r * (2 + twinkle * 2.5);
            ctx!.globalAlpha = Math.min(1, alpha) * 0.5;
            ctx!.strokeStyle = "#a5b4ff";
            ctx!.lineWidth = 0.6;
            ctx!.beginPath();
            ctx!.moveTo(px - g, py);
            ctx!.lineTo(px + g, py);
            ctx!.moveTo(px, py - g);
            ctx!.lineTo(px, py + g);
            ctx!.stroke();
          }
        }
      }
      ctx!.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(draw);
    }

    function onMove(e: MouseEvent) {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }

    build();
    draw();
    if (reduce) draw(); // enkel statisch renderen

    window.addEventListener("resize", build);
    window.addEventListener("mousemove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", build);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return <canvas ref={ref} className="exp-starfield" aria-hidden />;
}
