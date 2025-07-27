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
  Payment as PaymentIcon,
  Pending as PendingIcon,
  CheckCircle as CheckCircleIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import type { Payroll, PayrollStats } from '../types';

const Payroll: React.FC = () => {
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [stats, setStats] = useState<PayrollStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [processDialog, setProcessDialog] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);
  const [employees, setEmployees] = useState<Array<{ id: number; first_name: string; last_name: string; salary: number }>>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const [formData, setFormData] = useState({
    employee_id: '',
    month: '',
    base_salary: '',
    bonus: '0',
    deduction: '0',
    status: 'pending'
  });

  const [processData, setProcessData] = useState({
    month: new Date().toISOString().slice(0, 7) // Current month in YYYY-MM format
  });

  useEffect(() => {
    fetchPayroll();
    fetchStats();
    fetchEmployees();
  }, []);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPayroll();
      setPayroll(response.data.payroll || []);
    } catch (error) {
      console.error('Error fetching payroll:', error);
      showSnackbar('Failed to fetch payroll records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.getPayrollStats();
      setStats(response.data || null);
    } catch (error) {
      console.error('Error fetching payroll stats:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await apiService.getEmployees();
      // Transform employees to match the expected format
      const transformedEmployees = (response.employees || []).map(emp => ({
        id: emp.id,
        first_name: (emp as any).first_name || emp.firstName,
        last_name: (emp as any).last_name || emp.lastName,
        salary: emp.salary
      }));
      setEmployees(transformedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleOpenDialog = (payrollRecord?: Payroll) => {
    if (payrollRecord) {
      setEditingPayroll(payrollRecord);
      setFormData({
        employee_id: payrollRecord.employee_id.toString(),
        month: payrollRecord.month,
        base_salary: payrollRecord.base_salary.toString(),
        bonus: payrollRecord.bonus.toString(),
        deduction: payrollRecord.deduction.toString(),
        status: payrollRecord.status
      });
    } else {
      setEditingPayroll(null);
      setFormData({
        employee_id: '',
        month: new Date().toISOString().slice(0, 7),
        base_salary: '',
        bonus: '0',
        deduction: '0',
        status: 'pending'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPayroll(null);
  };

  const handleProcessPayroll = async () => {
    try {
      await apiService.processPayroll(processData.month);
      showSnackbar('Payroll processed successfully', 'success');
      setProcessDialog(false);
      fetchPayroll();
      fetchStats();
    } catch (error) {
      console.error('Error processing payroll:', error);
      showSnackbar('Failed to process payroll', 'error');
    }
  };

  const handleSubmit = async () => {
    try {
      const payrollData = {
        ...formData,
        employee_id: parseInt(formData.employee_id),
        base_salary: parseFloat(formData.base_salary),
        bonus: parseFloat(formData.bonus),
        deduction: parseFloat(formData.deduction)
      };

      if (editingPayroll) {
        await apiService.updatePayrollRecord(editingPayroll.id, payrollData as any);
        showSnackbar('Payroll record updated successfully', 'success');
      } else {
        await apiService.createPayrollRecord(payrollData as any);
        showSnackbar('Payroll record created successfully', 'success');
      }

      handleCloseDialog();
      fetchPayroll();
      fetchStats();
    } catch (error) {
      console.error('Error saving payroll record:', error);
      showSnackbar('Failed to save payroll record', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this payroll record?')) {
      try {
        await apiService.deletePayrollRecord(id);
        showSnackbar('Payroll record deleted successfully', 'success');
        fetchPayroll();
        fetchStats();
      } catch (error) {
        console.error('Error deleting payroll record:', error);
        showSnackbar('Failed to delete payroll record', 'error');
      }
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircleIcon />;
      case 'pending': return <PendingIcon />;
      default: return <PaymentIcon />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
            Payroll Management
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<CalculateIcon />}
              onClick={() => setProcessDialog(true)}
              sx={{ mr: 2 }}
            >
              Process Payroll
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Payroll Record
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        {stats && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Card sx={{ minWidth: 200 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Employees
                </Typography>
                <Typography variant="h4">{stats.total_employees}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ minWidth: 200 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Paid Records
                </Typography>
                <Typography variant="h4" color="success.main">{stats.total_paid}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ minWidth: 200 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending Records
                </Typography>
                <Typography variant="h4" color="warning.main">{stats.total_pending}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ minWidth: 200 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Amount
                </Typography>
                <Typography variant="h4" color="info.main">{formatCurrency(stats.total_amount)}</Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Payroll Table */}
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Month</TableCell>
                  <TableCell>Base Salary</TableCell>
                  <TableCell>Bonus</TableCell>
                  <TableCell>Deduction</TableCell>
                  <TableCell>Net Salary</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payroll.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.employee_name}</TableCell>
                    <TableCell>
                      {new Date(record.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                    </TableCell>
                    <TableCell>{formatCurrency(record.base_salary)}</TableCell>
                    <TableCell>{formatCurrency(record.bonus)}</TableCell>
                    <TableCell>{formatCurrency(record.deduction)}</TableCell>
                    <TableCell>{formatCurrency(record.net_salary)}</TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(record.status)}
                        label={record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        color={getStatusColor(record.status)}
                        size="small"
                      />
                    </TableCell>
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

        {/* Add/Edit Payroll Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingPayroll ? 'Edit Payroll Record' : 'Add Payroll Record'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Employee</InputLabel>
                  <Select
                    value={formData.employee_id}
                    onChange={(e) => {
                      const employee = employees.find(emp => emp.id === parseInt(e.target.value));
                      setFormData({ 
                        ...formData, 
                        employee_id: e.target.value,
                        base_salary: employee ? employee.salary.toString() : ''
                      });
                    }}
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
                  label="Month"
                  type="month"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Base Salary"
                  type="number"
                  value={formData.base_salary}
                  onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                  required
                />
                <TextField
                  fullWidth
                  label="Bonus"
                  type="number"
                  value={formData.bonus}
                  onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Deduction"
                  type="number"
                  value={formData.deduction}
                  onChange={(e) => setFormData({ ...formData, deduction: e.target.value })}
                />
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingPayroll ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Process Payroll Dialog */}
        <Dialog open={processDialog} onClose={() => setProcessDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Process Payroll</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Month"
              type="month"
              value={processData.month}
              onChange={(e) => setProcessData({ ...processData, month: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ mt: 2 }}
            />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              This will create payroll records for all active employees for the selected month.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setProcessDialog(false)}>Cancel</Button>
            <Button onClick={handleProcessPayroll} variant="contained">
              Process Payroll
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

export default Payroll; 