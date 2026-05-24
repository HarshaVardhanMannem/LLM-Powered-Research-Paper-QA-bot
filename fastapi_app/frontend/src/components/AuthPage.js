import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  useTheme
} from '@mui/material'
import { Visibility, VisibilityOff, Science, Email, Lock, Person } from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'

function AuthPage () {
  const [tab, setTab] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const theme = useTheme()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await register(email, password, fullName)
      setSuccess('Account created! You can now log in.')
      setTab(0)
      setPassword('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (_, newValue) => {
    setTab(newValue)
    setError('')
    setSuccess('')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
        p: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 50%)',
          animation: 'pulse 8s ease-in-out infinite'
        }
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 4,
          position: 'relative',
          zIndex: 1,
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'}`,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 25px 50px rgba(0, 0, 0, 0.5)'
            : '0 25px 50px rgba(0, 0, 0, 0.1)',
          background: theme.palette.mode === 'dark'
            ? 'rgba(30, 41, 59, 0.9)'
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)'
              }}
            >
              <Science sx={{ color: 'white', fontSize: 28 }} />
            </Box>
            <Typography variant='h5' fontWeight={700} gutterBottom>
              Research Papers QA
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              AI-powered research paper analysis
            </Typography>
          </Box>

          <Tabs
            value={tab}
            onChange={handleTabChange}
            variant='fullWidth'
            sx={{
              mb: 3,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 2,
                background: 'linear-gradient(90deg, #6366f1, #818cf8)'
              }
            }}
          >
            <Tab label='Sign In' />
            <Tab label='Create Account' />
          </Tabs>

          {error && (
            <Alert severity='error' sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity='success' sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {tab === 0 ? (
            <Box component='form' onSubmit={handleLogin} noValidate>
              <TextField
                fullWidth
                label='Email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin='normal'
                required
                autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Email sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                fullWidth
                label='Password'
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin='normal'
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Lock sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge='end' size='small'>
                        {showPassword ? <VisibilityOff fontSize='small' /> : <Visibility fontSize='small' />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Button
                type='submit'
                fullWidth
                variant='contained'
                size='large'
                disabled={loading || !email || !password}
                sx={{ mt: 3, py: 1.5, fontSize: '1rem' }}
              >
                {loading ? <CircularProgress size={24} color='inherit' /> : 'Sign In'}
              </Button>
            </Box>
          ) : (
            <Box component='form' onSubmit={handleRegister} noValidate>
              <TextField
                fullWidth
                label='Full Name'
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                margin='normal'
                autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Person sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                fullWidth
                label='Email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin='normal'
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Email sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                fullWidth
                label='Password'
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin='normal'
                required
                helperText='At least 6 characters'
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Lock sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge='end' size='small'>
                        {showPassword ? <VisibilityOff fontSize='small' /> : <Visibility fontSize='small' />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Button
                type='submit'
                fullWidth
                variant='contained'
                size='large'
                disabled={loading || !email || !password || password.length < 6}
                sx={{ mt: 3, py: 1.5, fontSize: '1rem' }}
              >
                {loading ? <CircularProgress size={24} color='inherit' /> : 'Create Account'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default AuthPage
