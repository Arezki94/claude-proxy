import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8080;

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    hasApiKey: !!process.env.ANTHROPIC_API_KEY 
  });
});

// Status
app.get('/api/status', (req, res) => {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  res.json({
    configured: hasKey,
    keyPreview: hasKey ? `sk-...${process.env.ANTHROPIC_API_KEY.slice(-4)}` : 'NOT SET',
    model: 'claude-3-haiku-20240307'
  });
});

// Proxy Claude API
app.post('/api/claude', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const { model, max_tokens, system, messages } = req.body;

    console.log(`[Claude] Request: ${messages?.length || 0} messages`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-3-haiku-20240307',
        max_tokens: max_tokens || 4096,
        system: system || '',
        messages: messages || [],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Claude] Error:', data);
      return res.status(response.status).json(data);
    }

    console.log(`[Claude] Success: ${data.usage?.output_tokens || '?'} tokens`);
    res.json(data);

  } catch (error) {
    console.error('[Claude] Error:', error);
    res.status(500).json({ error: 'Proxy error', message: String(error) });
  }
});

// Root
app.get('/', (req, res) => {
  res.json({ message: 'Claude Proxy OK', endpoints: ['/health', '/api/status', '/api/claude'] });
});

app.listen(PORT, () => {
  console.log(`🚀 Claude Proxy on port ${PORT}`);
  console.log(`🔑 API Key: ${process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET'}`);
});
