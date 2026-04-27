export default function Loading() {
  return (
    <main className="loading-page" aria-live="polite" aria-busy="true">
      <div className="loading-orb" aria-hidden="true" />

      <section className="loading-stage" aria-label="Cargando">
        <div className="loading-rocket" aria-hidden="true">
          <span className="loading-rocket__body" />
          <span className="loading-rocket__shine" />
          <span className="loading-rocket__flame" />
          <span className="loading-rocket__core" />
        </div>

        <div
          className="loading-particles loading-particles--top"
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <p className="loading-title">Cargando...</p>

        <div
          className="loading-particles loading-particles--bottom"
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
        </div>
      </section>
    </main>
  );
}
