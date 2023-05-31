$(document).ready(function() {
    var home_Path = window.location.host;
    var netAdj = null;
    var eigenValue = null;
    var eigenVector = null;
    var eigVecSvg = null;
    var eigValSvg = null;
    var app = new Vue({
        el: '#parameter', 
        data: {
            blockNumber: 3,
            symmetricBlockSize: 20,
            blockSizes: [20, 20, 20, 20, 20],
            symmetricPin: 0.8,
            symmetricPout: 0.2,
            omega: [[0.8, 0.2, 0.2, 0.2, 0.2], [0.2, 0.8, 0.2, 0.2, 0.2], [0.2, 0.2, 0.8, 0.2, 0.2], [0.2, 0.2, 0.2, 0.8, 0.2], [0.2, 0.2, 0.2, 0.2, 0.8]],
            operator: 'A',
            r: 1,
            eigenIndex: 1,
        },
        methods: {
            update_svg: function(data) {
                d3.select("body").select("#eigenvector_content").select("svg").remove();
                var width = $('#eigenvector_content').width();    // 可视区域宽度
                var height = width;   // 可视区域高度
                eigVecSvg = d3.select("body").select("#eigenvector_content")
                        .append("svg")
                        .attr("width", width).attr("height", height);
                
                d3.select("body").select("#eigenvalue_content").select("svg").remove();
                width = $('#eigenvalue_content').width();    // 可视区域宽度
                height = width;   // 可视区域高度
                eigValSvg = d3.select("body").select("#eigenvalue_content")
                        .append("svg")
                        .attr("width", width).attr("height", height/5);
            },
            postNetData: function() {
                $("#ex6").attr('max', this.symmetricBlockSize*this.blockNumber);
                // $("#ex6").slider({
                //     max : this.symmetricBlockSize*this.blockNumber, 
                //     reversed : true
                // });
                $('#sel1').val('A');
                $("#ex5").prop("disabled", true);
                $.ajax({
                    type: 'POST',
                    url: `http://${home_Path}/network/`,
                    data: {'blockSize':this.symmetricBlockSize, 'blockNumber':this.blockNumber, 'cin':this.symmetricPin, 'cout':this.symmetricPout},
                    // update spy figure
                    success: data => {
                        console.log(data);
                        netAdj = data['adj'];
                        var size = netAdj.length;
                        var width = $('#net').width()
                        var height = width
                        d3.select('body').select("#net").select("svg").remove();
                        d3.select('body').select("#net").append("svg")
                            .attr("width", width)
                            .attr("height", height)
                            .selectAll("rect")
                            .data(netAdj)
                            .enter()
                            .append("g")
                            .selectAll("rect")
                            .data(function (d,i) {return d;})
                            .enter()
                            .append("rect")
                            .attr("x", function(d,i){
                                        return i*width/size;
                            })
                            .attr("y", function(d, i, j){
                                        return j*width/size;
                            })
                            .attr("height", width/size * 0.75)
                            .attr("width", width/size * 0.75)
                            .attr("fill", function (d,i) {
                                if (d > 0) {
                                    return 'blue';
                                } else {
                                    return "gray"
                                }
                            })
                            .attr("text", function (d,i) {return d;});
                        this.update_svg(data);
                        this.update_eigen(data);
                    }
                });
            },
            change_operator: function () {
                var val = $("#sel1 option:selected").text();
                console.log(this.operator);
                console.log(this.r)
                if (val == 'BH') {
                    $("#ex5").prop("disabled", false);
                } else {
                    $("#ex5").prop("disabled", true);
                }
                $.ajax({
                    type: 'POST',
                    url: `http://${home_Path}/network/change_operator/`,
                    data: {'operator': this.operator, 'r': this.r},
                    // update spy figure
                    success: data => {
                        console.log(data);
                        this.update_svg(data);
                        this.update_eigen(data);
                    }
                });
            },
            update_eigen: function(data) {
                if (data.hasOwnProperty('eigenValue')) {
                    eigenValue = data['eigenValue'];
                }
                if (data.hasOwnProperty('eigenVector')) {
                    eigenVector = data["eigenVector"];
                }
                // 获取最小和最大的特征向量的值
                var minEigVec = 0;
                var maxEigVec = 0;
                for (let i = 0; i < this.symmetricBlockSize * this.blockNumber; i++) {
                    if (i == 0) {
                        minEigVec = d3.min(eigenVector[i]);
                        maxEigVec = d3.max(eigenVector[i]);
                    } else {
                        if (d3.min(eigenVector[i]) < minEigVec) {
                            minEigVec = d3.min(eigenVector[i]);
                        }
                        if (d3.max(eigenVector[i]) > maxEigVec) {
                            maxEigVec = d3.max(eigenVector[i])
                        }
                    }
                }
        
                // 构造绘制点的dataset
                y = eigenVector[this.eigenIndex-1];
                x = Array.from(Array().keys());
                var eigVecDataset = []
                for (let i = 0; i < this.symmetricBlockSize * this.blockNumber; i++) {
                    eigVecDataset.push([i, y[i]]);
                }
                // var dataset = [[0.5, 0.5],[0.7, 0.8],[0.4, 0.9],
                //     [0.11, 0.32],[0.88, 0.25],[0.75, 0.12],
                //     [0.5, 0.1],[0.2, 0.3],[0.4, 0.1]];
        
                var eigVecWidth = $('#eigenvector_content').width() * 0.8;    // 可视区域宽度
                var eigVecHeight = eigVecWidth;   // 可视区域高度
        
                var eigVecxAxisWidth = eigVecWidth;   // x轴宽度
                var eigVecyAxisWidth = eigVecWidth - 30;   // y轴宽度
        
                var padding = {top: 30, right: 20, bottom:20, left:30};
        
                /*定义比例尺*/
                var eigVecxScale = d3.scale.linear()
                        .domain([0, this.symmetricBlockSize * this.blockNumber + 10])
                        .range([0, eigVecxAxisWidth]);
        
                var eigVecyScale = d3.scale.linear()
                        .domain([minEigVec, maxEigVec])
                        .range([0, eigVecyAxisWidth]);
                
                
                /* 绘制圆点 */
                function drawCircle(svg, dataset, xScale, yScale, height, ss, r, obviousShow){
                    var circleUpdate = svg.selectAll("circle").data(dataset);
                    // update处理
                    circleUpdate.transition().duration(500)
                            .attr("cx", function(d){
                                return padding.left + xScale(d[0]);
                            })
                            .attr("cy", function(d, i){
                                return height - padding.bottom - yScale(d[1]);
                            })
                            .attr("r", function(d, i){
                                if (obviousShow != null && i == obviousShow) {
                                    return r + 3;
                                } else {
                                    return r;
                                }
                            })
                            .attr('fill', function(d, i) {
                                return ss[i];
                            });
        
                    // enter处理
                    circleUpdate.enter().append("circle")
                            .attr("cx", function(d){
                                return padding.left + xScale(d[0]);
                            })
                            .attr("cy", function(d, i){
                                return height - padding.bottom;
                            })
                            .attr("r", function(d, i){
                                if (obviousShow != null && i == obviousShow) {
                                    return r + 3;
                                } else {
                                    return r;
                                }
                            })
                            .transition().duration(500)
                            .attr("cx", function(d, i){
                                return padding.left + xScale(d[0]);
                            })
                            .attr("cy", function(d, i){
                                return height - padding.bottom - yScale(d[1]);
                            })
                            .attr('fill', function(d, i) {
                                return ss[i];
                            });
                    // exit处理
                    circleUpdate.exit()
                            .transition().duration(500)
                            .attr("fill", "white")
                            .remove();
        
                }
        
                /* 添加坐标轴 */
                function drawScale(svg, xScale, yScale, yAxisWidth, height, yStepNum){
                    var xAxis = d3.svg.axis().scale(xScale).orient("bottom");
                    yScale.range([yAxisWidth, 0]);  // 重新设置y轴比例尺的值域,与原来的相反
                    var yAxis = d3.svg.axis().scale(yScale).orient("left");
                    if (yStepNum != null) {
                        yAxis.ticks(yStepNum);
                    }
                    svg.append("g").attr("class", "axis")
                            .attr("transform", "translate("+ padding.left +","+ (height - padding.bottom) +")")
                            .call(xAxis);
        
                    svg.append("g").attr("class", "axis")
                            .attr("transform", "translate("+ padding.left +","+ (height - padding.bottom - yAxisWidth) +")")
                            .call(yAxis);
        
                    // 绘制完比例尺,还原比例尺y轴值域
                    yScale.range([0, yAxisWidth]);
                }
                
                /* 颜色 */
                var ss = ["#CC0000", '#0000FF', '#00FF00', '#FF9900', '#CC00CC']
                var eigVecColors = [];
                for (i = 0; i < this.blockNumber * this.symmetricBlockSize; i++) {
                    var accumulate = 0;
                    for (j = 0; j < this.blockNumber; j++) {
                        if (accumulate <= eigVecDataset[i][0] && eigVecDataset[i][0] < accumulate + this.symmetricBlockSize) {
                            eigVecColors[i] = ss[j];
                            break;
                        } else {
                            accumulate += this.symmetricBlockSize;
                        }
                    }
                }
                
                // 初始化特征向量绘制
                drawCircle(eigVecSvg, eigVecDataset, eigVecxScale, eigVecyScale, eigVecHeight, eigVecColors, 2, null);
                drawScale(eigVecSvg, eigVecxScale, eigVecyScale, eigVecyAxisWidth, eigVecHeight, null);
                // 初始化特征值绘制
                var eigValDataset = []
                for (let i = 0; i < this.symmetricBlockSize * this.blockNumber; i++) {
                    eigValDataset.push([eigenValue[i], 0]);
                }
                var eigValWidth = $('#eigenvalue_content').width();    // 可视区域宽度
                var eigValHeight = eigValWidth / 5;   // 可视区域高度
                var eigValxAxisWidth = eigValWidth - 20;   // x轴宽度
                var eigValyAxisWidth = eigValWidth / 5;   // y轴宽度
                /*定义比例尺*/
                out = 2 * ((d3.max(eigenValue) - d3.min(eigenValue))/(this.symmetricBlockSize * this.blockNumber));
                var eigValxScale = d3.scale.linear()
                        .domain([d3.min(eigenValue) - out, d3.max(eigenValue) + out])
                        .range([0, eigValxAxisWidth]);
        
                var eigValyScale = d3.scale.linear()
                        .domain([0, 1])
                        .range([0, eigValyAxisWidth]);
                var eigValColors = [];
                eigValColors[this.eigenIndex-1] = '#CC0000';
                drawCircle(eigValSvg, eigValDataset, eigValxScale, eigValyScale, eigValHeight, eigValColors, 3, this.eigenIndex-1);
                drawScale(eigValSvg, eigValxScale, eigValyScale, eigValyAxisWidth, eigValHeight, 2);
            },
        }
    });
    app.postNetData();
    window.change_operator = app.change_operator;
    $("#ex5").prop("disabled", true);
});

