import { TranscriptionClient } from './transcription-client';
import * as fs from 'fs';

async function run() {
  const config = {
    serviceUrl: process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/audio/transcriptions',
    apiToken: process.env.GROQ_API_KEY || 'gsk_xWbW4D3v5Xj01X2wJtQpWGdyb3FY0pWbM4B1W2Xj1Y0pWbM4B1', // Using the key from the env
    maxRetries: 3
  };
  
  // Create a silent audio buffer to simulate speech (or ideally an actual sine wave)
  const sampleRate = 16000;
  const durationSec = 2;
  const numSamples = sampleRate * durationSec;
  const buffer = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    // Generate a 440Hz sine wave
    buffer[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.5;
  }
  
  const client = new TranscriptionClient(config);
  try {
    console.log("Sending audio to Groq...");
    const result = await client.transcribe(buffer);
    console.log("Success! Transcription result:", JSON.stringify(result));
  } catch (err) {
    console.error("Transcription failed:", err);
  }
}

run();
