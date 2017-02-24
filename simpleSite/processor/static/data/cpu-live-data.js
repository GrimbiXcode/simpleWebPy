/*===============================================================================
# File:         cpu-live-data.js
# Author:       David Grimbichler
# Date:         17.01.2017
# License:      GNU GENERAL PUBLIC LICENSE V3
# =============================================================================*/


/*===============================================================================
# GLOBAL VARIABLES
===============================================================================*/
var cpuUssage = [];             // Array to draw the graph
var cpuUssagePointer = 0;       // pointer for redrawing
var dataset;                    // variable for collection with datapoints and graphsettings used by flot
var totalPoints = 100;          // define the length of x-Axis (amount of datapoints)
var plotcut = totalPoints*0.1;  // define distance between old plot and cpuUssagePointer
var chartUpdateInterval = 20;   // update interval in ms (lower = smoother but more cpu-ussage)
var getDataInterval = 500;      // timeout interval to get new data in ms
var data = [];                  // Array for received datapoints
var samplesPerRendering = 2;    // set it to min 1+datapoint received per update interval to prevent 
                                    // getting data garbage in the "data"-Array

/* Settings/options for the chart */
var options = {
    series: {
        lines: {
            lineWidth: 1.2
        },
        bars: {
            align: "center",
            fillColor: { colors: [{ opacity: 1 }, { opacity: 1}] },
            barWidth: 500,
            lineWidth: 1
        }
    },
    xaxis: {
        min: 0,
        max: totalPoints,
        axisLabel: "Time",
        axisLabelUseCanvas: true,
        axisLabelFontSizePixels: 12,
        axisLabelFontFamily: 'Verdana, Arial',
        axisLabelPadding: 10,
        tickFormatter: function() {
                return "";
            }
    },
    yaxis: {
        min: 0,
        max: cpuUssage.max,
        axisLabel: "cpuUssage loading",
        axisLabelUseCanvas: true,
        axisLabelFontSizePixels: 12,
        axisLabelFontFamily: 'Verdana, Arial',
        axisLabelPadding: 6
        },
    legend: {
        noColumns: 0,
        position:"nw"
    },
    grid: {
        borderWidth: 1,
        minBorderMargin: 20,
        labelMargin: 10,
        backgroundColor: {
            colors: ["#fff", "#e4f4f4"]
        },
        margin: {
            top: 8,
            bottom: 20,
            left: 20
        },
        markings: function(axes) {
            var markings = [];
            var xaxis = axes.xaxis;
            for (var x = Math.floor(xaxis.min); x < xaxis.max; x += xaxis.tickSize * 2) {
                markings.push({
                    xaxis: {
                        from: x,
                        to: x + xaxis.tickSize
                    },
                    color: "rgba(232, 232, 255, 0.2)"
                });
            }
            return markings;
        }
    },
};

/*-------------------------------------------------------------------------------
# END OF SECTION GLOBAL VARIABLE
-------------------------------------------------------------------------------*/


/*===============================================================================
# FUNCTIONS
===============================================================================*/

/********************************************************************************
* GetData()
* ------------------------------------------------------------------------------
* send a request to the server to get data
* and fetch received data into the receive buffer
********************************************************************************/
function GetData() {
    var xhttp;
    xhttp = new XMLHttpRequest();

    /* define the callback function, executed by received data from server */
    xhttp.onreadystatechange = function() {
        /* check if everything is ready */
        if (this.readyState == 4 && this.status == 200) {
            /* read the XML-formatet data */
            var xmlDoc = this.responseXML;
            /* fetch the XML data*/
            var newcpuUssage;
            for (var i = 0; xmlDoc.getElementsByTagName("CPU_USSAGE").length > i; i++) {
                newcpuUssage = xmlDoc.getElementsByTagName("CPU_USSAGE")[i].childNodes[0].nodeValue;
                /* put it into the buffer */
                data.push(newcpuUssage);
                }
            /* write the last value into the placeholder "cpu-ussage" */
            document.getElementById('cpu-ussage').innerHTML = newcpuUssage;
        }
    }; // end of callback function

    /* send a POST-request to the server  with the URL: "http://yourserver/serverussage" */
    xhttp.open("POST", "serverussage", true);
    xhttp.send();   
}

/********************************************************************************
* End of GetData()
********************************************************************************/

/********************************************************************************
* updateChart()
* ------------------------------------------------------------------------------
* Engine to redraw the chart every "chartUpdateInterval"
********************************************************************************/
function updateChart() {
    /* are new data received? */
    if (!(data.length)){
        return;
    }

    /* render the received data */
    getRendered();

    /* plot the chart with the dataset and the options */
    $.plot($("#flot-live-chart"), dataset, options);
}

/********************************************************************************
* End of updateChart()
********************************************************************************/

/********************************************************************************
* getRendered()
* ------------------------------------------------------------------------------
* render the received data
********************************************************************************/
function getRendered() {
    for (var i = 0; i < samplesPerRendering; i++){
        if (data.length) {
            /* cut the old plot for a better view of the new data*/
            for (var j = 1; j < plotcut; j++){
                cpuUssage[cpuUssagePointer + j] = null;
            }
            /* put in the new data */
            cpuUssage[cpuUssagePointer] = [cpuUssagePointer, data[0]];
            cpuUssagePointer++;
            cpuUssagePointer %= (totalPoints + 1);
            /* and handle the receice buffer */
            data = data.slice(1);
        }
    }
}

/********************************************************************************
* End of getRendered()
********************************************************************************/

/********************************************************************************
* initChartData()
* ------------------------------------------------------------------------------
* generate initial data to display a empty chart 
********************************************************************************/
function initChartData() {
    /* fill empty data into the chart-data */
    for (var i = 0; i < totalPoints; i++) {
        cpuUssage.push([i,null]);
    }
}

/********************************************************************************
* End of initChartData()
********************************************************************************/
/*-------------------------------------------------------------------------------
# END OF SECTION FUNCTIONS
-------------------------------------------------------------------------------*/


/*===============================================================================
# "MAIN"-CODE
===============================================================================*/

/* if Browser is ready: Run following function */
$(document).ready(function () {
    /* generate initial data to display a empty chart */
    initChartData();

    /* Generate the dataset for the chart-data */
    dataset = [
        { label: "CPU Ussage [%] Live-Stream", data: cpuUssage, lines: { fill: false, lineWidth: 1.2 }, color: "#00FF00" }   
    ];

    /* plot the chart with the generatet dataset and the options 
    * use it here a first time to prevent a delay by displaying the chart
    */
    $.plot($("#flot-live-chart"), dataset, options);
    
    /* start getting the data */
    setInterval(GetData, getDataInterval);
    /* start printing graphs*/
    setInterval(updateChart, chartUpdateInterval);
});


/*-------------------------------------------------------------------------------
# END OF SECTION "MAIN"-CODE
-------------------------------------------------------------------------------*/
