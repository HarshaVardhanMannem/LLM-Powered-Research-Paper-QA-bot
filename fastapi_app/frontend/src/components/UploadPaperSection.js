// src/components/UploadPaperSection.js
import React, { useState } from 'react';
import { Box, Typography, Button, CircularProgress, useTheme, Alert } from '@mui/material';
import {
  PictureAsPdf as PictureAsPdfIcon,
  CloudUpload as CloudUploadIcon,
  Add as AddIcon
} from '@mui/icons-material';

const UploadPaperSection = ({ onUploadPaper }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', or null
  const theme = useTheme();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setUploadStatus(null);
    } else {
      setUploadStatus('error');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      // Create FormData and append the file
      const formData = new FormData();
      formData.append('file', file);

      // Use the API endpoint
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/papers/upload`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      
      // Call parent component's callback if provided
      if (onUploadPaper) {
        await onUploadPaper(file, result);
      }

      setUploadStatus('success');
      setFile(null);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      
      // Still call parent callback to handle error there if needed
      if (onUploadPaper) {
        try {
          await onUploadPaper(file, { error: error.message });
        } catch (parentError) {
          console.error('Parent callback error:', parentError);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{
      bgcolor: theme.palette.background.paper,
      borderRadius: 3,
      boxShadow: '0 2px 8px 0 rgba(60,60,60,0.06)',
      p: 2.5,
      mb: 2,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 1.5,
      border: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.primary,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <PictureAsPdfIcon sx={{ color: 'error.main', fontSize: 28 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: 17 }}>
          Upload Paper (PDF)
        </Typography>
      </Box>

      {/* Status Messages */}
      {uploadStatus === 'success' && (
        <Alert severity="success" sx={{ width: '100%', mb: 1 }}>
          File uploaded successfully!
        </Alert>
      )}
      
      {uploadStatus === 'error' && (
        <Alert severity="error" sx={{ width: '100%', mb: 1 }}>
          {file ? 'Upload failed. Please try again.' : 'Please select a valid PDF file.'}
        </Alert>
      )}

      <Button
        variant="outlined"
        component="label"
        sx={{
          textTransform: 'none',
          borderRadius: 2,
          fontWeight: 600,
          fontSize: 15,
          borderColor: theme.palette.divider,
          bgcolor: theme.palette.background.default,
          '&:hover': { bgcolor: theme.palette.action.hover, borderColor: 'primary.main' },
          width: '100%',
          mb: file ? 1 : 0
        }}
        disabled={uploading}
        startIcon={<CloudUploadIcon sx={{ color: 'primary.main' }} />}
      >
        {file ? 'Change File' : 'Choose PDF File'}
        <input
          type="file"
          accept="application/pdf"
          hidden
          onChange={handleFileChange}
        />
      </Button>

      {file && (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          width: '100%',
          justifyContent: 'flex-start',
        }}>
          <Box sx={{
            bgcolor: theme.palette.action.selected,
            color: theme.palette.text.secondary,
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            fontSize: 14,
            fontWeight: 500,
            maxWidth: '80%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {file.name}
          </Box>
        </Box>
      )}

      <Button
        variant="contained"
        onClick={handleUpload}
        disabled={!file || uploading}
        sx={{
          borderRadius: 2,
          fontWeight: 700,
          fontSize: 16,
          width: '100%',
          background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, #21cbf3 100%)`,
          color: '#fff',
          boxShadow: '0 2px 8px 0 rgba(33,203,243,0.10)',
          '&:hover': { background: `linear-gradient(90deg, ${theme.palette.primary.dark} 0%, #00bcd4 100%)` },
          py: 1.1
        }}
        startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <AddIcon />}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </Button>
    </Box>
  );
};

export default UploadPaperSection;