<#
.SYNOPSIS
Packages a randomizer/ patch archive and optionally sends it to the default SETI QQ group.

.DESCRIPTION
Creates a timestamped zip from the repository's randomizer/ directory. assets/
is intentionally excluded so patch archives stay small enough for QQ Bot file
upload. Use -SendToQq only when the patch should be uploaded to the QQ group.

The script source is ASCII-only so it runs correctly in Windows PowerShell
without requiring UTF-8 BOM handling. Chinese default text is built from
Unicode code points at runtime.

.EXAMPLE
powershell -ExecutionPolicy Bypass -File tools\package_randomizer_patch.ps1

.EXAMPLE
powershell -ExecutionPolicy Bypass -File tools\package_randomizer_patch.ps1 -SendToQq -Message "..."
#>

[CmdletBinding()]
param(
    [string]$Message,
    [string]$QqBotDir,
    [string]$OutputDir,
    [int]$CommitCount = 5,
    [switch]$SendToQq
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not $OutputDir) {
    $OutputDir = $RepoRoot
}
if (-not (Test-Path -LiteralPath $OutputDir -PathType Container)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}
$OutputDir = (Resolve-Path $OutputDir).Path

$RandomizerDir = Join-Path $RepoRoot "randomizer"
if (-not (Test-Path -LiteralPath $RandomizerDir -PathType Container)) {
    throw "randomizer directory not found: $RandomizerDir"
}

function ConvertFrom-CodePoints {
    param([Parameter(Mandatory = $true)][int[]]$CodePoints)
    return -join ($CodePoints | ForEach-Object { [char]$_ })
}

function Get-CnText {
    param([Parameter(Mandatory = $true)][string]$Key)

    switch ($Key) {
        "StandalonePrefix" {
            return "seti" + (ConvertFrom-CodePoints @(0x5355, 0x673A, 0x7248))
        }
        "UpdatePrefix" {
            return ConvertFrom-CodePoints @(0x672C, 0x6B21, 0x66F4, 0x65B0, 0xFF1A)
        }
        "UpdateSuffix" {
            return (ConvertFrom-CodePoints @(0x66FF, 0x6362, 0x539F, 0x6709)) +
                " randomizer " +
                (ConvertFrom-CodePoints @(0x5373, 0x53EF, 0x66F4, 0x65B0, 0x3002))
        }
        "FallbackSummary" {
            return ConvertFrom-CodePoints @(
                0x66F4, 0x65B0, 0x0020, 0x0072, 0x0061, 0x006E, 0x0064,
                0x006F, 0x006D, 0x0069, 0x007A, 0x0065, 0x0072, 0x0020,
                0x8FD0, 0x884C, 0x6587, 0x4EF6
            )
        }
        "QqBotDirName" {
            return ConvertFrom-CodePoints @(0x0071, 0x0071, 0x673A, 0x5668, 0x4EBA)
        }
        default {
            throw "unknown text key: $Key"
        }
    }
}

if (-not $QqBotDir) {
    $QqBotDir = Join-Path "D:\code" (Get-CnText "QqBotDirName")
}

function New-RandomizerPatchArchive {
    param(
        [Parameter(Mandatory = $true)][string]$SourceDir,
        [Parameter(Mandatory = $true)][string]$TargetDir
    )

    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $archiveName = "$(Get-CnText "StandalonePrefix")_randomizer_$timestamp.zip"
    $archivePath = Join-Path $TargetDir $archiveName

    if (Test-Path -LiteralPath $archivePath) {
        Remove-Item -LiteralPath $archivePath
    }

    Compress-Archive `
        -LiteralPath $SourceDir `
        -DestinationPath $archivePath `
        -CompressionLevel Optimal

    return (Get-Item -LiteralPath $archivePath)
}

function Test-RandomizerPatchArchive {
    param([Parameter(Mandatory = $true)][string]$ArchivePath)

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [System.IO.Compression.ZipFile]::OpenRead($ArchivePath)
    try {
        $entries = @($archive.Entries | Where-Object { -not [string]::IsNullOrWhiteSpace($_.FullName) })
        if ($entries.Count -eq 0) {
            throw "archive is empty: $ArchivePath"
        }

        $unexpected = @(
            $entries |
                ForEach-Object {
                    $normalizedName = $_.FullName -replace '\\', '/'
                    if ($normalizedName -notmatch '^randomizer(/|$)' -or $normalizedName -match '^assets(/|$)') {
                        $normalizedName
                    }
                } |
                Select-Object -First 5
        )
        if ($unexpected.Count -gt 0) {
            throw "archive contains unexpected entries: $($unexpected -join ', ')"
        }

        return $entries.Count
    } finally {
        $archive.Dispose()
    }
}

function Get-DefaultUpdateMessage {
    param(
        [Parameter(Mandatory = $true)][string]$Root,
        [int]$Count = 5
    )

    $prefix = Get-CnText "UpdatePrefix"
    $suffix = Get-CnText "UpdateSuffix"
    $limit = 100
    $available = $limit - $prefix.Length - $suffix.Length
    if ($available -lt 10) {
        throw "message template leaves too little room for update summary"
    }

    $subjects = @(
        git -C $Root log -n $Count --pretty=format:%s |
            Where-Object { $_ -and ($_ -notmatch '^Merge ') }
    )
    if ($subjects.Count -eq 0) {
        $subjects = @(Get-CnText "FallbackSummary")
    }

    $parts = New-Object System.Collections.Generic.List[string]
    $currentLength = 0
    foreach ($subject in $subjects) {
        $clean = ($subject -replace '\s+', ' ').Trim()
        if (-not $clean) {
            continue
        }

        $separatorLength = if ($parts.Count -eq 0) { 0 } else { 1 }
        if (($currentLength + $separatorLength + $clean.Length) -le $available) {
            $parts.Add($clean)
            $currentLength += $separatorLength + $clean.Length
            continue
        }

        if ($parts.Count -eq 0) {
            $trimLength = [Math]::Max(1, $available - 3)
            $parts.Add($clean.Substring(0, [Math]::Min($trimLength, $clean.Length)) + "...")
        }
        break
    }

    $separator = ConvertFrom-CodePoints @(0xFF1B)
    $period = ConvertFrom-CodePoints @(0x3002)
    return "$prefix$($parts -join $separator)$period$suffix"
}

function Invoke-QqBotSend {
    param(
        [Parameter(Mandatory = $true)][string]$BotDir,
        [Parameter(Mandatory = $true)][string]$ArchivePath,
        [Parameter(Mandatory = $true)][string]$ArchiveName,
        [Parameter(Mandatory = $true)][string]$Text
    )

    if (-not (Test-Path -LiteralPath (Join-Path $BotDir "package.json") -PathType Leaf)) {
        throw "QQ bot directory is invalid: $BotDir"
    }

    $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if (-not $npm) {
        $npm = Get-Command npm -ErrorAction Stop
    }

    Push-Location $BotDir
    try {
        & $npm.Source run send -- group --file $ArchivePath --file-type file --file-name $ArchiveName
        if ($LASTEXITCODE -ne 0) {
            throw "QQ file send failed with exit code $LASTEXITCODE"
        }

        & $npm.Source run send -- group --text $Text
        if ($LASTEXITCODE -ne 0) {
            throw "QQ text send failed with exit code $LASTEXITCODE"
        }
    } finally {
        Pop-Location
    }
}

$archiveItem = New-RandomizerPatchArchive -SourceDir $RandomizerDir -TargetDir $OutputDir
$entryCount = Test-RandomizerPatchArchive -ArchivePath $archiveItem.FullName

if ($SendToQq -and -not $Message) {
    $Message = Get-DefaultUpdateMessage -Root $RepoRoot -Count $CommitCount
}
if ($Message -and $Message.Length -gt 100) {
    throw "update message must be 100 characters or fewer; current length: $($Message.Length)"
}

Write-Host "Patch archive: $($archiveItem.FullName)"
Write-Host "Size: $($archiveItem.Length) bytes"
Write-Host "Entries: $entryCount"

if ($Message) {
    Write-Host "Message($($Message.Length)): $Message"
}

if (-not $SendToQq) {
    Write-Host "SendToQq is not set; QQ upload and message send were not executed."
    return
}

Invoke-QqBotSend `
    -BotDir $QqBotDir `
    -ArchivePath $archiveItem.FullName `
    -ArchiveName $archiveItem.Name `
    -Text $Message

Write-Host "QQ group patch file and update message sent."
