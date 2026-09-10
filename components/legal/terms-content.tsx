import Link from "next/link"
import { LegalHeader, LegalSection, LegalText } from "@/components/legal/legal-header"
import { Button } from "@/components/ui/button"
import { BRAND, SUPPORT_EMAIL } from "@/lib/brand"
import { PREMIUM_PRICE_LABEL } from "@/lib/content/pricing"

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

export function TermsContent() {
  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-col gap-6 px-5 pt-2 pb-9 md:max-w-[560px] md:pt-8">
      <LegalHeader title="Ketentuan pakai" updated="10 September 2026" />

      <p className="max-w-[44ch] text-label leading-[1.55] text-soft-foreground">
        Dengan memakai {BRAND}, kamu setuju dengan hal-hal di bawah ini. Kami tulis sependek mungkin.
      </p>

      <ol className="flex flex-col gap-2.5">
        {RULES.map((rule, i) => (
          <li key={rule.title} className="flex gap-3 rounded-md bg-card p-3.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-darkroom font-display text-small font-semibold text-kertas">
              {i + 1}
            </span>
            <span className="flex flex-col gap-[3px]">
              <span className="text-label font-semibold">{rule.title}</span>
              <span className="text-meta leading-normal text-soft-foreground">{rule.body}</span>
            </span>
          </li>
        ))}
      </ol>

      <LegalSection title="Pembayaran">
        <LegalText>
          Sesi premium {PREMIUM_PRICE_LABEL} dibayar sekali dan berlaku untuk satu room, untuk kalian berdua.
        </LegalText>
      </LegalSection>

      <LegalSection title="Kalau gagal">
        <LegalText>
          Sudah bayar tapi sesinya gagal karena masalah dari sisi kami? Sesi kamu kami ganti, atau uangnya kami
          kembalikan penuh. Cukup kirim email dengan kode room.
        </LegalText>
      </LegalSection>

      <LegalSection title="Layanan bisa berubah">
        <LegalText>
          Kami masih kecil dan terus memperbaiki produk. Fitur bisa berubah, dan sesekali layanan bisa mati sebentar.
          Kalau ada perubahan besar, kami umumkan di halaman ini.
        </LegalText>
      </LegalSection>

      <div className="flex flex-col gap-2.5 rounded-md bg-darkroom p-4 text-kertas">
        <span className="text-label font-semibold">Butuh bantuan?</span>
        <span className="text-small text-[#E4E2E8]">
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-shutter-soft">{SUPPORT_EMAIL}</a> — sebutkan
          kode room kalian biar cepat kami cek.
        </span>
        <Button
          variant="link"
          size="inline"
          className="self-start text-shutter-soft"
          render={<Link href="/privasi" />}
          nativeButton={false}
        >
          Baca halaman privasi
        </Button>
      </div>
    </main>
  )
}
