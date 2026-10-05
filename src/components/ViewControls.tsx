import { useLanguage } from '../context/language-context'
import type { SortOrder, ViewMode } from '../types/certificate'
import { GridIcon, ListIcon } from './icons'

interface ViewControlsProps {
  view: ViewMode
  onViewChange: (view: ViewMode) => void
  sort: SortOrder
  onSortChange: (sort: SortOrder) => void
}

/** Selector de vista (tarjetas / linea de tiempo) y de orden cronologico. */
export function ViewControls({ view, onViewChange, sort, onSortChange }: ViewControlsProps) {
  const { t } = useLanguage()

  return (
    <div className="view-controls">
      <div className="view-controls__group" role="group" aria-label={t.toolbar.view}>
        <button
          type="button"
          className={`segmented__button${view === 'cards' ? ' segmented__button--active' : ''}`}
          aria-pressed={view === 'cards'}
          onClick={() => onViewChange('cards')}
        >
          <GridIcon />
          <span>{t.toolbar.viewCards}</span>
        </button>
        <button
          type="button"
          className={`segmented__button${view === 'timeline' ? ' segmented__button--active' : ''}`}
          aria-pressed={view === 'timeline'}
          onClick={() => onViewChange('timeline')}
        >
          <ListIcon />
          <span>{t.toolbar.viewTimeline}</span>
        </button>
      </div>

      <div className="view-controls__sort">
        <label className="view-controls__sort-label" htmlFor="sort-order">
          {t.toolbar.sort}
        </label>
        <select
          id="sort-order"
          className="select"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortOrder)}
        >
          <option value="desc">{t.toolbar.sortDesc}</option>
          <option value="asc">{t.toolbar.sortAsc}</option>
        </select>
      </div>
    </div>
  )
}