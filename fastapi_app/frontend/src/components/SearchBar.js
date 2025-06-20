import React from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

const SearchBar = ({ value, onChange, placeholder, onClear }) => {
  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder={placeholder || 'Search...'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: value && (
            <InputAdornment position="end">
              <Tooltip title="Clear search">
                <IconButton
                  size="small"
                  onClick={onClear}
                  edge="end"
                >
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: 'background.paper',
            '&:hover': {
              '& > fieldset': {
                borderColor: 'primary.main',
              },
            },
          },
        }}
      />
    </Box>
  );
};

export default SearchBar; 