import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People,
  TrendingUp,
  AttachMoney,
  Business,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import type { EmployeeStats } from '../types';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await apiService.getEmployeeStats();
        setStats(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const statCards = [
    {
      title: 'Total Employees',
      value: stats?.totalEmployees || 0,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      title: 'Active Employees',
      value: stats?.activeEmployees || 0,
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    },
    {
      title: 'Average Salary',
      value: `$${stats?.salaryStats.average || '0'}`,
      icon: <AttachMoney sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
    {
      title: 'Recent Hires',
      value: stats?.recentHires || 0,
      icon: <Business sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
    },
  ];

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
          Welcome back, {user?.firstName}!
        </Typography>
      </motion.div>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {statCards.map((card, index) => (
          <Box key={card.title} sx={{ flex: '1 1 300px', minWidth: 0 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                sx={{
                  height: '100%',
                  background: `linear-gradient(135deg, ${card.color}15 0%, ${card.color}05 100%)`,
                  border: `1px solid ${card.color}30`,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${card.color}20`,
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        {card.title}
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                        {card.value}
                      </Typography>
                    </Box>
                    <Box sx={{ color: card.color }}>
                      {card.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 2 }}>
        <Box>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Paper sx={{ p: 3, height: '300px' }}>
              <Typography variant="h6" gutterBottom>
                Department Distribution
              </Typography>
              {stats?.departmentStats && stats.departmentStats.length > 0 ? (
                <Box>
                  {stats.departmentStats.map((dept, index) => (
                    <Box key={dept.department} sx={{ mb: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">{dept.department}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {dept.count}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: '100%',
                          height: 8,
                          bgcolor: 'grey.200',
                          borderRadius: 1,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            width: `${(dept.count / stats.totalEmployees) * 100}%`,
                            height: '100%',
                            bgcolor: `hsl(${index * 60}, 70%, 50%)`,
                            transition: 'width 0.5s ease',
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">No department data available</Typography>
              )}
            </Paper>
          </motion.div>
        </Box>

        <Box>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Paper sx={{ p: 3, height: '300px' }}>
              <Typography variant="h6" gutterBottom>
                Salary Overview
              </Typography>
              {stats?.salaryStats ? (
                <Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Average Salary
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                      ${stats.salaryStats.average}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Minimum
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        ${stats.salaryStats.minimum}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Maximum
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        ${stats.salaryStats.maximum}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Typography color="text.secondary">No salary data available</Typography>
              )}
            </Paper>
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
} 