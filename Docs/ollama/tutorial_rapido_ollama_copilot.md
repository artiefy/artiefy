# Tutorial rapido: Ollama + Claude Code style en GitHub Copilot (VS Code)

## Objetivo

Usar un modelo de Ollama dentro de GitHub Copilot Chat en VS Code.

## 1) Instalar Ollama (Windows)

```powershell
winget install -e --id Ollama.Ollama
```

Si `ollama` no se reconoce, usa ruta directa:

```powershell
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" --version
```

## 1.1) Arreglar PATH en PowerShell

Temporal (solo sesión actual):

```powershell
$env:Path += ";$env:LOCALAPPDATA\Programs\Ollama"
ollama --version
```

Permanente (usuario):

```powershell
$ollamaDir = "$env:LOCALAPPDATA\Programs\Ollama"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$ollamaDir*") {
  [Environment]::SetEnvironmentVariable("Path", "$userPath;$ollamaDir", "User")
}
```

Despues cierra y abre una terminal nueva y valida:

```powershell
ollama --version
```

## 1.2) Arreglar PATH en Git Bash

Temporal (solo sesión actual):

```bash
export PATH="$PATH:/c/Users/Usuario/AppData/Local/Programs/Ollama"
ollama --version
```

Permanente (agregar en `~/.bashrc`):

```bash
echo 'export PATH="$PATH:/c/Users/Usuario/AppData/Local/Programs/Ollama"' >> ~/.bashrc
source ~/.bashrc
ollama --version
```

## 2) Iniciar sesion y bajar modelo

```bash
ollama signin
ollama pull qwen3.5:cloud
```

## 3) Conectar Ollama con VS Code

```bash
ollama launch vscode --model qwen3.5:cloud --yes
```

Si sale `vscode is not installed` pero si tienes VS Code instalado:

```powershell
New-Item -ItemType Junction `
  -Path "$env:LOCALAPPDATA\Programs\Microsoft VS Code" `
  -Target "C:\Program Files\Microsoft VS Code"
```

Luego repite:

```bash
ollama launch vscode --model qwen3.5:cloud --yes
```

## 4) Seleccionar modelo en Copilot

1. Abre **Copilot Chat**.
2. Abre el **model picker**.
3. Entra a **Other models** o **Manage models**.
4. Selecciona **qwen3.5:cloud**.

## 5) Verificar que funciona

En el chat debe aparecer el modelo activo (`qwen3.5:cloud`).
Prueba:

```text
Analiza este proyecto y propon 5 mejoras tecnicas.
```

## Nota importante

- Esto te da experiencia tipo "Claude Code" con modelos de Ollama.
- `Claude Sonnet/Opus` reales no van por Ollama; se configuran en Copilot por proveedor Anthropic (BYOK).
