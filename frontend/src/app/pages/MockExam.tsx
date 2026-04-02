import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Sparkles, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Topic, Question } from '../data/mockData';
import { api } from '../../services/api';

export default function MockExam() {
  const navigate = useNavigate();
  const { topicId } = useParams();
  
  const [displayTopic, setDisplayTopic] = useState<Topic | any>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [topicQuestions, setTopicQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // We get course and instructor from localStorage
  const courseId = localStorage.getItem('selectedCourseId') || 'cs-oop-java';
  const instructorId = localStorage.getItem('selectedInstructorId') || 'jaudat';
  const isFullExam = topicId === 'full-exam';

  useEffect(() => {
    if (isFullExam) {
      setDisplayTopic({ id: 'full-exam', topic: 'Full Past Paper', phase: 'Full Exam', aiPattern: '', complexity: 'medium' });
    } else {
      api.get(`/student/roadmap/${courseId}`).then(res => {
        const foundTopic = res.data.find((t: Topic) => t.id === topicId);
        setDisplayTopic(foundTopic || null);
      });
    }
  }, [topicId, isFullExam, courseId]);

  if (!displayTopic) {
    return <div className="min-h-screen bg-gradient-to-br from-[#1A2B48] via-[#2a3f5f] to-[#1A2B48] flex items-center justify-center text-white">Loading Module...</div>;
  }

  const getGenerationCount = () => {
    const count = localStorage.getItem(`past_paper_gen_count_${courseId}`);
    return count ? parseInt(count, 10) : 0;
  };

  const incrementGenerationCount = () => {
    const count = getGenerationCount();
    localStorage.setItem(`past_paper_gen_count_${courseId}`, (count + 1).toString());
  };

  const handleStartExam = async () => {
    try {
      setLoadingQuestions(true);
      const generationCount = getGenerationCount();
      
      const res = await api.post('/student/displayexam', {
        course_id: courseId,
        instructor_id: instructorId,
        generation_count: generationCount,
      });

      // Format questions for frontend matching DB columns
      const formattedQuestions = res.data.map((q: any) => {
        let parsedOptions = q.options;
        if (typeof parsedOptions === 'string') {
          try {
            parsedOptions = JSON.parse(parsedOptions);
          } catch (e) {
            parsedOptions = [];
          }
        }
        return {
          ...q,
          type: q.type || 'short-answer', 
          options: parsedOptions
        };
      });
      setTopicQuestions(formattedQuestions);
      setExamStarted(true);
      
      // Increment only after success
      incrementGenerationCount();
    } catch (error: any) {
      console.error("Failed to fetch questions:", error);
      const serverMsg = error?.response?.data?.detail || error?.message || 'Unknown error.';
      alert(`Failed to generate past paper.\n\nReason: ${serverMsg}`);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < topicQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const currentQ = topicQuestions[currentQuestion];
  const generationCount = getGenerationCount();

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

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl text-center flex flex-col items-center">
            <div className="p-4 bg-gradient-to-br from-[#7C3AED] to-[#9333EA] rounded-2xl mb-6 shadow-lg shadow-[#7C3AED]/30">
              <FileText className="w-12 h-12 text-white" />
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-2">Past Paper Presenter</h1>
            <p className="text-gray-300 text-lg mb-8 max-w-lg">
              View the uploaded past paper formatted cleanly for your screen. Subsequent generations will intelligently invent new questions guided by the original structural blueprint.
            </p>

            <div className="bg-white/5 border border-white/20 rounded-2xl p-6 w-full max-w-md mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Course</span>
                <span className="text-white font-semibold uppercase">{courseId}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Times Generated</span>
                <span className="text-white font-semibold">{generationCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Current Mode</span>
                <span className={generationCount === 0 ? "text-[#3B82F6] font-semibold" : "text-[#10B981] font-semibold"}>
                  {generationCount === 0 ? 'Original Blueprint' : 'AI Modded Challenge'}
                </span>
              </div>
            </div>

            <button
              onClick={handleStartExam}
              disabled={loadingQuestions}
              className="w-full max-w-md py-4 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:shadow-xl hover:shadow-[#7C3AED]/50 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
            >
              {loadingQuestions ? (
                "Processing past paper..." 
              ) : (
                <>
                  {generationCount === 0 ? 'View Past Paper' : 'Generate Similar Paper'}
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!topicQuestions || topicQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A2B48] via-[#2a3f5f] to-[#1A2B48] flex flex-col items-center justify-center text-white p-8">
        <h2 className="text-2xl font-bold mb-4">No Questions Found</h2>
        <p className="mb-6 text-gray-300">The AI could not generate questions or the question bank is empty.</p>
        <button
          onClick={() => setExamStarted(false)}
          className="px-6 py-2 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] rounded-xl font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A2B48] via-[#2a3f5f] to-[#1A2B48] p-4">
      <div className="max-w-7xl mx-auto h-[95vh] flex flex-col py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setExamStarted(false)}
            className="flex items-center gap-2 text-white hover:text-[#7C3AED] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Generator
          </button>
          <div className="text-white text-sm">
            Question {currentQuestion + 1} of {topicQuestions.length}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          {/* Question Panel */}
          <div className="lg:col-span-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 overflow-y-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="px-4 py-1.5 bg-[#7C3AED]/20 border border-[#7C3AED]/30 rounded-lg text-[#7C3AED] text-sm font-bold tracking-wide">
                QUESTION {currentQuestion + 1}
              </span>
              <span className="px-4 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm font-bold capitalize">
                {currentQ.difficulty || 'medium'}
              </span>
            </div>

            <h2 className="text-white text-2xl font-medium mb-8 leading-relaxed">
              {currentQ.text}
            </h2>

            {currentQ.options && Array.isArray(currentQ.options) && currentQ.options.length > 0 && (
              <div className="space-y-4 max-w-2xl">
                {currentQ.options.map((option, index) => (
                  <div
                    key={index}
                    className="w-full p-5 rounded-xl border-2 border-white/10 bg-white/5 text-gray-200 flex items-center gap-4"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/10 text-white/70 flex items-center justify-center font-bold text-sm shrink-0">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-lg">{option}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Panel */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 overflow-y-auto flex flex-col">
            <h3 className="text-white font-bold text-lg mb-6">Question Navigator</h3>
            
            <div className="grid grid-cols-5 gap-3 mb-auto">
              {topicQuestions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`aspect-square rounded-xl border-2 text-sm font-bold transition-all relative flex items-center justify-center ${
                    index === currentQuestion
                      ? 'bg-[#7C3AED] border-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <div className="space-y-4 pt-8 mt-8 border-t border-white/10">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestion === 0}
                className="w-full py-4 bg-white/5 border mt-auto border-white/20 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all flex items-center justify-center gap-2 font-semibold"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous Question
              </button>
              <button
                onClick={handleNextQuestion}
                disabled={currentQuestion === topicQuestions.length - 1}
                className="w-full py-4 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all flex items-center justify-center gap-2 font-semibold"
              >
                Next Question
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
