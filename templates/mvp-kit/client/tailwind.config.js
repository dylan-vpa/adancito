/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#0B0F19', // Dark background
                    light: '#1A1F2E',
                },
                accent: {
                    DEFAULT: '#60A5FA', // Blue accent
                    hover: '#3B82F6',
                }
            }
        },
    },
    plugins: [],
}
