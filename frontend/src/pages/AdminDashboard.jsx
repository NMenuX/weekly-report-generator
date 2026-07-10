// AdminDashboard.jsx
// the main admin page with charts and summary cards
// uses recharts for the graphs
// day 3 - full dashboard with analytics

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts'

// colors for the pie chart
const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

function AdminDashboard() {
  var [stats, setStats] = useState(null)
  var [reports, setReports] = useState([])
  var [employees, setEmployees] = useState([])
  var [projects, setProjects] = useState([])
  var [loading, setLoading] = useState(true)
  
  // filters
  var [filterProject, setFilterProject] = useState('')
  var [filterStatus, setFilterStatus] = useState('')
  var [filterEmployee, setFilterEmployee] = useState('')
  var [filterDateFrom, setFilterDateFrom] = useState('')
  var [filterDateTo, setFilterDateTo] = useState('')
  var [selectedWeekStart, setSelectedWeekStart] = useState('')

  useEffect(function() {
    loadAllData()
  }, [selectedWeekStart])

  function getMondayOfWeek(dateStr) {
    if (!dateStr) return ''
    var d = new Date(dateStr + 'T00:00:00')
    var day = d.getDay()
    var diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    return d.toISOString().slice(0, 10)
  }

  async function loadAllData() {
    setLoading(true)
    try {
      var statsParams = {}
      if (selectedWeekStart) {
        var weekStart = getMondayOfWeek(selectedWeekStart)
        var weekEndDate = new Date(weekStart + 'T00:00:00')
        weekEndDate.setDate(weekEndDate.getDate() + 4)
        statsParams.week_start = weekStart
        statsParams.week_end = weekEndDate.toISOString().slice(0, 10)
      }

      var [statsRes, reportsRes, employeesRes, projectsRes] = await Promise.all([
        api.get('/dashboard/stats', { params: statsParams }),
        api.get('/reports'),
        api.get('/users'),
        api.get('/projects')
      ])
      
      setStats(statsRes.data)
      
      var reportsList = Array.isArray(reportsRes.data) ? reportsRes.data : (reportsRes.data.reports || [])
      var empList = Array.isArray(employeesRes.data) ? employeesRes.data : (employeesRes.data.users || [])
      var projList = Array.isArray(projectsRes.data) ? projectsRes.data : (projectsRes.data.projects || [])
      
      console.log('admin dashboard loaded -', reportsList.length, 'reports,', empList.length, 'employees')
      
      setReports(reportsList)
      setEmployees(empList)
      setProjects(projList)
    } catch(err) {
      console.log('error loading admin dashboard', err)
    } finally {
      setLoading(false)
    }
  }

  // filter the reports for the table
  var filteredReports = reports.filter(function(r) {
    var matchProject = true
    var matchStatus = true
    var matchEmployee = true
    var matchDate = true
    
    if (filterProject) {
      matchProject = r.project_id == filterProject || r.project?.id == filterProject
    }
    if (filterStatus) {
      matchStatus = (r.status || 'draft') == filterStatus
    }
    if (filterEmployee) {
      var empName = (r.user?.name || '').toLowerCase()
      matchEmployee = empName.includes(filterEmployee.toLowerCase())
    }
    if (filterDateFrom) {
      var reportStart = r.week_start || ''
      matchDate = matchDate && reportStart >= filterDateFrom
    }
    if (filterDateTo) {
      var reportEnd = r.week_end || r.week_start || ''
      matchDate = matchDate && reportEnd <= filterDateTo
    }
    if (stats && stats.week_start && stats.week_end) {
      matchDate = matchDate && r.week_start == stats.week_start && r.week_end == stats.week_end
    }
    
    return matchProject && matchStatus && matchEmployee && matchDate
  })

  // build a simple "activity feed" from the reports
  function getRecentActivity() {
    // sort reports by id descending (newest first) and take last 8
    var sorted = [...reports].sort(function(a, b) {
      return (b.id || 0) - (a.id || 0)
    })
    return sorted.slice(0, 8)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500 text-lg">Loading dashboard...</p>
        </div>
      </>
    )
  }

  // use stats from backend or fallback to 0
  var s = stats || {}
  var totalReports = s.total_reports || 0
  var reportsThisWeek = s.reports_this_week || 0
  var submittedReports = s.submitted_reports || 0
  var draftReports = s.draft_reports || 0
  var totalMembers = s.total_members || 0
  var compliance = s.compliance || 0
  var openBlockers = s.open_blockers || 0
  var activeProjects = s.active_projects || 0
  var lateCount = s.late_count || 0
  var submissionTrend = s.submission_trend || []
  var tasksTrend = s.tasks_completed_trend || []
  var memberStatus = s.member_submission_status || []
  var workloadData = s.workload || []
  var projectDist = s.project_distribution || []

  var statusColors = { submitted: '#22c55e', pending: '#f59e0b', late: '#ef4444' }
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto p-4 mt-4">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Manager Dashboard</h1>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Selected Week (pick any day)</label>
            <input
              type="date"
              value={selectedWeekStart}
              onChange={e => setSelectedWeekStart(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            />
            {s.week_start && (
              <p className="text-xs text-gray-400 mt-1">Showing week: {s.week_start} — {s.week_end}</p>
            )}
          </div>
        </div>

        {/* ===== SECTION 1: SUMMARY CARDS ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-indigo-500">
            <p className="text-sm text-gray-500">Reports This Week</p>
            <p className="text-3xl font-bold text-indigo-600">{reportsThisWeek}</p>
            <p className="text-xs text-gray-400 mt-1">{totalReports} total reports overall</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Submission Compliance</p>
            <p className="text-3xl font-bold text-green-600">{compliance}%</p>
            <p className="text-xs text-gray-400 mt-1">{s.submitted_count || 0} submitted / {s.pending_count || 0} pending / {lateCount} late</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-red-500">
            <p className="text-sm text-gray-500">Open Blockers</p>
            <p className="text-3xl font-bold text-red-600">{openBlockers}</p>
            <p className="text-xs text-gray-400 mt-1">from submitted reports</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">Active Projects</p>
            <p className="text-3xl font-bold text-blue-600">{activeProjects}</p>
            <p className="text-xs text-gray-400 mt-1">{totalMembers} team members</p>
          </div>
        </div>

        {/* ===== SECTION 2: CHARTS ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* tasks completed trend */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Tasks Completed Trend</h3>
            {tasksTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={tasksTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{fontSize: 10}} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} dot={{r: 4}} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-12">No tasks data yet</p>
            )}
          </div>

          {/* submission trend line chart */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Submission Trend</h3>
            {submissionTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={submissionTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{fontSize: 10}} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{r: 4}} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-12">No submission data yet</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* member submission status */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Submission Status by Member</h3>
            {memberStatus.length > 0 ? (
              <div className="space-y-2">
                {memberStatus.map(function(m, i) {
                  return (
                    <div key={m.user_id || i} className="flex justify-between items-center py-2 px-3 rounded bg-gray-50">
                      <span className="text-sm font-medium text-gray-700">{m.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        m.status === 'submitted' ? 'bg-green-100 text-green-700' :
                        m.status === 'late' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-12">No team members yet</p>
            )}
          </div>

          {/* workload bar chart */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Workload Distribution</h3>
            {workloadData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={workloadData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{fontSize: 10}} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-12">No workload data yet</p>
            )}
          </div>

          {/* pie chart - reports by project */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Reports per Project</h3>
            {projectDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={projectDist}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={function(entry) { return entry.name }}
                  >
                    {projectDist.map(function(entry, i) {
                      return <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    })}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-12">No project data yet</p>
            )}
          </div>
        </div>

        {/* ===== SECTION 3: RECENT ACTIVITY ===== */}
        <div className="bg-white rounded-lg shadow p-4 mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Recent Activity</h3>
          {getRecentActivity().length == 0 ? (
            <p className="text-gray-400 text-sm">No recent activity.</p>
          ) : (
            <div className="space-y-2">
              {getRecentActivity().map(function(r, i) {
                var userName = r.user?.name || 'Someone'
                var projName = r.project?.name || 'a project'
                var action = r.status == 'submitted' ? 'submitted' : 'saved a draft for'
                var icon = r.status == 'submitted' ? '✅' : '📝'
                return (
                  <div key={r.id || i} className="flex items-center gap-3 py-2 px-3 rounded hover:bg-gray-50 text-sm">
                    <span>{icon}</span>
                    <span className="text-gray-700">
                      <strong>{userName}</strong> {action} a report on <strong>{projName}</strong>
                      {r.week_start ? ` (Week: ${r.week_start})` : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ===== SECTION 4: FILTERS + REPORTS TABLE ===== */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Employee</label>
              <input
                type="text"
                value={filterEmployee}
                onChange={e => setFilterEmployee(e.target.value)}
                placeholder="Search by name..."
                className="border border-gray-300 rounded px-3 py-1.5 text-sm w-44"
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
            {(filterEmployee || filterProject || filterStatus || filterDateFrom || filterDateTo) && (
              <button 
                onClick={() => { setFilterEmployee(''); setFilterProject(''); setFilterStatus(''); setFilterDateFrom(''); setFilterDateTo(''); }}
                className="text-sm text-indigo-600 hover:underline pb-1"
              >Clear all</button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto mb-8">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">
              Team Reports {filteredReports.length !== reports.length ? `(${filteredReports.length} filtered)` : `(${reports.length} total)`}
            </h2>
          </div>
          {filteredReports.length == 0 ? (
            <div className="p-8 text-center text-gray-400">No reports found</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Employee</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Project</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Week</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Hours</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Submitted</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.slice(0, 25).map(function(r, i) {
                  return (
                    <tr key={r.id || i} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">{r.user?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.project?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {r.week_start || '?'} — {r.week_end || '?'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.hours_worked || 0}h</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          r.status == 'submitted' ? 'bg-green-100 text-green-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {r.status || 'draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {r.week_start || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <Link to={`/edit-report/${r.id}`} className="text-indigo-600 hover:underline text-sm">
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}

export default AdminDashboard
