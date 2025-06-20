// src/components/ChatMessage.js
import React from 'react';
import { Box, Paper, Avatar, IconButton, Tooltip, Fade, useTheme } from '@mui/material';
import { 
  ThumbUp as ThumbUpIcon, 
  ThumbDown as ThumbDownIcon,
  SmartToy as SmartToyIcon 
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';

const ChatMessage = ({ message, index, messages, onFeedback }) => {
  const theme = useTheme();
  return (
    <Fade in={true}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
          mb: 2.5,
        }}
      >
        {/* Avatar */}
        <Avatar 
          sx={{ 
            bgcolor: message.role === 'user' ? 'primary.main' : theme.palette.background.paper, 
            color: message.role === 'user' ? 'white' : 'primary.main',
            width: message.role === 'user' ? 32 : 40, 
            height: message.role === 'user' ? 32 : 40, 
            ml: message.role === 'user' ? 2 : 0,
            mr: message.role === 'assistant' ? 2 : 0,
            fontWeight: 500,
            fontSize: message.role === 'user' ? 16 : 22,
            border: message.role === 'assistant' ? `2px solid ${theme.palette.primary.main}` : 'none',
            boxShadow: message.role === 'user' ? '0 2px 8px 0 rgba(33,203,243,0.10)' : 'none',
          }}
        >
          {message.role === 'user' ? 'U' : <SmartToyIcon fontSize="medium" />}
        </Avatar>

        {/* Chat Bubble */}
        <Box sx={{ position: 'relative', maxWidth: { xs: '90vw', sm: '70%' }, minWidth: 50 }}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              pr: message.role === 'user' ? 3 : 2,
              pl: message.role === 'assistant' ? 3 : 2,
              background: message.role === 'user' 
                ? theme.palette.primary.main
                : message.isError 
                  ? theme.palette.error.light
                  : theme.palette.background.paper,
              color: message.role === 'user' ? 'white' : theme.palette.text.primary,
              borderRadius: message.role === 'user' 
                ? '20px 20px 6px 20px' 
                : '20px 20px 20px 6px',
              border: message.role === 'assistant' ? `1.5px solid ${theme.palette.primary.main}` : 'none',
              boxShadow: '0 2px 12px 0 rgba(60,60,60,0.10)',
              position: 'relative',
              minWidth: 50,
              fontSize: 14,
              wordBreak: 'break-word',
              mt: 0.5,
              mb: 0.5,
              '&:after': {
                content: '""',
                position: 'absolute',
                width: 0,
                height: 0,
                border: message.role === 'user'
                  ? '12px solid transparent'
                  : '12px solid transparent',
                borderLeft: message.role === 'user' ? `12px solid ${theme.palette.primary.main}` : 'none',
                borderRight: message.role === 'assistant' ? `12px solid ${theme.palette.background.paper}` : 'none',
                top: 16,
                right: message.role === 'user' ? -22 : 'auto',
                left: message.role === 'assistant' ? -22 : 'auto',
                zIndex: 1,
                display: message.isError ? 'none' : 'block',
              },
            }}
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </Paper>

          {/* Feedback Buttons */}
          {message.role === 'assistant' && !message.isError && index > 0 && (
            <Box sx={{
              display: 'flex',
              gap: 1,
              position: 'absolute',
              right: -54,
              bottom: 8,
              zIndex: 2,
              '@media (max-width:600px)': { right: -44 },
            }}>
              <Tooltip title="Helpful">
                <IconButton
                  size="small"
                  onClick={() => onFeedback(messages[index - 1].content, message.content, 'like')}
                  sx={{ 
                    color: 'success.main', 
                    bgcolor: 'background.paper', 
                    '&:hover': { bgcolor: 'success.light' }, 
                    boxShadow: 1 
                  }}
                >
                  <ThumbUpIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Not Helpful">
                <IconButton
                  size="small"
                  onClick={() => onFeedback(messages[index - 1].content, message.content, 'dislike')}
                  sx={{ 
                    color: 'error.main', 
                    bgcolor: 'background.paper', 
                    '&:hover': { bgcolor: 'error.light' }, 
                    boxShadow: 1 
                  }}
                >
                  <ThumbDownIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Box>
    </Fade>
  );
};

export default ChatMessage;
