# 📌 Documentación de la API

Esta API permite a los usuarios obtener información sobre cursos, planificar proyectos y mantener conversaciones con un asistente virtual cuando los profesores no están disponibles.

## 📂 Instalación y Configuración

1. Clona el repositorio:

   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd <NOMBRE_DEL_PROYECTO>
   ```

2. Instala los requerimientos:

   ```bash
   pip install -r requirements.txt
   ```

3. Inicia el servidor:

   ```bash
   python app.py
   ```

   La API correrá en `http://localhost:5000/`.

---

## 🔹 **Endpoints Disponibles**

### 📘 **1. Obtener Clases Relacionadas con un Curso**

``

* Busca las clases de un curso específico y responde preguntas sobre ellas.

#### **📌 Entrada esperada (Obtener Clases):**

```json
{
    "curso": "mike course",
    "prompt": "Crea un resumen de JUNTO A UN MUERTO"
}
```

#### **🔹 Cómo consumirlo (Obtener Clases)**

##### **📌 Con Postman (Obtener Clases):**

* Método: `POST`
* URL: `http://localhost:5000/get_classes`
* En **Body → raw → JSON** ingresa:

  ```json
  {
      "curso": "mike course",
      "prompt": "Crea un resumen de JUNTO A UN MUERTO"
  }
  ```
  
* Presiona  **Send** .

##### **📌 Con cURL:**

```bash
curl -X POST "http://localhost:5000/get_classes" \
     -H "Content-Type: application/json" \
     -d '{"curso": "mike course", "prompt": "Crea un resumen de JUNTO A UN MUERTO"}'
```

##### **📌 Con Python:**

```python
import requests

url = "http://localhost:5000/get_classes"
data = {
    "curso": "mike course",
    "prompt": "Crea un resumen de JUNTO A UN MUERTO"
}

response = requests.post(url, json=data)
print(response.json())
```

---

### 📗 **2. Obtener Cursos Relacionados con un Tema**

``

* Busca cursos relacionados con un tema específico.

#### **📌 Entrada esperada:**

```json
{
    "prompt": "desarrollo de videojuegos."
}
```

#### **🔹 Cómo consumirlo**

##### **📌 Con Postman:**

* Método: `POST`
* URL: `http://18.117.124.192:5000/root_courses`
* En **Body → raw → JSON** ingresa:

  ```json
  {
      "prompt": "desarrollo de videojuegos."
  }
  ```

* Presiona  **Send** .

##### **📌 Con cURL:**

```bash
curl -X POST "http://18.117.124.192:5000/root_courses" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "desarrollo de videojuegos."}'
```

##### **📌 Con Python:**

```python
import requests

url = "http://18.117.124.192:5000/root_courses"
data = {
    "prompt": "desarrollo de videojuegos."
}

response = requests.post(url, json=data)
print(response.json())
```

---

### 📙 **3. Planificación de un Proyecto**

``

* Genera un plan detallado para un proyecto basándose en los requisitos proporcionados.

#### **📌 Entrada esperada:**

```json
{
    "project_type": "Website",
    "industry": "Technology",
    "project_objectives": "Create a website for a small business",
    "team_members": "- Diego Arturo (Project Manager, Web Developer)",
    "project_requirements": "- Create a responsive design that works well on desktop and mobile devices"
}
```

#### **🔹 Cómo consumirlo**

##### **📌 Con Postman:**

* Método: `POST`
* URL: `http://18.117.124.192:5000/plan_project`
* En **Body → raw → JSON** ingresa:

  ```json
  {
      "project_type": "Website",
      "industry": "Technology",
      "project_objectives": "Create a website for a small business",
      "team_members": "- Diego Arturo (Project Manager, Web Developer)",
      "project_requirements": "- Create a responsive design that works well on desktop and mobile devices"
  }
  ```

* Presiona  **Send** .

##### **📌 Con cURL:**

```bash
curl -X POST "http://18.117.124.192:5000/plan_project" \
     -H "Content-Type: application/json" \
     -d '{
           "project_type": "Website",
           "industry": "Technology",
           "project_objectives": "Create a website for a small business",
           "team_members": "- Diego Arturo (Project Manager, Web Developer)",
           "project_requirements": "- Create a responsive design that works well on desktop and mobile devices"
         }'
```

##### **📌 Con Python:**

```python
import requests

url = "http://18.117.124.192:5000/plan_project"
data = {
    "project_type": "Website",
    "industry": "Technology",
    "project_objectives": "Create a website for a small business",
    "team_members": "- Diego Arturo (Project Manager, Web Developer)",
    "project_requirements": "- Create a responsive design that works well on desktop and mobile devices"
}

response = requests.post(url, json=data)
print(response.json())
```

---

### 📕 **4. Mantener una Conversación con un Chatbot**

``

* Permite interactuar con un chatbot que guarda historial de conversaciones.

#### **📌 Entrada esperada:**

```json
{
    "user_id": "123",
    "user_message": "¿Cómo funciona la gestión de proyectos?",
    "curso": "Gestión de proyectos"
}
```

#### **🔹 Cómo consumirlo**

##### **📌 Con Postman:**

* Método: `POST`
* URL: `http://18.117.124.192:5000/chat`
* En **Body → raw → JSON** ingresa:

  ```json
  {
      "user_id": "123",
      "user_message": "¿Cómo funciona la gestión de proyectos?",
      "curso": "Gestión de proyectos"
  }
  ```

* Presiona  **Send** .

##### **📌 Con cURL:**

```bash
curl -X POST "http://18.117.124.192:5000/chat" \
     -H "Content-Type: application/json" \
     -d '{
           "user_id": "123",
           "user_message": "¿Cómo funciona la gestión de proyectos?",
           "curso": "Gestión de proyectos"
         }'
```

##### **📌 Con Python:**

```python
import requests

url = "http://18.117.124.192:5000/chat"
data = {
    "user_id": "123",
    "user_message": "¿Cómo funciona la gestión de proyectos?",
    "curso": "Gestión de proyectos"
}

response = requests.post(url, json=data)
print(response.json())
```
