 create database information_form;   --create database

use information_form;

-- create tables 

create table candidates ( 
id INT auto_increment primary key ,
sso_id varchar(100) not null unique,
roll_no VARCHAR(50),
created_at datetime default current_timestamp ) ;

-- create section 

CREATE TABLE sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_text TEXT NOT NULL,
  section_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_questions_sections FOREIGN KEY (section_id) REFERENCES sections(id)
);

CREATE TABLE options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    text TEXT NOT NULL,
    rating INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    question_id INT NOT NULL,
    option_id INT NOT NULL,
    rating INT NOT NULL,
    ip_address VARCHAR(45),
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (candidate_id, question_id),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (option_id) REFERENCES options(id) ON DELETE CASCADE
);

CREATE TABLE api_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    api_name VARCHAR(255) NOT NULL,
    request_body JSON,
    response_body JSON,
    ip_address VARCHAR(45),
    location VARCHAR(255),
    user_agent TEXT,
    os VARCHAR(100),
    browser VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id int NOT NULL,
    is_active int DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- feed initail data in tables

-- insert sections 

INSERT INTO sections (name, description) VALUES ('Technical Background & Skills', 'Section A');
INSERT INTO sections (name, description) VALUES ('Technical Knowledge', 'Section B: MCQ Quiz: Segments of Computer Engineering');
INSERT INTO sections (name, description) VALUES ('Project Experience', 'Section C');
INSERT INTO sections (name, description) VALUES ('Role Preference', 'Section D: MCQ');
INSERT INTO sections (name, description) VALUES ('Skill Confidence & Interest', 'Section E');
INSERT INTO sections (name, description) VALUES ('Career Goals & Preferences', 'Section F');
INSERT INTO sections (name, description) VALUES ('Technical Preferences', 'Section G');
INSERT INTO sections (name, description) VALUES ('Soft Skills & Workstyle', 'Section H');
INSERT INTO sections (name, description) VALUES ('Motivation & Fit', 'Section I');


-- insert questions and options

-- Q1
INSERT INTO questions (text, section_id) VALUES (
  'What is your highest educational qualification and specialization?', 1);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Diploma in Computer Science/IT', 1),
  (LAST_INSERT_ID(), 'B.Sc. in Computer Science', 2),
  (LAST_INSERT_ID(), 'B.E./B.Tech in CS/IT', 3),
  (LAST_INSERT_ID(), 'M.E./M.Tech/MCA', 4);

-- Q2
INSERT INTO questions (text, section_id) VALUES (
  'How many years of experience do you have in software development?', 1);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Less than 1 year', 1),
  (LAST_INSERT_ID(), '1–2 years', 2),
  (LAST_INSERT_ID(), '3–5 years', 3),
  (LAST_INSERT_ID(), '5+ years', 4);

-- Q3
INSERT INTO questions (text, section_id) VALUES (
  'What programming languages are you most comfortable with? (Choose up to 3)', 1);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Java', 5),
  (LAST_INSERT_ID(), 'JavaScript/ Type Script', 5),
  (LAST_INSERT_ID(), 'C#, VB', 4),
  (LAST_INSERT_ID(), 'PHP', 3);

-- Q4
INSERT INTO questions (text, section_id) VALUES (
  'Which frameworks/tools have you worked with extensively? (Choose all that apply)', 1);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Django', 5),
  (LAST_INSERT_ID(), 'Spring Boot', 5),
  (LAST_INSERT_ID(), '.NET', 4),
  (LAST_INSERT_ID(), 'Laravel / Other PHP Framework', 4);

-- Q5
INSERT INTO questions (text, section_id) VALUES (
  'Are you familiar with version control systems like Git?', 1);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Yes, I use it regularly', 5),
  (LAST_INSERT_ID(), 'I have basic knowledge', 3),
  (LAST_INSERT_ID(), 'I’ve heard of it but never used it', 1);

-- Q6
INSERT INTO questions (text, section_id) VALUES (
  'What type of databases have you worked with? (Choose all that apply)', 1);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'MySQL / PostgreSQL', 5),
  (LAST_INSERT_ID(), 'MongoDB', 4),
  (LAST_INSERT_ID(), 'Oracle', 4),
  (LAST_INSERT_ID(), 'I haven’t worked with databases', 1);


-- Q7
INSERT INTO questions (text, section_id) VALUES (
  'Which segment focuses on building applications like websites and mobile apps?', 2);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Embedded Systems', 1),
  (LAST_INSERT_ID(), 'Web Development', 5),
  (LAST_INSERT_ID(), 'Database Systems', 3),
  (LAST_INSERT_ID(), 'Computer Networks', 2);

-- Q8
INSERT INTO questions (text, section_id) VALUES (
  'What is the primary language used in Machine Learning and AI?', 2);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Java', 2),
  (LAST_INSERT_ID(), 'C++', 3),
  (LAST_INSERT_ID(), 'Python', 5),
  (LAST_INSERT_ID(), 'HTML', 1);

-- Q9
INSERT INTO questions (text, section_id) VALUES (
  'If you're configuring servers and deploying applications on AWS or Azure, you are working in:', 2);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Cybersecurity', 2),
  (LAST_INSERT_ID(), 'Data Science', 3),
  (LAST_INSERT_ID(), 'Cloud Computing', 5),
  (LAST_INSERT_ID(), 'Operating Systems', 1);

-- Q10
INSERT INTO questions (text, section_id) VALUES (
  'What would a DevOps Engineer most likely use?', 2);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Hadoop', 2),
  (LAST_INSERT_ID(), 'Docker', 5),
  (LAST_INSERT_ID(), 'React', 3),
  (LAST_INSERT_ID(), 'SQL Server', 3);

-- Q11
INSERT INTO questions (text, section_id) VALUES (
  'Which of the following is NOT a NoSQL database?', 2);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'MongoDB', 2),
  (LAST_INSERT_ID(), 'PostgreSQL', 5),
  (LAST_INSERT_ID(), 'CouchDB', 2),
  (LAST_INSERT_ID(), 'Cassandra', 2);

-- Q12
INSERT INTO questions (text, section_id) VALUES (
  'Computer Vision primarily deals with:', 2);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Sound signals', 1),
  (LAST_INSERT_ID(), 'Network security', 2),
  (LAST_INSERT_ID(), 'Visual data and image processing', 5),
  (LAST_INSERT_ID(), 'Cloud infrastructure', 3);

-- Q13
INSERT INTO questions (text, section_id) VALUES (
  'What best describes your recent project experience?', 3);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Solo project from scratch', 4),
  (LAST_INSERT_ID(), 'Worked in a small team (2–5 people)', 5),
  (LAST_INSERT_ID(), 'Part of a large development team', 4),
  (LAST_INSERT_ID(), 'Contributed to open-source', 5),
  (LAST_INSERT_ID(), 'No project experience', 1);

-- Q14
INSERT INTO questions (text, section_id) VALUES (
  'Have you worked in an Agile/Scrum development process?', 3);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Yes, regularly', 5),
  (LAST_INSERT_ID(), 'Occasionally', 3),
  (LAST_INSERT_ID(), 'Aware of the process, not used', 2),
  (LAST_INSERT_ID(), 'Not familiar', 1);

-- Q15
INSERT INTO questions (text, section_id) VALUES (
  'Which development tools/environments do you commonly use? (Choose all that apply)', 3);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'VS Code / IntelliJ / Eclipse', 5),
  (LAST_INSERT_ID(), 'GitHub / GitLab', 5),
  (LAST_INSERT_ID(), 'Postman / Swagger', 4),
  (LAST_INSERT_ID(), 'Jira / Trello', 4),
  (LAST_INSERT_ID(), 'None of the above', 1);


-- Q16
INSERT INTO questions (text, section_id) VALUES (
  'Which of the following roles are you most interested in?', 4);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Software Developer', 5),
  (LAST_INSERT_ID(), 'Network Administrator', 3),
  (LAST_INSERT_ID(), 'System Admin', 3),
  (LAST_INSERT_ID(), 'DB Admin', 4),
  (LAST_INSERT_ID(), 'Not sure yet', 2);

-- Q17
INSERT INTO questions (text, section_id) VALUES (
  'What kind of work excites you the most?', 4);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Writing and debugging code', 5),
  (LAST_INSERT_ID(), 'Monitoring and configuring networks', 3),
  (LAST_INSERT_ID(), 'Analyzing system performance and improving workflows', 4),
  (LAST_INSERT_ID(), 'A combination of technical and analytical tasks', 5),
  (LAST_INSERT_ID(), 'None of the above', 1);

-- Q18
INSERT INTO questions (text, section_id) VALUES (
  'Which type of problems do you enjoy solving most?', 4);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Logic and algorithm-based coding challenges', 5),
  (LAST_INSERT_ID(), 'Diagnosing hardware or network issues', 3),
  (LAST_INSERT_ID(), 'Understanding user requirements and system workflows', 4),
  (LAST_INSERT_ID(), 'Optimizing performance in systems or infrastructure', 4),
  (LAST_INSERT_ID(), 'Other (please specify)', 2);


-- Q19a
INSERT INTO questions (text, section_id) VALUES (
  'Rate your interest in writing software/applications (1 = Not at all, 5 = Very Interested)', 5);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), '1', 1),
  (LAST_INSERT_ID(), '2', 2),
  (LAST_INSERT_ID(), '3', 3),
  (LAST_INSERT_ID(), '4', 4),
  (LAST_INSERT_ID(), '5', 5);

-- Q19b
INSERT INTO questions (text, section_id) VALUES (
  'Rate your interest in managing and configuring networks (1 = Not at all, 5 = Very Interested)', 5);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), '1', 1),
  (LAST_INSERT_ID(), '2', 2),
  (LAST_INSERT_ID(), '3', 3),
  (LAST_INSERT_ID(), '4', 4),
  (LAST_INSERT_ID(), '5', 5);

-- Q19c
INSERT INTO questions (text, section_id) VALUES (
  'Rate your interest in monitoring system performance (1 = Not at all, 5 = Very Interested)', 5);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), '1', 1),
  (LAST_INSERT_ID(), '2', 2),
  (LAST_INSERT_ID(), '3', 3),
  (LAST_INSERT_ID(), '4', 4),
  (LAST_INSERT_ID(), '5', 5);

-- Q19d
INSERT INTO questions (text, section_id) VALUES (
  'Rate your interest in working with hardware/network tools (1 = Not at all, 5 = Very Interested)', 5);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), '1', 1),
  (LAST_INSERT_ID(), '2', 2),
  (LAST_INSERT_ID(), '3', 3),
  (LAST_INSERT_ID(), '4', 4),
  (LAST_INSERT_ID(), '5', 5);

-- Q19e
INSERT INTO questions (text, section_id) VALUES (
  'Rate your interest in analyzing user/business requirements (1 = Not at all, 5 = Very Interested)', 5);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), '1', 1),
  (LAST_INSERT_ID(), '2', 2),
  (LAST_INSERT_ID(), '3', 3),
  (LAST_INSERT_ID(), '4', 4),
  (LAST_INSERT_ID(), '5', 5);


-- Q20
INSERT INTO questions (text, section_id) VALUES (
  'What type of working environment do you prefer?', 6);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Office-based team collaboration', 5),
  (LAST_INSERT_ID(), 'Independent technical troubleshooting', 4),
  (LAST_INSERT_ID(), 'Client-facing problem-solving', 4),
  (LAST_INSERT_ID(), 'Flexible tech role', 4),
  (LAST_INSERT_ID(), 'Any', 3);

-- Q21
INSERT INTO questions (text, section_id) VALUES (
  'Are you comfortable with roles involving on-call IT support or network monitoring?', 6);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Yes', 5),
  (LAST_INSERT_ID(), 'Occasionally', 3),
  (LAST_INSERT_ID(), 'No', 1),
  (LAST_INSERT_ID(), 'Not sure', 2);


-- Q22
INSERT INTO questions (text, section_id) VALUES (
  'How do you stay updated with technology trends?', 7);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Online courses (Udemy, Coursera, etc.)', 5),
  (LAST_INSERT_ID(), 'Tech news/blogs (TechCrunch, Wired, etc.)', 4),
  (LAST_INSERT_ID(), 'YouTube tutorials and developer communities', 4),
  (LAST_INSERT_ID(), 'Certifications and training programs', 5),
  (LAST_INSERT_ID(), 'I don’t actively follow trends', 1);

-- Q23
INSERT INTO questions (text, section_id) VALUES (
  'Which type of project would you prefer working on?', 7);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Building a web', 5),
  (LAST_INSERT_ID(), 'Designing and managing a network infrastructure', 4),
  (LAST_INSERT_ID(), 'Conducting a system / Software audit and proposing improvements', 4),
  (LAST_INSERT_ID(), 'Supporting end-users and troubleshooting hardware issues', 3),
  (LAST_INSERT_ID(), 'Coordinating between business and tech teams', 4);

-- Q24
INSERT INTO questions (text, section_id) VALUES (
  'Which development approach are you most comfortable with?', 7);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Front-end/UI development', 5),
  (LAST_INSERT_ID(), 'Back-end/API development', 5),
  (LAST_INSERT_ID(), 'Full-stack development', 5),
  (LAST_INSERT_ID(), 'I prefer infrastructure and system-level tasks', 4),
  (LAST_INSERT_ID(), 'I am still exploring', 2);


-- Q25
INSERT INTO questions (text, section_id) VALUES (
  'How would you describe your problem-solving approach?', 8);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Logical and methodical', 5),
  (LAST_INSERT_ID(), 'Creative and experimental', 4),
  (LAST_INSERT_ID(), 'Research-driven and analytical', 5),
  (LAST_INSERT_ID(), 'Collaborative and user-focused', 4),
  (LAST_INSERT_ID(), 'Trial-and-error based', 2);

-- Q26
INSERT INTO questions (text, section_id) VALUES (
  'How do you handle deadlines under pressure?', 8);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'I work well and stay calm', 5),
  (LAST_INSERT_ID(), 'I try but may get stressed', 3),
  (LAST_INSERT_ID(), 'I struggle with tight deadlines', 2),
  (LAST_INSERT_ID(), 'I’ve never experienced that situation', 2),
  (LAST_INSERT_ID(), 'I always prioritize tasks to stay on track', 5);

-- Q27
INSERT INTO questions (text, section_id) VALUES (
  'How do you prefer to learn a new technology?', 8);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Hands-on practice', 5),
  (LAST_INSERT_ID(), 'Reading documentation', 4),
  (LAST_INSERT_ID(), 'Attending a workshop or course', 4),
  (LAST_INSERT_ID(), 'Learning from a mentor or colleague', 4),
  (LAST_INSERT_ID(), 'Watching tutorials or videos', 4);


-- Q28
INSERT INTO questions (text, section_id) VALUES (
  'What motivates you most in a tech role?', 9);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Solving real-world problems', 5),
  (LAST_INSERT_ID(), 'Building innovative products', 5),
  (LAST_INSERT_ID(), 'Learning and applying new technologies', 5),
  (LAST_INSERT_ID(), 'Team collaboration and knowledge sharing', 4),
  (LAST_INSERT_ID(), 'Career growth and salary', 4);

-- Q29
INSERT INTO questions (text, section_id) VALUES (
  'Are you open to cross-functional training or switching roles in the future?', 9);
INSERT INTO options (question_id, text, rating) VALUES
  (LAST_INSERT_ID(), 'Yes, I enjoy learning different aspects', 5),
  (LAST_INSERT_ID(), 'Only within the same domain', 4),
  (LAST_INSERT_ID(), 'No, I prefer to specialize', 2),
  (LAST_INSERT_ID(), 'Not sure yet', 3);

