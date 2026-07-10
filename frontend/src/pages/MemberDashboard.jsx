// MemberDashboard - main page for team members
// shows welcome message, stats, and recent reports

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';

function MemberDashboard() {
  var [reports, setReports] = useState([]);
  var [stats, setStats] = useState({ total: 0, thisWeek: 0, totalHours: 0 });
  var [loading, setLoading] = useState(true);

  var user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(function() {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      var res = await api.get('/reports');
      var data = res.data;
      console.log('fetched reports:', data);
      
      // if data is array use it directly, otherwise check for .reports
      var reportsList = Array.isArray(data) ? data : (data.reports || []);
      setReports(reportsList);

      // calculate some stats
      var totalHrs = 0;
      var thisWeekCount = 0;
      var now = new Date();
      var weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      reportsList.forEach(function(r) {
        totalHrs += r.hours_worked || r.hoursWorked || 0;
        var createdDate = new Date(r.created_at || r.createdAt || r.week_start);
        if (createdDate >= weekAgo) {
          thisWeekCount++;
        }
      });

      setStats({
        total: reportsList.length,
        submitted: reportsList.filter(r => r.status == 'submitted').length,
        drafts: reportsList.filter(r => r.status == 'draft').length,
        thisWeek: thisWeekCount,
        totalHours: totalHrs
      });
    } catch(err) {
      console.log('error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500 text-lg">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto p-4 mt-4">
        {/* welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user.name || 'User'}! 👋</h1>
          <p className="text-gray-500 mt-1">Here's your weekly report overview</p>
        </div>

        {/* stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Total Reports</p>
            <p className="text-3xl font-bold text-indigo-600">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Submitted</p>
            <p className="text-3xl font-bold text-green-600">{stats.submitted || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Drafts</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.drafts || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Total Hours Logged</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalHours}</p>
          </div>
        </div>

        {/* quick action */}
        <div className="mb-8">
          <Link
            to="/create-report"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium shadow"
          >
            + Create New Report
          </Link>
        </div>

        {/* recent reports */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Recent Reports</h2>
          </div>
          {reports.length == 0 ? (
            <div className="p-8 text-center text-gray-400">
              No reports yet. Create your first one!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Week</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Project</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Hours</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.slice(0, 5).map(function(report, idx) {
                    return (
                      <tr key={report._id || report.id || idx} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {report.week_start || report.weekStart || 'N/A'} - {report.week_end || report.weekEnd || ''}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {report.project?.name || report.project_name || report.project || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {report.hours_worked || report.hoursWorked || 0}h
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (report.status == 'submitted') ? 'bg-green-100 text-green-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {report.status || 'draft'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {reports.length > 5 && (
            <div className="p-4 border-t text-center">
              <Link to="/my-reports" className="text-indigo-600 hover:underline text-sm">View all reports →</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default MemberDashboard;
