import React, { useMemo, useState } from 'react';

function GlobalSectionSearch({ sections }) {
  const [query, setQuery] = useState('');
  const [openResults, setOpenResults] = useState(false);

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return [];

    return sections.filter((section) => {
      const inTitle = section.title.toLowerCase().includes(q);
      const inKeywords = section.keywords.some((keyword) =>
        keyword.toLowerCase().includes(q)
      );
      return inTitle || inKeywords;
    });
  }, [query, sections]);

  const handleNavigate = (sectionId) => {
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setQuery('');
    setOpenResults(false);
  };

  return (
    <div className="global-search-wrapper">
      <div className="global-search-box">
        <span className="global-search-icon">⌕</span>
        <input
          type="text"
          className="global-search-input"
          placeholder="Buscar sección, actividad, perfil, notificaciones..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpenResults(true);
          }}
          onFocus={() => setOpenResults(true)}
        />
      </div>

      {openResults && query.trim() !== '' && (
        <div className="global-search-results">
          {filteredSections.length === 0 ? (
            <div className="global-search-empty">
              <p>No se encontraron secciones.</p>
            </div>
          ) : (
            filteredSections.map((section) => (
              <button
                key={section.id}
                type="button"
                className="global-search-result-item"
                onClick={() => handleNavigate(section.id)}
              >
                <strong>{section.title}</strong>
                <span>{section.description}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSectionSearch;