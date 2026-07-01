<#
.SYNOPSIS
Compatibility wrapper for publishing a randomizer/ patch archive to QQ.

.DESCRIPTION
This legacy entrypoint preserves the old default behavior: it packages only
randomizer/ and sends that patch archive plus a short update message to the QQ
group. It delegates to tools\package_randomizer_patch.ps1 so QQ publishing
cannot accidentally include assets/.

.EXAMPLE
powershell -ExecutionPolicy Bypass -File tools\publish_randomizer_to_qq.ps1

.EXAMPLE
powershell -ExecutionPolicy Bypass -File tools\publish_randomizer_to_qq.ps1 -SkipSend
#>

[CmdletBinding()]
param(
    [string]$Message,
    [string]$QqBotDir,
    [string]$OutputDir,
    [int]$CommitCount = 5,
    [switch]$SkipSend
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$PatchScript = Join-Path $PSScriptRoot "package_randomizer_patch.ps1"
if (-not (Test-Path -LiteralPath $PatchScript -PathType Leaf)) {
    throw "patch package script not found: $PatchScript"
}

$scriptArgs = @{
    CommitCount = $CommitCount
}
if ($PSBoundParameters.ContainsKey("Message")) {
    $scriptArgs.Message = $Message
}
if ($PSBoundParameters.ContainsKey("QqBotDir")) {
    $scriptArgs.QqBotDir = $QqBotDir
}
if ($PSBoundParameters.ContainsKey("OutputDir")) {
    $scriptArgs.OutputDir = $OutputDir
}
if (-not $SkipSend) {
    $scriptArgs.SendToQq = $true
}

& $PatchScript @scriptArgs
