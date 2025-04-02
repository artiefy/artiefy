
# Documentación de la API

Esta API permite a los usuarios:

- Buscar cursos relevantes según un tema.
- Obtener información detallada sobre clases de un curso.
- Generar planes de proyectos personalizados.
- Mantener conversaciones con un chatbot que guarda historial.
- Consultar el historial de interacciones por agente.

---

## Instalación y Configuración

1. Clona el repositorio:

   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd <NOMBRE_DEL_PROYECTO>
   ```

2. Instala las dependencias:

   ```bash
   pip install -r requirements.txt
   ```

3. Ejecuta el servidor:

   ```bash
   python app.py
   ```

   La API estará disponible en `http://18.117.124.192`.

---

## Endpoints Disponibles

### 1. `/root_courses` - Buscar cursos según un tema

Busca los cursos más relevantes con base en un tema proporcionado por el usuario. Utiliza dos fases: filtrado por título y análisis por descripción.

**Método:** `POST`
**URL:** `http://18.117.124.192:5000/root_courses`

#### Entrada esperada

```json
{
  "prompt": "desarrollo de videojuegos"
}
```

#### Ejemplo en Python

```python
import requests

url = "http://18.117.124.192:5000/root_courses"
data = {
    "prompt": "desarrollo de videojuegos"
}

response = requests.post(url, json=data)
print(response.json())
```

---

### 2. `/get_classes` - Obtener información sobre clases de un curso

Busca clases dentro de un curso específico y responde preguntas sobre su contenido.

**Método:** `POST`
**URL:** `http://18.117.124.192:5000/get_classes`

#### Entrada esperada

```json
{
  "user_id": "123",
  "curso": "Gestión de proyectos",
  "prompt": "¿Qué clases cubren análisis de riesgos?"
}
```

#### Ejemplo en Python

```python
import requests

url = "http://18.117.124.192:5000/get_classes"
data = {
    "user_id": "123",
    "curso": "Gestión de proyectos",
    "prompt": "¿Qué clases cubren análisis de riesgos?"
}

response = requests.post(url, json=data)
print(response.json())
```

---

### 3. `/plan_project` - Generar planificación de proyecto

Crea un plan estructurado de proyecto con base en los requisitos y objetivos definidos por el usuario.

**Método:** `POST`
**URL:** `http://18.117.124.192:5000/plan_project`

#### Entrada esperada

```json
{
  "project_type": "Website",
  "industry": "Technology",
  "project_objectives": "Crear una presencia digital sólida",
  "team_members": "Diego, Laura",
  "project_requirements": "Diseño responsivo y optimización SEO"
}
```

#### Ejemplo en Python

```python
import requests

url = "http://18.117.124.192:5000/plan_project"
data = {
    "project_type": "Website",
    "industry": "Technology",
    "project_objectives": "Crear una presencia digital sólida",
    "team_members": "Diego, Laura",
    "project_requirements": "Diseño responsivo y optimización SEO"
}

response = requests.post(url, json=data)
print(response.json())
```

---

### 4. `/chat` - Interactuar con el chatbot

Permite mantener una conversación con un chatbot que recuerda el historial por usuario y por tema.

**Método:** `POST`
**URL:** `http://18.117.124.192:5000/chat`

#### Entrada esperada

```json
{
  "user_id": "123",
  "user_message": "¿Qué es una metodología ágil?",
  "curso": "Gestión de proyectos"
}
```

#### Ejemplo en Python

```python
import requests

url = "http://18.117.124.192:5000/chat"
data = {
    "user_id": "123",
    "user_message": "¿Qué es una metodología ágil?",
    "curso": "Gestión de proyectos"
}

response = requests.post(url, json=data)
print(response.json())
```

---

### 5. `/history` - Consultar historial de conversaciones

Devuelve el historial de interacciones de un usuario para un agente específico (por ejemplo: "chat" o "classes")

agent_id = "classes" es para el historial que tienen el asistente de clases(endpoint "/get_classes)

**Método:** `POST`
**URL:** `http://18.117.124.192:5000/history`

#### Entrada esperada

```json
{
  "user_id": "123",
  "agent_id": "chat"
}
```

#### Ejemplo en Python

```python
import requests

url = "http://18.117.124.192:5000/history"
data = {
    "user_id": "123",
    "agent_id": "chat"
}

response = requests.post(url, json=data)
print(response.json())
```

---

## Ruta de prueba

**Método:** `GET`
**URL:** `http://18.117.124.192:5000/`
**Respuesta esperada:**

```json
{
  "message": "API is running"
}
```

---

## Notas

- Todos los endpoints están preparados para recibir solicitudes desde frontends con CORS.
- El historial de conversaciones se guarda de forma estructurada por `user_id` y `agent_id`.
