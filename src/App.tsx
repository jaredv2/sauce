import { createBrowserRouter, RouterProvider, Outlet, Navigate, useLocation } from 'react-router-dom'
import { Marketing } from './pages/Marketing'
import { Login } from './pages/Login'
import { Onboarding } from './pages/Onboarding'
import { Dashboard } from './pages/Dashboard'
import { Editor } from './pages/Editor'
import { PublicProfile } from './pages/PublicProfile'
import { SavedPages } from './pages/SavedPages'
import { Settings } from './pages/Settings'
import { Terms } from './pages/Terms'
import { Privacy } from './pages/Privacy'
import { Analytics } from './pages/Analytics'
import { Templates } from './pages/Templates'
import { RequireProfile, RequireNoProfile, PublicOnly, LandingRedirect } from './components/guards/RequireAuth'

function AnimatedLayout() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="page-enter">
      <Outlet />
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <AnimatedLayout />,
    children: [
      {
        path: '/',
        element: (
          <LandingRedirect>
            <Marketing />
          </LandingRedirect>
        ),
      },
      {
        path: '/login',
        element: (
          <PublicOnly>
            <Login />
          </PublicOnly>
        ),
      },
      {
        path: '/onboarding',
        element: (
          <RequireNoProfile>
            <Onboarding />
          </RequireNoProfile>
        ),
      },
      {
        path: '/dashboard',
        element: (
          <RequireProfile>
            <Dashboard />
          </RequireProfile>
        ),
      },
      {
        path: '/dashboard/pages',
        element: (
          <RequireProfile>
            <SavedPages />
          </RequireProfile>
        ),
      },
      {
        path: '/dashboard/pages/:pageId/edit',
        element: (
          <RequireProfile>
            <Editor />
          </RequireProfile>
        ),
      },
      {
        path: '/dashboard/templates',
        element: (
          <RequireProfile>
            <Templates />
          </RequireProfile>
        ),
      },
      {
        path: '/dashboard/analytics',
        element: (
          <RequireProfile>
            <Analytics />
          </RequireProfile>
        ),
      },
      {
        path: '/settings',
        element: (
          <RequireProfile>
            <Settings />
          </RequireProfile>
        ),
      },
      { path: '/terms', element: <Terms /> },
      { path: '/privacy', element: <Privacy /> },
      { path: '/p/:username', element: <PublicProfile /> },
      { path: '/:username', element: <PublicProfile /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
