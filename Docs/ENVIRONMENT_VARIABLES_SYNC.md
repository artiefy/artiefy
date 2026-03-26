# Tutorial Express: Envs MCP (Windows + Git Bash)

## Método más eficaz (rápido)

Usa **Windows User Environment** como fuente única.  
PowerShell y Git Bash solo “leen” desde ahí al iniciar.

## Ejemplo real con tus envs

Variables que ya usas:

- `N8N_API_KEY`
- `N8N_MCP_TOKEN`
- `CONTEXT7_API_KEY`
- `NEON_API_KEY`
- `GITHUB_COPILOT_MCP_TOKEN`
- `SNYK_TOKEN`
- `AWS_PROFILE` (`default`)
- `AWS_REGION` (`us-east-1`)
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## 1) Guardar/actualizar en Windows (una sola vez por variable)

```powershell
[Environment]::SetEnvironmentVariable("AWS_PROFILE", "default", "User")
[Environment]::SetEnvironmentVariable("AWS_REGION", "us-east-1", "User")
```

Para tokens/API keys, mismo patrón:

```powershell
[Environment]::SetEnvironmentVariable("N8N_MCP_TOKEN", "tu_token", "User")
```

## 2) PowerShell: cargar al abrir terminal

En tu perfil (`$PROFILE`) deja este bloque:

```powershell
$varsToLoad = @(
  "N8N_API_KEY","N8N_MCP_TOKEN","CONTEXT7_API_KEY","NEON_API_KEY",
  "GITHUB_COPILOT_MCP_TOKEN","SNYK_TOKEN","AWS_PROFILE","AWS_REGION",
  "AWS_ACCESS_KEY_ID","AWS_SECRET_ACCESS_KEY"
)

foreach ($name in $varsToLoad) {
  $val = [Environment]::GetEnvironmentVariable($name, "User")
  if (-not [string]::IsNullOrEmpty($val)) {
    Set-Item -Path ("Env:" + $name) -Value $val -ErrorAction SilentlyContinue
  }
}
```

Recargar:

```powershell
. $PROFILE
```

## 3) Git Bash: cargar automático al abrir

En `~/.bashrc`:

```bash
load_win_env() {
  local name="$1"
  local value
  value="$(powershell.exe -NoProfile -Command "[Environment]::GetEnvironmentVariable('$name','User')" | tr -d '\r')"
  [ -n "$value" ] && export "$name=$value"
}

for v in N8N_API_KEY N8N_MCP_TOKEN CONTEXT7_API_KEY NEON_API_KEY GITHUB_COPILOT_MCP_TOKEN SNYK_TOKEN AWS_PROFILE AWS_REGION AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY; do
  load_win_env "$v"
done
```

Recargar:

```bash
source ~/.bashrc
```

## 4) Verificación rápida (30 segundos)

```powershell
Write-Host $env:AWS_PROFILE   # default
Write-Host $env:AWS_REGION    # us-east-1
```

```bash
echo "$AWS_PROFILE"  # default
echo "$AWS_REGION"   # us-east-1
```

## Linux puro (sin Windows)

Si estás en Linux sin Windows, guarda directo en `~/.bashrc`:

```bash
echo 'export AWS_PROFILE="default"' >> ~/.bashrc
echo 'export AWS_REGION="us-east-1"' >> ~/.bashrc
source ~/.bashrc
```
