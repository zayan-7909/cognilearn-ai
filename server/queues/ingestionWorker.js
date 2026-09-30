import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { pool } from '../config/db.js';
import { getEmbedding } from '../services/gemini.js';

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

function chunkText(text, chunkSize = 400, overlap = 40) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  return chunks;
}

export const documentWorker = new Worker(
  'document-processing',
  async (job) => {
    const { documentId, filePath } = job.data;
    console.log(`[Worker] Ingesting document: ${documentId}`);

    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);

      const chunks = chunkText(pdfData.text, 400, 40);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (!chunk.trim()) continue;

        const embedding = await getEmbedding(chunk);

        await pool.query(
          `INSERT INTO document_chunks (document_id, page_number, chunk_index, content, embedding)
           VALUES ($1, $2, $3, $4, $5)`,
          [documentId, 1, i, chunk, `[${embedding.join(',')}]`]
        );
      }

      await pool.query(
        `UPDATE documents SET status = 'READY' WHERE id = $1`,
        [documentId]
      );
      console.log(`[Worker] Document ${documentId} ready.`);
    } catch (err) {
      console.error(`[Worker] Ingestion failed:`, err);
      await pool.query(
        `UPDATE documents SET status = 'FAILED' WHERE id = $1`,
        [documentId]
      );
    }
  },
  { connection: redisConnection }
);