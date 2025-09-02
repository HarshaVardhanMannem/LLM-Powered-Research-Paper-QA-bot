import React from 'react'
import {
  IconButton,
  Tooltip,
  useTheme,
  Box
} from '@mui/material'
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon
} from '@mui/icons-material'

const ThemeToggle = ({ onToggle }) => {
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark'

  return (
    <Tooltip title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`} arrow>
      <IconButton
        onClick={onToggle}
        color='inherit'
        sx={{
          p: 1.5,
          borderRadius: 2,
          background: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(99, 102, 241, 0.1)',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(99, 102, 241, 0.2)'}`,
          transition: 'all 0.3s ease-in-out',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isDarkMode
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
            opacity: 0,
            transition: 'opacity 0.3s ease-in-out'
          },
          '&:hover': {
            transform: 'scale(1.1) rotate(15deg)',
            background: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.15)'
              : 'rgba(99, 102, 241, 0.15)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 12px rgba(255, 255, 255, 0.2)'
              : '0 4px 12px rgba(99, 102, 241, 0.3)',
            '&::before': {
              opacity: 1
            }
          },
          '&:active': {
            transform: 'scale(0.95)'
          }
        }}
      >
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            transition: 'all 0.3s ease-in-out',
            '& .MuiSvgIcon-root': {
              fontSize: 20,
              color: isDarkMode ? '#fbbf24' : '#6366f1',
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
            }
          }}
        >
          {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
        </Box>
      </IconButton>
    </Tooltip>
  )
}

export default ThemeToggle
