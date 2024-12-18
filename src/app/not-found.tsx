import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h1 style={styles.title}>404 - Página no encontrada</h1>
      <p style={styles.message}>
        Lo sentimos, pero la página que buscas no está disponible. Puede que el
        enlace esté roto o que la página haya sido movida.
      </p>
      <Link href="/" style={styles.link}>
        Volver al inicio
      </Link>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    height: "100vh",
    backgroundColor: "#f9f9f9",
    color: "#333",
    padding: "20px",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "bold",
    marginBottom: "1rem",
    color: "#ff6347", // Color llamativo como naranja
  },
  message: {
    fontSize: "1.2rem",
    marginBottom: "2rem",
  },
  link: {
    fontSize: "1.1rem",
    color: "#0070f3", // Azul Next.js
    textDecoration: "underline",
  },
};
