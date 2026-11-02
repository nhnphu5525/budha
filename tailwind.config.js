/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        temple: {
          gold: '#FFD700',
          amber: '#F59E0B',
          red: '#8B0000',
          crimson: '#991B1B',
          wood: '#5C3A21',
          darkwood: '#2E180A',
          buddha: '#D4AF37',
          lotus: '#FF69B4',
          incense: '#E5E7EB',
          robe: '#4A5568', // áo lam
          brownRobe: '#78350F', // áo tràng nâu
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
