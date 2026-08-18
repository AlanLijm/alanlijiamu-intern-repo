# Terminal Knowledge

## Which terminal client did I choose? Why?

I chose **Windows Terminal** with **PowerShell**. It's Microsoft's modern terminal app (already installed on my machine), supports tabs, and works well as the default terminal for Windows development — a solid starting point without needing to install a third-party client.

## What customizations did I make?

Explored the Settings panel (color scheme, starting directory, font) to personalize the PowerShell profile appearance.

## What was the most useful command/lesson I learned today?

The most useful lesson wasn't a single command, but a gotcha with `cd`: **paths containing spaces must be wrapped in quotes** in PowerShell.

Running this without quotes:

```powershell
cd C:\Users\...\OneDrive - Swinburne University\Semester4\intern\focus bear\onboarding-backend-nest-js
```

fails with:

```powershell
Set-Location : A positional parameter cannot be found that accepts argument '-'.
```

because PowerShell splits the command on spaces and treats `-` as a flag.

The fix is to quote the whole path:

```powershell
cd "C:\Users\...\OneDrive - Swinburne University\Semester4\intern\focus bear\onboarding-backend-nest-js"
```

After that, basic navigation commands worked as expected:

```powershell
dir          # list files/folders in the current directory
git status   # check repo status
cls          # clear the terminal screen
```
