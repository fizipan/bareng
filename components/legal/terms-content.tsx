import { CheckIcon, ShieldCheckIcon } from "lucide-react"
import { BoothTicket } from "@/components/art/legal-art"
import { BRAND } from "@/lib/brand"
import { FREE_SESSIONS_PER_DAY, PREMIUM_PRICE_LABEL } from "@/lib/content/pricing"
import { ContactCard } from "./contact-card"
import { LegalLayout, LegalSection, LegalText } from "./legal-layout"

const RULES = [
  {
    title: "Foto kalian milik kalian",
    body: "Kami nggak memakai foto kalian untuk promosi, kecuali kamu izinkan lewat email.",
  },
  {
    title: "Pakai baik-baik",
    body: "Jangan dipakai untuk konten seksual, kekerasan, atau memotret orang tanpa izin. Room yang dilaporkan bisa kami tutup.",
  },
  {
    title: "Siapa pegang link, dia bisa lihat",
    body: "Karena nggak pakai akun, link room dan link hasil adalah kuncinya. Bagikan cuma ke orang yang kamu percaya.",
  },
]

const PRICE_FACTS = ["Sekali bayar", "Satu room", "Untuk kalian berdua", "Tanpa langganan"]

const TOC = [
  { id: "aturan", label: "Aturan dasar" },
  { id: "pembayaran", label: "Pembayaran" },
  { id: "gagal", label: "Kalau gagal" },
  { id: "berubah", label: "Layanan bisa berubah" },
  { id: "kontak", label: "Kontak" },
]

export function TermsContent() {
  return (
    <LegalLayout
      page="ketentuan"
      title="Ketentuan pakai"
      lede={`Dengan memakai ${BRAND}, kamu setuju dengan hal-hal di bawah ini. Kami tulis sependek mungkin.`}
      updated="11 September 2026"
      art={<BoothTicket />}
      toc={TOC}
    >
      <LegalSection id="aturan" title="Aturan dasar">
        <ol className="flex flex-col divide-y-[1.5px] divide-line rounded-md border-[1.5px] border-line">
          {RULES.map((rule, i) => (
            <li key={rule.title} className="flex gap-4 p-4 @xl/content:gap-5 @xl/content:p-5">
              <span className="w-8 shrink-0 font-display text-display-sm leading-none font-extrabold text-shutter">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-label font-semibold">{rule.title}</span>
                <span className="text-small leading-normal text-soft-foreground">{rule.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </LegalSection>

      <LegalSection id="pembayaran" title="Pembayaran">
        <div className="flex flex-col gap-4 rounded-md bg-darkroom p-5 text-kertas @xl/content:flex-row @xl/content:items-center @xl/content:justify-between @xl/content:gap-6 @xl/content:p-6">
          <span className="flex flex-col gap-1.5">
            <span className="text-small text-kabin-soft">Sesi premium</span>
            <span className="font-display text-[36px] leading-none font-extrabold">{PREMIUM_PRICE_LABEL}</span>
          </span>
          <ul className="flex flex-wrap gap-2 @xl/content:grid @xl/content:grid-cols-2">
            {PRICE_FACTS.map((fact) => (
              <li key={fact} className="inline-flex items-center gap-1.5 rounded-full bg-darkroom-2 px-3 py-1.5 text-caption text-kabin-soft">
                <CheckIcon aria-hidden className="size-3.5 text-flash" strokeWidth={2.5} />
                {fact}
              </li>
            ))}
          </ul>
        </div>
        <LegalText>
          Sesi premium {PREMIUM_PRICE_LABEL} dibayar sekali lewat QRIS dan berlaku untuk satu room, untuk kalian berdua.
          Gratis dibatasi {FREE_SESSIONS_PER_DAY} sesi per hari per perangkat; kalau kuotanya habis, kamu tetap bisa lanjut
          dengan membayar sesi premium, atau menunggu kuota balik besoknya.
        </LegalText>
      </LegalSection>

      <LegalSection id="gagal" title="Kalau gagal">
        <div className="flex gap-3.5 rounded-md bg-card p-4 @xl/content:p-5">
          <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-ok/15 text-ok">
            <ShieldCheckIcon className="size-5" />
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-label font-semibold">Sesi diganti, atau uang kembali penuh</span>
            <span className="text-small leading-normal text-soft-foreground">
              Kalau sudah bayar tapi sesinya gagal karena masalah dari sisi kami. Cukup kirim email dengan kode room.
            </span>
          </span>
        </div>
      </LegalSection>

      <LegalSection id="berubah" title="Layanan bisa berubah">
        <LegalText>
          Kami masih kecil dan terus memperbaiki produk. Fitur bisa berubah, dan sesekali layanan bisa mati sebentar.
          Kalau ada perubahan besar, kami umumkan di halaman ini.
        </LegalText>
      </LegalSection>

      <section id="kontak" className="scroll-mt-8">
        <ContactCard title="Butuh bantuan?" hint="Sebutkan kode room kalian biar cepat kami cek." />
      </section>
    </LegalLayout>
  )
}
