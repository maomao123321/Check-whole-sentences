import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Grid, Typography, Tooltip } from '@mui/material';
import VoiceInput from './VoiceInput';
import CorrectArea from './CorrectArea';
import WordSuggestions from './WordSuggestions';
import axios from 'axios';
import CampaignIcon from '@mui/icons-material/Campaign';

function App() {
  const [inputTexts, setInputTexts] = useState([]);
  const [suggestions, setSuggestions] = useState(null);
  const [currentError, setCurrentError] = useState(null);
  const chatAreaRef = useRef(null);


  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [inputTexts]);


  const handleInputComplete = (text) => {
    setInputTexts(prevTexts => [...prevTexts, { text, isUser: true }]);
  };

    //AI give suggestions
    
  const handleErrorClick = async (error, errorType, context) => {
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a word suggestion system. Based on the error type and context, suggest three appropriate alternatives. 
            For spelling errors, suggest correct spellings. 
            For incomplete words, suggest complete words. 
            For context errors, suggest contextually appropriate alternatives.
            Provide exactly three suggestions, one per line, without any numbering or additional text.`
          },
          {
            role: "user",
            content: `Error type: ${errorType}
            Error word: ${error}
            Context: ${context}
            Provide three suggestions.`
          }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
  
      let suggestedWords = response.data.choices[0].message.content
        .split('\n')
        .map(word => word.trim())
        .filter(word => word !== '');
  
      // 确保只有三个建议
      suggestedWords = suggestedWords.slice(0, 3);
  
      // 如果建议少于三个，用空字符串填充
      while (suggestedWords.length < 3) {
        suggestedWords.push('');
      }
  
      setSuggestions(suggestedWords);
      setCurrentError({ error, errorType, context });
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleSuggestionConfirm = async (suggestion) => {
    if (currentError) {
      const { error, context } = currentError;
      const correctedText = context.replace(error, suggestion);
      
      setInputTexts(prevTexts => [...prevTexts, { text: correctedText, isUser: false }]);
      setSuggestions(null);
      setCurrentError(null);
    }
  };

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [inputTexts]);

  const handleTextToSpeech = async (text) => {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/audio/speech',
        {
          model: "tts-1",
          input: text,
          voice: "alloy",
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        }
      );
  
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('Error in text-to-speech:', error);
    }
  };


  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        py: 2,
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          width: '30%',
          ml: 2
        }}>
          <Tooltip title="Spelling error" placement="bottom">
            <Typography sx={{
              fontSize: '0.9rem',
              bgcolor: 'yellow',
              color: 'black',
              px: 1.5,
              py: 0.5,
              mr: 1,
              borderRadius: '20px',
              fontWeight: 'bold'
            }}>
              Spelling
            </Typography>
          </Tooltip>
          <Tooltip title="Incomplete word" placement="bottom">
            <Typography sx={{
              fontSize: '0.9rem',
              bgcolor: 'orange',
              color: 'black',
              px: 1.5,
              py: 0.5,
              mr: 1,
              borderRadius: '20px',
              fontWeight: 'bold'
            }}>
              Incomplete
            </Typography>
          </Tooltip>
          <Tooltip title="Context error" placement="bottom">
            <Typography sx={{
              fontSize: '0.9rem',
              bgcolor: 'pink',
              color: 'black',
              px: 1.5,
              py: 0.5,
              borderRadius: '20px',
              fontWeight: 'bold'
            }}>
              Context
            </Typography>
          </Tooltip>
        </Box>
        <Typography variant="h2" component="h1" sx={{
          textAlign: 'center',
          flexGrow: 1,
          fontSize: '2.5rem',
          width: '40%',
        }}>
          Co-create sentences
        </Typography>
        <Box sx={{ width: '30%' }} />
      </Box>


<Grid container sx={{ flexGrow: 1, p: 3, mt: 2, mb: 10, pr: 10 , 
  height: 'calc(100vh - 250px)',  }}>
      <Grid item xs={8} sx={{ pr: 10, height: '90%', overflow: 'auto'  }}>
        <Paper
          ref={chatAreaRef}
          elevation={3}
          sx={{
            width: '100%',
            height: '100%',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            p: 2,
            '& > *:not(:last-child)': { mb: 2 },
            fontSize: '1.4rem'
          }}
        >
          {inputTexts.map((item, index) => (
            <CorrectArea 
            key={index} 
            inputText={item.text} 
            isUser={item.isUser}
            onErrorClick={handleErrorClick}
            onTextToSpeech={handleTextToSpeech}
            sx={{ fontSize: '1.4rem' }}
          />

))}
        </Paper>
      </Grid>
      <Grid item xs={4} sx={{ pl: 2 , pr: 1}}>
        <Paper
          elevation={3}
          sx={{
            width: '100%',
            height: '85%',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            p: 2,
            fontSize: '1.4rem',
          }}
        >
          <WordSuggestions 
            suggestions={suggestions}
            onSuggestionConfirm={handleSuggestionConfirm}
            onTextToSpeech={handleTextToSpeech}
            sx={{ fontSize: '1.4rem' }} 
          />
        </Paper>
      </Grid>
    </Grid>

    <Box sx={{ 
      p: 2, 
      position: 'fixed', 
      bottom: 0, 
      left: 0, 
      right: 0,
      backgroundColor: 'background.paper',
      zIndex: 1000
    }}>
      <VoiceInput onInputComplete={handleInputComplete} />
    </Box>
  </Box>
);
}

export default App;