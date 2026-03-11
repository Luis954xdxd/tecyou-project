import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './App.css';
import RecognitionForm from './components/RecognitionForm';
import logoTSJ from './assets/logo-tsj.png';

function App() {
  const [user, setUser] = useState(null);
  const [emailInput, setEmailInput] = useState('');
  const [recognitions, setRecognitions] = useState([]);
  const [error, setError] = useState('');
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchFeed = async () => {
    try {
      setLoadingFeed(true);
      const response = await axios.get('http://localhost:5000/api/recognitions/feed');
      setRecognitions(response.data);
    } catch (error) {
      console.error('Error al obtener el feed:', error);
    } finally {
      setLoadingFeed(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/users/login', {
        email: emailInput,
      });
      setUser(response.data);
    } catch (err) {
      console.error('Detalle del error:', err);
      setError(
        err.response?.data?.error ||
          'No se pudo conectar con el servidor. ¿Está encendido el Backend?'
      );
    }
  };

  useEffect(() => {
    if (user) {
      fetchFeed();
    }
  }, [user]);

  const getInitials = (name) => {
    if (!name) return 'TSJ';
    return name
      .split(' ')
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getCategoryMeta = (category) => {
    const categories = {
      Colaboración: {
        icon: '🤝',
        className: 'category-colaboracion',
      },
      Académico: {
        icon: '📚',
        className: 'category-academico',
      },
      Liderazgo: {
        icon: '⭐',
        className: 'category-liderazgo',
      },
      Creatividad: {
        icon: '💡',
        className: 'category-creatividad',
      },
    };

    return (
      categories[category] || {
        icon: '✨',
        className: 'category-default',
      }
    );
  };

  const categoryCounts = useMemo(() => {
    const counts = {
      Colaboración: 0,
      Académico: 0,
      Liderazgo: 0,
      Creatividad: 0,
    };

    recognitions.forEach((rec) => {
      if (counts[rec.category] !== undefined) {
        counts[rec.category] += 1;
      }
    });

    return counts;
  }, [recognitions]);

  const featuredCategory = useMemo(() => {
    const entries = Object.entries(categoryCounts);
    if (!entries.length) return 'Sin datos';

    const top = entries.reduce((max, current) =>
      current[1] > max[1] ? current : max
    );

    return top[1] === 0 ? 'Sin datos' : top[0];
  }, [categoryCounts]);

  const featuredRecognitions = useMemo(() => {
    return [...recognitions].slice(0, 3);
  }, [recognitions]);

  const filteredRecognitions = useMemo(() => {
    return recognitions.filter((rec) => {
      const matchesCategory =
        selectedCategory === 'Todas' || rec.category === selectedCategory;

      const query = searchTerm.trim().toLowerCase();

      const matchesSearch =
        query === '' ||
        rec.sender_name?.toLowerCase().includes(query) ||
        rec.receiver_name?.toLowerCase().includes(query) ||
        rec.message?.toLowerCase().includes(query) ||
        rec.category?.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [recognitions, selectedCategory, searchTerm]);

  const categoryOptions = [
    'Todas',
    'Colaboración',
    'Académico',
    'Liderazgo',
    'Creatividad',
  ];

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-shell">
          <div className="login-brand-panel">
            <div className="brand-top">
              <div className="brand-badge">TSJ</div>
              <span className="brand-label">Plataforma de reconocimiento</span>
            </div>

            <h1>
              ¡Tec! <span>¡you!</span>
            </h1>

            <p className="brand-description">
              Reconoce el esfuerzo, la dedicación y el impacto positivo de tu comunidad
              académica en un espacio moderno, institucional y humano.
            </p>

            <div className="brand-highlights">
              <div className="highlight-card">
                <strong>Reconoce</strong>
                <span>Comparte mensajes positivos con tu comunidad.</span>
              </div>
              <div className="highlight-card">
                <strong>Conecta</strong>
                <span>Fortalece el sentido de pertenencia del TSJ.</span>
              </div>
              <div className="highlight-card">
                <strong>Inspira</strong>
                <span>Haz visible el impacto de las buenas acciones.</span>
              </div>
            </div>
          </div>

          <div className="login-card">
            <div className="login-header">
              <img src={logoTSJ} alt="Logo TSJ" className="tsj-logo login-logo" />
              <h2>Bienvenido</h2>
              <p>Inicia sesión con tu correo institucional del TSJ.</p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label>Correo institucional</label>
                <input
                  type="email"
                  placeholder="zaXXXXXXXXX@zapopan.tecmm.edu.mx"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                />
              </div>

              {error && <p className="error-msg">{error}</p>}

              <button type="submit" className="btn-primary">
                Ingresar al portal
              </button>
            </form>

            <div className="login-footer">
              <p>Exclusivo para la comunidad del Tecnológico Superior de Jalisco.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="main-nav">
        <div className="nav-content">
          <div className="nav-left">
            <div className="nav-logo-mark image-logo-shell">
              <img src={logoTSJ} alt="Logo TSJ" className="tsj-logo nav-logo" />
            </div>

            <div className="nav-title-group">
              <span className="logo-text">
                ¡Tec! <strong>¡you!</strong>
              </span>
              <small>Reconocimiento universitario</small>
            </div>
          </div>

          <div className="user-info">
            <div className="user-chip">
              <div className="avatar-circle">{getInitials(user.fullname)}</div>
              <div className="user-text">
                <span>Hola,</span>
                <strong>{user.fullname}</strong>
              </div>
            </div>
            <button onClick={() => setUser(null)} className="btn-logout">
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-shell">
        <section className="hero-panel">
          <div>
            <p className="hero-kicker">Comunidad TSJ</p>
            <h1>Impulsa una cultura de gratitud y reconocimiento</h1>
            <p className="hero-subtext">
              Publica reconocimientos, celebra logros y fortalece la identidad de tu
              comunidad académica con una experiencia más clara, humana y moderna.
            </p>
          </div>

          <div className="hero-stats">
            <div className="stat-card">
              <span>Total de reconocimientos</span>
              <strong>{recognitions.length}</strong>
            </div>
            <div className="stat-card">
              <span>Categoría destacada</span>
              <strong>{featuredCategory}</strong>
            </div>
            <div className="stat-card">
              <span>Usuario activo</span>
              <strong>{user.fullname?.split(' ')[0]}</strong>
            </div>
          </div>
        </section>

        <section className="featured-section">
          <div className="featured-header">
            <div>
              <p className="section-label">Destacados</p>
              <h2>Reconocimientos recientes</h2>
            </div>
            <p className="featured-subtext">
              Una selección visual de mensajes que fortalecen la cultura de gratitud dentro del TSJ.
            </p>
          </div>

          <div className="featured-grid">
            {featuredRecognitions.length === 0 ? (
              <div className="featured-empty">
                <div className="empty-icon">✦</div>
                <h3>Aún no hay destacados</h3>
                <p>Cuando existan reconocimientos, aparecerán aquí de forma destacada.</p>
              </div>
            ) : (
              featuredRecognitions.map((rec, index) => {
                const categoryMeta = getCategoryMeta(rec.category);

                return (
                  <article
                    key={rec.id}
                    className={`featured-card ${categoryMeta.className} ${
                      index === 0 ? 'featured-card-large' : ''
                    }`}
                  >
                    <div className="featured-card-top">
                      <span className={`badge-category ${categoryMeta.className}`}>
                        <span className="badge-icon">{categoryMeta.icon}</span>
                        {rec.category}
                      </span>
                      <span className="date">{formatDate(rec.created_at)}</span>
                    </div>

                    <div className="featured-card-body">
                      <div className={`recognition-icon-box ${categoryMeta.className}`}>
                        {categoryMeta.icon}
                      </div>

                      <div>
                        <p className="featured-main-text">
                          <strong>{rec.sender_name}</strong> reconoció a{' '}
                          <strong>{rec.receiver_name}</strong>
                        </p>
                        <p className="featured-message-text">“{rec.message}”</p>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="analytics-strip">
          <div className="mini-stat">
            <span>🤝 Colaboración</span>
            <strong>{categoryCounts.Colaboración}</strong>
          </div>
          <div className="mini-stat">
            <span>📚 Académico</span>
            <strong>{categoryCounts.Académico}</strong>
          </div>
          <div className="mini-stat">
            <span>⭐ Liderazgo</span>
            <strong>{categoryCounts.Liderazgo}</strong>
          </div>
          <div className="mini-stat">
            <span>💡 Creatividad</span>
            <strong>{categoryCounts.Creatividad}</strong>
          </div>
        </section>

        <section className="dashboard">
          <aside className="sidebar">
            <div className="panel-header">
              <p className="section-label">Nuevo reconocimiento</p>
              <h3>Haz visible una acción positiva</h3>
            </div>
            <RecognitionForm onRecognitionSent={fetchFeed} senderId={user.id} />
          </aside>

          <section className="feed-section">
            <div className="feed-header">
              <div>
                <p className="section-label">Muro de la comunidad</p>
                <h2>Reconocimientos recientes</h2>
              </div>
              <p className="feed-subtext">
                Explora mensajes positivos, filtra por categoría y encuentra aportes de la comunidad.
              </p>
            </div>

            <div className="feed-toolbar">
              <div className="feed-search">
                <input
                  type="text"
                  placeholder="Buscar por nombre, mensaje o categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="category-filters">
                {categoryOptions.map((category) => (
                  <button
                    key={category}
                    className={`filter-chip ${
                      selectedCategory === category ? 'active' : ''
                    }`}
                    onClick={() => setSelectedCategory(category)}
                    type="button"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="feed-results-bar">
              <span>
                Mostrando <strong>{filteredRecognitions.length}</strong> resultado(s)
              </span>
              {(selectedCategory !== 'Todas' || searchTerm.trim() !== '') && (
                <button
                  type="button"
                  className="clear-filters-btn"
                  onClick={() => {
                    setSelectedCategory('Todas');
                    setSearchTerm('');
                  }}
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            <div className="feed-container">
              {loadingFeed ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Cargando reconocimientos...</p>
                </div>
              ) : filteredRecognitions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✦</div>
                  <h3>No se encontraron resultados</h3>
                  <p>Prueba con otra categoría o cambia el texto de búsqueda.</p>
                </div>
              ) : (
                filteredRecognitions.map((rec) => {
                  const categoryMeta = getCategoryMeta(rec.category);

                  return (
                    <div
                      key={rec.id}
                      className={`recognition-card ${categoryMeta.className}`}
                    >
                      <div className="card-top">
                        <span className={`badge-category ${categoryMeta.className}`}>
                          <span className="badge-icon">{categoryMeta.icon}</span>
                          {rec.category}
                        </span>
                        <span className="date">{formatDate(rec.created_at)}</span>
                      </div>

                      <div className="recognition-main-row">
                        <div className={`recognition-icon-box ${categoryMeta.className}`}>
                          {categoryMeta.icon}
                        </div>

                        <div className="recognition-body">
                          <p className="main-text">
                            <strong>{rec.sender_name}</strong> reconoció a{' '}
                            <strong>{rec.receiver_name}</strong>
                          </p>

                          <p className="message-text">“{rec.message}”</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

export default App;