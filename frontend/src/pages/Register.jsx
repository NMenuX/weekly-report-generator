// Register page
// new user registration form

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api, { getErrorMessage } from '../api'

function Register() {
  var [name, setName] = useState('')
  var [email, setEmail] = useState('')
  var [password, setPassword] = useState('')
  var [role, setRole] = useState('member')
  var [error, setError] = useState('')
  var [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async function(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      var res = await api.post('/register', {
        name: name,
        email: email,
        password: password,
        role: role
      })
      console.log('register success:', res.data)
      
      // store token and user data
      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('user', JSON.stringify(res.data.user))

      if (res.data.user.role == 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch(err) {
      console.log('register error', err)
      setError(getErrorMessage(err, 'Registration failed. Try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Create Account
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="John Doe"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@company.com"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="At least 6 characters"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-1">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="member">Team Member</option>
              <option value="admin">Admin / Manager</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
