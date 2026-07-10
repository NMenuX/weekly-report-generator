// EditReport page
// form to edit a draft weekly report

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../api'
import Navbar from '../components/Navbar'

function EditReport() {
  const navigate = useNavigate()
  const { id } = useParams() // report ID from URL
  
  var [projects, setProjects] = useState([])
  var [loading, setLoading] = useState(false)
  var [initialLoading, setInitialLoading] = useState(true)
  var [error, setError] = useState('')
  var [success, setSuccess] = useState(false)

  // form fields
  var [weekStart, setWeekStart] = useState('')
  var [weekEnd, setWeekEnd] = useState('')
  var [projectId, setProjectId] = useState('')
  var [tasksCompleted, setTasksCompleted] = useState('')
  var [tasksPlanned, setTasksPlanned] = useState('')
  var [blockers, setBlockers] = useState('')
  var [hoursWorked, setHoursWorked] = useState('')
  var [notes, setNotes] = useState('')
  var [links, setLinks] = useState('')
  var [status, setStatus] = useState('')

  useEffect(() => {
    // fetch projects list
    api.get('/projects').then(function(res) {
      var list = Array.isArray(res.data) ? res.data : (res.data.projects || [])
      setProjects(list)
    }).catch(function(err) {
      console.log('failed to load projects', err)
    })

    // fetch the report data
    api.get(`/reports/${id}`).then(function(res) {
      var report = res.data
      
      if (report) {
        var user = JSON.parse(localStorage.getItem('user') || '{}')
        if (report.status != 'draft' && user.role != 'admin') {
          setError("This report is already submitted and cannot be edited")
        }
        
        setWeekStart(report.week_start || '')
        setWeekEnd(report.week_end || '')
        setProjectId(report.project_id || '')
        setTasksCompleted(report.tasks_completed || '')
        setTasksPlanned(report.tasks_planned || '')
        setBlockers(report.blockers || '')
        setHoursWorked(report.hours_worked || '')
        setNotes(report.notes || '')
        setLinks(report.links || '')
        setStatus(report.status || '')
      } else {
        setError("Report not found")
      }
    }).catch(function(err) {
      console.log('failed to load report', err)
      setError(getErrorMessage(err, "Failed to load report"))
    }).finally(function() {
      setInitialLoading(false)
    })
  }, [id])

  async function handleSubmit(e, newStatus) {
    e.preventDefault()
    
    var user = JSON.parse(localStorage.getItem('user') || '{}')
    if (status != 'draft' && user.role != 'admin') return
    
    // intern style basic validation
    if (!projectId || !weekStart || !weekEnd) {
      setError("Please fill out required fields")
      return
    }
    if (newStatus == 'submitted' && (!tasksCompleted || !tasksPlanned)) {
      setError("Completed and planned tasks are required to submit")
      return
    }

    setError('')
    setLoading(true)

    try {
      var payload = {
        week_start: weekStart,
        week_end: weekEnd,
        project_id: projectId,
        tasks_completed: tasksCompleted,
        tasks_planned: tasksPlanned,
        blockers: blockers,
        hours_worked: parseFloat(hoursWorked) || 0,
        notes: notes,
        links: links,
        status: newStatus
      }
      console.log('updating report:', payload)

      await api.put(`/reports/${id}`, payload)
      setSuccess(true)
      
      // redirect after a moment
      setTimeout(function() {
        navigate('/my-reports')
      }, 1500)
    } catch(err) {
      console.log('update report error:', err)
      setError(getErrorMessage(err, 'Failed to update report'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto p-4 mt-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Weekly Report</h1>

        {success && (
          <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4">
            ✅ Report updated successfully! Redirecting...
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">{error}</div>
        )}

        {initialLoading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <form className="bg-white rounded-lg shadow p-6">
            {/* week dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Week Start</label>
                <input
                  type="date"
                  value={weekStart}
                  onChange={e => setWeekStart(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={status != 'draft'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Week End</label>
                <input
                  type="date"
                  value={weekEnd}
                  onChange={e => setWeekEnd(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={status != 'draft'}
                />
              </div>
            </div>

            {/* project */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={status != 'draft'}
              >
                <option value="">-- Select a project --</option>
                {projects.map(function(proj) {
                  return (
                    <option key={proj._id || proj.id} value={proj._id || proj.id}>
                      {proj.name}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* tasks completed */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tasks Completed</label>
              <textarea
                value={tasksCompleted}
                onChange={e => setTasksCompleted(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="What did you finish this week?"
                disabled={status != 'draft'}
              />
            </div>

            {/* tasks planned */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tasks Planned for Next Week</label>
              <textarea
                value={tasksPlanned}
                onChange={e => setTasksPlanned(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="What do you plan to work on next?"
                disabled={status != 'draft'}
              />
            </div>

            {/* blockers */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Blockers / Issues</label>
              <textarea
                value={blockers}
                onChange={e => setBlockers(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Any blockers or issues?"
                disabled={status != 'draft'}
              />
            </div>

            {/* hours worked */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours Worked</label>
              <input
                type="number"
                value={hoursWorked}
                onChange={e => setHoursWorked(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="40"
                min="0"
                max="168"
                step="0.5"
                disabled={status != 'draft'}
              />
            </div>

            {/* notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Anything else to add?"
                disabled={status != 'draft'}
              />
            </div>

            {/* links */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Links (optional)</label>
              <input
                type="text"
                value={links}
                onChange={e => setLinks(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://docs.example.com"
                disabled={status != 'draft'}
              />
            </div>

            <div className="flex gap-3">
              {status == 'draft' && (
                <>
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, 'draft')}
                    disabled={loading || success}
                    className="bg-yellow-100 text-yellow-800 px-6 py-2 rounded-md hover:bg-yellow-200 disabled:opacity-50 font-medium"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, 'submitted')}
                    disabled={loading || success}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium"
                  >
                    {loading ? 'Wait...' : 'Submit Report'}
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 ml-auto"
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}

export default EditReport
