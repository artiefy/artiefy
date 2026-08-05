// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function FormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        className="
        min-h-screen bg-gradient-to-br from-[#01060f] to-[#0e1a2b] text-white
      "
      >
        {children}
      </body>
    </html>
  );
}
