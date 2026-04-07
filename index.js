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
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    webSearchEnabled: true
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Claude Proxy avec recherche web' });
});

// Proxy Claude API AVEC recherche web
app.post('/api/claude', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const { model, max_tokens, system, messages, useWebSearch } = req.body;

    console.log(`[Claude] Request with webSearch=${useWebSearch}`);

    // Construire la requête
    const requestBody = {
      model: model || 'claude-haiku-4-5-20251001',
      max_tokens: max_tokens || 4096,
      system: system || '',
      messages: messages || [],
    };

    // Ajouter l'outil de recherche web si demandé
    if (useWebSearch) {
      requestBody.tools = [{
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 5
      }];
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Claude] Error:', data);
      return res.status(response.status).json(data);
    }

    // Extraire le texte de la réponse (peut contenir plusieurs blocs avec web search)
    let fullText = '';
    if (data.content && Array.isArray(data.content)) {
      for (const block of data.content) {
        if (block.type === 'text') {
          fullText += block.text;
        }
      }
    }

    console.log(`[Claude] Success: ${data.usage?.output_tokens || '?'} tokens`);
    
    // Retourner la réponse avec le texte extrait
    res.json({
      ...data,
      extractedText: fullText
    });

  } catch (error) {
    console.error('[Claude] Error:', error);
    res.status(500).json({ error: 'Proxy error', message: String(error) });
  }
});

app.listen(PORT, () => {
  console.log(`Claude Proxy on port ${PORT}`);
});
