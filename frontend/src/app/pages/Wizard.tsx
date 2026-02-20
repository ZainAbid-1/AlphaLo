import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Check, ChevronRight, GraduationCap, BookOpen, User } from 'lucide-react';
import { universities, courses, instructors, University, Course, Instructor } from '../data/mockData';

export default function Wizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUniversities = universities.filter(uni =>
    uni.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableCourses = selectedUniversity
    ? courses.filter(c => c.universityId === selectedUniversity.id)
    : [];

  const availableInstructors = selectedCourse
    ? instructors.filter(i => i.courseId === selectedCourse.id)
    : [];

  const handleUniversitySelect = (uni: University) => {
    setSelectedUniversity(uni);
    setStep(2);
    setSearchQuery('');
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setStep(3);
  };

  const handleInstructorSelect = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    // Navigate to dashboard after a brief delay
    setTimeout(() => {
      navigate('/dashboard');
    }, 500);
  };

  const progressPercentage = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A2B48] via-[#2a3f5f] to-[#1A2B48] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8 text-white">
          <GraduationCap className="w-8 h-8 text-[#7C3AED]" />
          <span className="text-2xl font-bold">AlphaLo</span>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between mb-2 text-sm text-white">
            <span>Step {step} of 3</span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-[#7C3AED] to-[#10B981] transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {[
              { num: 1, label: 'University', icon: GraduationCap },
              { num: 2, label: 'Course', icon: BookOpen },
              { num: 3, label: 'Instructor', icon: User }
            ].map(({ num, label, icon: Icon }) => (
              <div key={num} className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    step > num
                      ? 'bg-[#10B981] border-[#10B981] text-white'
                      : step === num
                      ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                      : 'bg-white/5 border-white/20 text-white/50'
                  }`}
                >
                  {step > num ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-sm ${step >= num ? 'text-white' : 'text-white/50'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl min-h-[500px]">
          {/* Step 1: University Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Select Your University</h2>
                <p className="text-gray-300">Choose your institution to get started</p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search universities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] backdrop-blur-sm"
                />
              </div>

              {/* University Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
                {filteredUniversities.length === 0 ? (
                  <div className="col-span-full text-center text-gray-400 py-12">
                    No universities available. Please connect to backend.
                  </div>
                ) : (
                  filteredUniversities.map((uni) => (
                    <button
                      key={uni.id}
                      onClick={() => handleUniversitySelect(uni)}
                      className="group p-6 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-[#7C3AED] rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#7C3AED]/20"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#7C3AED] to-[#9333EA] rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                          {uni.logo}
                        </div>
                        <span className="text-white text-center text-sm group-hover:text-[#7C3AED] transition-colors">
                          {uni.name}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 2: Course Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <button
                  onClick={() => {
                    setStep(1);
                    setSelectedUniversity(null);
                  }}
                  className="text-[#7C3AED] hover:text-[#9333EA] mb-4 flex items-center gap-1"
                >
                  ← Back to Universities
                </button>
                <h2 className="text-3xl font-bold text-white mb-2">Select Your Course</h2>
                <p className="text-gray-300">Choose a course at {selectedUniversity?.name}</p>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {availableCourses.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    No courses available for this university. Please connect to backend.
                  </div>
                ) : (
                  availableCourses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => handleCourseSelect(course)}
                      className="group w-full p-5 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-[#7C3AED] rounded-xl transition-all hover:scale-[1.02] text-left flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-lg flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-semibold">{course.code}</div>
                          <div className="text-gray-300 text-sm">{course.name}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#7C3AED] group-hover:translate-x-1 transition-all" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 3: Instructor Selection */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <button
                  onClick={() => {
                    setStep(2);
                    setSelectedCourse(null);
                  }}
                  className="text-[#7C3AED] hover:text-[#9333EA] mb-4 flex items-center gap-1"
                >
                  ← Back to Courses
                </button>
                <h2 className="text-3xl font-bold text-white mb-2">Select Your Instructor</h2>
                <p className="text-gray-300">Choose your professor for {selectedCourse?.name}</p>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {availableInstructors.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    No instructors available for this course. Please connect to backend.
                  </div>
                ) : (
                  availableInstructors.map((instructor) => (
                    <button
                      key={instructor.id}
                      onClick={() => handleInstructorSelect(instructor)}
                      className={`group w-full p-6 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-[#7C3AED] rounded-xl transition-all hover:scale-[1.02] text-left flex items-center justify-between ${
                        selectedInstructor?.id === instructor.id ? 'bg-[#7C3AED]/20 border-[#7C3AED]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#7C3AED] to-[#9333EA] rounded-full flex items-center justify-center text-white text-xl font-bold">
                          {instructor.avatar}
                        </div>
                        <div>
                          <div className="text-white font-semibold text-lg">{instructor.name}</div>
                          <div className="text-gray-300 text-sm">{instructor.title}</div>
                        </div>
                      </div>
                      {selectedInstructor?.id === instructor.id ? (
                        <div className="w-8 h-8 bg-[#10B981] rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#7C3AED] group-hover:translate-x-1 transition-all" />
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
