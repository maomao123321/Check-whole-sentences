import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, IconButton } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import axios from 'axios';

function CorrectArea({ inputText, isUser, onErrorClick, onTextToSpeech, sx  }) {
  const [highlightedText, setHighlightedText] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (inputText) {
      identifyErrors(inputText);
    }
  }, [inputText]);

  const identifyErrors = async (text) => {
    setLoading(true);
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a precise error detection system. Identify three types of errors in the given text:
            1. Spelling errors: Incorrect spelling of words in the context. Example: "aple" instead of "apple".
            2. Incomplete errors: Incomplete words in the context. Example: "gra" or "gradu" instead of "graduation".
            3. Context errors: Words or phrases that don't fit the overall context of the sentence. Example: "apple" in "I am reading an apple in library".
            
            For context errors, only highlight the specific word or short phrase that's out of context, not the entire sentence.
            
            Respond with a JSON object in the following format:
            {
              "spelling": [{"error": "misspelled word", "target": "correct spelling"}],
              "incomplete": [{"error": "incomplete word", "target": "complete word"}],
              "context": [{"error": "contextually incorrect word or phrase", "target": "suggested correct word"}]
            }
            
            If there are no errors of a particular type, return an empty array for that type.`
          },
          {
            role: "user",
            content: text
          }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
  
      console.log('API Response:', response.data);  // 添加这行来记录API的完整响应
  
      try {
        const errors = JSON.parse(response.data.choices[0].message.content);
        console.log('Parsed Errors:', errors);  // 添加这行来记录解析后的错误
  
        if (!errors.spelling && !errors.incomplete && !errors.context) {
          throw new Error('Invalid error format');
        }
  
        setHighlightedText({ text, errors });
      } catch (parseError) {
        console.error('Error parsing API response:', parseError);
        // 如果解析失败，设置一个空的错误对象
        setHighlightedText({ text, errors: { spelling: [], incomplete: [], context: [] } });
      }
    } catch (error) {
      console.error('Error calling ChatGPT API:', error);
      // 如果API调用失败，也设置一个空的错误对象
      setHighlightedText({ text, errors: { spelling: [], incomplete: [], context: [] } });
    } finally {
      setLoading(false);
    }
  };

  const handleErrorClick = (error, errorType) => {
    onErrorClick(error, errorType, inputText);
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Text copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const renderHighlightedText = () => {
    if (!highlightedText) return null;

    const { text, errors } = highlightedText;
    console.log('Rendering text:', text);
    console.log('Errors:', errors);
    let result = text;
    const allErrors = [
      ...(errors.spelling || []),
      ...(errors.incomplete || []),
      ...(errors.context || [])
    ];

    console.log('All errors:', allErrors);  // 添加这行

    if (allErrors.length === 0) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '1.4rem', flexGrow: 1 }}>{text}</Typography>
          <IconButton onClick={() => onTextToSpeech(text)} size="small" sx={{ ml: 1 }}>
            <VolumeUpIcon />
          </IconButton>
          <IconButton onClick={() => handleCopyText(text)} size="small" sx={{ ml: 1 }}>
            <ContentCopyIcon />
          </IconButton>
        </Box>
      );
    }
    
    // 按错误在文本中的位置排序，从后往前替换
    allErrors.sort((a, b) => text.indexOf(b.error) - text.indexOf(a.error));

    allErrors.forEach(({ error, target }, index) => {
      let color;
      let errorType;
      if (errors.spelling && errors.spelling.some(e => e.error === error)) {
        color = 'yellow';
        errorType = 'spelling';
      } else if (errors.incomplete && errors.incomplete.some(e => e.error === error)) {
        color = 'yellow';
        errorType = 'incomplete';
      } else {
        color = 'yellow';
        errorType = 'context';
      }

      const regex = new RegExp(`\\b${error}\\b`, 'g');
      result = result.replace(regex, `<span class="error" data-error-index="${index}" data-error-type="${errorType}" style="background-color: ${color}; cursor: pointer;">${error}</span>`);
    });

    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography 
            variant="body1" 
            component="div" 
            sx={{ 
              fontSize: '1.4rem',
              flexGrow: 1,
              '& .error': {
                fontSize: 'inherit',
                cursor: 'pointer'
              }
            }}
            dangerouslySetInnerHTML={{ __html: result }} 
            onClick={(event) => {
              if (event.target.className === 'error') {
                const errorIndex = parseInt(event.target.getAttribute('data-error-index'));
                const errorType = event.target.getAttribute('data-error-type');
                handleErrorClick(allErrors[errorIndex].error, errorType);
              }
            }}
          />
          <IconButton onClick={() => onTextToSpeech(text)} size="small" sx={{ ml: 1 }}>
            <VolumeUpIcon />
          </IconButton>
          <IconButton onClick={() => handleCopyText(text)} size="small" sx={{ ml: 1 }}>
          <ContentCopyIcon />
        </IconButton>
        </Box>
      );
    };

  return (
    <Box sx={{ 
      p: 1, 
      backgroundColor: isUser ? '#f0f0f0' : '#e3f2fd',
      overflow: 'auto',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      ...sx  // 包含传入的 sx 属性
      }}>
      {loading ? (
        <CircularProgress />
      ) : highlightedText ? (
        renderHighlightedText()
      ) : (
        <Typography sx={{ fontSize: '1.2rem' }}>Please choose one word on right.</Typography>
      )}
    </Box>
  );
}

export default CorrectArea;