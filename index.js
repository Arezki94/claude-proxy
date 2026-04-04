import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS pour permettre les requêtes depuis ton app
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Route health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Claude Proxy API is running',
    version: '1.0.0'
  });
});

// Route proxy pour Claude API
app.post('/api/claude', async (req, res) => {
  try {
    const { model, max_tokens, temperature, system, messages } = req.body;

    // Valider que la clé API est configurée
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'CLAUDE_API_KEY not configured on server' 
      });
    }

    // Appeler Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-sonnet-20241022',
        max_tokens: max_tokens || 8000,
        temperature: temperature || 0.5,
        system: system || '',
        messages: messages || []
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ 
        error: `Claude API error: ${error}` 
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Claude Proxy running on port ${PORT}`);
});
