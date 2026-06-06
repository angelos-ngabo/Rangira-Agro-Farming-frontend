import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';
import Footer from './components/layout/Footer';
import DashboardFooter from './components/layout/DashboardFooter';



import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import TestimonialsPage from './pages/TestimonialsPage';
import ContactPage from './pages/ContactPage';
import BlogPage from './pages/BlogPage';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ResetPasswordDashboard from './pages/ResetPasswordDashboard';
import TwoFactorAuth from './pages/auth/TwoFactorAuth';
import OtpVerification from './pages/auth/OtpVerification';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import BuyerDashboard from './pages/dashboards/BuyerDashboard';
import StorekeeperDashboard from './pages/dashboards/StorekeeperDashboard';
import FarmerDashboard from './pages/dashboards/FarmerDashboard';
import BrowseCrops from './pages/BrowseCrops';
import Users from './pages/Users';
import Warehouses from './pages/Warehouses';
import Inventory from './pages/Inventory';
import Transactions from './pages/Transactions';
import Locations from './pages/Locations';
import CropTypes from './pages/CropTypes';
import Ratings from './pages/Ratings';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Receipts from './pages/Receipts';
import FarmerEnquiries from './pages/FarmerEnquiries';
import FarmerEarnings from './pages/FarmerEarnings';
import StorekeeperShipments from './pages/StorekeeperShipments';
import Payment from './pages/Payment';
import AddWarehouse from './pages/forms/AddWarehouse';
import EditWarehouse from './pages/forms/EditWarehouse';
import AddCropType from './pages/forms/AddCropType';
import EditCropType from './pages/forms/EditCropType';
import WarehouseAccessApplication from './pages/forms/WarehouseAccessApplication';
import EditWarehouseAccess from './pages/forms/EditWarehouseAccess';
import RegisterStorekeeper from './pages/forms/RegisterStorekeeper';
import AddInventory from './pages/forms/AddInventory';
import EditUser from './pages/forms/EditUser';
import InventoryRequestForm from './pages/forms/InventoryRequestForm';
import InventoryRequests from './pages/InventoryRequests';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import ChangePassword from './pages/ChangePassword';
import SystemTesting from './pages/SystemTesting';

function AppContent() {
  const location = useLocation();

  

  const isDashboardRoute = location.pathname.includes('/dashboard') ||
    location.pathname.includes('/users') ||
    location.pathname.includes('/warehouses') ||
    location.pathname.includes('/browse-crops') ||
    location.pathname.includes('/inventory') ||
    location.pathname.includes('/transactions') ||
    location.pathname.includes('/crop-types') ||
    location.pathname.includes('/ratings') ||
    location.pathname.includes('/locations') ||
    location.pathname.includes('/profile') ||
    location.pathname.includes('/settings') ||
    location.pathname.includes('/messages') ||
    location.pathname.includes('/receipts') ||
    location.pathname.includes('/notifications') ||
    location.pathname.includes('/enquiries') ||
    location.pathname.includes('/farmer/earnings') ||
    location.pathname.includes('/storekeeper/shipments') ||
    location.pathname.includes('/payment/') ||
    location.pathname.includes('/warehouse-access/') ||
    location.pathname.includes('/users/register-storekeeper') ||
    location.pathname.includes('/users/edit/') ||
    location.pathname.includes('/warehouses/add') ||
    location.pathname.includes('/warehouses/edit/') ||
    location.pathname.includes('/crop-types/add') ||
    location.pathname.includes('/crop-types/edit/') ||
    location.pathname.includes('/inventory/add') ||
    location.pathname.includes('/inventory-requests') ||
    location.pathname.includes('/SystemTesting');

  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#2ea359',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <div style={{ flex: 1 }}>
        <Routes>
          {}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/testimonials" element={<TestimonialsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<OtpVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/dashboard/reset-password" element={<ProtectedRoute><ResetPasswordDashboard /></ProtectedRoute>} />
          <Route path="/2fa" element={<TwoFactorAuth />} />
          <Route path="/SystemTesting" element={<SystemTesting />} />

          {}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/buyer/dashboard"
            element={
              <RoleRoute allowedRoles={['BUYER']}>
                <BuyerDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/storekeeper/dashboard"
            element={
              <RoleRoute allowedRoles={['STOREKEEPER']}>
                <StorekeeperDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/farmer/dashboard"
            element={
              <RoleRoute allowedRoles={['FARMER']}>
                <FarmerDashboard />
              </RoleRoute>
            }
          />

          {}
          <Route
            path="/users"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <Users />
              </RoleRoute>
            }
          />
          <Route
            path="/locations"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <Locations />
              </RoleRoute>
            }
          />

          {}
          <Route
            path="/warehouses"
            element={
              <ProtectedRoute>
                <Warehouses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/browse-crops"
            element={
              <RoleRoute allowedRoles={['BUYER']}>
                <BrowseCrops />
              </RoleRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crop-types"
            element={
              <ProtectedRoute>
                <CropTypes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ratings"
            element={
              <ProtectedRoute>
                <Ratings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receipts"
            element={
              <RoleRoute allowedRoles={['BUYER']}>
                <Receipts />
              </RoleRoute>
            }
          />
          <Route
            path="/enquiries"
            element={
              <RoleRoute allowedRoles={['FARMER']}>
                <FarmerEnquiries />
              </RoleRoute>
            }
          />
          <Route
            path="/farmer/earnings"
            element={
              <RoleRoute allowedRoles={['FARMER']}>
                <FarmerEarnings />
              </RoleRoute>
            }
          />
          <Route
            path="/storekeeper/shipments"
            element={
              <RoleRoute allowedRoles={['STOREKEEPER']}>
                <StorekeeperShipments />
              </RoleRoute>
            }
          />
          <Route
            path="/payment/:transactionId"
            element={
              <RoleRoute allowedRoles={['BUYER']}>
                <Payment />
              </RoleRoute>
            }
          />

          {}
          <Route
            path="/warehouses/add"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <AddWarehouse />
              </RoleRoute>
            }
          />
          <Route
            path="/warehouses/edit/:id"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <EditWarehouse />
              </RoleRoute>
            }
          />
          <Route
            path="/crop-types/add"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <AddCropType />
              </RoleRoute>
            }
          />
          <Route
            path="/crop-types/edit/:id"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <EditCropType />
              </RoleRoute>
            }
          />
          <Route
            path="/warehouse-access/apply"
            element={
              <RoleRoute allowedRoles={['FARMER']}>
                <WarehouseAccessApplication />
              </RoleRoute>
            }
          />
          <Route
            path="/warehouse-access/edit/:id"
            element={
              <RoleRoute allowedRoles={['FARMER']}>
                <EditWarehouseAccess />
              </RoleRoute>
            }
          />
          <Route
            path="/users/register-storekeeper"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <RegisterStorekeeper />
              </RoleRoute>
            }
          />
          <Route
            path="/users/edit/:id"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <EditUser />
              </RoleRoute>
            }
          />
          <Route
            path="/inventory/add"
            element={
              <RoleRoute allowedRoles={['FARMER']}>
                <AddInventory />
              </RoleRoute>
            }
          />
          <Route
            path="/inventory-requests"
            element={
              <ProtectedRoute>
                <InventoryRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory-requests/create"
            element={
              <RoleRoute allowedRoles={['FARMER']}>
                <InventoryRequestForm />
              </RoleRoute>
            }
          />

          {}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {isDashboardRoute ? <DashboardFooter /> : <Footer />}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

