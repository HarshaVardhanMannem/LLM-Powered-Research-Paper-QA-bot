import React from 'react';
import {
  Paper,
  Typography,
  Box,
  LinearProgress,
  Tooltip,
  Stack,
  useTheme,
} from '@mui/material';
import {
  Article as ArticleIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  QuestionAnswer as QuestionAnswerIcon,
} from '@mui/icons-material';

const StatCard = ({ title, value, icon, color, gradient }) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        mb: 1.5,
        minWidth: 180,
        maxWidth: 240,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        background: gradient || theme.palette.background.paper,
        backdropFilter: 'blur(10px)',
        borderRadius: 3,
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.1)'}`,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        gap: 1.5,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <Box 
        sx={{ 
          p: 1,
          borderRadius: 2,
          background: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(99, 102, 241, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ 
          color: color, 
          fontSize: 20, 
          display: 'flex', 
          alignItems: 'center',
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
        }}>
          {icon}
        </Box>
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            color: theme.palette.text.secondary, 
            fontWeight: 500, 
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant="h5" 
          component="div" 
          sx={{ 
            fontWeight: 700, 
            fontSize: 20, 
            lineHeight: 1,
            background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {value}
        </Typography>
      </Box>
    </Paper>
  );
};

const PaperStats = ({ stats }) => {
  const theme = useTheme();
  const {
    totalPapers = 0,
    totalQuestions = 0,
    positiveFeedback = 0,
    negativeFeedback = 0,
  } = stats;

  return (
    <Box
      sx={{
        width: { xs: '100%', sm: 200 },
        minWidth: 140,
        maxWidth: 220,
        p: 2,
        pt: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.8) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: 4,
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.3)'}`,
        boxShadow: theme.palette.mode === 'dark'
          ? '0 8px 32px rgba(0, 0, 0, 0.3)'
          : '0 8px 32px rgba(0, 0, 0, 0.08)',
        position: { sm: 'sticky' },
        top: { sm: 104 },
        height: 'fit-content',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.3) 50%, transparent 100%)',
        },
      }}
    >
      <Typography 
        variant="h6" 
        gutterBottom 
        sx={{ 
          fontWeight: 700, 
          mb: 2, 
          fontSize: 18,
          background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.025em',
        }}
      >
        Statistics
      </Typography>
      <Stack spacing={1} sx={{ width: '100%' }}>
        <StatCard
          title="Total Papers"
          value={totalPapers}
          icon={<ArticleIcon fontSize="small" />}
          color="#6366f1"
        />
        <StatCard
          title="Questions Asked"
          value={totalQuestions}
          icon={<QuestionAnswerIcon fontSize="small" />}
          color="#3b82f6"
        />
        <StatCard
          title="Positive Feedback"
          value={positiveFeedback}
          icon={<ThumbUpIcon fontSize="small" />}
          color="#10b981"
        />
        <StatCard
          title="Negative Feedback"
          value={negativeFeedback}
          icon={<ThumbDownIcon fontSize="small" />}
          color="#ef4444"
        />
      </Stack>
    </Box>
  );
};

export default PaperStats; 