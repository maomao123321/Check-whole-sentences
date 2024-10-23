import React, { useState, useRef } from 'react';
import { TextField, Box, IconButton } from '@mui/material';
import { Mic, Stop, Send } from '@mui/icons-material';
import axios from 'axios';

function VoiceInput({ onInputComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await recognizeSpeech(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const recognizeSpeech = async (audioBlob) => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-1');

    try {
      const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setInputText(response.data.text);
    } catch (error) {
      console.error('Error in speech recognition:', error);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleInputChange = (event) => {
    setInputText(event.target.value);
  };

  const handleSubmit = () => {
    if (inputText.trim()) {
      onInputComplete(inputText);
      setInputText('');
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        backgroundColor: 'background.paper',
      }}
    >
      <TextField
        variant="outlined"
        value={inputText}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder="Speak or input uncertain sentence here. e.g. I feel hapy for your grad"
        sx={{ 
          width: '60%',
          mr: 2,
          '& .MuiInputBase-root': {
            height: '4rem',
          },
          '& .MuiInputBase-input': {
            fontSize: '1.4rem',
            height: '4rem',
            padding: '0 1rem',
            display: 'flex',
            alignItems: 'center',
          }
        }}
      />
      <IconButton 
        onClick={toggleRecording}
        color={isRecording ? "error" : "primary"}
        sx={{ mr: 1 }}
      >
        {isRecording ? <Stop sx={{ fontSize: 40 }} /> : <Mic sx={{ fontSize: 40 }} />}
      </IconButton>
      <IconButton 
        onClick={handleSubmit}
        sx={{ color: '#4CAF50' }}
      >
        <Send sx={{ fontSize: 40 }} />
      </IconButton>
    </Box>
  );
}

export default VoiceInput;
