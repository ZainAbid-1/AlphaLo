import { useNavigate } from 'react-router';
import { GraduationCap, Sparkles, BookOpen, BarChart3, LogOut, AlertCircle } from 'lucide-react';
import { topics } from '../data/mockData';

export default function Dashboard() {
  const navigate = useNavigate();

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low':
        return 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A2B48] via-[#2a3f5f] to-[#1A2B48] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
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

        {/* Welcome Section */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-[#7C3AED]/20 to-[#10B981]/20 border border-white/20 rounded-2xl p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome to Your Personalized Prep Roadmap
              </h1>
              <p className="text-gray-400 text-sm">
                Select a course and instructor to get started with personalized exam preparation
              </p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Sparkles className="w-8 h-8 text-[#7C3AED]" />
            </div>
          </div>
        </div>

        {/* Generate Full-Length Paper Button */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-[#7C3AED]/20 to-[#9333EA]/20 border border-[#7C3AED]/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#7C3AED] to-[#9333EA] rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Ready for a Complete Mock Exam?</h3>
                <p className="text-gray-300 text-sm">
                  Generate a full-length practice exam covering all topics with personalized question styles
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/mock/full-exam')}
              className="px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:shadow-xl hover:shadow-[#7C3AED]/40 text-white rounded-xl font-semibold transition-all flex items-center gap-2 group whitespace-nowrap"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Generate Full-Length Paper
            </button>
          </div>
        </div>

        {/* Main Lesson Plan Table */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/20 bg-white/5">
            <h2 className="text-2xl font-bold text-white">Exam Preparation Roadmap</h2>
            <p className="text-gray-300 text-sm mt-1">
              Week-by-week preparation plan personalized to your instructor's teaching style
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20 bg-white/5">
                  <th className="text-left p-4 text-white font-semibold">Preparation Phase</th>
                  <th className="text-left p-4 text-white font-semibold">Syllabus Topic</th>
                  <th className="text-left p-4 text-white font-semibold">AI Pattern Alert</th>
                  <th className="text-left p-4 text-white font-semibold">Complexity</th>
                  <th className="text-left p-4 text-white font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((topic, index) => (
                  <tr
                    key={topic.id}
                    className={`border-b border-white/10 hover:bg-white/5 transition-colors ${
                      index % 3 === 0 ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <td className="p-4">
                      <span className="inline-block px-3 py-1 bg-[#1A2B48] border border-[#7C3AED]/30 rounded-lg text-white text-sm font-medium">
                        {topic.phase}
                      </span>
                    </td>
                    <td className="p-4 text-white font-medium">{topic.topic}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                        <span className="text-gray-300 text-sm">{topic.aiPattern}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-lg text-xs font-medium border ${getComplexityColor(
                          topic.complexity
                        )}`}
                      >
                        {topic.complexity.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/correlation/${topic.id}`)}
                          className="px-4 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] hover:shadow-lg hover:shadow-[#10B981]/30 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                        >
                          <BookOpen className="w-4 h-4" />
                          Book Patterns
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#7C3AED]/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-[#7C3AED]" />
              </div>
              <h3 className="text-white font-semibold">Topics Covered</h3>
            </div>
            <p className="text-3xl font-bold text-white">{topics.length}</p>
            <p className="text-gray-400 text-sm mt-1">Across all exam phases</p>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#10B981]/20 rounded-lg">
                <BookOpen className="w-5 h-5 text-[#10B981]" />
              </div>
              <h3 className="text-white font-semibold">Mock Exams Available</h3>
            </div>
            <p className="text-3xl font-bold text-white">{topics.length * 3}</p>
            <p className="text-gray-400 text-sm mt-1">Personalized to your instructor</p>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
              </div>
              <h3 className="text-white font-semibold">High Priority</h3>
            </div>
            <p className="text-3xl font-bold text-white">{topics.filter(t => t.complexity === 'high').length}</p>
            <p className="text-gray-400 text-sm mt-1">Frequently tested topics</p>
          </div>
        </div>
      </div>
    </div>
  );
}