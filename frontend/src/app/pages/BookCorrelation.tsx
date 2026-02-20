import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, BookOpen, Sparkles, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import { topics, bookCorrelation } from '../data/mockData';

export default function BookCorrelation() {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const topic = topics.find(t => t.id === topicId);

  const correlation = bookCorrelation[topicId as keyof typeof bookCorrelation];

  if (!topic) {
    return <div>Topic not found</div>;
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

        {correlation ? (
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
                  <div className="text-sm text-gray-400 mb-1">Reference Textbook</div>
                  <div className="text-white font-semibold">{correlation.textbook}</div>
                </div>

                <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-[#10B981]/20 rounded">
                      <BookOpen className="w-4 h-4 text-[#10B981]" />
                    </div>
                    <h3 className="font-semibold text-white">{correlation.chapter}</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-400 mb-2">Key Sections:</div>
                    {correlation.sections.map((section, index) => (
                      <div key={index} className="flex items-start gap-2 text-gray-300 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] mt-1.5"></div>
                        <span>{section}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/20 rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-3">Standard Textbook Question</h3>
                  <p className="text-gray-300 italic text-sm leading-relaxed">
                    "{correlation.textbookVersion}"
                  </p>
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
                    <h3 className="font-semibold text-white">Instructor's Approach</h3>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">
                    {correlation.instructorTwist.notes}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-red-400">
                      High Frequency
                    </div>
                    <span className="text-gray-400">
                      Appeared in <strong className="text-white">{correlation.instructorTwist.frequency}</strong>
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#7C3AED]/10 to-[#9333EA]/10 border border-[#7C3AED]/30 rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-3">Actual Exam Question Pattern</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    "{correlation.instructorTwist.question}"
                  </p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-400 text-sm mb-1">Key Difference</h4>
                      <p className="text-gray-300 text-sm">
                        Your instructor expects real-world scenario application, not just theoretical knowledge. Always prepare with practical examples.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison Section */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <ArrowLeftRight className="w-5 h-5 text-[#7C3AED]" />
                <h2 className="text-xl font-bold text-white">Side-by-Side Comparison</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-[#10B981]" />
                    <h3 className="font-semibold text-white">Textbook Version</h3>
                  </div>
                  <div className="bg-white/5 border border-white/20 rounded-xl p-4">
                    <p className="text-gray-300 text-sm italic leading-relaxed mb-4">
                      "{correlation.textbookVersion}"
                    </p>
                    <div className="space-y-2 pt-3 border-t border-white/10">
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] mt-1.5"></div>
                        <span className="text-gray-400">Focus: Theoretical concepts</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] mt-1.5"></div>
                        <span className="text-gray-400">Type: Definition-based</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] mt-1.5"></div>
                        <span className="text-gray-400">Difficulty: Moderate</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                    <h3 className="font-semibold text-white">Instructor's Version</h3>
                  </div>
                  <div className="bg-gradient-to-br from-[#7C3AED]/10 to-[#9333EA]/10 border border-[#7C3AED]/30 rounded-xl p-4">
                    <p className="text-gray-300 text-sm leading-relaxed mb-4">
                      "{correlation.instructorVersion}"
                    </p>
                    <div className="space-y-2 pt-3 border-t border-[#7C3AED]/20">
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] mt-1.5"></div>
                        <span className="text-gray-400">Focus: Real-world application</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] mt-1.5"></div>
                        <span className="text-gray-400">Type: Scenario-based</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] mt-1.5"></div>
                        <span className="text-gray-400">Difficulty: High complexity</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Study Recommendations */}
            <div className="mt-6 backdrop-blur-xl bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">📚 Study Recommendations</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#10B981]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#10B981] font-semibold">1</span>
                  </div>
                  <p>
                    <strong className="text-white">Read {correlation.chapter} thoroughly</strong> - Ensure you understand the foundational concepts before attempting scenario-based questions.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#10B981]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#10B981] font-semibold">2</span>
                  </div>
                  <p>
                    <strong className="text-white">Practice with real-world scenarios</strong> - Your instructor's exams may include practical applications like e-commerce, banking, or ticketing systems.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#10B981]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#10B981] font-semibold">3</span>
                  </div>
                  <p>
                    <strong className="text-white">Focus on concurrency issues</strong> - Multi-user scenarios and race conditions are common topics in transaction management questions.
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
