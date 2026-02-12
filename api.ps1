param(
  [int]$Port = 5501
)

$ErrorActionPreference = 'Stop'

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "API listening at $prefix"

function WriteJson($res, $obj, $code=200) {
  $json = $obj | ConvertTo-Json -Depth 6
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $res.StatusCode = $code
  $res.ContentType = 'application/json; charset=utf-8'
  $res.ContentLength64 = $bytes.Length
  $res.Headers.Add('Access-Control-Allow-Origin','*')
  $res.OutputStream.Write($bytes, 0, $bytes.Length)
  $res.Close()
}

function ParseQuery($url) {
  $uri = [Uri]$url
  $q = $uri.Query.TrimStart('?').Split('&') | Where-Object { $_ -ne '' }
  $map = @{}
  foreach ($pair in $q) {
    $kv = $pair.Split('=')
    if ($kv.Length -ge 1) {
      $key = [Uri]::UnescapeDataString($kv[0])
      $val = if ($kv.Length -ge 2) { [Uri]::UnescapeDataString($kv[1]) } else { '' }
      $map[$key] = $val
    }
  }
  return $map
}

function Fetch-Reddit($brand) {
  try {
    $url = "https://www.reddit.com/search.json?q=$([Uri]::EscapeDataString($brand))&sort=new&limit=10"
    $data = Invoke-RestMethod -Method GET -Uri $url -Headers @{ 'User-Agent' = 'BrandMonitor/1.0' }
    $items = @()
    foreach ($c in $data.data.children) {
      $p = $c.data
      $items += [pscustomobject]@{
        platform = 'Reddit'
        title = $p.title
        snippet = if ($p.selftext) { $p.selftext } else { '' }
        url = "https://www.reddit.com$($p.permalink)"
        published_at = [DateTimeOffset]::FromUnixTimeSeconds($p.created_utc).ToString('u')
      }
    }
    return $items
  } catch { return @() }
}

function Fetch-HackerNews($brand) {
  try {
    $url = "https://hn.algolia.com/api/v1/search?query=$([Uri]::EscapeDataString($brand))&tags=story&hitsPerPage=10"
    $data = Invoke-RestMethod -Method GET -Uri $url
    $items = @()
    foreach ($hit in $data.hits) {
      $items += [pscustomobject]@{
        platform = 'Hacker News'
        title = $hit.title
        snippet = if ($hit._highlightResult -and $hit._highlightResult.title -and $hit._highlightResult.title.value) { $hit._highlightResult.title.value } else { '' }
        url = if ($hit.url) { $hit.url } else { "https://news.ycombinator.com/item?id=$($hit.objectID)" }
        published_at = (Get-Date -Date 1970-01-01).AddSeconds([int]$hit.created_at_i).ToString('u')
      }
    }
    return $items
  } catch { return @() }
}

function Fetch-GoogleNews($brand) {
  try {
    $url = "https://news.google.com/rss/search?q=$([Uri]::EscapeDataString($brand))&hl=en-US&gl=US&ceid=US:en"
    $xmlText = Invoke-RestMethod -Method GET -Uri $url
    $xml = [xml]$xmlText
    $items = @()
    foreach ($item in $xml.rss.channel.item) {
      $items += [pscustomobject]@{
        platform = 'Google News'
        title = $item.title
        snippet = $item.description
        url = $item.link
        published_at = $item.pubDate
      }
    }
    return $items | Select-Object -First 10
  } catch { return @() }
}

while ($true) {
  $context = $listener.GetContext()
  $req = $context.Request
  $res = $context.Response

  if ($req.HttpMethod -eq 'OPTIONS') {
    $res.StatusCode = 204
    $res.Headers.Add('Access-Control-Allow-Origin','*')
    $res.Headers.Add('Access-Control-Allow-Methods','GET, OPTIONS')
    $res.Headers.Add('Access-Control-Allow-Headers','Content-Type')
    $res.Close()
    continue
  }

  $path = $req.Url.AbsolutePath
  if ($path -eq '/api/search') {
    $q = ParseQuery $req.Url.AbsoluteUri
    $brand = $q['brand']
    if (-not $brand) { WriteJson $res @{ error = 'brand is required' } 400; continue }

    $reddit = Fetch-Reddit $brand
    $hn = Fetch-HackerNews $brand
    $news = Fetch-GoogleNews $brand

    $items = @($reddit + $hn + $news)
    WriteJson $res @{ brand = $brand; items = $items }
    continue
  }

  WriteJson $res @{ error = 'Not Found' } 404
}