#!/bin/bash
for filename in cpp/AIs/*; do
    for ((i=0; i<=3; i++)); do
        echo $1 $filename
        cpp/Arena $1 $filename
    done
done