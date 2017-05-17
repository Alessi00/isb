/**
 *
 * Copyright 2016, Institute for Systems Biology
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

define (['jquery', 'd3', 'd3tip', 'd3textwrap', 'vizhelpers', 'underscore'],
    function($, d3, d3tip, d3textwrap, vizhelpers, _) {

    // The samples in our data, bucketed by their corresponding
    // bar graph value
    var sampleSet = {};

    // The currently selected values on the bar graph, corresponding to the buckets
    // in the sampleSet
    var selectedValues = {};

    // The samples found in the selected value buckets; this is used to produce the JSON which
    // is submitted by the form
    var selectedSamples = null;

    // If you want to override the tip coming in from the create call,
    // do it here
    var barTip = d3tip()
        .attr('class', 'd3-tip')
        .direction('n')
        .offset([0, 0])
        .html(function(d) {
            return d.value+': '+d.count;
        });

    var selex_active = false;
    var zoom_status = {
        translation: null,
        scale: null
    };

    return {

        dataCounts: function(data, x_attr) {
            var counts = {};
            var results = [];

            for (var i = 0; i < data.length; i++) {
                var val = data[i][x_attr];
                if(!counts[val]) {
                    counts[val] = 0;
                }
                counts[val] += 1;

                if(!sampleSet[val]) {
                    sampleSet[val] = {
                        samples: {},
                        cases: new Set([])
                    };
                }

                sampleSet[val].samples['{'+data[i]['sample_id']+'}{'+data[i]['case_id']+'}'] = {sample: data[i]['sample_id'], case: data[i]['case_id'], project: data[i]['project']};
                sampleSet[val].cases.add(data[i]['case_id']);
            }

            for (var key in counts) {
                results.push({'value': key, 'count': counts[key]});
            }

            return results;
        },
        createBarGraph: function(svg, raw_Data, width, height, bar_width,  x_attr, xLabel, tip, margin, legend) {
            tip = barTip || tip;
            var data = this.dataCounts(raw_Data, x_attr);
            var plot_width = (bar_width+5) * data.length;

            var x = d3.scale.ordinal()
                .domain(data.map(function(d) { return d.value; }))
                .rangeRoundBands([0, plot_width], .1);
            var xAxis = d3.svg.axis()
                .scale(x)
                .orient('bottom');
            var y = d3.scale.linear()
                .range([height-margin.bottom-margin.top, 0])
                .domain([0, d3.max(data, function(d) { return d.count; })])
                .nice();
            var yAxis = d3.svg.axis()
                .scale(y)
                .orient('left')
                .tickSize(-width + margin.right + margin.left, 0, 0);

            var zoomer = function() {
                if(!selex_active) {
                    svg.select('.x.axis').attr('transform', 'translate(' + (d3.event.translate[0] + margin.left) + ',' + (height - margin.bottom - margin.top - 40) + ')').call(xAxis);
                    svg.selectAll('.x.axis text').style('text-anchor', 'end').attr('transform', 'translate(' + -15 + ',' + 10 + ') rotate(-90)');
                    plot_area.selectAll('.plot-bar').attr('transform', 'translate(' + d3.event.translate[0] + ',0)');
                }
            };

            var x2 = d3.scale.linear()
                .range([0, width])
                .domain([0, width]);

            var zoom = d3.behavior.zoom()
                .x(x2)
                .scaleExtent([1,1])
                .on('zoom', zoomer);

            svg.call(zoom);

            var plot_area = svg.append('g')
                .attr('clip-path', 'url(#plot_area_clip)')
                .attr('transform','translate(0,'+margin.top+')');

            plot_area.append('clipPath')
                .attr('id', 'plot_area_clip')
                .append('rect')
                .attr({ width: width-margin.left - margin.right,
                        height: height-margin.top - margin.bottom})
                .attr('transform', 'translate(' + margin.left + ',0)');

            plot_area.selectAll(".plot-bar")
                .data(data)
                .enter().append("rect")
                    .attr("class", "plot-bar")
                    .attr("x", function(d) { return x(d.value) + margin.left; })
                    .attr("y", function(d) {
                        return y(d.count);
                    })
                    .attr('value', function(d) { return d.value; })
                    .attr("width", x.rangeBand())
                    .attr("height", function(d) { return height - margin.bottom - margin.top - y(d.count); })
                .on('mouseover.tip', tip.show)
                .on('mouseout.tip', tip.hide);

            var x_axis_area = svg.append('g')
                .attr('clip-path', 'url(#x_axis_area_clip)');

            x_axis_area.append('clipPath')
                .attr('id', 'x_axis_area_clip')
                .append('rect')
                .attr('height', margin.bottom+margin.top)
                .attr('width', width-margin.left-margin.right)
                .attr('transform', 'translate(' + margin.left + ',' + (height  - margin.bottom) + ')');

            x_axis_area.append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(' + margin.left + ',' + (height - margin.bottom - margin.top - 40) + ')')
                .call(xAxis)
                .selectAll('text')
                .style('text-anchor', 'end')
                .attr('transform', 'translate(' + -15 + ',' + 10 + ') rotate(-90)');


            d3.select('.x.axis').selectAll('text').each(function(){
                var d = d3.select(this);
                var label = d.text();
                var parent = d3.select(d.node().parentNode);
                d.remove();
                var fOb = parent.append('foreignObject')
                    .attr('requiredFeatures', 'http://www.w3.org/TR/SVG11/feature#Extensibility')
                    .attr('width', margin.bottom-55)
                    .attr('height', bar_width);

                fOb.append('xhtml:div')
                    .style('height', bar_width)
                    .style('width', margin.bottom-55)
                    .attr('class','truncated-single')
                    .attr('title',label)
                    .html(label);
            });

            d3.select('.x.axis').selectAll('foreignObject').attr('style','transform: translate(-15px,'+margin.bottom+'px) rotate(-90deg);');

            // Highlight the selected rectangles whenever the cursor is moved
            var brushmove = function(p) {
                var e = brush.extent();
                var reCalc = false;
                var oldSet = selectedValues;
                selectedValues = {};
                svg.selectAll('rect.plot-bar').classed("selected", function (d) {
                    return e[0]-margin.left <= x($(this).attr('value')) + parseInt($(this).attr('width'))
                        && x($(this).attr('value')) <= e[1]-margin.left;
                });

                if(Object.keys(oldSet).length !== $('rect.plot-bar.selected').length) {
                    reCalc = true;
                }

                $('rect.plot-bar.selected').each(function () {
                    if(!oldSet[$(this).attr('value')]) {
                        reCalc = true;
                    }
                    selectedValues[$(this).attr('value')] = 1;
                });

                var oldSetKeys = Object.keys(oldSet);
                for(var i=0; i<oldSetKeys.length && !reCalc; i++) {
                    if(!selectedValues[oldSet[oldSetKeys[i]]]) {
                        reCalc = true;
                    }
                }

                sample_form_update(e, reCalc);
            };

            // If the brush is empty, select all circles.
            var brushend = function() {
                if (brush.empty()) {
                    svg.selectAll(".hidden").classed("hidden", false);
                    $('.save-cohort-card').hide();
                }
            };

            var brush = d3.svg.brush()
                .x(x2)
                .on('brushstart',function(d){
                    selectedValues = {};
                    selectedSamples = null;
                })
                .on('brush', brushmove)
                .on('brushend', brushend);

            svg.call(tip);

            // append axes
            svg.append('g')
                .attr('class', 'y axis')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
                .call(yAxis);

            // append axes labels
            svg.append('g')
                .attr('class','x-label-container')
                .append('text')
                .attr('class', 'x label axis-label')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + (width/2) + ',' + (height - 10) + ')')
                .text(xLabel);

            d3.select('.x.label').call(d3textwrap.textwrap().bounds({width: (width-margin.left)*0.75, height: 50}));
            d3.select('.x-label-container').selectAll('foreignObject').attr('style','transform: translate('+((width/2)-(((width-margin.left)*0.75)/2)) + 'px,' + (height - 50)+'px);');
            d3.select('.x-label-container').selectAll('div').attr('class','axis-label');

            svg.append('text')
                .attr('class', 'y label axis-label')
                .attr('text-anchor', 'middle')
                .text('Number of Samples')
                .attr('transform', 'rotate(-90) translate(' + ((-1 * (height/2))+($('.y.label.axis-label').outerWidth()/2)) + ',20)');

            var check_selection_state = function(obj) {

                selex_active = !!obj;

                if (obj) {
                    // Disable zooming events and store their status
                    svg.on('.zoom',null);
                    zoom_status.translation = zoom.translate();
                    // Append new brush event listeners to plot area only
                    plot_area.append('g')
                        .attr('class', 'brush')
                        .call(brush)
                        .selectAll('rect')
                        .attr('y', 0)
                        .attr('height', height - margin.bottom)
                        .attr('transform', 'translate(0, 0)');
                } else {
                    // Resume zooming, restoring the zoom's last state
                    svg.call(zoom);
                    zoom_status.translation && zoom.translate(zoom_status.translation);
                    zoom_status.translation = null;

                    var plot_id = $(svg[0]).parents('.plot').attr('id').split('-')[1];
                    // Clear selections
                    $(svg[0]).parents('.plot').find('.selected-samples-count').html('Number of Samples: ' + 0);
                    $(svg[0]).parents('.plot').find('.selected-patients-count').html('Number of Cases: ' + 0);
                    $('#save-cohort-'+plot_id+'-modal input[name="samples"]').attr('value', "");
                    svg.selectAll('.selected').classed('selected', false);
                    $('.save-cohort-card').hide();
                    selectedValues = {};
                    selectedSamples = null;
                    // Remove brush event listener plot area - comment out if we want to enable selection carry-over
                    brush.clear();
                    plot_area.selectAll('.brush').remove();
                }
            };

            //Update the sample cohort bar update
            function sample_form_update(extent, reCalc){

                if(reCalc) {
                    var case_set = {};
                    selectedSamples = {};
                    _.each(Object.keys(selectedValues),function(val) {
                        _.each(Object.keys(sampleSet[val]['samples']),function(sample) {
                            selectedSamples[sample] = sampleSet[val]['samples'][sample];
                            case_set[sampleSet[val]['samples'][sample]['case']] = 1;
                        });
                    });

                    $(svg[0]).parents('.plot').find('.selected-samples-count').html('Number of Samples: ' + Object.keys(selectedSamples).length);
                    $(svg[0]).parents('.plot').find('.selected-patients-count').html('Number of Cases: ' + Object.keys(case_set).length);
                    $('.save-cohort-card').find('.btn').prop('disabled', (Object.keys(selectedSamples).length <= 0));
                }

                var leftVal = Math.min((x2(extent[1]) + 20),(width-$('.save-cohort-card').width()));
                $('.save-cohort-card').show()
                    .attr('style', 'position:relative; top: -' + height + 'px; left:' + leftVal + 'px;');

            };

            function resize() {
                width = svg.node().parentNode.offsetWidth - 10;
                //TODO resize plot
            };

            function check_selection_state_wrapper(bool){
                check_selection_state(bool);
            };

            $('.save-cohort-card').find('.btn').on('click',function(e){
                if(Object.keys(selectedValues).length > 0){
                    var selected_sample_set = [];
                    _.each(Object.keys(selectedSamples),function(sample){
                        selected_sample_set.push(selectedSamples[sample]);
                    });

                    console.debug("Plot element: "+$(svg[0]).parents('.plot'));
                    var plot_id = $(svg[0]).parents('.plot').attr('id').split('-')[1];
                    $('#save-cohort-' + plot_id + '-modal input[name="samples"]').attr('value', JSON.stringify(selected_sample_set));
                }

            });


            return {
                resize                : resize,
                check_selection_state : check_selection_state_wrapper
            }
        }
    };
});
