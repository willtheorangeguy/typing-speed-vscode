@echo off
REM Release script for Typing Speed VS Code Extension (Windows)
REM Usage: scripts\release.bat [patch|minor|major]

setlocal enabledelayedexpansion

REM Default to patch if no argument provided
if "%1"=="" (
    set VERSION_TYPE=patch
) else (
    set VERSION_TYPE=%1
)

echo 🚀 Starting release process...

REM Check if we're on main/master branch
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i

if not "%CURRENT_BRANCH%"=="main" if not "%CURRENT_BRANCH%"=="master" (
    echo ❌ Error: Please switch to main or master branch before releasing
    exit /b 1
)

REM Check if working directory is clean
git diff-index --quiet HEAD --
if %errorlevel% neq 0 (
    echo ❌ Error: Working directory is not clean. Please commit or stash changes.
    exit /b 1
)

REM Pull latest changes
echo 📥 Pulling latest changes...
git pull origin %CURRENT_BRANCH%

REM Run tests
echo 🧪 Running tests...
call npm test
if %errorlevel% neq 0 (
    echo ❌ Tests failed
    exit /b 1
)

REM Update version
echo 📝 Updating version (%VERSION_TYPE%)...
call npm version %VERSION_TYPE% --no-git-tag-version

REM Get new version
for /f "tokens=*" %%i in ('node -p "require('./package.json').version"') do set NEW_VERSION=%%i
echo 📦 New version: %NEW_VERSION%

REM Build and package
echo 🔨 Building extension...
call npm run package

echo 📦 Creating VSIX package...
call npx @vscode/vsce package

REM Commit version bump
echo 💾 Committing version bump...
git add package.json
git commit -m "chore: bump version to %NEW_VERSION%"

REM Create and push tag
echo 🏷️  Creating tag v%NEW_VERSION%...
git tag "v%NEW_VERSION%"

echo ⬆️  Pushing changes and tag...
git push origin %CURRENT_BRANCH%
git push origin "v%NEW_VERSION%"

echo ✅ Release v%NEW_VERSION% completed!
echo 🎉 GitHub Actions will now build and create the release automatically.
echo 📋 Check the GitHub Actions tab for build progress.

endlocal
