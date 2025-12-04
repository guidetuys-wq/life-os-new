export default function manifest() {
  return {
    name: 'Life OS - Personal Control System',
    short_name: 'Life OS',
    description: 'Manage your projects, finance, and second brain in one place.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    orientation: 'portrait',
    categories: ['productivity', 'finance', 'utilities'],
    icons: [
      {
        src: 'https://ui-avatars.com/api/?name=Life+OS&background=3b82f6&color=fff&size=192&rounded=true&bold=true',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: 'https://ui-avatars.com/api/?name=Life+OS&background=3b82f6&color=fff&size=512&rounded=true&bold=true',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
    ],
    // [NEW] Shortcuts untuk akses cepat dari icon (Android/PC)
    shortcuts: [
      {
        name: "New Task",
        short_name: "Task",
        description: "Add a new task quickly",
        url: "/dashboard?action=new-task",
        icons: [{ src: "https://ui-avatars.com/api/?name=T&background=10b981&color=fff&size=96", sizes: "96x96" }]
      },
      {
        name: "Finance",
        short_name: "Money",
        description: "Check your balance",
        url: "/finance",
        icons: [{ src: "https://ui-avatars.com/api/?name=F&background=f43f5e&color=fff&size=96", sizes: "96x96" }]
      }
    ],
    // [NEW] Screenshots untuk Install Prompt yang lebih kaya
    screenshots: [
      {
        src: "/window.svg", // Pastikan Anda punya screenshot asli aplikasi di folder public
        sizes: "1280x720",
        type: "image/svg+xml",
        form_factor: "wide",
        label: "Desktop Dashboard"
      },
      {
        src: "/window.svg", // Ganti dengan screenshot mobile jika ada
        sizes: "1280x720",
        type: "image/svg+xml",
        form_factor: "narrow",
        label: "Mobile View"
      }
    ]
  }
}