import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Sparkles, BookOpen, FileText, ChevronRight } from 'lucide-react';
import { Topic } from '../data/mockData';
import { api } from '../../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPatterns, setGeneratingPatterns] = useState(false);

  // Read from localStorage (saved by Wizard)
  const currentInstructor = localStorage.getItem('selectedInstructorName') || '';
  const courseId = localStorage.getItem('selectedCourseId') || '';
  const courseName = localStorage.getItem('selectedCourseName') || 'Course Roadmap';
  const universityName = localStorage.getItem('selectedUniversityName') || 'University Prep';

  useEffect(() => {
    if (!courseId) return;
    
    // Also try to hydrate from API as a backup
    api.get(`/student/course-details/${courseId}`)
      .then(response => {
        const d = response.data;
        if (!localStorage.getItem('selectedCourseName') && d.courseName) {
          localStorage.setItem('selectedCourseName', d.courseName);
        }
        if (!localStorage.getItem('selectedUniversityName') && d.universityName) {
          localStorage.setItem('selectedUniversityName', d.universityName);
        }
      })
      .catch(() => {});

    api.get(`/student/roadmap/${courseId}`)
      .then(response => setTopics(response.data))
      .catch(error => console.error("Failed to fetch roadmap:", error))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleBookPatterns = async (topicName: string) => {
    try {
      setGeneratingPatterns(true);
      const response = await api.get(`/student/book-patterns/${courseId}/${topicName}`);
      navigate(`/correlation/ai-result`, { 
        state: { recommendations: response.data, topic: topicName } 
      });
    } catch (error) {
      console.error("AI Search failed:", error);
    } finally {
      setGeneratingPatterns(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A2B48] via-[#2a3f5f] to-[#1A2B48]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-12">

        {/* ─── Minimal Header ─── */}
        <div className="mb-8 sm:mb-12 border-l-2 border-[#7C3AED] pl-4 sm:pl-6">
          <p className="text-[#7C3AED] text-xs font-bold tracking-[0.2em] uppercase mb-2">{universityName}</p>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 tracking-tight">{courseName}</h1>
          <p className="text-gray-400 text-xs sm:text-sm font-medium">
            Curriculum Analysis for <span className="text-white">{currentInstructor || 'Selected Instructor'}</span>
          </p>
        </div>

        <div className="space-y-8">
          {/* ─── Mock Exam Action ─── */}
          <button
            onClick={() => navigate('/displayexam/full-exam')}
            className="group w-full flex items-center justify-between p-4 sm:p-6 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-[#7C3AED]/30 rounded-2xl transition-all duration-300"
          >
            <div className="flex items-center gap-3 sm:gap-5 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-[#7C3AED]" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-white font-semibold text-base sm:text-lg">Generate Full-Length Mock</p>
                <p className="text-gray-500 text-xs sm:text-sm hidden sm:block">Matches instructor's marks distribution and scenario style</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-[#7C3AED] group-hover:translate-x-1 transition-all shrink-0" />
          </button>

          {/*HELPING RESOURCES BUTTON*/}
          <div className="backdrop-blur-xl bg-gradient-to-r from-[#10B981]/10 to-[#3B82F6]/10 border border-white/10 rounded-2xl p-4 sm:p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 sm:p-3 bg-gradient-to-br from-[#10B981] to-[#3B82F6] rounded-xl shrink-0">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-xl font-bold text-white">Important Helping Resources</h3>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    Access hand-picked video lectures and external material for {currentInstructor}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/resources/${courseId}`)}
                className="w-full sm:w-auto px-5 py-2.5 sm:px-6 sm:py-3 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <Sparkles className="w-5 h-5 text-yellow-400" />
                View Material
              </button>
            </div>
          </div>

          {/* Syllabus Breakdown */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-sm relative overflow-hidden group/container">
            {/* Subtle glow effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#7C3AED] rounded-full blur-[100px] opacity-10 group-hover/container:opacity-20 transition-opacity"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8 relative z-10">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white mb-1 tracking-tight">Syllabus Breakdown</h2>
                <p className="text-gray-500 text-xs sm:text-sm font-medium">Textbook correlations and exam patterns</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg w-fit">
                <span className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full animate-pulse"></span>
                <span className="text-xs text-gray-300 font-bold uppercase tracking-wider">
                  {topics.length} Units
                </span>
              </div>
            </div>

            <div className="relative z-10 overflow-x-auto -mx-4 sm:mx-0">
              {loading ? (
                <div className="py-20 text-center">
                  <div className="w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-500 text-sm font-medium">Analyzing curriculum...</p>
                </div>
              ) : topics.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-gray-500 text-sm">No roadmap data found for this course.</p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <table className="w-full hidden sm:table">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left py-4 px-2 text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Timeline</th>
                        <th className="text-left py-4 px-2 text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Syllabus Topic</th>
                        <th className="text-right py-4 px-2 text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Prep Tool</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {topics.map((topic) => (
                        <tr
                          key={topic.id}
                          className="group hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-5 px-2">
                            <span className="text-xs text-gray-500 font-mono tracking-tighter">
                              {topic.phase || `WEEK ${topic.week_number || ''}`}
                            </span>
                          </td>
                          <td className="py-5 px-2">
                            <p className="text-white text-sm font-semibold tracking-tight">{topic.topic}</p>
                          </td>
                          <td className="py-5 px-2 text-right">
                            <button
                              onClick={() => handleBookPatterns(topic.topic)}
                              className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#10B981] hover:text-white bg-[#10B981]/10 hover:bg-[#10B981] border border-[#10B981]/20 hover:border-[#10B981] rounded-xl transition-all duration-300 shadow-lg shadow-[#10B981]/5"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              Book Patterns
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile card layout */}
                  <div className="sm:hidden flex flex-col gap-3 px-4">
                    {topics.map((topic) => (
                      <div
                        key={topic.id}
                        className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase">
                            {topic.phase || `WEEK ${topic.week_number || ''}`}
                          </span>
                        </div>
                        <p className="text-white text-sm font-semibold tracking-tight">{topic.topic}</p>
                        <button
                          onClick={() => handleBookPatterns(topic.topic)}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#10B981] hover:text-white bg-[#10B981]/10 hover:bg-[#10B981] border border-[#10B981]/20 hover:border-[#10B981] rounded-xl transition-all duration-300"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Book Patterns
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Loading Overlay ─── */}
      {generatingPatterns && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50">
          <div className="bg-[#1A2B48] border border-white/15 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-xs w-full mx-4">
            <div className="w-10 h-10 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin mb-5" />
            <h3 className="text-lg font-semibold text-white mb-1">Analyzing Patterns</h3>
            <p className="text-gray-500 text-sm text-center">
              Scanning past papers and mapping to textbook exercises...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}