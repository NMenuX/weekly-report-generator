// CreateReport page
// form to submit a new weekly report

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { getErrorMessage } from '../api'
import Navbar from '../components/Navbar'

function CreateReport() {
  const navigate = useNavigate()
  var [projects, setProjects] = useState([])
  var [loading, setLoading] = useState(false)
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

  useEffect(() => {
    // fetch projects list
    api.get('/projects').then(function(res) {
      console.log('projects:', res.data)
      var list = Array.isArray(res.data) ? res.data : (res.data.projects || [])
      setProjects(list)
    }).catch(function(err) {
      console.log('failed to load projects', err)
    })

    // set default week dates (this monday to friday)
    var today = new Date()
    var dayOfWeek = today.getDay()
    var monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek == 0 ? 6 : dayOfWeek - 1))
    var friday = new Date(monday)
    friday.setDate(monday.getDate() + 4)
    
    setWeekStart(formatDate(monday))
    setWeekEnd(formatDate(friday))
  }, [])

  function formatDate(d) {
    var year = d.getFullYear()
    var month = String(d.getMonth() + 1).padStart(2, '0')
    var day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  async function handleSubmit(e, status) {
    e.preventDefault()
    
    // intern style basic validation
    if (!projectId || !weekStart || !weekEnd) {
      setError("Please fill out required fields")
      return
    }
    if (status == 'submitted' && (!tasksCompleted || !tasksPlanned)) {
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
        status: status
      }
      console.log('submitting report:', payload)

      await api.post('/reports', payload)
      setSuccess(true)
      
      // redirect after a moment
      setTimeout(function() {
        navigate('/my-reports')
      }, 1500)
    } catch(err) {
      console.log('create report error:', err)
      setError(getErrorMessage(err, 'Failed to create report'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto p-4 mt-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create Weekly Report</h1>

        {success && (
          <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4">
            ✅ Report submitted successfully! Redirecting...
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">{error}</div>
        )}

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
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Week End</label>
              <input
                type="date"
                value={weekEnd}
                onChange={e => setWeekEnd(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
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
              required
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
              required
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
              placeholder="https://docs.example.com, https://github.com/..."
            />
          </div>

          <div className="flex gap-3">
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
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 ml-auto"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export default CreateReport
