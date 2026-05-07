import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Sparkles, ChevronLeft, FileText } from 'lucide-react';
import { Topic, Question } from '../data/mockData';
import { api } from '../../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ─── Shared Markdown Renderer ─────────────────────────────────────────────────
// Mirrors the MarkdownComponents in BookCorrelation.tsx exactly so that tables,
// code windows (macOS style with language label), and typography are consistent.
const ExamMarkdownComponents: any = {
  h1: ({ node, ...props }: any) => <h1 className="text-2xl font-bold text-white mb-4 mt-8 first:mt-0" {...props} />,
  h2: ({ node, ...props }: any) => <h2 className="text-xl font-bold text-[#7C3AED] mb-3 mt-6 first:mt-0" {...props} />,
  h3: ({ node, ...props }: any) => <h3 className="text-lg font-semibold text-white/90 mb-2 mt-4" {...props} />,
  p:  ({ node, ...props }: any) => <p  className="mb-4 leading-relaxed text-gray-200 last:mb-0" {...props} />,
  ul: ({ node, ...props }: any) => <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-200" {...props} />,
  ol: ({ node, ...props }: any) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-gray-200" {...props} />,
  li: ({ node, ...props }: any) => <li className="leading-relaxed" {...props} />,
  strong: ({ node, ...props }: any) => <strong className="text-white font-bold" {...props} />,
  em:     ({ node, ...props }: any) => <em     className="text-gray-300 italic"  {...props} />,

  // ── Premium glassmorphism table ──────────────────────────────────────────────
  table: ({ node, ...props }: any) => (
    <div className="my-8 overflow-x-auto rounded-2xl border border-white/20 bg-white/5 shadow-2xl backdrop-blur-sm">
      <table className="w-full text-base text-left border-collapse" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => (
    <thead className="bg-gradient-to-r from-white/10 to-white/5 text-sm uppercase font-black tracking-widest text-gray-300" {...props} />
  ),
  th: ({ node, ...props }: any) => <th className="px-6 py-5 border-b border-white/20" {...props} />,
  tr: ({ node, ...props }: any) => (
    <tr className="border-b border-white/10 transition-colors hover:bg-white/10 even:bg-white/5" {...props} />
  ),
  td: ({ node, ...props }: any) => <td className="px-6 py-4 text-gray-200 font-medium" {...props} />,

  // ── macOS-style code window (identical to BookCorrelation) ───────────────────
  code: ({ node, inline, className, children, ...props }: any) => {
    const match    = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const content  = String(children).replace(/\n$/, '');
    const isMultiLine = content.includes('\n');
    const useMacWindow = !inline && (isMultiLine || language);

    if (inline) {
      return (
        <code
          className="px-1.5 py-0.5 rounded bg-[#7C3AED]/20 font-mono text-sm text-[#A5B4FC] border border-[#7C3AED]/30"
          {...props}
        >
          {children}
        </code>
      );
    }

    if (!useMacWindow) {
      return <code className="font-mono text-[#A5B4FC]" {...props}>{children}</code>;
    }

    return (
      <div className="my-8 relative group">
        {/* Ambient glow */}
        <div className="absolute -inset-2 bg-gradient-to-r from-[#7C3AED]/20 to-[#3B82F6]/20 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
        {/* Window chrome */}
        <div className="relative bg-[#0F172A]/90 backdrop-blur-sm rounded-2xl border border-white/10 font-mono text-sm overflow-hidden shadow-2xl">
          {/* Title bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
            {/* Traffic lights */}
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-inner" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-inner" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F] shadow-inner" />
            </div>
            {/* Pulse dot only — no language label */}
            <div className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse" />
          </div>
          {/* Code body */}
          <div className="p-6 max-h-[600px] overflow-y-auto">
            <pre className="m-0 text-[#E0E7FF] leading-relaxed whitespace-pre-wrap break-words">
              <code className={className} {...props}>{children}</code>
            </pre>
          </div>
        </div>
      </div>
    );
  },
};

export default function MockExam() {
  const navigate = useNavigate();
  const { topicId } = useParams();
  
  const [displayTopic, setDisplayTopic] = useState<Topic | any>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [topicQuestions, setTopicQuestions] = useState<Question[]>([]);
  const [selectedPaperType, setSelectedPaperType] = useState<'midterm' | 'final'>('midterm');

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

  const handleStartExam = async (forceRefresh = false) => {
    try {
      setLoadingQuestions(true);
      const res = await api.post('/student/displayexam', {
        course_id: courseId,
        instructor_id: instructorId,
        generation_count: 0,
        paper_type: selectedPaperType,
        force_refresh: forceRefresh
      });

      const formattedQuestions = res.data.map((q: any) => {
        const wrapCode = (text: string): string => {
          if (!text || text.includes('```')) return text;

          // ── Ordered code signals: [regex, language] ──────────────────────────
          // More specific patterns first so HTML beats generic JS, Java beats JS, etc.
          const CODE_SIGNALS: [RegExp, string][] = [
            [/<!DOCTYPE|<html[\s>]|<body[\s>]|<head[\s>]/i,                          'html'],
            [/<(?:script|style|div|span|form|input|button|table|ul|li|p|h[1-6])[\s>]/i, 'html'],
            [/\bpublic\s+(?:static\s+)?(?:void|class|int|String|boolean|double)\b/,  'java'],
            [/\bSystem\.out\.(?:print|println)\s*\(/,                                 'java'],
            [/\bdef\s+\w+\s*\(.*\)\s*:/,                                             'python'],
            [/\bprint\s*\(["']/,                                                     'python'],
            [/#[\w-]+\s*\{|\.[\w-]+\s*\{|\bflex(?:box)?\b.*\{/i,                   'css'],
            [/\b(?:let|const|var)\s+\w+\s*=(?!=)/,                                  'javascript'],
            [/\bconsole\.(?:log|error|warn|info)\s*\(/,                              'javascript'],
            [/document\.(?:getElementById|querySelector|addEventListener)/,           'javascript'],
            [/\.(?:filter|map|reduce|forEach|find|some|every)\s*\(/,                'javascript'],
            [/\bfunction\s+\w+\s*\(|=>\s*[\{\[]/,                                   'javascript'],
            [/\bSELECT\b.+\bFROM\b/is,                                               'sql'],
          ];

          // Find the EARLIEST code signal and its language
          let detectedLang = '';
          let earliestPos  = text.length;

          for (const [pattern, lang] of CODE_SIGNALS) {
            const m = pattern.exec(text);
            if (m && m.index < earliestPos) {
              earliestPos  = m.index;
              detectedLang = lang;
            }
          }

          if (!detectedLang) return text; // No code found — leave as-is

          // ── Split narrative from code at the last clean boundary before code ──
          const before = text.slice(0, earliestPos);
          let splitPos = 0;
          const newline   = before.lastIndexOf('\n');
          const dotSpace  = before.lastIndexOf('. ');
          const colonSpace= before.lastIndexOf(': ');
          for (const pos of [newline, dotSpace, colonSpace]) {
            if (pos > splitPos) splitPos = pos + 1;
          }

          const narrative = text.slice(0, splitPos).trim();
          const codeBody  = text.slice(splitPos).trim();

          if (!codeBody) return text;

          if (narrative) {
            return `${narrative}\n\n\`\`\`${detectedLang}\n${codeBody}\n\`\`\``;
          }
          return `\`\`\`${detectedLang}\n${codeBody}\n\`\`\``;
        };

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
          text: wrapCode(q.text),
          type: q.type || 'short-answer', 
          options: parsedOptions,
          sub_questions: q.sub_questions?.map((sq: any) => ({
            ...sq,
            text: wrapCode(sq.text)
          }))
        };
      });
      setTopicQuestions(formattedQuestions);
      setExamStarted(true);
    } catch (error: any) {
      console.error("Failed to fetch questions:", error);
      alert(`Failed to generate past paper. Check backend connectivity.`);
    } finally {
      setLoadingQuestions(false);
    }
  };

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
            
            <h1 className="text-4xl font-bold text-white mb-2">Past Paper Simulator</h1>
            <p className="text-gray-300 text-lg mb-8 max-w-lg">
              This AI simulator generates a parallel practice exam based on the structural blueprint of the original paper while changing all specific values and scenarios for fresh practice.
            </p>

            <div className="bg-white/5 border border-white/20 rounded-2xl p-6 w-full max-w-md mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Course</span>
                <span className="text-white font-semibold uppercase">{courseId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status</span>
                <span className="text-[#10B981] font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></div>
                  AI Simulator Ready
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
              onClick={() => handleStartExam(false)}
              disabled={loadingQuestions}
              className="w-full max-w-md py-4 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:shadow-xl hover:shadow-[#7C3AED]/50 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 group disabled:opacity-50 relative overflow-hidden"
            >
              {loadingQuestions ? (
                <div className="flex flex-col items-center">
                  <span className="animate-pulse">Generating Practice Exam...</span>
                </div>
              ) : (
                <>
                  Generate Practice Paper
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A2B48] via-[#2a3f5f] to-[#1A2B48] p-4 pb-24 overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 px-4">
          <button
            onClick={() => setExamStarted(false)}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Simulator
          </button>
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/60 text-xs font-bold uppercase tracking-widest">
            {topicQuestions.length} Questions Blueprint
          </div>
        </div>

        {/* Main Content: Natural Scrolling View */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-6xl flex flex-col gap-12 px-4">
            {topicQuestions.map((q, index) => (
              <div key={index} className="w-full">
                {q.section_title && (
                  <div className="mb-12 mt-8 flex items-center gap-6">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    <h2 className="text-xl font-black text-white/40 tracking-[0.2em] uppercase text-center px-2">{q.section_title}</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  </div>
                )}
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl transition-all hover:border-white/30 mb-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <span className="px-5 py-2 bg-[#7C3AED] text-white text-xs font-black tracking-widest rounded-full shadow-lg shadow-[#7C3AED]/20 uppercase">
                        Question {index + 1}
                      </span>
                    </div>
                  </div>

                  {/* ── Main question text ── */}
                  <div className="text-white text-xl font-medium mb-8 leading-relaxed font-sans">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={ExamMarkdownComponents}>
                      {q.text}
                    </ReactMarkdown>
                  </div>

                  {/* ── Sub-questions ── */}
                  {q.sub_questions && q.sub_questions.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-white/10 flex flex-col gap-10">
                      {q.sub_questions.map((sq: any, sqIndex: number) => (
                        <div key={sqIndex} className="relative pl-8 border-l-2 border-[#7C3AED]/30 space-y-5 group">
                          {/* Bullet marker */}
                          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#1A2B48] border-2 border-[#7C3AED] shadow-[0_0_10px_rgba(124,58,237,0.5)]" />

                          {/* Sub-question text — same renderer */}
                          <div className="text-gray-200 text-lg font-medium leading-relaxed">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={ExamMarkdownComponents}>
                              {sq.text}
                            </ReactMarkdown>
                          </div>

                          {/* Sub-question MCQ options */}
                          {sq.options && sq.options.length > 0 && (
                            <div className="grid grid-cols-1 gap-3 max-w-3xl mt-4">
                              {sq.options.map((option: string, optIndex: number) => (
                                <div
                                  key={optIndex}
                                  className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/5 text-gray-300 transition-all hover:bg-white/10 hover:border-white/10 cursor-pointer"
                                >
                                  <div className="w-7 h-7 rounded-md bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-[#A78BFA] flex items-center justify-center font-black text-xs shrink-0 uppercase">
                                    {String.fromCharCode(65 + optIndex)}
                                  </div>
                                  <span className="text-base leading-relaxed">{option}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Top-level MCQ options (no sub-questions) ── */}
                  {(!q.sub_questions || q.sub_questions.length === 0) && q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 max-w-4xl mt-8">
                      {q.options.map((option: string, optIndex: number) => (
                        <div
                          key={optIndex}
                          className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/5 text-gray-200 transition-all hover:bg-white/10 hover:border-white/10 cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-[#A78BFA] flex items-center justify-center font-black text-xs shrink-0 uppercase">
                            {String.fromCharCode(65 + optIndex)}
                          </div>
                          <span className="text-lg leading-relaxed">{option}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
