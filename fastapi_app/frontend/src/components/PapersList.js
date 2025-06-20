// src/components/PapersList.js
import React from 'react';
import { Box, Typography, List, ListItem, Avatar, useTheme } from '@mui/material';
import { Article as ArticleIcon } from '@mui/icons-material';

const PapersList = ({ papers }) => {
  const theme = useTheme();
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <ArticleIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Loaded Papers
        </Typography>
      </Box>
      
      <List sx={{ maxHeight: 220, overflowY: 'auto', width: '100%', p: 0 }}>
        {papers.length === 0 ? (
          <ListItem sx={{ justifyContent: 'center', py: 2, opacity: 0.7 }}>
            <Typography variant="body2" color="text.secondary">
              No papers loaded
            </Typography>
          </ListItem>
        ) : (
          papers.map((paper, index) => {
            const displayTitle = paper.title || paper.id || paper.filename || 'Untitled';
            const key = paper.id || paper.title || paper.filename || index;
            
            return (
              <ListItem 
                key={key}
                sx={{ 
                  borderRadius: 1,
                  mb: 0.5,
                  bgcolor: theme.palette.background.paper,
                  boxShadow: '0 1px 2px 0 rgba(60,60,60,0.03)',
                  '&:hover': { bgcolor: theme.palette.action.hover },
                  width: '100%',
                  minHeight: 36,
                  px: 1.2,
                  gap: 1,
                }}
              >
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 22, height: 22, fontSize: 14 }}>
                  <ArticleIcon fontSize="inherit" />
                </Avatar>
                <Typography 
                  variant="body2" 
                  noWrap 
                  title={displayTitle}
                  sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', maxWidth: 140 }}
                >
                  {displayTitle}
                </Typography>
              </ListItem>
            );
          })
        )}
      </List>
    </Box>
  );
};

export default PapersList;

