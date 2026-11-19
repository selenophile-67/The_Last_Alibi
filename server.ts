import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT =
  process.env.NODE_ENV === 'production' ? Number(process.env.PORT) || 3000 : 3000;

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // AI Background Music Composition Endpoint (server-side Gemini SDK)
  app.post('/api/music/compose', async (req, res) => {
    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
      return;
    }

    const { mood = 'office', caseTitle = 'Ravenwood Mystery', locationName = 'Detective Office', tension = 40 } = req.body ?? {};

    const prompt = `Compose a moody dark-noir detective background music loop in JSON for an investigation scene.
Context:
- Game: THE LAST ALIBI
- Mood: ${mood} (options: menu, office, crime_scene, interrogation, revelation, intuition)
- Case: ${caseTitle}
- Location: ${locationName}
- Tension Level: ${tension}/100

Musical constraints:
- Use dark minor / harmonic minor / diminished noir jazz harmonies (A minor, D minor, C minor, or G minor).
- bpm between 56 and 96 depending on tension.
- bassLine: exactly 8 low upright-bass note frequencies in Hz (between 55 and 165 Hz).
- chords: exactly 4 dark jazz chords, each an array of 3 note frequencies in Hz (between 140 and 420 Hz).
- melody: exactly 8 sparse haunting noir lead notes in Hz (between 260 and 660 Hz, use 0 for silent rests to give breathing room).
- instrumentStyle: choose one of "rhodes_noir", "muted_brass", "vibraphone_mist", "cello_pulse".`;

    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            systemInstruction:
              'You are a cinematic dark-noir film composer writing loopable harmonic motifs in valid Hz frequencies. Return strictly valid JSON matching the schema.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'Evocative noir track title (2-4 words)' },
                bpm: { type: Type.INTEGER, description: 'Tempo in beats per minute (56-96)' },
                keySignature: { type: Type.STRING, description: 'Musical key e.g. A Minor' },
                instrumentStyle: {
                  type: Type.STRING,
                  description: 'One of: rhodes_noir, muted_brass, vibraphone_mist, cello_pulse',
                },
                bassLine: {
                  type: Type.ARRAY,
                  items: { type: Type.NUMBER },
                  description: '8 bass frequencies in Hz',
                },
                chords: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                  },
                  description: '4 chords each with 3 note frequencies in Hz',
                },
                melody: {
                  type: Type.ARRAY,
                  items: { type: Type.NUMBER },
                  description: '8 melody note frequencies in Hz (0 for rest)',
                },
              },
              required: ['title', 'bpm', 'keySignature', 'instrumentStyle', 'bassLine', 'chords', 'melody'],
            },
          },
        });

        const raw = (response.text ?? '').trim();
        const parsed = JSON.parse(raw);
        res.json({ score: parsed, source: 'gemini-4-hydrogen' });
        return;
      } catch (err) {
        lastErr = err;
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }

    const message = lastErr instanceof Error ? lastErr.message : 'Failed to compose AI score';
    res.status(502).json({ error: message });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`THE LAST ALIBI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
