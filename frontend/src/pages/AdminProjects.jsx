// AdminProjects.jsx - manage projects
// admins can view and add new projects

import { useState, useEffect } from 'react'
import api from '../api'
import Navbar from '../components/Navbar'

function AdminProjects() {
  var [projects, setProjects] = useState([])
  var [loading, setLoading] = useState(true)
  var [newName, setNewName] = useState('')
  var [newDescription, setNewDescription] = useState('')
  var [adding, setAdding] = useState(false)
  var [error, setError] = useState('')
  var [editingId, setEditingId] = useState(null)
  var [editName, setEditName] = useState('')
  var [editDesc, setEditDesc] = useState('')

  useEffect(() => {
    loadProjects()
  }, [])

  function loadProjects() {
    api.get('/projects')
      .then(res => {
        var list = Array.isArray(res.data) ? res.data : (res.data.projects || [])
        setProjects(list)
        console.log('loaded projects:', list.length)
      })
      .catch(err => {
        console.log('failed to load projects', err)
      })
      .finally(() => setLoading(false))
  }

  async function handleAddProject(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    setError('')
    
    try {
      var res = await api.post('/projects', {
        name: newName.trim(),
        description: newDescription.trim()
      })
      console.log('created project:', res.data)
      
      // add to list
      var created = res.data.project || res.data
      setProjects([...projects, created])
      setNewName('')
      setNewDescription('')
    } catch(err) {
      console.log('add project error', err)
      setError(err.response?.data?.message || 'Failed to add project')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(projectId) {
    if (!window.confirm('Are you sure you want to delete this project?')) return
    
    try {
      await api.delete(`/projects/${projectId}`)
      setProjects(projects.filter(p => (p._id || p.id) != projectId))
    } catch(err) {
      console.log('delete failed:', err)
      alert('Could not delete project')
    }
  }

  function startEdit(project) {
    setEditingId(project._id || project.id)
    setEditName(project.name)
    setEditDesc(project.description || '')
  }

  async function handleSaveEdit(projectId) {
    try {
      var res = await api.put(`/projects/${projectId}`, {
        name: editName.trim(),
        description: editDesc.trim()
      })
      setProjects(projects.map(p => (p._id || p.id) == projectId ? res.data : p))
      setEditingId(null)
    } catch(err) {
      console.log('edit failed:', err)
      alert('Could not update project')
    }
  }

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 mt-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Projects</h1>

        {/* add project form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Add New Project</h2>
          
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-3 text-sm">{error}</div>}
          
          <form onSubmit={handleAddProject} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Project name"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="text"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Description (optional)"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={adding}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
            >
              {adding ? 'Adding...' : '+ Add Project'}
            </button>
          </form>
        </div>

        {/* projects list */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading projects...</div>
        ) : projects.length == 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
            No projects yet. Add one above!
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="divide-y">
              {projects.map(function(project, i) {
                var projectId = project._id || project.id
                return (
                  <div key={projectId || i} className="p-4 hover:bg-gray-50">
                    {editingId == projectId ? (
                      <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="flex-1 border border-gray-300 rounded px-2 py-1"
                        />
                        <input
                          type="text"
                          value={editDesc}
                          onChange={e => setEditDesc(e.target.value)}
                          className="flex-1 border border-gray-300 rounded px-2 py-1"
                        />
                        <button onClick={() => handleSaveEdit(projectId)} className="text-green-600 hover:underline">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-gray-500 hover:underline">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-gray-800">{project.name}</h3>
                          {project.description && (
                            <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                          )}
                        </div>
                        <div className="space-x-3">
                          <button
                            onClick={() => startEdit(project)}
                            className="text-indigo-500 hover:text-indigo-700 text-sm hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(projectId)}
                            className="text-red-500 hover:text-red-700 text-sm hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default AdminProjects
