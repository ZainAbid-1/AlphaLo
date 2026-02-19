import { useState } from 'react';
import { useNavigate } from 'react-router';
import { GraduationCap, Sparkles, BookOpen, Target, ChevronRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/wizard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A2B48] via-[#2a3f5f] to-[#1A2B48] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-[#7C3AED] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#10B981] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left side - Value Proposition */}
        <div className="text-white space-y-6">
          <div className="flex items-center gap-2 mb-8">
            <GraduationCap className="w-10 h-10 text-[#7C3AED]" />
            <span className="text-3xl font-bold">AlphaLo</span>
          </div>

          <h1 className="text-5xl font-bold leading-tight">
            Prepare for exams,
            <br />
            <span className="text-[#7C3AED]">not just courses</span>
          </h1>

          <p className="text-xl text-gray-300">
            AI-powered exam prep synced to your specific instructor. Transform hidden past papers into custom mock exams and textbook-correlated study plans.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 bg-[#7C3AED]/20 rounded-lg backdrop-blur-sm border border-[#7C3AED]/30">
                <Sparkles className="w-5 h-5 text-[#7C3AED]" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Instructor-Specific AI</h3>
                <p className="text-gray-400">Mock exams that match your professor's exact testing style</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 bg-[#10B981]/20 rounded-lg backdrop-blur-sm border border-[#10B981]/30">
                <BookOpen className="w-5 h-5 text-[#10B981]" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Textbook Correlation</h3>
                <p className="text-gray-400">See exactly how your prof twists textbook concepts</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 bg-[#7C3AED]/20 rounded-lg backdrop-blur-sm border border-[#7C3AED]/30">
                <Target className="w-5 h-5 text-[#7C3AED]" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Pattern Recognition</h3>
                <p className="text-gray-400">Identify frequently tested topics and question types</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p className="text-gray-300">
              {isLogin ? 'Continue your exam prep journey' : 'Start preparing smarter today'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm text-white mb-2">Email</label>
              <input
                type="email"
                placeholder="your.email@university.edu"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent backdrop-blur-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-white mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent backdrop-blur-sm"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm text-white mb-2">Confirm Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent backdrop-blur-sm"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#7C3AED]/50 transition-all flex items-center justify-center gap-2 group"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-gray-300 hover:text-white transition-colors"
            >
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <span className="text-[#7C3AED] font-semibold">
                {isLogin ? 'Sign Up' : 'Sign In'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
