export default function FormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gradient-to-br from-[#01060f] to-[#0e1a2b] text-white">
        {children}
      </body>
    </html>
  );
}
