import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Biodatas from './pages/Biodatas'
import Payments from './pages/Payments'
import Refunds from './pages/Refunds'
import Users from './pages/Users'
import Settings from './pages/Settings'
import ContactPurchases from './pages/ContactPurchases'
import UnverifiedBiodatas from './pages/UnverifiedBiodatas'
import Login from './pages/Login'
import { useAuthStore } from './store/authStore'

function App() {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/biodatas" element={<Biodatas />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/refunds" element={<Refunds />} />
        <Route path="/users" element={<Users />} />
        <Route path="/contact-purchases" element={<ContactPurchases />} />
        <Route path="/unverified-biodatas" element={<UnverifiedBiodatas />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
