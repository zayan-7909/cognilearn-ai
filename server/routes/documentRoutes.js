import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth.js';
import { pool } from '../config/db.js';
import { documentQueue } from '../queues/ingestionQueue.js';

const router = Router();

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// Upload Document & Enqueue Background Embedding Processing
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO documents (user_id, title, file_path, file_size_bytes, status)
       VALUES ($1, $2, $3, $4, 'PROCESSING')
       RETURNING *`,
      [req.user.id, req.file.originalname, req.file.path, req.file.size]
    );

    const doc = rows[0];

    // Enqueue BullMQ Ingestion Job
    await documentQueue.add('parse-pdf', {
      documentId: doc.id,
      filePath: req.file.path,
    });

    res.status(202).json({
      message: 'Document uploaded and processing queued',
      document: doc,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List User Documents
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, title, file_size_bytes, status, created_at FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;