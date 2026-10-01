param(
  [switch] $ReleaseArtifactSmoke
)

$ErrorActionPreference = "Stop"

$workspace = [System.IO.Path]::GetFullPath($env:GITHUB_WORKSPACE)
$accountName = "gef-v11-" + [Guid]::NewGuid().ToString("N").Substring(0, 10)
$identity = "$env:COMPUTERNAME\$accountName"
$profileRoot = Join-Path $env:RUNNER_TEMP ("gef-v11-profile-" + $accountName)
$tempRoot = Join-Path $env:RUNNER_TEMP ("gef-v11-temp-" + $accountName)
$appData = Join-Path $profileRoot "AppData\Roaming"
$localAppData = Join-Path $profileRoot "AppData\Local"
$validationLog = Join-Path $workspace "validation.log"
$records = [System.Collections.Generic.List[string]]::new()
$userCreated = $false
$failure = $null

function Add-Record([string]$Text) {
  $script:records.Add($Text)
}

function Invoke-UserProcess([string]$Name, [string]$FilePath, [string]$Arguments) {
  $outPath = Join-Path $env:RUNNER_TEMP ("gef-v11-" + $accountName + "-" + $Name + ".stdout")
  $errPath = Join-Path $env:RUNNER_TEMP ("gef-v11-" + $accountName + "-" + $Name + ".stderr")
  $process = Start-Process -FilePath $FilePath -ArgumentList $Arguments -Credential $credential -LoadUserProfile -UseNewEnvironment -Environment $childEnvironment -WorkingDirectory $workspace -RedirectStandardOutput $outPath -RedirectStandardError $errPath -Wait -PassThru
  $stdout = if (Test-Path $outPath) { Get-Content -Raw $outPath } else { "" }
  $stderr = if (Test-Path $errPath) { Get-Content -Raw $errPath } else { "" }
  Add-Record ("=== " + $Name + " (exit " + $process.ExitCode + ") ===")
  if ($stdout) { Add-Record $stdout }
  if ($stderr) { Add-Record $stderr }
  return [PSCustomObject]@{ ExitCode = $process.ExitCode; Output = ($stdout + [Environment]::NewLine + $stderr) }
}

try {
  if (-not (Test-Path $workspace)) { throw "GITHUB_WORKSPACE is missing." }
  if (-not (Get-Command New-LocalUser -ErrorAction SilentlyContinue)) { throw "New-LocalUser is unavailable on this runner." }

  if ($ReleaseArtifactSmoke) {
    if (-not $env:GEF_RELEASE_RECEIPT_DIR) { throw "GEF_RELEASE_RECEIPT_DIR is required for the exact-artifact smoke." }
    if ($env:GEF_EXPECTED_SOURCE_COMMIT -notmatch '^[0-9a-f]{40}$') { throw "GEF_EXPECTED_SOURCE_COMMIT must be an exact commit SHA." }
    if ($env:GEF_EXPECTED_EVENT -notin @("pull_request", "push")) { throw "GEF_EXPECTED_EVENT is unsupported for the exact-artifact smoke." }
    if ($env:GEF_EXPECTED_PRODUCT_VERSION -notin @("1.1.0", "1.1.1", "1.1.2")) { throw "GEF_EXPECTED_PRODUCT_VERSION is unsupported for the exact-artifact smoke." }
    if ($env:GEF_EXPECTED_REF -notmatch '^refs/(pull/[0-9]+/merge|heads/release/1\.1|tags/v1\.1\.[0-2])$') { throw "GEF_EXPECTED_REF is not an admitted candidate ref." }

    $sourceArtifactDirectory = [System.IO.Path]::GetFullPath($env:GEF_RELEASE_RECEIPT_DIR)
    $workOrder = switch ($env:GEF_EXPECTED_PRODUCT_VERSION) { "1.1.0" { "010" } "1.1.1" { "011" } default { "012" } }
    $artifactNames = @("GBS-V11-WO-$workOrder-RELEASE-MANIFEST.json", "gef-bootstrap-cli-$($env:GEF_EXPECTED_PRODUCT_VERSION).tgz")
    foreach ($artifactName in $artifactNames) {
      if (-not (Test-Path -LiteralPath (Join-Path $sourceArtifactDirectory $artifactName) -PathType Leaf)) {
        throw "The exact-artifact receipt directory is missing $artifactName."
      }
    }
  }

  $nodePath = (Get-Command node.exe -ErrorAction Stop).Source
  $npmCommand = (Get-Command npm.cmd -ErrorAction Stop).Source
  $npmCli = Join-Path (Split-Path $npmCommand) "node_modules\npm\bin\npm-cli.js"
  $gitPath = (Get-Command git.exe -ErrorAction Stop).Source
  if (-not (Test-Path $npmCli)) { throw "The Node.js installation does not expose npm-cli.js at the expected path." }

  $passwordText = [Guid]::NewGuid().ToString("N") + "aA9!"
  $securePassword = ConvertTo-SecureString $passwordText -AsPlainText -Force
  New-LocalUser -Name $accountName -Password $securePassword -Description "Temporary unprivileged V1.1 validation identity" -PasswordNeverExpires | Out-Null
  $userCreated = $true
  Add-LocalGroupMember -Group "Users" -Member $accountName
  $credential = [PSCredential]::new($identity, $securePassword)

  New-Item -ItemType Directory -Path $profileRoot, $tempRoot, $appData, $localAppData -Force | Out-Null
  $grant = '{0}:(OI)(CI)M' -f $identity
  & icacls.exe $workspace /grant $grant /T /C /Q | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Could not grant the temporary user workspace Modify access." }
  & icacls.exe $profileRoot /grant $grant /T /C /Q | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Could not grant the temporary user profile access." }
  & icacls.exe $tempRoot /grant $grant /T /C /Q | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Could not grant the temporary user temp access." }

  $adminMember = Get-LocalGroupMember -Group "Administrators" | Where-Object { $_.Name -ieq $identity }
  if ($adminMember) { throw "The temporary validation identity unexpectedly belongs to Administrators." }

  $nodeDirectory = Split-Path $nodePath
  $npmDirectory = Split-Path $npmCommand
  $gitDirectory = Split-Path $gitPath
  $childPath = @($nodeDirectory, $npmDirectory, $gitDirectory, "$env:SystemRoot\System32", $env:SystemRoot) -join ";"
  $childEnvironment = @{
    SystemRoot = $env:SystemRoot
    windir = $env:windir
    SystemDrive = $env:SystemDrive
    ComSpec = $env:ComSpec
    PATHEXT = $env:PATHEXT
    Path = $childPath
    USERPROFILE = $profileRoot
    HOME = $profileRoot
    APPDATA = $appData
    LOCALAPPDATA = $localAppData
    TEMP = $tempRoot
    TMP = $tempRoot
    ProgramData = $env:ProgramData
    ProgramFiles = $env:ProgramFiles
    OS = $env:OS
    PROCESSOR_ARCHITECTURE = $env:PROCESSOR_ARCHITECTURE
    COMPUTERNAME = $env:COMPUTERNAME
    GITHUB_ACTIONS = "true"
    GITHUB_WORKSPACE = $workspace
    RUNNER_TEMP = $tempRoot
    CI = "true"
  }

  if ($ReleaseArtifactSmoke) {
    $stagedArtifactDirectory = Join-Path $tempRoot "gef-v$($env:GEF_EXPECTED_PRODUCT_VERSION)-exact-head-package"
    New-Item -ItemType Directory -Path $stagedArtifactDirectory -Force | Out-Null
    foreach ($artifactName in $artifactNames) {
      Copy-Item -LiteralPath (Join-Path $sourceArtifactDirectory $artifactName) -Destination (Join-Path $stagedArtifactDirectory $artifactName)
    }
    & icacls.exe $stagedArtifactDirectory /grant $grant /T /C /Q | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Could not grant the temporary user access to the exact-artifact receipt." }
    $childEnvironment["GEF_RELEASE_RECEIPT_DIR"] = $stagedArtifactDirectory
    $childEnvironment["GEF_EXPECTED_SOURCE_COMMIT"] = $env:GEF_EXPECTED_SOURCE_COMMIT
    $childEnvironment["GEF_EXPECTED_EVENT"] = $env:GEF_EXPECTED_EVENT
    $childEnvironment["GEF_EXPECTED_REF"] = $env:GEF_EXPECTED_REF
    $childEnvironment["GEF_EXPECTED_PRODUCT_VERSION"] = $env:GEF_EXPECTED_PRODUCT_VERSION
  }

  Add-Record ("Workspace: " + $workspace)
  Add-Record ("Validation account: " + $identity)
  Add-Record "The account is a standard Users member and is not an Administrators member."
  $whoami = Invoke-UserProcess "identity" (Join-Path $env:SystemRoot "System32\whoami.exe") "/groups"
  if ($whoami.ExitCode -ne 0) { throw "Could not verify the temporary account's effective groups." }
  if ($whoami.Output -match "S-1-5-32-544") { throw "The temporary validation token contains the Administrators group." }

  $gitArgs = 'config --global --add safe.directory "' + $workspace + '"'
  $gitConfig = Invoke-UserProcess "git-safe-directory" $gitPath $gitArgs
  if ($gitConfig.ExitCode -ne 0) { throw "Could not configure Git safe.directory for the standard user." }

  if ($ReleaseArtifactSmoke) {
    $smokeScript = if ($env:GEF_EXPECTED_PRODUCT_VERSION -eq "1.1.2") { Join-Path $workspace ".github\scripts\run-v11-wo012-artifact-smoke.mjs" } else { Join-Path $workspace "tests\v11-wo-010-artifact-smoke.mjs" }
    if (-not (Test-Path -LiteralPath $smokeScript -PathType Leaf)) { throw "The exact-artifact acceptance harness is missing." }
    $environmentPath = Join-Path $tempRoot "gef-v11-artifact-smoke-environment.json"
    $bootstrapPath = Join-Path $tempRoot "gef-v11-artifact-smoke-bootstrap.mjs"
    $environmentJson = ConvertTo-Json -InputObject $childEnvironment -Compress
    [System.IO.File]::WriteAllText($environmentPath, $environmentJson, [System.Text.UTF8Encoding]::new($false))
    $bootstrap = @'
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const [environmentPath, smokeScript] = process.argv.slice(2);
if (!environmentPath || !smokeScript) throw new Error("The exact-artifact smoke bootstrap requires its environment and harness paths.");
const environment = JSON.parse(readFileSync(environmentPath, "utf8"));
for (const key of Object.keys(process.env)) delete process.env[key];
Object.assign(process.env, environment);
await import(pathToFileURL(smokeScript).href);
'@
    [System.IO.File]::WriteAllText($bootstrapPath, $bootstrap, [System.Text.UTF8Encoding]::new($false))
    $bootstrapArguments = '"' + $bootstrapPath + '" "' + $environmentPath + '" "' + $smokeScript + '"'
    $smoke = Invoke-UserProcess "same-artifact-smoke" $nodePath $bootstrapArguments
    if ($smoke.ExitCode -ne 0) { throw "The exact-artifact smoke failed under the unprivileged Windows identity." }
  }
  else {
    $npmArgs = '"' + $npmCli + '" run validate'
    $validation = Invoke-UserProcess "npm-validate" $nodePath $npmArgs
    if ($validation.ExitCode -ne 0) { throw "npm run validate failed under the unprivileged Windows identity." }
  }
}
catch {
  $failure = $_.Exception.Message
  Add-Record ("SCRIPT_ERROR: " + $failure)
}
finally {
  if ($userCreated) {
    try {
      & icacls.exe $workspace /remove:g $identity /T /C /Q | Out-Null
      & icacls.exe $profileRoot /remove:g $identity /T /C /Q | Out-Null
      & icacls.exe $tempRoot /remove:g $identity /T /C /Q | Out-Null
      Remove-LocalUser -Name $accountName -ErrorAction SilentlyContinue
    }
    catch {
      Add-Record ("CLEANUP_WARNING: " + $_.Exception.Message)
    }
  }
  $records -join [Environment]::NewLine | Set-Content -Path $validationLog -Encoding utf8
  Get-Content -Raw $validationLog
}
if ($failure) {
  Write-Error $failure
  exit 1
}
