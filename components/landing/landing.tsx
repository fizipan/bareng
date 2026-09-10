import Link from "next/link"
import { ArrowRightIcon, CheckIcon, RotateCcwIcon, XIcon } from "lucide-react"
import { Logo, LogoMark, Wordmark } from "@/components/brand/logo"
import { FrameFill } from "@/components/strip/frame-fill"
import { Strip } from "@/components/strip/strip"
import { BRAND, SITE_HOST, SUPPORT_EMAIL } from "@/lib/brand"
import { FAQ } from "@/lib/content/faq"
import { PREMIUM_PRICE_SHORT } from "@/lib/content/pricing"
import { DEMO_FRAMES } from "@/lib/session/demo"
import { BUILTIN_TEMPLATES, getTemplate } from "@/lib/templates/builtin"
import { LOOKS, lookBackground, stripe } from "@/lib/templates/placeholder"
import { cn } from "@/lib/utils"
import { Faq } from "./faq"
import { StartButton } from "./start-button"

// Landing R0 (prototipe baris 97–363). Responsif lewat container query, supaya
// tampil benar juga di bingkai HP halaman /dev/screens.
export function Landing() {
  return (
    <div className="@container flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-[520px] flex-col gap-[30px] px-5 pt-2 pb-9 @3xl:max-w-[1040px] @3xl:gap-16 @3xl:px-10 @3xl:pt-6 @3xl:pb-16">
        <header className="flex items-center justify-between">
          <Logo tagline="photobooth berdua" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-[7px] text-caption font-medium">
            <span aria-hidden className="size-1.5 rounded-full bg-ok" />
            gratis, tanpa akun
          </span>
        </header>

        <section className="grid items-center gap-[30px] @3xl:grid-cols-2 @3xl:gap-12">
          <HeroArt />
          <div className="flex flex-col gap-3.5 @3xl:-order-1 @3xl:gap-5">
            <h1 className="font-display text-hero font-extrabold tracking-[-0.01em] @3xl:text-display-lg">
              Foto bareng, walau jauh.
            </h1>
            <p className="max-w-[34ch] text-body text-soft-foreground">
              Photobooth online untuk kamu dan dia. Buka link, hitung mundur bareng, jadi.
            </p>
            <div className="flex flex-col gap-2.5 @3xl:max-w-[400px]">
              <StartButton />
              <Link
                href="/gabung"
                className="flex h-15 items-center gap-3.5 rounded-md border-[1.5px] border-outline-subtle bg-sunken px-[18px] text-body font-semibold outline-none transition-colors hover:border-outline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span aria-hidden className="grid size-[34px] shrink-0 grid-cols-[6px_6px] content-center justify-center gap-1 rounded-full bg-card">
                  <span className="size-1.5 rounded-[1.5px] bg-darkroom" />
                  <span className="size-1.5 rounded-[1.5px] bg-darkroom" />
                  <span className="size-1.5 rounded-[1.5px] bg-darkroom" />
                  <span className="size-1.5 rounded-[1.5px] bg-shutter" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span>Punya kode dari dia?</span>
                  <span className="text-caption font-normal text-muted-foreground">Gabung ke room-nya</span>
                </span>
              </Link>
            </div>
            <span className="text-meta text-muted-foreground">Satu link, dua orang, 90 detik.</span>
          </div>
        </section>

        <HowItWorks />
        <TemplatesPreview />
        <Features />

        <Pricing />

        <section id="faq" className="flex scroll-mt-6 flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-small font-semibold">Pertanyaan yang sering muncul</h2>
            <span className="text-caption text-muted-foreground">ketuk untuk buka</span>
          </div>
          <Faq />
          <div className="flex items-center justify-between gap-3 rounded-md border-[1.5px] border-line bg-sunken px-4 py-3.5 @3xl:px-6 @3xl:py-5">
            <span className="flex flex-col gap-0.5">
              <span className="text-small font-semibold">Masih ada yang mau ditanya?</span>
              <span className="text-meta text-muted-foreground">Kami balas dalam 2 hari kerja.</span>
            </span>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-meta font-semibold whitespace-nowrap text-link">
              {SUPPORT_EMAIL}
            </a>
          </div>
        </section>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          }),
        }}
      />
    </div>
  )
}

function HeroArt() {
  return (
    <div aria-hidden className="relative flex justify-center pt-[22px] pb-2.5 @3xl:py-10">
      <div className="absolute inset-0 bg-dots [--dots-color:#D5D2C9] [mask-image:radial-gradient(circle_at_50%_45%,#000_0%,#000_52%,transparent_76%)]" />
      <div className="absolute top-[26px] left-1/2 size-[236px] -translate-x-1/2 rounded-full border-[1.5px] border-line @3xl:top-1/2 @3xl:size-[320px] @3xl:-translate-y-1/2" />
      <div className="relative flex w-[186px] rotate-3 flex-col gap-2 rounded-[2px] bg-white px-4 pt-2.5 pb-[34px] shadow-strip @3xl:scale-[1.3]">
        <span className="absolute inset-y-0 left-1 w-[5px] bg-[repeating-linear-gradient(180deg,#DCD9D1_0_7px,transparent_7px_17px)]" />
        <span className="absolute inset-y-0 right-1 w-[5px] bg-[repeating-linear-gradient(180deg,#DCD9D1_0_7px,transparent_7px_17px)]" />
        {LOOKS.map((_, i) => (
          <span key={i} className="flex h-[74px] gap-0.5">
            <span className="flex-1" style={{ background: lookBackground(i, "a") }} />
            <span className="flex-1" style={{ background: lookBackground(i, "b") }} />
          </span>
        ))}
        <span className="absolute bottom-[11px] left-4 font-display text-meta font-semibold text-darkroom">14.02.27</span>
      </div>
      <span className="absolute top-9 right-1.5 -rotate-9 rounded-full bg-flash px-3 py-2 font-display text-small font-semibold text-darkroom @3xl:top-12 @3xl:right-10">
        90 detik
      </span>
    </div>
  )
}

const STEPS = [
  { title: "Buat room", desc: "Sekali ketuk, dapat link dan kode enam huruf." },
  { title: "Kirim ke dia", desc: "Lewat WhatsApp. Dia tinggal klik, nggak perlu daftar." },
  { title: "Hitung mundur bareng", desc: "Empat foto, satu photostrip, langsung bisa diunduh." },
]

// Mobile: baris ringkas persis prototipe. Desktop: kartu dengan cuplikan layar
// aplikasi (kode room, chat berisi link, hitung mundur di dua kamera).
function HowItWorks() {
  return (
    <section id="cara-kerja" className="flex scroll-mt-6 flex-col gap-3.5 @3xl:gap-5">
      <h2 className="text-small font-semibold">Cara kerjanya</h2>
      <ol className="grid gap-2.5 @3xl:grid-cols-3 @3xl:gap-6">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="flex flex-col rounded-md bg-card px-3.5 py-[13px] @3xl:gap-5 @3xl:p-3 @3xl:pb-6"
          >
            <StepScene step={i} />
            <div className="flex items-center gap-[13px] @3xl:items-start @3xl:px-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-darkroom font-display text-label font-semibold text-kertas">
                {i + 1}
              </span>
              <span className="flex flex-1 flex-col gap-0.5 @3xl:gap-1">
                <span className="text-label font-semibold @3xl:text-body">{step.title}</span>
                <span className="text-meta leading-[1.4] text-muted-foreground @3xl:text-small">{step.desc}</span>
              </span>
              <StepArt step={i} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function StepArt({ step }: { step: number }) {
  const base = "shrink-0 @3xl:hidden"
  if (step === 0) {
    return (
      <span aria-hidden className={cn(base, "flex gap-[3px]")}>
        <span className="h-4 w-[9px] rounded-[2px] bg-[#C6C3BA]" />
        <span className="h-4 w-[9px] rounded-[2px] bg-[#C6C3BA]" />
        <span className="h-4 w-[9px] rounded-[2px] bg-shutter" />
      </span>
    )
  }
  if (step === 1) {
    return <span aria-hidden className={cn(base, "h-[22px] w-7 rounded-[8px_8px_2px_8px] bg-ok")} />
  }
  return (
    <span
      aria-hidden
      className={cn(base, "flex size-[30px] items-center justify-center rounded-full bg-darkroom font-display text-label font-extrabold text-flash")}
    >
      3
    </span>
  )
}

const DEMO_CODE = "K7M2QX"

function StepScene({ step }: { step: number }) {
  return (
    <div
      aria-hidden
      className="relative hidden h-44 items-center justify-center overflow-hidden rounded-[10px] bg-darkroom text-kertas @3xl:flex"
    >
      <span className="absolute inset-0 bg-dots [--dots-color:rgb(244_243_239/0.06)]" />
      {step === 0 && (
        <div className="relative flex flex-col items-center gap-3">
          <span className="text-caption text-grain">Kode room</span>
          <div className="flex gap-1.5">
            {DEMO_CODE.split("").map((ch, i) => (
              <span
                key={i}
                className="flex h-11 w-8 items-center justify-center rounded-[5px] bg-darkroom-2 font-display text-lg font-semibold"
              >
                {ch}
              </span>
            ))}
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-darkroom-2 px-2.5 py-1 text-[11px] text-kabin-soft">
            <span className="size-1.5 rounded-full bg-ok" />
            Room dibuat
          </span>
        </div>
      )}
      {step === 1 && (
        <div className="relative flex w-full max-w-[230px] flex-col gap-2 px-2">
          <div className="max-w-[88%] self-end rounded-[14px_14px_4px_14px] bg-ok px-3 py-2 text-caption leading-snug">
            Foto bareng yuk! Klik ini ya: <span className="font-semibold underline">bareng.id/r/{DEMO_CODE}</span>
          </div>
          <div className="self-start rounded-[14px_14px_14px_4px] bg-darkroom-2 px-3 py-2 text-caption text-kabin-soft">
            Oke, aku masuk
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="relative flex gap-1.5 rounded-[4px] outline-2 outline-offset-4 outline-shutter">
          {(["kamu", "dia"] as const).map((who, i) => (
            <span
              key={who}
              className="relative h-28 w-20 overflow-hidden rounded-[3px]"
              style={{ background: lookBackground(i, i ? "b" : "a") }}
            >
              <span className="absolute bottom-1 left-1.5 font-mono text-[9px] text-[#9C99A8]">{who}</span>
            </span>
          ))}
          <span className="absolute inset-0 flex items-center justify-center bg-darkroom/45 font-display text-[60px] leading-none font-extrabold text-flash">
            3
          </span>
        </div>
      )}
    </div>
  )
}

// Strip asli (renderer yang sama dengan hasil akhir) diletakkan seperti hasil
// cetak di atas meja: sedikit miring, bayangan tipis, label sejajar di bawah.
const SHOWCASE = [
  { id: "film", tilt: "-rotate-2" },
  { id: "kodak", tilt: "rotate-1" },
  { id: "valentine", tilt: "rotate-3" },
]

function TemplatesPreview() {
  return (
    <section id="template" className="flex scroll-mt-6 flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-small font-semibold">Tiga dari enam template</h2>
        <span className="text-caption text-muted-foreground">3 gratis, 3 premium</span>
      </div>
      <div className="relative overflow-hidden rounded-md bg-card px-4 pt-6 pb-4 @3xl:px-10 @3xl:pt-12 @3xl:pb-8">
        <span aria-hidden className="absolute inset-0 bg-dots [--dots-color:#D5D2C9]" />
        <div className="relative grid grid-cols-3 items-end justify-items-center gap-x-3 gap-y-3 @3xl:mx-auto @3xl:max-w-[640px] @3xl:gap-x-10 @3xl:gap-y-5">
          {SHOWCASE.map(({ id, tilt }) => {
            const t = getTemplate(id)
            return (
              <Strip
                key={id}
                template={t}
                tokens={{ date: "14.02.27", host: SITE_HOST }}
                shadow="strip"
                className={cn("w-full max-w-[112px] @3xl:max-w-[168px]", tilt)}
                renderHalf={(i, side) => <FrameFill source={DEMO_FRAMES[i][side]} side={side} />}
              />
            )
          })}
          {SHOWCASE.map(({ id }) => {
            const t = getTemplate(id)
            return (
              <span key={id} className="flex flex-wrap items-center justify-center gap-1.5 self-start text-center text-caption text-soft-foreground @3xl:text-small">
                {t.name}
                {t.tier === "premium" && (
                  <span className="rounded-sm bg-flash px-1.5 py-px text-[10px] font-semibold text-darkroom">Premium</span>
                )}
              </span>
            )
          })}
        </div>
      </div>
    </section>
  )
}

const FEATURES = [
  { title: "Hitung mundur serentak", desc: "Dua layar, satu momen. Selisihnya di bawah 0,15 detik." },
  { title: "Bukan screenshot video call", desc: "Tiap foto diambil dari kamera kalian sendiri, jadi hasilnya jernih." },
  { title: "Enam template", desc: "Pilih bareng, berubah di layar dia juga." },
  { title: "Ulang satu foto", desc: "Yang jelek diulang, tiga lainnya aman." },
]

// Mobile: ikon kecil prototipe. Desktop: visual hasil cetak yang menjelaskan fiturnya.
function Features() {
  return (
    <section className="flex flex-col gap-3 @3xl:gap-5">
      <h2 className="text-small font-semibold">Yang bikin ini terasa satu foto</h2>
      <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4 @3xl:gap-6">
        {FEATURES.map((f, i) => (
          <div key={f.title} className="flex flex-col gap-2 rounded-md bg-card p-3.5 @3xl:gap-2 @3xl:p-3 @3xl:pb-5">
            <FeatureArt index={i} />
            <FeatureScene index={i} />
            <span className="text-small font-semibold @3xl:mt-3 @3xl:px-1 @3xl:text-body">{f.title}</span>
            <span className="text-meta leading-[1.45] text-muted-foreground @3xl:px-1 @3xl:text-small">{f.desc}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function FeatureArt({ index }: { index: number }) {
  const tile = "relative flex size-11 items-center justify-center rounded-[8px] bg-darkroom @3xl:hidden"
  if (index === 0) {
    return <span aria-hidden className={cn(tile, "font-display text-[22px] font-extrabold text-flash")}>3</span>
  }
  if (index === 1) {
    return (
      <span aria-hidden className={cn(tile, "gap-[3px] p-1.5")}>
        <span className="h-full flex-1" style={{ background: stripe("#40384A", "#372F41", 5) }} />
        <span className="h-full flex-1" style={{ background: stripe("#463C33", "#3D342C", 5) }} />
      </span>
    )
  }
  if (index === 2) {
    return (
      <span aria-hidden className={cn(tile, "gap-1 p-[7px]")}>
        <span className="h-full w-[7px] bg-kertas" />
        <span className="h-full w-[7px] bg-flash" />
        <span className="h-full w-[7px] bg-grain" />
      </span>
    )
  }
  return (
    <span aria-hidden className={cn(tile, "block")}>
      <span className="absolute top-2.5 left-2.5 h-4 w-5 border-[1.75px] border-kertas" />
      <span className="absolute right-[9px] bottom-[9px] size-3.5 rounded-[3px] bg-shutter" />
    </span>
  )
}

const MINI_TILTS = [-4, 3, -2, 4, -3, 2]

function FeatureScene({ index }: { index: number }) {
  const tokens = { date: "14.02.27", host: SITE_HOST }
  return (
    <div
      aria-hidden
      className="relative hidden h-36 items-center justify-center overflow-hidden rounded-[10px] bg-sunken @3xl:flex"
    >
      <span className="absolute inset-0 bg-dots" />
      {index === 0 && (
        <div className="relative flex items-center gap-2">
          <MiniPhone />
          <span className="flex flex-col items-center gap-1.5">
            <span className="w-12 border-t-[1.5px] border-dashed border-grain" />
            <span className="rounded-full bg-darkroom px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-flash">
              &lt; 0,15 dtk
            </span>
          </span>
          <MiniPhone />
        </div>
      )}
      {index === 1 && (
        <div className="relative flex items-center gap-2.5">
          <span className="relative flex flex-col gap-1 rounded-[6px] bg-[#D5D2C9] p-1">
            <span className="flex gap-0.5 blur-[1.2px]">
              <span className="h-10 w-6" style={{ background: lookBackground(0, "a", 5) }} />
              <span className="h-10 w-6" style={{ background: lookBackground(0, "b", 5) }} />
            </span>
            <span className="h-1.5 rounded-full bg-grain/50" />
            <Badge tone="no" />
          </span>
          <ArrowRightIcon className="size-4 text-grain" />
          <span className="relative -rotate-3 bg-white px-1 pt-1 pb-3.5 shadow-strip">
            <span className="flex gap-0.5">
              <span className="h-14 w-9" style={{ background: lookBackground(0, "a") }} />
              <span className="h-14 w-9" style={{ background: lookBackground(0, "b") }} />
            </span>
            <Badge tone="yes" />
          </span>
        </div>
      )}
      {index === 2 && (
        <div className="relative flex items-end gap-1.5">
          {BUILTIN_TEMPLATES.map((t, i) => (
            <Strip
              key={t.id}
              template={t}
              tokens={tokens}
              shadow="strip"
              className="w-[22px]"
              style={{ rotate: `${MINI_TILTS[i]}deg` }}
              renderHalf={(slot, side) => <FrameFill source={DEMO_FRAMES[slot][side]} side={side} />}
            />
          ))}
        </div>
      )}
      {index === 3 && (
        <div className="relative flex items-center gap-3">
          <Strip
            template={getTemplate("film")}
            tokens={tokens}
            shadow="strip"
            className="w-[46px] -rotate-3"
            slotClassName={(slot) => (slot === 1 ? "outline-2 outline-shutter" : undefined)}
            renderHalf={(slot, side) =>
              slot === 1 ? <span className="absolute inset-0 bg-darkroom-2" /> : <FrameFill source={DEMO_FRAMES[slot][side]} side={side} />
            }
          />
          <span className="flex items-center gap-1.5 rounded-full bg-darkroom px-2.5 py-1 text-[11px] font-semibold text-kertas">
            <RotateCcwIcon className="size-3" />
            Ulang foto 2
          </span>
        </div>
      )}
    </div>
  )
}

function MiniPhone() {
  return (
    <span className="flex h-[76px] w-11 items-center justify-center rounded-[9px] bg-darkroom font-display text-2xl font-extrabold text-flash ring-2 ring-darkroom-2">
      3
    </span>
  )
}

function Badge({ tone }: { tone: "yes" | "no" }) {
  return (
    <span
      className={cn(
        "absolute -top-2 -right-2 flex size-[18px] items-center justify-center rounded-full text-kertas",
        tone === "yes" ? "bg-ok" : "bg-grain"
      )}
    >
      {tone === "yes" ? <CheckIcon className="size-2.5" strokeWidth={3.5} /> : <XIcon className="size-2.5" strokeWidth={3.5} />}
    </span>
  )
}

const PLANS = [
  {
    name: "Gratis",
    price: "Rp0",
    unit: "selamanya",
    perks: ["3 template", "Watermark kecil", "Simpan 7 hari", "3 sesi per hari"],
    note: "Langsung pakai, nggak perlu daftar.",
    premium: false,
  },
  {
    name: "Sekali sesi",
    price: PREMIUM_PRICE_SHORT,
    unit: "per sesi",
    perks: ["Semua 6 template", "Tanpa watermark", "Kualitas tinggi", "Simpan permanen"],
    note: "Satu bayar untuk kalian berdua, di akhir sesi, kalau mau hasil tanpa watermark.",
    premium: true,
  },
]

const PRICE_FACTS = [
  { label: "Satu bayar untuk kalian berdua", dot: "bg-shutter" },
  { label: "Bayar pakai QRIS", dot: "bg-flash" },
  { label: "Tanpa langganan", dot: "bg-ok" },
]

// Mobile: dua kartu ringkas prototipe. Desktop: kartu lebar dengan contoh strip
// (pakai / tanpa watermark) supaya bedanya kelihatan, bukan cuma dibaca.
function Pricing() {
  return (
    <section id="harga" className="flex scroll-mt-6 flex-col gap-3 @3xl:gap-5">
      <h2 className="text-small font-semibold">Harga</h2>
      <div className="grid grid-cols-2 gap-3 @3xl:gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "relative flex flex-col gap-2.5 overflow-hidden rounded-md px-3.5 py-4 @3xl:grid @3xl:grid-cols-[1fr_auto] @3xl:gap-6 @3xl:p-7",
              plan.premium ? "bg-darkroom text-kertas" : "border-[1.5px] border-line"
            )}
          >
            {plan.premium && (
              <span className="absolute top-3 right-3 rounded-sm bg-flash px-[7px] py-[3px] text-[10px] font-semibold text-darkroom @3xl:hidden">
                Premium
              </span>
            )}
            <div className="flex flex-col gap-2.5 @3xl:gap-4">
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-meta font-semibold @3xl:text-small",
                    plan.premium ? "text-kabin-soft" : "text-muted-foreground"
                  )}
                >
                  {plan.name}
                </span>
                {plan.premium && (
                  <span className="hidden rounded-sm bg-flash px-[7px] py-[3px] text-caption font-semibold text-darkroom @3xl:inline">
                    Premium
                  </span>
                )}
              </span>
              <span className="flex items-baseline gap-2">
                <span className="font-display text-[26px] leading-none font-extrabold @3xl:text-[44px]">{plan.price}</span>
                <span className={cn("hidden text-small @3xl:inline", plan.premium ? "text-kabin-muted" : "text-muted-foreground")}>
                  {plan.unit}
                </span>
              </span>
              <ul
                className={cn(
                  "flex flex-col gap-1.5 text-caption @3xl:gap-2.5 @3xl:border-t @3xl:pt-4 @3xl:text-small",
                  plan.premium ? "text-[#E4E2E8] @3xl:border-[#2A2636]" : "text-soft-foreground @3xl:border-line"
                )}
              >
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2.5">
                    {plan.premium ? (
                      <CheckIcon aria-hidden className="hidden size-4 shrink-0 text-flash @3xl:block" strokeWidth={2.5} />
                    ) : (
                      <span aria-hidden className="hidden size-1.5 shrink-0 rounded-full bg-grain @3xl:mx-[5px] @3xl:block" />
                    )}
                    {perk}
                  </li>
                ))}
              </ul>
              <span className={cn("hidden text-caption @3xl:block", plan.premium ? "text-kabin-muted" : "text-muted-foreground")}>
                {plan.note}
              </span>
            </div>
            <div className="relative hidden w-[112px] items-center justify-center self-center @3xl:flex">
              <Strip
                template={getTemplate(plan.premium ? "kodak" : "film")}
                tokens={{ date: "14.02.27", host: "bareng.id" }}
                watermark={!plan.premium}
                shadow={plan.premium ? "strip-dark" : "strip"}
                className={cn("w-full", plan.premium ? "rotate-3" : "-rotate-3")}
                renderHalf={(i, side) => <FrameFill source={DEMO_FRAMES[i][side]} side={side} />}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {PRICE_FACTS.map((fact, i) => (
          <span
            key={fact.label}
            className={cn("items-center gap-[7px] rounded-full bg-card px-3 py-2 text-caption", i === 0 ? "inline-flex" : "hidden @3xl:inline-flex")}
          >
            <span aria-hidden className={cn("size-1.5 rounded-full", fact.dot)} />
            {fact.label}
          </span>
        ))}
      </div>
    </section>
  )
}

const FOOTER_LINKS = [
  {
    title: "Mulai",
    links: [
      { label: "Gabung pakai kode", href: "/gabung" },
      { label: "Cara kerjanya", href: "#cara-kerja" },
      { label: "Template", href: "#template" },
      { label: "Harga", href: "#harga" },
    ],
  },
  {
    title: "Bantuan",
    links: [
      { label: "Pertanyaan umum", href: "#faq" },
      { label: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privasi", href: "/privasi" },
      { label: "Ketentuan pakai", href: "/ketentuan" },
    ],
  },
]

// Janji yang sama dengan ringkasan halaman privasi.
const PROMISES = ["Tanpa akun", "Tanpa iklan", "Tanpa galeri publik"]

function Footer() {
  return (
    <footer className="relative overflow-hidden bg-darkroom text-kertas">
      <span aria-hidden className="absolute inset-0 bg-dots [--dots-color:rgb(244_243_239/0.08)]" />
      <div className="relative mx-auto w-full max-w-[520px] px-5 pt-10 pb-8 @3xl:max-w-[1040px] @3xl:px-10 @3xl:pt-16 @3xl:pb-10">
        <div className="grid items-center gap-8 @3xl:grid-cols-[1fr_minmax(0,420px)] @3xl:gap-12">
          <div className="flex flex-col gap-5">
            <span className="flex items-center gap-2.5">
              <LogoMark size={30} />
              <Wordmark className="text-[19px]" />
            </span>
            <h2 className="max-w-[12ch] font-display text-hero font-extrabold tracking-[-0.01em] @3xl:text-display-lg">
              Foto bareng, walau jauh.
            </h2>
            <p className="max-w-[36ch] text-body text-kabin-soft">
              Buat room sekarang, kirim link-nya ke dia. Empat foto, satu photostrip, sekitar 90 detik.
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <StartButton variant="compact" />
              <Link
                href="/gabung"
                className="text-small font-semibold text-kertas underline decoration-kabin-line underline-offset-4 hover:decoration-kertas"
              >
                Punya kode dari dia?
              </Link>
            </div>
          </div>
          <FooterStrips />
        </div>

        <div className="mt-10 grid grid-cols-2 gap-8 border-t border-[#2A2636] pt-8 @3xl:mt-14 @3xl:grid-cols-4">
          {FOOTER_LINKS.map((group) => (
            <nav key={group.title} aria-label={group.title} className="flex flex-col gap-3">
              <span className="text-caption font-semibold text-grain">{group.title}</span>
              <ul className="flex flex-col gap-2.5 text-small">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-kertas/90 underline-offset-4 hover:text-kertas hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div className="flex flex-col gap-3">
            <span className="text-caption font-semibold text-grain">Janji kami</span>
            <ul className="flex flex-col gap-2.5 text-small text-kabin-soft">
              {PROMISES.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <span aria-hidden className="size-1.5 rounded-full bg-flash" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-1.5 border-t border-[#2A2636] pt-6 text-caption text-kabin-muted @3xl:flex-row @3xl:items-center @3xl:justify-between">
          <span>
            © {new Date().getFullYear()} {BRAND}. Foto kalian milik kalian.
          </span>
          <span>Dibuat untuk yang lagi berjauhan.</span>
        </div>
      </div>
    </footer>
  )
}

// Tiga strip asli ditumpuk seperti hasil cetak yang baru keluar dari mesin.
const FOOTER_STRIPS = [
  { id: "polaroid", className: "left-[11%] top-9 w-[27%] -rotate-10" },
  { id: "kodak", className: "left-1/2 top-0 z-10 w-[31%] -translate-x-1/2 rotate-2" },
  { id: "valentine", className: "right-[11%] top-12 w-[27%] rotate-10" },
]

function FooterStrips() {
  return (
    <div
      aria-hidden
      className="relative mx-auto h-[220px] w-full max-w-[420px] [mask-image:linear-gradient(#000_62%,transparent)] @3xl:h-[340px]"
    >
      {FOOTER_STRIPS.map(({ id, className }) => (
        <div key={id} className={cn("absolute", className)}>
          <Strip
            template={getTemplate(id)}
            tokens={{ date: "14.02.27", host: SITE_HOST }}
            shadow="strip-dark"
            renderHalf={(i, side) => <FrameFill source={DEMO_FRAMES[i][side]} side={side} />}
          />
        </div>
      ))}
    </div>
  )
}
