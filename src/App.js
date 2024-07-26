import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Grid, Typography, IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import VoiceInput from './VoiceInput';
import CorrectArea from './CorrectArea';
import WordSuggestions from './WordSuggestions';
import axios from 'axios';


function App() {
  const [inputTexts, setInputTexts] = useState([]);
  const [suggestions, setSuggestions] = useState(null);
  const [currentError, setCurrentError] = useState(null);
  const chatAreaRef = useRef(null);
  const [correctedErrors, setCorrectedErrors] = useState({});


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
            For context errors, suggest contextually appropriate alternative words, not sentences.
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
      
      setInputTexts(prevTexts => {
        const newTexts = [...prevTexts];
        // 添加新的纠正消息到列表末尾
        newTexts.push({ text: correctedText, isUser: false, isCorrection: true });
        return newTexts;
      });
  
      setCorrectedErrors(prev => ({
        ...prev,
        [error]: suggestion
      }));
  
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

  const handleReset = () => {
    setInputTexts([]);
    setSuggestions(null);
    setCurrentError(null);
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
        justifyContent: 'space-between',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        py: 2,
        px: 3,
      }}>
        <Box sx={{ width: '30%' }} /> {/* 左侧空白占位 */}
        <Typography variant="h2" component="h1" sx={{
          textAlign: 'center',
          fontSize: '2.5rem',
          width: '40%',
        }}>
          Check your Sentences
        </Typography>
        <Box sx={{ 
          width: '30%', 
          display: 'flex', 
          justifyContent: 'flex-end',
          alignItems: 'center'
        }}>
        <IconButton
          onClick={handleReset}
          sx={{
            color: 'primary.contrastText',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <RefreshIcon sx={{ fontSize: 60 }} />
          <Typography variant="caption" sx={{ mt: 1, fontSize: 20}}>
            Clear
          </Typography>
        </IconButton>
      </Box>
    </Box>


<Box sx={{ p:2, backgroundColor: 'background.paper'}}>
  <VoiceInput onInputComplete={handleInputComplete} />
</Box>

<Grid container sx={{ flexGrow: 1, p: 3, mt: 2, pr: 10, height: 'calc(100vh - 300px)' }}>
  <Grid item xs={8} sx={{ pr: 10, height: '100%', overflow: 'auto' }}>
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
      }}
    >
{inputTexts.map((item, index) => (
  <CorrectArea
  key={index} 
  inputText={item.text} 
  isUser={item.isUser}
  isCorrection={item.isCorrection}  
  onErrorClick={handleErrorClick}
  onTextToSpeech={handleTextToSpeech}
  correctedErrors={correctedErrors}
    sx={{ 
      height: 'auto',
      minHeight: '80px',
      fontSize: '1.4rem',
      flexShrink: 0,
      mb: 2,
    }}
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
            onRegenerateSuggestions={() => handleErrorClick(currentError.error, currentError.errorType, currentError.context)}
            sx={{ fontSize: '1.4rem' }} 
          />
        </Paper>
      </Grid>
    </Grid>

    
  </Box>
);
}

export default App;