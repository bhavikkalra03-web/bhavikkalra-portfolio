param(
  [int]$Port = 5500
)

$ErrorActionPreference = 'Stop'

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)
$listener.Start()

$root = (Get-Location).Path
Write-Host "Serving $root at $prefix"

function Get-ContentType($path) {
  switch ([IO.Path]::GetExtension($path).ToLower()) {
    '.html' { 'text/html; charset=utf-8' }
    '.css'  { 'text/css; charset=utf-8' }
    '.js'   { 'application/javascript; charset=utf-8' }
    '.svg'  { 'image/svg+xml' }
    '.json' { 'application/json; charset=utf-8' }
    '.png'  { 'image/png' }
    '.jpg'  { 'image/jpeg' }
    '.jpeg' { 'image/jpeg' }
    default { 'application/octet-stream' }
  }
}

while ($true) {
  $context = $listener.GetContext()
  $req = $context.Request
  $res = $context.Response

  $localPath = [Uri]::UnescapeDataString($req.Url.AbsolutePath.TrimStart('/'))
  if ([string]::IsNullOrWhiteSpace($localPath)) { $localPath = 'index.html' }

  $fullPath = Join-Path $root $localPath
  $fullPath = [IO.Path]::GetFullPath($fullPath)
  if (-not $fullPath.StartsWith($root)) {
    $res.StatusCode = 403
    $bytes = [Text.Encoding]::UTF8.GetBytes('Forbidden')
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
    $res.Close()
    continue
  }

  if (-not (Test-Path $fullPath)) {
    $res.StatusCode = 404
    $bytes = [Text.Encoding]::UTF8.GetBytes('Not Found')
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
    $res.Close()
    continue
  }

  try {
    $bytes = [IO.File]::ReadAllBytes($fullPath)
    $res.StatusCode = 200
    $res.Headers.Add('Access-Control-Allow-Origin','*')
    $res.ContentType = Get-ContentType $fullPath
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } catch {
    $res.StatusCode = 500
    $err = [Text.Encoding]::UTF8.GetBytes("Server Error: $($_.Exception.Message)")
    $res.OutputStream.Write($err, 0, $err.Length)
  } finally {
    $res.Close()
  }
}