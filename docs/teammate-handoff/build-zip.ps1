<#
    build-zip.ps1 — Build the CBL teammate handoff zip.

    Stages the plain-language docs + project context + screenshots + a curated source
    snapshot + the teammate MATLAB reference, then compresses it to:
        <repo-root>\CBL-teammate-handoff.zip

    Re-run this any time the docs change to rebuild the zip. Safe to run repeatedly.
    Usage:  pwsh docs/teammate-handoff/build-zip.ps1
#>

$ErrorActionPreference = 'Stop'

$handoffDir = $PSScriptRoot
$repoRoot   = (Resolve-Path (Join-Path $handoffDir '..\..')).Path
$pkgName    = 'CBL-teammate-handoff'
$outZip     = Join-Path $repoRoot "$pkgName.zip"

# Fresh staging folder under TEMP
$stageRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("cbl-handoff-" + [System.Guid]::NewGuid().ToString('N'))
$stage     = Join-Path $stageRoot $pkgName
$null = New-Item -ItemType Directory -Path $stage -Force
$null = New-Item -ItemType Directory -Path (Join-Path $stage 'context') -Force
$null = New-Item -ItemType Directory -Path (Join-Path $stage 'screenshots') -Force
$null = New-Item -ItemType Directory -Path (Join-Path $stage 'code') -Force
$null = New-Item -ItemType Directory -Path (Join-Path $stage 'matlab-reference') -Force

function Copy-Checked($from, $to) {
    if (-not (Test-Path $from)) { throw "Missing expected file: $from" }
    Copy-Item -LiteralPath $from -Destination $to -Force
}

# 1. The 7 numbered plain-language docs (00-..06-). NB: -Filter has no char classes,
#    so match the NN- prefix with -match instead.
$docs = Get-ChildItem -Path $handoffDir -Filter '*.md' | Where-Object { $_.Name -match '^[0-9]{2}-' }
if ($docs.Count -lt 7) { throw "Expected 7 numbered docs, found $($docs.Count)" }
$docs | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $stage -Force }

# 2. Project context (extra depth for the agent)
Copy-Checked (Join-Path $repoRoot 'README.md')  (Join-Path $stage 'context\README.md')
Copy-Checked (Join-Path $repoRoot 'CLAUDE.md')   (Join-Path $stage 'context\CLAUDE.md')

# 3. Screenshots of the current visuals
Get-ChildItem -Path (Join-Path $repoRoot 'docs\td-screenshots') -Filter '*.png' | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $stage 'screenshots') -Force
}

# 4. Curated source snapshot (preserve src/ sub-structure), plus the code map README
$srcFiles = @(
    'src\App.tsx',
    'src\components\CameraStage.tsx',
    'src\audio\useMicInput.ts',
    'src\audio\audioAnalysis.ts',
    'src\audio\useHeartbeat.ts',
    'src\camera\usePoseTracking.ts',
    'src\camera\useCamera.ts',
    'src\net\usePoseStream.ts',
    'src\types.ts'
)
foreach ($rel in $srcFiles) {
    $from = Join-Path $repoRoot $rel
    $dest = Join-Path $stage ('code\' + ($rel -replace '^src\\', ''))
    $null = New-Item -ItemType Directory -Path (Split-Path $dest) -Force
    Copy-Checked $from $dest
}
Copy-Checked (Join-Path $repoRoot 'package.json')            (Join-Path $stage 'code\package.json')
Copy-Checked (Join-Path $handoffDir 'code-README.md')        (Join-Path $stage 'code\README.md')

# 5. Teammate MATLAB reference (exclude .asv autosave files)
$matlabSrc = Join-Path $repoRoot 'EngineeringArt CBL\EngineeringArt CBL'
Get-ChildItem -Path $matlabSrc -File | Where-Object { $_.Extension -ne '.asv' } | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $stage 'matlab-reference') -Force
}

# 6. Compress (overwrite any previous build)
if (Test-Path $outZip) { Remove-Item -LiteralPath $outZip -Force }
Compress-Archive -Path $stage -DestinationPath $outZip -CompressionLevel Optimal

# 7. Clean up staging
Remove-Item -LiteralPath $stageRoot -Recurse -Force

Write-Host "Built: $outZip"
Write-Host ("Size : {0:N0} KB" -f ((Get-Item $outZip).Length / 1KB))
