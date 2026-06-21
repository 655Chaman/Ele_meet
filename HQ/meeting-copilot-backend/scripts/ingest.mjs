import * as fs from 'fs';
import * as path from 'path';
import * as lancedb from 'vectordb';
import { pipeline } from '@xenova/transformers';

const DOCTRINE_PATH = '/Users/syedchamansha/HQ/compiled-doctrine.md';
const DB_PATH = '/Users/syedchamansha/HQ/meeting-copilot-backend/lancedb_data';

async function ingest() {
  console.log('Loading embedding model...');
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  console.log('Reading doctrine file...');
  const text = fs.readFileSync(DOCTRINE_PATH, 'utf-8');

  // Simple chunking by double newline (paragraphs)
  const chunks = text
    .split('\n\n')
    .map(c => c.trim())
    .filter(c => c.length > 50);

  console.log(`Found ${chunks.length} chunks. Extracting embeddings...`);
  
  const data = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const output = await extractor(chunk, { pooling: 'mean', normalize: true });
    data.push({
      vector: Array.from(output.data),
      text: chunk
    });
    if (i % 50 === 0) console.log(`Embedded ${i}/${chunks.length}`);
  }

  console.log('Connecting to LanceDB...');
  const db = await lancedb.connect(DB_PATH);
  
  console.log('Creating table...');
  try {
    await db.createTable('doctrine', data);
  } catch {
    console.log('Table exists, trying to open and add...');
    const table = await db.openTable('doctrine');
    await table.add(data);
  }
  
  console.log('Ingestion complete! Total chunks processed:', data.length);
}

ingest().catch(console.error);
