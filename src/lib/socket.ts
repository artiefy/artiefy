// src/lib/socket.ts
// Stub local de socket para desactivar socket.io en el cliente
// Provee una API mínima compatible: on/off/emit/disconnect

type Handler = (...args: unknown[]) => void;

class StubSocket {
  private handlers = new Map<string, Set<Handler>>();
  public connected = false;
  public id: string | undefined = undefined;

  on(event: string, handler: Handler): void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set<Handler>();
      this.handlers.set(event, set);
    }
    set.add(handler);
  }

  off(event: string, handler?: Handler): void {
    if (!this.handlers.has(event)) return;

    if (!handler) {
      // Quita todos los handlers del evento
      this.handlers.delete(event);
      return;
    }

    const set = this.handlers.get(event);
    if (!set) return;

    set.delete(handler);
    if (set.size === 0) this.handlers.delete(event);
  }

  emit(event: string, ...args: unknown[]): void {
    const set = this.handlers.get(event);
    if (!set || set.size === 0) return;

    // Clonar para evitar problemas si un handler llama off() durante la iteración
    for (const handler of Array.from(set)) {
      try {
        handler(...args);
      } catch {
        // Intencionalmente ignorado: este stub no propaga errores
      }
    }
  }

  disconnect(): void {
    this.connected = false;
    this.handlers.clear();
  }
}

const socket = new StubSocket();

export default socket;
