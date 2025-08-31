// src/components/MessageInput.js
import React from 'react';
import { Paper, Box, TextField, Button, useTheme } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

const MessageInput = ({ value, onChange, onSend, loading }) => {
  const theme = useTheme();
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 1.4, 
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.8) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.3)'}`,
        borderRadius: 4,
        boxShadow: theme.palette.mode === 'dark'
          ? '0 8px 32px rgba(0, 0, 0, 0.3)'
          : '0 8px 32px rgba(0, 0, 0, 0.08)',
        mt: 2,
        width: '100%',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.3) 50%, transparent 100%)',
        },
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          variant="outlined"
          placeholder="Ask a question about the papers... (Press Enter to send, Shift+Enter for new line)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              fontSize: 13,
              background: theme.palette.mode === 'dark'
                ? 'rgba(15, 23, 42, 0.6)'
                : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.3)'}`,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                borderColor: '#6366f1',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.1)',
              },
              '&.Mui-focused': {
                borderColor: '#6366f1',
                borderWidth: 2,
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
              },
              '& .MuiOutlinedInput-input': {
                color: theme.palette.text.primary,
                '&::placeholder': {
                  color: theme.palette.text.secondary,
                  opacity: 0.7,
                },
              },
            },
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none',
            },
          }}
        />
        <Button
          variant="contained"
          endIcon={<SendIcon />}
          onClick={onSend}
          disabled={loading || !value.trim()}
          size="medium"
          sx={{ 
            borderRadius: 2,
            px: 2,
            py: 1,
            fontWeight: 600,
            fontSize: 14,
            minWidth: 100,
            background: value.trim() 
              ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
              : 'linear-gradient(135deg,rgb(19, 177, 82) 0%,rgb(33, 188, 67) 100%)',
            boxShadow: value.trim()
              ? '0 4px 12px rgba(16, 185, 129, 0.3)'
              : '0 2px 8px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              background: value.trim()
                ? 'linear-gradient(135deg,rgb(95, 127, 230) 0%,rgb(132, 240, 204) 100%)'
                : 'linear-gradient(135deg,rgb(55, 130, 235) 0%,rgb(54, 129, 221) 100%)',
              transform: value.trim() ? 'translateY(-1px)' : 'none',
              boxShadow: value.trim()
                ? '0 8px 20px rgba(16, 38, 185, 0.4)'
                : '0 2px 8px rgba(0, 0, 0, 0.1)',
            },
            '&:active': {
              transform: value.trim() ? 'translateY(0)' : 'none',
            },
            '& .MuiButton-endIcon': {
              transition: 'transform 0.2s ease-in-out',
            },
            '&:hover .MuiButton-endIcon': {
              transform: value.trim() ? 'translateX(2px)' : 'none',
            },
          }}
        >
          Send
        </Button>
      </Box>
    </Paper>
  );
};

export default MessageInput;

