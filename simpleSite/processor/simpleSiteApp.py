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
    '/serverussage', 'serverussage',
    '/logout', 'logout',
    '/measurements', 'measurements',
    '/showMeas.(\d+)', 'showMeasurement',
    '/delMeas.(\d+)', 'delMeasurement',
    '/showLiveMeas(.*)', 'showLiveMeasurement',
    '/register', 'register',
    '/termin', 'termin',
    '/delDate.(\d+)', 'delDate',
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


g_cpu_ussage = 0.0

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
# mqttThread(threading.Thread)
# Thread for MQTT-Connection:
#   open a client for subscribing the topic "d/#" and publish messages in the
#   topic "s/#"
#   Subscribe: if some data recived -> save them in the queue q2
#   Publish: if some data in Queue q1 -> publish them
# ****************************************************************************
class mqttThread(threading.Thread):
    
    def __init__(self, threadID, name, q1):
        threading.Thread.__init__(self)
        self.threadID = threadID
        self.name = name
        self.cpu_ussage = q1       # cpu-data
        self._stopevent = threading.Event()

    def run(self):
        if debug: print(self.name + ": Starting " + self.name)
        while not self._stopevent.isSet():
            performanceVar = psutil.cpu_percent(interval=0.1)
            if not self.cpu_ussage.empty():
                dummy = cpuUssageQueue.get()
            self.cpu_ussage.put(performanceVar)
            time.sleep(0.4)
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


# ============================================================================
# CLASSES
# ============================================================================

# ****************************************************************************
# INDEX 
# ****************************************************************************
class index:

    def GET(self):
        return render.index(True)


    def POST(self):
        return render.index(True)


# ****************************************************************************
# SERVER USSAGE 
# ****************************************************************************
class serverussage:

    def GET(self):
        global g_cpu_ussage
        if not cpuUssageQueue.empty():
            g_cpu_ussage = cpuUssageQueue.get()
        return render.serverussage()

    def POST(self):
        global g_cpu_ussage
        if not cpuUssageQueue.empty():
            g_cpu_ussage = cpuUssageQueue.get()
        return "<SERVERUSSAGE><CPU_USSAGE>" + str(g_cpu_ussage) + "</CPU_USSAGE></SERVERUSSAGE>"


# ****************************************************************************
# REGISTER 
# ****************************************************************************
class register:

    def GET(self):
        state = ["none",""]
        if session.loggedin:
            raise web.seeother('/')
        formData = registerForm()
        return renderLogin.register(formData, state)

    def POST(self):
        state = ["none",""]
        formData = registerForm()
        if formData.validates():
            pwdhash1 = hashlib.md5(formData.d.password1).hexdigest()
            if debug: print("Password input:" + pwdhash1 + "\n")
            data = list()
            data.append({
                "prename": formData.d.prename,
                "name": formData.d.name,
                "street": formData.d.street,
                "housenumber": formData.d.housenumber,
                "plz": formData.d.plz,
                "city": formData.d.city,
                "email": formData.d.email,
                "username": formData.d.user,
                "password": pwdhash1
                }
            )
            if MongoAPI.registerUser(data, formData.d.isDoctor):
                state = ["success", "Registrierung erfolgreich! Bitte kehren Sie zum Login zurueck."]
                return renderLogin.register(formData, state)
            else:
                state = ["failuser", "Email oder Username existert bereits."]
                return renderLogin.register(formData, state)
        else:
            state = ["failpw", "Passworteingaben nicht identisch"]
            return renderLogin.register(formData, state)
        raise web.seeother('/')


# ****************************************************************************
# INDEX 
# ****************************************************************************
class example:

    def GET(self):
        if session.loggedin:
            if session.doctor:
                return renderDoctor.example(session.username)
            else:
                return renderPatient.example(session.username)
            return render.example(session.username)
        else:
            raise web.seeother('/login')

    def POST(self):
        return render.index()


# ****************************************************************************
# SINGLE_MEASUREMENT 
# ****************************************************************************
class showMeasurement:

    def GET(self, num):
        if session.loggedin:
            meas = MongoAPI.getAllMeasurements(session.userid)
            meas = sorted(meas, key=lambda k: k['meas_id'], reverse = True)
            if num == "":
                return ""
            if debug: print(meas[int(num)]['meas_id'])
            content = MongoAPI.getData(meas[int(num)]['meas_id'])

            data = "[[" + str(content).replace("%\\n", "").replace("\', \'", ",").replace(",", "],[")[2:-2] + "]]"
            
            intdata = map(int,data[2:-2].split("],["))
            if debug: print(str(intdata)[:40]+"...")
            filteredData = "[" + str((Implement_Notch_Filter(0.008,7,50,0,3,'bessel',intdata)).tolist()).replace(",", "],[") + "]"
            

            if debug: print(str(filteredData)[:40]+"...")
            if session.doctor:
                return renderDoctor.showMeasurement(filteredData, str(int(num) + 1))
            else:
                return renderPatient.showMeasurement(filteredData, str(int(num) + 1))
            return render.index(session.username)
        else:
            session.kill()
            raise web.seeother('/login')


# ****************************************************************************
# LIVE_MEASUREMENT 
# ****************************************************************************
class showLiveMeasurement:

    def GET(self, num):
        if session.loggedin:
            devicelist = MongoAPI.getLiveState(session.userid)
            if debug: print("*************************\nMessung:")
            if debug: pprint(devicelist)
            session.liveIndex = 0
            command = {
                'topic': 'EazyEKG',
                'message': 'Testing the paraverse'
                }
            commandQueue.put(command)
            onAir = False
            if num != "":
                session.liveDeviceID = devicelist[int(num)]['_id']
                if debug: session.liveDeviceID
                onAir = True
            state = True
            if devicelist == []:
                state = False
            if session.doctor:
                return renderDoctor.showLiveMeasurement(devicelist, state, onAir)
            else:
                return renderPatient.showLiveMeasurement(devicelist, state, onAir)
            return render.index(session.username)
        else:
            session.kill()
            raise web.seeother('/login')

    def POST(self, num):
        if session.loggedin:
            if num == "":
                return ""
            content = MongoAPI.getLiveData(session.liveDeviceID, session.liveIndex)
            if content == session.liveIndex:
                if debug: print("nothing new")
                return ""
            session.liveIndex = int(content.pop())

            data = "[[" + str(content).replace("%\\n", "").replace("\', \'", ",").replace(",", "],[")[2:-2] + "]]"
            intdata = map(int,data[2:-2].split("],["))
            filteredData = "[" + str((Implement_Notch_Filter(0.008,7,50,0,3,'bessel',intdata)).tolist()).replace(",", "],[") + "]"

            if debug: print(str(content)[:40]+"..." + " + " + str(session.liveIndex))
            data = "[[" + str(content).replace("%\\n", "").replace("\', \'", ",").replace(",", "],[")[2:-2] + "]]"
            if debug: print(data[:40]+"...")
            return filteredData
        else:
            session.kill()
            raise web.seeother('/login')


# ============================================================================
# MAINCODE
# ============================================================================

# app = web.application(urls, globals())

if __name__ == "__main__": 
    threadOne = mqttThread(1, "Looking for CPU-ussage",cpuUssageQueue)
    threadOne.deamon = True
    threadOne.start()
    app.run()

# ============================================================================
# END OF CODE
# ============================================================================














