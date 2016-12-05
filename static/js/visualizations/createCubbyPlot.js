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

define (['jquery', 'd3', 'd3tip', 'd3textwrap','underscore'],
function($, d3, d3tip, d3textwrap, _) {
    
    var tip = d3tip()
        .attr('class', 'd3-tip')
        .direction('n')
        .offset([0, 0])
        .html(function(d) {
        return '<span>log<sub>2</sub>(true counts / expected counts)</span><br/>'
                + '<span>log<sub>2</sub>(' + d['total'] + ' / ' + d['expected_total'].toFixed(4) + ')</span>'
        });

    var selex_active = false;
    var zoom_status = {
        translation: null,
        scale: null
    };

    // The samples in our data, bucketed by their corresponding
    // bar graph value
    var sampleSet = {};

    // The currently selected values on the bar graph, corresponding to the buckets
    // in the sampleSet
    var selectedCubbies = {};

    // The samples found in the selected value buckets; this is used to produce the JSON which
    // is submitted by the form
    var selectedSamples = null;

    return {
        data_totals: function(data, x_attr, y_attr, x_domain, y_domain) {
            var results_dict = {};
            var results = [];
            var x_item, y_item;
            var x_total = {};
            var y_total = {};

            for (x_item in x_domain) {
                x_total[x_domain[x_item]] = 0;
                for (y_item in y_domain) {
                    y_total[y_domain[y_item]] = 0;
                    var val = x_domain[x_item] + '-' + y_domain[y_item];
                    results_dict[val] = {x: x_domain[x_item], y: y_domain[y_item], total: 0};
                    if(!sampleSet[val]) {
                        sampleSet[val] = {
                            samples: {},
                            cases: new Set([])
                        };
                    }
                }
            }
            for (var i = 0; i < data.length; i++) {
                x_item = data[i][x_attr];
                y_item = data[i][y_attr];

                var val = x_item + '-' + y_item;

                results_dict[val]['total']++;

                sampleSet[val].samples['{'+data[i]['sample_id']+'}{'+data[i]['case_id']+'}'] = {sample: data[i]['sample_id'], case: data[i]['case_id']};
                sampleSet[val].cases.add(data[i]['case_id']);

                x_total[x_item] += 1;
                y_total[y_item] += 1;
            }
            var total = data.length;

            for (var key in x_total) {
                x_total[key] /= total;
            }
            for (var key in y_total) {
                y_total[key] /= total;
            }

            for (var key in results_dict) {
                var x = results_dict[key]['x'];
                var y = results_dict[key]['y'];
                results_dict[key]['expected_total'] = x_total[x] * y_total[y] * total;
                if (results_dict[key]['expected_total'] == 0) {
                    results_dict[key]['ratio'] = 0;
                } else {
                    results_dict[key]['ratio'] = results_dict[key]['total'] / results_dict[key]['expected_total'];
                }
                if (results_dict[key]['ratio'] == 0) {
                    results_dict[key]['log_ratio'] = 0;
                } else {
                    results_dict[key]['log_ratio'] = Math.log(results_dict[key]['ratio']);
                }
                results.push(results_dict[key]);
            }
            return results;
        },
        create_cubbyplot: function(svg, margin, data, domain, range, xLabel, yLabel, xParam, yParam, colourBy, legend, width, height, cubby_size) {
            var colorVal = function(d) { return d[colorBy]; };
            var color = d3.scale.category20();
            var x_band_width = (width - margin.left) / domain.length;
            var y_band_width = (height - margin.left) / range.length;
            var view_width = 800;
            var view_height = 700;
            var data_counts = this.data_totals(data, xParam, yParam, domain, range);

            // create x axis
            var x = d3.scale.ordinal()
                .domain(domain)
                .rangeBands([margin.left, width]);
            var xAxis = d3.svg.axis()
                .scale(x)
                .ticks(domain.length)
                .orient('bottom');

            // create y axis
            var y = d3.scale.ordinal()
                .domain(range)
                .rangeBands([0, height-margin.bottom]);
            var yAxis = d3.svg.axis()
                .scale(y)
                .ticks(range.length)
                .orient('left');

            // function for the x grid lines
            function make_x_axis() {
                return d3.svg.axis()
                    .scale(x)
                    .orient("bottom");
            }

            // function for the y grid lines
            function make_y_axis() {
                return d3.svg.axis()
                    .scale(y)
                    .orient("left");
            }

            // Create Clip area for axes
            var y_axis_area = svg.append('g')
                .attr('clip-path', 'url(#y_axis_area_clip)');

            y_axis_area.append('clipPath')
                .attr('id', 'y_axis_area_clip')
                .append('rect')
                .attr('height', view_height-margin.top-margin.bottom)
                .attr('width', margin.left)
                .attr('transform', 'translate(0,0)');

            var x_axis_area = svg.append('g')
                .attr('clip-path', 'url(#x_axis_area_clip)');

            if (height < view_height) {
                x_axis_area.append('clipPath')
                    .attr('id', 'x_axis_area_clip')
                    .append('rect')
                    .attr('height', margin.bottom+margin.top)
                    .attr('width', width-margin.left-margin.right)
                    .attr('transform', 'translate(' + margin.left + ',' + (height  - margin.bottom) + ')');

                x_axis_area.append('g')
                    .attr('class', 'x axis')
                    .attr('transform', 'translate(0,' + (height - margin.bottom) + ')')
                    .call(xAxis);
            } else {
                x_axis_area.append('clipPath')
                    .attr('id', 'x_axis_area_clip')
                    .append('rect')
                    .attr('height', margin.bottom+margin.top)
                    .attr('width', width-margin.left-margin.right)
                    .attr('transform', 'translate(' + margin.left + ',' + (view_height-margin.top-margin.bottom) + ')');
                x_axis_area.append('g')
                    .attr('class', 'x axis')
                    .attr('transform', 'translate(0,' + (view_height-margin.bottom-margin.top) + ')')
                    .call(xAxis);
            }

            // append axes
            y_axis_area.append('g')
                .attr('class', 'y axis')
                .attr('transform', 'translate('+margin.left+',0)')
                .call(yAxis)
                .selectAll('text')
                .style('text-anchor', 'middle')
                .attr('dy', -10)
                .attr('transform', 'rotate(-90)');

            var plot_area = svg.append('g')
                .attr('clip-path', 'url(#plot_area_clip)');

            plot_area.append('clipPath')
                .attr('id', 'plot_area_clip')
                .append('rect')
                .attr('height', view_height-margin.top-margin.bottom)
                .attr('width', view_width)
                .attr('transform', 'translate(' + margin.left + ',0)');


            var x_grid_height = view_height-margin.bottom;

            if (height < view_height) {
                x_grid_height = height-margin.bottom;
            }

            // append grid lines
            plot_area.append("g")
                .attr("class", "x grid")
                .attr('transform', 'translate(' +  (x_band_width/2-cubby_size) + ',' + x_grid_height + ')')
                .call(make_x_axis()
                    .tickSize(-x_grid_height, 0, 0)
                    .tickFormat("")
                );

            plot_area.append("g")
                .attr("class", "y grid")
                .attr('transform', 'translate('+margin.left+',-'+ Math.round(cubby_size/2) +')')
                .call(make_y_axis()
                    .tickSize(-width, 0, 0)
                    .tickFormat("")
                );

            // Create secondary axes used for panning
            var x2 = d3.scale.linear()
                .range([0, width])
                .domain([0, width]);
            var y2 = d3.scale.linear()
                .range([0, height])
                .domain([0, height]);

            var zoom_x = function() {
                if(!selex_active) {
                    svg.select('.x.grid').attr('transform', 'translate(' + (d3.event.translate[0] + x_band_width/2-cubby_size) + ','+x_grid_height+')');
                    svg.select('.x.axis').attr('transform', 'translate(' + d3.event.translate[0] + ',' + x_grid_height + ')').call(xAxis);
                    plot_area.selectAll('.expected_fill').attr('transform', 'translate(' + d3.event.translate[0] + ',0)');
                    plot_area.selectAll('text').attr('transform', 'translate(' + d3.event.translate[0] + ',0)');
                }
            };

            var zoom_y = function() {
                if(!selex_active) {
                    svg.select('.y.axis').attr('transform', 'translate(' + margin.left + ',' + (d3.event.translate[1]) + ')')
                        .call(yAxis)
                        .selectAll('text')
                        .style('text-anchor', 'middle')
                        .attr('dy', -10);
                    svg.select('.y.grid').attr('transform', 'translate(' + margin.left + ',' + (d3.event.translate[1] + (Math.round((-cubby_size) / 2))) + ')');

                    plot_area.selectAll('.expected_fill').attr('transform', 'translate(' + 0 + ',' + d3.event.translate[1] + ')');
                    plot_area.selectAll('text').attr('transform', 'translate(' + 0 + ',' + d3.event.translate[1] + ')');
                }
            };

            var zoom_xy = function() {
                if(!selex_active) {
                    if (height < view_height) {
                        svg.select('.x.axis').attr('transform', 'translate(' + d3.event.translate[0] + ',' + (height - margin.bottom) + ') scale(' + d3.event.scale + ',' + d3.event.scale + ')').call(xAxis);
                    } else {
                        svg.select('.x.axis').attr('transform', 'translate(' + d3.event.translate[0] + ',' + (view_height - margin.top - margin.bottom) + ') scale(' + d3.event.scale + ',' + d3.event.scale + ')').call(xAxis);
                    }
                    svg.select('.x.grid').attr('transform', 'translate(' + (d3.event.translate[0] + x_band_width / 2) + ',0) scale(' + d3.event.scale + ',' + d3.event.scale + ')');

                    svg.select('.y.axis').attr('transform', 'translate(' + margin.left + ',' + (d3.event.translate[1]) + ') scale(' + d3.event.scale + ',' + d3.event.scale + ')')
                        .call(yAxis)
                        .selectAll('text')
                        .style('text-anchor', 'middle')
                        .attr('dy', -10);
                    svg.select('.y.grid').attr('transform', 'translate(' + margin.left + ',' + (d3.event.translate[1] + (y_band_width * d3.event.scale) / 2) + ') scale(' + d3.event.scale + ',' + d3.event.scale + ')');

                    plot_area.selectAll('.expected_fill').attr('transform', 'translate(' + d3.event.translate[0] + ',' + d3.event.translate[1] + ') scale(' + d3.event.scale + ',' + d3.event.scale + ')');
                    plot_area.selectAll('text').attr('transform', 'translate(' + d3.event.translate[0] + ',' + d3.event.translate[1] + ') scale(' + d3.event.scale + ',' + d3.event.scale + ')');
                }
            };

            var zoom_none = function() { return;};

            var zoom = null;

            if (width > view_width && height> view_height) {
                zoom = d3.behavior.zoom()
                    .x(x2)
                    .scaleExtent([1,1])
                    .y(y2)
                    .scaleExtent([1,1])
                    .on('zoom', zoom_xy);
            } else if (width > view_width) {
                zoom = d3.behavior.zoom()
                    .x(x2)
                    .scaleExtent([1,1])
                    .on('zoom', zoom_x);
            } else if (height > view_height) {
                zoom = d3.behavior.zoom()
                    .y(y2)
                    .scaleExtent([1,1])
                    .on('zoom', zoom_y);
            } else {
                zoom = d3.behavior.zoom()
                    .x(x2)
                    .scaleExtent([1,1])
                    .y(y2)
                    .scaleExtent([1,1])
                    .on('zoom',zoom_none);
            }

            svg.call(zoom);


            plot_area.selectAll('.expected_fill')
                .data(data_counts)
                .enter().append('rect')
                .attr('class', 'expected_fill')
                .attr('value', function(d) { return d['x'] + '-' + d['y']; })
                .attr('fill', function(d) { return d['log_ratio'] > 0 ? 'red' : 'blue'; })
                .attr('fill-opacity', function(d) { return Math.abs(d['log_ratio']); })
                .attr('width', cubby_size)
                .attr('height', cubby_size)
                .attr('x', function(d) { return x(d['x']) + 1; })
                .attr('y', function(d) {
                    return y(d['y']);
                })
                .on('click', function() {
                    if(selex_active) {
                        var reCalc = false;
                        var oldSet = selectedCubbies;

                        // add/remove/hasClass won't work with SVG elements, but attr will
                        var obj_class = $(this).attr('class');
                        if (obj_class.indexOf('selected') >= 0) {
                            obj_class = obj_class.replace(' selected', '');
                        } else {
                            obj_class += ' selected';
                        }
                        $(this).attr('class', obj_class);

                        var oldSetKeys = Object.keys(oldSet);
                        if(oldSetKeys.length !== $('rect.expected_fill.selected').length) {
                            reCalc = true;
                        }

                        $('rect.expected_fill.selected').each(function () {
                            if(!oldSet[$(this).attr('value')]) {
                                reCalc = true;
                            }
                            selectedCubbies[$(this).attr('value')] = 1;
                        });

                        for(var i=0; i<oldSetKeys.length && !reCalc; i++) {
                            if(!selectedCubbies[oldSet[oldSetKeys[i]]]) {
                                reCalc = true;
                            }
                        }

                        sample_form_update({}, reCalc);
                    }
                });

            plot_area.selectAll('.counts')
                .data(data_counts)
                .enter().append('text')
                .attr('class', 'counts')
                .attr('x', function(d) { return x(d['x']) + x_band_width/2; })
                .attr('y', function(d) { return y(d['y']) + y_band_width/2; })
                .attr('font-family', 'sans-serif')
                .attr('font-size', '20px')
                .attr('fill', 'black')
                .attr('text-anchor', 'middle')
                .text(function(d) { return d['total']; });

            plot_area.selectAll('.expected_counts')
                .data(data_counts)
                .enter().append('text')
                .attr('class', 'expected_counts')
                .attr('x', function(d) { return x(d['x']) + 25; })
                .attr('y', function(d) { return y(d['y']) + 20; })
                .attr('font-family', 'sans-serif')
                .attr('font-size', '14px')
                .attr('fill', 'black')
                .attr('text-anchor', 'middle')
                .text(function(d) { return d['log_ratio'].toFixed(3); })
                .on('mouseover.tip', tip.show)
                .on('mouseout.tip', tip.hide);

            plot_area.call(tip);

            // append axes labels
            var xAxisXPos = (parseInt(svg.attr('width')>view_width ? view_width : svg.attr('width'))+margin.left)/2;
            var xAxisYPos = (svg.attr('height')>view_height ? view_height : svg.attr('height'))-20;
            svg.append('text')
                .attr('class', 'axis-label')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(' + xAxisXPos + ',' + xAxisYPos + ')')
                .text(xLabel);

            var yAxisXPos = (parseInt(svg.attr('height')>view_height ? view_height : svg.attr('height'))-margin.bottom)/2;
            svg.append('text')
                .attr('class', 'axis-label')
                .attr('text-anchor', 'middle')
                .attr('transform', 'rotate(-90) translate(-' + yAxisXPos + ',10)')
                .text(yLabel);

            // Wrap our value labels
            d3.select('.x.axis').selectAll('text').call(d3textwrap.textwrap().bounds({width: x.rangeBand(), height: margin.bottom*0.75}));
            d3.select('.x.axis').selectAll('foreignObject')
                .attr('style','transform: translate(-'+(x.rangeBand()*0.5)+'px,0px);');

            d3.select('.y.axis').selectAll('text').call(d3textwrap.textwrap().bounds({width: margin.left*0.75, height: y.rangeBand()}));
            d3.select('.y.axis').selectAll('foreignObject')
                .attr('style','transform: translate(-'+margin.left*0.75+'px,-'+y.rangeBand()*0.50+'px);');

            $('foreignObject div').each(function(){
                $(this).attr('title',$(this).html())
            });

            var check_selection_state = function(obj) {
                selex_active = !!obj;
                if (obj) {
                    // Disable zooming events and store their status
                    svg.on('.zoom',null);
                    zoom_status.translation = zoom.translate();
                    $('.save-cohort-card').attr('style','position: absolute; top: '+($('.worksheet-content').outerHeight()-$('.plot-container').outerHeight())
                        +'px; left: '+($('.worksheet-content').width()-$('.save-cohort-card').outerWidth())+'px;');
                    $('.save-cohort-card').show();
                } else {
                    // Resume zooming, restoring the zoom's last state
                    svg.call(zoom);
                    zoom_status.translation && zoom.translate(zoom_status.translation);
                    zoom_status.translation = null;

                    var plot_id = $(svg[0]).parents('.plot').attr('id').split('-')[1];
                    // Clear selections
                    $(svg[0]).parents('.plot').find('.selected-samples-count').html('Number of Samples: ' + 0);
                    $(svg[0]).parents('.plot').find('.selected-patients-count').html('Number of Participants: ' + 0);
                    $('#save-cohort-'+plot_id+'-modal input[name="samples"]').attr('value', "");
                    selectedCubbies = {};
                    selectedSamples = null;
                    svg.selectAll('.selected').classed('selected', false);
                    $('.save-cohort-card').hide();
                }
            };

             /*
                Update the sample cohort bar update
             */
            function sample_form_update(extent, reCalc){
                if(reCalc) {
                    var case_set = {};
                    selectedSamples = {};
                    _.each(Object.keys(selectedCubbies),function(val) {
                        _.each(Object.keys(sampleSet[val]['samples']),function(sample) {
                            selectedSamples[sample] = sampleSet[val]['samples'][sample];
                            case_set[sampleSet[val]['samples'][sample]['case']] = 1;
                        });
                    });

                    $(svg[0]).parents('.plot').find('.selected-samples-count').html('Number of Samples: ' + Object.keys(selectedSamples).length);
                    $(svg[0]).parents('.plot').find('.selected-patients-count').html('Number of Cases: ' + Object.keys(case_set).length);
                    $('.save-cohort-card').find('.btn').prop('disabled', (Object.keys(selectedSamples).length <= 0));
                }
            }

            $('.save-cohort-card').find('.btn').on('click',function(e){
                if(Object.keys(selectedCubbies).length > 0){
                    var selected_sample_set = [];
                    _.each(Object.keys(selectedSamples),function(sample){
                        selected_sample_set.push(selectedSamples[sample]);
                    });

                    var plot_id = $(svg[0]).parents('.plot').attr('id').split('-')[1];
                    $('#save-cohort-' + plot_id + '-modal input[name="samples"]').attr('value', JSON.stringify(selected_sample_set));
                }
            });

            function resize() {
                width = svg.node().parentNode.offsetWidth - 10;
                //TODO resize plot
            }

            function check_selection_state_wrapper(bool){
                check_selection_state(bool);
            }

            return {
                resize                : resize,
                check_selection_state : check_selection_state_wrapper
            }
        }
    };
});
