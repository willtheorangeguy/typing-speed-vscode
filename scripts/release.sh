#!/bin/bash

# Release script for Typing Speed VS Code Extension
# Usage: ./scripts/release.sh [patch|minor|major]

set -e

# Default to patch if no argument provided
VERSION_TYPE=${1:-patch}

echo "🚀 Starting release process..."

# Ensure we're on main/master branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
    echo "❌ Error: Please switch to main or master branch before releasing"
    exit 1
fi

# Ensure working directory is clean
if ! git diff-index --quiet HEAD --; then
    echo "❌ Error: Working directory is not clean. Please commit or stash changes."
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin $CURRENT_BRANCH

# Run tests
echo "🧪 Running tests..."
npm test

# Update version
echo "📝 Updating version ($VERSION_TYPE)..."
npm version $VERSION_TYPE --no-git-tag-version

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "📦 New version: $NEW_VERSION"

# Build and package
echo "🔨 Building extension..."
npm run package

echo "📦 Creating VSIX package..."
npx @vscode/vsce package

# Commit version bump
echo "💾 Committing version bump..."
git add package.json
git commit -m "chore: bump version to $NEW_VERSION"

# Create and push tag
echo "🏷️  Creating tag v$NEW_VERSION..."
git tag "v$NEW_VERSION"

echo "⬆️  Pushing changes and tag..."
git push origin $CURRENT_BRANCH
git push origin "v$NEW_VERSION"

echo "✅ Release v$NEW_VERSION completed!"
echo "🎉 GitHub Actions will now build and create the release automatically."
echo "📋 Check the GitHub Actions tab for build progress."
