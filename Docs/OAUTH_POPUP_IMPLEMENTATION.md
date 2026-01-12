# Implementación de OAuth con Popup en MiniLoginModal

## Resumen

Se implementó la autenticación OAuth (Google, Facebook, GitHub) usando ventanas popup en lugar de redirecciones a nuevas pestañas, mejorando significativamente la experiencia de usuario.

## Servidor MCP Utilizado

- **Clerk MCP Server**: `https://mcp.clerk.dev/mcp`
- Configurado en `.vscode/mcp.json`

## Cambios Implementados

### 1. Integración del Servidor MCP de Clerk

```json
// .vscode/mcp.json
{
  "Clerk": {
    "url": "https://mcp.clerk.dev/mcp",
    "type": "http"
  }
}
```

### 2. Método de Autenticación

**ANTES** (redirect - nueva pestaña):

```typescript
await signIn.authenticateWithRedirect({
  strategy,
  redirectUrl: '/sign-up/sso-callback',
  redirectUrlComplete: redirectUrl,
});
```

**AHORA** (popup - ventana emergente):

```typescript
const width = 500;
const height = 650;
const left = window.screen.width / 2 - width / 2;
const top = window.screen.height / 2 - height / 2;

const popup = window.open(
  '',
  '_blank',
  `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
);

await signIn.authenticateWithPopup({
  popup,
  strategy,
  redirectUrl: '/sign-up/sso-callback',
  redirectUrlComplete: redirectUrl,
});
```

### 3. Detección Automática de Autenticación Exitosa

```typescript
const { isSignedIn } = useAuth();

useEffect(() => {
  if (isSignedIn && loadingProvider) {
    setLoadingProvider(null);
    onLoginSuccess();
  }
}, [isSignedIn, loadingProvider, onLoginSuccess]);
```

### 4. Overlay de Carga Durante OAuth

Se agregó un overlay visual que se muestra mientras el usuario completa la autenticación en el popup:

```tsx
{
  loadingProvider && (
    <div className="absolute inset-0 z-[1150] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-background/95 p-8 shadow-2xl">
        <Icons.spinner className="h-12 w-12 text-primary" />
        <div className="text-center">
          <p className="text-lg font-semibold">Autenticando...</p>
          <p className="text-sm text-muted-foreground">
            Completa el inicio de sesión en la ventana que se abrió
          </p>
        </div>
      </div>
    </div>
  );
}
```

### 5. Manejo de Popups Bloqueados

```typescript
if (!popup || popup.closed || typeof popup.closed === 'undefined') {
  setLoadingProvider(null);
  setErrors([
    {
      code: 'popup_blocked',
      message: 'Popup bloqueado',
      longMessage:
        'Por favor, permite las ventanas emergentes en tu navegador para continuar con el inicio de sesión.',
      meta: {},
    },
  ]);
  return;
}
```

## Limitación Técnica Importante

### ¿Por qué no se puede usar un modal dentro de la misma página?

Por razones de **seguridad**, Google, Facebook y GitHub **NO permiten** que sus páginas de inicio de sesión se carguen dentro de iframes o modals embebidos debido a:

1. **X-Frame-Options Header**: Previene ataques de clickjacking
2. **Content Security Policy (CSP)**: Restringe dónde se pueden cargar los recursos
3. **OAuth Security Best Practices**: Requieren contextos de navegación separados

### Opciones disponibles según Clerk:

1. ✅ **Popup** (implementado) - Ventana emergente centrada
2. ❌ **Redirect** - Nueva pestaña completa (menos UX)
3. ❌ **Iframe/Modal embebido** - Bloqueado por seguridad

## Experiencia de Usuario

### Flujo Actual:

1. Usuario hace clic en botón OAuth (Google/Facebook/GitHub)
2. Se muestra overlay de carga sobre el modal principal
3. Se abre ventana popup centrada (500x650px)
4. Usuario completa autenticación en el popup
5. El sistema detecta automáticamente cuando la autenticación se completa
6. El modal principal se cierra y el usuario queda autenticado

### Ventajas sobre redirect:

- ✅ No pierde el contexto de la página actual
- ✅ Modal principal permanece visible (con overlay)
- ✅ Ventana popup es más pequeña y manejable
- ✅ Detección automática de autenticación completada
- ✅ Mejor experiencia visual con indicadores de carga

## Documentación Consultada

### Clerk MCP SDK Snippets:

- **Bundle**: `custom-flows` - Build custom sign-in/sign-up flows
- **Hook**: `useSignIn` - Build custom sign-in flows with full control
- **Método**: `authenticateWithPopup()` - Opens a popup window for SSO authentication

### Clerk Official Docs:

```
Source: https://github.com/clerk/clerk-docs/blob/main/docs/reference/javascript/sign-in.mdx

authenticateWithPopup() - SSO Sign-in with Popup Window
Opens a popup window to authenticate users via Single Sign On (SSO)
connections such as OAuth or SAML. Provides a non-disruptive user experience.
```

## Archivos Modificados

1. **MiniLoginModal.tsx**:
   - Agregado `useAuth` y `useEffect` para detectar autenticación
   - Cambiado `authenticateWithRedirect` a `authenticateWithPopup`
   - Agregado overlay de carga durante OAuth
   - Mejorado manejo de errores (popup bloqueado)
   - Popup centrado en pantalla con dimensiones optimizadas

2. **.vscode/mcp.json**:
   - Agregado servidor MCP de Clerk

## Testing

Para probar la funcionalidad:

1. Iniciar el servidor de desarrollo: `npm run dev`
2. Navegar a una página que muestre el MiniLoginModal
3. Hacer clic en cualquier botón de OAuth
4. Verificar que se abre un popup centrado
5. Completar la autenticación en el popup
6. Verificar que el modal principal se cierra automáticamente

### Casos de prueba:

- ✅ Autenticación exitosa con Google
- ✅ Autenticación exitosa con Facebook
- ✅ Autenticación exitosa con GitHub
- ✅ Popup bloqueado por navegador (muestra error apropiado)
- ✅ Usuario cancela autenticación (no afecta modal principal)
- ✅ Overlay de carga se muestra correctamente

## Referencias

- [Clerk MCP Server](https://mcp.clerk.dev)
- [Clerk Documentation - authenticateWithPopup](https://github.com/clerk/clerk-docs/blob/main/docs/reference/javascript/sign-in.mdx)
- [OAuth Best Practices](https://oauth.net/2/)
- [X-Frame-Options Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options)
