/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ensigna: {
          primary: '#d16a8a',
          'primary-dark': '#b85578',
          'primary-light': '#e89ab0',
          soft: '#f4c7d4',
          bg: '#fff5f7',
          surface: 'rgba(255, 255, 255, 0.7)',
          text: '#2a2a2a',
          muted: '#6b7280',
          accent: 'rgba(209, 106, 138, 0.15)',
          'accent-soft': 'rgba(209, 106, 138, 0.1)',
        },
        success: '#22c55e',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
      },
      borderRadius: {
        ensigna: '16px',
        'ensigna-lg': '20px',
        'ensigna-btn': '12px',
      },
      boxShadow: {
        ensigna: '0 8px 32px rgba(209, 106, 138, 0.08)',
        'ensigna-hover': '0 12px 40px rgba(209, 106, 138, 0.14)',
        'ensigna-primary': '0 4px 14px rgba(209, 106, 138, 0.28)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
