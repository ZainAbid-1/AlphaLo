import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, BookOpen, Sparkles, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import { Topic } from '../data/mockData';
import { api } from '../../services/api';

export default function BookCorrelation() {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [pattern, setPattern] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/student/roadmap/cs-oop-java'), // get syllabus to match topic
      api.get(`/student/correlation/${topicId}`)
    ])
    .then(([roadmapRes, corrRes]) => {
      const foundTopic = roadmapRes.data.find((t: Topic) => t.id === topicId);
      setTopic(foundTopic || null);
      if (corrRes.data && corrRes.data.length > 0) {
        setPattern(corrRes.data[0]);
      }
    })
    .catch(err => {
      console.error("Failed to fetch correlation data", err);
    })
    .finally(() => {
      setLoading(false);
    });
  }, [topicId]);

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-[#1A2B48] via-[#2a3f5f] to-[#1A2B48] flex items-center justify-center text-white">Loading...</div>;
  }

  if (!topic) {
    return <div className="min-h-screen bg-gradient-to-br from-[#1A2B48] via-[#2a3f5f] to-[#1A2B48] flex items-center justify-center text-white">Topic not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A2B48] via-[#2a3f5f] to-[#1A2B48] p-8">
      <div className="max-w-7xl mx-auto">
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
              <p className="text-gray-300">{topic.topic}</p>
            </div>
          </div>
        </div>

        {pattern ? (
          <>
            {/* Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Left Side - Textbook Summary */}
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-[#10B981]" />
                  <h2 className="text-xl font-bold text-white">Textbook Foundation</h2>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">Textbook Reference</div>
                  <div className="text-white font-semibold">{pattern.textbook_reference}</div>
                </div>

                <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-[#10B981]/20 rounded">
                      <BookOpen className="w-4 h-4 text-[#10B981]" />
                    </div>
                    <h3 className="font-semibold text-white">Correlated Material</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-400 mb-2">Details:</div>
                    <div className="flex items-start gap-2 text-gray-300 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] mt-1.5"></div>
                      <span>Review the specific pages defined in the reference.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Instructor's Twist */}
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-[#7C3AED]" />
                  <h2 className="text-xl font-bold text-white">The Instructor's Twist</h2>
                </div>

                <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-[#7C3AED]" />
                    <h3 className="font-semibold text-white">Instructor's Logic</h3>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">
                    {pattern.instructor_twist}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#7C3AED]/10 to-[#9333EA]/10 border border-[#7C3AED]/30 rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-3">Actual Exam Question Example</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    "{pattern.actual_question_text}"
                  </p>
                </div>
              </div>
            </div>

            {/* Study Recommendations */}
            <div className="mt-6 backdrop-blur-xl bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">📚 AI Hint / Study Recommendations</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#10B981]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#10B981] font-semibold">1</span>
                  </div>
                  <p>
                    <strong className="text-white">Hint:</strong> {pattern.hint}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Correlation Data Not Available</h3>
            <p className="text-gray-400">
              We're still analyzing patterns for this topic. Check back soon for detailed book-to-exam correlations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
