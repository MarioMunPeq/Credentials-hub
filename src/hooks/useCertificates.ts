import { useCallback, useEffect, useState } from 'react'
import { CertificatesError, loadCertificates } from '../data/loadCertificates'
import type { CertificateStatus, ProcessedCertificate } from '../types/certificate'

interface CertificatesState {
  status: CertificateStatus
  certificates: ProcessedCertificate[]
  error: string | null
  /** `true` si el fallo se debe a haber abierto el sitio como archivo local. */
  isFileProtocolError: boolean
}

const INITIAL_STATE: CertificatesState = {
  status: 'loading',
  certificates: [],
  error: null,
  isFileProtocolError: false,
}

/**
 * Descarga `certificates.json` al montar la aplicacion.
 *
 * El JSON no depende del idioma (solo contiene datos), asi que cambiar ES/EN no
 * vuelve a pedirlo.
 *
 * La recarga se provoca desde el manejador del boton "Reintentar" (un evento,
 * no un efecto) incrementando un contador del que depende este efecto. Poner
 * un setState en el cuerpo del efecto provocaria renders en cascada.
 */
export function useCertificates() {
  const [state, setState] = useState<CertificatesState>(INITIAL_STATE)
  const [requestId, setRequestId] = useState(0)

  useEffect(() => {
    let active = true

    loadCertificates()
      .then((certificates) => {
        if (!active) return
        setState({ status: 'ready', certificates, error: null, isFileProtocolError: false })
      })
      .catch((error: unknown) => {
        if (!active) return
        setState({
          status: 'error',
          certificates: [],
          error: error instanceof Error ? error.message : String(error),
          isFileProtocolError: error instanceof CertificatesError && error.isFileProtocol,
        })
      })

    // Al desmontar (o al reejecutarse el efecto) se invalida la respuesta en
    // vuelo para no actualizar estado de un componente que ya no existe.
    return () => {
      active = false
    }
  }, [requestId])

  const retry = useCallback(() => {
    setState((current) => ({ ...current, status: 'loading', error: null }))
    setRequestId((current) => current + 1)
  }, [])

  return { ...state, retry }
}