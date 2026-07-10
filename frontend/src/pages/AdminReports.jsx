// AdminReports - shows all reports for admin with filters
// day 3 updated version

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'

function AdminReports() {
  var [reports, setReports] = useState([])
  var [projects, setProjects] = useState([])
  var [loading, setLoading] = useState(true)
  var [filterProject, setFilterProject] = useState('')
  var [filterStatus, setFilterStatus] = useState('')
  var [filterUser, setFilterUser] = useState('')
  var [filterDateFrom, setFilterDateFrom] = useState('')
  var [filterDateTo, setFilterDateTo] = useState('')

  useEffect(function() {
    Promise.all([
      api.get('/reports'),
      api.get('/projects')
    ]).then(function([reportsRes, projectsRes]) {
      var rList = Array.isArray(reportsRes.data) ? reportsRes.data : (reportsRes.data.reports || [])
      var pList = Array.isArray(projectsRes.data) ? projectsRes.data : (projectsRes.data.projects || [])
      setReports(rList)
      setProjects(pList)
      console.log('loaded', rList.length, 'reports for admin')
    }).catch(function(err) {
      console.log('error loading admin reports', err)
    }).finally(function() {
      setLoading(false)
    })
  }, [])

  // apply filters
  var filtered = reports.filter(function(r) {
    var ok = true
    if (filterProject) {
      ok = ok && (r.project_id == filterProject || r.project?.id == filterProject)
    }
    if (filterStatus) {
      ok = ok && (r.status || 'draft') == filterStatus
    }
    if (filterUser) {
      var uName = (r.user?.name || '').toLowerCase()
      ok = ok && uName.includes(filterUser.toLowerCase())
    }
    if (filterDateFrom) {
      ok = ok && (r.week_start || '') >= filterDateFrom
    }
    if (filterDateTo) {
      ok = ok && (r.week_end || r.week_start || '') <= filterDateTo
    }
    return ok
  })

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto p-4 mt-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">All Reports</h1>

        {/* filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Search by Employee</label>
              <input
                type="text"
                value={filterUser}
                onChange={e => setFilterUser(e.target.value)}
                placeholder="Employee name..."
                className="border border-gray-300 rounded px-3 py-1.5 text-sm w-48"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Project</label>
              <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm">
                <option value="">All Projects</option>
                {projects.map(function(p) {
                  return <option key={p.id} value={p.id}>{p.name}</option>
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm">
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm" />
            </div>
            {(filterUser || filterProject || filterStatus || filterDateFrom || filterDateTo) && (
              <button
                onClick={() => { setFilterUser(''); setFilterProject(''); setFilterStatus(''); setFilterDateFrom(''); setFilterDateTo('') }}
                className="text-sm text-indigo-600 hover:underline pb-1"
              >Clear all</button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading reports...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Employee</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Week</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Project</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Tasks Done</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Hours</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Blockers</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length == 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">No reports found</td>
                  </tr>
                ) : (
                  filtered.map(function(r, idx) {
                    return (
                      <tr key={r.id || idx} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                          {r.user?.name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {r.week_start || '?'} — {r.week_end || '?'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {r.project?.name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600" style={{maxWidth: '200px'}}>
                          <p className="truncate">{r.tasks_completed || '-'}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {r.hours_worked || 0}h
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600" style={{maxWidth: '150px'}}>
                          <p className="truncate">{r.blockers || '-'}</p>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            r.status == 'submitted' ? 'bg-green-100 text-green-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {r.status || 'draft'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <Link to={`/edit-report/${r.id}`} className="text-indigo-600 hover:underline">
                            View
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

export default AdminReports
