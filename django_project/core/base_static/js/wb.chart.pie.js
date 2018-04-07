// don not combine with donut chart, same - but different
function pieChart(options) {
    var _INIT_TIME = new Date().getTime();
    var _ID = options.parentId + '_' + _INIT_TIME;
    var _CHART_TYPE = 'PIE_CHART';
    var _NAME = options.name;

    var parentId = options.parentId || 'chart';
    var titleClass = options.titleClass || 'wb-chart-title wb-pie';
    var svgClass = options.svgClass;

    var toolTipClass = options.toolTipClass || 'wb-pie-tooltip';


    var valueField = options.valueField || 'cnt';
    var labelField = options.labelField || 'group_id';


    var showTitle = options.showTitle || true;

    var title = options.title || 'Pie';

    var filterValueField = options.filterValueField;

    var height = options.height || 400;
    var defaultMargin = {
        top: 40,
        right: 20,
        bottom: 30,
        left: 60
    };

    var _legend = d3.select('#' + parentId).append('div')
        .attr('class', 'wb-pie-legend');



    var tooltipBackgroundPadding = 2;
    var opacity = .8;
    var opacityHover = 1;
    var otherOpacityOnHover = .6;
    var tooltipMargin = 13;

    // parent width
    var _svgWidth;

    // parent height
    var _svgHeight = height;

    // chart width
    var _width;

    // chart height
    var _height;

    // pie radius
    var _radius;

    var calculatedMargins = calcMargins(
        false, showTitle, defaultMargin
    );

    var _marginLeft = calculatedMargins._marginLeft;
    var _marginRight = calculatedMargins._marginRight;
    var _marginTop = calculatedMargins._marginTop;
    var _marginBot = calculatedMargins._marginBot;

    var parent = document.getElementById(parentId);


    var initialData = options.data || [];

    var _data;

    // data value helper
    var _xValue = function (d) {
        return d[valueField];
    };
    var _yLabel = function (d) {
        return d[labelField];
    };
    var _value = function (d) {
        return d.data[valueField];
    };
    var _key = function (d) {
        return d.data[labelField];
    };

    // helper fncs
    var _arc = d3.arc();
    var _outerArc = d3.arc();

    var _pie = d3.pie().sort(null).value(_xValue);
    var _color = d3.scaleOrdinal(d3.schemeCategory10);

    // main svg
    var _svg = d3.select('#' + parentId).append('svg').classed(svgClass, true);

    // groups
    var _chartGroup = _svg.append("g").classed('chart-group', true);
    var _titleGroup = _svg.append("g").classed('title-group', true);

    var _tooltipGroup = _svg.append("g").classed(toolTipClass, true).style("opacity", 0);
    var _tooltipLabelText = _tooltipGroup.append("text");
    var _tooltipLabelBackGround = _tooltipGroup.insert("rect", "text");

    var _labelLineGroup = _svg.append('g').classed('wb-pie-label-lines', true);


    function _sliceColor(d, i) {
        return _color(i);
    }

    function _setData(newData) {
        if (newData && newData instanceof Array) {
            _data = newData.slice(0);
        }
        return _data;
    }

    function _renderTitle() {
        if (showTitle === true && title && title !== '') {
            _titleGroup.append("text")
                .attr("class", titleClass)
                .text(title);
        }
    }

    function _updateTitle() {
        if (showTitle === true && title && title !== '') {
            _titleGroup
                .attr("x", (_width / 2) - _marginLeft / 2)
                .attr("y", 0 - (_marginTop / 2));
        }
    }

    function _handleMouseMove(d) {
        var mousePosition = d3.mouse(this);

        var x = mousePosition[0] + _width / 2;
        var y = mousePosition[1] + _height / 2 - tooltipMargin;

        var bbox = _tooltipLabelText.node().getBBox();

        if (x - bbox.width / 2 < 0) {
            x = bbox.width / 2;
        }
        else if (_width - x - bbox.width / 2 < 0) {
            x = _width - bbox.width / 2;
        }

        if (y - bbox.height / 2 < 0) {
            y = bbox.height + tooltipMargin * 2;
        }
        else if (_height - y - bbox.height / 2 < 0) {
            y = _height - bbox.height / 2;
        }

        _tooltipGroup
            .style("opacity", 1)
            .style("display", "block")
            .attr('transform', 'translate(' + x + ',' + y + ')');
    }

    function _handleMouseOut(d, i) {
        _tooltipGroup
            .style("opacity", 0)
            .style("display", "none");

        _chartGroup.selectAll('path')
            .style("opacity", opacity);
    }

    function _handleMouseOver(d) {
        // change opacity of all paths
        _chartGroup
            .selectAll('path')
            .style("opacity", otherOpacityOnHover);

        // change opacity of hovered
        d3.select(this).style("opacity", opacityHover);

        // update tooltip text
        _tooltipLabelText.text(_key(d) + _value(d));

        var bbox = _tooltipLabelText.node().getBBox();

        // update tooltip backround / rect
        _tooltipLabelBackGround
            .attr("x", bbox.x - tooltipBackgroundPadding)
            .attr("y", bbox.y - tooltipBackgroundPadding)
            .attr("width", bbox.width + (tooltipBackgroundPadding * 2))
            .attr("height", bbox.height + (tooltipBackgroundPadding * 2));
    }

    function _handleSliceClick (d) {
        if (options.clickHandler && options.clickHandler instanceof Function) {
            options.clickHandler({
                data: d,
                name: _NAME,
                filterValue: d.data[filterValueField],
                chartType: _CHART_TYPE,
                chartId: _ID
            });
        }
    }

    // calculates the angle for the middle of a slice, used for label line and text
    function _calcSliceMidPos(d) {
        return d.startAngle + (d.endAngle - d.startAngle) / 2;
    }

    function _calcLabelPos(d) {

        // computes the centre of the slice.
        // see https://github.com/d3/d3-shape/blob/master/README.md#arc_centroid
        var pos = _outerArc.centroid(d);

        // changes the point to be on left or right depending on where label is.
        pos[0] = _radius * 0.95 * (_calcSliceMidPos(d) < Math.PI ? 1 : -1);

        return pos;
    }

    function _calcSize () {
        var bounds = parent.getBoundingClientRect();

        _svgWidth = bounds.width;

        _width = _svgWidth - _marginLeft - _marginRight;

        _height = _svgHeight - _marginTop - _marginBot;

        _radius = Math.min(_width - _marginLeft, _height - _marginTop) / 2;
    }

    function _setSize() {
        _calcSize();

        _svg
            .attr("width", _svgWidth)
            .attr("height", _svgHeight);

        _chartGroup
            .attr("width", _width)
            .attr("height", _height)
            .attr("transform", "translate(" + [_svgWidth / 2, _svgHeight / 2] + ")");

        _labelLineGroup
            .attr("width", _width)
            .attr("height", _height)
            .attr("transform", "translate(" + [_svgWidth / 2, _svgHeight / 2] + ")");

        _titleGroup.attr("width", _width)
            .attr("height", _marginTop)
            .attr("transform", "translate(" + [_svgWidth / 2, _marginTop] + ")");

        _arc
            .outerRadius(_radius)
            .innerRadius(0);

        _outerArc
            .outerRadius(_radius)
            .innerRadius(_radius);


    }

    function _arcTween(a) {
        var i = d3.interpolate(this._current, a);

        this._current = i(0);

        return function (t) {
            return _arc(i(t));
        };
    }


    // the legend is absolute positioned, some overlap could occur on small screen sizes
    function _renderLegend() {
        // add legend
        var keys = _legend.selectAll('.wb-legend-row')
            .data(_data)
            .enter().append('div')
            .attr('class', 'wb-legend-row');

        keys.append('div')
            .attr('class', 'legend-symbol')
            .style('background-color', _sliceColor);

        keys.append('div')
            .attr('class', 'legend-label')
            .text(_yLabel);

        keys.exit().remove();
    }


    // render polyline from center of slice to text label
    // render text label
    function _renderLabels() {
        // add text labels
        var label = _labelLineGroup.selectAll('text')
            .data(_pie(_data));

        label
            .enter().append('text')
            .attr('dy', '.35em')
            .html(function (d) {
                return '<tspan>' + _key(d) + '(' + _value(d) + ')</tspan>';
            })
            .attr('transform', function (d) {
                return 'translate(' + _calcLabelPos(d) + ')';
            })
            .style('text-anchor', function (d) {
                // if slice centre is on the left, anchor text to start, otherwise anchor to end
                return (_calcSliceMidPos(d)) < Math.PI ? 'start' : 'end';
            });


        var polyline = _labelLineGroup
            .selectAll('polyline')
            .data(_pie(_data));

        polyline
            .enter()
            .append('polyline')
            .attr('points', function (d) {
                return [_arc.centroid(d), _outerArc.centroid(d), _calcLabelPos(d)]
            });

        // polyline.attr('points', function (d) {
        //         return [_arc.centroid(d), _outerArc.centroid(d), _calcLabelPos(d)]
        //     });

        polyline.exit().remove();
    }

    function _renderPie() {

        // JOIN / ENTER
        var elements = _chartGroup.selectAll('.wb-pie-arc')
            .data(_pie(_data), _key)
            .enter()
            .append('g')
            .attr("class", "wb-pie-arc");

        // UPDATE
        elements
            .transition()
            .duration(1500)
            .attrTween("d", _arcTween);

        // add slices / paths / attach events
        elements
            .append('path')
            .attr('d', _arc)
            .attr('fill', _sliceColor)
            .on("mousemove", _handleMouseMove)
            .on("mouseout", _handleMouseOut)
            .on("mouseover", _handleMouseOver)
            .on("click", _handleSliceClick)
            .each(function (d, i) {
                this._current = d;
            });

        elements.exit().remove();
    }

    function _renderChart(newData) {
        _setData(newData);

        _setSize();
        _updateTitle();
        _renderPie();
        //    _renderLegend();
        _renderLabels();
    }

    _renderTitle();
    _renderChart(initialData);

    function _resize() {
        _renderChart();
    }

    return {
        updateChart: _renderChart,
        resize: _resize,
        chart: _svg
    };
}
