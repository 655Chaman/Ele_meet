const { DeepgramClient } = require('@deepgram/sdk');
const client = new DeepgramClient({ apiKey: 'dummy' });
console.log('listen keys:', Object.keys(client.listen));
console.log('listen.v1 keys:', client.listen.v1 ? Object.keys(client.listen.v1) : 'none');
