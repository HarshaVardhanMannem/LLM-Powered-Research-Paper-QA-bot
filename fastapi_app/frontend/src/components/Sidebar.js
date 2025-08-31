// src/components/Sidebar.js
import React from 'react';
import { Drawer, Box, Typography, Divider, IconButton, Button, useTheme } from '@mui/material';
import { Science as ScienceIcon, Close as CloseIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import AddPaperSection from './AddPaperSection';
import UploadPaperSection from './UploadPaperSection';
import PapersList from './PapersList';

const APPBAR_HEIGHT = 72; // px, updated to match new header height
const CLOSE_BTN_HEIGHT = 48; // px, for the close button area

const Sidebar = ({ 
  open, 
  onClose, 
  papers, 
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
          width: { xs: '90vw', sm: 360 },
          maxWidth: 420,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(51, 65, 85, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderRight: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.3)'}`,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.4)'
            : '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderTopRightRadius: 24, 
          borderBottomRightRadius: 24,
          p: 0,
          position: 'relative',
        }
      }}
    >
      {/* Enhanced close button at the top right */}
      <Box sx={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: { xs: '90vw', sm: 360 },
        maxWidth: 420,
        height: APPBAR_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 2,
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(51, 65, 85, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderTopRightRadius: 24,
        px: 3,
        pt: 1,
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.2) 50%, transparent 100%)',
        },
      }}>
        {/* Left side - Menu indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
            }}
          >
            <ScienceIcon sx={{ 
              fontSize: 20, 
              color: '#6366f1',
            }} />
          </Box>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 600,
              color: theme.palette.text.secondary,
              fontSize: '0.875rem',
            }}
          >
            Menu
          </Typography>
        </Box>

        {/* Right side - Close button */}
        <Button
          onClick={onClose}
          variant="outlined"
          size="small"
          startIcon={<ArrowBackIcon />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(99, 102, 241, 0.2)',
            color: theme.palette.text.primary,
            background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(99, 102, 241, 0.05)',
            '&:hover': {
              background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.1)',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(99, 102, 241, 0.3)',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          Close
        </Button>
      </Box>
      
      {/* Enhanced scrollable content */}
      <Box sx={{
        p: 4,
        pt: `${APPBAR_HEIGHT + 16}px`,
        height: `calc(100vh - ${APPBAR_HEIGHT}px)`,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        background: 'transparent',
        color: theme.palette.text.primary,
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.2)' 
            : 'rgba(99, 102, 241, 0.2)',
          borderRadius: '3px',
          '&:hover': {
            background: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.3)' 
              : 'rgba(99, 102, 241, 0.3)',
          },
        },
      }}>
        {/* Enhanced header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2,
          p: 2,
          borderRadius: 3,
          background: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(99, 102, 241, 0.05)',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.1)'}`,
        }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
              mr: 2,
            }}
          >
            <ScienceIcon sx={{ 
              fontSize: 28, 
              color: '#6366f1',
              filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.3))',
            }} />
          </Box>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700, 
              letterSpacing: '-0.025em',
              background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Research Papers QA
          </Typography>
        </Box>
        
        <AddPaperSection onAddPaper={onAddPaper} />
        
        <Divider sx={{ 
          my: 2,
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.1)',
          '&::before, &::after': {
            borderColor: 'inherit',
          },
        }} />
        
        <UploadPaperSection onUploadPaper={onUploadPaper} />
        
        <Divider sx={{ 
          my: 2,
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.1)',
          '&::before, &::after': {
            borderColor: 'inherit',
          },
        }} />
        
        <PapersList papers={papers} />
        
        {/* Bottom close button for better accessibility */}
        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Button
            onClick={onClose}
            variant="contained"
            fullWidth
            startIcon={<ArrowBackIcon />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              py: 1.5,
              background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Close Sidebar
          </Button>
        </Box>
        
      </Box>
    </Drawer>
  );
};

export default Sidebar;