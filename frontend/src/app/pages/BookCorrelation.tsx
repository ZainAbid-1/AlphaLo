import { useLocation, useNavigate } from 'react-router'; // Ensure useLocation is here
import { ArrowLeft, BookOpen, Sparkles, AlertCircle } from 'lucide-react';

export default function BookCorrelation() {
  const navigate = useNavigate();
  const location = useLocation(); // <--- ADD THIS

  // 1. Catch the AI data sent from Dashboard
  const { recommendations, topic } = location.state || {}; 

  // 2. Handle the case where someone visits this URL directly without clicking the button
  if (!recommendations) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A2B48] via-[#2a3f5f] to-[#1A2B48] flex flex-col items-center justify-center text-white p-8">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-bold">No Data Available</h2>
        <p className="text-gray-400 mb-6 text-center">Please select a topic from the Dashboard to see AI recommendations.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2 bg-[#7C3AED] rounded-xl font-semibold"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A2B48] via-[#2a3f5f] to-[#1A2B48] p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-white hover:text-[#7C3AED] mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-[#10B981]/20 to-[#059669]/20 border border-white/20 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Book Correlation Intelligence</h1>
              <p className="text-gray-300">Topic: <span className="text-white font-bold">{topic}</span></p>
            </div>
          </div>
        </div>

        {/* 3. Loop through every AI Recommendation match */}
        <div className="space-y-8">
          {recommendations.map((item: any, index: number) => (
            <div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Side - The Exam Pattern (The "Trigger") */}
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-[#7C3AED]" />
                  <h2 className="text-xl font-bold text-white">Past Paper Pattern</h2>
                </div>
                <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-xl p-4">
                  <p className="text-gray-200 text-lg italic leading-relaxed">
                    "{item.original_question}"
                  </p>
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                  Extracted from Historical Exams
                </p>
              </div>

              {/* Right Side - The Textbook Recommendation (The "Foundation") */}
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-[#10B981]" />
                  <h2 className="text-xl font-bold text-white">Study Recommendation</h2>
                </div>
                <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl p-4">
                  <div className="prose prose-invert text-gray-200 leading-relaxed">
                    {/* Renders the exercise summary and page references */}
                    {item.recommendation}
                  </div>
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                  Semantic Textbook Mapping
                </p>
              </div>

            </div>
          ))}
        </div>

        {/* Footer Disclaimer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          AI-generated insights based on course curriculum and textbook semantic search.
        </div>
      </div>
    </div>
  );
}