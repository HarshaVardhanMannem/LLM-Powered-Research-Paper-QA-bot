// src/components/AddPaperSection.js
import React, { useState } from 'react'
import { Box, Typography, TextField, Button, CircularProgress, useTheme } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'

const AddPaperSection = ({ onAddPaper }) => {
  const [paperId, setPaperId] = useState('')
  const [loading, setLoading] = useState(false)
  const theme = useTheme()

  const handleAdd = async () => {
    if (!paperId.trim()) return

    setLoading(true)
    try {
      await onAddPaper(paperId)
      setPaperId('')
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ bgcolor: theme.palette.background.paper, borderRadius: 3, p: 2, color: theme.palette.text.primary }}>
      <Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 2, color: 'text.primary', fontSize: 18 }}>
        Add New Paper
      </Typography>
      <TextField
        fullWidth
        label='ArXiv Paper ID'
        value={paperId}
        onChange={(e) => setPaperId(e.target.value)}
        margin='normal'
        helperText='e.g., 1706.03762'
        variant='outlined'
        size='small'
        sx={{
          bgcolor: theme.palette.background.default,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            background: theme.palette.background.default,
            color: theme.palette.text.primary
          }
        }}
      />
      <Button
        fullWidth
        variant='contained'
        startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <AddIcon />}
        onClick={handleAdd}
        disabled={loading}
        sx={{ mt: 2, py: 1, borderRadius: 2, fontWeight: 700, fontSize: 16 }}
      >
        {loading ? 'Adding Paper...' : 'Add Paper'}
      </Button>
    </Box>
  )
}

export default AddPaperSection
