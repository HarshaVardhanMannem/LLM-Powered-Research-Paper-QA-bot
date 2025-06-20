
// src/components/ChatArea.js
import React from 'react';
import { Container, Paper, CircularProgress, Box } from '@mui/material';
import ChatMessage from './ChatMessage';

const ChatArea = ({ messages, loading, onFeedback }) => {
  return (
    <Container maxWidth="md" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <Paper
        elevation={0}
        sx={{
          flexGrow: 1,
          mb: 2,
          p: { xs: 1, sm: 3 },
          overflowY: 'auto',
          maxHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)',
          borderRadius: 4,
          boxShadow: '0 4px 24px 0 rgba(60,60,60,0.08)',
          minHeight: 350,
        }}
      >
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
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={28} />
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ChatArea;

