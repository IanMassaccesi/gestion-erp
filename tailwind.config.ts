import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#020617',    // Fondo Principal (Slate 950)
          card: '#0f172a',    // Tarjetas (Slate 900) - Más suave que el fondo
          border: '#1e293b',  // Bordes (Slate 800)
          input: '#1e293b',   // Inputs de formulario
          
          primary: '#22d3ee', // Cyan Neon (Acción Principal)
          accent: '#d946ef',  // Fuchsia Neon (Destacados)
          success: '#22c55e', // Verde Matrix
          warning: '#fb923c', // Naranja Alerta
          
          text: '#f8fafc',    // Blanco Hielo (Texto Principal)
          muted: '#94a3b8',   // Gris Azulado (Texto Secundario)
          
          // Compatibilidad con código viejo (mapeamos a los nuevos)
          teal: '#22d3ee',    
          light: '#f8fafc',
        }
      },
      fontFamily: {
        heading: ['var(--font-outfit)', 'sans-serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        'neon': '0 0 10px rgba(34, 211, 238, 0.2)',
        'neon-hover': '0 0 20px rgba(34, 211, 238, 0.4)',
      }
    },
  },
  plugins: [],
};
export default config;