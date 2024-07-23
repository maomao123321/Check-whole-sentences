import React, { useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, IconButton } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CampaignIcon from '@mui/icons-material/Campaign';

function WordSuggestions({ suggestions, onSuggestionConfirm, onTextToSpeech, onRegenerateSuggestions, sx }) {
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  const handleSuggestionClick = (suggestion) => {
    setSelectedSuggestion(suggestion);
  };

  const handleConfirmClick = () => {
    if (selectedSuggestion) {
      onSuggestionConfirm(selectedSuggestion);
      setSelectedSuggestion(null);
    }
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 2, backgroundColor: '#f5f5f5', ...sx }}>
      <Typography variant="h6" gutterBottom sx={{ fontSize: '1.4rem' }}>
        AI Word Suggestions
      </Typography>
      {suggestions ? (
        <>
          <List>
            {suggestions.map((suggestion, index) => (
              <ListItem
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                sx={{
                  backgroundColor: selectedSuggestion === suggestion ? '#e0e0e0' : 'transparent',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#e8e8e8',
                  },
                  borderRadius: '4px',
                  mb: 1,
                }}
              >
                <ListItemText
                  primary={suggestion.trim()}
                  primaryTypographyProps={{
                    fontSize: 'inherit',
                    fontWeight: selectedSuggestion === suggestion ? 'bold' : 'normal',
                  }}
                />
                <IconButton onClick={(e) => {
                  e.stopPropagation();
                  onTextToSpeech(suggestion.trim());
                }} size="small">
                  <CampaignIcon />
                </IconButton>
              </ListItem>
            ))}
          </List>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <IconButton
              onClick={handleConfirmClick}
              disabled={!selectedSuggestion}
              sx={{
                '&.Mui-disabled': {
                  color: 'rgba(0, 0, 0, 0.26)',
                },
              }}
            >
              <CheckCircleIcon
                sx={{
                  fontSize: '2.5rem',
                  color: '#1976d2',
                }}
              />
              Yes
            </IconButton>
      
            <IconButton
              onClick={onRegenerateSuggestions}
              sx={{
                ml: 2,
              }}
            >
              <CancelIcon
                sx={{
                  fontSize: '2.5rem',
                  color: 'red',
                }}
              />
              No
            </IconButton>
          </Box>
        </>
      ) : (
        <Typography sx={{ fontSize: '1.2rem' }}>Click on a highlighted word for suggestions.</Typography>
      )}
    </Box>
  );
}

export default WordSuggestions;