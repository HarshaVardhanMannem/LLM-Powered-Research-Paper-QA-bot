// src/App.js
import React, { useState, useEffect } from 'react';
import { Box, Snackbar, Alert, ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import MessageInput from './components/MessageInput';
import SearchBar from './components/SearchBar';
import PaperDetails from './components/PaperDetails';
import PaperStats from './components/PaperStats';
import ThemeToggle from './components/ThemeToggle';
import { useApi } from './hooks/useApi';
import { useSnackbar } from './hooks/useSnackbar';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [papers, setPapers] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState({ likes: 0, dislikes: 0 });
  const [apiAvailable, setApiAvailable] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  
  const { snackbar, showSnackbar, handleCloseSnackbar } = useSnackbar();
  const api = useApi(API_BASE_URL, showSnackbar);

  // Create theme
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: darkMode ? '#121212' : '#f5f5f5',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
    },
  });

  useEffect(() => {
    checkApiHealth();
    fetchPapers();
    fetchFeedbackStats();
  }, []);

  const checkApiHealth = async () => {
    try {
      await api.checkHealth();
      setApiAvailable(true);
    } catch (error) {
      setApiAvailable(false);
      showSnackbar('Backend API is not available. Please ensure the server is running.', 'error');
    }
  };

  const fetchPapers = async () => {
    try {
      const papers = await api.fetchPapers();
      setPapers(papers);
    } catch (error) {
      showSnackbar('Error fetching papers', 'error');
    }
  };

  const fetchFeedbackStats = async () => {
    try {
      const stats = await api.fetchFeedbackStats();
      setFeedbackStats(stats);
    } catch (error) {
      showSnackbar('Error fetching feedback stats', 'error');
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const { response, papers: updatedPapers } = await api.sendMessage(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setPapers(updatedPapers);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Error getting response';
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${errorMessage}`,
        isError: true 
      }]);
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaper = async (paperId) => {
    try {
      const { papers: updatedPapers, message } = await api.addPaper(paperId);
      setPapers(updatedPapers);
      showSnackbar(message);
      setDrawerOpen(false);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Error adding paper';
      showSnackbar(errorMessage, 'error');
      throw error;
    }
  };

  const handleUploadPaper = async (file) => {
    try {
      const { papers: updatedPapers, message } = await api.uploadPaper(file);
      setPapers(updatedPapers);
      showSnackbar(message || 'Paper uploaded successfully');
      setDrawerOpen(false);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Error uploading paper';
      showSnackbar(errorMessage, 'error');
      throw error;
    }
  };

  const handleFeedback = async (question, answer, type) => {
    try {
      await api.submitFeedback(question, answer, type);
      fetchFeedbackStats();
      showSnackbar('Feedback submitted successfully');
    } catch (error) {
      showSnackbar('Error submitting feedback', 'error');
    }
  };

  const filteredPapers = papers.filter(paper =>
    paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMessages = messages.filter(message =>
    message.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
        {!apiAvailable && (
          <Alert 
            severity="error" 
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
          papers={filteredPapers}
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
          alignItems: 'flex-start',
          width: '100%',
          mt: 8,
          p: 0,
          minHeight: 0,
        }}>
          {/* Main chat area */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              ml: { xs: 0, sm: 20 },
              
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
          </Box>

          {/* Stats sidebar */}
          <Box sx={{
            display: { xs: 'none', sm: 'flex' },
            flexDirection: 'column',
            alignItems: 'flex-end',
            minWidth: 200,
            maxWidth: 280,
            ml: 2,
            mt: 2,
            height: '100%',
          }}>
            <PaperStats stats={{
              totalPapers: papers.length,
              totalQuestions: messages.filter(m => m.role === 'user').length,
              positiveFeedback: feedbackStats.likes,
              negativeFeedback: feedbackStats.dislikes,
            }} />
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
  );
}

export default App;