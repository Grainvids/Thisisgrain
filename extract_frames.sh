#!/bin/bash

# Create a directory for the loading images if it doesn't exist
mkdir -p public/loading

# Function to extract frame from a video
extract_frame() {
    local input_video=$1
    local output_image=$2
    ffmpeg -i "$input_video" -vf "select=eq(n\,24)" -vframes 1 -q:v 2 "$output_image"
}

# Extract frames from project videos
for i in {1..12}; do
    if [ -f "public/project$i.mp4" ]; then
        extract_frame "public/project$i.mp4" "public/loading/loading$i.jpg"
    fi
done

# Extract frame from education content videos
if [ -f "public/education-content.mp4" ]; then
    extract_frame "public/education-content.mp4" "public/loading/education-content.jpg"
fi

if [ -f "public/education-content2.mp4" ]; then
    extract_frame "public/education-content2.mp4" "public/loading/education-content2.jpg"
fi

if [ -f "public/education-content3.mp4" ]; then
    extract_frame "public/education-content3.mp4" "public/loading/education-content3.jpg"
fi

if [ -f "public/showreeledu.mp4" ]; then
    extract_frame "public/showreeledu.mp4" "public/loading/showreeledu.jpg"
fi

if [ -f "public/hero.mp4" ]; then
    extract_frame "public/hero.mp4" "public/loading/hero.jpg"
fi 