import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const AdminPanel: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Panel
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Admin panel features coming soon...
        </Typography>
      </motion.div>
    </Box>
  );
};

export default AdminPanel; 