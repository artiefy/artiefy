# Cómo hacer que fnm, node y npx funcionen en cualquier terminal y VS Code (usuario y administrador)

## 1. Instala fnm normalmente y asegúrate de tener node/npx funcionando en tu terminal

## 2. Crea el script de autorun para CMD

Guarda esto como `%USERPROFILE%\bin\fnm_init.cmd`:

```bat
@echo off
if not defined FNM_AUTORUN_GUARD (
    set "FNM_AUTORUN_GUARD=AutorunGuard"
    FOR /f "tokens=*" %%z IN ('fnm env --use-on-cd') DO CALL %%z
)
```

## 3. Configura el autorun para CMD (usuario y administrador)

Abre PowerShell como usuario normal y ejecuta:

```powershell
New-Item -Path 'HKCU:\Software\Microsoft\Command Processor' -Force
Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Command Processor' -Name 'AutoRun' -Value 'call "%USERPROFILE%\bin\fnm_init.cmd"'
```

Luego, abre PowerShell como administrador y ejecuta:

```powershell
New-Item -Path 'HKLM:\SOFTWARE\Microsoft\Command Processor' -Force
Set-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Command Processor' -Name 'AutoRun' -Value 'call "%USERPROFILE%\bin\fnm_init.cmd"'
```

## 4. (Opcional) Agrega fnm al PATH global para cualquier proceso

Esto hace que node/npx estén disponibles incluso para procesos que no son CMD:

```powershell
$fnmPath = "$env:USERPROFILE\.fnm\multishells"
[Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";$fnmPath", [EnvironmentVariableTarget]::User)
[Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";$fnmPath", [EnvironmentVariableTarget]::Machine)
```

## 5. Reinicia tu PC o cierra sesión

Esto asegura que todos los procesos (incluyendo VS Code abierto desde el icono) hereden el nuevo entorno.

## 6. Verifica

Abre VS Code desde el icono o desde terminal y ejecuta en la terminal integrada:

```sh
node -v
npx -v
```

Ambos deben funcionar igual en cualquier modo (usuario o admin).

---

**Notas:**

- Si cambias de versión de Node con fnm, reinicia VS Code para que tome el nuevo entorno.
- Si tienes problemas con la terminal integrada, revisa que VS Code y la terminal tengan los mismos permisos (ambos como usuario o ambos como admin).
