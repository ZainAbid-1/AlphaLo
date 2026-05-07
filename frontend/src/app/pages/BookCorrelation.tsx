import { useLocation, useNavigate } from 'react-router';
import { ArrowLeft, BookOpen, Sparkles, AlertCircle, Terminal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function BookCorrelation() {
  const navigate = useNavigate();
  const location = useLocation();

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

  // Shared Markdown Components for both Exam Pattern and Recommendation
  const MarkdownComponents: any = {
    h1: ({ node, ...props }: any) => <h1 className="text-2xl font-bold text-white mb-4 mt-8 first:mt-0" {...props} />,
    h2: ({ node, ...props }: any) => <h2 className="text-xl font-bold text-[#10B981] mb-4 mt-8 first:mt-0 flex items-center gap-2" {...props} />,
    h3: ({ node, ...props }: any) => <h3 className="text-lg font-bold text-white/90 mb-3 mt-6" {...props} />,
    p: ({ node, ...props }: any) => <p className="mb-4 leading-relaxed text-gray-300" {...props} />,
    ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 mb-4 space-y-2 text-gray-300" {...props} />,
    li: ({ node, ...props }: any) => <li className="leading-relaxed" {...props} />,
    strong: ({ node, ...props }: any) => <strong className="text-white font-bold" {...props} />,
    table: ({ node, ...props }: any) => (
      <div className="my-8 overflow-x-auto rounded-2xl border border-white/20 bg-white/5 shadow-2xl backdrop-blur-sm">
        <table className="w-full text-base text-left border-collapse" {...props} />
      </div>
    ),
    thead: ({ node, ...props }: any) => <thead className="bg-gradient-to-r from-white/10 to-white/5 text-sm uppercase font-black tracking-widest text-gray-300" {...props} />,
    th: ({ node, ...props }: any) => <th className="px-6 py-5 border-b border-white/20" {...props} />,
    tr: ({ node, ...props }: any) => <tr className="border-b border-white/10 transition-colors hover:bg-white/10 even:bg-white/5" {...props} />,
    td: ({ node, ...props }: any) => <td className="px-6 py-4 text-gray-200 font-medium" {...props} />,
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const content = String(children).replace(/\n$/, '');
      const isMultiLine = content.includes('\n');
      
      // FORCE Mac window for any code block (non-inline) or multi-line content
      const useMacWindow = !inline && (isMultiLine || language);

      if (inline) {
        return (
          <code className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-sm text-[#A5B4FC]" {...props}>
            {children}
          </code>
        );
      }

      if (!useMacWindow) {
        return (
          <code className="font-mono text-[#A5B4FC]" {...props}>
            {children}
          </code>
        );
      }

      return (
        <div className="my-8 relative group">
          <div className="absolute -inset-2 bg-gradient-to-r from-[#7C3AED]/20 to-[#3B82F6]/20 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <div className="relative bg-[#0F172A]/90 backdrop-blur-sm rounded-2xl border border-white/10 font-mono text-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-inner"></div>
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-inner"></div>
                <div className="w-3 h-3 rounded-full bg-[#27C93F] shadow-inner"></div>
              </div>
              {/* Pulse dot only — no language label */}
              <div className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse"></div>
            </div>
            <div className="p-6 max-h-[600px] overflow-y-auto">
              <pre className="m-0 text-[#E0E7FF] leading-relaxed whitespace-pre-wrap break-words">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            </div>
          </div>
        </div>
      );
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A2B48] via-[#2a3f5f] to-[#1A2B48] p-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-all group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-[#10B981]/10 to-[#7C3AED]/10 border border-white/10 rounded-3xl p-8 mb-12 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-2xl shadow-lg shadow-[#10B981]/20">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white tracking-tight">Correlation Intelligence</h1>
                <p className="text-gray-400 mt-1">
                  Topic: <span className="text-[#10B981] font-bold">{topic}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-[#7C3AED]" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">AI Analysis Active</span>
            </div>
          </div>
        </div>

        {/* Recommendations Loop */}
        <div className="space-y-12">
          {recommendations.map((item: any, index: number) => {
            // New structured format from backend
            const qObj = item.original_question;
            let questionText = typeof qObj === 'string' ? qObj : qObj.text;
            const options = Array.isArray(qObj?.options) ? qObj.options : [];
            
            // HEURISTIC SAFETY NET: If the AI forgot to wrap code in backticks, do it manually
            // We look for common code patterns like 'class X {', 'public static', etc.
            const codePatterns = [
              /class\s+\w+\s*\{/,
              /public\s+static\s+void/,
              /System\.out\.println/,
              /\{[\s\S]*\}/ // Any block with curly braces
            ];
            
            const looksLikeUnwrappedCode = codePatterns.some(pattern => pattern.test(questionText)) && !questionText.includes('```');
            
            if (looksLikeUnwrappedCode) {
              // Try to find where the code starts (usually after a label like '2.2')
              const codeStartMatch = questionText.match(/(\d+\.\d+)\s+([\s\S]*)/);
              if (codeStartMatch) {
                questionText = `${codeStartMatch[1]}\n\n\`\`\`java\n${codeStartMatch[2]}\n\`\`\``;
              } else {
                questionText = `\`\`\`java\n${questionText}\n\`\`\``;
              }
            }
            
            return (
              <div key={index} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Left Side - The Exam Pattern (The "Trigger") */}
                <div className="lg:col-span-5 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center">
                      <Terminal className="w-4 h-4 text-[#7C3AED]" />
                    </div>
                    <h2 className="text-lg font-bold text-white uppercase tracking-wider">Exam Pattern</h2>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Parent context badge (e.g. "2. Short Questions – 28 marks") */}
                    {qObj?.parent_context && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#7C3AED]/10 border border-[#7C3AED]/20">
                        <span className="text-[10px] text-[#A78BFA] font-black uppercase tracking-widest">Context</span>
                        <span className="text-xs text-gray-400 font-medium">{qObj.parent_context}</span>
                      </div>
                    )}
                    <div className="text-gray-200 text-lg leading-relaxed font-medium">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                        {questionText}
                      </ReactMarkdown>
                    </div>

                    {options.length > 0 && (
                      <div className="grid grid-cols-1 gap-3">
                        {options.map((option: string, optIndex: number) => (
                          <div
                            key={optIndex}
                            className="p-4 rounded-xl border border-white/5 bg-white/5 text-gray-300 flex items-center gap-4 transition-all"
                          >
                            <div className="w-6 h-6 rounded-md bg-[#7C3AED]/20 text-[#7C3AED] flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                              {String.fromCharCode(97 + optIndex)}
                            </div>
                            <span className="text-sm">{option}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-8">
                    <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">
                      Pattern Source: Historical Exams
                    </p>
                  </div>
                </div>

                {/* Right Side - The AI Recommendation (The "Foundation") */}
                <div className="lg:col-span-7 backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl overflow-hidden shadow-2xl transition-all hover:border-white/30">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-8 h-8 rounded-lg bg-[#10B981]/20 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-[#10B981]" />
                      </div>
                      <h2 className="text-lg font-bold text-white uppercase tracking-wider">Study Recommendation</h2>
                    </div>
                    
                    <div className="prose prose-invert max-w-none text-gray-200">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents}
                      >
                        {item.recommendation}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <div className="px-8 py-4 bg-white/5 border-t border-white/10 flex justify-between items-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking widest font-bold">
                      Textbook Semantic Mapping
                    </p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse"></div>
                      <span className="text-[10px] text-[#10B981] font-bold uppercase">Confidence: High</span>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Footer Disclaimer */}
        <div className="mt-20 py-12 border-t border-white/10 text-center">
          <p className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">
            AlphaLo AI Intelligence. These correlations are generated by analyzing historical exam patterns against textbook semantic embeddings. Always refer to your course syllabus.
          </p>
        </div>
      </div>
    </div>
  );
}