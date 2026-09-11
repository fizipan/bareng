"use client"

// Unduh blob sebagai file (Android & desktop).
export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

// iPhone: lembar bagikan (Simpan Gambar ke Foto). Lainnya: unduh file.
// AbortError = pengguna menutup lembar bagikan; diteruskan ke pemanggil.
export async function saveImage(blob: Blob, name: string, opts: { ios: boolean; title: string }) {
  const file = new File([blob], name, { type: blob.type || "image/jpeg" })
  if (opts.ios && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: opts.title })
    return
  }
  saveBlob(blob, name)
}
