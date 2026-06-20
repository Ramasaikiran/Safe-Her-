import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import AuthCallback from './pages/AuthCallback'
import Onboarding from './pages/Onboarding'
import Guides from './pages/Guides'
import Hostels from './pages/Hostels'
import Dashboard from './pages/Dashboard'
import BookGuide from './pages/BookGuide'
import BookHostel from './pages/BookHostel'
import SOS from './pages/SOS'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#FBF7F4',fontFamily:'DM Sans,sans-serif',color:'#E8445A',fontSize:'1.2rem'}}>Loading SafeShe...</div>
  if (!user) return <Navigate to="/login" replace />
  if (profile && !profile.onboarding_completed) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#FBF7F4',fontFamily:'DM Sans,sans-serif',color:'#E8445A',fontSize:'1.2rem'}}>Loading SafeShe...</div>
  if (!user) return <Navigate to="/login" replace />
  if (profile?.onboarding_completed) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
        <Route path="/guides" element={<Guides />} />
        <Route path="/hostels" element={<Hostels />} />
        <Route path="/book/guide/:id" element={<ProtectedRoute><BookGuide /></ProtectedRoute>} />
        <Route path="/book/hostel/:id" element={<ProtectedRoute><BookHostel /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/sos" element={<SOS />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" toastOptions={{ style: { fontFamily: 'DM Sans,sans-serif', borderRadius: '12px' } }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
