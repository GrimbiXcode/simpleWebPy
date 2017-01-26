var ekg = [];
var ekgpointer = 0; // pointer for redrawing
var plotcut = 20; // define distance between old plot and ekgpointer
var dataset;
var totalPoints = 1000;
var updateInterval = 1000;
var data = [];
var now = 0;
var index = 0;
var samplesPerRendering = 20;

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
        min: ekg.min,
        max: ekg.max,
        axisLabel: "EKG loading",
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

function GetData() {
    $.ajaxSetup({ cache: false });

    $.ajax({
        type: 'POST',
        dataType: 'json',
        success: update,
        error: function () {
            setTimeout(GetData, updateInterval);
        }
    });
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
                    ekg[ekgpointer + j] = null;
            }
            ekg[ekgpointer] = [ekgpointer, data[0]];
            ekgpointer++;
            ekgpointer %= totalPoints;
            data = data.slice(1);
        }
    }
}

function initData() {

    if (data.length) {
            data = data.slice(1);
        }

    for (var i = 0; i < totalPoints; i++) {
        ekg.push([i,null]);
    }
}

$(document).ready(function () {
    initData();
    dataset = [
        { label: "EKG Live-Stream", data: ekg, lines: { fill: false, lineWidth: 1.2 }, color: "#00FF00" }   
    ];
    $.plot($("#flot-live-chart"), dataset, options);
    
    setTimeout(GetData, 500);

});

setInterval(function updateData() {
    if (!(data.length)){
        return;
    }
        getRendered();
    dataset = [
        { label: "EKG Live-Stream", data: ekg, lines: { fill: false, lineWidth: 1.2 }, color: "#00FF00" }    
    ];
    $.plot($("#flot-live-chart"), dataset, options);
}, 5);