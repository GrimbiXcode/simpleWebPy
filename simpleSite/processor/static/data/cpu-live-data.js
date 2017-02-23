var cpuUssage = [];
var cpuUssagePointer = 0; // pointer for redrawing
var dataset;
var totalPoints = 100;
var plotcut = totalPoints*0.04; // define distance between old plot and cpuUssagePointer
var updateInterval = 500;
var data = [];
var now = 0;
var index = 0;
var samplesPerRendering = 2;

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


/* Function for value in table */
function UpdateTableValue(xml) {
    var xmlDoc = xml.responseXML;
    var newcpuUssage = xmlDoc.getElementsByTagName("CPU_USSAGE")[0].childNodes[0].nodeValue
    document.getElementById('cpu-ussage').innerHTML = newcpuUssage;
    data.push(newcpuUssage);
    setTimeout(GetData, updateInterval);
}


function GetData() {
  var xhttp;
  xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      UpdateTableValue(this);
    }
  };
  xhttp.open("POST", "serverussage", true);
  xhttp.send();   
}

function update(_data) {
    for (var i = 0; i < _data.length; i += 1) {
        data.push(_data[i]);
    }
    
    setTimeout(GetData, updateInterval);
}

function getRendered() {
    for (var i = 0; i < samplesPerRendering; i++){
        if (data.length) {
                for (var j = 1; j < plotcut; j++){
                    cpuUssage[cpuUssagePointer + j] = null;
            }
            cpuUssage[cpuUssagePointer] = [cpuUssagePointer, data[0]];
            cpuUssagePointer++;
            cpuUssagePointer %= totalPoints;
            data = data.slice(1);
        }
    }
}

function initData() {

    if (data.length) {
            data = data.slice(1);
        }

    for (var i = 0; i < totalPoints; i++) {
        cpuUssage.push([i,null]);
    }
}

$(document).ready(function () {
    initData();
    dataset = [
        { label: "cpuUssage Live-Stream", data: cpuUssage, lines: { fill: false, lineWidth: 1.2 }, color: "#00FF00" }   
    ];
    $.plot($("#flot-live-chart"), dataset, options);
    
    setTimeout(GetData, updateInterval);

});

setInterval(function updateData() {
    if (!(data.length)){
        return;
    }
        getRendered();
    dataset = [
        { label: "CPU Ussage [%] Live-Stream", data: cpuUssage, lines: { fill: false, lineWidth: 1.2 }, color: "#00FF00" }    
    ];
    $.plot($("#flot-live-chart"), dataset, options);
}, 5);
