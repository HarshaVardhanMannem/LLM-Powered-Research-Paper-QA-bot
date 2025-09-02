// src/components/PapersList.js
import React from 'react'
import { Box, Typography, List, ListItem, Avatar, useTheme, Paper } from '@mui/material'
import { Article as ArticleIcon } from '@mui/icons-material'

const PapersList = ({ papers }) => {
  const theme = useTheme()

  return (
    <Box>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        mb: 2,
        p: 1.5,
        borderRadius: 2,
        background: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.05)'
          : 'rgba(99, 102, 241, 0.05)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.1)'}`
      }}
      >
        <Box
          sx={{
            p: 1,
            borderRadius: 1.5,
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
            mr: 1.5
          }}
        >
          <ArticleIcon sx={{
            fontSize: 18,
            color: '#6366f1',
            filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.3))'
          }}
          />
        </Box>
        <Typography
          variant='subtitle1'
          sx={{
            fontWeight: 600,
            fontSize: 14,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Loaded Papers ({papers.length})
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          background: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(226, 232, 240, 0.3)'}`,
          borderRadius: 3,
          overflow: 'hidden'
        }}
      >
        <List sx={{
          maxHeight: 220,
          overflowY: 'auto',
          width: '100%',
          p: 0,
          '&::-webkit-scrollbar': {
            width: '4px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.2)'
              : 'rgba(99, 102, 241, 0.2)',
            borderRadius: '2px',
            '&:hover': {
              background: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.3)'
                : 'rgba(99, 102, 241, 0.3)'
            }
          }
        }}
        >
          {papers.length === 0
            ? (
              <ListItem sx={{
                justifyContent: 'center',
                py: 3,
                flexDirection: 'column',
                gap: 1
              }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1
                  }}
                >
                  <ArticleIcon sx={{
                    fontSize: 24,
                    color: theme.palette.text.secondary,
                    opacity: 0.6
                  }}
                  />
                </Box>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{
                    fontSize: 12,
                    textAlign: 'center',
                    opacity: 0.7
                  }}
                >
                  No papers loaded yet
                </Typography>
              </ListItem>
              )
            : (
                papers.map((paper, index) => {
                  const displayTitle = paper.title || paper.id || paper.filename || 'Untitled'
                  const key = paper.id || paper.title || paper.filename || index

                  return (
                    <ListItem
                      key={key}
                      sx={{
                        borderRadius: 0,
                        mb: 0,
                        background: 'transparent',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          background: theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(99, 102, 241, 0.05)',
                          transform: 'translateX(4px)'
                        },
                        width: '100%',
                        minHeight: 48,
                        px: 2,
                        py: 1.5,
                        gap: 1.5,
                        borderBottom: index < papers.length - 1
                          ? `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(226, 232, 240, 0.3)'}`
                          : 'none'
                      }}
                    >
                      <Avatar sx={{
                        bgcolor: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                        color: 'white',
                        width: 28,
                        height: 28,
                        fontSize: 14,
                        fontWeight: 600,
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                      }}
                      >
                        <ArticleIcon fontSize='small' />
                      </Avatar>
                      <Typography
                        variant='body2'
                        noWrap
                        title={displayTitle}
                        sx={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'text.primary',
                          maxWidth: 200,
                          lineHeight: 1.4
                        }}
                      >
                        {displayTitle}
                      </Typography>
                    </ListItem>
                  )
                })
              )}
        </List>
      </Paper>
    </Box>
  )
}

export default PapersList
