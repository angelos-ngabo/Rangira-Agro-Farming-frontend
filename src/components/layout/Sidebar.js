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
  Leaf,
  ShoppingBag
} from 'lucide-react';
import './Sidebar.css';
import { getLogoUrl } from '../../utils/imageUtils';

const Sidebar = ({ className = '' }) => {
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

  

  const buyerMenuItems = [
    { path: '/buyer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/browse-crops', label: 'Browse Crops', icon: ShoppingBag },
    { path: '/transactions', label: 'My Purchases', icon: CreditCard },
    { path: '/receipts', label: 'Receipts', icon: FileText },
    { path: '/messages', label: 'Messages', icon: Mail },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  

  const storekeeperMenuItems = [
    { path: '/storekeeper/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/storekeeper/shipments', label: 'Shipments', icon: Package },
    { path: '/inventory', label: 'Warehouse Inventory', icon: Leaf },
    { path: '/transactions', label: 'Transactions', icon: CreditCard },
    { path: '/messages', label: 'Messages', icon: Mail },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  

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
    <aside className={`sidebar ${className}`}>
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
            {(user?.profilePictureUrl || user?.userProfile?.profilePictureUrl) ? (() => {
              const pictureUrl = user.profilePictureUrl || user.userProfile?.profilePictureUrl;
              const imageSrc = pictureUrl?.startsWith('http')
                ? pictureUrl
                : pictureUrl?.startsWith('/api/')
                  ? `http://localhost:8080${pictureUrl}`
                  : `http://localhost:8080/api/files/profile-pictures/${pictureUrl}`;
              return (
                <img
                  src={imageSrc}
                  alt="Profile"
                  className="sidebar-profile-picture"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextElementSibling) {
                      e.target.nextElementSibling.style.display = 'flex';
                    }
                  }}
                />
              );
            })() : (
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

