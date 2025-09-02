import https from 'https';

export const handler = async (event) => {
  const body = JSON.stringify({
    prompt: event.prompt || '',
    limit: event.limit || 5,
  });

  const options = {
    hostname: 'artiefy.com',
    path: '/api/search-courses',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data,
        });
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};
