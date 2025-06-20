// src/components/MessageInput.js
import React from 'react';
import { Paper, Box, TextField, Button, useTheme } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

const MessageInput = ({ value, onChange, onSend, loading }) => {
  const theme = useTheme();
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSend();
    }
  };

  return (
    <Paper 
      elevation={2}
      sx={{ 
        p: 2, 
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderRadius: 5,
        boxShadow: '0 2px 14px 0 rgba(33,203,243,0.10)',
        mt: 1.5,
        maxWidth: 780,
        mx: 'auto',
        //ml: { xs: 2, sm: 18 },
        width: '100%',
      }}
    >
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Ask a question about the papers..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              fontSize: 14,
              background: theme.palette.background.default,
              color: theme.palette.text.primary,
            }
          }}
        />
        <Button
          variant="contained"
          endIcon={<SendIcon />}
          onClick={onSend}
          disabled={loading}
          size="small"
          sx={{ 
            borderRadius: 3,
            px: 2,
            fontWeight: 400,
            fontSize: 10,
            minWidth: 80,
            boxShadow: '0 2px 10px 0 rgba(33,203,243,0.10)',
          }}
        >
          Send
        </Button>
      </Box>
    </Paper>
  );
};

export default MessageInput;

