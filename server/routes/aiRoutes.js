import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { pool } from '../config/db.js';
import { getEmbedding, generateRAGAnswer, generateMindMapGraph } from '../services/gemini.js';

const router = Router();

// Vector Search + RAG Generation
router.post('/chat', authenticate, async (req, res) => {
  const { documentId, message } = req.body;
  if (!documentId || !message) {
    return res.status(400).json({ error: 'documentId and message are required' });
  }

  try {
    const queryVector = await getEmbedding(message);

    // Cosine similarity retrieval over pgvector embeddings
    const vectorQuery = `
      SELECT content, page_number, 1 - (embedding <=> $1) AS similarity
      FROM document_chunks
      WHERE document_id = $2
      ORDER BY similarity DESC
      LIMIT 4;
    `;
    const { rows: chunks } = await pool.query(vectorQuery, [
      `[${queryVector.join(',')}]`,
      documentId,
    ]);

    if (chunks.length === 0) {
      return res.json({
        answer: 'No processed chunks found for this document. Make sure it is ingested and ready.',
        sources: [],
      });
    }

    const answer = await generateRAGAnswer(message, chunks);

    res.json({
      answer,
      sources: chunks.map((c) => ({
        page: c.page_number,
        preview: c.content.slice(0, 100),
      })),
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Generate Mind Map Graph Data
router.post('/mindmap', authenticate, async (req, res) => {
  const { documentId } = req.body;

  try {
    const { rows } = await pool.query(
      'SELECT content FROM document_chunks WHERE document_id = $1 LIMIT 8',
      [documentId]
    );

    const sampleText = rows.map((r) => r.content).join('\n');
    const graph = await generateMindMapGraph(sampleText || 'General Learning Concepts');

    res.json(graph);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/mindmap/:documentId', async (req, res) => {
  const { documentId } = req.params;

  try {
    const { rows: chunks } = await pool.query(
      'SELECT content FROM document_chunks WHERE document_id = $1 ORDER BY chunk_index ASC LIMIT 8',
      [documentId]
    );

    if (chunks.length === 0) {
      return res.status(404).json({ error: 'No chunks available for this document' });
    }

    const fullText = chunks.map((c) => c.content).join('\n\n');
    const graphData = await generateMindMapGraph(fullText);
    res.json(graphData);
  } catch (err) {
    console.error('[Mindmap Error]:', err);
    res.status(500).json({ error: err.message });
  }
});
export default router;