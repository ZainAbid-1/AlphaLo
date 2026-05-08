import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, Check, ChevronRight, GraduationCap, BookOpen, User, ArrowLeft, Building2 } from 'lucide-react';
import { University, Course, Instructor } from '../data/mockData';
import { api } from '../../services/api';

export default function Wizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  useEffect(() => {
    // Fetch available universities on mount
    api.get('/student/universities')
      .then(res => setUniversities(res.data))
      .catch(err => console.error("Failed to load universities", err));
  }, []);

  const filteredUniversities = universities.filter(uni =>
    (uni.name || "").toLowerCase().includes((searchQuery || "").toLowerCase())
  );

  const handleUniversitySelect = (uni: University) => {
    setSelectedUniversity(uni);
    api.get(`/student/courses/${uni.id}`)
      .then(res => setCourses(res.data))
      .catch(err => console.error("Failed to load courses", err));
    setStep(2);
    setSearchQuery('');
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    api.get(`/student/instructors/${course.id}`)
      .then(res => setInstructors(res.data))
      .catch(err => console.error("Failed to load instructors", err));
    setStep(3);
  };

  const handleInstructorSelect = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    // Save to localStorage for Dashboard
    localStorage.setItem('selectedInstructorName', instructor.name);
    localStorage.setItem('selectedInstructorId', instructor.id);
    localStorage.setItem('selectedCourseId', selectedCourse?.id || '');
    localStorage.setItem('selectedCourseName', selectedCourse?.name || '');
    localStorage.setItem('selectedCourseCode', selectedCourse?.code || '');
    localStorage.setItem('selectedUniversityName', selectedUniversity?.name || '');
    
    setTimeout(() => {
      navigate('/dashboard');
    }, 400);
  };

  const steps = [
    { num: 1, label: 'Institution', sublabel: 'Select your university', icon: Building2 },
    { num: 2, label: 'Course', sublabel: 'Choose your subject', icon: BookOpen },
    { num: 3, label: 'Instructor', sublabel: 'Pick your professor', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A2B48] via-[#2a3f5f] to-[#1A2B48]">
      <div className="max-w-[1400px] mx-auto flex min-h-[calc(100vh-64px)]">

        {/* ─── LEFT SIDEBAR: Progress ─── */}
        <div className="hidden lg:flex w-80 flex-shrink-0 flex-col justify-between p-8 border-r border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Setup Your Profile</h2>
            <p className="text-gray-500 text-sm mb-10">Configure your exam preparation environment</p>

            <div className="space-y-2">
              {steps.map(({ num, label, sublabel, icon: Icon }, idx) => {
                const isActive = step === num;
                const isDone = step > num;
                return (
                  <div key={num} className="flex items-start gap-4">
                    {/* Vertical line + circle */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${
                          isDone
                            ? 'bg-[#10B981] border-[#10B981] shadow-lg shadow-[#10B981]/20'
                            : isActive
                            ? 'bg-[#7C3AED] border-[#7C3AED] shadow-lg shadow-[#7C3AED]/30'
                            : 'bg-white/5 border-white/15'
                        }`}
                      >
                        {isDone ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                        )}
                      </div>
                      {idx < steps.length - 1 && (
                        <div className={`w-0.5 h-12 mt-2 rounded-full transition-all duration-300 ${
                          isDone ? 'bg-[#10B981]' : 'bg-white/10'
                        }`} />
                      )}
                    </div>

                    {/* Label */}
                    <div className="pt-1.5">
                      <p className={`text-sm font-semibold transition-colors ${
                        isActive || isDone ? 'text-white' : 'text-gray-500'
                      }`}>{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>
                      {isDone && (
                        <p className="text-xs text-[#10B981] mt-1 font-medium">
                          {num === 1 && selectedUniversity?.name}
                          {num === 2 && selectedCourse?.name}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary at bottom */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Selection Summary</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">University</span>
                <span className="text-xs text-white font-medium">{selectedUniversity?.name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Course</span>
                <span className="text-xs text-white font-medium">{selectedCourse?.name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Instructor</span>
                <span className="text-xs text-white font-medium">{selectedInstructor?.name || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Content ─── */}
        <div className="flex-1 p-6 sm:p-8 lg:p-12 overflow-y-auto">
          {/* Mobile progress bar */}
          <div className="lg:hidden mb-8">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Step {step} of 3 — {steps[step - 1].label}</span>
              <span>{Math.round((step / 3) * 100)}%</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7C3AED] to-[#10B981] transition-all duration-500 ease-out"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* ─── STEP 1: University ─── */}
          {step === 1 && (
            <div className="max-w-2xl">
              <div className="mb-8">
                <p className="text-[#7C3AED] text-sm font-semibold tracking-wide uppercase mb-2">Step 1</p>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Select Your Institution</h1>
                <p className="text-gray-400">Choose the university you're currently enrolled at</p>
              </div>

              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search institutions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/50 focus:border-[#7C3AED]/50 transition-all"
                />
              </div>

              {/* University list */}
              <div className="space-y-2">
                {filteredUniversities.length === 0 ? (
                  <div className="text-center text-gray-500 py-16">
                    <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No institutions found. Have you seeded the database?</p>
                  </div>
                ) : (
                  filteredUniversities.map((uni) => (
                    <button
                      key={uni.id}
                      onClick={() => handleUniversitySelect(uni)}
                      className="group w-full flex items-center gap-4 p-4 bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-[#7C3AED]/40 rounded-xl transition-all duration-200"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-[#7C3AED]/20 to-[#7C3AED]/5 border border-[#7C3AED]/20 rounded-xl flex items-center justify-center text-[#7C3AED] text-lg font-bold flex-shrink-0">
                        {uni.logo}
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-white font-medium group-hover:text-[#7C3AED] transition-colors">{uni.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">Institution</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#7C3AED] group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ─── STEP 2: Course ─── */}
          {step === 2 && (
            <div className="max-w-2xl">
              <button
                onClick={() => { setStep(1); setSelectedUniversity(null); }}
                className="flex items-center gap-1.5 text-gray-500 hover:text-white text-sm mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Institutions
              </button>

              <div className="mb-8">
                <p className="text-[#10B981] text-sm font-semibold tracking-wide uppercase mb-2">Step 2</p>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Choose Your Course</h1>
                <p className="text-gray-400">
                  Available courses at <span className="text-white font-medium">{selectedUniversity?.name}</span>
                </p>
              </div>

              <div className="space-y-2">
                {courses.length === 0 ? (
                  <div className="text-center text-gray-500 py-16">
                    <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No courses available for this university.</p>
                  </div>
                ) : (
                  courses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => handleCourseSelect(course)}
                      className="group w-full flex items-center gap-4 p-4 bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-[#10B981]/40 rounded-xl transition-all duration-200"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-[#10B981]/20 to-[#10B981]/5 border border-[#10B981]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-[#10B981]" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-white font-medium group-hover:text-[#10B981] transition-colors">{course.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5 uppercase tracking-wider">{course.code}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#10B981] group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ─── STEP 3: Instructor ─── */}
          {step === 3 && (
            <div className="max-w-2xl">
              <button
                onClick={() => { setStep(2); setSelectedCourse(null); }}
                className="flex items-center gap-1.5 text-gray-500 hover:text-white text-sm mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Courses
              </button>

              <div className="mb-8">
                <p className="text-[#7C3AED] text-sm font-semibold tracking-wide uppercase mb-2">Step 3</p>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Select Your Instructor</h1>
                <p className="text-gray-400">
                  Professors teaching <span className="text-white font-medium">{selectedCourse?.name}</span>
                </p>
              </div>

              <div className="space-y-2">
                {instructors.length === 0 ? (
                  <div className="text-center text-gray-500 py-16 space-y-4">
                    <User className="w-10 h-10 mx-auto opacity-30" />
                    <p>No instructors found for this course yet.</p>
                    <button
                      onClick={() => handleInstructorSelect({ id: 'dummy', courseId: selectedCourse?.id || '', name: 'Default Instructor', title: 'Professor', avatar: 'DI' })}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7C3AED] text-white rounded-xl text-sm font-medium hover:bg-[#9333EA] transition-all"
                    >
                      Use Default Instructor
                    </button>
                  </div>
                ) : (
                  instructors.map((instructor) => (
                    <button
                      key={instructor.id}
                      onClick={() => handleInstructorSelect(instructor)}
                      className={`group w-full flex items-center gap-4 p-4 bg-white/[0.03] hover:bg-white/[0.07] border rounded-xl transition-all duration-200 ${
                        selectedInstructor?.id === instructor.id
                          ? 'border-[#7C3AED]/60 bg-[#7C3AED]/10'
                          : 'border-white/10 hover:border-[#7C3AED]/40'
                      }`}
                    >
                      <div className="w-14 h-14 bg-gradient-to-br from-[#7C3AED] to-[#9333EA] rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-lg shadow-[#7C3AED]/20">
                        {instructor.avatar}
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-white font-semibold text-lg group-hover:text-[#7C3AED] transition-colors">{instructor.name}</p>
                        <p className="text-gray-500 text-sm">{instructor.title}</p>
                      </div>
                      {selectedInstructor?.id === instructor.id ? (
                        <div className="w-8 h-8 bg-[#10B981] rounded-lg flex items-center justify-center shadow-lg shadow-[#10B981]/20">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#7C3AED] group-hover:translate-x-0.5 transition-all" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
