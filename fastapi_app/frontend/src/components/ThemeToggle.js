import React from 'react';
import {
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';

const ThemeToggle = ({ onToggle }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Tooltip title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
      <IconButton
        onClick={onToggle}
        color="inherit"
        sx={{
          transition: 'transform 0.3s ease-in-out',
          '&:hover': {
            transform: 'rotate(30deg)',
          },
        }}
      >
        {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle; 