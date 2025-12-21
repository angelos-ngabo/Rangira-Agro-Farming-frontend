import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import Sidebar from '../../components/layout/Sidebar';
import NotificationBell from '../../components/dashboard/NotificationBell';
import WarehouseCapacityCard from '../../components/dashboard/WarehouseCapacityCard';
import {
  RevenueTrendChart,
  UserGrowthChart,
  InventoryDistributionChart,
  TransactionStatusChart,
} from '../../components/charts/DashboardCharts';
import {
  Users,
  Warehouse,
  Package,
  CreditCard,
  Activity,
  Plus,
  Settings,
  BarChart3,
  Bell,
  FileText,
  Download,
  TrendingUp,
  Search,
  Filter,
  Calendar,
  User,
  Building2,
  Leaf,
  FileDown,
  DollarSign,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../Dashboard.css';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('30days');

  const { data: stats, isLoading: statsLoading, refetch } = useQuery(
    'adminDashboardStats',
    async () => {
      try {
        const [users, warehouses, inventories, transactions] = await Promise.all([
          dataService.getUsers({ page: 0, size: 10000 }),
          dataService.getWarehouses({ page: 0, size: 10000 }),
          dataService.getInventories({ page: 0, size: 10000 }),
          dataService.getTransactions({ page: 0, size: 10000 }),
        ]);

        const usersList = users.data?.content || [];
        const warehousesList = warehouses.data?.content || [];
        const inventoriesList = inventories.data?.content || [];
        const transactionsList = transactions.data?.content || [];

        return {
          totalUsers: users.data?.totalElements || usersList.length || 0,
          totalWarehouses: warehouses.data?.totalElements || warehousesList.length || 0,
          totalInventories: inventories.data?.totalElements || inventoriesList.length || 0,
          totalTransactions: transactions.data?.totalElements || transactionsList.length || 0,
          users: usersList,
          warehouses: warehousesList,
          inventories: inventoriesList,
          transactions: transactionsList,
        };
      } catch (error) {
        toast.error('Failed to load dashboard data');
        return {
          totalUsers: 0,
          totalWarehouses: 0,
          totalInventories: 0,
          totalTransactions: 0,
          users: [],
          warehouses: [],
          inventories: [],
          transactions: [],
        };
      }
    },
    {
      refetchInterval: 30000,
      retry: 2,
      staleTime: 10000,
    }
  );

  const businessSummary = useMemo(() => {
    if (!stats) return null;

    const totalRevenue = stats.transactions?.reduce((sum, t) => {
      return sum + (t.paymentStatus === 'PAID' ? parseFloat(t.netAmount || t.totalAmount || 0) : 0);
    }, 0) || 0;

    const pendingPayments = stats.transactions?.filter(t => t.paymentStatus === 'PENDING').length || 0;
    const activeFarmers = stats.users?.filter(u => u.userType === 'FARMER' && u.status === 'ACTIVE').length || 0;
    const activeBuyers = stats.users?.filter(u => u.userType === 'BUYER' && u.status === 'ACTIVE').length || 0;
    const totalInventory = stats.inventories?.reduce((sum, inv) => {
      return sum + parseFloat(inv.remainingQuantityKg || 0);
    }, 0) || 0;

    return {
      totalUsers: stats.totalUsers,
      totalWarehouses: stats.totalWarehouses,
      totalInventories: stats.totalInventories,
      totalTransactions: stats.totalTransactions,
      totalRevenue,
      pendingPayments,
      activeFarmers,
      activeBuyers,
      totalInventory,
    };
  }, [stats]);

  const revenueTrendData = useMemo(() => {
    if (!stats?.transactions) return { labels: [], values: [] };

    const last30Days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last30Days.push(date.toISOString().split('T')[0]);
    }

    const dailyRevenue = last30Days.map(date => {
      return stats.transactions
        .filter(t => {
          const tDate = new Date(t.transactionDate).toISOString().split('T')[0];
          return tDate === date && t.paymentStatus === 'PAID';
        })
        .reduce((sum, t) => sum + parseFloat(t.netAmount || t.totalAmount || 0), 0);
    });

    return {
      labels: last30Days.map(d => {
        const date = new Date(d);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      values: dailyRevenue,
    };
  }, [stats]);

  const userGrowthData = useMemo(() => {
    if (!stats?.users) return { labels: [], values: [] };

    const last4Weeks = [];
    const today = new Date();
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      last4Weeks.push(weekStart);
    }

    const weeklyUsers = last4Weeks.map((weekStart, index) => {
      const weekEnd = index < 3 ? last4Weeks[index + 1] : today;
      return stats.users.filter(u => {
        const createdDate = new Date(u.createdAt || u.createdDate);
        return createdDate >= weekStart && createdDate < weekEnd;
      }).length;
    });

    return {
      labels: last4Weeks.map((w, index) => {
        return `Week ${4 - index}`;
      }),
      values: weeklyUsers,
    };
  }, [stats]);

  const inventoryDistributionData = useMemo(() => {
    if (!stats?.inventories) return { labels: [], values: [] };

    const cropTypeMap = {};
    stats.inventories.forEach(inv => {
      const cropType = inv.cropType?.cropName || 'Unknown';
      cropTypeMap[cropType] = (cropTypeMap[cropType] || 0) + parseFloat(inv.remainingQuantityKg || 0);
    });

    return {
      labels: Object.keys(cropTypeMap),
      values: Object.values(cropTypeMap),
    };
  }, [stats]);

  const transactionStatusData = useMemo(() => {
    if (!stats?.transactions) return { labels: [], values: [] };

    const statusCounts = {
      'PAID': 0,
      'PENDING': 0,
      'FAILED': 0,
    };

    stats.transactions.forEach(t => {
      const status = t.paymentStatus || 'PENDING';
      if (status === 'PAID') statusCounts['PAID']++;
      else if (status === 'PENDING') statusCounts['PENDING']++;
      else statusCounts['FAILED']++;
    });

    return {
      labels: ['Completed', 'Pending', 'Failed'],
      values: [statusCounts['PAID'], statusCounts['PENDING'], statusCounts['FAILED']],
    };
  }, [stats]);

  const recentActivity = useMemo(() => {
    if (!stats?.transactions) return [];

    const activities = stats.transactions
      .slice()
      .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        type: 'Transaction',
        action: 'Purchase',
        user: `${t.buyer?.firstName || ''} ${t.buyer?.lastName || ''}`.trim() || 'Unknown',
        amount: parseFloat(t.totalAmount || 0),
        status: t.paymentStatus,
        timestamp: new Date(t.transactionDate),
      }));

    if (stats.users) {
      const recentUsers = stats.users
        .slice()
        .sort((a, b) => new Date(b.createdAt || b.createdDate || 0) - new Date(a.createdAt || a.createdDate || 0))
        .slice(0, 5)
        .map(u => ({
          id: `user-${u.id}`,
          type: 'User',
          action: 'Registration',
          user: `${u.firstName} ${u.lastName}`,
          amount: null,
          status: u.status,
          timestamp: new Date(u.createdAt || u.createdDate),
        }));

      activities.push(...recentUsers);
    }

    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }, [stats]);

  const filteredActivity = useMemo(() => {
    if (!searchQuery) return recentActivity;

    const query = searchQuery.toLowerCase();
    return recentActivity.filter(activity =>
      activity.user.toLowerCase().includes(query) ||
      activity.action.toLowerCase().includes(query) ||
      activity.type.toLowerCase().includes(query)
    );
  }, [recentActivity, searchQuery]);

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: User,
      color: '#3b82f6',
      link: '/users',
    },
    {
      title: 'Warehouses',
      value: stats?.totalWarehouses || 0,
      icon: Building2,
      color: '#2ea359',
      link: '/warehouses',
    },
    {
      title: 'Inventory Items',
      value: stats?.totalInventories || 0,
      icon: Leaf,
      color: '#f59e0b',
      link: '/inventory',
    },
    {
      title: 'Transactions',
      value: stats?.totalTransactions || 0,
      icon: CreditCard,
      color: '#ef4444',
      link: '/transactions',
    },
  ];

  const quickActions = [
    {
      title: 'Add Warehouse',
      icon: Plus,
      link: '/warehouses/add',
      color: '#2ea359',
      tooltip: 'Create a new storage warehouse',
    },
    {
      title: 'Add Crop Type',
      icon: Plus,
      link: '/crop-types/add',
      color: '#f59e0b',
      tooltip: 'Add a new crop type to the system',
    },
    {
      title: 'Register Storekeeper',
      icon: User,
      link: '/users/register-storekeeper',
      color: '#3b82f6',
      tooltip: 'Register a new storekeeper user',
    },
    {
      title: 'View Analytics',
      icon: BarChart3,
      link: '/analytics',
      color: '#8b5cf6',
      tooltip: 'View detailed analytics and reports',
    },
    {
      title: 'System Reports',
      icon: FileText,
      link: '/reports',
      color: '#ec4899',
      tooltip: 'Generate and view system reports',
    },
    {
      title: 'Export Data',
      icon: FileDown,
      link: '/export',
      color: '#06b6d4',
      tooltip: 'Export data to CSV or Excel',
    },
  ];

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-left">
            <h1>Admin Dashboard</h1>
            <p>Welcome back, {user?.firstName}!</p>
          </div>
          <div className="header-right">
            <NotificationBell />
            <div className="date-filter">
              <Calendar size={18} />
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Link to={stat.link} key={index} className="stat-card-link">
                <div className="stat-card">
                  {statsLoading ? (
                    <div className="loading-skeleton" style={{ width: '100%', height: '80px' }} />
                  ) : (
                    <>
                      <div className="stat-icon" style={{ backgroundColor: `${stat.color}20` }}>
                        <Icon size={24} style={{ color: stat.color }} />
                      </div>
                      <div className="stat-content">
                        <h3>{stat.title}</h3>
                        <p className="stat-value">{stat.value.toLocaleString()}</p>
                      </div>
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {
          businessSummary && (
            <div className="business-summary-section">
              <h2>Business Summary</h2>
              <div className="summary-grid">
                <div className="summary-card">
                  <div className="summary-icon" style={{ backgroundColor: '#2ea35920' }}>
                    <DollarSign size={24} style={{ color: '#2ea359' }} />
                  </div>
                  <div className="summary-content">
                    <h3>Total Revenue</h3>
                    <p className="summary-value">RWF {businessSummary.totalRevenue.toLocaleString()}</p>
                    <span className="summary-label">From completed transactions</span>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon" style={{ backgroundColor: '#f59e0b20' }}>
                    <Activity size={24} style={{ color: '#f59e0b' }} />
                  </div>
                  <div className="summary-content">
                    <h3>Pending Payments</h3>
                    <p className="summary-value">{businessSummary.pendingPayments}</p>
                    <span className="summary-label">Transactions awaiting payment</span>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon" style={{ backgroundColor: '#3b82f620' }}>
                    <Users size={24} style={{ color: '#3b82f6' }} />
                  </div>
                  <div className="summary-content">
                    <h3>Active Users</h3>
                    <p className="summary-value">
                      {businessSummary.activeFarmers} Farmers, {businessSummary.activeBuyers} Buyers
                    </p>
                    <span className="summary-label">Active platform users</span>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon" style={{ backgroundColor: '#8b5cf620' }}>
                    <Package size={24} style={{ color: '#8b5cf6' }} />
                  </div>
                  <div className="summary-content">
                    <h3>Total Inventory</h3>
                    <p className="summary-value">{businessSummary.totalInventory.toLocaleString()} KG</p>
                    <span className="summary-label">Available in warehouses</span>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        <div className="charts-section">
          <div className="chart-grid">
            <div className="chart-card">
              <div className="chart-header">
                <h3>Revenue Trend (Last 30 Days)</h3>
                <TrendingUp size={18} color="#116530" />
              </div>
              <div className="chart-container">
                <RevenueTrendChart data={revenueTrendData} />
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3>User Growth (Last 4 Weeks)</h3>
                <Users size={18} color="#3b82f6" />
              </div>
              <div className="chart-container">
                <UserGrowthChart data={userGrowthData} />
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3>Inventory Distribution</h3>
                <Package size={18} color="#f59e0b" />
              </div>
              <div className="chart-container">
                <InventoryDistributionChart data={inventoryDistributionData} />
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3>Transaction Status</h3>
                <Activity size={18} color="#2ea359" />
              </div>
              <div className="chart-container">
                <TransactionStatusChart data={transactionStatusData} />
              </div>
            </div>

            <div className="chart-card chart-card-full">
              <div className="chart-header">
                <h3>Warehouse Capacity</h3>
                <Warehouse size={18} color="#2ea359" />
              </div>
              <WarehouseCapacityCard warehouses={stats?.warehouses || []} />
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.link}
                  className="quick-action-card"
                  title={action.tooltip}
                >
                  <div className="quick-action-icon" style={{ backgroundColor: `${action.color}20` }}>
                    <Icon size={28} style={{ color: action.color }} />
                  </div>
                  <span className="quick-action-title">{action.title}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Activity</h2>
            <div className="activity-controls">
              <div className="search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search activity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Link to="/transactions" className="view-all-link">
                View All
              </Link>
            </div>
          </div>
          <div className="activity-list">
            {filteredActivity.length === 0 ? (
              <div className="no-activity">
                <Activity size={32} />
                <p>No recent activity</p>
              </div>
            ) : (
              filteredActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon">
                    {activity.type === 'Transaction' ? (
                      <DollarSign size={18} />
                    ) : (
                      <Users size={18} />
                    )}
                  </div>
                  <div className="activity-content">
                    <div className="activity-header">
                      <span className="activity-action">{activity.action}</span>
                      <span className="activity-time">{formatTime(activity.timestamp)}</span>
                    </div>
                    <div className="activity-details">
                      <span className="activity-user">{activity.user}</span>
                      {activity.amount !== null && (
                        <span className="activity-amount">RWF {activity.amount.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className={`activity-status status-${activity.status?.toLowerCase()}`}>
                    {activity.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
