import React, { useState } from 'react';
import { Box, Typography, Paper, Divider, Switch, FormControlLabel, Button, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Settings: React.FC = () => {
  const { theme, setTheme, logout } = useAuth();
  const [notifications, setNotifications] = React.useState({
    email: true,
    sms: false,
    push: true,
  });
  const [language, setLanguage] = useState('en');
  const [deleteDialog, setDeleteDialog] = useState(false);

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleNotifChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotifications({ ...notifications, [e.target.name]: e.target.checked });
  };

  const handleLanguageChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setLanguage(e.target.value as string);
  };

  const handleDeleteAccount = () => {
    setDeleteDialog(true);
  };
  const handleCloseDelete = () => setDeleteDialog(false);
  const handleConfirmDelete = () => {
    setDeleteDialog(false);
    // Here you would call the API to delete the account
    alert('Account deleted (demo only)');
    logout();
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 4 }} elevation={6}>
        <Typography variant="h4" gutterBottom>Settings</Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Manage your preferences
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>Theme</Typography>
        <FormControlLabel
          control={<Switch checked={theme === 'dark'} onChange={handleThemeToggle} />}
          label={theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          sx={{ mb: 2 }}
        />
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>Notifications</Typography>
        <FormControlLabel
          control={<Switch checked={notifications.email} onChange={handleNotifChange} name="email" />}
          label="Email Notifications"
        />
        <FormControlLabel
          control={<Switch checked={notifications.sms} onChange={handleNotifChange} name="sms" />}
          label="SMS Notifications"
        />
        <FormControlLabel
          control={<Switch checked={notifications.push} onChange={handleNotifChange} name="push" />}
          label="Push Notifications"
        />
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>Language</Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Language</InputLabel>
          <Select value={language} label="Language" onChange={handleLanguageChange}>
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="es">Spanish</MenuItem>
            <MenuItem value="fr">French</MenuItem>
            <MenuItem value="hi">Hindi</MenuItem>
          </Select>
        </FormControl>
        <Divider sx={{ my: 2 }} />
        <Button variant="outlined" color="error" fullWidth onClick={logout} sx={{ mb: 2 }}>
          Logout
        </Button>
        <Button variant="contained" color="error" fullWidth onClick={handleDeleteAccount}>
          Delete Account
        </Button>
        <Dialog open={deleteDialog} onClose={handleCloseDelete}>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogContent>
            Are you sure you want to delete your account? This action cannot be undone.
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDelete}>Cancel</Button>
            <Button onClick={handleConfirmDelete} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default Settings; 