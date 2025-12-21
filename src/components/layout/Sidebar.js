import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Warehouse,
  Package,
  CreditCard,
  MapPin,
  Sprout,
  Star,
  Mail,
  Settings,
  FileText,
  LogOut,
  User,
  Building2,
  Leaf
} from 'lucide-react';
import './Sidebar.css';
import { getLogoUrl } from '../../utils/imageUtils';

const Sidebar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Admin menu items
  const adminMenuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/users', label: 'Users', icon: User },
    { path: '/warehouses', label: 'Warehouses', icon: Building2 },
    { path: '/inventory', label: 'Inventory', icon: Leaf },
    { path: '/transactions', label: 'Transactions', icon: CreditCard },
    { path: '/locations', label: 'Locations', icon: MapPin },
    { path: '/crop-types', label: 'Crop Types', icon: Sprout },
    { path: '/ratings', label: 'Ratings', icon: Star },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  // Farmer menu items
  const farmerMenuItems = [
    { path: '/farmer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/farmer/earnings', label: 'Earnings & Wallet', icon: CreditCard },
    { path: '/inventory', label: 'My Inventory', icon: Leaf },
    { path: '/enquiries', label: 'Purchase Enquiries', icon: Mail },
    { path: '/transactions', label: 'My Transactions', icon: CreditCard },
    { path: '/messages', label: 'Messages', icon: Mail },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  // Buyer menu items
  const buyerMenuItems = [
    { path: '/buyer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/inventory', label: 'Browse Crops', icon: Leaf },
    { path: '/transactions', label: 'My Purchases', icon: CreditCard },
    { path: '/receipts', label: 'Receipts', icon: FileText },
    { path: '/messages', label: 'Messages', icon: Mail },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/settings', label: 'Settings', icon: Settings },
    { path: '/transactions', label: 'Payments', icon: CreditCard },
  ];

  // Storekeeper menu items
  const storekeeperMenuItems = [
    { path: '/storekeeper/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/storekeeper/shipments', label: 'Shipments', icon: Package },
    { path: '/inventory', label: 'Warehouse Inventory', icon: Leaf },
    { path: '/transactions', label: 'Transactions', icon: CreditCard },
    { path: '/messages', label: 'Messages', icon: Mail },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  // Get menu items based on user role
  const getMenuItems = () => {
    if (!user) return [];

    switch (user.userType) {
      case 'ADMIN':
        return adminMenuItems;
      case 'FARMER':
        return farmerMenuItems;
      case 'BUYER':
        return buyerMenuItems;
      case 'STOREKEEPER':
        return storekeeperMenuItems;
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo-link">
          <img src={getLogoUrl()} alt="Rangira Logo" className="sidebar-logo-img" />
          <span className="logo-text">rangira</span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`sidebar-menu-item ${isActive(item.path) ? 'active' : ''}`}
                >
                  <Icon size={20} className="sidebar-icon" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-profile">
          <Link to="/profile" className="sidebar-profile-link">
            {user?.profilePictureUrl ? (
              <img
                src={user.profilePictureUrl.startsWith('http')
                  ? user.profilePictureUrl
                  : user.profilePictureUrl.startsWith('/api/')
                    ? `http://localhost:8080${user.profilePictureUrl}`
                    : `http://localhost:8080/api/files/profile-pictures/${user.profilePictureUrl}`}
                alt="Profile"
                className="sidebar-profile-picture"
              />
            ) : (
              <div className="sidebar-profile-avatar">
                <User size={18} />
              </div>
            )}
            <div className="sidebar-profile-info">
              <span className="sidebar-profile-name">{user?.firstName} {user?.lastName}</span>
              <span className="sidebar-profile-role">{user?.userType}</span>
            </div>
          </Link>
        </div>
        <button onClick={handleLogout} className="sidebar-logout" title="Logout">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

