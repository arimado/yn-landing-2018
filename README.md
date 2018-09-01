Make sure you have the following on your machine

`brew install pkg-config cairo pango libpng jpeg giflib` 

`brew install ffmpeg $(brew options ffmpeg | grep -vE '\s' | grep -- '--with-' | tr '\n' ' ')`
from https://gist.github.com/Piasy/b5dfd5c048eb69d1b91719988c0325d8

