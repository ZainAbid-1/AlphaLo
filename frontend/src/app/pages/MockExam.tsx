import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Sparkles, ChevronLeft, ChevronRight, Lightbulb, Flag, Check } from 'lucide-react';
import { topics, questions } from '../data/mockData';

export default function MockExam() {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const topic = topics.find(t => t.id === topicId);

  const [keepOriginal, setKeepOriginal] = useState(true);
  const [difficulty, setDifficulty] = useState(50);
  const [examStarted, setExamStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());

  const topicQuestions = questions.filter(q => q.topicId === topicId);

  if (!topic) {
    return <div>Topic not found</div>;
  }

  const handleStartExam = () => {
    setExamStarted(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < topicQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowHint(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(null);
      setShowHint(false);
    }
  };

  const toggleFlag = () => {
    const newFlagged = new Set(flagged);
    if (newFlagged.has(currentQuestion)) {
      newFlagged.delete(currentQuestion);
    } else {
      newFlagged.add(currentQuestion);
    }
    setFlagged(newFlagged);
  };

  const currentQ = topicQuestions[currentQuestion];

  if (!examStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A2B48] via-[#2a3f5f] to-[#1A2B48] p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-white hover:text-[#7C3AED] mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-[#7C3AED] to-[#9333EA] rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">AI Mock Exam Generator</h1>
                <p className="text-gray-300">{topic.topic}</p>
              </div>
            </div>

            <div className="space-y-6 mt-8">
              {/* Scenario Toggle */}
              <div>
                <label className="block text-white font-semibold mb-3">Question Scenarios</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setKeepOriginal(true)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      keepOriginal
                        ? 'bg-[#7C3AED]/20 border-[#7C3AED] text-white'
                        : 'bg-white/5 border-white/20 text-gray-400 hover:border-white/40'
                    }`}
                  >
                    <div className="font-semibold mb-1">Keep Original</div>
                    <div className="text-sm opacity-80">Use actual exam scenarios</div>
                  </button>
                  <button
                    onClick={() => setKeepOriginal(false)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      !keepOriginal
                        ? 'bg-[#7C3AED]/20 border-[#7C3AED] text-white'
                        : 'bg-white/5 border-white/20 text-gray-400 hover:border-white/40'
                    }`}
                  >
                    <div className="font-semibold mb-1">New AI Scenarios</div>
                    <div className="text-sm opacity-80">Generate fresh contexts</div>
                  </button>
                </div>
              </div>

              {/* Difficulty Slider */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-white font-semibold">Difficulty Level</label>
                  <span className="text-[#7C3AED] font-semibold">
                    {difficulty < 40 ? 'Instructor Style' : difficulty > 60 ? 'Challenging' : 'Balanced'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#7C3AED] [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <div className="flex justify-between mt-2 text-sm text-gray-400">
                  <span>Matches Dr. Mitchell's style</span>
                  <span>Extra challenging</span>
                </div>
              </div>

              {/* Exam Info */}
              <div className="bg-white/5 border border-white/20 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-3">Exam Details</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Number of Questions:</span>
                    <span className="text-white font-semibold">{topicQuestions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Time:</span>
                    <span className="text-white font-semibold">{topicQuestions.length * 5} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AI Hints Available:</span>
                    <span className="text-[#10B981] font-semibold">Yes</span>
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={handleStartExam}
                className="w-full py-4 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:shadow-lg hover:shadow-[#7C3AED]/50 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group"
              >
                Start Mock Exam
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A2B48] via-[#2a3f5f] to-[#1A2B48] p-4">
      <div className="max-w-7xl mx-auto h-screen flex flex-col py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setExamStarted(false)}
            className="flex items-center gap-2 text-white hover:text-[#7C3AED] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Exit Exam
          </button>
          <div className="text-white text-sm">
            Question {currentQuestion + 1} of {topicQuestions.length}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
          {/* Question Panel */}
          <div className="lg:col-span-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-[#7C3AED]/20 border border-[#7C3AED]/30 rounded-lg text-[#7C3AED] text-sm font-semibold">
                  Question {currentQuestion + 1}
                </span>
                <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm font-semibold capitalize">
                  {currentQ.difficulty}
                </span>
              </div>
              <button
                onClick={toggleFlag}
                className={`p-2 rounded-lg transition-all ${
                  flagged.has(currentQuestion)
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Flag className="w-5 h-5" />
              </button>
            </div>

            <p className="text-white text-lg mb-6 leading-relaxed">{currentQ.text}</p>

            {currentQ.type === 'multiple-choice' && currentQ.options && (
              <div className="space-y-3">
                {currentQ.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAnswer(index)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedAnswer === index
                        ? 'bg-[#7C3AED]/20 border-[#7C3AED] text-white'
                        : 'bg-white/5 border-white/20 text-gray-300 hover:border-white/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedAnswer === index
                            ? 'bg-[#7C3AED] border-[#7C3AED]'
                            : 'border-white/40'
                        }`}
                      >
                        {selectedAnswer === index && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <span className="flex-1">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {(currentQ.type === 'short-answer' || currentQ.type === 'essay') && (
              <textarea
                placeholder="Type your answer here..."
                rows={currentQ.type === 'essay' ? 10 : 5}
                className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] resize-none"
              />
            )}

            {/* AI Hint */}
            <div className="mt-6">
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-2 text-[#10B981] hover:text-[#059669] transition-colors"
              >
                <Lightbulb className="w-5 h-5" />
                {showHint ? 'Hide' : 'Get'} Instructor-Style Hint
              </button>
              {showHint && (
                <div className="mt-3 p-4 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl text-gray-300 text-sm">
                  💡 <strong>Hint from Dr. Mitchell's patterns:</strong> Focus on the practical implications. She often asks about real-world scenarios rather than theoretical definitions. Think about how this concept would apply in a production database system.
                </div>
              )}
            </div>
          </div>

          {/* Navigation Panel */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 overflow-y-auto">
            <h3 className="text-white font-semibold mb-4">Question Navigator</h3>
            <div className="grid grid-cols-5 gap-2 mb-6">
              {topicQuestions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentQuestion(index);
                    setSelectedAnswer(null);
                    setShowHint(false);
                  }}
                  className={`aspect-square rounded-lg border-2 text-sm font-semibold transition-all relative ${
                    index === currentQuestion
                      ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                      : 'bg-white/5 border-white/20 text-white hover:border-white/40'
                  }`}
                >
                  {index + 1}
                  {flagged.has(index) && (
                    <Flag className="w-3 h-3 text-red-400 absolute top-0.5 right-0.5" />
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-4 h-4 bg-[#7C3AED] rounded"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-4 h-4 bg-white/5 border-2 border-white/20 rounded"></div>
                <span>Not Visited</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Flag className="w-4 h-4 text-red-400" />
                <span>Flagged</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestion === 0}
                className="w-full py-3 bg-white/5 border border-white/20 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={handleNextQuestion}
                disabled={currentQuestion === topicQuestions.length - 1}
                className="w-full py-3 bg-white/5 border border-white/20 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="w-full py-3 bg-gradient-to-r from-[#10B981] to-[#059669] hover:shadow-lg hover:shadow-[#10B981]/30 text-white rounded-xl font-semibold transition-all">
                Submit Exam
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
