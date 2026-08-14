# 本地启动（Windows，无需 Node.js）
$port = 8080
$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Start()
Write-Host ""
Write-Host "  飞 FLY 本地服务器已启动" -ForegroundColor Green
Write-Host "  请在浏览器打开: http://127.0.0.1:$port/" -ForegroundColor Yellow
Write-Host "  按 Ctrl+C 停止" -ForegroundColor Gray
Write-Host ""

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.md'   = 'text/plain; charset=utf-8'
  '.docx' = 'application/octet-stream'
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = $ctx.Request.Url.LocalPath
  if ($path -eq '/') { $path = '/index.html' }
  $rel = $path.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
  $file = Join-Path $root $rel

  if (Test-Path $file -PathType Leaf) {
    $ext = [IO.Path]::GetExtension($file).ToLower()
    $type = $mime[$ext]
    if (-not $type) { $type = 'application/octet-stream' }
    $bytes = [IO.File]::ReadAllBytes($file)
    $ctx.Response.ContentType = $type
    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $ctx.Response.StatusCode = 404
    $msg = [Text.Encoding]::UTF8.GetBytes('404 Not Found')
    $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
  }
  $ctx.Response.Close()
}
