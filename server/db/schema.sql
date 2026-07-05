DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;


CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user', 
    is_suspended BOOLEAN DEFAULT FALSE,
    bio TEXT,
    profile_picture_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL
);


CREATE TABLE listings (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    skill_id INT REFERENCES skills(id) ON DELETE RESTRICT,
    type VARCHAR(20) CHECK (type IN ('offering', 'seeking')),
    description TEXT NOT NULL,
    proficiency_level VARCHAR(20) CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced')),
    availability JSONB DEFAULT '{"days": [], "times": []}'::jsonb,
    certificate_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    listing_id INT REFERENCES listings(id) ON DELETE SET NULL,
    teacher_id INT REFERENCES users(id) ON DELETE CASCADE,
    learner_id INT REFERENCES users(id) ON DELETE CASCADE,
    session_time TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
    reviewer_id INT REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id INT REFERENCES users(id) ON DELETE CASCADE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_booking_reviewer UNIQUE (booking_id, reviewer_id)
);


CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    reporter_id INT REFERENCES users(id) ON DELETE SET NULL,
    reported_user_id INT REFERENCES users(id) ON DELETE CASCADE,
    listing_id INT REFERENCES listings(id) ON DELETE SET NULL,
    booking_id INT REFERENCES bookings(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    resolution_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO skills (name, category) VALUES 
('Spanish Language', 'Languages'),
('React Framework', 'Software Development'),
('Python Basics', 'Software Development'),
('Sourdough Baking', 'Culinary Arts'),
('Guitar Essentials', 'Music')
ON CONFLICT DO NOTHING;

-- Seed Users
-- password password123
INSERT INTO users (username, email, password_hash, role, bio) VALUES
('alice_teacher', 'alice@skillswap.com', '$2a$10$XmNsh0Dq6pB5jRREi7nOie7n2S6fLAnF8gA3UoUcoO09x2u6yX6uW', 'user', 'Enthusiastic native Spanish speaker eager to learn frontend development.'),
('bob_developer', 'bob@skillswap.com', '$2a$10$XmNsh0Dq6pB5jRREi7nOie7n2S6fLAnF8gA3UoUcoO09x2u6yX6uW', 'user', 'Software developer specializing in React looking to practice conversational Spanish.'),
('admin_user', 'admin@skillswap.com', '$2a$10$XmNsh0Dq6pB5jRREi7nOie7n2S6fLAnF8gA3UoUcoO09x2u6yX6uW', 'admin', 'Platform administrative controller.')
ON CONFLICT DO NOTHING;


INSERT INTO listings (user_id, skill_id, type, description, proficiency_level, availability) VALUES
(1, 1, 'offering', 'Offering comprehensive conversational Spanish lessons.', 'advanced', '{"days": ["mon", "wed"], "times": ["evening"]}'),
(1, 2, 'seeking', 'Seeking helper to guide me on React Hooks and Router components.', 'beginner', '{"days": ["mon", "wed"], "times": ["evening"]}'),
(2, 2, 'offering', 'Willing to teach React, build micro-projects, and explain state.', 'advanced', '{"days": ["mon", "wed", "fri"], "times": ["evening"]}'),
(2, 1, 'seeking', 'Seeking Spanish native speaker to chat with once or twice a week.', 'intermediate', '{"days": ["mon", "wed"], "times": ["evening"]}')
ON CONFLICT DO NOTHING;