Explicacion de artiefy Rol de docente:

Dashboard/Educadores:
-(inicio)/page.tsx
Aqui luego de iniciar desde la pagina principal de artiefy, aqui podras observar en el cliente un dashboard general con los detalles del rol de la persona todo por id de la persona que esta con este rol de educador, en el cual podras analizar los detalles de la persona como por ejemplo: cuantos cursos tiene asociados, un promedio de estudiantes, total de clases, duracion de lo subido y ademas vas a tener una lista de los cursos para pulsar y ir a ver los detalles de este curso.

-(inicio)/detailsDashboard/page.tsx
Aqui estan los detalles mas especificos del curso datos como el rating del curso, total de estudiantes, total de clases y ademas tendras una lista de cual es el progreso de todos los estudiantes en general en cada clase y/o leccion.

-(Inicio)/foro/page.tsx:
Es sencillo aqui, solo hay un canal de migas y el componente forumHome que por ahora esta trayendo todos los foros creados hasta el momento.

-(Inicio)/foro/[forumID]/page.tsx
En esta zona vas a entrar a un foro en especifico en el cual podras observar quien es el creador del foro, la descripcion y todo lo que se ha posteado en este foro y sus respuestas, ademas en la zona superior, lateral derecha podras observar un icono Ellipsis el cual a su ves es un Collapsible el cual podras pulsar y te desplegara un menu con 2 opcion que son editar y eliminar post o respuesta "solamente si eres la persona dueña del comentario".

-(Inicio)/cursos/page.tsx
En esta seccion podras encontrar en la parte visual el titulo de la zona, una lista de los cursos a los cuales fuiste asignado o has creado y tambien un boton para crear cursos el cual te desplegara un modal o pupop que viene de los componentes de educador, en este modal podras añadir un titulo, una descripcion, los requerimientos que el estudiante tiene para tomar este curso, el nombre de la persona que lo esta creado y ademas un boton drag&&drop en el cual podras añadir una imagen o arrastrarla para subir la imagen de portada del curso, ademas de todo esto podras crear parametros de evaluacion con un titulo, una descripcion y el peso del parametro para el curso los cuales no pueden superar el 100% "te mostrara un mensaje de error si los parametros exceden el 100%". Si pulsas en el boton ver curso de un curso vas a ir a los detalles de este curso.

-(Inicio)/cursos/[courseId]/CourseDetail.tsx
Aqui podras encontrar todos los detalles de un id de un curso en especifico, podras observar detalles como visualizar, editar, estadisticas y eliminar "todos funcionales". Tambien podras observar los detalles o datos que se seleccionaron para crear el curso, tambien un boton para cambiar el color del curso "No fue probado en internet, deberia de quedar el color para todas las personas que deseen tomar el curso y para el mismo educador o administrador que desee analizarlo", ademas un boton para crear clases en un modal o pupop como el de crear cursos: aqui podras crear las clases y asignar datos como titulo de la lession, descripcion de la leccion, duracion de la leccion "el cual cuando subes un video al campo de seleccionar un video que tambien es opcional a su ves, podras observar que obtiene el tamaño del video y lo pondra directamente en el camppo de duraccion", campos opcionales para cargar una imagen de portada para la leccion, campo para el video. Pero si es obligatorio subir archivos hasta un maximo de 5 archivos, los cuales se guardaran en amazon-AWSS3, se obtendra el nombre del bucket y se guardara en postgress con el nombre de los archivos. Cabe recalcar que como tecnologias para manejo de los datos se estan almacenando en PostgresSql, Amazon-AWSS3 y otros en upstash para las actividades. Tambien aqui encontraras un panel de estudiantes asociados a este curso con sus datos y un progreso de su avance en general del curso, el cual deben añadirsele mas campos que especifica el contratador parecidos a Q10, cuando pulsas ver acciones del usuario se intento hacer un detallado del usuario en un modal o pupop con sus datos y detalles mas especificos.

-(Inicio)/cursos/[courseId]/page.tsx
Aqui solamente importaras y renderizaras lo que hay en CourseDetails.

-(Inicio)/cursos/[courseId]/ver/[courseId]/page.tsx
Aqui una vista mas o menos como lo veria un estudiante el curso, consideraciones: Consultar con los lideres o jefes, si en ves de esta interfaz te lleve directamente a ver exactamente como lo ve un estudiante desde su rol y no un aproximado.


-(Inicio)/cursos/[courseId]/[lessonId]/page.tsx
Aqui encontraras algo parecido a courseDetails que son los detallados de las clases o lecciones, tambien la lista de archivos subidos previamente, editar la clase, visualizarla y eliminarla. podras pulsar editar y podras editar la clase, visualizar y ir a una vista mas o menos como la de ver/[CourseId] y una lista de las activividades, con un boton para crear actividad y ver actividad.

-(Inicio)/cursos/[courseId]/[lessonId]/verClase/[id]/page.tsx
Aqui un aproximado a como los estudiantes ven las clases, consideraciones: las mismas que ver/[CourseId]

-(Inicio)/cursos/[courseId]/[lessonId]/actividades/page.tsx
Aqui cuando pulsar en crear actividades desde ....../[lessonId]/page.tsx te redigira a esta seccion en la cual podras crear actividades con calificacion y sin calificacion, tambien podras asignarles fecha maxima, escojer que tipo de actividad deseas crear entre las 3 disponible "presentacion de documentos, distintos tipos de preguntas y preguntas abiertas". Puedes crear un titulo para la actividad, descripcion y ademas si la actividad es calificable podras asignarla a un parametro de evaluacion ya definido al crear el curso entre los 10 parametros que son posibles crear y asignarle un peso a esa actividad del parametro con la validacion de que las actividades asociadas a un parametro de evaluacion no puedan superar el 100% de este parametro. cuando pulses crear te redireccionara directamente a los detalles de la actividad.

-(Inicio)/cursos/[courseId]/[lessonId]/actividades/[activityId]/page.tsx
Aqui encontraras los detalles de la actividad con todos los detalles de esta, si es calificada, si tiene fecha maxima de entrega y se te renderizara segun el tipo de actividad que hayas escojido previamente, la imagen que aparece aqui es la asociada a la clase, las actividades de distintos tipo de pregunta se creean y se guardan en upstash "todas las preguntas en general", tambien la de distintos tipos de preguntas el usuario al crear la actividad sube archivos y tiene su dashboard para calificar las respuesta de los estudiantes, toca hacer los ultimos pedidos del contratador que se pueda comentar, asiganar nota y escribirle en un retroalimentacion al estudiante de su envio. Tambien ahi que completar el 3 tipo de actividad que es pregunta a completar que debe tener su panel para calificar al estudiante, el tipo de pregunta de distintos tipos de preguntas ahi que terminar la validacion que no supere el 100% a especificaciones del contratador y calcular las notas para asignarla al usuario y segun la operacion de todas las actividades determinar si el estudiante aprueba o no, aprueba el curso.

Components/educators
-dashboard/CalificarPreguntas.tsx
Aqui un pequeño componente que no fue terminado para calificar el 3 tipo de pregunta.

-layout/CategoryDropdown.tsx
Aqui el boton para seleccionar las categorias al crear el curso.

-layout/CourseListDetails.tsx
Aqui la lista de cursos que aparecen en el dashboard principal para poder ir a mirar el mas detallado.

-layout/DashboardEstudiantes.tsx
Aqui el dashboard que se en CourseDetails

-layout/DificultadDropdown.tsx
Desplegable para seleccionar la dificultad del curso, el cual se renderiza en ModalFormCourse

-layout/FilesUpload.tsx
Aqui el componente para poder cargar los archivos en los modasl como en ModalFormCourse o ModalFormLesson

-layout/FormActCompletado
Formulario que crea las preguntas abiertas mas basicas

-layout/LessonsListEducator.tsx
Esta es la lista de las lecciones o clases asociadas a un curso

-layout/ListActividades.tsx
Esta es la lista de las actividades asociadas a una lession

-layout/ListActividadesByStudent.tsx
Esta es la lista de las actividades mas o menos como lo ven los estudiantes

-layout/ListActSubidaFile.tsx
Este es el componente que me renderiza la vista de las preguntas que se debe subir un archivo

-layout/ListPreguntaAbierta.tsx
Esta es la lista del tipo de pregunta abierta

-layout/ListPreguntaAbierta2.tsx
Esta es la lista para preguntas abiertas que tienen complejidad mayor a especificaciones del contrador.

-layout/ModalidadDropdown.tsx
Aqui el boton desplegable de las modalidades.

-layout/PreguntasAbierta.tsx
Formulario para el tipo de pregunta abierta mas sencillar

-layout/PreguntasAbierta2.tsx
Formulario para el tipo de pregunta abierta mas complejas

-layout/ProgressBarProvider.tsx
Barra de indicacion de carga al crear algun tipo de actividad, curso o lession.

-layout/QuestionsForm.tsx
Aqui encontraras el formulario para crear preguntas de opcion multiple

-layout/QuestionsList.tsx
Aqui la lista de preguntas de opcion multiple.

-layout/SeleccionAct.tsx
Aqui un boton desplegable para seleccionar el tipo de pregunta que deseas crear Opcion multiple, falso o verdadero y preguntas abiertas basicas.

-layout/SelectParametro.tsx
Aqui el componente para seleccionar un parametro de evaluacion cuando creas una actividad.

-layout/SkeletonCard.tsx
Aqui un skeleton de carga cuando se esta cargando un curso, cartas y/o lessiones.

-layout/TypesActDropdown.tsx
Aqui podras seleccionar el tipo de actividad que deseas crear como la de subir documentos, distintos tipos de preguntas y/o preguntas abiertas complejas que estan en la base de datos

-layout/VerdaderoOFalseForm.tsx
Aqui el formulario para crear preguntas del tipo verdadero o falso.

-layout/VerdaderoOFalseList.tsx
Aqui la lista de preguntas de falso o verdadero.

-layout/VerFileByStudent.tsx
Aqui una vista mas o menos de como los estudiantes visualizan mas o menos los archivos de una lession o clase

-layout/ViewFiles.tsx
Aqui el componente para ver los files subidos a una clase.

-UI/*
Aqui todos los componentes de ShadCN usados en la pagina como botones, inputs, label, sonner etc.
