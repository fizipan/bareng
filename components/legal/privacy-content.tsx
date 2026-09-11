import { CheckIcon, InfinityIcon, KeyRoundIcon, Trash2Icon, UserRoundXIcon, VideoOffIcon, XIcon } from "lucide-react"
import { SealedStrip } from "@/components/art/legal-art"
import { cn } from "@/lib/utils"
import { ContactCard } from "./contact-card"
import { LegalLayout, LegalSection, LegalText } from "./legal-layout"

const PROMISES = [
  {
    icon: VideoOffIcon,
    title: "Video nggak lewat kami",
    body: "Video tersambung antar HP kalian, jadi nggak bisa kami tonton atau simpan.",
  },
  {
    icon: KeyRoundIcon,
    title: "Link adalah kuncinya",
    body: "Photostrip kalian cuma bisa dibuka lewat link kalian sendiri.",
  },
  {
    icon: UserRoundXIcon,
    title: "Tanpa akun, tanpa iklan",
    body: "Nggak ada galeri publik, nggak ada profil yang bisa dicari.",
  },
]

const KEPT = [
  "Photostrip jadi, beserta foto per frame dari sesi kalian",
  "Nama panggilan yang kalian ketik",
  "Catatan teknis: kapan room dibuat dan berapa lama tersambung",
  "Isi masukan yang kamu kirim lewat Pusat bantuan, beserta jenis browser & HP-mu (dan email kalau kamu isi)",
]
const NOT_KEPT = ["Rekaman video atau suara", "Isi obrolan kalian", "Nomor HP dan email"]

const DELETE_STEPS = ["Buka halaman hasil", "Ketuk “Hapus foto”", "Hilang untuk kalian berdua"]

const TOC = [
  { id: "singkatnya", label: "Singkatnya" },
  { id: "data", label: "Yang kami simpan" },
  { id: "lama", label: "Berapa lama disimpan" },
  { id: "hapus", label: "Menghapus foto" },
  { id: "anak", label: "Anak-anak" },
  { id: "kontak", label: "Kontak" },
]

export function PrivacyContent() {
  return (
    <LegalLayout
      page="privasi"
      title="Privasi"
      lede="Yang terjadi di booth, tetap di booth. Ini yang kami simpan, dan yang nggak."
      updated="11 September 2026"
      art={<SealedStrip />}
      toc={TOC}
    >
      <LegalSection id="singkatnya" title="Singkatnya">
        <ul className="grid gap-5 rounded-md bg-darkroom p-5 text-kertas @xl/content:grid-cols-3 @xl/content:gap-6 @xl/content:p-6">
          {PROMISES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3.5 @xl/content:flex-col @xl/content:gap-3">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-darkroom-2 text-flash">
                <Icon className="size-[18px]" />
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-label font-semibold">{title}</span>
                <span className="text-small text-kabin-soft">{body}</span>
              </span>
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection id="data" title="Yang kami simpan, dan yang nggak">
        <div className="grid gap-3 @xl/content:grid-cols-2">
          <DataList title="Disimpan" items={KEPT} kept />
          <DataList title="Nggak disimpan" items={NOT_KEPT} />
        </div>
        <LegalText>
          Catatan teknis kami pakai buat memperbaiki produk, bukan buat mengenali kamu. Kamera cuma nyala selama sesi,
          dan mati begitu sesi ditutup.
        </LegalText>
      </LegalSection>

      <LegalSection id="lama" title="Berapa lama disimpan">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 rounded-md border-[1.5px] border-line p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-small text-muted-foreground">Sesi gratis</span>
              <span className="text-right text-label font-semibold">7 hari, lalu terhapus</span>
            </div>
            <div className="flex items-center gap-1" aria-hidden>
              {Array.from({ length: 7 }, (_, i) => (
                <span key={i} className="h-1.5 flex-1 rounded-full bg-ink-muted" style={{ opacity: 0.85 - i * 0.1 }} />
              ))}
              <Trash2Icon className="ml-1 size-4 text-muted-foreground" />
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-md bg-darkroom p-4 text-kertas">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-small text-kabin-soft">Sesi premium</span>
              <span className="text-right text-label font-semibold">Sampai kamu hapus</span>
            </div>
            <div className="flex items-center gap-1" aria-hidden>
              <span className="h-1.5 flex-1 rounded-full bg-flash" />
              <InfinityIcon className="ml-1 size-4 text-flash" />
            </div>
          </div>
        </div>
        <LegalText>Foto per frame ikut terhapus bersama photostrip-nya.</LegalText>
      </LegalSection>

      <LegalSection id="hapus" title="Menghapus foto kalian">
        <ol className="grid gap-2 @xl/content:grid-cols-3">
          {DELETE_STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-3 rounded-md bg-card px-3.5 py-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-background font-display text-small font-bold">
                {i + 1}
              </span>
              <span className="text-small font-medium">{step}</span>
            </li>
          ))}
        </ol>
        <LegalText>
          Link-nya langsung mati untuk kalian berdua. Kalau link-nya sudah terlanjur kamu bagikan, hapus juga pesannya
          ya.
        </LegalText>
      </LegalSection>

      <LegalSection id="anak" title="Anak-anak">
        <LegalText>Produk ini untuk usia 13 tahun ke atas. Di bawah itu, mintalah orang tua yang mendampingi.</LegalText>
      </LegalSection>

      <section id="kontak" className="scroll-mt-8">
        <ContactCard title="Ada yang mau ditanya soal privasi?" />
      </section>
    </LegalLayout>
  )
}

function DataList({ title, items, kept = false }: { title: string; items: string[]; kept?: boolean }) {
  const Icon = kept ? CheckIcon : XIcon
  return (
    <div className="flex flex-col gap-3 rounded-md border-[1.5px] border-line p-4">
      <span className="text-small font-semibold text-muted-foreground">{title}</span>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-small">
            <span
              aria-hidden
              className={cn(
                "mt-px grid size-5 shrink-0 place-items-center rounded-full",
                kept ? "bg-ok/15 text-ok" : "bg-card text-muted-foreground"
              )}
            >
              <Icon className="size-3" strokeWidth={3} />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
