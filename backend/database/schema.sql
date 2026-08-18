-- Initialize Database
CREATE DATABASE IF NOT EXISTS ai_learning_db;
USE ai_learning_db;

-- 1. Authentication & Roles
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  role ENUM('student', 'professor'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Professor-created topics
CREATE TABLE lectures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  professor_id INT,
  title VARCHAR(255),
  topic TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (professor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Reusable learning concepts
CREATE TABLE concepts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  description TEXT
);

-- 4. Links concepts to lectures
CREATE TABLE lecture_concepts (
  lecture_id INT,
  concept_id INT,
  is_prerequisite BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (lecture_id, concept_id),
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
  FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE
);

-- 5. MCQ questions
CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lecture_id INT,
  question_text TEXT,
  difficulty VARCHAR(50),
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);

-- 6. Options and correct answer
CREATE TABLE question_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT,
  option_text TEXT,
  is_correct BOOLEAN,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- 7. Maps questions to tested concepts
CREATE TABLE question_concepts (
  question_id INT,
  concept_id INT,
  PRIMARY KEY (question_id, concept_id),
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE
);

-- 8. Student answer + reasoning
CREATE TABLE attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  question_id INT,
  selected_option_id INT,
  reasoning TEXT,
  is_correct BOOLEAN,
  reasoning_score FLOAT,
  concept_score FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (selected_option_id) REFERENCES question_options(id) ON DELETE CASCADE
);

-- 9. Current concept mastery
CREATE TABLE student_mastery (
  student_id INT,
  concept_id INT,
  mastery_score FLOAT,
  attempt_count INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, concept_id),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE
);

-- 10. Personalized focus
CREATE TABLE recommendations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  concept_id INT,
  recommendation_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE
);