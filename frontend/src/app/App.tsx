import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from '../features/auth/authContext'
import { WebSocketProvider } from '../context/WebSocketContext'
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
import { AdminUserDashboard } from './pages/admin/AdminUserDashboard'

// Protected Route Component
const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Or a proper spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const AdminRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = String(user?.role ?? "").toUpperCase().includes("ADMIN");
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

// Public-only Route Component (redirect signed-in users)
const PublicOnlyRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (user) {
    const isAdmin = String(user?.role ?? "").toUpperCase().includes("ADMIN");
    return <Navigate to={isAdmin ? "/admin/users" : "/dashboard"} replace />;
  }

  return <Outlet />;
};

function App() {
  return (
      <AuthProvider>
        <WebSocketProvider>
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
                <Route path="/settings" element={<Settings />} />

                <Route element={<AdminRoute />}>
                  <Route path="/admin/users" element={<AdminUserDashboard />} />
                  <Route path="/admin/crop-guides" element={<CropGuideAdminList />} />
                  <Route path="/admin/devices" element={<EspDeviceAdminList />} />
                  <Route path="/admin/crop-guides/new" element={<CropGuideAdminEditor />} />
                  <Route path="/admin/crop-guides/:id/edit" element={<CropGuideAdminEditor />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </WebSocketProvider>
      </AuthProvider>
  )
}

export default App
