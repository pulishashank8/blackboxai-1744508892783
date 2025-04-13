const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const Call = require('../models/Call');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post('/upload-call', upload.single('audio'), async (req, res) => {
  try {
    // 1. Upload to AssemblyAI for transcription
    const assemblyResponse = await axios.post(
      'https://api.assemblyai.com/v2/transcript',
      {
        audio_url: req.file.path
      },
      {
        headers: {
          authorization: process.env.ASSEMBLYAI_API_KEY,
          'content-type': 'application/json'
        }
      }
    );

    // 2. Get transcription result
    const transcriptId = assemblyResponse.data.id;
    let transcriptResult;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const transcriptResponse = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: {
            authorization: process.env.ASSEMBLYAI_API_KEY
          }
        }
      );

      if (transcriptResponse.data.status === 'completed') {
        transcriptResult = transcriptResponse.data.text;
        break;
      } else if (transcriptResponse.data.status === 'error') {
        throw new Error('Transcription failed');
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
      attempts++;
    }

    if (!transcriptResult) {
      throw new Error('Transcription timed out');
    }

    // 3. Send to Gemini for summarization and task extraction
    const geminiResponse = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      {
        contents: [{
          parts: [{
            text: `Summarize this call transcript and extract action items in JSON format:\n\n${transcriptResult}`
          }]
        }]
      },
      {
        params: {
          key: process.env.GEMINI_API_KEY
        }
      }
    );

    const summary = geminiResponse.data.candidates[0].content.parts[0].text;
    const tasks = extractTasksFromSummary(summary);

    // 4. Save to MongoDB
    const call = new Call({
      transcript: transcriptResult,
      summary,
      tasks
    });

    await call.save();

    res.json({
      transcript: transcriptResult,
      summary,
      tasks
    });

  } catch (error) {
    console.error('Error processing call:', error);
    res.status(500).json({ error: 'Failed to process call' });
  }
});

function extractTasksFromSummary(summary) {
  // This is a simplified implementation
  // In a real app, you would parse the Gemini response more carefully
  try {
    const taskMatch = summary.match(/\[.*\]/s);
    if (taskMatch) {
      return JSON.parse(taskMatch[0]);
    }
    return [];
  } catch (e) {
    return [];
  }
}

module.exports = router;
