import { MessageService } from "./../../super/service/messageService";
import { StoreService } from "./../../super/service/storeService";
import { AjaxService } from "src/app/super/service/ajaxService";
import { Component, OnInit, ViewChild, AfterViewInit } from "@angular/core";
import { GlobalService } from "src/app/super/service/globalService";
import config from "../../../config";
declare const d3: any;
declare const Venn: any;

@Component({
    selector: "app-diff-component",
    templateUrl: "./expressVenn.component.html",
    styles: []
})
export class ExpressVennComponent implements OnInit, AfterViewInit {
    // 表格高度相关
    @ViewChild("left") left;
    @ViewChild("right") right;
    @ViewChild("func") func;
    @ViewChild("tableSwitchChart") tableSwitchChart;

    switch: boolean = false;
    tableUrl: string;
    chartUrl: string;
                   
    venSelectAllData:string [] = []; //1111111111
    selectConfirmData:string [] = [];

    tableEntity: object = {};

    panelShow:boolean=false;

    selectPanelData: object[] = [];
    venn_or_upsetR:boolean;

    p_show:boolean;//设置里面的PossionDis
    PessionDis:object = {
        log2FC:'',
        FDR:''
    }

    n_show:boolean;//设置里面的NOIseq
    NOIseq:object={
        log2FC:'',
        probability:''
    }

    //单选
    singleMultiSelect: object = {
        name: ""
    }; 

    //多选
    doubleMultiSelect: object = {
        bar_name: "",
        total_name: ""
    }; 
    pageEntity: object = {
        pageSize: 20
    };

    chart: any;
    isMultiSelect: boolean;
    selectedData: object[] = [];

    tableHeight = 0;
    constructor(
        private message: MessageService,
        private store:StoreService,
        private ajaxService: AjaxService,
        private globalService: GlobalService
    ) {}

    ngOnInit() {
        this.isMultiSelect = false;
        this.tableUrl = "";
        this.chartUrl = `${config["javaPath"]}/Venn/diffGeneGraph`;

        this.p_show=this.store.getStore("diff_threshold").hasOwnProperty('PossionDis'); //设置里面的PossionDis
        this.PessionDis={
            log2FC:this.p_show?this.store.getStore("diff_threshold").PossionDis.log2FC:'',
            FDR:this.p_show?this.store.getStore("diff_threshold").PossionDis.FDR:''
        }
        
        this.n_show=this.store.getStore("diff_threshold").hasOwnProperty('NOIseq');//设置里面的NOIseq
        this.NOIseq={
            log2FC:this.n_show?this.store.getStore("diff_threshold").NOIseq.log2FC:'',
            probability:this.n_show?this.store.getStore("diff_threshold").NOIseq.probability:''
        }
        
        this.selectPanelData=[//差异面板的数据
            {
                type: "compareGroup",
                data: this.store.getStore("diff_plan")
            }
        ];

        this.tableEntity = {//查询参数
            LCID: this.store.getStore("LCID"),
            compareGroup: this.store.getStore("diff_plan"),
            geneType: "gene",
            species: this.store.getStore("genome"),
            diffThreshold: this.store.getStore("diff_threshold")
        };

        // 订阅windowResize 重新计算表格滚动高度
        this.message.getResize().subscribe(res => {
            if (res["message"] === "resize") this.computedTableHeight();
            // 基础图需要重画
            this.redrawChart(this.left.nativeElement.offsetWidth * 0.9);
        });

    }

    getVennOrUpsetR() { //二次查询
        this.ajaxService
            .getDeferData({
                url: `${config["javaPath"]}/Venn/diffGeneGraph`,
                data: this.tableEntity
            })
            .subscribe(
                data => {
                    this.drawVenn(data['data']);
                },
                error => {
                    console.log(error);
                }

            );
    }

    drawVenn(data) {//封装组件事件返回调用函数+二次调用显示数据
        if (data["total"].length > 5) {
            this.venn_or_upsetR = true;
            this.showUpSetR(data);
        } else {
            this.venn_or_upsetR = false;
            this.showVenn(data);
        }
        
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.computedTableHeight();
        }, 0);
    }

    switchChange(status) {
        this.switch = status;
        // 基础图需要重画
        let timer = null;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            this.redrawChart(this.left.nativeElement.offsetWidth * 0.9);
        }, 300);
    }

    computedTableHeight() {
        this.tableHeight =
            this.right.nativeElement.offsetHeight -
            this.func.nativeElement.offsetHeight;
    }


    OnChange(value: string): void{//设置里面的PossionDis的log2FC
        this.PessionDis['log2FC']=value;
    }
    OnChange2(value: string): void{//设置里面的PossionDis的FDR
        this.PessionDis['FDR']=value;
    }

    OnChange3(value: string): void{//设置里面的NOIseq的log2FC
        this.NOIseq['log2FC']=value;
    }
    OnChange4(value: string): void{//设置里面的NOIseq的FDR
        this.NOIseq['probability']=value;
    }

    panelChange(){
        console.log(this.panelShow)
        this.panelShow=!this.panelShow
    }
    setCancle(){
        this.panelShow=false;
    }

    setConfirm(){ //设置下拉面板点击确定时候的两个参数
        if(this.p_show){
            this.tableEntity['diff_threshold']={
                PessionDis:this.PessionDis
            }
        }
        if(this.n_show){
            this.tableEntity['diff_threshold']={
                NOIseq:this.NOIseq
            }
        }

        this.panelShow=false;
        console.log(this.tableEntity['diff_threshold'])
    }

    //单、多选change
    multiSelectChange() {
        if(!this.venn_or_upsetR){//1111111111
            this.updateVenn()
        }                    
    }

    //venn和upsetR只选择一项时候
    doSingleData(data){         //1111111111
        console.log(data)
    }

    updateVenn(){                            //1111111111
        this.tableEntity['compareGroup'] = this.selectConfirmData;
        this.getVennOrUpsetR();
    }


    //多选确定,可以选多个柱子,维恩               //1111111111
    multipleConfirm() { 
        let tempData = this.venn_or_upsetR?this.doubleMultiSelect:this.venSelectAllData;
        console.log(tempData);
    }

    //选择面板，默认选中数据
    defaultSelectList(data) {
        this.selectConfirmData = data;
        //console.log(data)
    }

    //选择面板 确定筛选的数据
    selectConfirm(data) {                      //1111111111
        this.selectConfirmData = data;
        this.updateVenn();
    }

    redrawChart(width, height?) {
        this.isMultiSelect = false;
    }

    //显示venn图
    showVenn(data) {
        let _selfV = this;

        console.log(_selfV.isMultiSelect);
        let tempA = data.rows.map(o => {
            return { CompareGroup: o.name, Count: o.value };
        });
        let tempR = [];
        for (let index = 0; index < tempA.length; index++) {
            const element = tempA[index];
            let tempO = {
                result: element
            };
            tempR.push(tempO);
        }

        let oVenn = new Venn({ id: "chartId22122" })
            .config({
                data: tempR,
                compareGroup: _selfV.tableEntity['compareGroup'],//1111111111
                isMultipleSelect: _selfV.isMultiSelect
            })
            .drawVenn()
            .hover(function () {
                this.$select.$el.setAttribute('opacity', '0.5')
            }, function () {
                this.$select.$el.setAttribute('opacity', '0')
            })
            .on('click', function () {
                if(!_selfV.isMultiSelect){
                    _selfV.doSingleData(this.$select.$data.result.CompareGroup); //1111111111
                }else{
                    let tempVenn=[];
                    this.selectCollection.forEach(element => {
                        tempVenn.push(element.result.CompareGroup)
                    });
                    _selfV.venSelectAllData=tempVenn;
                }
            });
    }
    //显示upsetR图
    showUpSetR(data) {
        document.getElementById("chartId22122").innerHTML = "";
        let _self = this;
        let selectBar = [];
        let tempBar = data.rows;
        for (let index = 0; index < tempBar.length; index++) {
            const element = tempBar[index].value;
            if (element != 0) {
                selectBar.push(tempBar[index]);
            }
        }

        let t_chartID = document.getElementById("chartId22122");
        let str = `<svg id='svg' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'>
         <style>
             .MyRect {
                 cursor: pointer;
             }
             
             .noactive{
                 fill:#333;
             }
             .active{
                 fill: steelblue;
             }

             .MyCircle {
                 //fill: gray;
             }
             .axis_x1{
                 display: none;
             }
             .axis_y1{
                 /* display: none; */
             }
             .axis_x2{
                 /* display: none; */
             }
             .axis_y2{
                   display: none;
             }
             .axis_xk{
                
             }
             .axis_yk{
                display: none;
             }
            .axis_R {
                display: none;
            }
            .axis_R {
                display: none;
            }

             .axis_xCircle {
                 display: none;
             }
             .axis_yCircle {
                 display: none;
             }
             .MyText{
                 cursor: pointer;
                 overflow: hidden;
                text-overflow:ellipsis;
                white-space: nowrap;
             }
         
             .MyRect3{
                 cursor: pointer;
             }
             .textStyle{
                 font-size: 15px;
                 cursor: pointer;
             }
         </style>
     </svg>`;
        t_chartID.innerHTML = str;

        let List = {
            total: data.total,
            //rows:data.rows,
            rows: selectBar
        };

        //左侧数据
        let total_name = [];
        let total_value = [];
        let total_name_max = [];
        for (let i = 0; i < List.total.length; i++) {
            total_name_max.push(getBLen(List.total[i].name));
            total_name.push(List.total[i].name);
            total_value.push(List.total[i].value);
        }

        let max_name=Math.max.apply(null, total_name_max);
        let target_name='';
        for(let i = 0; i < total_name_max.length; i++){
            if(max_name==total_name_max[i]){
                target_name=total_name[i];
                break;
            }
        }

        let mText = d3.select("#chartId22122").append('svg').append('text').text(target_name).attr('class','mText');
        let left_name_length = mText.nodes()[0].getBBox().width;
        //let left_name_length = document.querySelector(".mText").getBBox().width;
        if(left_name_length>100){
            left_name_length=100;
        }
        mText.remove();
        let kong_name_right=10;
        //console.log(left_name_length)

        //上侧数据
        let bar_name = [];
        let bar_value = [];
        for (let i = 0; i < List.rows.length; i++) {
            bar_name.push(List.rows[i].name);
            bar_value.push(List.rows[i].value);
        }

        let d3_xScale; //矩阵圆点的x轴
        let d3_yScale; //矩阵圆点的y轴
        let d3_rectWidth = 16; //柱子的宽度
        let d3_rectKong = 6; //柱子间的间宽
        let d3_xlength = bar_value.length; //矩阵圆点的x轴有多少柱子
        let d3_ylength = total_value.length; //矩阵圆点的y轴有多少柱子

        let d3_width =
            d3_rectWidth * d3_xlength + d3_rectKong * (d3_xlength + 1);
        let d3_height =
            d3_rectWidth * d3_ylength + d3_rectKong * (d3_ylength + 1);

        let nameList = [];
        let tempName = {};
        let drawCircle = [];
        let tempThat;
        let tempP;
        let tempCricle; //圆
        let tempThatTwo; 

        let padding1 = { left: 60, right: 30, top: 20, bottom: 10 };
        let padding2 = { left: 0, right: 10, top: 0, bottom: 30 };

        let svg_height =
            300 +
            d3_height +
            padding1.top +
            padding1.bottom +
            padding2.top +
            padding2.bottom; //计算最外层svg高度
        let svg_width =
            320 +
            d3_width +
            padding1.left +
            padding1.right +
            padding2.left +
            padding2.right; //计算最外层svg宽度

        let svg = d3
            .select("#svg")
            .attr("width", svg_width)
            .attr("height", svg_height);

        drawSvg();
        drawSvg2();
        drawSvgName();
        drawSvg3();

        function drawSvg() {
            let width1 = d3_width + padding1.left + padding1.right;
            let height1 = 300;

            let svg1 = d3
                .select("#svg")
                .append("svg")
                .attr("x", "320")
                .attr("y", "0")
                .attr("width", width1)
                .attr("height", height1)
                .attr("class","svg1");
            let xScale1 = d3
                .scaleBand()
                .domain(bar_name)
                .range([0, d3_width])
                .paddingOuter(0.1)
                .paddingInner(1);
            let yScale1 = d3
                .scaleLinear()
                .domain([0, d3.max(bar_value)])
                .range([height1 - padding1.bottom - padding1.top, 0]);

            d3_xScale = xScale1;
            let xAxis1 = d3.axisBottom(xScale1);
            let yAxis1 = d3.axisLeft(yScale1).ticks(5);

            let rects1 = svg1.selectAll("MyRect1")
                .data(bar_value)
                .enter()
                .append("g")
                .on("mouseover", function(d, i) {
                    let tipText = `name: ${bar_name[i]}<br> value:  ${d}`;
                    _self.globalService.showPopOver(d3.event, tipText);
                })
                .on("mouseout", () => {
                    _self.globalService.hidePopOver();
                })
                .on("click", function(d, i) {
                    if (!_self.isMultiSelect) {
                        if(d3.select(this).select(".MyRect").attr("fill")=="#333"){
                            d3.selectAll(".MyRect").attr("fill", "#333");
                            d3.select(this).select(".MyRect").attr("fill", "steelblue");
                            _self.singleMultiSelect["name"] = bar_name[i];
                            _self.doubleMultiSelect["bar_name"] = bar_name[i];
                            _self.doSingleData(bar_name[i]);
                        }else if(d3.select(this).select(".MyRect").attr("fill")=="steelblue"){
                            d3.selectAll(".MyRect").attr("fill", "#333");
                            d3.select(this).select(".MyRect").attr("fill", "#333");
                            _self.singleMultiSelect["name"] = "";
                            _self.doubleMultiSelect["bar_name"] = "";
                            _self.doSingleData('');
                        }
                    } else {
                        if(d3.select(this).select(".MyRect").attr("fill")=="#333"){
                            d3.select(".svg1").selectAll(".MyRect").attr("fill", "#333");
                            d3.select(this).select(".MyRect").attr("fill", "steelblue");
                            _self.doubleMultiSelect["bar_name"] = bar_name[i];
                        }else if(d3.select(this).select(".MyRect").attr("fill")=="steelblue"){
                            d3.select(".svg1").selectAll(".MyRect").attr("fill", "#333");
                            d3.select(this).select(".MyRect").attr("fill", "#333");
                            _self.doubleMultiSelect["bar_name"] = '';
                        }
                        console.log(_self.doubleMultiSelect)
                    }
                });

            rects1.append("rect")
                .attr("class", "MyRect")
                .attr(
                    "transform",
                    "translate(" + padding1.left + "," + padding1.top + ")"
                )
                .attr("x", function(d, i) {
                    return xScale1(bar_name[i]);
                })
                .attr("y", function(d, i) {
                    return yScale1(d);
                })
                .attr("width", d3_rectWidth)
                .attr("height", function(d, i) {
                    return height1 - padding1.bottom - padding1.top - yScale1(d);
                })
                .attr("fill", "#333")
                .attr("stroke-width", 10)
                .attr("stroke", "#333")
                .attr("stroke-opacity", 0);

            svg1.append("g")
                .attr("class", "axis_x1")
                .attr("transform","translate(" +padding1.left +"," +(height1 - padding1.bottom) +")")
                .call(xAxis1);
            svg1.append("g")
                .attr("class", "axis_y1")
                .attr("transform","translate(" + padding1.left + "," + padding1.top + ")")
                .call(yAxis1);
        }

        function drawSvg2() {
            let width2 = 320-left_name_length-kong_name_right;
            let height2 = d3_height + padding2.top + padding2.bottom;

            let svg2 = d3
                .select("#svg")
                .append("svg")
                .attr("x", padding1.left)
                .attr("y", "300")
                .attr("width", width2)
                .attr("height", height2)
                .attr("class","svg2");

            let xScale2 = d3
                .scaleLinear()
                .domain([0, d3.max(total_value)])
                .range([width2-padding2.right, 0]);

            let yScale2 = d3
                .scaleBand()
                .domain(total_name)
                .range([d3_height, 0]);

            d3_yScale = yScale2;

            let xAxis2 = d3.axisBottom(xScale2).ticks(4);
            let yAxis2 = d3.axisRight(yScale2);

            let rects2 = svg2
                .selectAll("MyRect2")
                .data(total_value)
                .enter()
                .append("g")
                .on("mouseover", function(d,i){
                    let tipText = `name: ${total_name[i]}<br> value:  ${d}`;
                    _self.globalService.showPopOver(d3.event, tipText);
                })
                .on("mouseout", () => {
                    _self.globalService.hidePopOver();
                })
                .on("click", function(d, i) {
                    if (!_self.isMultiSelect) {
                        if(d3.select(this).select(".MyRect").attr("fill")=="#333"){
                            d3.selectAll(".MyRect").attr("fill", "#333");
                            d3.select(this).select(".MyRect").attr("fill", "steelblue");
                            _self.singleMultiSelect["name"] = total_name[i];
                            _self.doubleMultiSelect["total_name"] = total_name[i];
                            _self.doSingleData(total_name[i]);
                        }else if(d3.select(this).select(".MyRect").attr("fill")=="steelblue"){
                            d3.selectAll(".MyRect").attr("fill", "#333");
                            d3.select(this).select(".MyRect").attr("fill", "#333");
                            _self.singleMultiSelect["name"] = "";
                            _self.doubleMultiSelect["total_name"] = "";
                            _self.doSingleData('');
                        }
                    } else {
                        if(d3.select(this).select(".MyRect").attr("fill")=="#333"){
                            d3.select(".svg2").selectAll(".MyRect").attr("fill", "#333");
                            d3.select(this).select(".MyRect").attr("fill", "steelblue");
                            _self.doubleMultiSelect["total_name"] = total_name[i];
                        }else if(d3.select(this).select(".MyRect").attr("fill")=="steelblue"){
                            d3.select(".svg2").selectAll(".MyRect").attr("fill", "#333");
                            d3.select(this).select(".MyRect").attr("fill", "#333");
                            _self.doubleMultiSelect["total_name"] = '';
                        }
                        console.log(_self.doubleMultiSelect)
                    }
                });

            rects2.append("rect")
                .attr("class", "MyRect")
                .attr("x", function(d, i) {
                    return xScale2(d) + padding2.left;
                })
                .attr("y", function(d, i) {
                    return yScale2(total_name[i]);
                })
                .attr("width", function(d, i) {
                    return width2 - padding2.right - xScale2(d) - padding2.left;
                })
                .attr("height", function(d, i) {
                    return d3_rectWidth;
                })
                .attr("fill", "#333")
                .attr("stroke-width", 10)
                .attr("stroke", "#333")
                .attr("stroke-opacity", 0);

            svg2.append("g")
                .attr("class", "axis_x2")
                .attr("transform","translate(" +padding2.left +"," +(height2 - padding2.bottom) +")")
                .call(xAxis2)
                .selectAll("text")
                .attr("fontsize","12");
            svg2.append("g")
                .attr("class", "axis_y2")
                .attr("transform","translate(" +(width2-padding2.right) +"," +padding2.top +")")
                .call(yAxis2);
        }
        
        function drawSvgName(){
            let widthk = left_name_length+kong_name_right;
            let heightk = d3_height + padding2.top + padding2.bottom;

            let svgk = d3
                .select("#svg")
                .append("svg")
                .attr("x", 320-left_name_length-kong_name_right+padding1.left)
                .attr("y", "300")
                .attr("width", widthk)
                .attr("height", heightk)
                .attr("class","svgk");
            
            let yScalek = d3
                .scaleBand()
                .domain(total_name)
                .range([d3_height, 0]);

            let yAxisk = d3.axisLeft(yScalek);
            
            let textsk = svgk
                .selectAll("text")
                .data(total_name)
                .enter()
                .append("text")
                .attr("class", "MyText")
                .attr("width",left_name_length)
                .attr("dx", function(d, i) {
                    return 0;
                })
                .attr("dy", function(d, i) {
                    return yScalek(total_name[i]) + d3_rectKong * 2;
                })
                .text(function(d, i) {
                    return d;
                })
                .on("click", function(d, i) {
                    sortName(d, d3.select(this));
                });
            svgk.append("g")
                .attr("class", "axis_yk")
                .attr("transform","translate(" +(0) +"," +padding2.top +")")
                .call(yAxisk);
        }

        function sortName(d, that) {
            if (nameList.length == 0) {
                nameList.push(d);
                tempName[d] = true;
                that.style("fill", "red");
            } else {
                if (tempName[d]) {
                    for (let i = 0; i < nameList.length; i++) {
                        if (nameList[i] == d) {
                            nameList.splice(i, 1);
                            tempName[d] = false;
                            that.style("fill", "black");
                        }
                    }
                } else {
                    nameList.push(d);
                    tempName[d] = true;
                    that.style("fill", "red");
                }
            }

            nameToCircle(nameList);
        }

        function drawSvg3() {
            let width3 = d3_width + padding1.left + padding1.right;
            let height3 = d3_height + padding2.top + padding2.bottom;

            let svg3 = d3
                .select("#svg")
                .append("svg")
                .attr("x", "320")
                .attr("y", "300")
                .attr("width", width3)
                .attr("height", height3);

            tempThat = svg3;

            let xAxis3 = d3.axisBottom(d3_xScale);
            let yAxis3 = d3.axisRight(d3_yScale);



            let jsonCircles = [];
            let row = d3_xlength;
            let col = d3_ylength;

            for (let i = 0; i < row; i++) {
                let temp = {};
                for (let j = 0; j < col; j++) {
                    temp = {
                        x_axis:d3_xScale(bar_name[i]) +d3_rectWidth / 2 +padding1.left,
                        y_axis: d3_yScale(total_name[j]) + d3_rectWidth / 2,
                        r: 6,
                        flag: threeC(total_name[j], bar_name[i]) ? true : false,
                        color: threeC(total_name[j], bar_name[i])? "#222": "#888",
                        nameX: threeC(total_name[j], bar_name[i])? bar_name[i]: "",
                        nameY: total_name[j],
                        sort: sortC(bar_name[i])
                    };
                    jsonCircles.push(temp);
                }
            }

            drawCircle = jsonCircles;

            makeBaseCircle(jsonCircles, svg3); //造点 这时候包含点的颜色 基本圆

            drawLine(sortArr(jsonCircles, "x_axis"), svg3, "#333"); //把x轴相同的分在一起 画线

            svg3.append("g")
                .attr("class", "axis_xCircle")
                .attr("transform", "translate(30,0)")
                .call(xAxis3);
            svg3.append("g")
                .attr("class", "axis_yCircle")
                .attr("transform", "translate(30,0)")
                .call(yAxis3);
        }

        //造点 这时候包含点的颜色 添加圆 基本圆
        function makeBaseCircle(arr, svg_t) {
            svg_t.selectAll(".MyCircle")
                .data(arr)
                .enter()
                .append("circle")
                .attr("class", "MyCircle")
                .attr("cx", function(d, i) {
                    return d["x_axis"];
                })
                .attr("cy", function(d, i) {
                    return d["y_axis"];
                })
                .attr("r", function(d, i) {
                    return d["r"];
                })
                .style("fill", function(d) {
                    return d.color;
                });

            let tempyList = sortArr(arr, "y_axis");

            for (let i = 0; i < tempyList.length; i++) {
                svg_t.append("rect")
                    .attr("class", "MyRect4")
                    .attr("x", padding1.left)
                    .attr("y", tempyList[i][0]["y_axis"] - d3_rectWidth / 2)
                    .attr("width", d3_width + padding1.right)
                    .attr("height", d3_rectWidth)
                    .attr("opacity", 0.7)
                    .attr("fill",i%2 ==0?"#EEE":"none");
            }

            let tempList = sortArr(arr, "x_axis");
            for (let i = 0; i < tempList.length; i++) {
                svg_t.append("rect")
                    .attr("class", "MyRect3")
                    .attr("x", tempList[i][0]["x_axis"] - d3_rectWidth / 2)
                    .attr("y", function(d, i) {
                        return 0;
                    })
                    .attr("width", d3_rectWidth)
                    .attr("height", function(d, i) {
                        return d3_height;
                    })
                    .attr("opacity", 0)
                    .attr("fill","#87CEFA")
                    .on("mouseover", function(d, i) {
                        d3.select(this).attr("opacity", 0.5)
                    })
                    .on("mouseout", function(d) {
                        d3.select(this).attr("opacity", 0)
                    })
                    ;
            }


        }

        function drawLine(targetGroup, svg_f, color) {
            let temp = [];
            let tempThatone = svg_f.append("g");
            tempThatTwo=tempThatone

            let line = d3.line()
                .x(function(d) {
                    return d.x_axis;
                })
                .y(function(d) {
                    return d.y_axis;
                });

            for (let i = 0; i < targetGroup.length; i++) {
                for (let j = 0; j < targetGroup[i].length; j++) {
                    if (targetGroup[i][j].flag) {
                        temp.push(targetGroup[i][j]);
                    }
                }
                let tempArr = secondArr(targetGroup[i]);

                let path = tempThatone
                    .append("path")
                    .attr("class", "line")
                    .attr("d", line(tempArr))
                    .attr("stroke", "#333")
                    .attr("stroke-width", 2);
            }

            var g = tempThatone.selectAll('.MyCircle2')
                .data(temp)
                .enter()
                .append('circle')
                .attr('class', 'MyCircle2')
                .attr('cx', function (d, i) {
                    return d["x_axis"];
                })
                .attr('cy', function (d, i) {
                    return d["y_axis"];
                })
                .attr('r', function (d, i) {
                    return d["r"];
                })
                .style("fill", function (d) { 
                    return d.color; 
                });
        }

        //把x轴相同的分在一起
        function sortArr(arr, str) {
            let _arr = [],
                _t = [],
                // 临时的变量
                _tmp;

            // 按照特定的参数将数组排序将具有相同值得排在一起
            arr = arr.sort(function(a, b) {
                let s = a[str],
                    t = b[str];
                return s < t ? -1 : 1;
            });

            if (arr.length) {
                _tmp = arr[0][str];
            }
            // console.log( arr );
            // 将相同类别的对象添加到统一个数组
            for (let i in arr) {
                //console.log( _tmp);
                if (arr[i][str] === _tmp) {
                    //console.log(_tmp)
                    _t.push(arr[i]);
                } else {
                    _tmp = arr[i][str];
                    _arr.push(_t);
                    _t = [arr[i]];
                }
            }
            // 将最后的内容推出新数组
            _arr.push(_t);
            return _arr;
        }

        function threeC(lis1, lis2) {
            let m_flag = false;
            if(lis2.indexOf("∩")!=-1){
                lis2 = lis2.split("∩");
                for (let index = 0; index < lis2.length; index++) {
                    if (lis2[index] == lis1) m_flag = true;
                }
                
            }else{
                if(lis1==lis2){
                    m_flag = true;
                }else{
                    m_flag = false;
                }
            }
            return m_flag;
        }

        function sortC(lis2) {
            return lis2.split("∩").sort();
        }

        // 把每组中要画的点提取到一起
        function secondArr(arr) {
            let tempArr = [];
            for (let i = 0; i < arr.length; i++) {
                if (arr[i].flag == true) {
                    tempArr.push(arr[i]);
                }
            }
            return tempArr;
        }

        function nameToCircle(nameList) {
            if (tempCricle != undefined) {
                tempCricle.remove();
            }
            if (tempP != undefined) {
                tempP.remove();
            }
            let tempdata = selectBaseCircle2(drawCircle,nameList.sort(),nameList.length);
            drawLine2(tempdata, tempThatTwo, "red"); //把x轴相同的分在一起 画线
        }
        function selectBaseCircle2(arr, targetArr, num) {
            let tempA = [];
            for (let index = 0; index < arr.length; index++) {
                if (targetArr.toString() == arr[index].sort.toString()) {
                    if (arr[index].flag) {
                        arr[index].color = "red";
                        tempA.push(arr[index]);
                    }
                }
            }
            return tempA;
        }

        function drawLine2(targetGroup, svg_s, color) {
            //console.log(targetGroup)
            if (targetGroup.length > 1) {
                let line = d3
                    .line()
                    .x(function(d) {
                        return d.x_axis;
                    })
                    .y(function(d) {
                        return d.y_axis;
                    });

                tempP = svg_s
                    .append("path")
                    .attr("class", "line")
                    .attr("d", line(targetGroup))
                    .attr("stroke", color)
                    .attr("stroke-width", 2);
            }

            tempCricle = svg_s
                .selectAll(".MyCircle3")
                .data(targetGroup)
                .enter()
                .append("circle")
                .attr("class", "MyCircle3")
                .attr("cx", function(d, i) {
                    return d["x_axis"];
                })
                .attr("cy", function(d, i) {
                    return d["y_axis"];
                })
                .attr("r", function(d, i) {
                    return d["r"];
                })
                .style("fill", function(d) {
                    return d.color;
                });
        }

        function getBLen(str) {
            if (str == null) return 0;
            if (typeof str != "string"){
              str += "";
            }
            return str.replace(/[^\x00-\xff]/g,"01").length;
        }
    }
}