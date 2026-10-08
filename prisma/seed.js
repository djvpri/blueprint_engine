// Auto-generated from seed.ts — plain JS for production (no tsx needed)
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Only seed if empty
  const count = await prisma.blueprint.count()
  if (count > 0) { console.log('Seed skipped — data already exists'); return }

  const zpos = await prisma.blueprint.create({
    data: {
      slug: 'zpos-kasir', judul: 'ZPos Kasir',
      deskripsi: 'Aplikasi kasir POS multi-tenant, Tauri + Rust',
      kategori: 'mobile', tag: '["rust","tauri","pos"]',
      status: 'aktif', versi: '0.1.134', urut: 0,
      bagian: { create: [
        { judul: 'Ringkasan', urut: 0, konten: 'Aplikasi kasir POS multi-tenant. Tauri v2 + Rust backend. Deploy per-tenant via Coolify. DB PostgreSQL per-tenant.' },
        { judul: 'Stack', urut: 1, konten: '- Frontend: HTML + Vanilla JS (index.html)\n- Backend: Rust (Tauri v2)\n- DB: PostgreSQL\n- Deploy: Coolify VPS' },
        { judul: 'Pitfall', urut: 2, konten: '⚠ Container ID berubah tiap deploy Coolify\n⚠ sync_remote pegang db.lock selama HTTP → UI freeze\n⚠ Prisma schema bukan postgres.js — pakai sql tag' },
      ] },
    },
  })

  const sync = await prisma.blueprint.create({
    data: {
      slug: 'sync-engine', judul: 'Sync Engine',
      deskripsi: 'Sinkronisasi data server↔client',
      parentId: zpos.id, kategori: 'mobile', tag: '["rust","sync"]',
      status: 'aktif', urut: 0,
      bagian: { create: [
        { judul: 'Ringkasan', urut: 0, konten: 'Modul `sync.rs` handle sinkronisasi 7 endpoint berurutan. Sebelumnya: full pull semua data tiap sync. Sekarang: incremental untuk produk.' },
      ] },
    },
  })

  await prisma.blueprint.create({
    data: {
      slug: 'incremental-sync', judul: 'Incremental Sync',
      deskripsi: 'Sinkronisasi produk incremental — hanya download yang berubah',
      parentId: sync.id, kategori: 'mobile', tag: '["rust","sync","optimization"]',
      status: 'aktif', versi: '0.1.133', urut: 0,
      bagian: { create: [
        { judul: 'Ringkasan', urut: 0, konten: 'Sebelumnya: download ALL 7505 produk tiap sync. Sekarang: hanya `updated_at > since`. Dari 7505→67 rata-rata.' },
        { judul: 'Data Model', urut: 1, konten: '```rust\nstruct RemoteProduk {\n    id: String,\n    nama: String,\n    harga: i64,\n    updated_at: Option<String>,\n}\n```' },
        { judul: 'Alur', urut: 2, konten: '- First sync: `since=null` → full pull\n- Sync berikutnya: `since=last_sync_ts` → hanya yang berubah\n- Server query: `WHERE updated_at > since`\n- Client: upsert ke DB lokal, update `sync_produk_at`\n- Retry 2× kalau fetch gagal' },
        { judul: 'API', urut: 3, konten: '```\nGET /api/produk?semua=1&since=2026-10-08T12:00:00Z\n\nResponse: [{ id, nama, harga, updated_at }]\n```\n\nBackwards compatible: tanpa `since` = full pull.' },
        { judul: 'Pitfall', urut: 4, konten: '⚠ Ganti tenant → reset `sync_produk_at`, wajib full pull\n⚠ `updated_at` harus ada DB trigger auto-update\n⚠ Jika server belum deploy `?since=`, client fallback full pull' },
      ] },
    },
  })

  await prisma.blueprint.create({
    data: {
      slug: 'log-kasir', judul: 'Log Kasir',
      deskripsi: 'Dashboard log kasir + incremental sync',
      parentId: zpos.id, kategori: 'web', tag: '["nextjs","dashboard"]',
      status: 'aktif', urut: 1,
      bagian: { create: [
        { judul: 'Ringkasan', urut: 0, konten: 'Dashboard admin untuk monitoring log kasir semua tenant. 3-state pulse, 30-day window, device cards.' },
      ] },
    },
  })

  const zxp = await prisma.blueprint.create({
    data: {
      slug: 'zx-parenting', judul: 'ZX Parenting',
      deskripsi: 'App ortu pantau anak — tugas, reward, screen time',
      kategori: 'mobile', tag: '["kotlin","compose","android"]',
      status: 'aktif', versi: '2.9.7', urut: 1,
      bagian: { create: [
        { judul: 'Ringkasan', urut: 0, konten: 'App Android (Kotlin + Jetpack Compose) untuk ortu pantau anak. Backend Next.js + Prisma. Deploy Coolify.' },
        { judul: 'Stack', urut: 1, konten: '- App ortu: Kotlin + Compose (repo ZX-Parenting-ortu)\n- App anak: Kotlin + Compose (repo zx-agent)\n- Backend: Next.js + Prisma + PostgreSQL\n- Deploy: Coolify (id9)' },
      ] },
    },
  })

  await prisma.blueprint.create({
    data: {
      slug: 'auth-anak', judul: 'Auth Anak (PIN)',
      deskripsi: 'Login anak via username + PIN, brute force protection',
      parentId: zxp.id, kategori: 'backend', tag: '["auth","security"]',
      status: 'aktif', urut: 0,
      bagian: { create: [
        { judul: 'Ringkasan', urut: 0, konten: 'Login anak: POST /api/auth/native-anak (username+PIN). Rate limit 5/min, lockout 10 gagal→15 min. PIN blacklist (sequential/repeated).' },
      ] },
    },
  })

  await prisma.blueprint.create({
    data: {
      slug: 'zgym', judul: 'ZGym',
      deskripsi: 'Manajemen gym — member, kelas, pembayaran',
      kategori: 'web', tag: '["nextjs","gym"]',
      status: 'draft', versi: '1.2.0', urut: 2,
      bagian: { create: [
        { judul: 'Ringkasan', urut: 0, konten: 'Web app manajemen gym. Next.js + Prisma. Deploy Coolify id2.' },
      ] },
    },
  })

  console.log('Seed selesai: 7 blueprint (3 root, 3 child, 1 grandchild)')
}

main().catch(console.error).finally(() => prisma.$disconnect())
