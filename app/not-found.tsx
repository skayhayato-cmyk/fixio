import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h2 className="text-2xl font-bold mb-2">Halaman Tidak Ditemukan</h2>
      <p className="text-neutral-500 mb-4">Halaman yang Anda cari tidak tersedia.</p>
      <Link href="/" className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm">
        Kembali ke Beranda
      </Link>
    </div>
  );
}
