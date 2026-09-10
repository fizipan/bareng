// Path & URL publik file di bucket `results` (dipakai server & klien).
export const publicResultUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/results/${path}`

// Kartu pratinjau link (1200×630) disimpan di sebelah file photostrip.
export const cardPathOf = (path: string) => path.replace(/\.jpg$/, "-og.jpg")
