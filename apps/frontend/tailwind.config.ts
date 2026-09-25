import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#030712',
        secondary: '#f8f9fa',
        tertiary: '#f0f1f3',
        border: '#e5e5e5',
        'text-primary': '#030712',
        'text-secondary': '#525252',
        'text-tertiary': '#737373',
      },
    },
  },
  plugins: [],
}
export default config
