import { useLocation, useNavigate } from 'react-router';
import { useState } from 'react';
import { GraduationCap, LogOut, Home, Compass, LayoutDashboard, Menu, X } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

const navLinks = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/wizard', label: 'Wizard', icon: Compass },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('selectedInstructorName');
    localStorage.removeItem('selectedInstructorId');
    localStorage.removeItem('selectedCourseId');
    localStorage.removeItem('selectedCourseName');
    localStorage.removeItem('selectedCourseCode');
    localStorage.removeItem('selectedUniversityName');
    navigate('/', { replace: true });
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#1A2240]/90 border-b border-white/8 shadow-lg shadow-black/20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 group"
          >
            <GraduationCap className="w-7 h-7 text-[#7C3AED] group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold text-white tracking-tight">
              Alpha<span className="text-[#7C3AED]">Lo</span>
            </span>
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-white bg-[#7C3AED]/20 shadow-inner'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#7C3AED]' : ''}`} />
                  {label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-[#7C3AED] to-[#10B981] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 rounded-xl text-gray-300 hover:text-red-400 text-sm font-medium transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/8 bg-[#1A2240]/98 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => {
                    navigate(path);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'text-white bg-[#7C3AED]/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#7C3AED]' : ''}`} />
                  {label}
                </button>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-white/5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
