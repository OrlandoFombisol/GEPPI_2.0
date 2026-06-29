/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ─── Azul cobalto corporativo GEPPI ────────────────────────────────
        primary: {
          50:  '#eef5ff',
          100: '#d5e8ff',
          200: '#a9d0ff',
          300: '#72aaff',
          400: '#3d82f4',
          500: '#1b62cc',   // Azul cobalto principal (del logo)
          600: '#1452b0',
          700: '#0e4294',
          800: '#083278',   // Oscuro para texto, botones, sidebar
          900: '#05235c',
          950: '#031745',
        },
        // ─── Verde seguridad corporativo ────────────────────────────────────
        brand: {
          green:  '#39B54A',
          greenL: '#4CC95D',   // hover
          greenD: '#2A8C38',   // dark
          orange:  '#F7941D',
          orangeL: '#FFAB40',  // hover
          orangeD: '#D97706',  // dark
        },
      },
      // ─── Semáforo del sistema GEPPI ─────────────────────────────────────
      // vigente        → green-500  (#22c55e)
      // proximoVencer  → yellow-500 (#eab308)
      // vencido        → red-500    (#ef4444)
      // pendiente      → slate-400  (#94a3b8)
      // bajoStock      → orange-500 (brand-orange)
      // agotado        → red-800
    },
  },
  plugins: [],
}
