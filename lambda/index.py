import requests
import json

def lambda_handler(event, context):
    # Soporta eventos enviados como lista o dict
    if isinstance(event, list) and len(event) > 0:
        event = event[0]
    parameters = event.get('parameters', {})
    # Desanidar listas hasta obtener un dict
    while isinstance(parameters, list) and len(parameters) > 0:
        parameters = parameters[0]
    if not isinstance(parameters, dict):
        error_json = {"error": "El parámetro 'parameters' debe ser un objeto."}
        response_body = {
            'application/json': {
                'body': error_json
            }
        }
        action_response = {
            'actionGroup': event.get('actionGroup', 'search_courses'),
            'apiPath': event.get('apiPath', '/api/search-courses'),
            'httpMethod': event.get('httpMethod', 'POST'),
            'httpStatusCode': 400,
            'responseBody': response_body
        }
        return {
            'response': action_response,
            'messageVersion': event.get('messageVersion', 1)
        }
    prompt = parameters.get('prompt')
    limit = parameters.get('limit', 5)

    # Validación de parámetros
    if not prompt or not isinstance(prompt, str) or prompt.strip() == "":
        error_json = {"error": "El parámetro 'prompt' es obligatorio y debe ser un string no vacío."}
        response_body = {
            'application/json': {
                'body': error_json
            }
        }
        action_response = {
            'actionGroup': event.get('actionGroup', 'search_courses'),
            'apiPath': event.get('apiPath', '/api/search-courses'),
            'httpMethod': event.get('httpMethod', 'POST'),
            'httpStatusCode': 400,
            'responseBody': response_body
        }
        return {
            'response': action_response,
            'messageVersion': event.get('messageVersion', 1)
        }

    # Validar y limitar el parámetro 'limit'
    try:
        limit = int(limit)
        if limit < 1 or limit > 5:
            limit = 5
    except Exception:
        limit = 5

    api_url = 'https://artiefy.com/api/search-courses'
    payload = {'prompt': prompt, 'limit': limit}
    headers = {
        'Content-Type': 'application/json',
        'x-bedrock-agent': 'true',
    }
    try:
        resp = requests.post(api_url, json=payload, headers=headers, timeout=10)
        # Log para depuración
        print("API status:", resp.status_code)
        print("API response:", resp.text)
        if resp.status_code != 200:
            body = {"error": f"API respondió con status {resp.status_code}", "body": resp.text}
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
        try:
            body = resp.json()
            # Validar campos esperados
            if not isinstance(body, dict) or "results" not in body:
                body = {"error": "Respuesta del API no contiene 'results'", "body": body}
        except Exception as ex:
            body = {"error": "Respuesta inválida del API", "body": resp.text, "exception": str(ex)}
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
        error_json = {"error": str(e)}
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
