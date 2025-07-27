import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import type { Attendance, AttendanceStats } from '../types';

const Attendance: React.FC = () => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [employees, setEmployees] = useState<Array<{ id: number; first_name: string; last_name: string }>>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const [formData, setFormData] = useState({
    employee_id: '',
    date: '',
    status: 'present',
    check_in: '',
    check_out: '',
    remarks: ''
  });

  useEffect(() => {
    fetchAttendance();
    fetchStats();
    fetchEmployees();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAttendance();
      setAttendance(response.data.attendance || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      showSnackbar('Failed to fetch attendance records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.getAttendanceStats();
      setStats(response.data || null);
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await apiService.getEmployees();
      // Transform employees to match the expected format
      const transformedEmployees = (response.employees || []).map(emp => ({
        id: emp.id,
        first_name: (emp as any).first_name || emp.firstName,
        last_name: (emp as any).last_name || emp.lastName
      }));
      setEmployees(transformedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleOpenDialog = (attendanceRecord?: Attendance) => {
    if (attendanceRecord) {
      setEditingAttendance(attendanceRecord);
      setFormData({
        employee_id: attendanceRecord.employee_id.toString(),
        date: attendanceRecord.date,
        status: attendanceRecord.status,
        check_in: attendanceRecord.check_in || '',
        check_out: attendanceRecord.check_out || '',
        remarks: attendanceRecord.remarks || ''
      });
    } else {
      setEditingAttendance(null);
      setFormData({
        employee_id: '',
        date: new Date().toISOString().split('T')[0], // Today's date
        status: 'present',
        check_in: '',
        check_out: '',
        remarks: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAttendance(null);
  };

  const handleSubmit = async () => {
    try {
      const attendanceData = {
        ...formData,
        employee_id: parseInt(formData.employee_id),
        check_in: formData.check_in || undefined,
        check_out: formData.check_out || undefined,
        remarks: formData.remarks || undefined
      };

      if (editingAttendance) {
        await apiService.updateAttendanceRecord(editingAttendance.id, attendanceData as any);
        showSnackbar('Attendance record updated successfully', 'success');
      } else {
        await apiService.createAttendanceRecord(attendanceData as any);
        showSnackbar('Attendance record created successfully', 'success');
      }

      handleCloseDialog();
      fetchAttendance();
      fetchStats();
    } catch (error) {
      console.error('Error saving attendance record:', error);
      showSnackbar('Failed to save attendance record', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      try {
        await apiService.deleteAttendanceRecord(id);
        showSnackbar('Attendance record deleted successfully', 'success');
        fetchAttendance();
        fetchStats();
      } catch (error) {
        console.error('Error deleting attendance record:', error);
        showSnackbar('Failed to delete attendance record', 'error');
      }
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'leave': return 'warning';
      case 'late': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircleIcon />;
      case 'absent': return <CancelIcon />;
      case 'leave': return <ScheduleIcon />;
      case 'late': return <AccessTimeIcon />;
      default: return <CheckCircleIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Attendance Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Mark Attendance
          </Button>
        </Box>

        {/* Stats Cards */}
        {stats && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Card sx={{ minWidth: 200 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Days
                </Typography>
                <Typography variant="h4">{stats.total_days}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ minWidth: 200 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Present Days
                </Typography>
                <Typography variant="h4" color="success.main">{stats.present_days}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ minWidth: 200 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Absent Days
                </Typography>
                <Typography variant="h4" color="error.main">{stats.absent_days}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ minWidth: 200 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Attendance Rate
                </Typography>
                <Typography variant="h4" color="info.main">{stats.attendance_rate}%</Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Attendance Table */}
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Check In</TableCell>
                  <TableCell>Check Out</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.employee_name}</TableCell>
                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(record.status)}
                        label={record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        color={getStatusColor(record.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{record.check_in || 'N/A'}</TableCell>
                    <TableCell>{record.check_out || 'N/A'}</TableCell>
                    <TableCell>{record.remarks || 'No remarks'}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(record)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(record.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Add/Edit Attendance Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingAttendance ? 'Edit Attendance Record' : 'Mark Attendance'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Employee</InputLabel>
                  <Select
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    label="Employee"
                    required
                  >
                    {employees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {`${employee.first_name} ${employee.last_name}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="present">Present</MenuItem>
                    <MenuItem value="absent">Absent</MenuItem>
                    <MenuItem value="leave">Leave</MenuItem>
                    <MenuItem value="late">Late</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Check In Time"
                  type="time"
                  value={formData.check_in}
                  onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Check Out Time"
                  type="time"
                  value={formData.check_out}
                  onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  label="Remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingAttendance ? 'Update' : 'Mark Attendance'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </motion.div>
    </Box>
  );
};

export default Attendance; 