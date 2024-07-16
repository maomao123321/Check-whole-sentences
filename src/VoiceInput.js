import React, { useState, useRef } from 'react';
import { Button, TextField, Box } from '@mui/material';
import { Mic, MicOff } from '@mui/icons-material';
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
    onInputComplete(inputText);
    setInputText('');
  };

  return (
    <Box display="flex" alignItems="center" mb={2}>
      <TextField
        fullWidth
        variant="outlined"
        value={inputText}
        onChange={handleInputChange}
        placeholder="Speak or input uncertain sentence here. e.g. I feel hapy for your grad"
      />
      <Button
        onClick={toggleRecording}
        color={isRecording ? 'secondary' : 'primary'}
        variant="contained"
        sx={{ marginLeft: '10px' }}
      >
        {isRecording ? <MicOff /> : <Mic />}
      </Button>
      <Button
        onClick={handleSubmit}
        color="primary"
        variant="contained"
        sx={{ marginLeft: '10px' }}
      >
        Submit
      </Button>
    </Box>
  );
}

export default VoiceInput;