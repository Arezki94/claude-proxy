import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8080;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    hasApiKey: !!process.env.ANTHROPIC_API_KEY 
  });
});

app.get('/api/status', (req, res) => {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  res.json({
    configured: hasKey,
    model: 'claude-3-5-haiku-20241022'
  });
});

app.post('/api/claude', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const { model, max_tokens, system, messages } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-haiku-20241022',
        max_tokens: max_tokens || 4096,
        system: system || '',
        messages: messages || [],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);

  } catch (error) {
    res.status(500).json({ error: 'Proxy error', message: String(error) });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Claude Proxy OK' });
});

app.listen(PORT, () => {
  console.log(`Claude Proxy on port ${PORT}`);
});
