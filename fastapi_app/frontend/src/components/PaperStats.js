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

const StatCard = ({ title, value, icon, color }) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={1}
      sx={{
        p: 1.2,
        mb: 1.2,
        minWidth: 120,
        maxWidth: 180,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2.5,
        boxShadow: 1,
        border: `1px solid ${theme.palette.divider}`,
        gap: 1,
      }}
    >
      <Box sx={{ color: `${color}.main`, fontSize: 22, display: 'flex', alignItems: 'center' }}>
        {icon}
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle2" sx={{ color: `${color}.main`, fontWeight: 600, fontSize: 14 }}>
          {title}
        </Typography>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: 18, lineHeight: 1 }}>
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

  const feedbackPercentage = totalQuestions > 0
    ? Math.round((positiveFeedback / totalQuestions) * 100)
    : 0;

  return (
    <Box
      sx={{
        width: { xs: '100%', sm: 180 },
        minWidth: 120,
        maxWidth: 200,
        p: 1.5,
        pt: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: 'background.default',
        borderRadius: 3,
        boxShadow: 2,
        border: `1px solid ${theme.palette.divider}`,
        position: { sm: 'sticky' },
        top: { sm: 80 },
        height: 'fit-content',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 1.2, fontSize: 18 }}>
        Statistics
      </Typography>
      <Stack spacing={0.7} sx={{ width: '100%' }}>
        <StatCard
          title="Total Papers"
          value={totalPapers}
          icon={<ArticleIcon fontSize="small" />}
          color="primary"
        />
        <StatCard
          title="Questions Asked"
          value={totalQuestions}
          icon={<QuestionAnswerIcon fontSize="small" />}
          color="info"
        />
        <StatCard
          title="Positive Feedback"
          value={positiveFeedback}
          icon={<ThumbUpIcon fontSize="small" />}
          color="success"
        />
        <StatCard
          title="Negative Feedback"
          value={negativeFeedback}
          icon={<ThumbDownIcon fontSize="small" />}
          color="error"
        />
      </Stack>
      <Paper
        elevation={0}
        sx={{
          p: 1,
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          mt: 1.5,
          width: '100%',
          boxShadow: 0,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="subtitle2" sx={{ flexGrow: 1, fontSize: 13 }}>
            Feedback Satisfaction
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
            {feedbackPercentage}%
          </Typography>
        </Box>
        <Tooltip title={`${feedbackPercentage}% positive feedback`}>
          <LinearProgress
            variant="determinate"
            value={feedbackPercentage}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
              },
            }}
          />
        </Tooltip>
      </Paper>
    </Box>
  );
};

export default PaperStats; 