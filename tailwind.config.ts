import { type Config } from 'tailwindcss';
import animatePlugin from 'tailwindcss-animate';
import { fontFamily } from 'tailwindcss/defaultTheme';

export default {
    darkMode: ['class'], // Modo oscuro activado por clase
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}', // Archivos a escanear en la carpeta app
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',

        // Or if using `src` directory:
        './src/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            animation: {
                'spin-slow': 'spin 3s linear infinite', // Animación de giro lento
                'caret-blink': 'caret-blink 1.25s ease-out infinite', // Animación de parpadeo del cursor
            },
            keyframes: {
                'caret-blink': {
                    '0%,70%,100%': { opacity: '1' }, // Opacidad del cursor en diferentes momentos
                    '20%,50%': { opacity: '0' }, // Opacidad del cursor en diferentes momentos
                },
            },
            fontFamily: {
                sans: ['var(--font-montserrat)', ...fontFamily.sans], // Fuente sans personalizada
                montserrat: ['var(--font-montserrat)', ...fontFamily.sans], // Fuente Montserrat personalizada
            },
            borderRadius: {
                lg: 'var(--radius)', // Radio de borde grande
                md: 'calc(var(--radius) - 2px)', // Radio de borde mediano
                sm: 'calc(var(--radius) - 4px)', // Radio de borde pequeño
            },
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                    muted: {
                        DEFAULT: 'hsl(var(--muted))',
                        foreground: 'hsl(var(--muted-foreground))',
                    },
                    accent: {
                        DEFAULT: 'hsl(var(--accent))',
                        foreground: 'hsl(var(--accent-foreground))',
                    },
                    destructive: {
                        DEFAULT: 'hsl(var(--destructive))',
                        foreground: 'hsl(var(--destructive-foreground))',
                    },
                },
                border: 'hsl(var(--border))', // Color de borde
                input: 'hsl(var(--input))', // Color de entrada
                ring: 'hsl(var(--ring))', // Color de anillo
                chart: {
                    1: 'hsl(var(--chart-1))', // Color de gráfico 1
                    2: 'hsl(var(--chart-2))', // Color de gráfico 2
                    3: 'hsl(var(--chart-3))', // Color de gráfico 3
                    4: 'hsl(var(--chart-4))', // Color de gráfico 4
                    5: 'hsl(var(--chart-5))', // Color de gráfico 5
                },
            },
        },
        screens: {
            xs: '475px', // Tamaño de pantalla extra pequeño
            sm: '640px', // Tamaño de pantalla pequeño
            md: '768px', // Tamaño de pantalla mediano
            lg: '1024px', // Tamaño de pantalla grande
            xl: '1280px', // Tamaño de pantalla extra grande
            '2xl': '1536px', // Tamaño de pantalla 2x extra grande
            '3xl': '1920px', // Tamaño de pantalla 3x extra grande
        },
    },
    plugins: [animatePlugin], // Plugin de animación
} satisfies Config;
