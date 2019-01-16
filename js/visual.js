// 定义属性集
const width=1800;
const height=800;
const rectHeight=26;
const margin={left:250,right:150,top:180,bottom:0};
const innerWidth=width-margin.left-margin.right;
const innerHeight=height-margin.top-margin.bottom;
const interval_time=0.5

// 临时测试数据,传入时需要按照时间排序（暂定）
let data=[
    {name: "张三", type: "魔法师", value: "12312", date: "01-01"},
    {name: "李四", type: "战士", value: "21412", date: "01-01"},
    {name: "王二麻子", type: "魔法师", value: "41243", date: "01-01"},
    {name: "张三", type: "魔法师", value: "22312", date: "01-02"},
    {name: "李四", type: "战士", value: "61412", date: "01-02"},
    {name: "王二麻子", type: "魔法师", value: "11243", date: "01-02"},
    {name: "张三", type: "魔法师", value: "32312", date: "01-03"},
    {name: "李四", type: "战士", value: "11412", date: "01-03"},
    {name: "王二麻子", type: "魔法师", value: "51243", date: "01-03"}
];

let colors=[];
let dateList=[];
let dateIndex=0;
let currentData=[];

// 定义两个快速得到X，Y值的函数
function xValue(e) {
    return Number(e.value)
}
function yValue(e) {
    return e.name;
}

// 获取所有的时间元素
function initDateAndColor() {

    let index=0;
    let baseColors=[
        "#FFB6C1","#00FFFF","#C71585","#FFFF00","#7B68EE","#0000CD","#000080",
        "#87CEFA","#DC143C","#F5FFFA","#8B008B","#FFD700","#FFA500","#FF8C00",
    ];

    data.forEach(e=>{
        if(dateList.indexOf(e.date)==-1){
            dateList.push(e.date);
        }

        if(colors[e.name] === undefined){
            colors[e.name]=baseColors[index%baseColors.length];
            index++;
        }

    });
    // FIXME: 如果不按照时间顺序传值，需要在次进行排序

}

// 获取当前时间节点的数据集合
function getCurrentData(date) {
    currentData=[];
    data.forEach(function (element) {
        if (element.date == date && parseFloat(element.value)>0){
            currentData.push(element);
        }
    });
    // 简单排序
    currentData.sort(function (a, b) {
        return b.value-a.value;
    })

}
// 画布
const svg=d3.select("#tcharts").append("svg").attr("width",width).attr("height",height);
const g=svg.append("g").attr('transform', `translate(${margin.left},${margin.top})`);
const xAxisG=g.append("g").attr('transform', `translate(0,${innerHeight})`);
const yAxisG=g.append("g");
// 比例尺
let xScale=d3.scaleLinear();
let yScale=d3.scaleBand().paddingInner(0.3).paddingOuter(0);
// 轴
let xAxis=d3.axisBottom()
    .scale(xScale)
    .ticks(10)
    .tickPadding(20)
    .tickFormat(d=>{
        return d<=0?'':d;
    })
    .tickSize(-innerHeight);
let yAxis=d3.axisLeft()
    .scale(yScale)
    .tickPadding(5)
    .tickSize(-innerWidth);

// 右下角时间指示器
g.append("text")
    .attr("class","dateLabel")
    .attr("text-anchor", "end")
    .attr('transform', `translate(${innerWidth-10},${innerHeight-10})`);

// 水平方向的动态效果
function redraw() {

    // 更新比例尺
    let x_min=d3.min(currentData,xValue);
    let x_max=d3.max(currentData,xValue);
    xScale.domain([2*x_min-x_max,x_max+10]).range([0,innerWidth]);
    yScale.domain(currentData.map(e=>e.name).reverse()).range([innerHeight,0]);

    xAxisG.transition().duration(3000*interval_time).ease(d3.easeLinear).call(xAxis);
    yAxisG.transition().duration(3000*interval_time).ease(d3.easeLinear).call(yAxis);

    yAxisG.selectAll(".tick").remove();

    // 选中所有bar并绑定数据（指定key函数）
    let bar=g.selectAll(".bar").data(currentData,e=>e.name);

    // enter
    let barEnter=bar.enter()
        .append("g")
        .attr("class","bar")
        .attr("transform", function (d) {
            return "translate(0," + yScale(yValue(d)) + ")";
        });

    // Y轴文字
    barEnter.append("text")
        .attr("x",-10)
        .attr("text-anchor","end")
        .attr("class","label")
        .style("fill",d=>colors[d.name])
        .text(function (d) {
            return yValue(d);
        })
        .attr("y",50)
        .attr("fill-opacity",0)
        .transition()
        .delay(500*interval_time)
        .duration(2490*interval_time)
        .attr("y",18)
        .attr("fill-opacity",1);

    // 矩形
    barEnter.append("rect")
        .attr("x",0)
        .attr("y",50)
        .attr("width",0)
        .attr("height",rectHeight)
        .attr("fill-opacity",0)
        .attr("fill",d=>colors[d.name])
        .transition()
        .delay(500*interval_time)
        .duration(2490*interval_time)
        .attr("y",0)
        .attr("width",d=>xScale(d.value))
        .attr("fill-opacity",1);

    // 矩形后的数字
    barEnter.append("text")
        .attr("text-anchor","end")
        .attr("x",10)
        .attr("y",50)
        .attr("fill-opacity",0)
        .attr("class","value")
        .style("fill",d=>colors[d.name])
        .transition()
        .duration(2950*interval_time)
        .tween("text_tween",function (d) {
            let self=this;
            self.textContent=d.value*0.8;
            let i=d3.interpolateRound(d.value*0.8,d.value);
            return function (t) {
                self.textContent=i(t);
            }
        })
        .attr("x",function (d) {
            // 根据数字大小计算x坐标（每个数字大概10px）
            let prefix=d.value.split(".");
            let strLength=prefix[0].length;
            return xScale(d.value)+strLength*16;
        })
        .attr("y",22)
        .attr("fill-opacity",1);

    // 矩形上的字
    barEnter.append("text")
        .attr("text-anchor","end")
        .attr("x",5)
        .attr("y",50)
        .attr("class", "barInfo")
        .attr("fill-opacity",0)
        .attr("stroke-width", "0px")
        .attr("stroke",d=>colors[d.name])
        .text(d=>d.name)
        .transition()
        .delay(500*interval_time)
        .duration(2450*interval_time)
        .attr("x",d=>xScale(xValue(d))-10)
        .attr("y",18)
        .attr("stroke-width", "1px")
        .attr("fill-opacity",1);

    // update,有可能是全新的一套数据，但是bar的位置已经确定，只需要更改颜色和样式即可
    let barUpdate=bar.transition().duration(2950*interval_time).ease(d3.easeLinear);

    barUpdate.select(".label")
        .text(d=>d.name)
        .style("fill",d=>colors[d.name]);

    barUpdate.select("rect")
        .attr("width",d=>xScale(d.value))
        .attr("fill",d=>colors[d.name]);

    barUpdate.select(".value")
        .style("fill",d=>colors[d.name])
        .tween("text_tween",function (d) {
            let self=this;
            let i=d3.interpolateRound(self.textContent,d.value);
            return function (t) {
                self.textContent=i(t);
            }
        })
        .attr("x",function (d) {
            // 根据数字大小计算x坐标（每个数字大概10px）
            let prefix=d.value.split(".");
            let strLength=prefix[0].length;
            return xScale(d.value)+strLength*16;
        });

    barUpdate.select(".barInfo")
        .style("stroke",d=>colors[d.name])
        .attr("x",d=>xScale(xValue(d))-10);

    // 更新dateLabel
    g.select(".dateLabel")
        .text(dateList[dateIndex]);

    // exit
}

function change() {
    g.selectAll(".bar")
        .transition()
        .ease(d3.easeLinear)
        .duration(3000*interval_time)
        .attr("transform", function (d) {
            return "translate(0," + yScale(yValue(d)) + ")";
        })
}


initDateAndColor();

function draw() {
    if(dateIndex<dateList.length){
        getCurrentData(dateList[dateIndex]);
        redraw();
        change();
        // dateIndex在redraw中会被用到，因此需要放在后面
        dateIndex++;
    }
}
setInterval(draw,1500);