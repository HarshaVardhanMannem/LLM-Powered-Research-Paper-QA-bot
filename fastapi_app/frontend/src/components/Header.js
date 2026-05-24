// src/components/Header.js
import React, { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  ListItemIcon,
  Divider,
  useTheme
} from '@mui/material'
import {
  Menu as MenuIcon,
  Logout,
  Person
} from '@mui/icons-material'

const Header = ({ onMenuClick, rightContent, user, onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const theme = useTheme()

  return (
    <AppBar
      position='fixed'
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(51, 65, 85, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.3)'}`,
        boxShadow: theme.palette.mode === 'dark'
          ? '0 4px 20px rgba(0, 0, 0, 0.3)'
          : '0 4px 20px rgba(0, 0, 0, 0.08)',
        color: theme.palette.text.primary
      }}
    >
      <Toolbar sx={{ minHeight: '72px !important' }}>
        <IconButton
          color='inherit'
          aria-label='open drawer'
          edge='start'
          onClick={onMenuClick}
          sx={{
            mr: 2,
            p: 1.5,
            borderRadius: 2,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              background: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(99, 102, 241, 0.1)',
              transform: 'scale(1.05)'
            }
          }}
        >
          <MenuIcon sx={{ fontSize: 24 }} />
        </IconButton>

        <Typography
          variant='h5'
          noWrap
          component='div'
          sx={{
            flexGrow: 1,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #f59e0b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.025em',
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}
        >
          Research Papers QA
        </Typography>

        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          '& > *': {
            transition: 'all 0.2s ease-in-out'
          }
        }}
        >
          {rightContent}

          {user && (
            <>
              <Chip
                avatar={
                  <Avatar sx={{ bgcolor: '#6366f1', width: 28, height: 28, fontSize: 14 }}>
                    {(user.full_name || user.email || '?')[0].toUpperCase()}
                  </Avatar>
                }
                label={user.full_name || user.email}
                variant='outlined'
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  ml: 1,
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  '&:hover': { borderColor: '#6366f1' }
                }}
              />
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  sx: { mt: 1, borderRadius: 2, minWidth: 180 }
                }}
              >
                <MenuItem disabled>
                  <ListItemIcon><Person fontSize='small' /></ListItemIcon>
                  {user.email}
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { setAnchorEl(null); onLogout() }}>
                  <ListItemIcon><Logout fontSize='small' /></ListItemIcon>
                  Sign Out
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
