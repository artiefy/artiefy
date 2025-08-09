import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

import type { Course } from '~/types';

interface CertificationStudentPDFProps {
  userName: string;
  course: Course;
  date: string;
  certificateUrl: string;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#fff',
    padding: 0,
    flexDirection: 'column',
    width: '100%',
    height: '100%',
  },
  border: {
    border: '8px solid #fbbf24',
    borderRadius: 16,
    margin: 0,
    padding: 32,
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    width: '100%',
    justifyContent: 'flex-start',
    gap: 16,
    position: 'relative',
    minHeight: 50, // asegura espacio para el logo
  },
  logo: {
    width: 100,
    height: 50,
    objectFit: 'contain',
    marginBottom: 0,
    marginRight: 0,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  contentWrapper: {
    marginTop: 60, // Aumenta el marginTop para separar el contenido del logo
    // Elimina paddingTop, solo deja marginTop
  },
  headerTextCentered: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    flex: 1,
    marginLeft: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#d97706',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginVertical: 8,
    textAlign: 'center',
  },
  course: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginVertical: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#444',
    marginVertical: 12,
    textAlign: 'center',
  },
  grid: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: 40,
    width: '100%',
    gap: 24,
  },
  gridCol: {
    flex: 1,
    textAlign: 'center',
    justifyContent: 'flex-start',
  },
  signatureImg: {
    width: 120,
    height: 40,
    margin: '0 auto 8px auto',
  },
  signatureName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 0,
    marginTop: 0,
  },
  signatureRole: {
    fontSize: 10,
    color: '#666',
    marginBottom: 0,
    marginTop: 0,
  },
  details: {
    textAlign: 'center',
    fontSize: 14,
    color: '#222',
    marginBottom: 8,
    marginTop: 0,
  },
  verify: {
    fontSize: 10,
    color: '#2563eb',
    marginTop: 8,
    textAlign: 'center',
    wordBreak: 'break-all',
  },
});

export function CertificationStudentPDF({
  userName,
  course,
  date,
  certificateUrl,
}: CertificationStudentPDFProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          {/* Logo a la izquierda en posición absoluta y texto centrado */}
          <View style={styles.headerRow}>
            <Image src="/artiefy-logo2.png" style={styles.logo} />
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTextCentered}>
                Por medio de la presente se hace constar que
              </Text>
            </View>
          </View>
          <View style={styles.contentWrapper}>
            <Text style={styles.name}>{userName}</Text>
            <Text style={styles.description}>
              ha participado y completado exitosamente el curso
            </Text>
            <Text style={styles.course}>
              {course?.title || 'Curso no encontrado'}
            </Text>
            <Text style={styles.description}>
              desarrollando habilidades y conocimientos en el área, demostrando
              compromiso y excelencia académica durante todo el proceso de
              aprendizaje.
            </Text>
            {/* Grid layout for details and signatures */}
            <View style={styles.grid}>
              {/* Left signature */}
              <View style={styles.gridCol}>
                <Image src="/firma-rector.png" style={styles.signatureImg} />
                <Text style={styles.signatureName}>
                  Luis Antonio Ruíz Cicery
                </Text>
                <Text style={styles.signatureRole}>
                  Rector Politécnico Nacional
                </Text>
                <Text style={styles.signatureRole}>de Artes y Oficios</Text>
                <Text style={styles.signatureRole}>PONAO</Text>
              </View>
              {/* Center details */}
              <View style={styles.gridCol}>
                <Text style={styles.details}>
                  realizado a través de Artiefy, la educación del futuro
                </Text>
                <Text style={styles.details}>Finalizado el {date}</Text>
                <Text style={styles.details}>
                  CC. {course.id.toString().padStart(6, '0')}
                </Text>
                <Text style={styles.verify}>
                  Verificado en: {certificateUrl}
                </Text>
              </View>
              {/* Right signature */}
              <View style={styles.gridCol}>
                <Image src="/firma-director.png" style={styles.signatureImg} />
                <Text style={styles.signatureName}>
                  Juan José Ruíz Artunduaga
                </Text>
                <Text style={styles.signatureRole}>
                  Director de Tecnologías
                </Text>
                <Text style={styles.signatureRole}>del Ciadet</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
