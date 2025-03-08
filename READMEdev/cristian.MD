## Explicación de Artiefy Rol de docente:

Visualización y renderización en el cliente "frontend":

## Dashboard/Educadores:
-(inicio)/page.tsx
Aquí, luego de iniciar desde la página principal de Artiefy, podrás observar en el cliente un dashboard general con los detalles del rol de la persona, todo por ID de la persona que está con este rol de educador. En el cual podrás analizar los detalles de la persona como, por ejemplo: cuántos cursos tiene asociados, un promedio de estudiantes, total de clases, duración de lo subido y además tendrás una lista de los cursos para pulsar y ver los detalles de este curso.

-(inicio)/detailsDashboard/page.tsx
Aquí están los detalles más específicos del curso, datos como el rating del curso, total de estudiantes, total de clases y además tendrás una lista del progreso de todos los estudiantes en general en cada clase y/o lección.

-(inicio)/foro/page.tsx:
Es sencillo aquí, solo hay un canal de migas y el componente forumHome que por ahora está trayendo todos los foros creados hasta el momento.

-(inicio)/foro/[forumID]/page.tsx
En esta zona vas a entrar a un foro en específico en el cual podrás observar quién es el creador del foro, la descripción y todo lo que se ha posteado en este foro y sus respuestas. Además, en la zona superior, lateral derecha, podrás observar un icono Ellipsis el cual a su vez es un Collapsible que podrás pulsar y te desplegará un menú con 2 opciones que son editar y eliminar post o respuesta "solamente si eres la persona dueña del comentario".

-(inicio)/cursos/page.tsx
En esta sección podrás encontrar en la parte visual el título de la zona, una lista de los cursos a los cuales fuiste asignado o has creado y también un botón para crear cursos el cual te desplegará un modal o popup que viene de los componentes de educador. En este modal podrás añadir un título, una descripción, los requerimientos que el estudiante tiene para tomar este curso, el nombre de la persona que lo está creando y además un botón drag&drop en el cual podrás añadir una imagen o arrastrarla para subir la imagen de portada del curso. Además de todo esto, podrás crear parámetros de evaluación con un título, una descripción y el peso del parámetro para el curso los cuales no pueden superar el 100% "te mostrará un mensaje de error si los parámetros exceden el 100%". Si pulsas en el botón ver curso de un curso, vas a ir a los detalles de este curso.

-(inicio)/cursos/[courseId]/CourseDetail.tsx
Aquí podrás encontrar todos los detalles de un ID de un curso en específico, podrás observar detalles como visualizar, editar, estadísticas y eliminar "todos funcionales". También podrás observar los detalles o datos que se seleccionaron para crear el curso, también un botón para cambiar el color del curso "No fue probado en internet, debería de quedar el color para todas las personas que deseen tomar el curso y para el mismo educador o administrador que desee analizarlo". Además, un botón para crear clases en un modal o popup como el de crear cursos: aquí podrás crear las clases y asignar datos como título de la lección, descripción de la lección, duración de la lección "el cual cuando subes un video al campo de seleccionar un video que también es opcional a su vez, podrás observar que obtiene el tamaño del video y lo pondrá directamente en el campo de duración", campos opcionales para cargar una imagen de portada para la lección, campo para el video. Pero si es obligatorio subir archivos hasta un máximo de 5 archivos, los cuales se guardarán en Amazon-AWSS3, se obtendrá el nombre del bucket y se guardará en PostgreSQL con el nombre de los archivos. Cabe recalcar que como tecnologías para manejo de los datos se están almacenando en PostgreSQL, Amazon-AWSS3 y otros en Upstash para las actividades. También aquí encontrarás un panel de estudiantes asociados a este curso con sus datos y un progreso de su avance en general del curso, al cual deben añadirsele más campos que especifica el contratador parecidos a Q10. Cuando pulsas ver acciones del usuario, se intentó hacer un detallado del usuario en un modal o popup con sus datos y detalles más específicos.

-(inicio)/cursos/[courseId]/page.tsx
Aquí solamente importarás y renderizarás lo que hay en CourseDetails.

-(inicio)/cursos/[courseId]/ver/[courseId]/page.tsx
Aquí una vista más o menos como lo vería un estudiante el curso. Consideraciones: Consultar con los líderes o jefes, si en vez de esta interfaz te lleva directamente a ver exactamente como lo ve un estudiante desde su rol y no un aproximado.

-(inicio)/cursos/[courseId]/[lessonId]/page.tsx
Aquí encontrarás algo parecido a CourseDetails que son los detallados de las clases o lecciones, también la lista de archivos subidos previamente, editar la clase, visualizarla y eliminarla. Podrás pulsar editar y podrás editar la clase, visualizar y ir a una vista más o menos como la de ver/[CourseId] y una lista de las actividades, con un botón para crear actividad y ver actividad.

-(inicio)/cursos/[courseId]/[lessonId]/verClase/[id]/page.tsx
Aquí un aproximado a como los estudiantes ven las clases. Consideraciones: las mismas que ver/[CourseId]

-(inicio)/cursos/[courseId]/[lessonId]/actividades/page.tsx
Aquí cuando pulsas en crear actividades desde ....../[lessonId]/page.tsx te redirigirá a esta sección en la cual podrás crear actividades con calificación y sin calificación, también podrás asignarles fecha máxima, escoger qué tipo de actividad deseas crear entre las 3 disponibles "presentación de documentos, distintos tipos de preguntas y preguntas abiertas". Puedes crear un título para la actividad, descripción y además si la actividad es calificable podrás asignarla a un parámetro de evaluación ya definido al crear el curso entre los 10 parámetros que son posibles crear y asignarle un peso a esa actividad del parámetro con la validación de que las actividades asociadas a un parámetro de evaluación no puedan superar el 100% de este parámetro. Cuando pulses crear te redireccionará directamente a los detalles de la actividad.

-(inicio)/cursos/[courseId]/[lessonId]/actividades/[activityId]/page.tsx
Aquí encontrarás los detalles de la actividad con todos los detalles de esta, si es calificada, si tiene fecha máxima de entrega y se te renderizará según el tipo de actividad que hayas escogido previamente. La imagen que aparece aquí es la asociada a la clase, las actividades de distintos tipos de pregunta se crean y se guardan en Upstash "todas las preguntas en general". También la de distintos tipos de preguntas, el usuario al crear la actividad sube archivos y tiene su dashboard para calificar las respuestas de los estudiantes. Toca hacer los últimos pedidos del contratador que se pueda comentar, asignar nota y escribirle una retroalimentación al estudiante de su envío. También hay que completar el tercer tipo de actividad que es pregunta a completar que debe tener su panel para calificar al estudiante, el tipo de pregunta de distintos tipos de preguntas hay que terminar la validación que no supere el 100% a especificaciones del contratador y calcular las notas para asignarla al usuario y según la operación de todas las actividades determinar si el estudiante aprueba o no aprueba el curso.

## Components/educators
-dashboard/CalificarPreguntas.tsx
Aquí un pequeño componente que no fue terminado para calificar el tercer tipo de pregunta.

-layout/CategoryDropdown.tsx
Aquí el botón para seleccionar las categorías al crear el curso.

-layout/CourseListDetails.tsx
Aquí la lista de cursos que aparecen en el dashboard principal para poder ir a mirar el más detallado.

-layout/DashboardEstudiantes.tsx
Aquí el dashboard que se ve en CourseDetails.

-layout/DificultadDropdown.tsx
Desplegable para seleccionar la dificultad del curso, el cual se renderiza en ModalFormCourse.

-layout/FilesUpload.tsx
Aquí el componente para poder cargar los archivos en los modales como en ModalFormCourse o ModalFormLesson.

-layout/FormActCompletado
Formulario que crea las preguntas abiertas más básicas.

-layout/LessonsListEducator.tsx
Esta es la lista de las lecciones o clases asociadas a un curso.

-layout/ListActividades.tsx
Esta es la lista de las actividades asociadas a una lección.

-layout/ListActividadesByStudent.tsx
Esta es la lista de las actividades más o menos como lo ven los estudiantes.

-layout/ListActSubidaFile.tsx
Este es el componente que me renderiza la vista de las preguntas que se deben subir un archivo.

-layout/ListPreguntaAbierta.tsx
Esta es la lista del tipo de pregunta abierta.

-layout/ListPreguntaAbierta2.tsx
Esta es la lista para preguntas abiertas que tienen complejidad mayor a especificaciones del contratador.

-layout/ModalidadDropdown.tsx
Aquí el botón desplegable de las modalidades.

-layout/PreguntasAbierta.tsx
Formulario para el tipo de pregunta abierta más sencilla.

-layout/PreguntasAbierta2.tsx
Formulario para el tipo de pregunta abierta más compleja.

-layout/ProgressBarProvider.tsx
Barra de indicación de carga al crear algún tipo de actividad, curso o lección.

-layout/QuestionsForm.tsx
Aquí encontrarás el formulario para crear preguntas de opción múltiple.

-layout/QuestionsList.tsx
Aquí la lista de preguntas de opción múltiple.

-layout/SeleccionAct.tsx
Aquí un botón desplegable para seleccionar el tipo de pregunta que deseas crear: opción múltiple, falso o verdadero y preguntas abiertas básicas.

-layout/SelectParametro.tsx
Aquí el componente para seleccionar un parámetro de evaluación cuando creas una actividad.

-layout/SkeletonCard.tsx
Aquí un skeleton de carga cuando se está cargando un curso, cartas y/o lecciones.

-layout/TypesActDropdown.tsx
Aquí podrás seleccionar el tipo de actividad que deseas crear como la de subir documentos, distintos tipos de preguntas y/o preguntas abiertas complejas que están en la base de datos.

-layout/VerdaderoOFalseForm.tsx
Aquí el formulario para crear preguntas del tipo verdadero o falso.

-layout/VerdaderoOFalseList.tsx
Aquí la lista de preguntas de falso o verdadero.

-layout/VerFileByStudent.tsx
Aquí una vista más o menos de cómo los estudiantes visualizan los archivos de una lección o clase.

-layout/ViewFiles.tsx
Aquí el componente para ver los archivos subidos a una clase.

-UI/*
Aquí todos los componentes de ShadCN usados en la página como botones, inputs, labels, sonner, etc.

## Components/educators/modals
-ModalError.tsx
Aquí el componente modal para hacer el envío de errores de Artiefy.

-ModalFormCourse.tsx
Aquí nos encontramos el modal para la creación de cursos el cual obtiene los datos y los envía a page.tsx o a CourseDetails y aquí es donde se maneja el método HTTP POST para crear el curso.

-ModalFormLessons.tsx
Componente autónomo que obtiene el ID del curso para desde esta información mantener enlazada la clase y/o lección con el curso.

## Components/VerActividad
En esta carpeta está una sección de ejemplo de cómo los estudiantes van a ver las actividades "Opcional debido a que está manejándose otra lógica".
Uso:
-ActSubida.tsx: Este es el ejemplo de cómo los estudiantes verían la actividad para subir documentos.
-PreguntaCompletado.tsx: Esta es para ver las preguntas abiertas.
-PreguntaFOV.tsx: En esta nos encontramos la lista para responder las preguntas del tipo falso o verdadero.
-PreguntaOM.tsx: Esta es para la lista de preguntas de opción múltiple.

## Components/ZoneForum
-Forum: Este es el componente de la zona inicial de los foros, donde se renderizan la lista de foros en general.
-Zone: Aquí en este componente nos encontramos solamente las cartas de los foros con los datos que han sido creados.

## eduAndAdminMenu.tsx
Menú top lateral derecho con la renderización de los ítems necesarios para admin o educadores.

Backend y Endpoints

## models/educatorsModels
-ActivitiesModels.ts: Aquí encontramos las operaciones CRUD de un objeto o tabla de la base de datos, en este caso las actividades.
-courseModelsEducators.ts: Aquí nos encontramos el CRUD para crear los cursos, con endpoints para crear, actualizar, obtener los datos de la base de datos.
-DatosDashboard.ts: Este es el método GET de la base de datos para obtener los datos del dashboard principal de alguien con rol docente y de las estadísticas que especifica en el que hacía este.
-ForumAndPosts.ts: Aquí todo lo relacionado con el foro, los posts y la respuesta a los foros, todo el método CRUD. Consideraciones: La idea principal era hacer una zona de comentarios como la de Facebook o Twitter ahora llamado X, pero para hacer esto una base de datos relacional se queda corta para esta funcionalidad y no la implementé debido al corto tiempo para hacerlo. A futuro debería hacerse de esta manera.
-LessonsModels.ts: Aquí nos encontramos el CRUD de las lecciones o las clases.
-ParametrosModels.ts: Aquí nos encontramos el método HTTP para crear y actualizar parámetros, relacionados a un curso.
-TicketsModels.ts: Aquí nos encontramos el sistema y manejo de errores que los usuarios creen en Artiefy y los roles de administradores puedan obtenerlos.
-userModelts.ts: Aquí nos encontramos el CRUD de los usuarios.

-Api/upload: Aquí la conexión a AWS-S3 para subir archivos a AWS con el nombre de lo que se haya obtenido.
-Api/estudiantes/subir-archivo: Aquí un ejemplo de conexión a Upstash que usa el componente de actSubida que sube los archivos a Upstash y desde el componente de calificar, calificamos este documento con los datos asociados al usuario.
-Api/tickets: En este endpoint encontramos los métodos que se obtienen del backend para que el usuario desde el cliente haga uso de estos.
-Api/educadores/actividades: Endpoints del CRUD de actividades como GET, POST, DELETE y PUT.
-Api/educadores/actividadesByLesson: Endpoints del método GET para obtener las actividades de un curso.
-Api/answers: Aquí el endpoint para obtener las respuestas de las actividades de archivo subido.
-Api/Educadores/calificar-archivo: Aquí nos encontramos el endpoint para calificar las actividades de subida de archivos en Upstash.
-Api/Educadores/categories: Aquí para obtener las categorías disponibles en la base de datos.
-Api/Educadores/courses: Aquí los endpoints relacionados con los cursos.
-Api/Educadores/dashboard: Aquí nos encontramos el método que obtiene los datos de la base de datos del dashboard.
-Api/Educadores/descargar-archivo: Aquí el método que descarga los archivos subidos por los estudiantes a Upstash.
-Api/Educadores/dificultad: Aquí nos encontramos las dificultades disponibles de la base de datos.
-Api/Educadores/getFiles: Aquí el endpoint destinado únicamente para obtener los archivos subidos de los docentes a AWS-S3.
-Api/Educadores/infoUser: Aquí nos encontramos el endpoint para obtener los datos relacionados a un usuario renderizados en el dashboard de estudiantes.
-Api/Educadores/lessons: Endpoints que obtiene todos los métodos HTTP de la base de datos.
-Api/Educadores/modalidades: Obtener todas las modalidades almacenadas en la base de datos.
-Api/Educadores/parametros: Aquí obtenemos los métodos HTTP y crea los endpoints relacionados con los parámetros.
-Api/Educadores/progressUser: Aquí el endpoint que obtiene el progreso del usuario y los muestra en el dashboard de estudiantes.
## Api/Educadores/question: Aquí todos los endpoints relacionados con las actividades.
-Api/Educadores/respuesta-archivos: Aquí el endpoint que trae todas las respuestas de los estudiantes de las actividades de subida de archivos en Upstash que se renderiza en el dashboard de calificación.
-Api/Educadores/send-email: Aquí una API "no completada" que me permitía enviar mensajes vía correo electrónico a estudiantes cuando una persona con rol como educador y administradores hacía un post o respondía un post en los foros.
-Api/Educadores/typeact: Aquí el endpoint que trae los tipos de actividades creadas en la base de datos.
-Api/Educadores/userCourses: Este endpoint era de una funcionalidad no aceptada para traer datos específicos de usuarios enrolados a un curso.

-types/typeActi.ts: Aqui el tipado de las actividades.

Aquí información adicional:
NextJS tiene una forma específica para manejar datos en específicos y nos permite manejar rutas en específicas a través de una carpeta entre [] con el nombre particular [id] y aquí significa que me traerá datos en específicos de un ID en una tabla ya sea cursos, lecciones, usuarios, etc.

Un gusto hacer esta explicación a grosso modo de qué hace cada componente y cada cosa que usé al desarrollar en Artiefy. :D!!
¡Happy development! :D