// src/components/Sidebar.js
import React from 'react';
import { Drawer, Box, Typography, Divider, IconButton, useTheme } from '@mui/material';
import { Science as ScienceIcon, Close as CloseIcon } from '@mui/icons-material';
import AddPaperSection from './AddPaperSection';
import UploadPaperSection from './UploadPaperSection';
import PapersList from './PapersList';
import FeedbackStats from './FeedbackStats';

const APPBAR_HEIGHT = 64; // px, adjust if your AppBar is a different height
const CLOSE_BTN_HEIGHT = 48; // px, for the close button area

const Sidebar = ({ 
  open, 
  onClose, 
  papers, 
  feedbackStats, 
  onAddPaper, 
  onUploadPaper 
}) => {
  const theme = useTheme();
  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { 
          width: { xs: '90vw', sm: 340 },
          maxWidth: 400,
          bgcolor: theme.palette.background.paper,
          boxShadow: '0 4px 24px 0 rgba(60,60,60,0.10)',
          borderTopRightRadius: 24, 
          borderBottomRightRadius: 24,
          p: 0,
          position: 'relative',
        }
      }}
    >
      {/* Fixed close button at the top right, above scrollable content */}
      <Box sx={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: { xs: '90vw', sm: 340, md: 340 },
        maxWidth: 400,
        height: APPBAR_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        zIndex: 2,
        bgcolor: theme.palette.background.paper,
        borderTopRightRadius: 24,
        px: 2,
        pt: 1,
      }}>
        <IconButton onClick={onClose} aria-label="Close sidebar">
          <CloseIcon />
        </IconButton>
      </Box>
      {/* Scrollable content below the AppBar and close button */}
      <Box sx={{
        p: 3,
        pt: `${APPBAR_HEIGHT + 8}px`, // add top padding for AppBar and close button
        height: `calc(100vh - ${APPBAR_HEIGHT}px)`,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <ScienceIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0.5, color: 'primary.main' }}>
            Research Papers QA
          </Typography>
        </Box>
        <AddPaperSection onAddPaper={onAddPaper} />
        <Divider sx={{ my: 3 }} />
        <UploadPaperSection onUploadPaper={onUploadPaper} />
        <Divider sx={{ my: 3 }} />
        <PapersList papers={papers} />
        <Divider sx={{ my: 3 }} />
        
      </Box>
    </Drawer>
  );
};
export default Sidebar;