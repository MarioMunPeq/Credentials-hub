import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Header } from './components/Header'
import { Intro } from './components/Intro'
import { SummaryStats } from './components/SummaryStats'
import { SearchBar } from './components/SearchBar'
import { FilterPanel } from './components/FilterPanel'
import { ViewControls } from './components/ViewControls'
import { CertificateCard } from './components/CertificateCard'
import { Timeline } from './components/Timeline'
import { PdfModal } from './components/PdfModal'
import { Footer } from './components/Footer'
import { ErrorState, EmptyState, LoadingState } from './components/states'
import { useCertificates } from './hooks/useCertificates'
import { useLanguage } from './context/language-context'
import { site } from './config/site'
import {
  collectTags,
  countByCategory,
  EMPTY_FILTERS,
  filterCertificates,
  hasActiveFilters,
  sortCertificates,
  type Filters,
} from './utils/certificates'
import type { ProcessedCertificate, SortOrder, ViewMode } from './types/certificate'

export function App() {
  const { language, t } = useLanguage()
  const { status, certificates, error, isFileProtocolError, retry } = useCertificates()

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [view, setView] = useState<ViewMode>('cards')
  const [sort, setSort] = useState<SortOrder>('desc')
  const [preview, setPreview] = useState<ProcessedCertificate | null>(null)

  // Elemento que abrio el modal, para devolverle el foco al cerrarlo.
  const previewTriggerRef = useRef<HTMLElement | null>(null)

  const closePreview = useCallback(() => {
    setPreview(null)
    previewTriggerRef.current?.focus()
  }, [])

  const openPreview = useCallback((certificate: ProcessedCertificate) => {
    previewTriggerRef.current = document.activeElement as HTMLElement | null
    setPreview(certificate)
  }, [])

  // El titulo del navegador sigue al idioma activo.
  useEffect(() => {
    document.title = `${site.name} · ${t.meta.title}`
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', t.meta.description)
  }, [t])

  const categories = useMemo(() => countByCategory(certificates), [certificates])
  const tags = useMemo(() => collectTags(certificates), [certificates])

  const visible = useMemo(
    () => sortCertificates(filterCertificates(certificates, filters, language), sort, language),
    [certificates, filters, language, sort],
  )

  const toggleIn = (list: string[], value: string) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value]

  const setQuery = (query: string) => setFilters((current) => ({ ...current, query }))
  const toggleCategory = (value: string) =>
    setFilters((current) => ({ ...current, categories: toggleIn(current.categories, value) }))
  const toggleTag = (value: string) =>
    setFilters((current) => ({ ...current, tags: toggleIn(current.tags, value) }))
  const clearFilters = () => setFilters(EMPTY_FILTERS)

  const resultLabel = t.toolbar.resultCount(visible.length, certificates.length)
  const filtersActive = hasActiveFilters(filters)

  return (
    <div className="app">
      <a className="skip-link" href="#certificados">
        {t.header.skipToContent}
      </a>

      <Header />
      <Intro />

      <main id="certificados" className="app__main container">
        <SummaryStats certificates={certificates} />

        {/*
          La barra de herramientas solo aparece si hay algo que filtrar: un
          buscador y un selector de vista sobre una lista vacia son ruido.
        */}
        {status === 'ready' && certificates.length > 0 && (
          <section className="toolbar" aria-label={t.toolbar.filters}>
            <div className="toolbar__top">
              <SearchBar value={filters.query} onChange={setQuery} resultLabel={resultLabel} />
              <ViewControls view={view} onViewChange={setView} sort={sort} onSortChange={setSort} />
            </div>

            <FilterPanel
              categories={categories.map(([value, count]) => ({ value, count }))}
              tags={tags}
              selectedCategories={filters.categories}
              selectedTags={filters.tags}
              onToggleCategory={toggleCategory}
              onToggleTag={toggleTag}
              onClearCategories={() => setFilters((current) => ({ ...current, categories: [] }))}
              onClearTags={() => setFilters((current) => ({ ...current, tags: [] }))}
            />

            <div className="toolbar__status">
              <span className="toolbar__count">{resultLabel}</span>
              {filtersActive && (
                <button type="button" className="button button--ghost" onClick={clearFilters}>
                  {t.toolbar.clearFilters}
                </button>
              )}
            </div>
          </section>
        )}

        {status === 'loading' && <LoadingState />}

        {status === 'error' && (
          <ErrorState
            message={error}
            isFileProtocolError={isFileProtocolError}
            onRetry={retry}
          />
        )}

        {status === 'ready' &&
          (certificates.length === 0 ? (
            <EmptyState isFiltered={false} onClear={clearFilters} />
          ) : visible.length === 0 ? (
            <EmptyState isFiltered onClear={clearFilters} />
          ) : view === 'cards' ? (
            <div className="grid">
              {visible.map((certificate) => (
                <CertificateCard
                  key={certificate.id}
                  certificate={certificate}
                  onPreview={openPreview}
                />
              ))}
            </div>
          ) : (
            <Timeline certificates={visible} onPreview={openPreview} />
          ))}
      </main>

      <Footer />

      <PdfModal certificate={preview} onClose={closePreview} />
    </div>
  )
}