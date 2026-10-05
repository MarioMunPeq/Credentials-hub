import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * `base` determina el prefijo con el que se publican los assets en GitHub Pages.
 *
 * GitHub Pages sirve cada repositorio de proyecto en:
 *   https://<usuario>.github.io/<nombre-del-repo>/
 *
 * El nombre del repo distingue mayusculas y minusculas en la URL, asi que el
 * valor por defecto debe coincidir EXACTAMENTE con el nombre del repositorio.
 *
 * El workflow de despliegue (.github/workflows/deploy.yml) define SITE_BASE a
 * partir del nombre real del repositorio, por lo que en GitHub no hace falta
 * tocar nada aqui. El valor literal de abajo solo se usa para:
 *   - `npm run build` en local (para un `dist/` que puedas subir a mano)
 *   - `npm run preview`
 *
 * Si publicas en una pagina de usuario (repo `usuario.github.io`) o en un
 * dominio propio, deja SITE_BASE vacio en el workflow para usar "/".
 */
const base = process.env.SITE_BASE ?? '/Credentials-hub/'

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
