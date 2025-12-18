import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import { useQuery } from 'react-query';
import Sidebar from '../components/layout/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import Button from '../components/common/Button';
import { User, Camera, Save, Lock, Mail, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import './Page.css';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  

  const { data: fullUserData } = useQuery(
    ['userDetails', user?.id],
    async () => {
      if (!user?.id) return null;
      try {
        const response = await dataService.getUserById(user.id);
        return response.data || response;
      } catch (error) {
        return null;
      }
    },
    { enabled: !!user?.id, staleTime: 30000 }
  );

  

  const displayUser = fullUserData || user;

  const [formData, setFormData] = useState({
    firstName: displayUser?.firstName || '',
    lastName: displayUser?.lastName || '',
    email: displayUser?.email || '',
    phoneNumber: displayUser?.phoneNumber || '',
  });

  

  useEffect(() => {
    if (displayUser) {
      setFormData({
        firstName: displayUser.firstName || '',
        lastName: displayUser.lastName || '',
        email: displayUser.email || '',
        phoneNumber: displayUser.phoneNumber || '',
      });
    }
  }, [displayUser]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await dataService.uploadProfilePicture(user.id, formData);

      

      const responseData = response.data || response;
      const updatedProfilePictureUrl = responseData?.profilePictureUrl ||
        responseData?.userProfile?.profilePictureUrl;

      if (updatedProfilePictureUrl) {
        updateUser({
          profilePictureUrl: updatedProfilePictureUrl,
          userProfile: {
            ...displayUser?.userProfile,
            profilePictureUrl: updatedProfilePictureUrl
          }
        });
      }

      toast.success('Profile picture updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      

      const updateData = {};
      if (formData.firstName && formData.firstName.trim() !== displayUser?.firstName) {
        updateData.firstName = formData.firstName.trim();
      }
      if (formData.lastName && formData.lastName.trim() !== displayUser?.lastName) {
        updateData.lastName = formData.lastName.trim();
      }
      

      if (formData.phoneNumber && formData.phoneNumber.trim() !== displayUser?.phoneNumber) {
        updateData.phoneNumber = formData.phoneNumber.trim();
      }

      

      if (Object.keys(updateData).length === 0) {
        toast('No changes to save', { icon: 'ℹ️' });
        setLoading(false);
        return;
      }

      const response = await dataService.updateUserProfile(user.id, updateData);
      const updatedUserData = response.data || response;

      

      updateUser({
        firstName: updatedUserData.firstName || displayUser.firstName,
        lastName: updatedUserData.lastName || displayUser.lastName,
        phoneNumber: updatedUserData.phoneNumber || displayUser.phoneNumber,
      });

      toast.success('Profile updated successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePicture = async () => {
    if (!window.confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    setUploading(true);
    try {
      await dataService.deleteProfilePicture(user.id);
      updateUser({
        profilePictureUrl: null,
        userProfile: {
          ...displayUser?.userProfile,
          profilePictureUrl: null
        }
      });
      toast.success('Profile picture deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete profile picture');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page">
      <Sidebar />
      <div className="page-container">
        <DashboardHeader />
        <div className="profile-container">
          {}
          <div className="profile-picture-section">
            <div className="profile-picture-wrapper">
              {(displayUser?.profilePictureUrl || displayUser?.userProfile?.profilePictureUrl) ? (() => {
                const pictureUrl = displayUser.profilePictureUrl || displayUser.userProfile?.profilePictureUrl;
                const imageSrc = pictureUrl?.startsWith('http')
                  ? pictureUrl
                  : pictureUrl?.startsWith('/api/')
                    ? `http://localhost:8080${pictureUrl}`
                    : `http://localhost:8080/api/files/profile-pictures/${pictureUrl}`;
                return (
                  <img
                    src={imageSrc}
                    alt="Profile"
                    className="profile-picture"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextElementSibling) {
                        e.target.nextElementSibling.style.display = 'flex';
                      }
                    }}
                  />
                );
              })() : (
                <div className="profile-picture-placeholder">
                  <User size={64} />
                </div>
              )}
              <Button
                variant="outline"
                size="small"
                className="profile-picture-upload-btn"
                onClick={handleImageClick}
                disabled={uploading}
                title="Upload profile picture"
                icon={Camera}
              />
              {(displayUser?.profilePictureUrl || displayUser?.userProfile?.profilePictureUrl) && (
                <Button
                  variant="danger"
                  size="small"
                  className="profile-picture-delete-btn"
                  onClick={handleDeletePicture}
                  disabled={uploading}
                  title="Delete profile picture"
                >
                  ×
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </div>
            {uploading && (
              <p className="upload-status">Uploading...</p>
            )}
            <h2 className="profile-name">{displayUser?.firstName} {displayUser?.lastName}</h2>
            <p className="profile-email">{displayUser?.email}</p>
          </div>

          {}
          <div className="profile-form-section">
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-section">
                <h3 className="form-section-title">
                  <User size={20} />
                  Personal Information
                </h3>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">
                      <User size={16} />
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName">
                      <User size={16} />
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">
                      <Mail size={16} />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="disabled-input"
                    />
                    <small className="form-hint">Email cannot be changed</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="phoneNumber">
                      <Phone size={16} />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                    />
                    <small className="form-hint">Optional - update if you want to change your phone number</small>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">
                  <Lock size={20} />
                  Account Information
                </h3>

                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">User Code</span>
                    <span className="info-value">{displayUser?.userCode || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">User Type</span>
                    <span className={`badge badge-${(displayUser?.userType || 'unknown')?.toLowerCase()}`}>
                      {displayUser?.userType || 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Status</span>
                    <span className={`badge badge-${(displayUser?.status || 'unknown')?.toLowerCase()}`}>
                      {displayUser?.status || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  loading={loading}
                  icon={Save}
                  fullWidth
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
