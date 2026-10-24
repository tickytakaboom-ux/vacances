# Dépendances de développement uniquement ; aucun déploiement ni projet réel.
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$localTools = Join-Path $repo '.preview/firebase-tests'
New-Item -ItemType Directory -Path $localTools -Force | Out-Null
$manifest = '{"name":"vacances-local-rules-tests","private":true,"devDependencies":{"@firebase/rules-unit-testing":"6.0.0","firebase":"13.1.0","firebase-tools":"15.34.1"}}'
[IO.File]::WriteAllText((Join-Path $localTools 'package.json'),$manifest)
Push-Location $localTools
try {
    if (!(Test-Path 'node_modules/firebase-tools/lib/bin/firebase.js')) {
        if (Get-Command pnpm -ErrorAction SilentlyContinue) { pnpm install --ignore-scripts }
        else { npm install --ignore-scripts }
        if ($LASTEXITCODE -ne 0) { throw 'Installation des outils échouée.' }
    }
    Copy-Item -LiteralPath (Join-Path $repo 'firestore.rules') -Destination (Join-Path $localTools 'access.rules') -Force
    $config = '{"firestore":{"rules":"access.rules"},"emulators":{"firestore":{"host":"127.0.0.1","port":8089},"ui":{"enabled":false},"singleProjectMode":true}}'
    [IO.File]::WriteAllText((Join-Path $localTools 'rules-test-config.json'),$config)
    $env:FIREBASE_CLI_DISABLE_USAGE_REPORTING = '1'
    node node_modules/firebase-tools/lib/bin/firebase.js emulators:exec --only firestore --project demo-vacances-access --config rules-test-config.json 'node --test ../../tests/firestore-rules.test.mjs'
    if ($LASTEXITCODE -ne 0) { throw 'Tests des règles échoués.' }
} finally { Pop-Location }