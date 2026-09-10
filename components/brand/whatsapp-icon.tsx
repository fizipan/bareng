import type { SVGProps } from "react"

// Gelembung chat + gagang telepon, putih polos (permintaan desain: "logo WA
// putih kaya telephone"). Ikon generik, bukan aset merek resmi.
export function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2.2a9.8 9.8 0 0 0-8.45 14.76L2.2 21.8l4.97-1.3A9.8 9.8 0 1 0 12 2.2Zm0 1.8a8 8 0 1 1-4.1 14.87l-.3-.18-2.95.77.79-2.87-.2-.31A8 8 0 0 1 12 4Z" />
      <path d="M8.9 7.1c-.2-.44-.4-.45-.6-.46h-.5c-.17 0-.46.06-.7.33-.24.26-.92.9-.92 2.2s.94 2.55 1.07 2.73c.13.17 1.82 2.9 4.5 3.95 2.22.88 2.68.7 3.16.66.48-.05 1.56-.64 1.78-1.26.22-.62.22-1.15.15-1.26-.06-.11-.24-.17-.5-.3-.26-.14-1.56-.78-1.8-.87-.24-.09-.42-.13-.6.13-.17.27-.68.87-.84 1.05-.15.17-.3.2-.57.06-.26-.13-1.1-.4-2.1-1.3-.78-.69-1.3-1.54-1.46-1.8-.15-.27-.02-.41.12-.54.12-.12.26-.31.4-.47.13-.16.17-.27.26-.44.09-.18.04-.34-.02-.47-.07-.13-.58-1.44-.82-1.94Z" />
    </svg>
  )
}
