const express = require('express');
const { Pool } = require('pg');
const app = express();



const pool = new Pool({
  user: 'odoo_db',
  host: 'localhost',
  database: 'odoo_db',
  password: 'odoo_db',
  port: 5445,
});
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      return console.error('Error executing query', err.stack);
    }
    console.log('Connection successful:', result.rows);
  });
});


  

app.get('/data', async (req, res) => {
  console.log('Endpoint /data hit');
  try {
    const result = await pool.query('SELECT * FROM public.school_student');
    console.log('Query executed');
    console.table(result.rows); // Imprime el resultado en la consola en formato de tabla
    res.json(result.rows);
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: 'Error al realizar la consulta' });
  }
});


app.get('/curso', async (req, res) => {
  console.log('Endpoint /data hit');
  try {
    const result = await pool.query('SELECT * FROM public.school_student');
    console.log('Query executed');
    console.table(result.rows); // Imprime el resultado en la consola en formato de tabla
    res.json(result.rows);
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: 'Error al realizar la consulta' });
  }
});

app.get('/datas', async (req, res) => {
  console.log('Endpoint /datas hit');
  const ci = req.query.ci; // Obtener el valor de CI desde la solicitud

  if (!ci) {
    return res.status(400).json({ error: 'CI es requerido' });
  }

  try {
    const query = `
      SELECT 
        school_student.name AS student_name,
        school_enrollment.grade,
        school_subject.name AS subject_name,
        school_cycle.name AS cycle_name,
        school_course.name AS course_name,
        school_course.parallel
      FROM public.school_enrollment
      JOIN public.school_student ON school_enrollment.student_id = school_student.id
      JOIN public.school_schedule ON school_enrollment.schedule_id = school_schedule.id
      JOIN public.school_subject ON school_schedule.course_id = school_subject.id
      JOIN public.school_cycle ON school_schedule.cycle_id = school_cycle.id
      JOIN public.school_course ON school_schedule.course_id = school_course.id
      WHERE school_student.ci = $1
    `;
    
    const values = [ci];
    const result = await pool.query(query, values);
    
    console.log('Query executed');
    console.table(result.rows); // Imprime el resultado en la consola en formato de tabla
    
    res.json(result.rows);
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: 'Error al realizar la consulta' });
  }
});





app.get('/tutor', async (req, res) => {
  console.log('Endpoint /datas hit');
  const tutorEmail = req.query.email; // Obtener el valor de email del tutor desde la solicitud

  if (!tutorEmail) {
    return res.status(400).json({ error: 'Email del tutor es requerido' });
  }

  try {
    const query = `
      SELECT school_student.name, school_student.ci
      FROM public.school_student
      JOIN public.school_tutor ON (school_tutor.id = school_student.tutor_principal OR school_tutor.id = school_student.tutor_secundary)
      WHERE school_tutor.email = $1
    `;
    
    const values = [tutorEmail];
    const result = await pool.query(query, values);
    
    console.log('Query executed');
    console.table(result.rows); // Imprime el resultado en la consola en formato de tabla
    
    res.json(result.rows);
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: 'Error al realizar la consulta' });
  }
});


app.get('/activities', async (req, res) => {
  const ci = req.query.ci; // Obtener el valor de CI desde la solicitud
  if (!ci) {
    return res.status(400).json({ error: 'CI es requerido' });
  }

  try {
    // Consulta para obtener los datos de curso y paralelo del estudiante
    const queryCourseParallel = `
      SELECT 
        school_course.name AS course_name,
        school_course.parallel
      FROM public.school_enrollment
      JOIN public.school_student ON school_enrollment.student_id = school_student.id
      JOIN public.school_schedule ON school_enrollment.schedule_id = school_schedule.id
      JOIN public.school_course ON school_schedule.course_id = school_course.id
      WHERE school_student.ci = $1
    `;
    
    const values = [ci];
    const resultCourseParallel = await pool.query(queryCourseParallel, values);
    
    if (resultCourseParallel.rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron cursos para este CI' });
    }
    
    // Obtener el curso y paralelo
    const { course_name, parallel } = resultCourseParallel.rows[0];

    // Verificar si el curso y paralelo existen
    console.log(`Curso: ${course_name}, Paralelo: ${parallel}`);

    // Ahora, consulta las actividades para el curso y paralelo encontrados
    const queryActivities = `
      SELECT 
        school_activity.id,
        school_activity.name AS activity_name,
        school_activity.activity_type,
        school_activity.completed,
        school_activity.start_time,
        school_activity.end_time,
        school_course.name AS course_name,
        school_course.parallel
      FROM 
        public.school_activity
      JOIN 
        public.school_schedule ON school_activity.schedule_id = school_schedule.id
      JOIN 
        public.school_course ON school_schedule.course_id = school_course.id
      WHERE 
        school_course.name = $1 AND school_course.parallel = $2
    `;

    const activityValues = [course_name, parallel];
    const resultActivities = await pool.query(queryActivities, activityValues);

    // Depuración de resultados de actividades
    console.log('Actividades encontradas:', resultActivities.rows);

    if (resultActivities.rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron actividades para este curso y paralelo' });
    }

    // Enviar la respuesta con las actividades encontradas
    res.json(resultActivities.rows);
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: 'Error al realizar la consulta' });
  }
});




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
// const express = require('express');
// const { Pool } = require('pg');
// const admin = require('firebase-admin');
// const app = express();

// // Inicializa Firebase Admin SDK
// admin.initializeApp({
//   credential: admin.credential.cert(require('C:/odoo/clave/school-abe04-firebase-adminsdk-5bbbo-b1940ec29d.json'))
// });

// // Configura la conexión a PostgreSQL
// const pool = new Pool({
//   user: 'odoo_db',
//   host: 'localhost',
//   database: 'odoo-db',
//   password: 'odoo_db',
//   port: 5445,
// });

// // Conéctate y escucha notificaciones de PostgreSQL
// pool.connect((err, client) => {
//   if (err) {
//     return console.error('Error acquiring client', err.stack);
//   }

//   // Escucha el canal 'new_activity' donde se emiten las notificaciones del trigger
//   client.on('notification', async (msg) => {
//     console.log('Notificación recibida:', msg); // Ver detalles de la notificación
//     const activity = JSON.parse(msg.payload); // `msg.payload` debe contener un JSON de la actividad
//     const message = {
//       notification: {
//         title: `Nueva actividad: ${activity.activity_name}`,
//         body: `${activity.activity_type} del ${activity.start_time} al ${activity.end_time}`
//       },
//       topic: 'all'  // Enviar a todos los dispositivos suscritos al tema 'all'
//     };

//     try {
//       // Envía la notificación a Firebase
//       await admin.messaging().send(message);
//       console.log('Notificación enviada:', message);
//     } catch (error) {
//       console.error('Error al enviar notificación:', error);
//     }
//   });

//   // Suscríbete al canal `new_activity`
//   client.query('LISTEN new_activity');
//   console.log('Escuchando el canal new_activity para nuevas actividades');
// });
