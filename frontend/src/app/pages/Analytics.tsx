import { useNavigate } from 'react-router';
import { ArrowLeft, TrendingUp, AlertCircle, Target, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { topics, performanceData } from '../data/mockData';

export default function Analytics() {
  const navigate = useNavigate();

  // Prepare data for the chart
  const chartData = topics.map(topic => ({
    name: topic.topic.length > 20 ? topic.topic.substring(0, 20) + '...' : topic.topic,
    score: performanceData[topic.id as keyof typeof performanceData]?.score || 0,
    attempts: performanceData[topic.id as keyof typeof performanceData]?.attempts || 0,
  }));

  // Calculate overall stats
  const totalAttempts = Object.values(performanceData).reduce((sum, data) => sum + data.attempts, 0);
  const averageScore =
    Object.values(performanceData).reduce((sum, data) => sum + data.score, 0) /
    Object.values(performanceData).filter(data => data.attempts > 0).length || 0;
  const topicsAttempted = Object.values(performanceData).filter(data => data.attempts > 0).length;

  // Find weak spots (score < 70 and attempted)
  const weakSpots = topics.filter(topic => {
    const perf = performanceData[topic.id as keyof typeof performanceData];
    return perf.attempts > 0 && perf.score < 70;
  });

  // Find strong areas (score >= 80)
  const strongAreas = topics.filter(topic => {
    const perf = performanceData[topic.id as keyof typeof performanceData];
    return perf.attempts > 0 && perf.score >= 80;
  });

  const getBarColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 70) return '#FBBF24';
    if (score > 0) return '#EF4444';
    return '#6B7280';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A2B48] via-[#2a3f5f] to-[#1A2B48] p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-white hover:text-[#7C3AED] mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-[#7C3AED]/20 to-[#10B981]/20 border border-white/20 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#7C3AED] to-[#9333EA] rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Performance Analytics</h1>
              <p className="text-gray-300">Track your progress and identify areas for improvement</p>
            </div>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-[#7C3AED]" />
              <h3 className="text-white font-semibold">Average Score</h3>
            </div>
            <p className="text-4xl font-bold text-white">{Math.round(averageScore)}%</p>
            <p className="text-gray-400 text-sm mt-1">Across all topics</p>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-[#10B981]" />
              <h3 className="text-white font-semibold">Topics Attempted</h3>
            </div>
            <p className="text-4xl font-bold text-white">{topicsAttempted}</p>
            <p className="text-gray-400 text-sm mt-1">Out of {topics.length} total</p>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white font-semibold">Total Attempts</h3>
            </div>
            <p className="text-4xl font-bold text-white">{totalAttempts}</p>
            <p className="text-gray-400 text-sm mt-1">Mock exams taken</p>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <h3 className="text-white font-semibold">Needs Review</h3>
            </div>
            <p className="text-4xl font-bold text-white">{weakSpots.length}</p>
            <p className="text-gray-400 text-sm mt-1">Topics below 70%</p>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Knowledge Heatmap</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="name"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(26, 43, 72, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#10B981] rounded"></div>
              <span className="text-gray-300">80%+ (Strong)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#FBBF24] rounded"></div>
              <span className="text-gray-300">70-79% (Good)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#EF4444] rounded"></div>
              <span className="text-gray-300">&lt;70% (Needs Review)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#6B7280] rounded"></div>
              <span className="text-gray-300">Not Attempted</span>
            </div>
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-[#7C3AED]/10 to-[#9333EA]/10 border border-[#7C3AED]/30 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#7C3AED]/20 rounded-lg mt-1">
              <AlertCircle className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-2">AI Recommendation</h3>
              <p className="text-gray-300 mb-4">
                Based on your performance, we suggest reviewing the following topics:
              </p>
              <div className="space-y-2">
                {weakSpots.length > 0 ? (
                  weakSpots.map(topic => (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between p-3 bg-white/5 border border-white/20 rounded-lg"
                    >
                      <div>
                        <div className="text-white font-medium">{topic.topic}</div>
                        <div className="text-sm text-gray-400">
                          Current Score: {performanceData[topic.id as keyof typeof performanceData].score}% • {performanceData[topic.id as keyof typeof performanceData].attempts} attempts
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/mock/${topic.id}`)}
                        className="px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:shadow-lg text-white rounded-lg text-sm transition-all"
                      >
                        Practice Now
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-[#10B981]">
                    🎉 Great job! All attempted topics are above 70%. Keep practicing the remaining topics.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Strong Areas */}
        {strongAreas.length > 0 && (
          <div className="backdrop-blur-xl bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#10B981]" />
              Your Strong Areas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {strongAreas.map(topic => (
                <div
                  key={topic.id}
                  className="p-4 bg-white/5 border border-white/20 rounded-lg"
                >
                  <div className="text-white font-medium mb-1">{topic.topic}</div>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-[#10B981]">
                      {performanceData[topic.id as keyof typeof performanceData].score}%
                    </div>
                    <div className="text-sm text-gray-400">
                      {performanceData[topic.id as keyof typeof performanceData].attempts} attempts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
