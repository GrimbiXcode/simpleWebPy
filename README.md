# simpleWebPy
A simple example web application with Python web.py and the Bootstrap 3 framework.

## Included functions

 * jQuery - AJAX get() and post() Methods
 * Worker-Thread with message-queue
 * flot-live-chart


## Preparations

### Required Python modules

 * web.py
 * psutil

### Windows

If you need `pip` type `python get-pip.py` in your command promt.

```
python -m pip install web.py
python -m pip install psutil
```


#### If you are working behind a proxy server:

Put in your command promt (cmd): `netsh winhttp show proxy`

Copy the given proxyHost and port and paste it into the command: `SET HTTPS_PROXY=<proxyHost>:<proxyPort>`

Now you should be able to use `pip` as written above.


### Linux Ubuntu

If you need `pip` type `python get-pip.py` in your terminal.

```
pip install web.py
pip install psutil
```

## Download .zip from latest release

**Latest Release:**

Extract it to the directory you want to start the website from. For example: `\home\john\web\`

## Start the application

Now start your *simpleSite* with the command: 

**Windows**

```
python \home\john\web\SimpleWebPy\simpleSite\processor\SimpleSiteApp.py
```

**Linux**

```
python /home/john/web/SimpleWebPy/simpleSite/processor/SimpleSiteApp.py
```

### Stopp the application

**Windows and Linux**

Press `ctrl + c` in your commandline or terminal to stop the web application.

## Directory structure of the project

```
/simpleSite
├───/html_public
│   └───/pages                      # Save your HTML-files in this folder
│       ├───/Bootstrap Templates    # Original Bootstrap-files
│       ├───base.html               # One of the HTML-file
│       └───...                     # More HTML-files
│
├───/lib_systemd_system
│   └───simplesite.service          # Service-file for systemd controlled autostart
│
└───/processor
    ├───/sessions                   # Generated from wep.py to save session-data
    │
    ├───/static                     # folder for static files like .js .css .less etc.
    │   ├───/data                   # folder for your js-Files to print charts
    │   └───...                     # Other files for the bootstrap framework
    │
    └───simpleSiteApp.py            # python-script of your web application
```


## References
 
 * Bootstrap-Homepage - http://getbootstrap.com/
 * Python-Module web.py - http://webpy.org/
 * Python-Module psutil - https://pypi.python.org/pypi/psutil
 * Flot: JavaScript plotting library for jQuery - http://www.flotcharts.org/
