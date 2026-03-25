from sqlalchemy import Column, String, Integer, ForeignKey
from database import Base

class Course(Base):
    __tablename__ = "courses"
    id = Column(String, primary_key=True)  # e.g., 'cs-oop-java'
    university_id = Column(String, ForeignKey("universities.id"))
    name = Column(String)

class SyllabusTopic(Base):
    __tablename__ = "syllabus_topics"
    id = Column(String, primary_key=True)  # e.g., 'w1'
    course_id = Column(String, ForeignKey("courses.id"))
    week_number = Column(Integer)
    topic = Column(String)
    
    # Quick Dashboard preview (fast loading)
    ai_pattern_summary = Column(String, nullable=True)
    complexity = Column(String, default="medium")

class ExamPattern(Base):
    __tablename__ = "exam_patterns"
    id = Column(Integer, primary_key=True, autoincrement=True)
    topic_id = Column(String, ForeignKey("syllabus_topics.id"))
    
    # Deep Content (loaded only when user clicks "Book Patterns")
    actual_question_text = Column(String)
    textbook_reference = Column(String)    # e.g., "Page 42, Ex 3"
    instructor_twist = Column(String)      # The "why" behind the prof's logic
    hint = Column(String)                  # AI hint for the student

class PastPaper(Base):
    __tablename__ = "past_papers"
    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(String, ForeignKey("courses.id"))
    paper_title = Column(String)           # e.g., "Midterm 2024"
    raw_content = Column(String)           # Used as the "Blueprint" for AI generation

class Textbook(Base):
    __tablename__ = "textbooks"
    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(String, ForeignKey("courses.id"))
    title = Column(String)
    file_path = Column(String) # Path to the PDF on your server

class University(Base):
    __tablename__ = "universities"
    id = Column(String, primary_key=True)
    name = Column(String)  

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String) # Stores the hashed password, NOT the plain text
    role = Column(String, default="student") # 'admin' or 'student'          