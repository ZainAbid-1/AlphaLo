import { useLocation, useNavigate } from 'react-router';
import { ArrowLeft, BookOpen, Sparkles, AlertCircle, Terminal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function BookCorrelation() {
  const navigate = useNavigate();
  const location = useLocation();

  // Helper to parse question and extract options (e.g., "a. ... b. ...")
  const parseQuestion = (text: string) => {
    const optionsRegex = /\s([a-d])\.\s/gi;
    const parts = text.split(optionsRegex);
    
    if (parts.length > 1) {
      const questionText = parts[0].trim();
      const options: string[] = [];
      for (let i = 1; i < parts.length; i += 2) {
        if (parts[i+1]) {
          options.push(parts[i+1].trim());
        }
      }
      return { questionText, options };
    }
    return { questionText: text, options: [] };
  };

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
            const { questionText, options } = parseQuestion(item.original_question);
            
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
                    <div className="text-gray-200 text-lg leading-relaxed font-medium">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {questionText}
                      </ReactMarkdown>
                    </div>

                    {options.length > 0 && (
                      <div className="grid grid-cols-1 gap-3">
                        {options.map((option, optIndex) => (
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
                        components={{
                          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-white mb-4 mt-8 first:mt-0" {...props} />,
                          h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-[#10B981] mb-4 mt-8 first:mt-0 flex items-center gap-2" {...props} />,
                          h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-white/90 mb-3 mt-6" {...props} />,
                          p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-gray-300" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-2 text-gray-300" {...props} />,
                          li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                          strong: ({ node, ...props }) => <strong className="text-white font-bold" {...props} />,
                          code: ({ node, inline, className, children, ...props }: any) => {
                            const match = /language-(\w+)/.exec(className || '');
                            const language = match ? match[1] : '';
                            const content = String(children).replace(/\n$/, '');
                            const isMultiLine = content.includes('\n');
                            
                            const useMacWindow = !inline && (isMultiLine || (language && language !== 'code' && language !== 'text'));

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
                                    <div className="flex gap-1.5">
                                      <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40"></div>
                                      <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40"></div>
                                      <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40"></div>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{language || 'code'}</span>
                                  </div>
                                  <div className="p-6 overflow-x-auto">
                                    <pre className="m-0 text-[#E0E7FF] leading-relaxed">
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            );
                          },
                        }}
                      >
                        {item.recommendation}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <div className="px-8 py-4 bg-white/5 border-t border-white/10 flex justify-between items-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
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