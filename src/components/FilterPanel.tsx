import { useLanguage } from '../context/language-context'
import { categoryLabel } from '../utils/categories'

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterGroupProps {
  idPrefix: string
  legend: string
  options: FilterOption[]
  selected: string[]
  onToggle: (value: string) => void
  onClear: () => void
}

/**
 * Grupo de filtros con casillas de seleccion multiple.
 *
 * Cada opcion es un `<label>` con un `<input type="checkbox">` escondido
 * visualmente, de modo que el filtrado sigue siendo utilizable con teclado y
 * lo anuncia un lector de pantalla sin depender del color del chip.
 */
function FilterGroup({ idPrefix, legend, options, selected, onToggle, onClear }: FilterGroupProps) {
  const { t } = useLanguage()

  if (options.length === 0) return null

  return (
    <fieldset className="filter-group">
      <legend className="filter-group__legend">{legend}</legend>

      <div className="filter-group__options">
        {options.map((option) => {
          const isSelected = selected.includes(option.value)
          return (
            <label
              key={option.value}
              className={`chip${isSelected ? ' chip--active' : ''}`}
              htmlFor={`${idPrefix}-${option.value}`}
            >
              <input
                id={`${idPrefix}-${option.value}`}
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(option.value)}
              />
              <span>{option.label}</span>
              {option.count !== undefined && <span className="chip__count">{option.count}</span>}
            </label>
          )
        })}
      </div>

      {selected.length > 0 && (
        <button type="button" className="filter-group__clear" onClick={onClear}>
          {t.toolbar.clearFilters}
        </button>
      )}
    </fieldset>
  )
}

interface FilterPanelProps {
  categories: { value: string; count: number }[]
  tags: string[]
  selectedCategories: string[]
  selectedTags: string[]
  onToggleCategory: (value: string) => void
  onToggleTag: (value: string) => void
  onClearCategories: () => void
  onClearTags: () => void
}

export function FilterPanel({
  categories,
  tags,
  selectedCategories,
  selectedTags,
  onToggleCategory,
  onToggleTag,
  onClearCategories,
  onClearTags,
}: FilterPanelProps) {
  const { language, t } = useLanguage()

  return (
    <div className="filters">
      <FilterGroup
        idPrefix="cat"
        legend={t.toolbar.categories}
        options={categories.map((category) => ({
          value: category.value,
          label: categoryLabel(category.value, language),
          count: category.count,
        }))}
        selected={selectedCategories}
        onToggle={onToggleCategory}
        onClear={onClearCategories}
      />

      <FilterGroup
        idPrefix="tag"
        legend={t.toolbar.tags}
        options={tags.map((tag) => ({ value: tag, label: tag }))}
        selected={selectedTags}
        onToggle={onToggleTag}
        onClear={onClearTags}
      />
    </div>
  )
}