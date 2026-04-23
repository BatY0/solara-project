import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from '../features/auth/authContext'
import { useAuth } from '../features/auth/useAuth'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { FieldDetails } from './pages/FieldDetails'
import { AllFields } from './pages/AllFields'
import { VerifyEmail } from './pages/VerifyEmail'
import { Settings } from './pages/Settings'
import { Alerts } from './pages/Alerts'
import { CropGuideList } from './pages/CropGuideList'
import { CropGuideDetails } from './pages/CropGuideDetails'
import { CropGuideAdminList } from './pages/admin/CropGuideAdminList'
import { CropGuideAdminEditor } from './pages/admin/CropGuideAdminEditor'
import { EspDeviceAdminList } from './pages/admin/EspDeviceAdminList'

// Protected Route Component
const ProtectedRoute = () => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Or a proper spinner
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// Public-only Route Component (redirect signed-in users)
const PublicOnlyRoute = () => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Public-only auth pages */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/fields" element={<AllFields />} />
            <Route path="/fields/:id" element={<FieldDetails />} />
            <Route path="/guide" element={<CropGuideList />} />
            <Route path="/guide/:slug" element={<CropGuideDetails />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/admin/crop-guides" element={<CropGuideAdminList />} />
            <Route path="/admin/devices" element={<EspDeviceAdminList />} />
            <Route path="/admin/crop-guides/new" element={<CropGuideAdminEditor />} />
            <Route path="/admin/crop-guides/:id/edit" element={<CropGuideAdminEditor />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
