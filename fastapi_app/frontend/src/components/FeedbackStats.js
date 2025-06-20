// src/components/FeedbackStats.js
import React from 'react';
import { Box, Typography } from '@mui/material';
import { Feedback as FeedbackIcon } from '@mui/icons-material';

const FeedbackStats = ({ stats }) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FeedbackIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Feedback Statistics
        </Typography>
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        p: 2, 
        borderRadius: 1,
        bgcolor: 'background.paper'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="success.main">
            👍 {stats.likes}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Helpful
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="error.main">
            👎 {stats.dislikes}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Not Helpful
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default FeedbackStats;
