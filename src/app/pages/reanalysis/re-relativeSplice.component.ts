import { AddColumnService } from "./../../super/service/addColumnService";
import { StoreService } from "./../../super/service/storeService";
import { PageModuleService } from "./../../super/service/pageModuleService";
import { MessageService } from "./../../super/service/messageService";
import { AjaxService } from "src/app/super/service/ajaxService";
import { ActivatedRoute, Router, NavigationEnd } from "@angular/router";
import { Component, OnInit, ViewChild, AfterViewInit } from "@angular/core";
import { GlobalService } from "src/app/super/service/globalService";
import config from "../../../config";
import { PromptService } from "./../../super/service/promptService";
import { ToolsService } from "./../../super/service/toolsService";

declare const d3: any;
declare const gooalD3: any;
declare const $: any;

@Component({
    selector: "app-re-relativeSplice",
    templateUrl: "./re-relativeSplice.component.html",
    styles: []
})
export class RelativeSpliceComponent implements OnInit {
    @ViewChild("relativeSpliceChart") relativeSpliceChart;
    @ViewChild("left") left;
    @ViewChild("right") right;
    @ViewChild("func") func;
    @ViewChild("tableSwitchChart") tableSwitchChart;
    @ViewChild("bigTable") bigTable;
    // @ViewChild("addColumn") addColumn;

    chartUrl: string;
    chartEntity: object;
    chart: any;

    // table
    defaultEntity: object;
    defaultUrl: string;
    defaultTableId: string;
    defaultDefaultChecked: boolean;
    defaultCheckStatusInParams: boolean;
    baseThead: any[] = [];
    tableHeight = 0;

    switch:string = 'right';

    addColumnShow: boolean = false;
    showBackButton: boolean = false;

    // 路由参数
    tid: string = null;
    geneType: string = "";
    version: string = null;

    //参数
    k_degree: number;
    k_explain: string;
    k_pvalue: number;
    k_stat: number;

    singleMultiSelect: object = {}; //单选
    doubleMultiSelect: any[] = []; //多选

    colors: string[] = [];
    legendIndex: number = 0; //当前点击图例的索引
    color: string; //当前选中的color
    isShowColorPanel: boolean = false;
    //textContent: string = "可变剪切图";
    geneNum: number;

    selectPanelData: object[] = [];

    AS_type_list: string[] = [];    //--可变剪切组---的全部基因
    Group_All_List:string[] = [];   //除去--可变剪切组---的全部基因

    AS_type_select: string[] = [];
    group_select: string[] = [];

    selectConfirmData:string[] = []; //默认和确定时候的返回数据

    selectArray: object[] = [];

    defaultSelectNum:number;

    selectUniqueList:string[] = [];
    computedScrollHeight:boolean = false;

    textContent: string = 'Standardized gene location';
	ytextContent: string = 'PSI';

    constructor(
        private message: MessageService,
        private ajaxService: AjaxService,
        private globalService: GlobalService,
        public storeService: StoreService,
        public pageModuleService: PageModuleService,
        private router: Router,
        private routes: ActivatedRoute,
        private promptService: PromptService,
        public toolsService: ToolsService,
        private addColumnService: AddColumnService
    ) {
        // 订阅windowResize 重新计算表格滚动高度
        this.message.getResize().subscribe(res => {
            if (res["message"] === "resize") this.computedTableHeight();
        });

        // 每次切换路由计算表格高度
        this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                this.computedTableHeight();
            }
        });

        this.routes.paramMap.subscribe(params => {
            this.tid = params["params"]["tid"];
            this.version = params["params"]["version"];
            this.geneType = params["params"]["geneType"];
            this.storeService.setTid(this.tid);
        });
    }

    ngOnInit() {
        (async () => {
            try {
                let a = await this.getRelativeSpliceParams();

                this.chartUrl = `${config["javaPath"]}/alternativeSplice/graph`;
                this.chartEntity = {
                    LCID: sessionStorage.getItem("LCID"),
                    //tid: '7fc7bf9c6db34fc0b042efc40a4db779',
                    // tid:"f888468806f644ccaac2afed5d424f00",
                    tid:this.tid,
                    version: this.version,
                    geneType: this.geneType,
                    species: this.storeService.getStore("genome"),
                    as_type: this.AS_type_select,
                    as_group_name: this.group_select
                };

                this.colors = this.storeService.colors;

                // table
                this.defaultUrl = `${config["javaPath"]}/alternativeSplice/table`;
                this.defaultEntity = {
                    LCID: sessionStorage.getItem("LCID"),
                    tid: this.tid,
                    pageIndex: 1, //分页
                    pageSize: 20,
                    mongoId: null,
                    addThead: [], //扩展列
                    transform: false, //是否转化（矩阵变化完成后，如果只筛选，就为false）
                    // matchAll: false,
                    matrix: false, //是否转化。矩阵为matrix
                    sortValue: null,
                    sortKey: null, //排序
                    rootSearchContentList: [],
                    geneType: this.geneType, //基因类型gene和transcript
                    species: this.storeService.getStore("genome"), //物种
                    version: this.version,
                    searchList: [],
                    // sortThead: this.addColumn["sortThead"],
                    as_type: this.AS_type_select,
                    as_group_name: this.group_select
                };
                this.defaultTableId = "splice";
            } catch (error) {}
        })();
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.computedTableHeight();
        }, 30);
    }

    toggle(status) {
        this.addColumnShow = status;
    }

    // 表
    addThead(thead) {
        // this.bigTable._initCheckStatus();
        this.bigTable._setParamsOfEntityWithoutRequest(
            "removeColumns",
            thead["remove"]
        );
        this.bigTable._setParamsOfEntityWithoutRequest("pageIndex", 1);
        this.bigTable._addThead(thead["add"]);
    }

    handlerRefresh() {
        //this.chartBackStatus();
    }

    chartBackStatus() {
        this.showBackButton = false;
        // 清空表的筛选
        this.bigTable._clearFilterWithoutRequest();
        this.bigTable._setParamsOfEntityWithoutRequest('pageIndex',1);
        if(this.selectUniqueList.length) {
            this.bigTable._filter('as_id', config["as_id"], "string","$in",this.selectUniqueList.join(','),null);
        }else{
            this.bigTable._deleteFilterWithoutRequest("as_id",config["as_id"],"$in");
            this.bigTable._getData();
        }
    }

    // 表格上方功能区 resize重新计算表格高度
    resize(event) {
        setTimeout(() => {
            this.computedTableHeight();
        }, 30);
    }

    // 切换左右布局 计算左右表格的滚动高度
    switchChange(status) {
        this.switch = status;
        setTimeout(() => {
            this.relativeSpliceChart.scrollHeight();
            this.computedTableHeight();
        }, 320);
    }

    computedTableHeight() {
		try {
            let h = this.tableHeight;
            this.tableHeight = this.right.nativeElement.offsetHeight  - config['layoutContentPadding'] * 2;
            if(this.tableHeight===h) this.computedScrollHeight = true;
		} catch (error) {}
    }

    async getRelativeSpliceParams() {
        return new Promise((resolve, reject) => {
            this.ajaxService
                .getDeferData({
                    url: `${config["javaPath"]}/alternativeSplice/config`,
                    data: {
                        LCID: this.storeService.getStore("LCID"),
                        geneType: this.geneType,
                        species: this.storeService.getStore("genome"),
                        version: this.version
                    }
                })
                .subscribe(
                    (data: any) => {
                        if (data.status === "0" &&(data.data.length == 0 ||$.isEmptyObject(data.data))
                        ) {
                            console.log("nodata");
                        } else if (data.status === "-1") {
                            console.log("error");
                        } else if (data.status === "-2") {
                            console.log("dataOver");
                        } else {
                            this.AS_type_list = data["data"].AS_type;

                            this.Group_All_List = [
                                ...data["data"].diff,
                                ...data["data"].group,
                                ...data["data"].sample
                            ];

                            this.defaultSelectNum = this.AS_type_list.length+1;
                            this.selectPanelData = [
                                {
                                    type: "可变剪切类型",
                                    data: this.AS_type_list
                                },
                                {
                                    type: "选择组",
                                    data: data["data"].diff
                                },
                                {
                                    type: "",
                                    data: [...data["data"].group,...data["data"].sample]
                                }
                            ];
                            resolve("success");
                        }
                    },
                    error => {
                        reject("error");
                    }
                );
        });
    }

    //图二次更新
    updateRelativeSplice() {
        this.doubleMultiSelect.length = 0;
        this.singleMultiSelect = {};
        this.selectArray.length = 0;
        this.relativeSpliceChart.reGetData();
    }

    //单选
    doSingleData() {
        if($.isEmptyObject(this.singleMultiSelect)){
            this.bigTable._deleteFilter("as_id",config["as_id"],"$in");
        }else{
            this.selectUniqueList.length = 0;
            this.selectUniqueList.push(this.singleMultiSelect['as_id']);
            this.bigTable._filter('as_id', config["as_id"], "string","$in", this.selectUniqueList.join(','),null)
        }
    }

    //框选确定时候,提交的数据
    boxSelectConfirm() {
        //console.log(this.selectArray);
        let tempArray = [];
        this.selectArray.forEach((d) => {
            tempArray.push(d["__data__"])
        });
        // 筛选表格
        let gene = tempArray.map(v=>v['as_id']);
        this.selectUniqueList.length = 0;
        this.selectUniqueList.push(...gene);
        if(this.selectUniqueList.length){
            this.bigTable._filter('as_id', config["as_id"], "string","$in", this.selectUniqueList.join(','),null)
        }else{
            this.bigTable._deleteFilter("as_id",config["as_id"],"$in");
        }
    }

    //选择面板 确定筛选的数据
    selectConfirm(data) {
        this.selectConfirmData = data;
        this.doSplitData();
        this.updateRelativeSplice();

        this.bigTable._getData();
    }

    //把数据进行分类
    doSplitData(){
        this.AS_type_select.length = 0;
        this.group_select.length = 0;
        this.selectConfirmData.forEach((d) => {
            this.AS_type_list.forEach((m) => {
                if (d === m) {
                    this.AS_type_select.push(m)
                }
            })
            this.Group_All_List.forEach((m) => {
                if (d === m) {
                    this.group_select.push(m)
                }
            })
        })
    }

    //选择面板，默认选中数据
    defaultSelectList(data) {
        this.selectConfirmData = data;
        this.doSplitData();
    }

    //color change 回调函数
    colorChange(curColor) {
        this.color = curColor;
        this.colors.splice(this.legendIndex, 1, curColor);
        this.relativeSpliceChart.redraw();
    }

    //画图
    drawChart(data) {
        document.getElementById('relativeSpliceDiv').innerHTML = "";
        let that = this;

        // if(data.length == 0){
        //     return;
        // }
        let tempData = data.asGraph;
        let tempSetting = data.as_region;

        let x_value = [];
        let y_value = [];

        if(tempData == null){
            return;
        }else{
            tempData.forEach((d) => {
                d.x = 0;
                d.y = 0;
                d.selected = false;
            });

            tempData.forEach((d) => {
                x_value.push(d.as_x_site);
                y_value.push(d.as_y_site);
            });
        }

        x_value = Array.from(new Set(x_value));
        y_value = Array.from(new Set(y_value));



        let t_chartID = document.getElementById('relativeSpliceDiv');
		let str = `<svg id='svg' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'>
            <style>

                .titleText{
                    font-size：16px;
                }
            </style>
        </svg>`;
        t_chartID.innerHTML = str;

        let symbolScale = null;
        let svg1 = null;
        let xScale = null;
        let yScale = null;
        let rect2 = null;
        let node = null;

        let top_title = 30;//上侧标题
        let bottom_xlength = 20; //下侧x轴高度
        let bottom_UTR_CDS = 60; //下侧UTR_CDS高度

        let left_title = 20;//左侧标题
        let left_ylength = 30;//左侧y轴
        let right_name_length=getNameLength(this.selectConfirmData)+30;
        // console.log(right_name_length);
        //let right_name_length = 90;

        let leftNameWidth = 50; //左侧标题宽度

        // let xAxis_length = x_value.length*rect_length.x;
        // let yAxis_length = y_value.length*rect_length.y;
        let xAxis_length = 320;
        let yAxis_length = 300;

        let temp_num = 15;
        let temp_length = (parseInt((that.group_select.length/temp_num).toString().split(".")[0])+1)*200;

        let svg_width = left_title + left_ylength + xAxis_length + 90 + temp_length + leftNameWidth; //计算最外层svg宽度
        let svg_height = top_title + yAxis_length + bottom_xlength + bottom_UTR_CDS; //计算最外层svg高度

        let svg = d3.select('#svg') //最外层svg
                .attr('width', svg_width)
                .attr('height', svg_height)
                .on('click', function(d) {
                    var e = e || window.event;
                    if(e.target.nodeName == "rect"){
                        that.singleMultiSelect = {};
                        that.doSingleData();
                        that.updateRelativeSplice();
                    }
                    // console.log(d)
                    // if(d == undefined){
                    //     that.singleMultiSelect = {};
                    //     that.doSingleData();
                    // }
                    // that.updateRelativeSplice();

                    // that.chartBackStatus();
                },false);

        let temp_add_width = 10;
        let temp_x_width = xAxis_length + left_ylength + temp_add_width;
        let temp_y_width = yAxis_length + bottom_xlength + temp_add_width;



        setTimeout(()=>{
            drawLeftTitle(); //上侧标题
            draw_x_y_axis();
            drawRightFirstLegend();
            drawRightSecondLegend();
            drawCenter();
            drawBottomLegend();
        },30)
        //drawBottomLegend();

        function drawLeftTitle(){
            let tempName = [];
			tempName.push(that.ytextContent);
			let nameW=getNameLength(tempName);
			let padding_w = (svg_height-nameW)/2;

			let height = yAxis_length;
			let padding_left2 = 0;

			let svgTitle = svg.append('g').attr('transform', 'translate(' + 45 + ',' + (nameW+padding_w) + ')');
			svgTitle
				.append('text')
				.attr("transform", "rotate(-90)")
                .attr('class', 'titleText')
                .style("cursor", "pointer")
				.attr('width', leftNameWidth)
				.attr('height', nameW)
				.attr('dx', '0')
				.attr('dy', '0')
				// .text(function(d, i) {
				// 	return that.ytextContent;
                // })
                .text(that.ytextContent)
				.on('dblclick',function() {
                    console.log(6666)
					//let self = that;
					that.promptService.open(that.ytextContent, (data) => {
						if (data != '') {
							that.ytextContent = data;
							svgTitle.remove();
							//self.updateKaFun();
							drawLeftTitle();
						}
					});
                })
                .on("mouseover", function() {
                    d3.select(this).attr("fill", "blue");
                    d3.select(this).append("title").text("双击修改");
                })
                .on("mouseout", function() {
                    d3.select(this).attr("fill", "#333");
                    d3.select(this).select("title").remove();
                });
		}

        function draw_x_y_axis(){

            svg1 = svg
                .append('g')
                .attr('transform', 'translate(' + (left_title+leftNameWidth) + ',' + top_title + ')')
                .attr('class', 'svg1');

            xScale = d3
				.scaleLinear()
				.domain([ tempSetting.x_axis.start , tempSetting.x_axis.end ])
                .range([ 0 , xAxis_length ])
                .nice().clamp(true);
            yScale = d3
				.scaleLinear()
                .domain([ tempSetting.y_axis.end , tempSetting.y_axis.start ])
                .range([ 0 , yAxis_length ])
                .nice().clamp(true);

            let xAxis = d3.axisBottom(xScale).ticks(5);
            let yAxis = d3.axisLeft(yScale).ticks(5);

            svg1.append('g')
                .attr('class', 'axis_x1')
                .attr('transform', 'translate(' + left_ylength + ',' + (yAxis_length + temp_add_width) + ')')
                .call(xAxis);
            svg1.append('g')
                .attr('class', 'axis_y1')
                .attr('transform', 'translate(' + left_ylength + ',' + temp_add_width + ')')
                .call(yAxis);
        }

        function drawRightFirstLegend(){

            let temp_width = 90;
            let padding_left = temp_x_width + left_title+10 + leftNameWidth;

            let r_legend = svg
                .append('g')
                .attr('class','toplegend')
                .attr('transform', 'translate(' + padding_left + ',' + top_title + ')')
                .attr('width',temp_width)

            let triangleU = d3.symbol().type(d3.symbolTriangle)(),
                circle = d3.symbol().type(d3.symbolCircle)(),
                cross = d3.symbol().type(d3.symbolCross)(),
                diamond = d3.symbol().type(d3.symbolDiamond)(),
                star = d3.symbol().type(d3.symbolStar)();

            let temp_symbol = [triangleU,circle,cross,diamond,star];
            let temp_symbol_select = [];
            let temp_symbol_length = that.AS_type_select.length;
            let j = 0;

            temp_symbol.forEach(element => {
                if(j < temp_symbol_length){
                    temp_symbol_select.push(temp_symbol[j]);
                    j++;
                }
            });

            symbolScale =  d3.scaleOrdinal().domain(that.AS_type_select).range(temp_symbol_select);

            // console.log(symbolScale)
            r_legend.append("g")
            .attr("class", "legendSymbol")
            .attr("transform", "translate(0, 0)");

            let legendPath = d3.legendSymbol()
            .scale(symbolScale)
            .orient("vertical")
            .labelWrap(temp_width)
            .labelOffset(5)
            .shapePadding(5)
            .title("Type")
            .titleWidth(temp_width)
            //.on("cellover", function(d){alert("clicked " + d);})
            .on("cellclick", function(d){});

            r_legend.select(".legendSymbol").call(legendPath);
        }

        function drawRightSecondLegend(){
            let padding_left = temp_x_width + left_title + 90 +leftNameWidth;

            let circle = d3.symbol().type(d3.symbolCircle)();
            let temp_symbol_select = [];
            let temp_symbol_length = that.group_select.length;

            let j = 0;
            that.colors.forEach(element => {
                if(j < temp_symbol_length){
                    temp_symbol_select.push(that.colors[j]);
                    j++;
                }
            });
            // let categoryList = that.group_select;

            // let z = d3.scaleOrdinal().domain(categoryList).range(that.colors.slice(0, categoryList.length));

            let r_legend_bottom = svg
                .append('g')
                .attr('transform', 'translate(' + padding_left + ',' + top_title + ')')
                .attr('width',temp_length);

            r_legend_bottom.append('text').attr("class","titleText").attr('dx', '0').attr('dy', '0').text("Group");

            let legend_bottom = r_legend_bottom
            .append("g")
            .attr("transform", "translate(0,16)");

            legend_bottom
            .selectAll('circle')
            .data(that.group_select)
            .enter()
            .append('circle')
            .attr('cx', (d, i) => {
                // console.log(parseInt((i/temp_num).toString().split(".")[0])*10+8)
                return parseInt((i/temp_num).toString().split(".")[0])*200+8
            })
            .attr('cy', (d, i) => {
                return parseInt((i%temp_num).toString().split(".")[0]) * 24
            })
            .attr('r', function(d, i) {
                return 5;
            })
            .attr('width', 10)
            .attr('height', 10)
            .attr("fill", function(d, i) {
                return that.colors[i];
            })
            ;


            legend_bottom.selectAll('text')
                .data(that.group_select)
                .enter()
                .append('text')
                .attr('dx', (d, i) => {
                    // console.log(parseInt((i/temp_num).toString().split(".")[0])*10+8)
                    return parseInt((i/temp_num).toString().split(".")[0])*200+20
                })
                .attr('dy', (d, i) => {
                    return parseInt((i%temp_num).toString().split(".")[0]) * 24
                })
                .attr('text-anchor', 'start')
                .attr('dominant-baseline', 'middle')
                .text(d => {
                    return ('' + d).length > 24 ? (('' + d).substring(0, 24 - 1) + '...') : d;
                })
                .on('mouseover', function(d, i) {
					let tipText = `${d}`;
					that.globalService.showPopOver(d3.event, tipText);
				})
				.on('mouseout', function(d, i) {
					that.globalService.hidePopOver();
				})


            // let circle = d3.symbol().type(d3.symbolCircle)();

            // let temp_symbol_select = [];
            // let temp_symbol_length = that.group_select.length;
            // let j = 0;

            // that.colors.forEach(element => {
            //     if(j < temp_symbol_length){
            //         temp_symbol_select.push(that.colors[j]);
            //         j++;
            //     }
            // });

            // let r_legend_bottom = svg
            //     .append('g')
            //     .attr('transform', 'translate(' + padding_left + ',' + top_title + ')')
            //     .attr('width',right_name_length);

            // r_legend_bottom.append('text').attr("class","titleText").attr('dx', '0').attr('dy', '0').text("Group");

            // let ordinal = d3.scaleOrdinal()
            // .domain(that.group_select)
            // .range(temp_symbol_select);

            // r_legend_bottom.append("g")
            // .attr("class", "legendOrdinal")
            // .attr("transform", "translate(4,20)");

            // let legendOrdinal = d3.legendColor()
            // .shape("path", circle)
            // .labelOffset(5)
            // .shapePadding(5)
            // // .cellFilter(function(d){ return d.label !== "e" })
            // .scale(ordinal)
            // .on("cellover", function(d){
            //     let tipText = `${d}`;
			// 	that.globalService.showPopOver(d3.event, tipText);
            // })
            // .on("cellout", function(d){
            //     that.globalService.hidePopOver();
            // });

            // r_legend_bottom.select(".legendOrdinal")
            // .call(legendOrdinal);
        }

        function drawCenter(){

            let svg2 = svg1.append("g").attr('transform', 'translate(' + (left_ylength) + ',' + temp_add_width + ')');

            let brush = svg2.append("g").attr("class", "brush")
            .call(d3.brush()
                .extent([[0, 0], [xAxis_length, yAxis_length]])
                .on("start", brushStart)
                .on("brush", brushed)
                .on("end", brushEnd)
            );

            tempData.forEach((d) => {
                d.x = xScale(d['as_x_site'])+left_ylength;
                d.y = yScale(d['as_y_site'])+temp_add_width;
            });

            // 默认用图例数组
            let categoryList = that.group_select;
            // 颜色比例尺
            let z = d3.scaleOrdinal().domain(categoryList).range(that.colors.slice(0, categoryList.length));

            //temp_symbol
            node = svg1.selectAll('.mynode')
            .data(tempData)
            .enter()
            .append('path')
            .attr('transform', function(d,i){
                return 'translate(' + d['x'] + ',' + d['y'] + ')'
            })
            .attr("d",function(d,i){
                return symbolScale(d["as_type"])
            })
            .attr("class","mynode")
            .attr("fill", function(d, i) {
                return z(d['as_group_name']);
            })
            .on("mouseover", function(d) {
                // let tipText = `x: ${d.x_site}
                //             <br> y:  ${d.y_site}
                //             <br> AS_type:  ${d.AS_type}
                //             <br> Group:  ${d.Group}
                //             <br> st_gene_id:  ${d.st_gene_id}
                //             <br> as_id:  ${d.as_id}
                //             <br> x_calculate: ${d.x}
                //             <br> y_calculate:  ${d.y}
                //             `;
                //console.log(d);
                let tipText = `AS_type:  ${d.as_type}
                            <br> Group:  ${d.as_group_name}
                            <br> ${that.geneType}_id: ${d[`${that.geneType}_id`]}
                            <br> as_id:  ${d.as_id}`;
                that.globalService.showPopOver(d3.event, tipText);
            })
            .on("mouseout", function(d) {
                that.globalService.hidePopOver();
            })
            .on('click', function(d) {
                let event = d3.event;
                    event.stopPropagation();

                d3.selectAll(".mynode").classed("selected", false);
                d3.select(this).classed("selected", true);
                //console.log(d);
                that.singleMultiSelect = d;
                that.doSingleData();
            })
            .style('cursor', 'pointer')

        }

        // node 拖选
        function brushStart() {
            if (d3.event.sourceEvent.type != "end") {
                node.classed("selected", d => d.selected);
            }
        }

        function brushed() {
            if (d3.event.sourceEvent.type != "end") {
                let selection = d3.event.selection;
                //console.log(d3.event)
                node.classed("selected", d => {
                    return (selection != null
                        && selection[0][0] <= (d.x - left_ylength) && (d.x - left_ylength) <= selection[1][0]
                        && selection[0][1] <= (d.y - temp_add_width) && (d.y - temp_add_width) <= selection[1][1]);
                })
            }
        }

        function brushEnd() {
            let selection = d3.event.selection;
            if (selection != null) {
                d3.select(this).call(d3.event.target.move, null);
                //console.log(d3.selectAll(".mynode.selected").nodes());
                that.selectArray = d3.selectAll(".mynode.selected").nodes();
                that.boxSelectConfirm();
            }
        }

        function drawBottomLegend(){

            let u_padding = top_title + bottom_xlength + yAxis_length+20;
            let g_UTR = svg
                .append('g')
                .attr('transform', 'translate(' + (left_title+left_ylength + leftNameWidth) + ',' + u_padding + ')')
                .attr('class', 'utr')
                .attr("height",bottom_UTR_CDS)
                ;

            // let sum = tempSetting.utr_3.end - tempSetting.utr_5.start;
            // let utr_5_scale = (tempSetting.utr_5.end-tempSetting.utr_5.start)/sum;
            // let utr_3_scale = (tempSetting.utr_3.end-tempSetting.utr_3.start)/sum;
            // let cds_scale = (tempSetting.cds.end-tempSetting.cds.start)/sum;

            // g_UTR.append('rect')
            // .attr('class', 'MyRect')
            // .attr('width',xAxis_length*utr_5_scale)
            // .attr('height',16)
            // .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
            // .attr('fill','black')

            // g_UTR.append('rect')
            // .attr('class', 'MyRect')
            // .attr('width',xAxis_length*cds_scale)
            // .attr('height',6)
            // .attr('transform', 'translate(' + xAxis_length/5 + ',' + 5 + ')')
            // .attr('fill','black')
            // .attr('opacity',0.5)

            // g_UTR.append('rect')
            // .attr('class', 'MyRect')
            // .attr('width',xAxis_length*utr_3_scale)
            // .attr('height',16)
            // .attr('transform', 'translate(' + xAxis_length*4/5 + ',' + 0 + ')')
            // .attr('fill','black')

            // g_UTR.append('text')
            // .attr('class', 'MyText')
            // .attr('dx', function(d, i) {
            //     return 10;
            // })
            // .attr('dy', function(d, i) {
            //     return 30;
            // })
            // .text("5'-UTR");

            // g_UTR.append('text')
            // .attr('class', 'MyText')
            // .attr('dx', function(d, i) {
            //     return 270;
            // })
            // .attr('dy', function(d, i) {
            //     return 30;
            // })
            // .text("3'-UTR");

            g_UTR.append('text')
            .attr('class', 'MyText')
            .style("cursor", "pointer")
            .attr('dx', function(d, i) {
                return 100;
            })
            .attr('dy', function(d, i) {
                return 30;
            })
            .text(that.textContent)
            .on('dblclick', function() {
                let self = that;
                that.promptService.open(that.textContent, (data) => {
                    if (data != '') {
                        self.textContent = data;
                        g_UTR.remove();
                        drawBottomLegend();
                    }
                });
            })
            .on("mouseover", function() {
                d3.select(this).attr("fill", "blue");
                d3.select(this).append("title").text("双击修改");
            })
            .on("mouseout", function() {
                d3.select(this).attr("fill", "#333");
                d3.select(this).select("title").remove();
            });

        }

        function uniq(array){
            let temp = [];
            let index = [];
            let l = array.length;
            for(let i = 0; i < l; i++) {
                for(let j = i + 1; j < l; j++){
                    if (array[i] === array[j]){
                        i++;
                        j = i;
                    }
                }
                temp.push(array[i]);
                index.push(i);
            }
            return temp;
        }

        // function getNameLength(total_name) {
		// 	//console.log(total_name)
		// 	let oSvg = d3.select('#relativeSpliceDiv').append('svg');
		// 	let mText = oSvg
		// 		.selectAll('MyAlltext')
		// 		.data(total_name)
		// 		.enter()
		// 		.append('text')
		// 		.text(function(d, i) {
		// 			return d;
		// 		})
		// 		.attr('class', 'aText');

		// 	let max_length = [];

		// 	mText.nodes().forEach((d) => {
		// 		max_length.push(d.getBBox().width);
		// 	});
		// 	//console.log(max_length)

		// 	max_length.sort(function(a, b) {
		// 		return b - a;
		// 	});

		// 	oSvg.remove();

		// 	return max_length[0];
		// }

        function pauseEvent(e){
            if(e.stopPropagation) e.stopPropagation();
            if(e.preventDefault) e.preventDefault();
            e.cancelBubble=true;
            e.returnValue=false;
            return false;
        }

        function getNameLength(total_name) {
			//console.log(total_name)
			let oSvg = d3.select('#relativeSplice').append('svg');
			let mText = oSvg
				.selectAll('MyAlltext')
				.data(total_name)
				.enter()
				.append('text')
				.text(function(d, i) {
					return d;
				})
				.attr('class', 'aText');

			let max_length = [];

			mText.nodes().forEach((d) => {
				max_length.push(d.getBBox().width);
			});
			//console.log(max_length)

			max_length.sort(function(a, b) {
				return b - a;
			});

			oSvg.remove();

			return max_length[0];
        }


    }
}
