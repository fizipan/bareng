import Link from "next/link"
import { ArrowRightIcon, CheckIcon, KeyRoundIcon } from "lucide-react"
import { Logo, LogoMark, Wordmark } from "@/components/brand/logo"
import { Strip } from "@/components/strip/strip"
import { BRAND, SUPPORT_EMAIL } from "@/lib/brand"
import { faqList } from "@/lib/content/faq"
import { PAYMENTS_LIVE, PREMIUM_PRICE_SHORT } from "@/lib/content/pricing"
import { getTemplate } from "@/lib/templates/builtin"
import { cn } from "@/lib/utils"
import { InstallFooterLink } from "@/components/pwa/install-button"
import { InstallNudge } from "@/components/pwa/install-nudge"
import { HeroBooth } from "./art/hero-booth"
import { FeatureGrid } from "./art/feature-scenes"
import { FigureFill } from "@/components/art/figure"
import { FooterPrints, GlintStrip } from "./art/footer-prints"
import { HowItWorksSteps } from "./art/how-it-works"
import { TemplateTray } from "./art/template-tray"
import { ContactCard } from "@/components/legal/contact-card"
import { Faq } from "./faq"
import { LiveLine } from "./live-stats"
import { StartButton } from "./start-button"

// Landing R0 (prototipe baris 97–363). Responsif lewat container query, supaya
// tampil benar juga di bingkai HP halaman /dev/screens.
export function Landing() {
  // Pembayaran ditahan atau gateway masih "mock" → jawaban soal bayar di FAQ
  // ikut jujur bahwa premium belum bisa dibeli.
  const faq = faqList(!PAYMENTS_LIVE || (process.env.PAYMENT_PROVIDER ?? "mock") === "mock")
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
          <HeroBooth />
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
                className="group flex h-16 items-center gap-3.5 rounded-md border-[1.5px] border-outline bg-sunken pr-3 pl-[18px] text-body font-semibold shadow-[0_2px_0_rgb(22_20_29/0.06)] outline-none transition-[border-color,background-color,transform] duration-150 hover:bg-card focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98]"
              >
                <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card text-foreground group-hover:bg-background">
                  <KeyRoundIcon className="size-[18px]" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span>Punya kode dari dia?</span>
                  <span className="text-caption font-normal text-muted-foreground">Masukkan kodenya buat gabung</span>
                </span>
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-darkroom text-kertas transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  <ArrowRightIcon className="size-[18px]" strokeWidth={2.5} />
                </span>
              </Link>
            </div>
            <LiveLine fallback="Satu link, dua orang, 90 detik." />
          </div>
        </section>

        <HowItWorks />
        <TemplatesPreview />
        <Features />

        <Pricing />

        <section id="faq" className="flex scroll-mt-6 flex-col gap-4 @3xl:gap-6">
          <SectionHeader
            title="Pertanyaan yang sering muncul"
            desc="Hal-hal yang biasanya ditanya sebelum foto pertama."
            aside="ketuk untuk buka"
          />
          <Faq items={faq} />
          <ContactCard />
        </section>
      </main>
      <Footer />
      <InstallNudge />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          }),
        }}
      />
    </div>
  )
}

// Judul section: Bricolage, dengan satu kalimat penjelas di bawahnya.
function SectionHeader({ title, desc, aside }: { title: string; desc: string; aside?: string }) {
  return (
    <div className="flex flex-col gap-1.5 @3xl:flex-row @3xl:items-end @3xl:justify-between @3xl:gap-8">
      <div className="flex max-w-[56ch] flex-col gap-1.5">
        <h2 className="font-display text-[22px] leading-tight font-bold tracking-[-0.01em] @3xl:text-display-md">{title}</h2>
        <p className="text-small text-muted-foreground @3xl:text-body">{desc}</p>
      </div>
      {aside && <span className="shrink-0 text-caption text-muted-foreground @3xl:pb-1">{aside}</span>}
    </div>
  )
}

// Tiap langkah punya cuplikan layar aplikasi yang diputar bergantian
// (components/landing/art/how-it-works.tsx).
function HowItWorks() {
  return (
    <section id="cara-kerja" className="flex scroll-mt-6 flex-col gap-4 @3xl:gap-6">
      <SectionHeader
        title="Cara kerjanya"
        desc="Tiga langkah, sekitar 90 detik dari bikin room sampai photostrip jadi."
        aside="ketuk untuk putar ulang"
      />
      <HowItWorksSteps />
    </section>
  )
}

function TemplatesPreview() {
  return (
    <section id="template" className="flex scroll-mt-6 flex-col gap-4 @3xl:gap-6">
      <SectionHeader
        title="Tiga dari enam template"
        desc="Kertas, bingkai, dan tanggalnya ikut tercetak. Pilih bareng, berubah di layar dia juga."
        aside="3 gratis, 3 premium"
      />
      <TemplateTray />
    </section>
  )
}

// Tiap fitur dijelaskan lewat adegan kecil yang bisa diputar
// (components/landing/art/feature-scenes.tsx), bukan ikon abstrak.
function Features() {
  return (
    <section className="flex flex-col gap-4 @3xl:gap-6">
      <SectionHeader
        title="Yang bikin ini terasa satu foto"
        desc="Bukan dua kotak video call yang ditempel. Ini yang kami kerjakan supaya hasilnya jadi satu frame."
      />
      <FeatureGrid />
    </section>
  )
}

const PLANS = [
  {
    name: "Gratis",
    price: "Rp0",
    unit: "selamanya",
    perks: ["3 template", "Watermark kecil", "Simpan 7 hari", "3 sesi per hari"],
    note: "Langsung pakai, nggak perlu daftar. Kuota balik lagi tiap hari.",
    premium: false,
  },
  {
    name: "Sekali sesi",
    price: PREMIUM_PRICE_SHORT,
    unit: "per sesi",
    perks: ["Semua 6 template", "Tanpa watermark & HD", "Simpan permanen", "Nggak kena batas harian"],
    note: PAYMENTS_LIVE
      ? "Satu bayar untuk kalian berdua. Bisa dibayar sebelum foto atau setelah lihat hasil."
      : "Pembayarannya masih kami siapkan, jadi paket ini belum bisa dibeli dulu.",
    premium: true,
  },
]

const PRICE_FACTS = [
  { label: "Satu bayar untuk kalian berdua", dot: "bg-shutter" },
  { label: "Bayar pakai QRIS", dot: "bg-flash" },
  { label: "Tanpa langganan", dot: "bg-ok" },
]

// Kartu harga dengan contoh strip (pakai / tanpa watermark) supaya bedanya
// kelihatan, bukan cuma dibaca. Satu kolom di mobile, dua di desktop.
function Pricing() {
  return (
    <section id="harga" className="flex scroll-mt-6 flex-col gap-4 @3xl:gap-6">
      <SectionHeader title="Harga" desc="Gratis tiap hari. Bayar cuma kalau mau hasil tanpa watermark atau nambah sesi." />
      <div className="grid gap-3 @3xl:grid-cols-2 @3xl:gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "relative grid grid-cols-[1fr_auto] gap-4 overflow-hidden rounded-md p-5 @3xl:gap-6 @3xl:p-7",
              plan.premium ? "bg-darkroom text-kertas" : "border-[1.5px] border-line"
            )}
          >
            <div className="flex min-w-0 flex-col gap-3 @3xl:gap-4">
              <span className="flex items-center gap-2">
                <span className={cn("text-small font-semibold", plan.premium ? "text-kabin-soft" : "text-muted-foreground")}>
                  {plan.name}
                </span>
                {plan.premium && (
                  <span className="rounded-sm bg-flash px-[7px] py-[3px] text-caption leading-none font-semibold text-darkroom">
                    Premium
                  </span>
                )}
              </span>
              <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-display text-[36px] leading-none font-extrabold @3xl:text-[44px]">{plan.price}</span>
                <span className={cn("text-small", plan.premium ? "text-kabin-muted" : "text-muted-foreground")}>{plan.unit}</span>
              </span>
              <ul
                className={cn(
                  "flex flex-col gap-2 border-t pt-3 text-small @3xl:gap-2.5 @3xl:pt-4",
                  plan.premium ? "border-[#2A2636] text-[#E4E2E8]" : "border-line text-soft-foreground"
                )}
              >
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2.5">
                    {plan.premium ? (
                      <CheckIcon aria-hidden className="size-4 shrink-0 text-flash" strokeWidth={2.5} />
                    ) : (
                      <span aria-hidden className="mx-[5px] size-1.5 shrink-0 rounded-full bg-grain" />
                    )}
                    {perk}
                  </li>
                ))}
              </ul>
              <span className={cn("text-caption", plan.premium ? "text-kabin-muted" : "text-muted-foreground")}>{plan.note}</span>
            </div>
            <div className="relative flex w-[76px] items-center justify-center self-center @3xl:w-[112px]">
              <GlintStrip className={cn("w-full", plan.premium ? "rotate-3" : "-rotate-3")} glint={plan.premium}>
                <Strip
                  template={getTemplate(plan.premium ? "kodak" : "film")}
                  tokens={{ date: "14.02.27", host: "bareng.id" }}
                  watermark={!plan.premium}
                  shadow={plan.premium ? "strip-dark" : "strip"}
                  className="w-full"
                  renderHalf={(slot, side) => <FigureFill slot={slot} side={side} set={plan.premium ? 1 : 0} />}
                />
              </GlintStrip>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {PRICE_FACTS.map((fact) => (
          <span key={fact.label} className="inline-flex items-center gap-[7px] rounded-full bg-card px-3 py-2 text-caption">
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
      { label: "Pusat bantuan", href: "/bantuan" },
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
          <FooterPrints />
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
                {group.title === "Mulai" && <InstallFooterLink />}
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
