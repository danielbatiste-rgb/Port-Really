#!/bin/sh
# Usage: sh tools/new-project.sh <slug> "<Title>"
# Creates work/<slug>/index.html and a media folder. Then add the project to assets/js/projects.js.
set -e
cd "$(dirname "$0")/.."
[ -z "$1" ] || [ -z "$2" ] && { echo 'Usage: sh tools/new-project.sh <slug> "<Title>"'; exit 1; }
mkdir -p "work/$1" "assets/media/projects/$1"
sed -e "s/{{SLUG}}/$1/g" -e "s/{{TITLE}}/$2/g" tools/project-template.html > "work/$1/index.html"
echo "Created work/$1/index.html — now add { slug: \"$1\", ... } to assets/js/projects.js"
