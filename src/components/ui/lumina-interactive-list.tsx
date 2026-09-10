"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type LuminaSlide = {
  id: string;
  title: string;
  description?: string;
  image: string;
  href?: string;
};

type Props = {
  slides: LuminaSlide[];
  /** мелкая надпись сверху */
  eyebrow?: string;
  /** подпись ссылки на проект */
  linkLabel?: string;
  /** кнопки/контакты внизу поверх слайдера */
  children?: React.ReactNode;
  /** длительность показа одного слайда, мс */
  autoplay?: number;
  /** длительность перехода, мс */
  transition?: number;
  className?: string;
};

/* ---------- WebGL ---------- */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
uniform sampler2D uTex1;
uniform sampler2D uTex2;
uniform float uProgress;
uniform vec2 uResolution;
uniform vec2 uSize1;
uniform vec2 uSize2;
varying vec2 vUv;

vec2 coverUV(vec2 uv, vec2 texSize) {
  vec2 s = uResolution / texSize;
  float scale = max(s.x, s.y);
  vec2 scaled = texSize * scale;
  vec2 offset = (uResolution - scaled) * 0.5;
  return (uv * uResolution - offset) / scaled;
}

void main() {
  float progress = uProgress;
  float time = progress * 5.0;

  vec2 uv1 = coverUV(vUv, uSize1);
  vec2 uv2 = coverUV(vUv, uSize2);

  float maxR = length(uResolution) * 0.85;
  float br = progress * maxR;

  vec2 p = vUv * uResolution;
  vec2 c = uResolution * 0.5;
  float d = length(p - c);
  float nd = d / max(br, 0.001);
  float param = smoothstep(br + 3.0, br - 3.0, d);

  vec4 img;
  if (param > 0.0) {
    vec2 dir = d > 0.0 ? (p - c) / d : vec2(0.0);
    float ro = 0.08 * pow(smoothstep(0.3, 1.0, nd), 1.5);
    vec2 duv = uv2 - dir * ro;
    duv += vec2(sin(time + nd * 10.0), cos(time * 0.8 + nd * 8.0)) * 0.015 * nd * param;
    float ca = 0.02 * pow(smoothstep(0.3, 1.0, nd), 1.2);
    img = vec4(
      texture2D(uTex2, duv + dir * ca * 1.2).r,
      texture2D(uTex2, duv + dir * ca * 0.2).g,
      texture2D(uTex2, duv - dir * ca * 0.8).b,
      1.0
    );
    float rim = smoothstep(0.95, 1.0, nd) * (1.0 - smoothstep(1.0, 1.01, nd));
    img.rgb += rim * 0.10;
  } else {
    img = texture2D(uTex2, uv2);
  }

  if (progress > 0.95) img = mix(img, texture2D(uTex2, uv2), (progress - 0.95) / 0.05);

  gl_FragColor = mix(texture2D(uTex1, uv1), img, param);
}`;

type Tex = { tex: WebGLTexture; w: number; h: number };

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function makeTexture(gl: WebGLRenderingContext, img: HTMLImageElement): Tex | null {
  const tex = gl.createTexture();
  if (!tex) return null;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return { tex, w: img.naturalWidth || 1, h: img.naturalHeight || 1 };
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** Слайдер проектов: фото переключаются «стеклянной» волной, справа — список названий. */
export default function LuminaInteractiveList({
  slides,
  eyebrow,
  linkLabel,
  children,
  autoplay = 5200,
  transition = 2000,
  className,
}: Props) {
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const glRef = useRef<WebGLRenderingContext | null>(null);
  const texRef = useRef<(Tex | null)[]>([]);
  const uniRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const stateRef = useRef({ current: 0, busy: false, progress: 0, from: 0, to: 0 });
  const rafRef = useRef(0);

  const count = slides.length;

  /* --- рисуем кадр --- */
  const draw = useCallback(() => {
    const gl = glRef.current;
    const canvas = canvasRef.current;
    if (!gl || !canvas) return;
    const a = texRef.current[stateRef.current.from];
    const b = texRef.current[stateRef.current.to];
    if (!a || !b) return;

    const u = uniRef.current;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, a.tex);
    gl.uniform1i(u.uTex1 as WebGLUniformLocation, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, b.tex);
    gl.uniform1i(u.uTex2 as WebGLUniformLocation, 1);
    gl.uniform2f(u.uSize1 as WebGLUniformLocation, a.w, a.h);
    gl.uniform2f(u.uSize2 as WebGLUniformLocation, b.w, b.h);
    gl.uniform2f(u.uResolution as WebGLUniformLocation, canvas.width, canvas.height);
    gl.uniform1f(u.uProgress as WebGLUniformLocation, stateRef.current.progress);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, []);

  /* --- инициализация WebGL + загрузка картинок --- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || count === 0) return;

    const gl =
      (canvas.getContext("webgl", { antialias: false, alpha: false }) as WebGLRenderingContext | null) ??
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    ["uTex1", "uTex2", "uProgress", "uResolution", "uSize1", "uSize2"].forEach((name) => {
      uniRef.current[name] = gl.getUniformLocation(program, name);
    });

    glRef.current = gl;
    texRef.current = new Array(count).fill(null);

    let alive = true;

    const resize = () => {
      const box = wrapRef.current;
      if (!box || !alive) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(box.clientWidth * dpr));
      const h = Math.max(1, Math.round(box.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      draw();
    };

    const load = (src: string) =>
      new Promise<HTMLImageElement | null>((resolve) => {
        const img = new window.Image();
        img.decoding = "async";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });

    (async () => {
      // первый кадр — как можно раньше
      const first = await load(slides[0].image);
      if (!alive || !first) return;
      texRef.current[0] = makeTexture(gl, first);
      resize();
      setReady(true);

      for (let i = 1; i < count; i += 1) {
        const img = await load(slides[i].image);
        if (!alive) return;
        if (img) texRef.current[i] = makeTexture(gl, img);
      }
    })();

    const observer = new ResizeObserver(resize);
    if (wrapRef.current) observer.observe(wrapRef.current);
    window.addEventListener("resize", resize);

    return () => {
      alive = false;
      observer.disconnect();
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
      texRef.current.forEach((t) => t && gl.deleteTexture(t.tex));
      texRef.current = [];
      glRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, draw]);

  /* --- переход на слайд --- */
  const goTo = useCallback(
    (target: number) => {
      const st = stateRef.current;
      if (st.busy || target === st.current || !texRef.current[target]) return;

      st.busy = true;
      st.from = st.current;
      st.to = target;
      st.progress = 0;
      st.current = target;
      setIndex(target);

      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / transition);
        st.progress = easeInOut(t);
        draw();
        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          st.from = target;
          st.progress = 0;
          st.busy = false;
          draw();
        }
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [draw, transition]
  );

  /* --- автопрокрутка + полоска прогресса --- */
  useEffect(() => {
    if (!ready || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let start = performance.now();
    let last = index;

    const tick = (now: number) => {
      if (last !== index) {
        last = index;
        start = now;
      }
      const ratio = document.hidden || stateRef.current.busy ? 0 : Math.min(1, (now - start) / autoplay);
      const fill = fillRefs.current[index];
      if (fill) fill.style.transform = `scaleX(${ratio})`;
      if (document.hidden || stateRef.current.busy) start = now - ratio * autoplay;
      if (ratio >= 1) {
        start = now;
        goTo((index + 1) % count);
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ready, index, count, autoplay, goTo]);

  if (count === 0) return null;

  const active = slides[index];
  const chars = Array.from(active.title);

  return (
    <section
      ref={wrapRef}
      className={cn(
        "relative isolate flex min-h-[540px] flex-col overflow-hidden bg-ink text-white",
        "h-[calc(100svh-96px)] max-h-[880px]",
        className
      )}
    >
      <canvas ref={canvasRef} className="absolute inset-0 -z-20 h-full w-full" />
      {/* пока грузится WebGL — обычная картинка, чтобы не было пустоты */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slides[0].image}
        alt=""
        aria-hidden
        className={cn(
          "absolute inset-0 -z-30 h-full w-full object-cover transition-opacity duration-500",
          ready && "opacity-0"
        )}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,19,36,0.86)_0%,rgba(8,19,36,0.55)_45%,rgba(8,19,36,0.35)_100%)]"
      />

      <div className="relative mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-5 pb-8 pt-28 lg:pb-12 lg:pt-32">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[4px] text-white/60">{eyebrow}</p>
        )}

        <div className="flex flex-1 flex-col justify-center py-8">
          <div className="max-w-[620px]">
            <span className="flex items-baseline gap-2 font-mono text-[13px] tracking-[2px] text-gold">
              <span className="text-[26px] font-semibold leading-none">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-white/40">/ {String(count).padStart(2, "0")}</span>
            </span>

            <h1
              key={active.id}
              className="mt-4 text-[30px] font-extrabold uppercase leading-[1.1] sm:text-[42px] lg:text-[56px]"
            >
              {chars.map((char, i) => (
                <span
                  key={`${active.id}-${i}`}
                  className="lumina-char"
                  style={{ animationDelay: `${i * 22}ms` }}
                >
                  {char === " " ? " " : char}
                </span>
              ))}
            </h1>

            <div className="mt-5 h-[3px] w-24 rounded-full bg-gradient-to-r from-gold to-gold/10" />

            {active.description && (
              <p
                key={`${active.id}-desc`}
                className="lumina-fade mt-5 line-clamp-3 max-w-[520px] text-[15px] font-light leading-[26px] text-white/75 lg:text-[16px]"
              >
                {active.description}
              </p>
            )}

            {active.href && (
              <Link
                href={active.href}
                className="lumina-fade mt-7 inline-flex items-center gap-3 border-b border-gold/60 pb-1 text-[13px] font-semibold uppercase tracking-[2px] text-gold transition hover:gap-4"
              >
                {linkLabel ?? active.title}
                <svg width="13" height="12" viewBox="0 0 13 12" fill="none" aria-hidden>
                  <path
                    d="M12.53 6.53a.75.75 0 0 0 0-1.06L7.757.697a.75.75 0 1 0-1.06 1.06L10.939 6l-4.242 4.243a.75.75 0 0 0 1.06 1.06zM0 6v.75h12v-1.5H0z"
                    fill="currentColor"
                  />
                </svg>
              </Link>
            )}
          </div>
        </div>

        {/* список проектов — строкой внизу */}
        <nav className="relative">
          <ul className="flex gap-5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-8">
            {slides.map((slide, i) => (
              <li key={slide.id} className="min-w-[150px] flex-1 md:min-w-0">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={i === index}
                  className="group block w-full text-left"
                >
                  <span className="relative block h-px w-full overflow-hidden bg-white/25">
                    <span
                      ref={(el) => {
                        fillRefs.current[i] = el;
                      }}
                      className="absolute inset-0 origin-left bg-gold"
                      style={{ transform: i === index ? undefined : "scaleX(0)" }}
                    />
                  </span>
                  <span
                    className={cn(
                      "mt-3 block line-clamp-2 text-[11px] font-semibold uppercase leading-[16px] tracking-[1.5px] transition-colors md:text-[12px]",
                      i === index ? "text-white" : "text-white/45 group-hover:text-white/80"
                    )}
                  >
                    {slide.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {children && <div className="relative">{children}</div>}
      </div>
    </section>
  );
}
