// src/hooks/useSnackbar.js
import { useState } from 'react';

export const useSnackbar = () => {
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return {
    snackbar,
    showSnackbar,
    handleCloseSnackbar,
  };
};