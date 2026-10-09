## Variant: Task Dashboard (Light, Split-Pane)

### Design stance
Split-pane: task list kiri, detail kanan. Mirip email client — list + preview.

### Key choices
- Layout: Sidebar + task list (390px) + detail pane (flex-1)
- Typography: Inter, readable
- Color: Light slate + indigo accent + status colors (amber=AI, blue=approve, green=done)
- Interaction: Filter tabs, checkbox toggle, approve/reject inline, soal preview dengan jawaban

### Trade-offs
- Strong at: Overview semua tugas + detail soal sekaligus
- Weak at: Setup jadwal baru tersembunyi di tombol kecil

### Best for
- Operasional harian — review tugas, approve token, cek status anak
