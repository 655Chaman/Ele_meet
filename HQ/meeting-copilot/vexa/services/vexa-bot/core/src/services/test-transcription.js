const fs = require('fs');

async function run() {
  const serviceUrl = 'https://api.groq.com/openai/v1/audio/transcriptions';
  const apiToken = 'YOUR_GROQ_KEY';
  
  // Create a silent audio buffer to simulate speech
  const sampleRate = 16000;
  const durationSec = 2;
  const numSamples = sampleRate * durationSec;
  const buffer = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    buffer[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.5;
  }
  
  // Minimal WAV encoder
  const wavBuffer = Buffer.alloc(44 + buffer.length * 2);
  wavBuffer.write('RIFF', 0);
  wavBuffer.writeUInt32LE(36 + buffer.length * 2, 4);
  wavBuffer.write('WAVE', 8);
  wavBuffer.write('fmt ', 12);
  wavBuffer.writeUInt32LE(16, 16);
  wavBuffer.writeUInt16LE(1, 20);
  wavBuffer.writeUInt16LE(1, 22);
  wavBuffer.writeUInt32LE(16000, 24);
  wavBuffer.writeUInt32LE(32000, 28);
  wavBuffer.writeUInt16LE(2, 32);
  wavBuffer.writeUInt16LE(16, 34);
  wavBuffer.write('data', 36);
  wavBuffer.writeUInt32LE(buffer.length * 2, 40);
  
  for (let i = 0; i < buffer.length; i++) {
    let s = Math.max(-1, Math.min(1, buffer[i]));
    wavBuffer.writeInt16LE(s < 0 ? s * 0x8000 : s * 0x7FFF, 44 + i * 2);
  }

  const boundary = '----FormBoundary' + Date.now().toString(36);
  const parts = [];
  
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="audio.wav"\r\nContent-Type: audio/wav\r\n\r\n`));
  parts.push(wavBuffer);
  parts.push(Buffer.from('\r\n'));
  
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-large-v3-turbo\r\n`));
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\nverbose_json\r\n`));
  parts.push(Buffer.from(`--${boundary}--\r\n`));

  const body = Buffer.concat(parts);

  console.log("Sending audio to Groq...");
  const response = await fetch(serviceUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: body
  });

  const result = await response.json();
  if (!response.ok) {
    console.error("Transcription failed:", result);
  } else {
    console.log("Success! Transcription result:", JSON.stringify(result));
  }
}

run();
