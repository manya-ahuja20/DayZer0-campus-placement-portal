CREATE TABLE student (
  student_id SERIAL PRIMARY KEY,
  roll_no VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  branch VARCHAR(100),
  batch VARCHAR(20),
  cgpa NUMERIC(4,2),
  backlogs INT DEFAULT 0,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  placement_status VARCHAR(30) DEFAULT 'unplaced'
);

CREATE TABLE company (
  company_id SERIAL PRIMARY KEY,
  company_name VARCHAR(150) NOT NULL,
  industry VARCHAR(100),
  recruiter_name VARCHAR(150),
  recruiter_email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  recruiter_phone VARCHAR(20),
  verification_status VARCHAR(30) DEFAULT 'pending'
);

CREATE TABLE admin (
  admin_id SERIAL PRIMARY KEY,
  name VARCHAR(150),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20)
);

CREATE TABLE placement_drive (
  drive_id SERIAL PRIMARY KEY,
  company_id INT NOT NULL REFERENCES company(company_id) ON DELETE CASCADE,
  job_title VARCHAR(150) NOT NULL,
  package NUMERIC(10,2),
  location VARCHAR(150),
  deadline DATE,
  positions INT,
  status VARCHAR(30) DEFAULT 'pending'
);

CREATE TABLE eligibility_criteria (
  criteria_id SERIAL PRIMARY KEY,
  drive_id INT NOT NULL REFERENCES placement_drive(drive_id) ON DELETE CASCADE,
  minimum_cgpa NUMERIC(4,2),
  maximum_backlogs INT,
  eligible_branches VARCHAR(255)
);

CREATE TABLE interview_round (
  round_id SERIAL PRIMARY KEY,
  drive_id INT NOT NULL REFERENCES placement_drive(drive_id) ON DELETE CASCADE,
  round_name VARCHAR(100),
  round_date DATE,
  round_time TIME,
  location VARCHAR(150)
);

CREATE TABLE resume (
  resume_id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  upload_date TIMESTAMP DEFAULT NOW(),
  version INT DEFAULT 1
);

CREATE TABLE application (
  application_id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
  drive_id INT NOT NULL REFERENCES placement_drive(drive_id) ON DELETE CASCADE,
  resume_id INT NOT NULL REFERENCES resume(resume_id),
  application_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(30) DEFAULT 'applied',
  resume_match_score NUMERIC(5,2),
  UNIQUE(student_id, drive_id)
);

CREATE TABLE ai_resume_matcher (
  matcher_id SERIAL PRIMARY KEY,
  application_id INT NOT NULL REFERENCES application(application_id) ON DELETE CASCADE,
  match_score NUMERIC(5,2),
  feedback TEXT
);

CREATE TABLE notification (
  notification_id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
  message TEXT,
  date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(30) DEFAULT 'unread'
);

ALTER TABLE resume ADD COLUMN original_name VARCHAR(255);
ALTER TABLE placement_drive ADD COLUMN job_description TEXT;
ALTER TABLE interview_round ADD COLUMN capacity INT DEFAULT 1;

CREATE TABLE interview_booking (
  booking_id SERIAL PRIMARY KEY,
  round_id INT NOT NULL REFERENCES interview_round(round_id) ON DELETE CASCADE,
  student_id INT NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
  booked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(round_id, student_id)
);

ALTER TABLE resume ADD COLUMN file_data BYTEA;