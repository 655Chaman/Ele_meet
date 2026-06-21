const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local
dotenv.config({ path: path.resolve('.env.local') });

// Configuration
const HQ_DIR = path.resolve('../../'); 
const DB_PATH = path.resolve('./lancedb_data');
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 150;

const TARGET_DIRS = [
  'documents-and-reference',
  'automation-blueprints',
  'business-operations',
  'meeting-copilot/memory/doctrine',
];

if (!process.env.NVIDIA_API_KEY) {
  console.error("FATAL: NVIDIA_API_KEY is missing in .env.local");
  process.exit(1);
}

async function generateEmbedding(text) {
  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        input: text,
        model: "nvidia/nv-embedqa-e5-v5",
        input_type: "passage"
      })
    });
    
    if (!res.ok) {
      throw new Error(`NVIDIA API Error: ${res.statusText}`);
    }
    
    const data = await res.json();
    return data.data[0].embedding;
  } catch (err) {
    console.error("Embedding generation failed:", err.message);
    return null;
  }
}

function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('.git') && !filePath.includes('lancedb_data')) {
        getFiles(filePath, fileList);
      }
    } else {
      // ONLY process text files, skip PDFs to prevent parser crashes
      if (filePath.match(/\.(md|txt|json)$/)) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

function chunkText(text, size, overlap) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size - overlap;
  }
  return chunks;
}

async function extractText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error(`Failed to read ${filePath}:`, err.message);
    return '';
  }
}

async function main() {
  console.log('🚀 Starting Doctrine Ingestion Engine...');
  const lancedb = await import('@lancedb/lancedb');

  let allFiles = [];
  for (const dir of TARGET_DIRS) {
    const fullPath = path.join(HQ_DIR, dir);
    allFiles = allFiles.concat(getFiles(fullPath));
  }
  
  const claudePath = path.join(HQ_DIR, 'CLAUDE.md');
  if (fs.existsSync(claudePath)) allFiles.push(claudePath);

  console.log(`Found ${allFiles.length} source files.`);
  console.log(`Connecting to LanceDB at ${DB_PATH}...`);
  const db = await lancedb.connect(DB_PATH);
  
  const tables = await db.tableNames();
  if (tables.includes('doctrine')) {
    await db.dropTable('doctrine');
  }

  const records = [];
  console.log("Vectorizing chunks. This will take a moment...");
  
  for (const filePath of allFiles) {
    console.log(`Processing: ${path.basename(filePath)}`);
    const rawText = await extractText(filePath);
    if (!rawText || rawText.trim().length === 0) continue;

    const cleanText = rawText.replace(/\s+/g, ' ').trim();
    const chunks = chunkText(cleanText, CHUNK_SIZE, CHUNK_OVERLAP);

    for (const chunk of chunks) {
      if (chunk.trim().length < 50) continue;

      const embedding = await generateEmbedding(chunk);
      if (!embedding) continue;

      records.push({
        text: chunk,
        source: path.basename(filePath),
        vector: embedding
      });
      
      await new Promise(r => setTimeout(r, 100));
    }
  }

  console.log(`Generated ${records.length} chunks. Inserting into LanceDB...`);

  if (records.length > 0) {
    await db.createTable('doctrine', records);
    console.log('✅ Ingestion complete! The Brain is ready.');
  } else {
    console.log('⚠️ No records generated. Check source files.');
  }
}

main().catch(console.error);
