Usar servidores MCP en VS Code
El Protocolo de Contexto de Modelo (MCP) es un estándar abierto que permite a los modelos de IA usar herramientas y servicios externos a través de una interfaz unificada. En VS Code, los servidores MCP proporcionan herramientas para tareas como operaciones con archivos, bases de datos o la interacción con API externas.

Los servidores MCP son una de las tres maneras de ampliar el chat con herramientas en VS Code, junto con las herramientas integradas y las herramientas aportadas por extensiones. Más información sobre los tipos de herramientas .

Este artículo lo guía a través de la configuración de servidores MCP y el uso de sus capacidades en Visual Studio Code.

Importante
Es posible que su organización haya deshabilitado el uso de servidores MCP en VS Code o haya restringido los servidores MCP que puede usar. Para obtener más información, póngase en contacto con su administrador.

¿Cómo funciona MCP?
MCP sigue una arquitectura cliente-servidor:

Los clientes MCP (como VS Code) se conectan a los servidores MCP y solicitan acciones en nombre del modelo de IA.
Los servidores MCP proporcionan una o más herramientas que exponen funcionalidades específicas a través de una interfaz bien definida
El protocolo de contexto de modelo define el formato del mensaje para la comunicación entre clientes y servidores, incluido el descubrimiento de herramientas, la invocación y el manejo de respuestas.
Por ejemplo, un servidor MCP de sistema de archivos podría proporcionar herramientas para leer, escribir o buscar archivos y directorios. El servidor MCP de GitHub ofrece herramientas para listar repositorios, crear solicitudes de extracción o gestionar incidencias. Los servidores MCP pueden ejecutarse localmente en tu equipo o alojarse remotamente, y VS Code admite ambas configuraciones.

Al estandarizar esta interacción, MCP elimina la necesidad de integraciones personalizadas entre cada modelo de IA y cada herramienta. Esto le permite ampliar las capacidades de su asistente de IA simplemente añadiendo nuevos servidores MCP a su espacio de trabajo. Obtenga más información sobre la especificación del Protocolo de Contexto de Modelo .

Capacidades MCP compatibles con VS Code
VS Code admite las siguientes capacidades de MCP:

Transportes :

Entrada/salida estándar local ( stdio)
HTTP transmisible ( http)
Eventos enviados por el servidor ( sse): soporte heredado.
Características :

Herramientas
Indicaciones
Recursos
Sonsacamiento
Muestreo
Autenticación
Instrucciones del servidor
Raíces
Aplicaciones MCP
Nota
La compatibilidad con MCP en VS Code generalmente está disponible a partir de VS Code 1.102.

Prerrequisitos
Instalar la última versión de Visual Studio Code
Acceso a Copilot
Agregar un servidor MCP
Precaución
Los servidores MCP locales pueden ejecutar código arbitrario en su equipo. Agregue únicamente servidores de fuentes confiables y revise la configuración del publicador y del servidor antes de iniciarlo. VS Code le solicita que confirme que confía en el servidor MCP al iniciarlo por primera vez. Consulte la documentación de seguridad para usar IA en VS Code para comprender las implicaciones.

Agregue un servidor MCP desde el registro del servidor MCP de GitHub
Puedes instalar un servidor MCP directamente desde el registro de GitHub a través de la vista Extensiones de VS Code. Puedes instalar el servidor MCP en tu perfil de usuario o en el espacio de trabajo actual.

Para instalar un servidor MCP desde la vista Extensiones:

Habilite la galería del servidor MCP con el
chat.mcp.gallery.enabled

configuración.
Abra la vista Extensiones ( Ctrl+Shift+X )

Ingrese @mcpen el campo de búsqueda para mostrar la lista de servidores MCP o ejecute el comando MCP: Examinar servidores desde la Paleta de comandos.

VS Code recupera la lista de servidores MCP del registro del servidor MCP de GitHub .

Para instalar un servidor MCP:

En su perfil de usuario: seleccione Instalar

En su espacio de trabajo: haga clic derecho en el servidor MCP y seleccione Instalar en el espacio de trabajo

Para ver los detalles del servidor MCP, seleccione el servidor MCP en la lista.

Otras opciones para agregar un servidor MCP
Tiene varias otras opciones para agregar un servidor MCP en VS Code:

Agregar un servidor MCP a un archivo `mcp.json` del espacio de trabajo
Si desea configurar servidores MCP para un proyecto específico, puede agregar la configuración del servidor a su espacio de trabajo en el .vscode/mcp.jsonarchivo. Esto le permite compartir la misma configuración del servidor MCP con su equipo de proyecto.

Importante
Asegúrese de evitar codificar de forma rígida información confidencial, como claves API y otras credenciales, mediante el uso de variables de entrada o archivos de entorno.

Para agregar un servidor MCP a su espacio de trabajo:

Crea un .vscode/mcp.jsonarchivo en tu espacio de trabajo.

Seleccione el botón "Agregar servidor" en el editor para agregar una plantilla para un nuevo servidor. VS Code proporciona IntelliSense para el archivo de configuración del servidor MCP.

El siguiente ejemplo muestra cómo configurar el servidor MCP remoto de GitHub. Obtenga más información sobre el formato de configuración de MCP en VS Code .

JSON

{
"servers": {
"github-mcp": {
"type": "http",
"url": "https://api.githubcopilot.com/mcp"
}
}
}
Como alternativa, ejecute el comando MCP: Agregar servidor desde la paleta de comandos, seleccione el tipo de servidor MCP que desea agregar y proporcione la información del servidor. A continuación, seleccione Espacio de trabajo para agregar el servidor al .vscode/mcp.jsonarchivo en su espacio de trabajo.

Agregue un servidor MCP a su configuración de usuario
Para configurar un servidor MCP para todos sus espacios de trabajo, puede agregar la configuración del servidor a su perfil de usuario . Esto le permite reutilizar la misma configuración de servidor en varios proyectos.

Para agregar un servidor MCP a su configuración de usuario:

Ejecute el comando MCP: Agregar servidor desde la Paleta de comandos, proporcione la información del servidor y luego seleccione Global para agregar la configuración del servidor a su perfil.

Como alternativa, ejecute el comando MCP: Abrir configuración de usuario , que abre el mcp.jsonarchivo en su perfil de usuario. A continuación, puede agregar manualmente la configuración del servidor al archivo.

Al usar varios perfiles de VS Code , puede cambiar entre diferentes configuraciones de servidor MCP según su perfil activo. Por ejemplo, el servidor MCP de Playwright podría configurarse en un perfil de desarrollo web, pero no en uno de Python.

Los servidores MCP se ejecutan dondequiera que estén configurados. Si está conectado a un equipo remoto y desea que un servidor se ejecute en él, debe definirlo en la configuración remota ( MCP: Abrir configuración de usuario remoto ) o en la configuración del espacio de trabajo. Los servidores MCP definidos en la configuración de usuario siempre se ejecutan localmente.

Agregar un servidor MCP a un contenedor de desarrollo
Los servidores MCP se pueden configurar en contenedores de desarrollo mediante el devcontainer.jsonarchivo. Esto permite incluir configuraciones de servidores MCP en el entorno de desarrollo contenedorizado.

Para configurar servidores MCP en un contenedor de desarrollo, agregue la configuración del servidor a la customizations.vscode.mcpsección:

JSON

{
"image": "mcr.microsoft.com/devcontainers/typescript-node:latest",
"customizations": {
"vscode": {
"mcp": {
"servers": {
"playwright": {
"command": "npx",
"args": ["-y", "@microsoft/mcp-server-playwright"]
}
}
}
}
}
}
Cuando se crea el contenedor de desarrollo, VS Code escribe automáticamente las configuraciones del servidor MCP en el mcp.jsonarchivo remoto, lo que las hace disponibles en su entorno de desarrollo en contenedor.

Detectar automáticamente servidores MCP
VS Code puede detectar y reutilizar automáticamente las configuraciones del servidor MCP de otras aplicaciones, como Claude Desktop.

Configurar el descubrimiento automático con el
chat.mcp.discovery.enabled

Configuración. Seleccione una o más herramientas desde las cuales descubrir la configuración del servidor MCP.
Instalar un servidor MCP desde la línea de comandos
También puede utilizar la interfaz de línea de comandos de VS Code para agregar un servidor MCP a su perfil de usuario o a un espacio de trabajo.

Para agregar un servidor MCP a su perfil de usuario, utilice la --add-mcpopción de línea de comando de VS Code y proporcione la configuración del servidor JSON en el formato {\"name\":\"server-name\",\"command\":...}.

Intento

code --add-mcp "{\"name\":\"my-server\",\"command\": \"uvx\",\"args\": [\"mcp-server-fetch\"]}"
Utilice las herramientas MCP en el chat
Una vez que haya agregado un servidor MCP, podrá usar las herramientas que ofrece en el chat. Las herramientas MCP funcionan como otras herramientas en VS Code: pueden invocarse automáticamente al usar agentes o referenciarse explícitamente en sus indicaciones.

Para utilizar las herramientas MCP en el chat:

Abra la vista Chat ( Ctrl+Alt+I ).

Abra el selector de herramientas para seleccionar las que el agente puede usar. Las herramientas MCP se agrupan por servidor MCP.

Consejo
Al crear indicaciones personalizadas o agentes personalizados , también puede especificar qué herramientas de MCP se pueden usar.

Al utilizar agentes, las herramientas se invocan automáticamente según sea necesario según su solicitud.

Por ejemplo, instale el servidor GitHub MCP y luego pregunte "Enumerar mis problemas de GitHub".

Captura de pantalla de la vista Chat, que muestra una invocación de la herramienta MCP cuando se utilizan agentes.

También puede hacer referencia explícita a las herramientas MCP escribiendo #seguido del nombre de la herramienta.

Revisar y aprobar las invocaciones de herramientas cuando se le solicite.

Captura de pantalla del cuadro de diálogo de confirmación de la herramienta MCP en el chat.

Obtenga más información sobre el uso de herramientas en el chat , incluido cómo administrar las aprobaciones de herramientas, usar el selector de herramientas y crear conjuntos de herramientas.

Borrar herramientas MCP almacenadas en caché
Al iniciar el servidor MCP por primera vez, VS Code detecta sus capacidades y herramientas. Podrás usar estas herramientas en el chat . VS Code almacena en caché la lista de herramientas de un servidor MCP. Para borrar las herramientas almacenadas en caché, usa el comando MCP: Restablecer herramientas en caché en la paleta de comandos.

Utilice los recursos de MCP
Los servidores MCP pueden brindar acceso directo a recursos que puedes usar como contexto en tus mensajes de chat. Por ejemplo, un servidor MCP de sistema de archivos puede permitirte acceder a archivos y directorios, o un servidor MCP de base de datos puede brindar acceso a tablas de bases de datos.

Para agregar un recurso de un servidor MCP a su mensaje de chat:

En la vista Chat, seleccione Agregar contexto > Recursos de MCP

Seleccione un tipo de recurso de la lista y proporcione parámetros de entrada de recursos opcionales.

Captura de pantalla del recurso Quick Pick de MCP, que muestra los tipos de recursos proporcionados por el servidor MCP de GitHub.

Para ver la lista de recursos disponibles para un servidor MCP, utilice el comando MCP: Examinar recursos o utilice el comando MCP: Listar servidores > Examinar recursos para ver los recursos de un servidor específico.

Las herramientas MCP pueden devolver recursos como parte de su respuesta. Puede ver o guardar estos recursos en su espacio de trabajo seleccionando "Guardar" o arrastrándolos a la vista del Explorador.

Utilice las indicaciones de MCP
Los servidores MCP pueden proporcionar indicaciones preconfiguradas para tareas comunes que se pueden invocar en el chat con un comando de barra diagonal. Para invocar una indicación MCP en el chat, escriba /en el campo de entrada del chat, seguido del nombre de la indicación, con el formato mcp.servername.promptname.

Opcionalmente, el mensaje de MCP podría solicitarle parámetros de entrada adicionales.

Captura de pantalla de la vista Chat, que muestra una invocación de mensaje de MCP y un cuadro de diálogo que solicita parámetros de entrada adicionales.

Utilice las aplicaciones MCP
Las aplicaciones MCP permiten que las herramientas MCP devuelvan componentes de interfaz de usuario interactivos que se renderizan directamente en el chat. En lugar de respuestas de solo texto, las herramientas pueden mostrar listas, visualizaciones, formularios y otros elementos interactivos con función de arrastrar y soltar. Cuando un servidor MCP admite aplicaciones, la interfaz de usuario aparece integrada en la conversación de chat para que puedas interactuar con ella y completar tareas de forma más eficiente.

Obtenga más información sobre la compatibilidad de aplicaciones MCP en VS Code en nuestra publicación de blog.

Agrupar herramientas relacionadas en un conjunto de herramientas
A medida que se agregan más servidores MCP, la lista de herramientas puede aumentar. Puede agrupar las herramientas relacionadas en un conjunto para facilitar su administración y referencia.

Obtenga más información sobre cómo crear y utilizar conjuntos de herramientas .

Administrar servidores MCP instalados
Puede realizar varias acciones en los servidores MCP instalados, como iniciar o detener un servidor, ver los registros del servidor, desinstalar el servidor y más.

Para realizar estas acciones en un servidor MCP, utilice cualquiera de estas opciones:

Haga clic derecho en un servidor en la sección SERVIDORES MCP - INSTALADOS o seleccione el ícono de engranaje

Captura de pantalla que muestra los servidores MCP en la vista Extensiones.

Abra el mcp.jsonarchivo de configuración y acceda a las acciones en línea en el editor (lentes de código)

Configuración de servidor MCP con lentes para administrar el servidor.

Utilice los comandos MCP: Abrir configuración de usuario o MCP: Abrir configuración de carpeta del espacio de trabajo para acceder a la configuración del servidor MCP.

Ejecute el comando MCP: Listar servidores desde la Paleta de comandos y seleccione un servidor

Captura de pantalla que muestra las acciones de un servidor MCP en la paleta de comandos.

Iniciar automáticamente los servidores MCP
Cuando agrega un servidor MCP o cambia su configuración, VS Code necesita (re)iniciar el servidor para descubrir las herramientas que proporciona.

Puede configurar VS Code para reiniciar automáticamente el servidor MCP cuando se detecten cambios de configuración mediante el uso de
chat.mcp.inicio automático

Configuración (Experimental).
Como alternativa, reinicie manualmente el servidor MCP desde la vista Chat o seleccionando la acción de reinicio en la lista de servidores MCP .

Captura de pantalla que muestra el botón Actualizar en la vista de Chat.

Encuentra servidores MCP
MCP es un estándar relativamente nuevo y su ecosistema está evolucionando rápidamente. A medida que más desarrolladores adopten MCP, verá un número cada vez mayor de servidores y herramientas disponibles para la integración con sus proyectos.

El registro del servidor MCP de GitHub es un excelente punto de partida. Puedes acceder a él directamente desde la vista Extensiones de VS Code.

El repositorio oficial de servidores de MCP ofrece servidores oficiales y aportados por la comunidad que demuestran la versatilidad de MCP. Puede explorar servidores para diversas funcionalidades, como operaciones del sistema de archivos, interacciones con bases de datos y servicios web.

Las extensiones de VS Code también pueden contribuir con servidores MCP y configurarlos durante su instalación. Consulte Visual Studio Marketplace para encontrar extensiones compatibles con servidores MCP.

Confianza del servidor MCP
Los servidores MCP pueden ejecutar código arbitrario en su equipo. Agregue únicamente servidores de fuentes confiables y revise la configuración del publicador y del servidor antes de iniciarlo. Lea la documentación de seguridad para usar IA en VS Code para comprender las implicaciones.

Al agregar un servidor MCP a su espacio de trabajo o cambiar su configuración, debe confirmar que confía en él y sus capacidades antes de iniciarlo. VS Code muestra un cuadro de diálogo para confirmar que confía en el servidor al iniciarlo por primera vez. Seleccione el enlace al servidor MCP en el cuadro de diálogo para revisar su configuración en una ventana independiente.

Captura de pantalla que muestra el mensaje de confianza del servidor MCP.

Si no confía en el servidor, este no se inicia y las solicitudes de chat continúan sin utilizar las herramientas proporcionadas por el servidor.

Puede restablecer la confianza de sus servidores MCP ejecutando el comando MCP: Restablecer confianza desde la Paleta de comandos.

Nota
Si inicia el servidor MCP directamente desde el mcp.jsonarchivo, no se le solicitará que confíe en la configuración del servidor.

Sincronizar servidores MCP en todos los dispositivos
Con la Sincronización de Ajustes habilitada, puede sincronizar ajustes y configuraciones entre dispositivos, incluyendo las del servidor MCP. Esto le permite mantener un entorno de desarrollo consistente y acceder a los mismos servidores MCP en todos sus dispositivos.

Para habilitar la sincronización del servidor MCP con Settings Sync, ejecute el comando Settings Sync: Configurar desde la Paleta de comandos y asegúrese de que Servidores MCP esté incluido en la lista de configuraciones sincronizadas.

Formato de configuración
Los servidores MCP se configuran utilizando un archivo JSON ( mcp.json) que define dos secciones principales: definiciones de servidor y variables de entrada opcionales para datos confidenciales.

Los servidores MCP pueden conectarse mediante diferentes métodos de transporte. Elija la configuración adecuada según la comunicación de su servidor.

Estructura de configuración
El archivo de configuración tiene dos secciones principales:

"servers": {}- Contiene la lista de servidores MCP y sus configuraciones
"inputs": []- Marcadores de posición opcionales para información confidencial como claves API
Puede utilizar variables predefinidas en la configuración del servidor, por ejemplo, para hacer referencia a la carpeta del espacio de trabajo ( ${workspaceFolder}).

Servidores de E/S estándar (stdio)
Utilice esta configuración para servidores que se comunican mediante flujos de entrada y salida estándar. Es el tipo más común para servidores MCP locales.

Expandir tabla
Campo Requerido Descripción Ejemplos
type Sí Tipo de conexión del servidor "stdio"
command Sí Comando para iniciar el ejecutable del servidor. Debe estar disponible en la ruta del sistema o contener su ruta completa. "npx", "node", "python","docker"
args No Matriz de argumentos pasados ​​al comando ["server.py", "--port", "3000"]
env No Variables de entorno para el servidor {"API_KEY": "${input:api-key}"}
envFile	No	Ruta a un archivo de entorno para cargar más variables	"${workspaceFolder}/.env"
Nota
Al usar Docker con servidores stdio, no use la opción de desacoplamiento ( -d). El servidor debe ejecutarse en primer plano para comunicarse con VS Code.

Ejemplo de configuración de servidor local
Servidores HTTP y de eventos enviados por el servidor (SSE)
Utilice esta configuración para servidores que se comunican mediante HTTP. VS Code primero prueba el transporte de flujo HTTP y recurre a SSE si no se admite HTTP.

Expandir tabla
Campo Requerido Descripción Ejemplos
type Sí Tipo de conexión del servidor "http","sse"
url Sí URL del servidor "http://localhost:3000","https://api.example.com/mcp"
headers No Encabezados HTTP para autenticación o configuración {"Authorization": "Bearer ${input:api-token}"}
Además de los servidores disponibles en la red, VS Code puede conectarse a servidores MCP que reciben tráfico HTTP en sockets Unix o canalizaciones con nombre de Windows especificando la ruta del socket o canalización en el formato unix:///path/to/server.socko pipe:///pipe/named-pipeen Windows. Puede especificar subrutas mediante un fragmento de URL, como unix:///tmp/server.sock#/mcp/subpath.

Ejemplo de configuración de servidor remoto
Variables de entrada para datos sensibles
Las variables de entrada le permiten definir marcadores de posición para valores de configuración, evitando la necesidad de codificar información confidencial como claves API o contraseñas directamente en la configuración del servidor.

Al hacer referencia a una variable de entrada mediante ${input:variable-id}, VS Code le solicita el valor al iniciar el servidor por primera vez. Este valor se almacena de forma segura para su posterior uso. Obtenga más información sobre las variables de entrada en VS Code.

Propiedades de la variable de entrada:

Expandir tabla
Campo Requerido Descripción Ejemplo
type Sí Tipo de solicitud de entrada "promptString"
id Sí Identificador único para hacer referencia en la configuración del servidor "api-key","database-url"
description Sí Texto de aviso fácil de usar "GitHub Personal Access Token"
password No Ocultar la entrada escrita (predeterminado: falso) truepara claves API y contraseñas
Ejemplo de configuración de servidor con variables de entrada
Convenciones de nombres de servidores
Al definir servidores MCP, siga estas convenciones de nomenclatura para el nombre del servidor:

Utilice camelCase para el nombre del servidor, como "uiTesting" o "githubIntegration".
Evite utilizar espacios en blanco o caracteres especiales
Utilice un nombre único para cada servidor para evitar conflictos
Utilice un nombre descriptivo que refleje la funcionalidad o la marca del servidor, como "github" o "base de datos".
Solucionar problemas y depurar servidores MCP
Registro de salida de MCP
Cuando VS Code encuentra un problema con un servidor MCP, muestra un indicador de error en la vista de Chat.

Error del servidor MCP

Seleccione la notificación de error en la vista Chat y, a continuación, seleccione la opción "Mostrar resultados" para ver los registros del servidor. Como alternativa, ejecute MCP: Listar servidores desde la paleta de comandos, seleccione el servidor y, a continuación, seleccione " Mostrar resultados" .

Salida de error del servidor MCP

Depurar un servidor MCP
Puede habilitar el modo de desarrollo para servidores MCP añadiendo una devclave a la configuración del servidor MCP. Este es un objeto con dos propiedades:

watch:Un patrón global de archivos para observar cambios de archivos que reiniciarán el servidor MCP.
debugPermite configurar un depurador con el servidor MCP. Actualmente, VS Code admite la depuración de servidores MCP de Node.js y Python.
Obtenga más información sobre el modo de desarrollo de MCP en la Guía de desarrollo de MCP.

Controlar centralmente el acceso a MCP
Las organizaciones pueden gestionar centralmente el acceso a los servidores MCP mediante las políticas de GitHub. Obtenga más información sobre la gestión empresarial de servidores MCP .

Preguntas frecuentes
¿Puedo controlar qué herramientas MCP se utilizan?
Seleccione el botón Herramientas en la vista Chat cuando utilice agentes y active o desactive herramientas específicas según sea necesario.
Agregue herramientas específicas a su solicitud utilizando el botón Agregar contexto o escribiendo #.
Para un control más avanzado, puede utilizar .github/copilot-instructions.mdpara ajustar el uso de la herramienta.
El servidor MCP no se inicia al usar Docker
Verifique que los argumentos del comando sean correctos y que el contenedor no se esté ejecutando en modo independiente ( -dopción). También puede revisar la salida del servidor MCP para ver si hay mensajes de error (consulte Solución de problemas ).

Recibo un error que dice "No se pueden tener más de 128 herramientas por solicitud".
Una solicitud de chat puede tener un máximo de 128 herramientas habilitadas simultáneamente debido a las restricciones del modelo. Si tiene más de 128 herramientas seleccionadas, reduzca la cantidad de herramientas deseleccionando algunas herramientas o servidores completos en el selector de herramientas de la vista de chat, o asegúrese de que las herramientas virtuales estén habilitadas (
github.copilot.chat.virtualTools.threshold

).
Captura de pantalla que muestra la vista de Chat, resaltando el ícono de Herramientas en la entrada de chat y mostrando la Selección rápida de herramientas donde puede seleccionar qué herramientas están activas.

Recursos relacionados
Documentación del protocolo de contexto del modelo
Repositorio del servidor de protocolo de contexto de modelo
Usar agentes en el chat de VS Code
