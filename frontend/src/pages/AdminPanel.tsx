import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Divider, Grid, Card, CardContent, CircularProgress, Table, TableHead, TableRow, TableCell, TableBody, Switch, Button, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, IconButton, InputLabel, FormControl, TablePagination } from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import apiService from '../services/api';
import type { User, AdminStats, EmployeeStats, UserListResponse, AuditLogEntry } from '../types';

const defaultNewUser = {
  username: '',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  role: 'employee',
};

const AdminPanel: React.FC = () => {
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userActionError, setUserActionError] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [newUser, setNewUser] = useState({ ...defaultNewUser });
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [adminStatsRes, employeeStatsRes, usersRes] = await Promise.all([
          apiService.getAdminStats(),
          apiService.getEmployeeStats(),
          apiService.getUsers({ page: page + 1, limit: rowsPerPage, search })
        ]);
        setAdminStats(adminStatsRes);
        setEmployeeStats(employeeStatsRes);
        setUsers(usersRes.users);
        setTotalUsers(usersRes.pagination.total);
      } catch (err: any) {
        setError('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    const fetchAuditLog = async () => {
      setAuditLoading(true);
      try {
        const res = await apiService.getAuditLog({ page: 1, limit: 10 });
        setAuditLog(res.auditLog);
      } catch {
        setAuditLog([]);
      } finally {
        setAuditLoading(false);
      }
    };
    fetchAuditLog();
  }, []);

  const handleToggleActive = async (user: User) => {
    setUserActionError(null);
    try {
      await apiService.updateUser(user.id, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: !user.isActive,
      });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
    } catch (err: any) {
      setUserActionError('Failed to update user status');
    }
  };

  const handleRoleChange = async (user: User, newRole: string) => {
    setUserActionError(null);
    try {
      await apiService.updateUser(user.id, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: newRole,
        isActive: user.isActive ?? true,
      });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: newRole } : u));
    } catch (err: any) {
      setUserActionError('Failed to update user role');
    }
  };

  const handleOpenCreate = () => {
    setNewUser({ ...defaultNewUser });
    setOpenCreate(true);
  };
  const handleCloseCreate = () => setOpenCreate(false);

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name as string]: value }));
  };

  const handleCreateUser = async () => {
    setCreateLoading(true);
    setUserActionError(null);
    try {
      const res = await apiService.createUser(newUser);
      setUsers((prev) => [...prev, res.user]);
      setOpenCreate(false);
    } catch (err: any) {
      setUserActionError('Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    setDeleteLoading(true);
    setUserActionError(null);
    try {
      await apiService.deleteUser(deleteUserId);
      setUsers((prev) => prev.filter((u) => u.id !== deleteUserId));
      setDeleteUserId(null);
    } catch (err: any) {
      setUserActionError('Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 4 }} elevation={6}>
        <Typography variant="h4" gutterBottom>Admin Panel</Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          System overview and user management
        </Typography>
        <Divider sx={{ my: 2 }} />
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Users</Typography>
                    <Typography variant="h4">{adminStats?.userStats.reduce((sum, u) => sum + u.count, 0) || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Employees</Typography>
                    <Typography variant="h4">{employeeStats?.totalEmployees || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Active Employees</Typography>
                    <Typography variant="h4">{employeeStats?.activeEmployees || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Departments</Typography>
                    <Typography variant="h4">{employeeStats?.departmentStats.length || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" gutterBottom>User Management</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>Add User</Button>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SearchIcon sx={{ mr: 1 }} />
              <TextField
                placeholder="Search users..."
                value={search}
                onChange={handleSearchChange}
                size="small"
                sx={{ width: 250 }}
              />
            </Box>
            {userActionError && <Alert severity="error" sx={{ mb: 2 }}>{userActionError}</Alert>}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.firstName} {user.lastName}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user, e.target.value as string)}
                        >
                          <MenuItem value="admin">Admin</MenuItem>
                          <MenuItem value="hr_manager">HR Manager</MenuItem>
                          <MenuItem value="employee">Employee</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>{user.isActive ? 'Active' : 'Inactive'}</TableCell>
                    <TableCell>
                      <Switch
                        checked={!!user.isActive}
                        onChange={() => handleToggleActive(user)}
                        color="primary"
                        inputProps={{ 'aria-label': 'toggle active' }}
                      />
                      <IconButton color="error" onClick={() => setDeleteUserId(user.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={totalUsers}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
            {/* Create User Dialog */}
            <Dialog open={openCreate} onClose={handleCloseCreate} maxWidth="xs" fullWidth>
              <DialogTitle>Add New User</DialogTitle>
              <DialogContent>
                <TextField label="First Name" name="firstName" value={newUser.firstName} onChange={handleCreateChange} fullWidth sx={{ mb: 2 }} />
                <TextField label="Last Name" name="lastName" value={newUser.lastName} onChange={handleCreateChange} fullWidth sx={{ mb: 2 }} />
                <TextField label="Username" name="username" value={newUser.username} onChange={handleCreateChange} fullWidth sx={{ mb: 2 }} />
                <TextField label="Email" name="email" value={newUser.email} onChange={handleCreateChange} fullWidth sx={{ mb: 2 }} />
                <TextField label="Password" name="password" type="password" value={newUser.password} onChange={handleCreateChange} fullWidth sx={{ mb: 2 }} />
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Role</InputLabel>
                  <Select name="role" value={newUser.role} label="Role" onChange={handleCreateChange}>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="hr_manager">HR Manager</MenuItem>
                    <MenuItem value="employee">Employee</MenuItem>
                  </Select>
                </FormControl>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseCreate}>Cancel</Button>
                <Button onClick={handleCreateUser} variant="contained" disabled={createLoading}>
                  {createLoading ? <CircularProgress size={20} /> : 'Create'}
                </Button>
              </DialogActions>
            </Dialog>
            {/* Delete User Confirmation Dialog */}
            <Dialog open={!!deleteUserId} onClose={() => setDeleteUserId(null)} maxWidth="xs" fullWidth>
              <DialogTitle>Delete User</DialogTitle>
              <DialogContent>
                Are you sure you want to delete this user?
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDeleteUserId(null)}>Cancel</Button>
                <Button onClick={handleDeleteUser} color="error" variant="contained" disabled={deleteLoading}>
                  {deleteLoading ? <CircularProgress size={20} /> : 'Delete'}
                </Button>
              </DialogActions>
            </Dialog>
            <Divider sx={{ my: 4 }} />
            <Typography variant="h6" gutterBottom>Audit Log</Typography>
            {auditLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress size={24} /></Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Action</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Table</TableCell>
                    <TableCell>Record ID</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLog.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.username || `${log.firstName} ${log.lastName}`}</TableCell>
                      <TableCell>{log.tableName}</TableCell>
                      <TableCell>{log.recordId || '-'}</TableCell>
                      <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default AdminPanel; 