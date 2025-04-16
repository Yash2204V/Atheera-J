/** @type {import('tailwindcss').Config} */
export default {
    content: ["./views/**/*.{html,ejs,js}"],
    theme: {
      screens: {
        sm: '576px',
        md: '768px',
        lg: '992px',
        xl: '1200px',
      },
      container: {
        center: true,
        padding: '1rem',
      },
      extend: {
        colors: {
          // primary: '#FD3D57'
          // primary: '#444c34',
          primary: '#d84126',
          secondary: '#e25137',
          ternary: '#34455d'
        },
        fontFamily:{
          poppins:  "'Poppins', sans-serif",
          roboto:  "'Roboto', sans-serif",
        }
      },
    },
    variants: {
      extend: {
        visibility: ['group-hover'],
        display: ['group-hover']
      },
    },
    plugins: [import ('@tailwindcss/forms')],
  }
  