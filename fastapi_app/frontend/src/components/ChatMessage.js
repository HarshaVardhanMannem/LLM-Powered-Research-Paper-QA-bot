// src/components/ChatMessage.js
import React, { useState } from 'react';
import { Box, Paper, Avatar, IconButton, Tooltip, Fade, useTheme } from '@mui/material';
import { 
  ThumbUp as ThumbUpIcon, 
  ThumbDown as ThumbDownIcon,
  SmartToy as SmartToyIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ChatMessage = ({ message, index, messages, onFeedback }) => {
  const theme = useTheme();
  const [copiedCode, setCopiedCode] = useState('');
  
  const handleCopyCode = (codeString) => {
    navigator.clipboard.writeText(codeString);
    setCopiedCode(codeString);
    setTimeout(() => setCopiedCode(''), 2000);
  };
  
  const components = {
    code({ node, inline, className, children, ...props }) {
      const codeString = String(children).replace(/\n$/, '');
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : 'text';
      const isCopied = copiedCode === codeString;

      return !inline ? (
        <Box sx={{ position: 'relative' }}>
          <Tooltip title={isCopied ? 'Copied!' : 'Copy code'} arrow>
            <IconButton
              size="small"
              onClick={() => handleCopyCode(codeString)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1,
                color: theme.mode === 'dark' ? 'grey.300' : 'grey.700',
                bgcolor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  bgcolor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <ContentCopyIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <SyntaxHighlighter
            style={theme.mode === 'dark' ? vscDarkPlus : vs}
            language={language}
            PreTag="div"
            {...props}
            customStyle={{
              borderRadius: '8px',
              padding: '1em',
              margin: 0,
            }}
          >
            {codeString}
          </SyntaxHighlighter>
        </Box>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };
  
  return (
    <Fade in={true} timeout={300 + (index * 100)}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
          mb: 3,
          animation: `slideIn${message.role === 'user' ? 'Right' : 'Left'} 0.3s ease-out`,
          '@keyframes slideInRight': {
            '0%': {
              opacity: 0,
              transform: 'translateX(20px)',
            },
            '100%': {
              opacity: 1,
              transform: 'translateX(0)',
            },
          },
          '@keyframes slideInLeft': {
            '0%': {
              opacity: 0,
              transform: 'translateX(-20px)',
            },
            '100%': {
              opacity: 1,
              transform: 'translateX(0)',
            },
          },
        }}
      >
        {/* Enhanced Avatar */}
        <Avatar 
          sx={{ 
            bgcolor: message.role === 'user' 
              ? 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)'
              : theme.palette.background.paper, 
            color: message.role === 'user' ? 'white' : '#6366f1',
            width: message.role === 'user' ? 36 : 44, 
            height: message.role === 'user' ? 36 : 44, 
            ml: message.role === 'user' ? 2 : 0,
            mr: message.role === 'assistant' ? 2 : 0,
            fontWeight: 600,
            fontSize: message.role === 'user' ? 14 : 20,
            border: message.role === 'assistant' ? `2px solid #6366f1` : 'none',
            boxShadow: message.role === 'user' 
              ? '0 4px 12px rgba(99, 102, 241, 0.3)'
              : '0 4px 12px rgba(99, 102, 241, 0.15)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          }}
        >
          {message.role === 'user' ? 'U' : <SmartToyIcon fontSize="medium" />}
        </Avatar>

        {/* Enhanced Chat Bubble */}
        <Box sx={{ position: 'relative', maxWidth: { xs: '85vw', sm: '75%' }, minWidth: 60 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              pr: message.role === 'user' ? 3.5 : 2.5,
              pl: message.role === 'assistant' ? 3.5 : 2.5,
              background: message.role === 'user' 
                ? 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)'
                : message.isError 
                  ? 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
                  : theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(51, 65, 85, 0.8) 0%, rgba(71, 85, 105, 0.8) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
              backdropFilter: 'blur(10px)',
              color: message.role === 'user' ? 'white' : theme.palette.text.primary,
              borderRadius: message.role === 'user' 
                ? '20px 20px 8px 20px' 
                : '20px 20px 20px 8px',
              border: message.role === 'assistant' && !message.isError
                ? `1px solid ${theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`
                : 'none',
              boxShadow: message.role === 'user'
                ? '0 8px 24px rgba(99, 102, 241, 0.25)'
                : '0 4px 16px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              minWidth: 60,
              fontSize: 14,
              lineHeight: 1.6,
              wordBreak: 'break-word',
              mt: 0.5,
              mb: 0.5,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: message.role === 'user'
                  ? '0 12px 32px rgba(99, 102, 241, 0.3)'
                  : '0 8px 24px rgba(0, 0, 0, 0.15)',
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                width: 0,
                height: 0,
                border: message.role === 'user'
                  ? '12px solid transparent'
                  : '12px solid transparent',
                borderLeft: message.role === 'user' ? `12px solid #6366f1` : 'none',
                borderRight: message.role === 'assistant' && !message.isError
                  ? `12px solid ${theme.palette.mode === 'dark' ? 'rgba(51, 65, 85, 0.8)' : 'rgba(255, 255, 255, 0.9)'}`
                  : message.isError ? `12px solid #ef4444` : 'none',
                top: 20,
                right: message.role === 'user' ? -22 : 'auto',
                left: message.role === 'assistant' ? -22 : 'auto',
                zIndex: 1,
                display: 'block',
              },
            }}
          >
            <Box
              sx={{
                '& p': {
                  margin: '0.5em 0',
                  '&:first-of-type': { marginTop: 0 },
                  '&:last-of-type': { marginBottom: 0 },
                },
                '& code': {
                  background: message.role === 'user'
                    ? 'rgba(255, 255, 255, 0.2)'
                    : theme.palette.mode === 'dark'
                      ? 'rgba(99, 102, 241, 0.2)'
                      : 'rgba(99, 102, 241, 0.1)',
                  padding: '0.2em 0.4em',
                  borderRadius: 4,
                  fontSize: '0.875em',
                  fontFamily: 'monospace',
                },
                '& pre': {
                  background: 'transparent',
                  padding: '0 !important',
                  margin: '0.5em 0',
                  borderRadius: 2,
                  overflow: 'hidden',
                },
                '& blockquote': {
                  borderLeft: `3px solid ${message.role === 'user' ? 'rgba(255, 255, 255, 0.5)' : '#6366f1'}`,
                  margin: '0.5em 0',
                  paddingLeft: '1em',
                  fontStyle: 'italic',
                },
                '& table': {
                  width: '100%',
                  borderCollapse: 'collapse',
                  margin: '1em 0',
                  fontSize: '0.875em',
                  border: `1px solid ${message.role === 'user' ? 'rgba(255, 255, 255, 0.2)' : theme.palette.divider}`,
                },
                '& th, & td': {
                  border: `1px solid ${message.role === 'user' ? 'rgba(255, 255, 255, 0.2)' : theme.palette.divider}`,
                  padding: '0.75em',
                  textAlign: 'left',
                },
                '& th': {
                  backgroundColor: message.role === 'user'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(99, 102, 241, 0.1)',
                  fontWeight: 600,
                },
                '& tbody tr:nth-of-type(even)': {
                  backgroundColor: message.role === 'user'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : theme.palette.action.hover,
                },
              }}
            >
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={components}
              >
                {message.content}
              </ReactMarkdown>
            </Box>
          </Paper>

          {/* Enhanced Feedback Buttons */}
          {message.role === 'assistant' && !message.isError && index > 0 && (
            <Box sx={{
              display: 'flex',
              gap: 1,
              position: 'absolute',
              right: -60,
              bottom: 12,
              zIndex: 2,
              '@media (max-width:600px)': { right: -50 },
            }}>
              <Tooltip title="Helpful" arrow>
                <IconButton
                  size="small"
                  onClick={() => onFeedback(messages[index - 1].content, message.content, 'like')}
                  sx={{ 
                    color: '#10b981', 
                    bgcolor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': { 
                      bgcolor: '#10b981',
                      color: 'white',
                      transform: 'scale(1.1)',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    },
                  }}
                >
                  <ThumbUpIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Not helpful" arrow>
                <IconButton
                  size="small"
                  onClick={() => onFeedback(messages[index - 1].content, message.content, 'dislike')}
                  sx={{ 
                    color: '#f43f5e', 
                    bgcolor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(244, 63, 94, 0.2)'}`,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': { 
                      bgcolor: '#f43f5e',
                      color: 'white',
                      transform: 'scale(1.1)',
                      boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)',
                    },
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
