/* eslint-disable @typescript-eslint/no-require-imports */
const https = require('https');

exports.handler = async (event) => {
  try {
    // Validar httpMethod si está presente (API Gateway proxy integration)
    if (event.httpMethod && event.httpMethod !== 'POST') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Error: 'httpMethod'" }),
      };
    }

    // Validar apiPath si está presente
    if (event.apiPath && event.apiPath !== '/api/search-courses') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Error: 'apiPath'" }),
      };
    }

    // Lee los parámetros según el formato que envía Bedrock/API Gateway
    const params = event.parameters || event;
    const prompt = params.prompt || '';
    const limit = params.limit || 5;

    const body = JSON.stringify({ prompt, limit });

    const options = {
      hostname: 'artiefy.com',
      path: '/api/search-courses',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    return await new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          // Construye la respuesta Bedrock Agent
          const responseBody = {
            'application/json': {
              body: data,
            },
          };
          resolve({
            response: {
              actionGroup: event.actionGroup || 'search_courses',
              apiPath: event.apiPath || '/api/search-courses',
              httpMethod: event.httpMethod || 'POST',
              httpStatusCode: res.statusCode,
              responseBody: responseBody,
            },
            messageVersion: event.messageVersion || 1,
          });
        });
      });

      req.on('error', (err) => {
        const responseBody = {
          'application/json': {
            body: JSON.stringify({ error: err.message }),
          },
        };
        resolve({
          response: {
            actionGroup: event.actionGroup || 'search_courses',
            apiPath: event.apiPath || '/api/search-courses',
            httpMethod: event.httpMethod || 'POST',
            httpStatusCode: 500,
            responseBody: responseBody,
          },
          messageVersion: event.messageVersion || 1,
        });
      });
      req.write(body);
      req.end();
    });
  } catch (err) {
    const responseBody = {
      'application/json': {
        body: JSON.stringify({
          error: 'Internal server error',
          details: String(err),
        }),
      },
    };
    return {
      response: {
        actionGroup: event.actionGroup || 'search_courses',
        apiPath: event.apiPath || '/api/search-courses',
        httpMethod: event.httpMethod || 'POST',
        httpStatusCode: 500,
        responseBody: responseBody,
      },
      messageVersion: event.messageVersion || 1,
    };
  }
};
