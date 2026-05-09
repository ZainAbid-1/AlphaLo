import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Database, UploadCloud, Plus, Book, FileText, School, Library, ArrowLeft, CheckCircle2, User, LogIn, ShieldAlert, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { supabase } from '../../services/supabaseClient';
  
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'curriculum' | 'uploads'>('curriculum');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/admin'
      }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const allowedEmails = (import.meta.env.VITE_ALLOWED_ADMIN_EMAILS || '').split(',').map((e: string) => e.trim().toLowerCase());
  const isAuthorized = session && allowedEmails.includes(session.user.email?.toLowerCase());

  // --- FORM STATES ---
  const[uniData, setUniData] = useState({ id: '', name: '' });
  const [courseData, setCourseData] = useState({ id: '', name: '', university_id: '' }); 
  // *** FIX 1: Changed courseId to course_id (snake_case) ***
  const [topicData, setTopicData] = useState({ course_id: '', id: '', week: '', topic: '' }); 
  const [instructorData, setInstructorData] = useState({ id: '', course_id: '', name: '', title: '', avatar: '' });
  
  const [uploadData, setUploadData] = useState({ 
    course_id: '', 
    instructor_id: '', 
    title: '', 
    type: 'textbook',
    paper_type: 'midterm' 
  }); 
  const[selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [resourceData, setResourceData] = useState({ 
  course_id: '', 
  instructor_id: '', 
  title: '', 
  url: '', 
  topic: '' 
});

  // --- API HANDLERS (Connects to your FastAPI admin.py) ---
  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleAddUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const params = new URLSearchParams(uniData).toString();
        const response = await api.post(`/admin/university?${params}`); 
        
        console.log('API Response:', response.data);
        showStatus('success', `University ${uniData.name} added successfully!`);
        setUniData({ id: '', name: '' });
    } catch (error: any) {
        showStatus('error', `Failed to add university. Server Message: ${error.response?.data?.detail || 'Unknown Error'}`);
        console.error(error);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const params = new URLSearchParams(courseData).toString();
        const response = await api.post(`/admin/course?${params}`); 
        
        console.log('API Response:', response.data);
        showStatus('success', `Course ${courseData.name} added successfully!`);
        setCourseData({ id: '', name: '', university_id: '' });
    } catch (error: any) {
        showStatus('error', `Failed to add course. Server Message: ${error.response?.data?.detail || 'Unknown Error'}`);
        console.error(error);
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const params = new URLSearchParams(topicData).toString();
        const response = await api.post(`/admin/topic?${params}`); 
        
        console.log('API Response:', response.data);
        showStatus('success', `Topic added to week ${topicData.week}!`);
        // *** FIX APPLIED: Resetting state key to course_id ***
        setTopicData({ course_id: '', id: '', week: '', topic: '' }); 
    } catch (error: any) {
        showStatus('error', `Failed to add topic. Server Message: ${error.response?.data?.detail || 'Unknown Error'}`);
        console.error(error);
    }
  };

  const handleAddInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const params = new URLSearchParams(instructorData).toString();
        const response = await api.post(`/admin/instructor?${params}`); 
        
        console.log('API Response:', response.data);
        showStatus('success', `Instructor ${instructorData.name} added successfully!`);
        setInstructorData({ id: '', course_id: '', name: '', title: '', avatar: '' });
    } catch (error: any) {
        showStatus('error', `Failed to add instructor. Server Message: ${error.response?.data?.detail || 'Unknown Error'}`);
        console.error(error);
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
      // YouTube Embed Logic helper
      let finalUrl = resourceData.url;
      if (finalUrl.includes("watch?v=")) {
        finalUrl = finalUrl.replace("watch?v=", "embed/");
      }

      const params = new URLSearchParams({
        ...resourceData,
        url: finalUrl
      }).toString();
      
      const response = await api.post(`/admin/resource?${params}`); 
      showStatus('success', `Resource "${resourceData.title}" added!`);
      setResourceData({ course_id: '', instructor_id: '', title: '', url: '', topic: '' });
  } catch (error: any) {
      showStatus('error', `Failed to add resource. ${error.response?.data?.detail || ''}`);
  }
};

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showStatus('error', 'Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    
    // *** FIX APPLIED: Using course_id from state ***
    const courseId = uploadData.course_id; 
    const instructorId = uploadData.instructor_id;
    const title = encodeURIComponent(uploadData.title);
    const type = uploadData.type;
    
    const endpoint = type === 'textbook' 
      ? `/admin/upload-textbook/${courseId}?title=${title}&instructor_id=${instructorId}`
      : `/admin/upload-past-paper/${courseId}?title=${title}&instructor_id=${instructorId}&paper_type=${uploadData.paper_type}`;
    
    try {
        setIsUploading(true);
        const response = await api.post(endpoint, formData); 
        console.log('API Response:', response.data);
        const isAccepted = response.data.status === 'Accepted';
        const msg = response.data.message || (isAccepted ? 'Processing in background...' : 'File processed successfully!');
        showStatus('success', msg);
        setSelectedFile(null);
        setUploadData({ 
          course_id: '', 
          instructor_id: '', 
          title: '', 
          type: 'textbook',
          paper_type: 'midterm'
        }); 
    } catch (error: any) {
        showStatus('error', `File upload failed. Server Message: ${error.response?.data?.detail || 'Unknown Error'}`);
        console.error(error);
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A2B48] via-[#2a3f5f] to-[#1A2B48] p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to App
            </button>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Database className="w-8 h-8 text-[#7C3AED]" />
              AlphaLo Admin Control
            </h1>
            <p className="text-gray-400 mt-1">Manage infrastructure, courses, and AI knowledge bases.</p>
          </div>

          {session && (
            <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10">
              <div className="text-right">
                <p className="text-white text-sm font-semibold">{session.user.email}</p>
                <button onClick={handleLogout} className="text-[#F87171] text-xs hover:underline">Log Out</button>
              </div>
              <div className="w-10 h-10 bg-[#7C3AED] rounded-full flex items-center justify-center text-white font-bold">
                {session.user.email?.[0].toUpperCase()}
              </div>
            </div>
          )}
        </div>

        {!session ? (
          <div className="max-w-md mx-auto mt-20 text-center backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-12 shadow-2xl">
            <ShieldAlert className="w-16 h-16 text-[#7C3AED] mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">Admin Access Required</h2>
            <p className="text-gray-400 mb-8">This area is restricted to authorized administrators only. Please sign in with your Google account to proceed.</p>
            <button 
              onClick={handleLogin}
              className="w-full py-4 bg-white text-gray-900 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-100 transition-all shadow-lg shadow-white/10"
            >
              <LogIn className="w-5 h-5" />
              Sign in with Google
            </button>
          </div>
        ) : !isAuthorized ? (
          <div className="max-w-md mx-auto mt-20 text-center backdrop-blur-xl bg-red-500/10 border border-red-500/20 rounded-3xl p-12 shadow-2xl">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">Access Denied</h2>
            <p className="text-gray-400 mb-8">The account <strong>{session.user.email}</strong> is not authorized to access this dashboard. If you believe this is an error, please contact the system administrator.</p>
            <button 
              onClick={handleLogout}
              className="w-full py-4 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-red-500/30 transition-all"
            >
              <LogIn className="w-5 h-5" />
              Sign out & Try Another Account
            </button>
          </div>
        ) : (
          <>
            {/* Status Toast */}
        {statusMessage && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border backdrop-blur-md animate-fade-in ${
            statusMessage.type === 'success' 
              ? 'bg-[#10B981]/20 border-[#10B981]/50 text-[#10B981]' 
              : 'bg-red-500/20 border-red-500/50 text-red-400'
          }`}>
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">{statusMessage.text}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'curriculum' 
                ? 'bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Library className="w-5 h-5" />
            Curriculum Setup
          </button>
          <button
            onClick={() => setActiveTab('uploads')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'uploads' 
                ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/30' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <UploadCloud className="w-5 h-5" />
            AI Knowledge Base Upload
          </button>
        </div>

        {/* --- TAB 1: CURRICULUM SETUP --- */}
        {activeTab === 'curriculum' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Add University */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 h-fit">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <School className="w-5 h-5 text-[#7C3AED]" /> Add University
              </h2>
              <form onSubmit={handleAddUniversity} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">University ID (e.g. nust-pk)</label>
                  <input type="text" required value={uniData.id} onChange={e => setUniData({...uniData, id: e.target.value})}
                    className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#7C3AED]" />
                </div>
                <div>
                  <label className="text-sm text-gray-400">University Name</label>
                  <input type="text" required value={uniData.name} onChange={e => setUniData({...uniData, name: e.target.value})}
                    className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#7C3AED]" />
                </div>
                <button type="submit" className="w-full py-2 bg-white/10 hover:bg-[#7C3AED] text-white rounded-lg transition-colors flex justify-center items-center gap-2">
                  <Plus className="w-4 h-4" /> Save University
                </button>
              </form>
            </div>

            {/* Add Course */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 h-fit">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Book className="w-5 h-5 text-[#10B981]" /> Add Course
              </h2>
              <form onSubmit={handleAddCourse} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Course ID (e.g. cs-oop)</label>
                  <input type="text" required value={courseData.id} onChange={e => setCourseData({...courseData, id: e.target.value})}
                    className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#10B981]" />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Course Name</label>
                  <input type="text" required value={courseData.name} onChange={e => setCourseData({...courseData, name: e.target.value})}
                    className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#10B981]" />
                </div>

                <div>
                  <label className="text-sm text-gray-400">University ID (Must match existing ID)</label>
                  <input type="text" required value={courseData.university_id} onChange={e => setCourseData({...courseData, university_id: e.target.value})}
                    className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#10B981]" />
                </div>

                <button type="submit" className="w-full py-2 bg-white/10 hover:bg-[#10B981] text-white rounded-lg transition-colors flex justify-center items-center gap-2">
                  <Plus className="w-4 h-4" /> Save Course
                </button>
              </form>
            </div>

            {/* Add Topic */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 h-fit">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-yellow-400" /> Add Syllabus Topic
              </h2>
              <form onSubmit={handleAddTopic} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Target Course ID</label>
                  <input type="text" required value={topicData.course_id} onChange={e => setTopicData({...topicData, course_id: e.target.value})}
                    className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-yellow-400" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm text-gray-400">Topic ID</label>
                    <input type="text" required placeholder="e.g. w1" value={topicData.id} onChange={e => setTopicData({...topicData, id: e.target.value})}
                      className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-yellow-400" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Week #</label>
                    <input type="number" required value={topicData.week} onChange={e => setTopicData({...topicData, week: e.target.value})}
                      className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-yellow-400" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Topic Name</label>
                  <input type="text" required value={topicData.topic} onChange={e => setTopicData({...topicData, topic: e.target.value})}
                    className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-yellow-400" />
                </div>
                <button type="submit" className="w-full py-2 bg-white/10 hover:bg-yellow-500 hover:text-gray-900 text-white rounded-lg transition-colors flex justify-center items-center gap-2">
                  <Plus className="w-4 h-4" /> Save Topic
                </button>
              </form>
            </div>

            {/* Add Instructor */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 h-fit">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" /> Add Instructor
              </h2>
              <form onSubmit={handleAddInstructor} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Instructor ID</label>
                  <input type="text" required placeholder="e.g. inst-jaudat" value={instructorData.id} onChange={e => setInstructorData({...instructorData, id: e.target.value})}
                    className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Target Course ID</label>
                  <input type="text" required value={instructorData.course_id} onChange={e => setInstructorData({...instructorData, course_id: e.target.value})}
                    className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Instructor Name</label>
                  <input type="text" required value={instructorData.name} onChange={e => setInstructorData({...instructorData, name: e.target.value})}
                    className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm text-gray-400">Title</label>
                    <input type="text" required placeholder="e.g. Professor" value={instructorData.title} onChange={e => setInstructorData({...instructorData, title: e.target.value})}
                      className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Avatar (Initials)</label>
                    <input type="text" required placeholder="e.g. JM" value={instructorData.avatar} onChange={e => setInstructorData({...instructorData, avatar: e.target.value})}
                      className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400" />
                  </div>
                </div>
                <button type="submit" className="w-full py-2 bg-white/10 hover:bg-blue-500 hover:text-white text-white rounded-lg transition-colors flex justify-center items-center gap-2">
                  <Plus className="w-4 h-4" /> Save Instructor
                </button>
              </form>
            </div>
            
            {/* Add Helping Resource */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 h-fit">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" /> Add Helping Resource
              </h2>
              <form onSubmit={handleAddResource} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" required placeholder="Course ID" value={resourceData.course_id} 
                    onChange={e => setResourceData({...resourceData, course_id: e.target.value})}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-emerald-400 outline-none" />
                  <input type="text" required placeholder="Instructor ID" value={resourceData.instructor_id} 
                    onChange={e => setResourceData({...resourceData, instructor_id: e.target.value})}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-emerald-400 outline-none" />
                </div>
                <input type="text" required placeholder="Video Title" value={resourceData.title} 
                  onChange={e => setResourceData({...resourceData, title: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-emerald-400 outline-none" />
                <input type="text" required placeholder="YouTube URL" value={resourceData.url} 
                  onChange={e => setResourceData({...resourceData, url: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-emerald-400 outline-none" />
                <input type="text" required placeholder="Topic (e.g. CSS Layouts)" value={resourceData.topic} 
                  onChange={e => setResourceData({...resourceData, topic: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-emerald-400 outline-none" />
                
                <button type="submit" className="w-full py-2 bg-white/10 hover:bg-emerald-500 text-white rounded-lg transition-colors flex justify-center items-center gap-2">
                  <Plus className="w-4 h-4" /> Save Resource
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- TAB 2: AI KNOWLEDGE BASE UPLOADS --- */}
        {activeTab === 'uploads' && (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <UploadCloud className="w-12 h-12 text-[#10B981] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Feed the AI Engine</h2>
              <p className="text-gray-400 text-sm">Upload standard textbooks (for correlations) or past papers (for mock exam blueprints). PDFs will be vectorized and sent to Pinecone.</p>
            </div>

            <form onSubmit={handleFileUpload} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white font-medium">Document Type</label>
                  <select 
                    value={uploadData.type} 
                    onChange={e => setUploadData({...uploadData, type: e.target.value})}
                    className="w-full mt-2 px-4 py-3 bg-[#1A2B48] border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#10B981]"
                  >
                    <option value="textbook">Textbook / Reference Book</option>
                    <option value="past_paper">Instructor's Past Paper</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-white font-medium">Target Course ID</label>
                  {/* *** FIX APPLIED: Using course_id from state *** */}
                  <input 
                    type="text" required placeholder="e.g. cs-oop-java"
                    value={uploadData.course_id} 
                    onChange={e => setUploadData({...uploadData, course_id: e.target.value})}
                    className="w-full mt-2 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#10B981]" 
                  />
                </div>
                <div>
                  <label className="text-sm text-white font-medium">Instructor ID</label>
                  <input 
                    type="text" required placeholder="e.g. jaudat"
                    value={uploadData.instructor_id} 
                    onChange={e => setUploadData({...uploadData, instructor_id: e.target.value})}
                    className="w-full mt-2 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#10B981]" 
                  />
                </div>
                {uploadData.type === 'past_paper' && (
                <div className="col-span-2">
                  <label className="text-sm text-white font-medium">Paper Category</label>
                  <select 
                    value={uploadData.paper_type} 
                    onChange={e => setUploadData({...uploadData, paper_type: e.target.value})}
                    className="w-full mt-2 px-4 py-3 bg-[#1A2B48] border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#10B981]"
                  >
                    <option value="midterm">Mid-term Paper</option>
                    <option value="final">Final-term Paper</option>
                  </select>
                </div>
              )}
              </div>

              <div>
                <label className="text-sm text-white font-medium">Document Title</label>
                <input 
                  type="text" required placeholder={uploadData.type === 'textbook' ? "e.g. Java: The Complete Reference" : "e.g. Midterm 2023 - Prof. Jaudat"}
                  value={uploadData.title} 
                  onChange={e => setUploadData({...uploadData, title: e.target.value})}
                  className="w-full mt-2 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#10B981]" 
                />
              </div>

              {/* Drag & Drop Zone */}
              <div className="relative border-2 border-dashed border-white/30 rounded-2xl p-8 text-center hover:border-[#10B981] transition-colors bg-white/5">
                <input 
                  type="file" 
                  accept=".pdf,.png,.jpg,.jpeg" 
                  required
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                />
                <div className="pointer-events-none">
                  {selectedFile ? (
                    <div className="text-[#10B981] font-medium flex flex-col items-center gap-2">
                      <FileText className="w-8 h-8" />
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center gap-2">
                      <UploadCloud className="w-8 h-8 mb-2 text-white/50" />
                      <span className="text-white font-medium">Click to upload or drag and drop</span>
                      <span className="text-sm">PDF, PNG, JPG (Max 50MB)</span>
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isUploading}
                className={`w-full py-4 bg-gradient-to-r from-[#10B981] to-[#059669] hover:shadow-lg hover:shadow-[#10B981]/40 text-white rounded-xl font-bold transition-all flex justify-center items-center gap-2 ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <Database className={`w-5 h-5 ${isUploading ? 'animate-pulse' : ''}`} /> 
                {isUploading ? 'Processing & Vectorizing (This may take a minute)...' : 'Process & Vectorize Document'}
              </button>
            </form>
          </div>
        )}

          </>
        )}
      </div>
    </div>
  );
}