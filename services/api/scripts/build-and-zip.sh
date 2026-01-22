#!/bin/bash

set -e

echo "Building Lambda functions..."

# Build with esbuild
pnpm build

echo "Creating ZIP files for Lambda deployment..."

cd dist

# Create ZIP files for each handler
for dir in */; do
  category=$(basename "$dir")

  for file in "$dir"*.js; do
    if [ -f "$file" ]; then
      filename=$(basename "$file" .js)
      zipname="${category}-${filename}.zip"

      echo "Creating $zipname..."

      # Create a temporary directory for this function
      mkdir -p "temp-${category}-${filename}"

      # Copy the handler file and its map
      cp "$file" "temp-${category}-${filename}/"
      if [ -f "${file}.map" ]; then
        cp "${file}.map" "temp-${category}-${filename}/"
      fi

      # Create ZIP from the temp directory
      cd "temp-${category}-${filename}"
      zip -q -r "../$zipname" .
      cd ..

      # Clean up temp directory
      rm -rf "temp-${category}-${filename}"

      echo "Created $zipname"
    fi
  done
done

cd ..

echo "Build and packaging complete!"
