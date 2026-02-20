import { useNavigate } from 'react-router';
import { GraduationCap, Sparkles, BookOpen, BarChart3, LogOut, AlertCircle, Clock } from 'lucide-react';
import { topics, instructors } from '../data/mockData';

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Get current instructor name (Defaulting to the first one in mockData)
  const currentInstructor = instructors[0]?.name || "Selected Instructor";

  // Helper function to handle complexity colors (Added default for null)
  const getComplexityColor = (complexity: string | null) => {
    switch (complexity) {
      case 'low':
        return 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'; // Gray for null
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A2B48] via-[#2a3f5f] to-[#1A2B48] p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-white">
            <GraduationCap className="w-8 h-8 text-[#7C3AED]" />
            <span className="text-2xl font-bold">AlphaLo</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/analytics')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* --- WELCOME SECTION --- */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-[#7C3AED]/20 to-[#10B981]/20 border border-white/20 rounded-2xl p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                NUST OOP Prep Roadmap
              </h1>
              <p className="text-gray-300 text-sm">
                Synchronized with the curriculum of <strong>{currentInstructor}</strong>
              </p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Sparkles className="w-8 h-8 text-[#7C3AED]" />
            </div>
          </div>
        </div>

        {/* --- FULL MOCK BUTTON --- */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-[#7C3AED]/20 to-[#9333EA]/20 border border-[#7C3AED]/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#7C3AED] to-[#9333EA] rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Full-Length Java OOP Mock</h3>
                <p className="text-gray-300 text-sm">
                  Generate an exam matching {currentInstructor}'s marks distribution and scenario style.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/mock/full-exam')}
              className="px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:shadow-xl hover:shadow-[#7C3AED]/40 text-white rounded-xl font-semibold transition-all flex items-center gap-2 group whitespace-nowrap"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Generate Full Paper
            </button>
          </div>
        </div>

        {/* --- DYNAMIC LESSON PLAN TABLE --- */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/20 bg-white/5">
            <h2 className="text-2xl font-bold text-white">Syllabus Breakdown</h2>
            <p className="text-gray-300 text-sm mt-1">
              Week-by-week analysis of exam patterns and textbook correlations.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20 bg-white/5">
                  <th className="text-left p-4 text-white font-semibold">Timeline</th>
                  <th className="text-left p-4 text-white font-semibold">Topic</th>
                  <th className="text-left p-4 text-white font-semibold">AI Style Insight</th>
                  <th className="text-left p-4 text-white font-semibold">Complexity</th>
                  <th className="text-left p-4 text-white font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((topic, index) => (
                  <tr
                    key={topic.id}
                    className={`border-b border-white/10 hover:bg-white/5 transition-colors ${
                      index % 2 === 0 ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <td className="p-4">
                      <span className="inline-block px-3 py-1 bg-[#1A2B48] border border-[#7C3AED]/30 rounded-lg text-white text-xs font-medium">
                        {topic.phase}
                      </span>
                    </td>
                    <td className="p-4 text-white font-medium">{topic.topic}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-400 text-xs">
                          {topic.aiPattern ? topic.aiPattern : "Analyzing past papers..."}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold border ${getComplexityColor(
                          topic.complexity
                        )}`}
                      >
                        {topic.complexity ? topic.complexity.toUpperCase() : "PENDING"}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => navigate(`/correlation/${topic.id}`)}
                        className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg text-xs font-medium transition-all flex items-center gap-2"
                      >
                        <BookOpen className="w-4 h-4" />
                        Book Patterns
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- DYNAMIC STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#7C3AED]" /> Total Weeks
            </h3>
            <p className="text-3xl font-bold text-white">{topics.length}</p>
            <p className="text-gray-400 text-xs mt-1">Full semester roadmap</p>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-[#10B981]" /> Study Materials
            </h3>
            <p className="text-3xl font-bold text-white">{topics.length * 2}</p>
            <p className="text-gray-400 text-xs mt-1">Correlated book sections</p>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-400" /> High Complexity
            </h3>
            <p className="text-3xl font-bold text-white">
              {topics.filter(t => t.complexity === 'high').length}
            </p>
            <p className="text-gray-400 text-xs mt-1">Requiring focused practice</p>
          </div>
        </div>

      </div>
    </div>
  );
}