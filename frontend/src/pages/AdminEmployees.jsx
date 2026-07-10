// AdminEmployees page - view team members
// day 3 - now shows report counts and submission status

import { useState, useEffect } from 'react'
import api from '../api'
import Navbar from '../components/Navbar'

export default function AdminEmployees() {
  var [employees, setEmployees] = useState([])
  var [reports, setReports] = useState([])
  var [loading, setLoading] = useState(true)

  useEffect(function() {
    Promise.all([
      api.get('/users'),
      api.get('/reports')
    ]).then(function([empRes, repRes]) {
      var empList = Array.isArray(empRes.data) ? empRes.data : (empRes.data.users || [])
      var repList = Array.isArray(repRes.data) ? repRes.data : (repRes.data.reports || [])
      setEmployees(empList)
      setReports(repList)
      console.log('loaded employees and reports for admin employees page')
    }).catch(function(err) {
      console.log('couldnt load employees', err)
    }).finally(function() {
      setLoading(false)
    })
  }, [])

  // helper to count reports for a user
  function getReportCountsForUser(userId) {
    var userReports = reports.filter(function(r) {
      return r.user_id == userId || r.user?.id == userId
    })
    var submitted = userReports.filter(r => r.status == 'submitted').length
    var drafts = userReports.filter(r => r.status == 'draft').length
    return { total: userReports.length, submitted: submitted, drafts: drafts }
  }

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto p-4 mt-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Team Members</h1>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading team members...</div>
        ) : employees.length == 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
            No team members found.
          </div>
        ) : (
          <>
            {/* table view */}
            <div className="bg-white rounded-lg shadow overflow-x-auto mb-6">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Employee</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Role</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Reports</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Submission Status</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(function(emp, i) {
                    var counts = getReportCountsForUser(emp.id || emp._id)
                    var hasSubmitted = counts.submitted > 0
                    return (
                      <tr key={emp.id || emp._id || i} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                              style={{backgroundColor: '#6366f1'}}
                            >
                              {(emp.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{emp.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{emp.email}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            emp.role == 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {emp.role || 'member'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {counts.total} total ({counts.submitted} submitted, {counts.drafts} drafts)
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {emp.role == 'admin' ? (
                            <span className="text-xs text-gray-400">N/A</span>
                          ) : hasSubmitted ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">Active</span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">No submissions</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {emp.created_at ? new Date(emp.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  )
}
