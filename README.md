# Facebook Open Academy #
- Assignment for Uni. Helsinki Software Factory / Facebook Open Academy
- http://www.softwarefactory.cc/2013/11/25/facebook-open-academy-2014/

## Installation ##

Before installing make sure you have working node.js and npm package manager

1. Download files from GitHub - https://github.com/mrnullbox/facebook-open-academy
2. Run > npm install in facebook-open-academy folder
3. Run application > node app.js
4. Open browser to localhost:3000
5. Click start initialization
6. Sit back and relax while data in being downloaded

Note! If initialization or reset fails because of the error below just click the button again.

## Todo ##

1. Display location information as a heat map with Google maps and leaflet
2. Improve worker flow control in worker
3. Use ajax to check refresh so that the whole page does not refresh or socket-IO
4. For production -> protect initialize and reset function with password
5. For production -> make a prettier user interface

**Links to sources**
* http://howtonode.org/control-flow
* http://whaleventures.blogspot.de/2012/02/managing-callback-spaghetti-in-nodejs.html
* https://github.com/flatiron/winston	

## Acknowledgements ##

If you encounter following error: remove **cert-fi_data** folder and run the application again. 
This is an error with used AdmZip module.

throw Utils.Errors.INVALID_FORMAT;
                              ^
Invalid or unsupported zip format. No END header found

https://github.com/cthackers/adm-zip

## License ##

The MIT License (MIT)

Copyright (c) 2013 nullbox

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.