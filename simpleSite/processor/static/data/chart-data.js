//Flot Multiple Axes Line Chart
$(function() {
    var EKG_Value = chartdata;

    function euroFormatter(v, axis) {
        return v.toFixed(axis.tickDecimals) + "mV";
    }

    function doPlot(position) {
        $.plot($("#flot-line-chart-multi"), [{
            data: EKG_Value,
            label: "EKG_Value(mV)"
        }], {
            xaxes: [{
                min: 0
            }],
            yaxes: [{
                min: -1,
                max: 2
            }, {
                // align if we are to the right
                alignTicksWithAxis: position == "right" ? 1 : null,
                position: position,
                tickFormatter: euroFormatter
            }],
            legend: {
                position: 'sw'
            },
            grid: {
                hoverable: true //IMPORTANT! this is needed for tooltip to work
            },
            tooltip: true,
            tooltipOpts: {
                content: "%s for %x was %y",

                onHover: function(flotItem, $tooltipEl) {
                    // console.log(flotItem, $tooltipEl);
                }
            }

        });
    }

    doPlot("right");

    $("button").click(function() {
        doPlot($(this).text());
    });
});