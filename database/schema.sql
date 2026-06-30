-- Tabla de Usuarios (Estudiantes, Docentes, Administrativos)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('student', 'teacher', 'staff')),
    system_role VARCHAR(30) DEFAULT 'user',
    account_status VARCHAR(30) DEFAULT 'active',
    suspended_until TIMESTAMP,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Reconocimientos (El corazón de la plataforma)
CREATE TABLE recognitions (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    ai_refined_message TEXT, -- Aquí guardaremos la versión mejorada por Gemini
    category VARCHAR(50),
    moderation_status VARCHAR(30) DEFAULT 'visible',
    moderated_at TIMESTAMP,
    moderated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Insignias (Generadas por IA)
CREATE TABLE badges (
    id SERIAL PRIMARY KEY,
    recognition_id INTEGER REFERENCES recognitions(id),
    image_url TEXT NOT NULL, -- URL de la imagen generada
    prompt_used TEXT,        -- El texto que se usó para que la IA creara la imagen
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
