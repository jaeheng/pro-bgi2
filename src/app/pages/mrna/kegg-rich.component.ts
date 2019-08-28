import { AddColumnService } from './../../super/service/addColumnService';
import { StoreService } from './../../super/service/storeService';
import { PageModuleService } from './../../super/service/pageModuleService';
import { MessageService } from './../../super/service/messageService';
import { AjaxService } from 'src/app/super/service/ajaxService';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Component, OnInit, ViewChild, AfterViewInit, Input } from '@angular/core';
import { GlobalService } from 'src/app/super/service/globalService';
import config from '../../../config';
import {PromptService} from './../../super/service/promptService';
import { TranslateService } from '@ngx-translate/core';

declare const d3: any;
declare const gooalD3:any;
declare const $: any;

@Component({
	selector: 'app-kegg-rich-page',
	template: `<app-kegg-rich *ngIf="showModule" [defaultGeneType]="defaultGeneType">
                    <div *ngIf="rootGeneType===config['geneTypeAll']" class="gene-switch gene-switch-module" (click)="handlerSwitchChange()">
                        <span>{{defaultGeneType | translate}}</span><i class="iconfont icon-qiehuan"></i>
                    </div>
                    <div *ngIf="rootGeneType!==config['geneTypeAll']" class="gene-switch gene-switch-module nocursor">
                        <span>{{defaultGeneType | translate}}</span>
                    </div>
                </app-kegg-rich>`,
	styles: []
})
export class KeggRichPage {
	private moduleRouteName: string = 'kegg-enrichment'; // 模块默认路由 通过路由名称查找菜单配置项（geneType）；
	config: object = config;
	rootGeneType: string = this.storeService.getStore('menuRouteMap')[this.moduleRouteName]['geneType']; // 来自菜单 可配置  all gene transcript

	defaultGeneType: string = this.rootGeneType === this.config['geneTypeAll']
		? this.config['geneTypeOfGene']
		: this.rootGeneType;
	showModule: boolean = true;

	constructor(private storeService: StoreService, private translate: TranslateService) {
		let browserLang = this.storeService.getLang();
		this.translate.use(browserLang);
	}

	handlerSwitchChange() {
		this.defaultGeneType =
			this.defaultGeneType === config['geneTypeOfGene']
				? config['geneTypeOfTranscript']
				: config['geneTypeOfGene'];
		this.showModule = false;
		setTimeout(() => {
			this.showModule = true;
		}, 30);
	}
}

@Component({
    selector: "app-kegg-rich",
    templateUrl: "./kegg-rich.component.html"
})

export class KeggRichComponent implements OnInit {

    @ViewChild('switchChart') switchChart;
    @ViewChild('left') left;
    @ViewChild('leftBottom') leftBottom;
    @ViewChild('bigTable') bigTable;
	@ViewChild('right') right;
	@ViewChild('func') func;
    @ViewChild('transformTable') transformTable;
    @ViewChild('addColumn') addColumn;
    @Input('defaultGeneType') defaultGeneType;

    // 默认显示表
	expandModuleTable: boolean = true;

    bigtableUrl:string;

    chartUrl: string;
    chartEntity: object;

    chart:any;

    chartDesc:any;

    //column
    show: boolean = false;
    legendIndex: number = 0; //当前点击图例的索引
    color: string; //当前选中的color

    //bubble
    bshow:boolean=false;
    blegendIndex:number=0;
    bcolor:string;

    chartTypeData:any=[];

    isShowTable:boolean;

    visible:boolean=false;

    checkedData:any=[];
    checkedDrawGeneList:any=[];

    // table
    setAddedThead :any= [];
    defaultEntity: object;
	defaultUrl: string;
	defaultTableId: string;
	defaultDefaultChecked: boolean;
	defaultCheckStatusInParams: boolean;
	defaultEmitBaseThead: boolean;

	extendEntity: object;
	extendUrl: string;
	extendTableId: string;
	extendDefaultChecked: boolean;
	extendCheckStatusInParams: boolean;
	extendEmitBaseThead: boolean;
	baseThead: any[] = [];
    applyOnceSearchParams: boolean;

    tableHeight = 0;
    leftTableHeight = 0;
    first = true;
    switch = 'right';

    addColumnShow:boolean = false;
    showBackButton:boolean = false;

    // 参数
    version:string = null;

    selectGeneCount:number = 0;
    computedScrollHeight:boolean = false;
    leftComputedScrollHeight:boolean = false;

    selectedVal:string = '';
    annotation:string = 'kegg_pathway';
    selectData:any = [];

    resetCheckGraph: boolean;

    isMultipleSelect:boolean = false;

    // 图上选择的数据
    selectGeneList:string[] = [];

    expandModuleDesc: boolean = false;

    constructor(
        private message: MessageService,
		private ajaxService: AjaxService,
		private globalService: GlobalService,
		public storeService: StoreService,
		public pageModuleService: PageModuleService,
        private router: Router,
        private routes:ActivatedRoute,
        private promptService:PromptService,
        private addColumnService:AddColumnService
    ) {
        // 订阅windowResize 重新计算表格滚动高度
		this.message.getResize().subscribe((res) => {
			if (res['message'] === 'resize') this.computedTableHeight();
		});

		// 每次切换路由计算表格高度
		this.router.events.subscribe((event) => {
			if (event instanceof NavigationEnd) {
                this.computedTableHeight();
            }
        });

    }

    ngOnInit() {
        this.version = this.storeService.getStore('version');
        (async ()=>{
            this.chartTypeData=[
                {
                    key:"bubble",
                    value:"气泡图"
                },
                {
                key:"column",
                value:"柱状图"
            }];

            this.selectData = this.storeService.getStore('diff_plan');
			this.selectedVal = this.selectData.length?this.selectData[0]:null;

            this.bigtableUrl=`${config['javaPath']}/enrichment/generalTable`;
            this.chartUrl=`${config['javaPath']}/enrichment/graph`;
            this.chartEntity = {
                LCID: this.storeService.getStore('LCID'),
                enrichmentType:this.annotation,
                geneType: this.defaultGeneType,
                species: this.storeService.getStore('genome'),
                compareGroup:this.selectedVal,
                checkedClassifyList:[],
                searchList:[],
                pageIndex:1,
                pageSize:20,
                sortKey:null,
                sortValue:null,
                version:this.version
            };

            this.first = true;
            this.resetCheckGraph = true;
            this.applyOnceSearchParams = true;
            this.defaultUrl = `${config['javaPath']}/enrichment/table`;
            this.defaultEntity = {
                LCID: sessionStorage.getItem('LCID'),
                enrichmentType: this.annotation,
                pageIndex: 1,
                pageSize: 20,
                mongoId: null,
                addThead: [],
                transform: false,
                matrix: false,
                relations: [],
                sortValue: null,
                sortKey: null,
                reAnaly: false,
                geneType: this.defaultGeneType,
                species: this.storeService.getStore('genome'),
                version: this.version,
                searchList: [],
                compareGroup: this.selectedVal,
                checkedClassifyList: this.selectGeneList,
                checkGraph: true,
                sortThead: this.addColumn['sortThead'],
                removeColumns: []
            };
            this.defaultTableId = 'default_rich';
            this.defaultDefaultChecked = true;
            this.defaultEmitBaseThead = true;
            this.defaultCheckStatusInParams = true;

            this.extendUrl = `${config['javaPath']}/enrichment/table`;
            this.extendEntity = {
                LCID: sessionStorage.getItem('LCID'),
                enrichmentType: this.annotation,
                pageIndex: 1,
                pageSize: 20,
                mongoId: null,
                addThead: [],
                transform: false,
                matchAll: false,
                matrix: false,
                relations: [],
                sortValue: null,
                sortKey: null,
                reAnaly: false,
                geneType: this.defaultGeneType,
                species: this.storeService.getStore('genome'),
                version: this.version,
                searchList: [],
                compareGroup: this.selectedVal,
                checkedClassifyList: this.selectGeneList,
                checkGraph: true,
                sortThead: this.addColumn['sortThead'],
                removeColumns: []
            };
            this.extendTableId = 'extend_rich';
            this.extendDefaultChecked = true;
            this.extendEmitBaseThead = true;
            this.extendCheckStatusInParams = false;
        })()
    }

    moduleTableChange() {
		this.expandModuleTable = !this.expandModuleTable;
		// 重新计算表格切换组件表格的滚动高度
		setTimeout(() => {
			this.switchChart.scrollHeight();
		}, 30);
	}

    showChange(isshowtable){
        this.isShowTable=isshowtable;
    }

    checkedChange(data){
        this.checkedData=[...data[1]];
        this._sortArr(this.annotation+'_qvalue',this.checkedData);
        this.checkedDrawGeneList.length=0;
        this.checkedData.forEach(d=>{
            let geneid=d[this.annotation+"_term"] ? d[this.annotation+"_term"] : d[this.annotation+"_term_id"];
            this.checkedDrawGeneList.push(geneid);
        })

    }

    deleteGene(i){
        let delchecks  = this.checkedData.splice(i,1);
        this.checkedDrawGeneList.splice(i,1);
        this.bigTable._deleteCheckedStatus(delchecks);
    }

    clearGene(){
        this.visible=false;
        this.bigTable._deleteCheckedStatus(this.checkedData);
        this.checkedData.length=0;
        this.checkedDrawGeneList.length=0;
        this.reDraw();
    }

    // 点击“重画”
    reDraw(){
        this.chartEntity['checkedClassifyList']=this.checkedDrawGeneList;
        this.switchChart.reGetData();
    }

    //排序
    _sortArr(key, arr) {
        arr.sort(function(a, b) {
            return a[key] - b[key];
        })
    }

    moduleDescChange() {
		this.expandModuleDesc = !this.expandModuleDesc;
		// 重新计算表格切换组件表格的滚动高度
		setTimeout(() => {
			this.computedTableHeight();
		}, 30);
	}


    ngAfterViewInit() {
		setTimeout(() => {
			this.computedTableHeight();
		}, 30);
    }

    handleSelectGeneCountChange(selectGeneCount){
        this.selectGeneCount = selectGeneCount;
    }

    toggle(status){
        this.addColumnShow = status;
    }


    // 表
    addThead(thead) {
        this.transformTable._initCheckStatus();

		this.transformTable._setParamsNoRequest('removeColumns', thead['remove']);
        this.transformTable._setParamsNoRequest('pageIndex', 1);

		this.transformTable._addThead(thead['add']);
    }

    // 表格转换 确定
    // 转换之前需要把图的 参数保存下来  返回的时候应用
	confirm(relations) {
		this.showBackButton = true;
		this.extendEmitBaseThead = true;
		let checkParams = this.transformTable._getInnerParams();
		this.applyOnceSearchParams = true;
		if (this.first) {
			this.extendCheckStatusInParams = false;
			this.extendEntity['checkStatus'] = checkParams['others']['checkStatus'];
			this.extendEntity['unChecked'] = checkParams['others']['excludeGeneList']['unChecked'];
			this.extendEntity['checked'] = checkParams['others']['excludeGeneList']['checked'];
			this.extendEntity['mongoId'] = checkParams['mongoId'];
			this.extendEntity['searchList'] = checkParams['tableEntity']['searchList'];
			this.extendEntity['rootSearchContentList'] = checkParams['tableEntity']['rootSearchContentList'];
			this.extendEntity['relations'] = relations;
			this.extendEntity['transform'] = true;
			this.extendEntity['matrix'] = true;
			this.extendEntity['checkGraph'] = false;
			this.extendEntity['compareGroup'] = checkParams['tableEntity']['compareGroup'];
			this.extendEntity['checkedClassifyList'] = checkParams['tableEntity']['checkedClassifyList'];
			this.addColumn._clearThead();
			this.extendEntity['addThead'] = checkParams['tableEntity']['addThead'];
			this.first = false;
		} else {
			this.transformTable._initTableStatus();
			this.extendCheckStatusInParams = false;
			this.transformTable._setExtendParamsWithoutRequest('checkStatus', checkParams['others']['checkStatus']);
			this.transformTable._setExtendParamsWithoutRequest( 'checked', checkParams['others']['excludeGeneList']['checked'].concat() );
			this.transformTable._setExtendParamsWithoutRequest( 'unChecked', checkParams['others']['excludeGeneList']['unChecked'].concat() );
			this.transformTable._setExtendParamsWithoutRequest('searchList', checkParams['tableEntity']['searchList']);
			this.transformTable._setExtendParamsWithoutRequest( 'rootSearchContentList', checkParams['tableEntity']['rootSearchContentList'] );
			this.transformTable._setExtendParamsWithoutRequest( 'compareGroup', checkParams['tableEntity']['compareGroup'] );
			this.transformTable._setExtendParamsWithoutRequest( 'checkedClassifyList', checkParams['tableEntity']['checkedClassifyList'] );
			this.transformTable._setExtendParamsWithoutRequest('relations', relations);
			this.transformTable._setExtendParamsWithoutRequest('transform', true);
			this.transformTable._setExtendParamsWithoutRequest('matrix', true);
			this.transformTable._setExtendParamsWithoutRequest('checkGraph', false);
			this.transformTable._setExtendParamsWithoutRequest('addThead', checkParams['tableEntity']['addThead']);
			this.addColumn._clearThead();
			setTimeout(() => {
				this.transformTable._getData();
			}, 30);
		}
		setTimeout(() => {
			this.extendCheckStatusInParams = true;
		}, 30);
	}

	back() {
        this.showBackButton = false;
        this.chartBackStatus();
    }

    handlerRefresh(){
        this.selectGeneList.length = 0;
        // this.chartBackStatus();
    }

    handleSelectChange(){
        this.chartEntity['compareGroup'] = this.selectedVal;
        this.bigTable._setParamsOfEntity('compareGroup',this.selectedVal);
        this.checkedData.length=0;
        this.checkedDrawGeneList.length=0;
        this.selectGeneList.length = 0;

        this.bigTable._initCheckStatus();
        this.reDraw();
        this.chartBackStatus();
    }

    chartBackStatus() {
		this.showBackButton = false;
		this.defaultEmitBaseThead = true;
		this.transformTable._initCheckStatus();
		this.transformTable._clearFilterWithoutRequest();
		this.resetCheckGraph = true;

		if (!this.first) {
			this.defaultEntity['checkGraph'] = true;
			this.defaultEntity['addThead'] = [];
			this.defaultEntity['removeColumns'] = [];
			this.defaultEntity['rootSearchContentList'] = [];
			this.defaultEntity['pageIndex'] = 1;
			this.defaultEntity['compareGroup'] = this.selectedVal;
			this.first = true;
		} else {
			this.transformTable._setParamsNoRequest('checkGraph', true);
			this.transformTable._setParamsNoRequest('pageIndex', 1);
			this.transformTable._setParamsNoRequest('compareGroup', this.selectedVal);
			this.transformTable._getData();
		}
	}

	// 表格基础头改变  设置emitBaseThead为true的时候 表格下一次请求回来会把表头发出来 作为表格的基础表头传入增删列
	baseTheadChange(thead) {
		this.baseThead = thead['baseThead'].map((v) => v['true_key']);
    }

	// 表格上方功能区 resize重新计算表格高度
	resize(event) {
        setTimeout(()=>{
            this.computedTableHeight();
        },30)
    }

    // 切换左右布局 计算左右表格的滚动高度
	switchChange(status) {
        this.switch = status;
        setTimeout(()=>{
            try{
                this.switchChart.scrollHeight();
            }catch(e){}
            this.computedTableHeight();
        },320)
    }

    computedTableHeight() {
		try {
            let h = this.tableHeight;
            this.tableHeight = this.right.nativeElement.offsetHeight - this.func.nativeElement.offsetHeight - config['layoutContentPadding'] * 2;
            if(this.tableHeight===h) this.computedScrollHeight = true;

            let l = this.leftTableHeight;
            this.leftTableHeight = this.leftBottom.nativeElement.offsetHeight -24;
            if(this.leftTableHeight===l) this.leftComputedScrollHeight = true;
        } catch (error) {}
    }

    //画图
    drawChart(obj) {
        let data=obj.data;
        let type=obj.type;

        let _self = this;

        this.selectGeneList.length = 0;
        if(type==='column'){
            this.chartDesc='';
            let bardata=[];
            let linedata=[];
            data.rows.forEach(d=>{
                let geneid=d[this.annotation+"_term"] ? d[this.annotation+"_term"] : d[this.annotation+"_term_id"];

                bardata.push({
                    x:-Math.log10(d[_self.annotation+"_qvalue"]),
                    y:d[_self.annotation+"_term_desc"],
                    category:'-log10（Qvalue）',
                    geneid:geneid,
                    qvalue:d[_self.annotation+"_qvalue"],
                    genenum:d[_self.annotation+"_term_candidate_gene_num"]
                });

                linedata.push({
                    x:d[_self.annotation+"_term_candidate_gene_num"],
                    y:d[_self.annotation+"_term_desc"],
                    category:'Term Candidate Gene Num'
                })
            })

            let config = {
                chart: {
                    title: `${this.annotation} 富集柱状图`,
                    dblclick: function(event) {
                        _self.promptService.open(event.target.innerHTML,newval=>{
                            this.setChartTitle(newval);
                            this.updateTitle();
                        });
                    },
                    mouseover: function(event, titleObj) {
                        titleObj
                            .attr("fill", "blue")
                            .append("title")
                            .text("双击修改标题");
                    },
                    mouseout: function(event, titleObj) {
                        titleObj.attr("fill", "#333");
                        titleObj.select("title").remove();
                    },
                    width: _self.leftBottom.nativeElement.offsetWidth * 0.8,
                    height: data['rows'].length * 20,
                    el: "#keggRichChartDiv",
                    type: "group",
                    types:['bar','line'],
                    enableChartSelect:true,
                    selectedModule: _self.isMultipleSelect?'multiple':'single',
                    direction:"horizontal",
                    "stroke-width":2,
                    interpolate: "linear",
                    data: bardata,
                    otherData:linedata,
                    otherColors:['#fd7d27'],
                    isPoint:true,
                    onselect:data=>{
                        this.selectGeneList.length = 0;
                        this.selectGeneList.push(...data.map(v=>v['geneid']));
                        if(!_self.isMultipleSelect){
                            this.chartBackStatus();
                        }
                    },
                    clearselect:()=>{
                        this.selectGeneList.length = 0;
                        this.chartBackStatus();
                    }
                },
                axis: {
                    x: {
                        title: "-log10（Q value）",
                        min:0,
                        dblclick: function(event) {
                            _self.promptService.open(event.target.innerHTML,newval=>{
                                this.setXTitle(newval);
                                this.updateTitle();
                            });
                        },
                        mouseover: function(event, titleObj) {
                            titleObj
                                .attr("fill", "blue")
                                .append("title")
                                .text("双击修改");
                        },
                        mouseout: function(event, titleObj) {
                            titleObj.attr("fill", "#333");
                            titleObj.select("title").remove();
                        }

                    },
                    x1:{
                        title:'Term Candidate Gene Num',
                        min:0,
                        rotate:30,
                        dblclick: function(event) {
                            _self.promptService.open(event.target.innerHTML,newval=>{
                                this.setXTitle(newval,'x1');
                                this.updateTitle();
                            });
                        },
                        mouseover: function(event, titleObj) {
                            titleObj
                                .attr("fill", "blue")
                                .append("title")
                                .text("双击修改");
                        },
                        mouseout: function(event, titleObj) {
                            titleObj.attr("fill", "#333");
                            titleObj.select("title").remove();
                        }
                    },
                    y: {}
                },
                legend: {
                    show: true,
                    separation:false,
                    click:(d,index)=>{
                        this.color = d3.select(d).attr('fill');
                        this.show = true;
                        this.legendIndex = index;
                    }
                },
                otherLegend: {
                    show: true
                },
                tooltip: [
                    function(d) {
                        return `<span>kegg Term: ${d.y}</span><br>
                        <span>kegg Term ID: ${ d.geneid }</span><br>
                        <span>Qvalue: ${d.qvalue}</span><br>
                        <span>-log10(Qvalue): ${ d.x }</span><br>
                        <span>Gene Number: ${d.genenum}</span>`;
                    },
                    function(d) {
                        return `<span>kegg Term: ${d.y}</span><br>
                        <span>Gene Number: ${d.x}</span>`;
                    }
                ]
            }

            this.chart=new gooalD3().init(config,{areaMinWidth:240});
        }else if(type==='bubble'){
            this.chartDesc="X轴为富集比例【选定的基因集中注释到某一条目的基因数与本物种注释到该条目总基因数的比值，计算公式为Rich Ratio = Term Candidate Gene Num / Term Gene Num】，Y轴为KEGG Pathway，气泡的大小表示注释到某个KEGG Pathway上的基因数目，颜色代表富集Qvalue值，颜色越深代表Qvalue值越小。 选择图中的某个气泡或者右上角“多选”模式下选择多个气泡，将在下方表格显示注释到这些KEGG Pathway上的差异基因情况。双击图标题或坐标轴标题可以修改文字，点击图例色条可以修改颜色。";
            var realData = [];
            var legendData = [];
            data.rows.forEach(function(d, i) {
                let geneid=d[_self.annotation+"_term"] ? d[_self.annotation+"_term"] : d[_self.annotation+"_term_id"];
                realData.push({
                    x: d[_self.annotation+"_rich_ratio"],
                    y: d[_self.annotation+"_term_desc"],
                    r: d[_self.annotation+"_term_candidate_gene_num"],
                    color: d[_self.annotation+"_qvalue"],
                    geneid:geneid
                });
                legendData.push(d[_self.annotation+"_qvalue"]);
            });

            let config1={
                chart: {
                    title: `${this.annotation} 富集气泡图`,
                    dblclick: function(event) {
                        _self.promptService.open(event.target.innerHTML,newval=>{
                            this.setChartTitle(newval);
                            this.updateTitle();
                        });
                    },
                    mouseover: function(event, titleObj) {
                      titleObj
                        .attr("fill", "blue")
                        .append("title")
                        .text("双击修改标题");
                    },
                    mouseout: function(event, titleObj) {
                      titleObj.attr("fill", "#333");
                      titleObj.select("title").remove();
                    },
                    el: "#keggRichChartDiv",
                    type: "bubble",
                    width: _self.leftBottom.nativeElement.offsetWidth * 0.8,
                    height: data['rows'].length * 20,
                    enableChartSelect:true,
                    selectedModule: _self.isMultipleSelect?'multiple':'single',
                    onselect: data => {
                        this.selectGeneList.length = 0;
                        this.selectGeneList.push(...data.map(v=>v['geneid']));
                        if(!_self.isMultipleSelect){
                            this.chartBackStatus();
                        }
                    },
                    clearselect:()=>{
                        this.selectGeneList.length = 0;
                        this.chartBackStatus();
                    },
                    data: realData,
                    colors: ["#00008B", "#87CEFA"],
                    radius: {
                      min: 5,
                      max: 10
                    }
                  },
                  axis: {
                    x: {
                      title: "Rich Ratio",
                        mouseover: function(event, titleObj) {
                            titleObj
                                .attr("fill", "blue")
                                .append("title")
                                .text("双击修改");
                        },
                        mouseout: function(event, titleObj) {
                            titleObj.attr("fill", "#333");
                            titleObj.select("title").remove();
                        },
                      rotate: 20,
                      min: 0,
                      dblclick: function(event) {
                        _self.promptService.open(event.target.innerHTML,newval=>{
                            this.setXTitle(newval);
                            this.updateTitle();
                        });
                      }
                    },
                    y: {}
                  },
                  legend: {
                    show: true,
                    data: legendData,
                    type: "gradient",
                    title: "Qvalue",
                    click:(d,index)=>{
                        this.bcolor = d;
                        this.bshow = true;
                        this.blegendIndex = index;
                    },
                    rLegend: {
                      show: true,
                      title: "Gene Number"
                    }
                  },
                  tooltip: function(d) {
                    return `<span>kegg Term: ${d.y}</span><br>
                    <span>kegg Term ID: ${ d.geneid }</span><br>
                    <span>Rich Ratio: ${ d.x }</span><br>
                    <span>Qvalue: ${d.color}</span><br>
                    <span>Gene Number: ${d.r}</span>`;
                  }
            }

            this.chart=new gooalD3().init(config1,{areaMinWidth:240});
        }
    }

    //color change 回调函数
    colorChange(curColor) {
        this.chart.setColor(curColor, this.legendIndex);
        this.chart.redraw();
    }

    bcolorChange(curColor) {
        this.chart.setColor(curColor, this.blegendIndex);
        this.chart.redraw();
    }

    chartSelectModelChange(model){
        this.chart.setChartSelectModule(this.isMultipleSelect?'multiple':'single');
        this.selectGeneList.length = 0;
    }

    multipleSelectConfirm(){
        this.chartBackStatus();
    }

}

