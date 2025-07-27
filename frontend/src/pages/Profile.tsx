import React, { useState, useRef } from 'react';
import { Box, Typography, TextField, Button, Paper, Divider, Alert, CircularProgress, Avatar, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { deepPurple } from '@mui/material/colors';

const Profile: React.FC = () => {
  const { user, updateProfile, changePassword, isLoading, error } = useAuth();
  const [editData, setEditData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [pwData, setPwData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Demo activity log
  const activityLog = [
    { action: 'Logged in', date: new Date().toLocaleString() },
    { action: 'Viewed dashboard', date: new Date().toLocaleString() },
    { action: 'Updated profile', date: new Date().toLocaleString() },
  ];

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSuccess(null);
    setEditError(null);
    try {
      await updateProfile(editData);
      setEditSuccess('Profile updated successfully!');
    } catch (err: any) {
      setEditError(err?.response?.data?.error || 'Failed to update profile');
    }
  };

  const handlePwChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPwData({ ...pwData, [e.target.name]: e.target.value });
  };

  const handlePwSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSuccess(null);
    setPwError(null);
    if (pwData.newPassword !== pwData.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    setPwLoading(true);
    try {
      await changePassword({ oldPassword: pwData.oldPassword, newPassword: pwData.newPassword });
      setPwSuccess('Password changed successfully!');
      setPwData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPwError(err?.response?.data?.error || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfilePic(ev.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 4 }} elevation={6}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={profilePic || undefined}
            sx={{ width: 80, height: 80, bgcolor: deepPurple[500], fontSize: 32, mb: 1 }}
          >
            {user?.firstName?.[0] || user?.username?.[0]}
          </Avatar>
          <Button variant="outlined" size="small" onClick={() => fileInputRef.current?.click()} sx={{ mb: 2 }}>
            Upload Photo
          </Button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleProfilePicChange}
          />
        </Box>
        <Typography variant="h4" gutterBottom>Profile</Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          View and update your profile information
        </Typography>
        <Divider sx={{ my: 2 }} />
        <form onSubmit={handleEditSubmit}>
          <TextField
            label="First Name"
            name="firstName"
            value={editData.firstName}
            onChange={handleEditChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Last Name"
            name="lastName"
            value={editData.lastName}
            onChange={handleEditChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Email"
            name="email"
            value={editData.email}
            onChange={handleEditChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Username"
            value={user?.username || ''}
            fullWidth
            sx={{ mb: 2 }}
            disabled
          />
          <TextField
            label="Role"
            value={user?.role || ''}
            fullWidth
            sx={{ mb: 2 }}
            disabled
          />
          {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
          {editSuccess && <Alert severity="success" sx={{ mb: 2 }}>{editSuccess}</Alert>}
          <Button type="submit" variant="contained" color="primary" fullWidth disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </form>
        <Divider sx={{ my: 4 }} />
        <Typography variant="h6" gutterBottom>Change Password</Typography>
        <form onSubmit={handlePwSubmit}>
          <TextField
            label="Current Password"
            name="oldPassword"
            type="password"
            value={pwData.oldPassword}
            onChange={handlePwChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="New Password"
            name="newPassword"
            type="password"
            value={pwData.newPassword}
            onChange={handlePwChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={pwData.confirmPassword}
            onChange={handlePwChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          {pwError && <Alert severity="error" sx={{ mb: 2 }}>{pwError}</Alert>}
          {pwSuccess && <Alert severity="success" sx={{ mb: 2 }}>{pwSuccess}</Alert>}
          <Button type="submit" variant="outlined" color="secondary" fullWidth disabled={pwLoading}>
            {pwLoading ? <CircularProgress size={24} /> : 'Change Password'}
          </Button>
        </form>
        <Divider sx={{ my: 4 }} />
        <Typography variant="h6" gutterBottom>Recent Activity</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Action</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activityLog.map((log, idx) => (
              <TableRow key={idx}>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default Profile; 