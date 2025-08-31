// src/components/ChatArea.js
import React from 'react';
import { Paper, CircularProgress, Box, useTheme } from '@mui/material';
import ChatMessage from './ChatMessage';

const ChatArea = ({ messages, loading, onFeedback }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      <Paper
        elevation={0}
        sx={{
          flexGrow: 1,
          mb: 3,
          p: { xs: 2, sm: 4 },
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.8) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: 2,
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.3)'}`,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.3)'
            : '0 8px 32px rgba(0, 0, 0, 0.08)',
          minHeight: 355,
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
        {messages.length === 0 && !loading && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 300,
              textAlign: 'center',
              color: theme.palette.text.secondary,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': {
                    transform: 'scale(1)',
                    opacity: 1,
                  },
                  '50%': {
                    transform: 'scale(1.05)',
                    opacity: 0.8,
                  },
                  '100%': {
                    transform: 'scale(1)',
                    opacity: 1,
                  },
                },
              }}
            >
              <Box
                component="span"
                sx={{
                  fontSize: 32,
                  background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                💬
              </Box>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Box
                component="span"
                sx={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Start a conversation
              </Box>
            </Box>
            <Box sx={{ fontSize: '0.875rem', opacity: 0.8 }}>
              Ask questions about your research papers and get AI-powered answers
            </Box>
          </Box>
        )}
        
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message}
            index={index}
            messages={messages}
            onFeedback={onFeedback}
          />
        ))}
        
        {loading && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            my: 3,
            py: 2,
          }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderRadius: 3,
                background: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(99, 102, 241, 0.05)',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.1)'}`,
              }}
            >
              <CircularProgress 
                size={24} 
                sx={{ 
                  color: '#6366f1',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  },
                }} 
              />
              <Box
                component="span"
                sx={{
                  fontSize: '0.875rem',
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                }}
              >
                Thinking...
              </Box>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ChatArea;

