$script:ProFruitRoot = Split-Path $PSScriptRoot -Parent

function Invoke-ProFruitUp {
  Push-Location $script:ProFruitRoot
  try {
    npm run up
  }
  finally {
    Pop-Location
  }
}

function Invoke-ProFruitDown {
  Push-Location $script:ProFruitRoot
  try {
    npm run down
  }
  finally {
    Pop-Location
  }
}

Set-Alias -Name up -Value Invoke-ProFruitUp -Scope Global -Force
Set-Alias -Name down -Value Invoke-ProFruitDown -Scope Global -Force
