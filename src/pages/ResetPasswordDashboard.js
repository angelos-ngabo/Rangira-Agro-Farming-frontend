import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react';
import { authService } from '../services/authService';
import Button from '../components/common/Button';
import { getLogoUrl } from '../utils/imageUtils';
import toast from 'react-hot-toast';
import './ResetPasswordDashboard.css';

const ResetPasswordDashboard = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (formData.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters long');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('New password and confirm password do not match');
            return;
        }

        setLoading(true);
        try {
            await authService.changePassword(formData.currentPassword, formData.newPassword);
            toast.success('Password updated successfully!');
            setTimeout(() => {
                navigate('/settings');
            }, 1500);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`reset-dashboard-page ${isDarkMode ? 'dark-mode' : ''}`}>
            <div className="reset-dashboard-content">
                <div className="reset-dashboard-card">
                    <div className="reset-dashboard-header">
                        <Button
                            variant="outline"
                            size="small"
                            onClick={() => navigate('/settings')}
                            className="back-btn"
                            icon={ArrowLeft}
                        />
                        <div className="logo-container">
                            <img src={getLogoUrl()} alt="Rangira Logo" className="dashboard-logo" />
                        </div>
                    </div>

                    <div className="reset-dashboard-body">
                        <div className="title-section">
                            <div className="icon-circle">
                                <ShieldCheck size={32} />
                            </div>
                            <h1>Security Update</h1>
                            <p>Update your password to keep your account secure</p>
                        </div>

                        <form onSubmit={handleSubmit} className="reset-form">
                            <div className="input-group">
                                <label>Current Password</label>
                                <div className="input-wrapper">
                                    <Lock className="input-icon" size={18} />
                                    <input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        name="currentPassword"
                                        value={formData.currentPassword}
                                        onChange={handleChange}
                                        placeholder="Enter current password"
                                        required
                                    />
                                    <Button
                                        variant="outline"
                                        size="small"
                                        className="toggle-password"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        icon={showCurrentPassword ? EyeOff : Eye}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>New Password</label>
                                <div className="input-wrapper">
                                    <Lock className="input-icon" size={18} />
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        placeholder="Min. 6 characters"
                                        required
                                    />
                                    <Button
                                        variant="outline"
                                        size="small"
                                        className="toggle-password"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        icon={showNewPassword ? EyeOff : Eye}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Confirm New Password</label>
                                <div className="input-wrapper">
                                    <Lock className="input-icon" size={18} />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm new password"
                                        required
                                    />
                                    <Button
                                        variant="outline"
                                        size="small"
                                        className="toggle-password"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        icon={showConfirmPassword ? EyeOff : Eye}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                fullWidth
                                disabled={loading}
                                loading={loading}
                            >
                                Update Password
                            </Button>
                        </form>
                    </div>

                    <div className="reset-dashboard-footer">
                        <p>Need help? <a href="/contact">Contact Support</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordDashboard;
