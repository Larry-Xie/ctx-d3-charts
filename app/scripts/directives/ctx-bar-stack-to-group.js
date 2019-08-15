// Copyright © Citrix Systems, Inc.  All rights reserved.
'use strict';

angular.module('cwc.d3')
    .directive('ctxBarStackToGroup', ['$window', 'd3',
        function ($window, d3) {
            return {
                restrict: 'A',
                scope: {
                    config: '=',
                    label: '@',
                    onClick: '&',
                    showAsGroup: '<'
                },
                link: function (scope, element) {
                    // Init data
                    var barHeight = scope.config.barHeight || 80,
                        barLabelPadding = scope.config.barLabelPadding || 8,
                        barPadding = scope.config.barPadding || 5,
                        fontHeight = scope.config.fontHeight || 10,
                        groupBarHeight = scope.config.groupBarHeight || 10,
                        groupBarLabelPadding = scope.config.groupBarLabelPadding || 8,
                        groupBarPadding = scope.config.groupBarPadding || 6,
                        leftLabelPadding = scope.config.leftLabelPadding || 0,
                        leftLabelWidth = scope.config.leftLabelWidth || 0,
                        margin = scope.config.margin || { left: 0, right: 0 },
                        minBarWidth = scope.config.minBarWidth || 0,
                        minBarWithTextWidth = scope.config.minBarWithTextWidth || 50,
                        overlap = 1, // may exist 1px gap between 2 bars
                        suffixFree = scope.config.suffixFree || '',
                        suffixPaid = scope.config.suffixPaid || '',
                        suffixTotal = scope.config.suffixTotal || '',
                        totalBarWidth = scope.config.totalBarWidth || 50,
                        totalPadding = (scope.config.totalPadding || 4) + overlap;
                    var switchToGroup = false;

                    // Add an svg container and set its width to 100%
                    var svg = d3.select(element[0])
                        .append('svg')
                        .style('width', '100%');

                    // When resize window, fresh variables
                    $window.onresize = function () {
                        scope.$apply();
                    };

                    // When resize window, re-render
                    scope.$watch(function () {
                        return element[0].clientWidth;
                    }, function () {
                        scope.render(scope.config);
                    });

                    scope.$watch('showAsGroup', function (newVal) {
                        switchToGroup = newVal;
                        scope.config.showTotal = !newVal;
                        scope.render();
                    });

                    // Get sum of series (free 1, paid 9, sum 10)
                    var sumOfSeries = function (series) {
                        var sum = [], i, j;
                        if (!series || series.length === 0) {
                            return;
                        }
                        for (j = 0; j < series[0].data.length; j++) {
                            sum.push(series[0].data[j]);
                        }
                        for (i = 1; i < series.length; i++) {
                            for (j = 0; j < series[i].data.length; j++) {
                                sum[j] += series[i].data[j];
                            }
                        }
                        return sum;
                    };

                    var sumOfStackedStatus = function (series) {
                        var status = [], i, j;
                        if (!series || series.length === 0) {
                            return false;
                        }
                        for (j = 0; j < series[0].data.length; j++) {
                            var isEmpty = series[0].data[j] === 0 ? true : false;
                            status.push(isEmpty);
                        }
                        for (i = 1; i < series.length; i++) {
                            for (j = 0; j < series[i].data.length; j++) {
                                status[j] += series[i].data[j] === 0;
                            }
                        }
                        return status;
                    };

                    // Find the maximum number of the summed series numbers
                    var maxSumOfSeries = function (series) {
                        return Math.max.apply(null, sumOfSeries(series));
                    };

                    // Render the stacked chart
                    scope.render = function () {
                        // Empty the svg container
                        svg.selectAll('*').remove();

                        var elementWidth = element[0].clientWidth,
                            width = elementWidth - margin.left - leftLabelWidth - leftLabelPadding - margin.right - totalPadding - totalBarWidth - minBarWithTextWidth;
                        if (width <= 0 || !scope.config || !scope.config.series) {
                            return;
                        }
                        var series = scope.config.series,
                            // Height is the svg height (yAxis)
                            height = scope.config.series[0].data.length * (barHeight + barPadding) - barPadding + 4,
                            // Color is passed from config
                            color = scope.config.color ? function (c) { return scope.config.color[c % scope.config.color.length]; } : d3.scale.category20(),
                            // xSacle reflect 0-maxSum to 0-calculatedWidth
                            xScale = d3.scale.linear()
                                .domain([0, maxSumOfSeries(series)])
                                .range([0, width]),
                            // Left stacked bar start position
                            leftStartPosition = margin.left + leftLabelWidth + leftLabelPadding; // equals 0 here

                        // Set svg height
                        svg.attr('height', height).attr('class', 'bar-stack-to-group-yAxis');
                        var sourceData = { 'xScale': xScale, 'series': series, 'leftStartPosition': leftStartPosition, 'color': color };
                        if (switchToGroup) {
                            scope.renderGroup(sourceData);
                        } else {
                            scope.renderStack(sourceData);
                            scope.renderTotal(sourceData);
                        }
                    };


                    scope.renderGroup = function (sourceData) {
                        // Iterate Free and Paid separatly, i.e. Free with all rows of free data, 3 rows for example, position each row with rect
                        for (var index = 0; index < sourceData.series.length; index++) {
                            // series[index].data is an array like [93, 1], indicate free/paid for each customer (different row of bars)
                            svg.append('g')
                                .attr('class', 'bar-stack')
                                .selectAll('rect')
                                .data(sourceData.series[index].data) // i.e. [88, 1] [5, 0]
                                .enter()
                                .append('rect') // Draw each with an rect
                                .attr('height', groupBarHeight) // Each bar height is groupBarHeight
                                .attr('x', function () {
                                    return sourceData.leftStartPosition;
                                })
                                .attr('y', function (d, i) {
                                    return i * (2 * groupBarHeight + barPadding + groupBarPadding) + 2 + (index ? groupBarHeight + barPadding : 0);
                                })
                                .attr('width', 0)
                                .attr('fill', sourceData.color(index))
                                .transition()
                                .duration(500)
                                .attr('width', function (d) {
                                    var width = sourceData.xScale(d);

                                    if (width < minBarWithTextWidth && width !== 0) {
                                        return minBarWithTextWidth + overlap;
                                    }

                                    if (width === 0) {
                                        return width;
                                    }

                                    return width + overlap;
                                });

                            // Add label position on the bar
                            if (scope.config.showLabel) {
                                svg.append('g')
                                    .attr('class', 'bar-stack-to-group-group-text')
                                    .selectAll('text')
                                    .data(sourceData.series[index].data) // i.e. [88, 1] [5, 0]
                                    .enter()
                                    .append('text')
                                    .text(function (d) {
                                        var suffix = '';
                                        if (sourceData.series[index].name.toLowerCase() === 'free') {
                                            suffix = ' ' +  suffixFree;
                                        } else if (sourceData.series[index].name.toLowerCase() === 'paid') {
                                            suffix = ' ' + suffixPaid;
                                        }
                                        // ignore text when width too narrow
                                        return sourceData.xScale(d) > minBarWidth ? d + suffix : '';
                                    })
                                    .attr('y', function (d, i) {
                                        // Alias for below: index === 0 => return i * (2 * groupBarHeight + groupBarPadding + barPadding) + fontHeight)
                                        // else => return i * (2 * groupBarHeight + groupBarPadding + barPadding) + fontHeight + (groupBarHeight + barPadding);
                                        return i * (2 * groupBarHeight + groupBarPadding + barPadding) + fontHeight + (index === 0 ? 0 : (groupBarHeight + barPadding));
                                    })
                                    .attr('x', function (d, i) {
                                        var textPos = groupBarLabelPadding;
                                        var textLength = d3.select(this).node().getComputedTextLength();
                                        textPos += sourceData.xScale(sourceData.series[index].data[i]) !== 0 && (sourceData.xScale(sourceData.series[index].data[i]) < minBarWithTextWidth) ? minBarWithTextWidth : sourceData.xScale(sourceData.series[index].data[i]);
                                        return textPos + textLength;
                                    });
                            }
                        }
                    };

                    scope.renderStack = function (sourceData) {
                        // Iterate Free and Paid separatly, i.e. Free with all rows of free data, 3 rows for example, position each row with rect
                        for (var index = 0; index < sourceData.series.length; index++) {
                            // series[index].data is an array like [93, 1], indicate free/paid for each customer (different row of bars)
                            svg.append('g')
                                .attr('class', 'bar-stack')
                                .selectAll('rect')
                                .data(sourceData.series[index].data) // i.e. [88, 1] [5, 0]
                                .enter()
                                .append('rect') // Draw each with an rect
                                .attr('height', barHeight) // Each bar height is barHeight
                                .attr('x', function (d, i) {
                                    // Set x position of each bar row, first column of rows start at leftStartPosition, others will plus a pos value
                                    var pos = 0;
                                    for (var x = 0; x < index; x++) {
                                        // When not the first column of row, see if data not 0 & after scale < minBarWithTextWidth, if yes, pos = minBarWithTextWidth
                                        if (sourceData.xScale(sourceData.series[x].data[i]) !== 0 && sourceData.xScale(sourceData.series[x].data[i]) < minBarWithTextWidth) {
                                            pos += minBarWithTextWidth + 2;
                                        } else if (sourceData.xScale(sourceData.series[x].data[i]) !== 0 && sourceData.xScale(sourceData.series[x].data[i]) > minBarWithTextWidth) {
                                            pos += sourceData.xScale(sourceData.series[x].data[i]) + 2;
                                        } else {
                                            pos += sourceData.xScale(sourceData.series[x].data[i]);
                                        }
                                    }
                                    return sourceData.leftStartPosition + pos;
                                })
                                .attr('y', function (d, i) {
                                    return i * (barHeight + barPadding) + 2;
                                })
                                .attr('width', 0)
                                .attr('fill', sourceData.color(index))
                                .transition()
                                .duration(500)
                                .attr('width', function (d) {
                                    var width = sourceData.xScale(d);

                                    if (width < minBarWithTextWidth && width !== 0) {
                                        return minBarWithTextWidth + overlap;
                                    }

                                    if (width === 0) {
                                        return width;
                                    }

                                    return width + overlap;
                                });

                            // Add label position on the bar
                            if (scope.config.showLabel) {
                                svg.append('g')
                                    .attr('class', 'bar-stack-to-group-stack-text')
                                    .selectAll('text')
                                    .data(sourceData.series[index].data)
                                    .enter()
                                    .append('text')
                                    .attr('y', function (d, i) {
                                        return i * (barHeight + barPadding) + barHeight / 2 + fontHeight / 2;
                                    })
                                    .attr('x', function (d, i) {
                                        var textPos = sourceData.leftStartPosition - barLabelPadding; // 0-14 = -14
                                        textPos += sourceData.xScale(sourceData.series[index].data[i]) !== 0 && (sourceData.xScale(sourceData.series[index].data[i]) < minBarWithTextWidth) ? minBarWithTextWidth : sourceData.xScale(sourceData.series[index].data[i]);
                                        for (var x = 0; x < index; x++) {
                                            textPos += sourceData.xScale(sourceData.series[x].data[i]) !== 0 && (sourceData.xScale(sourceData.series[x].data[i]) < minBarWithTextWidth) ? minBarWithTextWidth : sourceData.xScale(sourceData.series[x].data[i]);
                                        }
                                        return textPos;
                                    })
                                    .text(function (d) {
                                        var suffix = '';
                                        if (sourceData.series[index].name.toLowerCase() === 'free') {
                                            suffix = ' ' + suffixFree;
                                        } else if (sourceData.series[index].name.toLowerCase() === 'paid') {
                                            suffix = ' ' + suffixPaid;
                                        }
                                        // ignore text when width too narrow
                                        return sourceData.xScale(d) > minBarWidth ? d + suffix : '';
                                    });
                            }
                        }
                    };

                    scope.renderTotal = function (sourceData) {
                        var total = { name: suffixTotal };
                        // Calculate sum of series after scale to help calculate Total stack position
                        var sumOfSeriesAfterScale = function (series) {
                            var sum = [], i, j, width;
                            if (!series || series.length === 0) {
                                return;
                            }
                            for (j = 0; j < series[0].data.length; j++) {
                                width = sourceData.xScale(series[0].data[j]);
                                if (width < minBarWithTextWidth && width !== 0) {
                                    sum.push(minBarWithTextWidth);
                                } else {
                                    sum.push(width);
                                }
                            }
                            for (i = 1; i < series.length; i++) {
                                for (j = 0; j < series[i].data.length; j++) {
                                    width = sourceData.xScale(series[i].data[j]);
                                    if (width < minBarWithTextWidth && width !== 0) {
                                        sum[j] += minBarWithTextWidth;
                                    } else {
                                        sum[j] += width;
                                    }
                                }
                            }
                            return sum;
                        };

                        var combinedSeriesSum = function (series) {
                            var combinedSum = [], k;
                            if (!series || series.length === 0) {
                                return;
                            }
                            var sum = sumOfSeries(series);
                            var scaleSum = sumOfSeriesAfterScale(series);
                            var stackedStatusSum = sumOfStackedStatus(series);
                            for (k = 0; k < sum.length; k++) {
                                combinedSum.push({ 'sum': sum[k], 'scalesum': scaleSum[k], 'stackedstatussum': stackedStatusSum[k] });
                            }
                            return combinedSum;
                        };

                        // Set total data with combined value of max length and max scaled length of the free and paid bar
                        total.data = combinedSeriesSum(sourceData.series);

                        if (scope.config.showTotal) {
                            svg.append('g')
                                .attr('class', 'bar-stack-to-group-total')
                                .selectAll('rect')
                                .data(total.data)
                                .enter()
                                .append('rect')
                                .attr('height', barHeight)
                                .attr('x', function (d) {
                                    return d.stackedstatussum === 0 ? sourceData.leftStartPosition + totalPadding + d.scalesum : sourceData.leftStartPosition + totalPadding + d.scalesum - 2;
                                })
                                .attr('y', function (d, i) {
                                    return i * (barHeight + barPadding) + 2;
                                })
                                .attr('width', function () {
                                    return 0;
                                })
                                .transition()
                                .duration(500)
                                .attr('width', function () {
                                    return totalBarWidth;
                                });

                            svg.append('g')
                                .attr('class', 'bar-stack-to-group-text-total')
                                .selectAll('text')
                                .data(total.data)
                                .enter()
                                .append('text')
                                .text(function (d) {
                                    return d.sum + ' ' + suffixTotal;
                                })
                                .attr('x', function (d) {
                                    var textLength = d3.select(this).node().getComputedTextLength();
                                    return sourceData.leftStartPosition + totalPadding + d.scalesum + (totalBarWidth - textLength) / 2;  // totalPadding = 4 + 1;
                                })
                                .attr('y', function (d, i) {
                                    return i * (barHeight + barPadding) + barHeight / 2 + fontHeight / 2;
                                });
                        }
                    };
                }
            };
        }]);