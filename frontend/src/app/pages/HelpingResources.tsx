import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Play, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';

export default function HelpingResources() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Call the Express API we just tested
    api.get(`/student/resources/${courseId}`)
      .then(res => setMaterials(res.data))
      .catch(err => console.error("Fetch error:", err))
      .finally(() => setLoading(false));
  }, [courseId]);

  return (
    <div className="min-h-screen bg-[#1A2B48] p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8">
          <ArrowLeft className="w-5 h-5" /> Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold mb-2">Helping Resources</h1>
        <p className="text-gray-400 mb-8">Curated video content to master this course.</p>
        <p className="text-gray-400 mb-8"> These resources are aligned with your course's and instructor's requirements.</p>

        {loading ? (
          <p>Loading videos...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {materials.map((video: any, index: number) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="aspect-video w-full">
                  <iframe 
                    className="w-full h-full"
                    src={video.url}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg">{video.title}</h3>
                  <p className="text-blue-400 text-sm">{video.topic}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}