import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { LanguageProvider } from './context/LanguageProvider'
import { ThemeProvider } from './context/ThemeProvider'

// Las fuentes se sirven desde el propio dominio (no desde un CDN): el sitio
// funciona sin conexion a terceros y no filtra las visitas del lector.
// `unicode-range` hace que el navegador descargue solo el subconjunto latin.
import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/jetbrains-mono/wght.css'
import './styles/global.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('No se encontro el elemento #root en index.html')
}

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
)