import requests
import json

def lambda_handler(event, context):
    prompt = event.get('parameters', {}).get('prompt', '')
    limit = event.get('parameters', {}).get('limit', 5)
    api_url = 'https://artiefy.com/api/search-courses'
    payload = {'prompt': prompt, 'limit': limit}
    headers = {
        'Content-Type': 'application/json',
        'x-bedrock-agent': 'true',
    }
    try:
        resp = requests.post(api_url, json=payload, headers=headers, timeout=10)
        resp.raise_for_status()
        # Siempre convierte la respuesta a string JSON válido
        try:
            body = json.dumps(resp.json())
        except Exception:
            body = resp.text if isinstance(resp.text, str) else json.dumps(resp.text)
        response_body = {
            'application/json': {
                'body': body
            }
        }
        action_response = {
            'actionGroup': event.get('actionGroup', 'search_courses'),
            'apiPath': event.get('apiPath', '/api/search-courses'),
            'httpMethod': event.get('httpMethod', 'POST'),
            'httpStatusCode': resp.status_code,
            'responseBody': response_body
        }
        return {
            'response': action_response,
            'messageVersion': event.get('messageVersion', 1)
        }
    except Exception as e:
        error_json = json.dumps({"error": str(e)})
        response_body = {
            'application/json': {
                'body': error_json
            }
        }
        action_response = {
            'actionGroup': event.get('actionGroup', 'search_courses'),
            'apiPath': event.get('apiPath', '/api/search-courses'),
            'httpMethod': event.get('httpMethod', 'POST'),
            'httpStatusCode': 500,
            'responseBody': response_body
        }
        return {
            'response': action_response,
            'messageVersion': event.get('messageVersion', 1)
        }
