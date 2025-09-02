// src/App.js
import React, { useState, useEffect } from 'react'
import { Box, Snackbar, Alert, ThemeProvider, createTheme, CssBaseline, Container } from '@mui/material'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import MessageInput from './components/MessageInput'
import PaperDetails from './components/PaperDetails'
import PaperStats from './components/PaperStats'
import ThemeToggle from './components/ThemeToggle'
import { useApi } from './hooks/useApi'
import { useSnackbar } from './hooks/useSnackbar'

const API_BASE_URL = 'http://localhost:8000'

function App () {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [papers, setPapers] = useState([])
  const [feedbackStats, setFeedbackStats] = useState({ likes: 0, dislikes: 0 })
  const [apiAvailable, setApiAvailable] = useState(true)
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [darkMode, setDarkMode] = useState(false)

  const { snackbar, showSnackbar, handleCloseSnackbar } = useSnackbar()
  const api = useApi(API_BASE_URL, showSnackbar)

  // Create enhanced theme with modern styling
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#6366f1',
        light: '#818cf8',
        dark: '#4f46e5',
        contrastText: '#ffffff'
      },
      secondary: {
        main: '#ec4899',
        light: '#f472b6',
        dark: '#db2777'
      },
      background: {
        default: darkMode ? '#0f172a' : '#f8fafc',
        paper: darkMode ? '#1e293b' : '#ffffff'
      },
      text: {
        primary: darkMode ? '#f1f5f9' : '#1e293b',
        secondary: darkMode ? '#94a3b8' : '#64748b'
      },
      success: {
        main: '#10b981',
        light: '#34d399',
        dark: '#059669'
      },
      error: {
        main: '#ef4444',
        light: '#f87171',
        dark: '#dc2626'
      },
      warning: {
        main: '#f59e0b',
        light: '#fbbf24',
        dark: '#d97706'
      },
      info: {
        main: '#3b82f6',
        light: '#60a5fa',
        dark: '#2563eb'
      }
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        letterSpacing: '-0.025em'
      },
      h2: {
        fontWeight: 600,
        letterSpacing: '-0.025em'
      },
      h3: {
        fontWeight: 600,
        letterSpacing: '-0.025em'
      },
      h4: {
        fontWeight: 600,
        letterSpacing: '-0.025em'
      },
      h5: {
        fontWeight: 600,
        letterSpacing: '-0.025em'
      },
      h6: {
        fontWeight: 600,
        letterSpacing: '-0.025em'
      },
      body1: {
        lineHeight: 1.6
      },
      body2: {
        lineHeight: 1.6
      }
    },
    shape: {
      borderRadius: 12
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 8,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }
          },
          contained: {
            background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none'
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#6366f1'
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#6366f1',
                borderWidth: 2
              }
            }
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: darkMode
              ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`
          }
        }
      }
    }
  })

  useEffect(() => {
    checkApiHealth()
    fetchPapers()
    fetchFeedbackStats()
  }, [])

  const checkApiHealth = async () => {
    try {
      await api.checkHealth()
      setApiAvailable(true)
    } catch (error) {
      setApiAvailable(false)
      showSnackbar('Backend API is not available. Please ensure the server is running.', 'error')
    }
  }

  const fetchPapers = async () => {
    try {
      const papers = await api.fetchPapers()
      setPapers(papers)
    } catch (error) {
      showSnackbar('Error fetching papers', 'error')
    }
  }

  const fetchFeedbackStats = async () => {
    try {
      const stats = await api.fetchFeedbackStats()
      setFeedbackStats(stats)
    } catch (error) {
      showSnackbar('Error fetching feedback stats', 'error')
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const { response, papers: updatedPapers } = await api.sendMessage(userMessage)
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
      setPapers(updatedPapers)
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Error getting response'
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        isError: true
      }])
      showSnackbar(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPaper = async (paperId) => {
    try {
      const { papers: updatedPapers, message } = await api.addPaper(paperId)
      setPapers(updatedPapers)
      showSnackbar(message)
      setDrawerOpen(false)
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Error adding paper'
      showSnackbar(errorMessage, 'error')
      throw error
    }
  }

  const handleUploadPaper = async (file) => {
    try {
      const { papers: updatedPapers, message } = await api.uploadPaper(file)
      setPapers(updatedPapers)
      showSnackbar(message || 'Paper uploaded successfully')
      setDrawerOpen(false)
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Error uploading paper'
      showSnackbar(errorMessage, 'error')
      throw error
    }
  }

  const handleFeedback = async (question, answer, type) => {
    try {
      await api.submitFeedback(question, answer, type)
      fetchFeedbackStats()
      showSnackbar('Feedback submitted successfully')
    } catch (error) {
      showSnackbar('Error submitting feedback', 'error')
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
        {!apiAvailable && (
          <Alert
            severity='error'
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 9999
            }}
          >
            Backend API is not available. Please ensure the server is running.
          </Alert>
        )}

        <Header
          onMenuClick={() => setDrawerOpen(true)}
          rightContent={
            <ThemeToggle onToggle={() => setDarkMode(!darkMode)} />
          }
        />

        <Sidebar
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          papers={papers}
          feedbackStats={feedbackStats}
          onAddPaper={handleAddPaper}
          onUploadPaper={handleUploadPaper}
          onPaperSelect={setSelectedPaper}
        />

        {/* Main content and stats sidebar layout */}
        <Box sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          justifyContent: 'flex-end',
          width: '100%',
          mt: 9,
          p: 0,
          height: 'calc(100vh - 72px)',
          minHeight: 0,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.1) 50%, transparent 100%)',
            zIndex: 1
          }
        }}
        >
          {/* Main chat area */}
          <Container
            component='main'
            maxWidth='md'
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              position: 'relative',
              zIndex: 2,
              p: { xs: 2, sm: 3 },
              pt: { xs: 3, sm: 4 }
            }}
          >
            <ChatArea
              messages={messages}
              loading={loading}
              onFeedback={handleFeedback}
            />

            <MessageInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              loading={loading}
            />
          </Container>

          {/* Enhanced Stats sidebar */}
          <Box sx={{
            display: { xs: 'none', lg: 'flex' },
            flexDirection: 'column',
            alignItems: 'flex-end',
            minWidth: 220,
            maxWidth: 280,
            mt: 4,
            mr: { lg: 4 },
            height: '100%',
            position: 'relative',
            zIndex: 2
          }}
          >
            <PaperStats stats={{
              totalPapers: papers.length,
              totalQuestions: messages.filter(m => m.role === 'user').length,
              positiveFeedback: feedbackStats.likes,
              negativeFeedback: feedbackStats.dislikes
            }}
            />
          </Box>
        </Box>

        <PaperDetails
          open={!!selectedPaper}
          onClose={() => setSelectedPaper(null)}
          paper={selectedPaper}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%', borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  )
}

export default App
