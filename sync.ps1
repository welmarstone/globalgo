# Sync-Translations.ps1

$htmlFile = "index.html"
$langFiles = @("lang\az.js", "lang\en.js", "lang\ru.js")

# 1. Read HTML and find all data-keys
Write-Host "Reading HTML file..." -ForegroundColor Cyan
if (-not (Test-Path $htmlFile)) {
    Write-Host "Error: $htmlFile not found!" -ForegroundColor Red
    exit
}

$htmlContent = Get-Content $htmlFile -Raw
$pattern = 'data-key="([^"]+)"'
$matches = [regex]::Matches($htmlContent, $pattern)
$keys = $matches | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique

Write-Host "Found $($keys.Count) unique translation keys." -ForegroundColor Green

# 2. Process each language file
foreach ($file in $langFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "Warning: $file not found. Skipping." -ForegroundColor Yellow
        continue
    }

    Write-Host "Processing $file..." -ForegroundColor Cyan
    $content = Get-Content $file -Raw -Encoding UTF8

    # Extract the JSON-like object content between { and }; 
    # This is a bit of a hack for JS files, but sufficient for this specific structure.
    # We will append new keys at the end.
    
    $addedCount = 0
    foreach ($key in $keys) {
        # Check if key exists in the file (simple string check)
        # We look for "key": or key:
        $keyPattern1 = """$key""\s*:"
        $keyPattern2 = "$key\s*:"
        
        if ($content -notmatch $keyPattern1 -and $content -notmatch $keyPattern2) {
            Write-Host "  [+] Key missing: $key. Adding..." -ForegroundColor Yellow
            
            # Find the last closing brace and insert before it
            $marker = "};"
            if ($content -match "\}\s*;?\s*$") {
                # Add the new key value pair
                $newItem = "`n  ""$key"": ""TODO"","
                $content = $content -replace "(\}\s*;?\s*$)", "$newItem`n$1"
                $addedCount++
            }
        }
    }

    if ($addedCount -gt 0) {
        Set-Content -Path $file -Value $content -Encoding UTF8
        Write-Host "  -> Added $addedCount new keys to $file." -ForegroundColor Green
    } else {
        Write-Host "  -> file is up to date." -ForegroundColor Gray
    }
}

Write-Host "Done! You can now close this window." -ForegroundColor Cyan
Read-Host "Press Enter to exit"
