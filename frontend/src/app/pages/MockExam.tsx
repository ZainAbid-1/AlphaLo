import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Sparkles, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Topic, Question } from '../data/mockData';
import { api } from '../../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MockExam() {
  const navigate = useNavigate();
  const { topicId } = useParams();
  
  const [displayTopic, setDisplayTopic] = useState<Topic | any>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [topicQuestions, setTopicQuestions] = useState<Question[]>([]);
  const [selectedPaperType, setSelectedPaperType] = useState<'midterm' | 'final'>('midterm');

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
        paper_type: selectedPaperType,
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
      const rawDetail = error?.response?.data?.detail;
      const serverMsg = typeof rawDetail === 'string' 
        ? rawDetail 
        : rawDetail 
          ? JSON.stringify(rawDetail, null, 2) 
          : error?.message || 'Unknown error.';
      alert(`Failed to generate past paper.\n\nReason: ${serverMsg}`);
    } finally {
      setLoadingQuestions(false);
    }
  };

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

            <div className="flex bg-white/5 border border-white/20 rounded-xl p-1 mb-8 w-full max-w-[240px] mx-auto">
              <button
                onClick={() => setSelectedPaperType('midterm')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  selectedPaperType === 'midterm' ? 'bg-[#7C3AED] text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                MID-TERM
              </button>
              <button
                onClick={() => setSelectedPaperType('final')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  selectedPaperType === 'final' ? 'bg-[#7C3AED] text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                FINAL-TERM
              </button>
            </div>

            <button
              onClick={handleStartExam}
              disabled={loadingQuestions}
              className="w-full max-w-md py-4 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:shadow-xl hover:shadow-[#7C3AED]/50 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 group disabled:opacity-50 relative overflow-hidden"
            >
              {loadingQuestions ? (
                <div className="flex flex-col items-center">
                  <span className="animate-pulse">Optimizing AI generation...</span>
                  <span className="text-[10px] font-normal opacity-70 tracking-tight mt-1">Parallelizing batches for faster delivery</span>
                </div>
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
          <div className="text-white text-sm font-medium opacity-80">
            {topicQuestions.length} Questions Blueprint
          </div>
        </div>

        {/* Main Content: Focused Document View */}
        <div className="flex-1 flex flex-col items-center overflow-y-auto custom-scrollbar pb-12">
          <div className="w-full max-w-4xl flex flex-col gap-8 px-4">
            {topicQuestions.map((q, index) => (
              <div 
                key={index}
                className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl transition-all hover:border-white/30"
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <span className="px-5 py-2 bg-[#7C3AED] text-white text-xs font-black tracking-widest rounded-full shadow-lg shadow-[#7C3AED]/20 uppercase">
                      Question {index + 1}
                    </span>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                      q.difficulty === 'hard' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                      q.difficulty === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                      'bg-green-500/10 border-green-500/30 text-green-400'
                    }`}>
                      {q.difficulty || 'medium'}
                    </span>
                  </div>
                </div>

                {/* Question Text with Markdown Rendering (Tables, Code, etc.) */}
                <div className="text-white text-xl font-medium mb-8 leading-relaxed font-sans">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
                      table: ({ node, ...props }) => (
                        <div className="my-8 overflow-x-auto rounded-2xl border border-white/20 bg-white/5 shadow-inner">
                          <table className="w-full text-base text-left border-collapse" {...props} />
                        </div>
                      ),
                      thead: ({ node, ...props }) => <thead className="bg-white/10 text-sm uppercase font-bold text-gray-300" {...props} />,
                      th: ({ node, ...props }) => <th className="px-6 py-4 border-b border-white/20" {...props} />,
                      td: ({ node, ...props }) => <td className="px-6 py-4 border-b border-white/10 text-gray-200" {...props} />,
                      code: ({ node, inline, ...props }: any) => 
                        inline ? (
                          <code className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-sm" {...props} />
                        ) : (
                          <div className="my-6 p-6 bg-black/40 rounded-2xl border border-white/10 font-mono text-sm overflow-x-auto text-blue-100 shadow-inner">
                            <pre className="m-0"><code {...props} /></pre>
                          </div>
                        ),
                    }}
                  >
                    {q.text}
                  </ReactMarkdown>
                </div>

                {/* Sub-questions Rendering */}
                {q.sub_questions && q.sub_questions.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-white/10 flex flex-col gap-10">
                    {q.sub_questions.map((sq: any, sqIndex: number) => (
                      <div key={sqIndex} className="pl-4 border-l-2 border-white/10 space-y-4">
                        <div className="text-gray-200 text-lg font-medium">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                              table: ({ node, ...props }) => (
                                <div className="my-6 overflow-x-auto rounded-xl border border-white/10 bg-white/5 shadow-inner">
                                  <table className="w-full text-sm text-left border-collapse" {...props} />
                                </div>
                              ),
                              thead: ({ node, ...props }) => <thead className="bg-white/10 text-xs uppercase font-bold text-gray-400" {...props} />,
                              th: ({ node, ...props }) => <th className="px-4 py-3 border-b border-white/10" {...props} />,
                              td: ({ node, ...props }) => <td className="px-4 py-3 border-b border-white/5 text-gray-300" {...props} />,
                              code: ({ node, inline, ...props }: any) => 
                                inline ? (
                                  <code className="px-1 py-0.5 rounded bg-white/10 font-mono text-xs" {...props} />
                                ) : (
                                  <div className="my-4 p-4 bg-black/40 rounded-xl border border-white/10 font-mono text-xs overflow-x-auto text-blue-100 shadow-inner">
                                    <pre className="m-0"><code {...props} /></pre>
                                  </div>
                                ),
                            }}
                          >
                            {sq.text}
                          </ReactMarkdown>
                        </div>
                        {sq.options && sq.options.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
                            {sq.options.map((option: string, optIndex: number) => (
                              <div
                                key={optIndex}
                                className="p-4 rounded-xl border border-white/5 bg-white/5 text-gray-300 flex items-center gap-3 transition-colors hover:bg-white/10"
                              >
                                <div className="w-6 h-6 rounded-md bg-white/10 text-white/50 flex items-center justify-center font-bold text-[10px] shrink-0 uppercase">
                                  {String.fromCharCode(97 + optIndex)}
                                </div>
                                <span className="text-sm">{option}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Standard Options (if no sub-questions) */}
                {(!q.sub_questions || q.sub_questions.length === 0) && q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                    {q.options.map((option: string, optIndex: number) => (
                      <div
                        key={optIndex}
                        className="p-5 rounded-2xl border border-white/10 bg-white/5 text-gray-300 flex items-center gap-4 transition-all hover:bg-white/10 hover:translate-x-1"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#7C3AED]/20 text-[#7C3AED] flex items-center justify-center font-black text-xs shrink-0">
                          {String.fromCharCode(65 + optIndex)}
                        </div>
                        <span className="text-base">{option}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
