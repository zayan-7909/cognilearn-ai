// setup.js - Run with: node setup.js
const fs = require('fs');
const path = require('path');

const files = {
  // 1. Root .env example
  'server/.env.example': `
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cognilearn
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=supersecretjwtkey_123456
GEMINI_API_KEY=your_gemini_api_key_here
`.trim(),

  // 2. Server package.json
  'server/package.json': JSON.stringify({
    name: "cognilearn-server",
    version: "1.0.0",
    type: "module",
    scripts: {
      "start": "node server.js",
      "worker": "node queues/ingestionWorker.js"
    },
    dependencies: {
      "@google/genai": "^0.1.1",
      "bcrypt": "^5.1.1",
      "bullmq": "^5.0.0",
      "cors": "^2.8.5",
      "dotenv": "^16.4.5",
      "express": "^4.19.2",
      "ioredis": "^5.4.1",
      "jsonwebtoken": "^9.0.2",
      "multer": "^1.4.5-lts.1",
      "pdf-parse": "^1.1.1",
      "pg": "^8.11.5"
    }
  }, null, 2),

  // 3. Server entry point (server/server.js)
  'server/server.js': `
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
`.trim(),

  // 4. Client package.json
  'client/package.json': JSON.stringify({
    name: "cognilearn-client",
    version: "1.0.0",
    type: "module",
    scripts: {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview"
    },
    dependencies: {
      "@tailwindcss/vite": "^4.0.0",
      "@xyflow/react": "^12.0.0",
      "lucide-react": "^0.400.0",
      "react": "^19.0.0",
      "react-dom": "^19.0.0",
      "react-pdf": "^9.0.0",
      "tailwindcss": "^4.0.0"
    },
    devDependencies: {
      "@vitejs/plugin-react": "^4.3.0",
      "vite": "^5.3.0"
    }
  }, null, 2)
};

// Write files recursively
Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
  console.log(`Created: ${filePath}`);
});

console.log('\nSetup complete! Populate server/.env with your API credentials and run npm install inside /server and /client.');