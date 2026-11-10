#!/bin/sh
# Copy the built site into this branch folder (keeps netlify/ and netlify.toml)
set -e
cd "$(dirname "$0")"
find . -maxdepth 1 -type f \( -name '*.html' -o -name '_headers' -o -name 'robots.txt' -o -name 'sitemap.xml' \) -delete
rm -rf assets
cp -r /home/claude/iph2/dist/. .
