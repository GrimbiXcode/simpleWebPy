#!/usr/bin/python
# ============================================================================
# File:         simpleSiteApp.py
# Author:       David Grimbichler
# Date:         17.01.2017
# License:    	GNU GENERAL PUBLIC LICENSE V3
# ============================================================================
# ****************************************************************************
# Import
# ****************************************************************************
import web
import sys
import os
from datetime import datetime
from datetime import timedelta
import psutil
import random

import threading
from Queue import Queue
import time

# ****************************************************************************
# Globals
# ****************************************************************************
web.config.debug = False
urls = (
    '/', 'index',
    '/index', 'index',
    '/message', 'chat',
    '/message=(.*)', 'chat',
    '/serverussage', 'serverussage',
    )

# Append Workingdirecory for MongoAPI-Module (prevent problems in autostart on server) 
sys.path.append(os.getcwd())
print(sys.path)

# create the app and session-object
app = web.application(urls, globals())
session = web.session.Session(app, web.session.DiskStore('sessions'), initializer={
    'username': "",
    })

# feed the globals
t_globals = {
    'datestr': web.datestr,
    'context': session,
    }

# create render-objects for html templates with file base.html
render = web.template.render('../html_public/pages/', base='base', globals=t_globals)

# some session-configurations to safe opened websessions if files, not in db
web.config.session_parameters.handler = 'file'
web.config.session_parameters.file_prefix = 'sess'
web.config.session_parameters.file_dir = '/temp'

# MessagesQueues for the threads
cpuUssageQueue = Queue()
inputChatQueue = Queue()

# Global variables
g_cpu_ussage = 0.0
g_chat = list()

# ****************************************************************************
# Debug-Code
# ****************************************************************************
global debug
debug = True

if debug:
    print("\n*******************************************************************************\n")
    print("Webapplication SimpleSite\nby David Grimbichler     17.01.2017")
    print("Debug-Mode: " + str(debug))
    print("\n*******************************************************************************\n")


# ============================================================================
# classes
# ============================================================================

# ****************************************************************************
# cpuThread(threading.Thread)
# Thread for continued watching of the cpu ussage
# ****************************************************************************
class cpuThread(threading.Thread):
    
    def __init__(self, threadID, name, q1):
        threading.Thread.__init__(self)
        self.threadID = threadID
        self.name = name
        self.cpu_ussage = q1       # cpu-data
        self._stopevent = threading.Event()

    def run(self):
        if debug: print(self.name + ": Starting " + self.name)
        while not self._stopevent.isSet():
            # read the cpu ussage
            performanceVar = psutil.cpu_percent(interval=0.1)
            # clean up the queue to prevent an overfill
            if not self.cpu_ussage.empty():
                dummy = cpuUssageQueue.get()
            # write new ussage into the queue
            self.cpu_ussage.put(performanceVar)
            # give other threads time to read the queue
            time.sleep(0.4)

        if debug: print(self.name + ": Closing")
        time.sleep(0.5)

    def join(self, timeout=None):
        """ Stop the thread and wait for it to end. """
        self._stopevent.set( )
        threading.Thread.join(self, timeout)

# ****************************************************************************
# chatThread(threading.Thread)
# Thread to read serverside commandline inputs
# ****************************************************************************
class chatThread(threading.Thread):
    
    def __init__(self, threadID, name, q1):
        threading.Thread.__init__(self)
        self.threadID = threadID
        self.name = name
        self.chatServerInput = q1       # "chat input"-data serverside
        self._stopevent = threading.Event()

    def run(self):
        if debug: print(self.name + ": Starting " + self.name)
        while not self._stopevent.isSet():
            message = "server :" + str(datetime.now()) + " > " + raw_input()
            self.chatServerInput.put(message)
        if debug: print(self.name + ": Closing")
        time.sleep(0.5)

    def join(self, timeout=None):
        """ Stop the thread and wait for it to end. """
        self._stopevent.set( )
        threading.Thread.join(self, timeout)


# ============================================================================
# FORMS
# ============================================================================

# create html-form for "registration of a device"
deviceRegistration = web.form.Form(
    web.form.Textbox('deviceCode', web.form.notnull, 
        class_="form-control col-sm-offset-2 ",
        pre="<div class=\"form-group\">",
        post="</div>",
        description="Registrierungscode:")
)

# create html-form for "termin-management"
dateForm = web.form.Form(
    web.form.Textbox('date', web.form.notnull, 
        class_="form-control",
        placeholder="DD.MM.JJJJ hh:mm",
        pre="<div class=\"form-group\"><label class=\"col-sm-3 control-label\">Datum: </label><div class=\"col-sm-9\">",
        post="</div></div>",
        description=""),
    validators = [web.form.Validator("Falsches Datenformat", lambda i: datetime.strptime(i.date, '%d.%m.%Y %H:%M').strftime("%s"))]
)

# ============================================================================
# FUNCTIONS
# ============================================================================

# no function so far

# ============================================================================
# CLASSES
# ============================================================================

# ****************************************************************************
# INDEX 
# ****************************************************************************
class index:

    def GET(self):
        if session.username == "":
            session.username = "user" + str(random.randint(99999, 1000000))
        return render.index(random.randint(99999, 1000000), session.username)


# ****************************************************************************
# CHAT FROM INDEX
# ****************************************************************************
class chat:

    def GET(self):
        global g_chat
        if not inputChatQueue.empty():
            g_chat.append(inputChatQueue.get())

        xml_messages = ""
        for message in g_chat:
            xml_messages += "<MESSAGE>" + message + "</MESSAGE>"
        print(xml_messages)
        return "<CHAT>" + xml_messages + "</CHAT>"

    def POST(self, newMessage):
        global g_chat
        if newMessage != "":
            g_chat.append(session.username + ":" + str(datetime.now()) + " > " + newMessage)

        # send an empty xml element
        return "<?xml version=\"1.0\" encoding=\"utf-8\"?><status>success</status>"



# ****************************************************************************
# SERVER USSAGE 
# ****************************************************************************
class serverussage:

    def GET(self):
        global g_cpu_ussage
        # check state of queue
        if not cpuUssageQueue.empty():
            g_cpu_ussage = cpuUssageQueue.get()
        return render.serverussage()

    def POST(self):
        global g_cpu_ussage
        # check state of queue
        if not cpuUssageQueue.empty():
            g_cpu_ussage = cpuUssageQueue.get()
        # return the cpu ussage in xml-style
        return "<SERVERUSSAGE><CPU_USSAGE>" + str(g_cpu_ussage) + "</CPU_USSAGE></SERVERUSSAGE>"


# ============================================================================
# MAINCODE
# ============================================================================

if __name__ == "__main__": 

    threadOne = cpuThread(1, "Looking for CPU-ussage", cpuUssageQueue)
    threadTwo = chatThread(1, "Chat-Thread", inputChatQueue)

    threadOne.deamon = True
    threadTwo.deamon = True

    threadOne.start()
    threadTwo.start()

    g_chat.append("server:" + str(datetime.now()) + " > Server booted successfull")

    app.run()

# ============================================================================
# END OF CODE
# ============================================================================














