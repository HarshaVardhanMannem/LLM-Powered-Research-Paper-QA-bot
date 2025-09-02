import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Paper
} from '@mui/material'
import { styled } from '@mui/material/styles'

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.background.default
}))

const PaperDetails = ({ open, onClose, paper }) => {
  if (!paper) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 24
        }
      }}
    >
      <DialogTitle>
        <Typography variant='h5' component='div' gutterBottom>
          {paper.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label={`ID: ${paper.id}`} size='small' />
          <Chip label='Research Paper' color='primary' size='small' />
        </Box>
      </DialogTitle>

      <DialogContent>
        <StyledPaper elevation={0}>
          <Typography variant='h6' gutterBottom>
            Abstract
          </Typography>
          <Typography variant='body1' paragraph>
            {paper.abstract || 'No abstract available'}
          </Typography>
        </StyledPaper>

        <StyledPaper elevation={0}>
          <Typography variant='h6' gutterBottom>
            Authors
          </Typography>
          <Typography variant='body1'>
            {paper.authors?.join(', ') || 'No authors listed'}
          </Typography>
        </StyledPaper>

        <StyledPaper elevation={0}>
          <Typography variant='h6' gutterBottom>
            Publication Details
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant='body2'>
              Published: {paper.published_date || 'Not available'}
            </Typography>
            <Typography variant='body2'>
              DOI: {paper.doi || 'Not available'}
            </Typography>
          </Box>
        </StyledPaper>

        {paper.citations && (
          <StyledPaper elevation={0}>
            <Typography variant='h6' gutterBottom>
              Citations
            </Typography>
            <Typography variant='body2'>
              {paper.citations} citations
            </Typography>
          </StyledPaper>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color='primary'>
          Close
        </Button>
        <Button
          color='primary'
          variant='contained'
          onClick={() => window.open(paper.url, '_blank')}
        >
          View Paper
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PaperDetails
