// MyReports page - shows a table of the current user's reports

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'

export default function MyReports() {
  var [reports, setReports] = useState([])
  var [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/reports/my')
      .then(function(res) {
        console.log('my reports data:', res.data)
        var list = Array.isArray(res.data) ? res.data : (res.data.reports || [])
        setReports(list)
      })
      .catch(function(err) {
        console.log('couldnt fetch reports', err)
      })
      .finally(function() {
        setLoading(false)
      })
  }, [])

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this draft?")) return
    try {
      await api.delete(`/reports/${id}`)
      setReports(reports.filter(r => (r.id || r._id) != id))
    } catch (err) {
      console.log('failed to delete', err)
      alert('Could not delete report')
    }
  }

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto p-4 mt-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Reports</h1>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading your reports...</div>
        ) : reports.length == 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
            You haven't submitted any reports yet.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Week</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Project</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Tasks Completed</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Hours</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Submitted</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(function(r, index) {
                  return (
                    <tr key={r._id || r.id || index} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {r.week_start || r.weekStart || '?'} — {r.week_end || r.weekEnd || '?'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {r.project?.name || r.project_name || r.project || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700" style={{maxWidth: '250px'}}>
                        <p className="truncate">{r.tasks_completed || r.tasksCompleted || '-'}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.hours_worked || r.hoursWorked || 0}h</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          r.status == 'approved' ? 'bg-green-100 text-green-700' :
                          r.status == 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {r.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {r.created_at || r.createdAt ? new Date(r.created_at || r.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right space-x-2">
                        {r.status == 'draft' ? (
                          <>
                            <Link to={`/edit-report/${r.id || r._id}`} className="text-indigo-600 hover:text-indigo-900 hover:underline">Edit</Link>
                            <button onClick={() => handleDelete(r.id || r._id)} className="text-red-600 hover:text-red-900 hover:underline">Delete</button>
                          </>
                        ) : (
                          <Link to={`/edit-report/${r.id || r._id}`} className="text-gray-600 hover:text-gray-900 hover:underline">View</Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
