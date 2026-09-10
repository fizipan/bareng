import Link from "next/link"
import { LegalHeader, LegalSection, LegalText } from "@/components/legal/legal-header"
import { Button } from "@/components/ui/button"
import { SUPPORT_EMAIL } from "@/lib/brand"

const SUMMARY = [
  "Video kalian nggak lewat kami, jadi nggak bisa kami tonton atau simpan.",
  "Yang tersimpan cuma photostrip jadinya, dan hanya bisa dibuka lewat link kalian.",
  "Nggak ada akun, nggak ada galeri publik, nggak ada iklan.",
]

export function PrivacyContent() {
  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-col gap-6 px-5 pt-2 pb-9 md:max-w-[560px] md:pt-8">
      <LegalHeader title="Privasi" updated="10 September 2026" />

      <div className="flex flex-col gap-2.5 rounded-md bg-darkroom p-4 text-kertas">
        <span className="font-display text-lg font-semibold">Singkatnya</span>
        <ul className="flex flex-col gap-2 text-small text-[#E4E2E8]">
          {SUMMARY.map((line) => (
            <li key={line} className="flex gap-[9px]">
              <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-flash" />
              {line}
            </li>
          ))}
        </ul>
      </div>

      <LegalSection title="Yang kami simpan">
        <LegalText>
          Foto hasil sesi kalian, nama panggilan yang kalian ketik, dan catatan sederhana seperti kapan room dibuat
          dan berapa lama kalian tersambung. Itu kami pakai buat memperbaiki produk, bukan buat mengenali kamu.
        </LegalText>
      </LegalSection>

      <LegalSection title="Yang nggak kami simpan">
        <LegalText>
          Rekaman video atau suara, isi obrolan, nomor HP, dan email. Kamera cuma nyala di layar kalian berdua, dan
          mati begitu sesi ditutup.
        </LegalText>
      </LegalSection>

      <LegalSection title="Berapa lama disimpan">
        <div className="flex flex-col gap-2 text-small">
          <div className="flex items-center justify-between gap-3 rounded-md border-[1.5px] border-line px-3.5 py-[13px]">
            <span>Sesi gratis</span>
            <span className="font-semibold">7 hari, lalu terhapus</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md bg-card px-3.5 py-[13px]">
            <span>Sesi premium</span>
            <span className="font-semibold">Disimpan sampai kamu hapus</span>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="Menghapus foto kalian">
        <LegalText>
          Di halaman hasil ada tombol hapus. Sekali ditekan, foto hilang untuk kalian berdua dan link-nya mati. Kalau
          linknya sudah terlanjur kamu bagikan, hapus juga pesannya ya.
        </LegalText>
      </LegalSection>

      <LegalSection title="Anak-anak">
        <LegalText>Produk ini untuk usia 13 tahun ke atas. Di bawah itu, mintalah orang tua yang mendampingi.</LegalText>
      </LegalSection>

      <div className="flex flex-col gap-2.5 rounded-md bg-card p-4">
        <span className="text-label font-semibold">Ada yang mau ditanya?</span>
        <span className="text-small text-soft-foreground">
          Kirim email ke <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-link">{SUPPORT_EMAIL}</a>.
          Kami balas dalam 2 hari kerja.
        </span>
        <Button variant="link" size="inline" className="self-start" render={<Link href="/ketentuan" />} nativeButton={false}>
          Baca ketentuan pakai
        </Button>
      </div>
    </main>
  )
}
