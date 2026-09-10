import { toast } from "sonner"

// Semua toast pakai ikon titik hijau, persis prototipe (`notify`).
export const notify = (message: string) => toast.success(message)
export const warn = (message: string) => toast.error(message)
