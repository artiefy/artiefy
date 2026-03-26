import React from 'react';

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

// Registrar fuente personalizada si lo deseas
// Font.register({ family: 'Delius', src: '/fonts/Delius-Regular.ttf' });

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#01142B',
    padding: 32,
    fontFamily: 'Helvetica',
    fontSize: 12,
    color: '#fff',
    border: '1.5 solid #22C4D3', // Borde más sutil
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    borderBottom: '1.2 solid #22C4D3', // Borde más sutil
    paddingBottom: 18,
    backgroundColor: '#01142B',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingTop: 8,
    paddingLeft: 8,
  },
  logo: {
    width: 54,
    height: 54,
    marginRight: 18,
    marginLeft: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#22C4D3',
    textAlign: 'center',
    letterSpacing: 1.2,
    marginBottom: 4,
    marginTop: 4,
    fontFamily: 'Helvetica',
  },
  section: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#1e2939',
    borderRadius: 8,
    border: '0.7 solid #00BDD8', // Borde más sutil
    color: '#fff',
  },
  label: {
    fontWeight: 'bold',
    color: '#22C4D3',
    marginRight: 4,
    fontFamily: 'Helvetica',
  },
  table: {
    width: '100%',
    marginTop: 16,
    marginBottom: 16,
    border: '0.7 solid #00BDD8', // Borde más sutil
    borderRadius: 8,
    backgroundColor: '#182235',
    color: '#fff',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#22C4D3',
    color: '#01142B',
    fontWeight: 'bold',
    fontSize: 13,
    padding: 8,
    borderRight: '0.7 solid #00BDD8',
    borderBottom: '0.7 solid #00BDD8',
    fontFamily: 'Helvetica',
  },
  tableCell: {
    padding: 8,
    borderRight: '0.5 solid #00BDD8',
    borderBottom: '0.5 solid #00BDD8',
    fontSize: 12,
    backgroundColor: '#1e2939',
    color: '#fff',
    fontFamily: 'Helvetica',
  },
  resumen: {
    marginTop: 22,
    padding: 14,
    backgroundColor: '#182235',
    borderRadius: 8,
    border: '0.7 solid #22C4D3',
    color: '#fff',
  },
  resumenLabel: {
    color: '#00BDD8',
    fontWeight: 'bold',
    fontSize: 13,
    fontFamily: 'Helvetica',
  },
  resumenValue: {
    color: '#fff',
    fontSize: 13,
    marginLeft: 8,
    fontFamily: 'Helvetica',
  },
  scaleTitle: {
    fontWeight: 'bold',
    color: '#22C4D3',
    fontSize: 12,
    marginTop: 18,
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 1,
    fontFamily: 'Helvetica',
  },
  scaleTable: {
    width: '100%',
    backgroundColor: '#1e2939',
    borderRadius: 6,
    border: '0.7 solid #00BDD8',
    marginTop: 4,
    marginBottom: 8,
    color: '#fff',
  },
  scaleRow: {
    flexDirection: 'row',
    borderBottom: '0.5 solid #00BDD8',
  },
  scaleCell: {
    flex: 1,
    padding: 6,
    textAlign: 'center',
    fontSize: 10,
    color: '#fff',
    fontFamily: 'Helvetica',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    textAlign: 'right',
    color: '#2ecc71',
    fontSize: 10,
    paddingRight: 24,
    fontFamily: 'Helvetica',
  },
});

interface ActivityDetail {
  activityId: number;
  name: string;
  description: string;
  isCompleted: boolean;
  score: number;
  parentTitle?: string;
}

interface UserInfo {
  firstName: string;
  email: string;
  role: string;
}

interface CourseInfo {
  title: string;
  instructor: string;
  createdAt: string;
  nivel: string;
}

interface Stats {
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  globalCourseScore: string;
  activities: ActivityDetail[];
}

interface PDFReportProps {
  stats: Stats;
  userInfo: UserInfo;
  courseInfo: CourseInfo;
  logoUrl?: string;
}

const PDFReport: React.FC<PDFReportProps> = ({
  stats,
  userInfo,
  courseInfo,
  logoUrl,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header profesional con dos logos */}
      <View style={styles.header}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          <Image src={logoUrl || '/artiefy-logo.png'} style={styles.logo} />
        </View>
        <View
          style={{ flex: 2, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={styles.title}>Informe de Notas</Text>
        </View>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <Image
            src={'/logo-ponao.png'}
            style={{
              width: 90,
              height: 90,
              marginRight: 8,
              marginTop: 4,
              marginBottom: 4,
            }}
          />
        </View>
      </View>
      {/* Datos del estudiante y curso */}
      <View style={styles.section}>
        <Text>
          <Text style={styles.label}>Nombre:</Text> {userInfo.firstName}
        </Text>
        <Text>
          <Text style={styles.label}>Email:</Text> {userInfo.email}
        </Text>
        <Text>
          <Text style={styles.label}>Rol:</Text> {userInfo.role}
        </Text>
        <Text>
          <Text style={styles.label}>Curso:</Text> {courseInfo.title}
        </Text>
        <Text>
          <Text style={styles.label}>Instructor:</Text> {courseInfo.instructor}
        </Text>
        <Text>
          <Text style={styles.label}>Nivel:</Text> {courseInfo.nivel}
        </Text>
        <Text>
          <Text style={styles.label}>Creado el:</Text>{' '}
          {courseInfo.createdAt
            ? new Date(courseInfo.createdAt).toLocaleDateString()
            : '-'}
        </Text>
      </View>
      {/* Tabla de actividades */}
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={[styles.tableHeader, { flex: 2 }]}>Actividad</Text>
          <Text style={[styles.tableHeader, { flex: 3 }]}>Descripción</Text>
          <Text style={[styles.tableHeader, { flex: 2 }]}>Clase</Text>
          <Text style={[styles.tableHeader, { flex: 1.5 }]}>Estado</Text>
          <Text style={[styles.tableHeader, { flex: 1 }]}>Nota</Text>
        </View>
        {stats.activities.map((a) => (
          <View style={styles.tableRow} key={a.activityId}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{a.name}</Text>
            <Text style={[styles.tableCell, { flex: 3 }]}>{a.description}</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>
              {a.parentTitle ?? '—'}
            </Text>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>
              {a.isCompleted ? 'Completada' : 'Pendiente'}
            </Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>
              {typeof a.score === 'number' && !isNaN(a.score) ? a.score : 0}
            </Text>
          </View>
        ))}
      </View>
      {/* Resumen */}
      <View style={styles.resumen}>
        <Text>
          <Text style={styles.resumenLabel}>Nota global:</Text>
          <Text style={styles.resumenValue}>
            {' '}
            {stats.globalCourseScore ?? 'N/A'}
          </Text>
        </Text>
      </View>
      {/* Escala de nota media tipo universidad */}
      <Text style={styles.scaleTitle}>ESCALA DE NOTA MEDIA</Text>
      <View style={styles.scaleTable}>
        <View style={styles.scaleRow}>
          <Text style={styles.scaleCell}>5.00 - 5.00</Text>
          <Text style={styles.scaleCell}>4.75 - 4.99</Text>
          <Text style={styles.scaleCell}>4.50 - 4.74</Text>
          <Text style={styles.scaleCell}>4.00 - 4.49</Text>
          <Text style={styles.scaleCell}>3.00 - 3.99</Text>
          <Text style={styles.scaleCell}>2.00 - 2.99</Text>
          <Text style={styles.scaleCell}>1.00 - 1.99</Text>
        </View>
        <View style={styles.scaleRow}>
          <Text style={styles.scaleCell}>A+</Text>
          <Text style={styles.scaleCell}>A</Text>
          <Text style={styles.scaleCell}>B+</Text>
          <Text style={styles.scaleCell}>B</Text>
          <Text style={styles.scaleCell}>C</Text>
          <Text style={styles.scaleCell}>D</Text>
          <Text style={styles.scaleCell}>F</Text>
        </View>
      </View>
      {/* Footer */}
      <Text style={styles.footer}>Generado por Artiefy</Text>
    </Page>
  </Document>
);

export default PDFReport;
