/*===============================================================================
# File:         chat.js
# Author:       David Grimbichler
# Date:         24.02.2017
# License:      GNU GENERAL PUBLIC LICENSE V3
# =============================================================================*/


/*===============================================================================
# GLOBAL VARIABLES
===============================================================================*/
var chat = [];                      // Array with saved messages
var getMessagesInterval = 500;      // timeout interval to get the messages from server
var data = [];                      // Array for received messages

/*-------------------------------------------------------------------------------
# END OF SECTION GLOBAL VARIABLE
-------------------------------------------------------------------------------*/


/*===============================================================================
# FUNCTIONS
===============================================================================*/

/********************************************************************************
* fetchData()
* ------------------------------------------------------------------------------
* send a request to the server to get data
* and fetch received data into the receive buffer
********************************************************************************/
function fetchData() {
    /* check if everything is ready */
    if (this.readyState == 4 && this.status == 200) {
        /* read the XML-formatet data */
        var xmlDoc = this.responseXML;
        /* fetch the XML data*/
        for (var i = 0; xmlDoc.getElementsByTagName("MESSAGE").length > i; i++) {
            data[i] = xmlDoc.getElementsByTagName("MESSAGE")[i].childNodes[0].nodeValue;
            }

        /* check if something is new */
        if(data[data.length-1] != chat[chat.length-1]){
            var newMessages = "";
            /* Duplicate the Array */
            i = data.length;
            while(i--) chat[i] = data[i];

            /* prepare the messages */
            for (var i = 0; chat.length > i; i++) {
                newMessages += chat[i] + "<br>";
            }
            document.getElementById('chat').innerHTML = newMessages;
        }
    }
}
/********************************************************************************
* End of fetchData()
********************************************************************************/

/********************************************************************************
* sendMessage()
* ------------------------------------------------------------------------------
* send a request to the server to get data
* and fetch received data into the receive buffer
********************************************************************************/
function sendMessage() {
    var message;
    var xhttp;
    xhttp = new XMLHttpRequest();

    // Get the value of the input field with id="message"
    message = document.getElementById("message").value;

    /* send a POST-request to the server  with the URL: "http://yourserver/message="
    * and add the new message behind the url
    */
    xhttp.open("POST", "message=" + message, true);
    xhttp.send();
}

/********************************************************************************
* End of sendMessage()
********************************************************************************/

/********************************************************************************
* GetMessages()
* ------------------------------------------------------------------------------
* send a request to the server to get data
* and fetch received data into the receive buffer
********************************************************************************/
function GetMessages() {
    var xhttp;
    xhttp = new XMLHttpRequest();

    /* define the callback function, executed by received data from server */
    xhttp.onreadystatechange = fetchData;

    /* send a POST-request to the server  with the URL: "http://yourserver/serverussage" */
    xhttp.open("GET", "message", true);
    xhttp.send();
}

/********************************************************************************
* End of GetMessages()
********************************************************************************/
/*-------------------------------------------------------------------------------
# END OF SECTION FUNCTIONS
-------------------------------------------------------------------------------*/


/*===============================================================================
# "MAIN"-CODE
===============================================================================*/

/* if Browser is ready: Run following function */
$(document).ready(function () {
    /* start getting the data */
    setInterval(GetMessages, getMessagesInterval);
});


/*-------------------------------------------------------------------------------
# END OF SECTION "MAIN"-CODE
-------------------------------------------------------------------------------*/
