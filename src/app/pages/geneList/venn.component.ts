import { AddColumnService } from './../../super/service/addColumnService';
import { StoreService } from './../../super/service/storeService';
import { PageModuleService } from './../../super/service/pageModuleService';
import { MessageService } from './../../super/service/messageService';
import { AjaxService } from 'src/app/super/service/ajaxService';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Component, OnInit, ViewChild, AfterViewInit, Input } from '@angular/core';
import { GlobalService } from 'src/app/super/service/globalService';
import { TranslateService } from '@ngx-translate/core';
import { PromptService } from './../../super/service/promptService';
import config from '../../../config';
import { NzModalRef, NzModalService } from 'ng-zorro-antd';
declare const gooalD3: any;
declare const d3: any;
declare const Venn: any;
declare const $: any;

@Component({
	selector: 'app-gene-list-venn-page',
	template: `<app-gene-list-venn *ngIf="showModule" [defaultGeneType]="defaultGeneType">
                    <div *ngIf="rootGeneType===config['geneTypeAll']" class="gene-switch gene-switch-module" (click)="handlerSwitchChange()">
                        <span>{{defaultGeneType | translate}}</span><i class="iconfont icon-qiehuan"></i>
                    </div>
                    <div *ngIf="rootGeneType!==config['geneTypeAll']" class="gene-switch gene-switch-module nocursor">
                        <span>{{defaultGeneType | translate}}</span>
                    </div>
                </app-gene-list-venn>`,
	styles: []
})
export class GeneListVennPageComponent {
	config: object = config;
	rootGeneType: string = 'all'; // 来自菜单 可配置  all gene transcript
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
	selector: 'app-gene-list-venn',
	templateUrl: './venn.component.html',
	styles: []
})
export class GeneListVennComponent implements OnInit {
	// 表格高度相关
	@ViewChild('left') left;
	@ViewChild('right') right;
	@ViewChild('func') func;
	@ViewChild('addColumn') addColumn;
	@ViewChild('transformTable') transformTable;
	@ViewChild('tableChartContent') tableChartContent;
	@Input('defaultGeneType') defaultGeneType;

	switch: string = 'right';
	tableUrl: string;
	expandModuleDesc: boolean = false;

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

	venSelectAllData: string[] = [];

	panelShow: boolean = false;

	tableEntity: object = {};
	venn_or_upsetR: boolean;

	singleMultiSelect: object = {
		bar_name: '',
		total_name: '',
		venn_name: ''
	};

	//多选
	doubleMultiSelect: object = {
		bar_name: [],
		total_name: []
	};
	pageEntity: object = {
		pageSize: 20
	};

	chart: any;
	isMultiSelect: boolean;

	tableHeight = 0;
	first = true;

	legendIndex: number = 0;
	color = '#fff'; // 默认颜色
	show = false; // 是否显示颜色选择器
	venn: any; // 韦恩图对象实例

	leftSelect: any[] = [];
	upSelect: any[] = [];

	addColumnShow: boolean = false;
	showBackButton: boolean = false;

	// 基因集数据
	geneListMap: object = {};

	flex: boolean = true;
	chartLoading: boolean = false;
	chartError: string = '';
	scroll: object = { y: '400px' };
	tableData: any[] = [];
	chartData: any[] = [];
	isShowTable: boolean = false;
	isShowSelectPanel: boolean = true;
	getGeneListDone: boolean = false;

	selectPanelData: object[] = [];
	tagList: string[] = [];
	selectedTag: string = '';
	// 选中的数据
	selectPanelEntity: object = {
		tag: [],
		setNameList: [],
		gene: []
	};

	beforeSelectPanelEntity: object = {
		tag: [],
		setNameList: [],
		gene: []
	};

	selectGeneCount: number = 0;
    computedScrollHeight: boolean = false;
    defaultShowFilterStatus:boolean = false;

	constructor(
		private message: MessageService,
		private ajaxService: AjaxService,
		private globalService: GlobalService,
		public storeService: StoreService,
		public pageModuleService: PageModuleService,
		private translate: TranslateService,
		private promptService: PromptService,
		private addColumnService: AddColumnService,
		private router: Router,
		private modalService: NzModalService
	) {
		// 订阅windowResize 重新计算表格滚动高度
		this.message.getResize().subscribe((res) => {
			if (res['message'] === 'resize') {
				this.computedTableHeight();
				this.scrollHeight();
			}
		});

		// 每次切换路由计算表格高度
		this.router.events.subscribe((event) => {
			if (event instanceof NavigationEnd) this.computedTableHeight();
		});
		let browserLang = this.storeService.getLang();
		this.translate.use(browserLang);
	}

	ngOnInit() {
		(async () => {
			this.isMultiSelect = false;
			this.first = true;

			await this.getAllGeneList();

			// 图标切换查询参数
			this.tableUrl = `${config['javaPath']}/geneSet/graph`;
			this.tableEntity = {
				LCID: this.storeService.getStore('LCID'),
				setNameList: this.beforeSelectPanelEntity['setNameList'],
				geneType: this.defaultGeneType
			};
			this.getChartData();

			this.applyOnceSearchParams = true;
			this.defaultUrl = `${config['javaPath']}/geneSet/table`;
			this.defaultEntity = {
				pageIndex: 1, //分页
				pageSize: 20,
				LCID: sessionStorage.getItem('LCID'),
				leftChooseList: this.leftSelect, //upsetR参数
				upChooseList: this.upSelect, //胜利n图选中部分参数
				setNameList: this.beforeSelectPanelEntity['setNameList'], // compareGroup
				saveGeneSet: false,
				addThead: [], //扩展列
				transform: false, //是否转化（矩阵变化完成后，如果只筛选，就为false）
				mongoId: null,
				sortKey: null, //排序
				sortValue: null,
				// matchAll: false,
				reAnaly: false,
				matrix: false, //是否转化。矩阵为matrix
				relations: [], //关系组（简写，索引最后一个字段）
				geneType: this.defaultGeneType, //基因类型gene和transcript
				species: this.storeService.getStore('genome'), //物种
				version: this.storeService.getStore('version'),
				searchList: [],
				sortThead:this.addColumn['sortThead']
			};
			this.defaultTableId = 'diff_venn_default_gene';
			this.defaultDefaultChecked = true;
			this.defaultEmitBaseThead = true;
			this.defaultCheckStatusInParams = true;

			this.extendUrl = `${config['javaPath']}/geneSet/table`;
			this.extendEntity = {
				pageIndex: 1, //分页
				pageSize: 20,
				reAnaly: false,
				LCID: sessionStorage.getItem('LCID'), //流程id
				leftChooseList: [], //upsetR参数
				upChooseList: [], //胜利n图选中部分参数
				setNameList: this.beforeSelectPanelEntity['setNameList'], // compareGroup
				saveGeneSet: false,
				addThead: [], //扩展列
				transform: true, //是否转化（矩阵变化完成后，如果只筛选，就为false）
				mongoId: null,
				sortKey: null, //排序
				sortValue: null,
				// matchAll: false,
				matrix: true, //是否转化。矩阵为matrix
				relations: [], //关系组（简写，索引最后一个字段）
				geneType: this.defaultGeneType, //基因类型gene和transcript
				species: this.storeService.getStore('genome'), //物种
				version: this.storeService.getStore('version'),
				searchList: [],
				sortThead:this.addColumn['sortThead']
			};
			this.extendTableId = 'diff_venn_extend_gene';
			this.extendDefaultChecked = true;
			this.extendEmitBaseThead = true;
			this.extendCheckStatusInParams = false;

			setTimeout(() => {
				this.scrollHeight();
                this.computedTableHeight();
			}, 30);
		})();
	}

	handleSelectGeneCountChange(selectGeneCount) {
		this.selectGeneCount = selectGeneCount;
	}

	moduleDescChange() {
		this.expandModuleDesc = !this.expandModuleDesc;
		// 重新计算表格切换组件表格的滚动高度
		setTimeout(() => {
			this.scrollHeight();
		}, 30);
	}

	scrollHeight() {
		try {
			let tableChartContentH = this.tableChartContent.nativeElement.offsetHeight;
			let scrollH = tableChartContentH - 38 + 'px';
			this.scroll['y'] = scrollH;
		} catch (error) {}
	}

	toggle(status) {
		this.addColumnShow = status;
	}

	handlerColorChange(color) {
		if (this.selectPanelEntity['gene'].length != 1) {
			this.venn.setColor(color);
			this.venn.update();
		} else {
			this.chart.setColor(color, this.legendIndex);
			this.chart.redraw();
		}
	}

	// 重置图 应用图转换前的设置
	chartBackStatus() {
		this.defaultEmitBaseThead = true;
		this.showBackButton = false;
		// 初始化表的选中状态
		this.transformTable._initCheckStatus();
		// 清空表的筛选
		this.transformTable._clearFilterWithoutRequest();
		if (!this.first) {
			this.defaultEntity['setNameList'] = this.beforeSelectPanelEntity['setNameList'];
			this.defaultEntity['searchList'] = [];
			this.defaultEntity['pageIndex'] = 1;
			this.defaultEntity['rootSearchContentList'] = [];
			setTimeout(() => {
				this.first = true;
			}, 30);
		} else {
			this.transformTable._setParamsNoRequest('setNameList', this.beforeSelectPanelEntity['setNameList']);
			this.transformTable._setParamsNoRequest('pageIndex', 1);
			this.transformTable._getData();
		}
	}

	// {add:[],remove:[{}]}
	addThead(thead) {
		this.transformTable._initCheckStatus();

		this.transformTable._setParamsNoRequest('removeColumns', thead['remove']);
		this.transformTable._setParamsNoRequest('pageIndex', 1);

		this.transformTable._addThead(thead['add']);
	}

	// 表格转换 确定
	confirm(relations) {
		this.showBackButton = true;
		let checkParams = this.transformTable._getInnerParams();
		// 每次确定把之前的筛选参数放在下一次查询的请求参数里 请求完成自动清空上一次的请求参数，恢复默认；
		this.applyOnceSearchParams = true;
		this.extendEmitBaseThead = false;
		this.addColumn._clearThead();
		if (this.first) {
			this.extendCheckStatusInParams = false;
			this.extendEntity['checkStatus'] = checkParams['others']['checkStatus'];
			this.extendEntity['unChecked'] = checkParams['others']['excludeGeneList']['unChecked'];
			this.extendEntity['checked'] = checkParams['others']['excludeGeneList']['checked'];
			this.extendEntity['mongoId'] = checkParams['mongoId'];
			this.extendEntity['searchList'] = checkParams['tableEntity']['searchList'];
			this.extendEntity['rootSearchContentList'] = checkParams['tableEntity']['rootSearchContentList'];
			this.extendEntity['setNameList'] = this.beforeSelectPanelEntity['setNameList'];
			this.extendEntity['leftChooseList'] = checkParams['tableEntity']['leftChooseList'];
			this.extendEntity['upChooseList'] = checkParams['tableEntity']['upChooseList'];
			this.extendEntity['diffThreshold'] = checkParams['tableEntity']['diffThreshold'];
			this.extendEntity['relations'] = relations;
			this.extendEntity['addThead'] = checkParams['tableEntity']['addThead'];
			this.first = false;
		} else {
			this.transformTable._initTableStatus();
			this.extendCheckStatusInParams = false;
			this.transformTable._setExtendParamsWithoutRequest('checkStatus', checkParams['others']['checkStatus']);
			this.transformTable._setExtendParamsWithoutRequest(
				'checked',
				checkParams['others']['excludeGeneList']['checked'].concat()
			);
			this.transformTable._setExtendParamsWithoutRequest(
				'unChecked',
				checkParams['others']['excludeGeneList']['unChecked'].concat()
			);
			this.transformTable._setExtendParamsWithoutRequest('searchList', checkParams['tableEntity']['searchList']);
			this.transformTable._setExtendParamsWithoutRequest(
				'rootSearchContentList',
				checkParams['tableEntity']['rootSearchContentList']
			);
			this.transformTable._setExtendParamsWithoutRequest(
				'setNameList',
				this.beforeSelectPanelEntity['setNameList']
			);
			this.transformTable._setExtendParamsWithoutRequest('relations', relations);
			// 每次checkStatusInParams状态变完  再去获取数据
			this.transformTable._setExtendParamsWithoutRequest('addThead', checkParams['tableEntity']['addThead']);
			setTimeout(() => {
				this.transformTable._getData();
			}, 30);
		}
		setTimeout(() => {
			this.extendCheckStatusInParams = true;
		}, 30);
	}

	// 表格转换返回
	back() {
		this.chartBackStatus();
	}

	// 在认为是基础头的时候发出基础头 双向绑定到增删列
	baseTheadChange(thead) {
		this.baseThead = thead['baseThead'].map((v) => v['true_key']);
	}

	resize(event) {
		setTimeout(() => {
			this.computedTableHeight();
		}, 30);
	}

	// 获取所有基因集
	async getAllGeneList() {
		return new Promise((resolve, reject) => {
			this.ajaxService
				.getDeferData({
					url: `${config['javaPath']}/geneSet/getTags`,
					data: {
						LCID: sessionStorage.getItem('LCID'),
						geneType: this.defaultGeneType
					}
				})
				.subscribe(
					(res) => {
						this.selectPanelEntity['tag'].length = 0;
						this.selectPanelEntity['gene'].length = 0;
						this.selectPanelEntity['setNameList'].length = 0;
						this.selectPanelData.length = 0;

						if (res['status'] == 0 && !$.isEmptyObject(res['data'])) {
							this.tagList = res['data']['tags'];
							this.selectPanelData = res['data']['genelist'];

							this.selectPanelData.map((v, index) => {
								v['checked'] = index ? false : true;
								if (v['checked']) {
									this.selectPanelEntity['setNameList'].push(v['setName']);
									this.selectPanelEntity['gene'].push(v);
								}
								return v;
							});
						}

						this.copyPanelEntity();
						this.getGeneListDone = true;
						resolve('success');
					},
					(error) => {
						this.getGeneListDone = true;
						reject('error');
					}
				);
		});
	}

	// 获取图数据
	getChartData() {
		this.chartLoading = true;
		this.ajaxService
			.getDeferData({
				url: this.tableUrl,
				data: this.tableEntity
			})
			.subscribe(
				(data: any) => {
					if (data.status === '0' && (data.data.length == 0 || $.isEmptyObject(data.data))) {
						this.chartError = 'nodata';
					} else if (data.status === '-1') {
						this.chartError = 'error';
					} else if (data.status === '-2') {
						this.chartError = 'dataOver';
					} else {
						this.chartError = '';
						this.tableData = data.data;
						this.chartData = data.data;
						setTimeout(() => {
							this.drawVenn(data.data);
						}, 30);
					}
				},
				(error) => {
					$('#geneListTableSwitchChart_chart').html('');
					this.chartError = error;
				},
				() => {
					$('#geneListTableSwitchChart_chart').html('');
					this.chartLoading = false;
					setTimeout(() => {
						this.scrollHeight();
					}, 30);
				}
			);
	}

	// 标签多选的时候
	handleTagSelectChange() {
		this.ajaxService
			.getDeferData({
				url: `${config['javaPath']}/geneSet/display`,
				data: {
					LCID: sessionStorage.getItem('LCID'),
					geneType: this.defaultGeneType,
					tags: this.selectPanelEntity['tag']
				}
			})
			.subscribe(
				(res) => {
					if (res['status'] == 0 && res['data'].length) {
						this.selectPanelData = res['data'];
						this.selectPanelData.map((val, index) => {
							val['checked'] = index ? false : true;
							return val;
						});

						this.selectPanelEntity['gene'].length = 0;
						this.selectPanelEntity['setNameList'].length = 0;

						this.selectPanelEntity['gene'].push(this.selectPanelData[0]);
						this.selectPanelEntity['setNameList'].push(this.selectPanelData[0]['setName']);
					} else {
						this.selectPanelData.length = 0;
						this.selectPanelEntity['gene'].length = 0;
						this.selectPanelEntity['setNameList'].length = 0;
					}
					this.copyPanelEntity();
					this.chartBackStatus();
					this.getChartData();
				},
				(error) => {}
			);
	}

	// 点击选择基因集
	handleGeneListClick(gene) {
		gene['checked'] = !gene['checked'];
		if (gene['checked']) {
			this.selectPanelEntity['gene'].push(gene);
			this.selectPanelEntity['setNameList'].push(gene['setName']);
		} else {
			let index = this.selectPanelEntity['gene'].findIndex((val, index) => {
				return val['setName'] === gene['setName'];
			});
			if (index != -1) {
				this.selectPanelEntity['gene'].splice(index, 1);
				this.selectPanelEntity['setNameList'].splice(index, 1);
			}
		}
	}

	// 删除标签
	handleDelete(item) {
		if (item['checked']) {
			let index = this.selectPanelEntity['gene'].findIndex((val, index) => {
				return val['setName'] === item['setName'];
			});
			if (index != -1) {
				this.selectPanelEntity['gene'].splice(index, 1);
				this.selectPanelEntity['setNameList'].splice(index, 1);
				this.copyPanelEntity();
			}
		}

		let tpl = null;
		tpl = this.modalService.create({
			nzTitle: '删除基因集',
			nzContent: `是否删除${item['setName']}`,
			nzMaskClosable: true,
			nzClosable: true,
			nzOnOk: () => {
				this.ajaxService
					.getDeferData({
						url: `${config['javaPath']}/geneSet/delete`,
						data: {
							geneType: this.defaultGeneType,
							LCID: sessionStorage.getItem('LCID'),
							setName: item['setName']
						}
					})
					.subscribe(
						(res) => {
							if (res['status'] == 0) {
								(async () => {
									this.selectPanelEntity['tag'].length = 0;
									this.selectPanelEntity['gene'].length = 0;
									this.selectPanelEntity['setNameList'].length = 0;
                                    this.copyPanelEntity();

                                    this.leftSelect.length = 0;
                                    this.upSelect.length = 0;
                                    this.defaultShowFilterStatus = !!this.leftSelect.length || !!this.upSelect.length;
									await this.getAllGeneList();
									await this.getChartData();
								})();
							}
						},
						(error) => console.log(error)
					);
			},
			nzOnCancel: () => {
				tpl.destroy();
			}
		});
    }

    saveGeneListSuccess(argv){
		(async()=>{
			this.selectPanelEntity['tag'].length = 0;
			await this.getAllGeneList();
			this.updateVenn();
		})()
    }

	//选择面板 确定筛选的数据
	selectConfirm(data) {
		this.upSelect.length = 0;
		this.leftSelect.length = 0;

        this.defaultShowFilterStatus = !!this.leftSelect.length || !!this.upSelect.length;
		this.copyPanelEntity();
		this.chartBackStatus();
		this.updateVenn();
	}

	copyPanelEntity() {
		for (let name in this.selectPanelEntity) {
			if (this.selectPanelEntity[name] instanceof Array) {
				this.beforeSelectPanelEntity[name].length = 0;
				this.beforeSelectPanelEntity[name].push(...this.selectPanelEntity[name]);
			} else if (this.selectPanelEntity[name] instanceof Object) {
				this.beforeSelectPanelEntity[name] = JSON.parse(JSON.stringify(this.selectPanelEntity[name]));
			} else {
				this.beforeSelectPanelEntity[name] = this.selectPanelEntity[name];
			}
		}
	}

	drawVenn(data) {
		let d_length = data['total'].length;
		if (d_length > 5) {
			this.venn_or_upsetR = true;
			// this.isShowTable=false;
			this.showUpSetR(data);
		} else if (d_length <= 5 && d_length >= 2) {
			this.venn_or_upsetR = false;
			// this.isShowTable=false;
			this.showVenn(data);
		} else {
			this.venn_or_upsetR = false;
			this.showCircle(data);
			// this.isShowTable=true;
			// this.showVenn(data);
		}
	}

	// 切换左右布局 计算左右表格的滚动高度
	switchChange(status) {
		this.switch = status;
		setTimeout(() => {
			this.scrollHeight();
			this.computedTableHeight();
		}, 320);
	}

	computedTableHeight() {
		try {
			let h = this.tableHeight;
			this.tableHeight = this.right.nativeElement.offsetHeight - this.func.nativeElement.offsetHeight - config['layoutContentPadding'] * 2;
			if (this.tableHeight === h) this.computedScrollHeight = true;
		} catch (error) {}
	}

	//单、多选change
	multiSelectChange() {
		this.upSelect.length = 0;
        this.leftSelect.length = 0;
        this.defaultShowFilterStatus = !!this.leftSelect.length || !!this.upSelect.length;
		this.chart.setChartSelectModule(this.isMultiSelect ? 'multiple' : 'single');
		this.chartBackStatus();
		this.updateVenn();
	}

	toggleSelectPanel() {
		this.isShowSelectPanel = !this.isShowSelectPanel;
		setTimeout(() => {
			this.scrollHeight();
		}, 30);
	}

	reGetData() {
		this.getChartData();
	}

	//韦恩,upsetR图二次更新
	updateVenn() {
		this.tableEntity['setNameList'] = this.beforeSelectPanelEntity['setNameList'];
		this.reGetData();

		this.singleMultiSelect = {
			bar_name: '',
			total_name: '',
			venn_name: ''
		};

		this.doubleMultiSelect = {
			bar_name: [],
			total_name: []
		};
	}

	//venn和upsetR只能单选时候
	doSingleData() {
		this.leftSelect.length = 0;
        this.upSelect.length = 0;
		if (this.beforeSelectPanelEntity['setNameList'].length > 5) {
            // upset
			if (this.singleMultiSelect['bar_name']) this.upSelect.push(this.singleMultiSelect['bar_name']);
			if (this.singleMultiSelect['total_name']) this.leftSelect.push(this.singleMultiSelect['total_name']);
		} else {
            this.upSelect.push(this.singleMultiSelect['venn_name']);
		}

        this.defaultShowFilterStatus = !!this.leftSelect.length || !!this.upSelect.length;
		this.chartBackStatus();
	}

	//多选确定时候,提交的数据
	multipleConfirm() {
		let tempData = this.venn_or_upsetR ? this.doubleMultiSelect : this.venSelectAllData;
		this.leftSelect.length = 0;
		this.upSelect.length = 0;

		if (tempData instanceof Array) {
			this.upSelect.push(...tempData);
		} else {
			this.upSelect.push(...tempData['bar_name']);
			this.leftSelect.push(...tempData['total_name']);
		}

        this.defaultShowFilterStatus = !!this.leftSelect.length || !!this.upSelect.length;
		this.chartBackStatus();
	}

	redrawChart(width, height?) {
		this.isMultiSelect = false;
	}

	// 图表切换刷新
	handlerRefresh() {
		// 清空选择的数据
		this.upSelect.length = 0;
        this.leftSelect.length = 0;
        this.defaultShowFilterStatus = !!this.leftSelect.length || !!this.upSelect.length;
		this.getChartData();
		this.chartBackStatus();
	}

	// 画拼图
	showCircle(data) {
		let _self = this;
		let params: object = {
			chart: {
				title: '',
				dblclick: function(event) {
					_self.promptService.open(event.target.textContent,val=>{
						this.setChartTitle(val);
						this.updateTitle();
					})
				},
				width: 700,
				height: 300,
				onselect: (d) => {
					this.singleMultiSelect = { bar_name: '', total_name: '', venn_name: '' };
					this.doubleMultiSelect = { bar_name: [], total_name: [] };

					if (d.length) {
						this.singleMultiSelect['venn_name'] = d[0]['data']['name'];
						this.upSelect.push(this.singleMultiSelect['venn_name']);
					} else {
						this.upSelect.length = 0;
					}

                    this.defaultShowFilterStatus = !!this.leftSelect.length || !!this.upSelect.length;
					this.chartBackStatus();
				},
				padding: 0.02,
				outerRadius: 120,
				startAngle: 0,
				endAngle: 360,
				showLabel: true,
				enableChartSelect: true,
				selectedModule: _self.isMultiSelect ? 'multiple' : 'single',
				custom: [ 'name', 'value' ],
				el: '#geneListTableSwitchChart_chart',
				type: 'pie',
				data: data['rows']
			},
			legend: {
				show: true,
				position: 'right',
				click: (d, index) => {
					this.color = d3.select(d).attr('fill');
					this.show = true;
					this.legendIndex = index;
				}
			},
			tooltip: (d) => '<span>name：' + d.data.name + '</span><br><span>value：' + d.data.value + '</span>'
		};

		this.chart = new gooalD3().init(params);
	}

	//显示venn图
	showVenn(data) {
		let that = this;
		let tempA = data.rows.map((o) => {
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

		this.venn = new Venn({ id: 'geneListTableSwitchChart_chart' })
			.config({
				data: tempR,
				compareGroup: that.beforeSelectPanelEntity['setNameList'],
				isMultipleSelect: that.isMultiSelect
			})
			.drawVenn()
			.hover(
				function() {
					this.$select.$el.setAttribute('opacity', '0.5');
				},
				function() {
					this.$select.$el.setAttribute('opacity', '0');
				}
			)
			.on('click', function() {
				if (!that.isMultiSelect) {
					that.singleMultiSelect['bar_name'] = '';
					that.singleMultiSelect['total_name'] = '';
					that.singleMultiSelect['venn_name'] = this.$select.$data.result.CompareGroup;
					that.doSingleData();
				} else {
					let tempVenn = [];
					this.selectCollection.forEach((element) => {
						tempVenn.push(element.result.CompareGroup);
					});
					that.venSelectAllData = tempVenn;
				}
			})
			.legendClick(function(ev, el) {
				that.color = el['$el'].getAttribute('fill');
				that.show = true;
				ev.stopPropagation();
			})
			.svgClick(function() {
				if (that.isMultiSelect) {
					that.venSelectAllData.length = 0;
				} else {
					that.singleMultiSelect['bar_name'] = '';
					that.singleMultiSelect['total_name'] = '';
					that.singleMultiSelect['venn_name'] = '';
				}
                that.upSelect.length = 0;
                that.defaultShowFilterStatus = !!that.leftSelect.length || !!that.upSelect.length;
				that.chartBackStatus();
			});
	}

	showUpSetR(data) {
		document.getElementById('geneListTableSwitchChart_chart').innerHTML = '';
		let _self = this;
		let selectBar = [];
		let tempBar = data.rows;
		for (let index = 0; index < tempBar.length; index++) {
			const element = tempBar[index].value;
			if (element != 0) {
				selectBar.push(tempBar[index]);
			}
		}

		let t_chartID = document.getElementById('geneListTableSwitchChart_chart');
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
			//total_name_max.push(getBLen(List.total[i].name));
			total_name.push(List.total[i].name);
			total_value.push(List.total[i].value);
		}

		let left_name_length = getNameLength(total_name);
		// if (left_name_length > 140) {
		// 	left_name_length = 140;
		// }
		let height1 = 150; //上面的高
		let width2 = 150;  //左面的高

		let kong_name_right = 10;

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
		let d3_rectKong = 2; //柱子间的间宽
		let d3_xlength = bar_value.length; //矩阵圆点的x轴有多少柱子
		let d3_ylength = total_value.length; //矩阵圆点的y轴有多少柱子

		let d3_width = d3_rectWidth * d3_xlength + d3_rectKong * (d3_xlength + 1);
		let d3_height = d3_rectWidth * d3_ylength + d3_rectKong * (d3_ylength + 1);

		let nameList = [];
		let tempName = {};
		let sName = {};
		let drawCircle = [];
		let tempThat;
		let tempP;
		let tempCricle; //圆
		let tempThatTwo;

		let padding1 = { left: 60, right: 30, top: 20, bottom: 10 };
		let padding2 = { left: 15, right: 15, top: 0, bottom: 60 };

		let svg_height = 300 + d3_height + padding1.top + padding1.bottom + padding2.top + padding2.bottom; //计算最外层svg高度
		let svg_width = 320 + d3_width + padding1.left + padding1.right + padding2.left + padding2.right; //计算最外层svg宽度


		let g_map_top = 30;
		let g_map_left = 30;
		let g_map_height = 180;

		let svg = d3.select('#svg').attr('width', svg_width).attr('height', svg_height).on(
			'click',
			function(d) {
				if(_self.leftSelect.length != 0 || _self.upSelect.length != 0){
					_self.updateVenn();
					_self.leftSelect.length = 0;
					_self.upSelect.length = 0;
					_self.defaultShowFilterStatus = false;
					_self.chartBackStatus();
				}
				// _self.updateVenn();
				// _self.leftSelect.length = 0;
				// _self.upSelect.length = 0;
				// _self.defaultShowFilterStatus = false;
				// _self.chartBackStatus();
			},
			false
		);

		drawSvg();
		drawSvg2();
		drawSvgName();
		drawSvg3();

		function drawSvg() {
			let width1 = d3_width + padding1.left + padding1.right;
			//let height1 = 240;

			let svg1 = d3
				.select('#svg')
				.append('svg')
				//.attr('x', '320')
				//.attr('y', '0')
				.attr('x', width2+30+left_name_length - padding1.left)//减小宽高 220 - g_map_left
				.attr('y', g_map_top)
				.attr('width', width1)
				.attr('height', height1)
				.attr('class', 'svg1');
			let xScale1 = d3.scaleBand().domain(bar_name).range([ 0, d3_width ]).paddingOuter(0.1).paddingInner(1);
			let yScale1 = d3
				.scaleLinear()
				.domain([ 0, d3.max(bar_value) ])
				.range([ height1 - padding1.bottom - padding1.top, 0 ]);

			d3_xScale = xScale1;
			let xAxis1 = d3.axisBottom(xScale1);
			let yAxis1 = d3.axisLeft(yScale1).ticks(5);

			let tempSelectColor = '';

			let rects1 = svg1
				.selectAll('MyRect1')
				.data(bar_value)
				.enter()
				.append('g')
				.on('mouseover', function(d, i) {
					tempSelectColor = d3.select(this).select('.MyRect').attr('fill');
					d3.select(this).select('.MyRect').attr('fill', '#3D4871');
					let tipText = `Group: ${bar_name[i]}<br> Number:  ${d}`;
					_self.globalService.showPopOver(d3.event, tipText,"left");
				})
				.on('mouseout', function(d, i) {
					if (d3.select(this).select('.MyRect').attr('fill') == '#3D4871') {
						d3.select(this).select('.MyRect').attr('fill', tempSelectColor);
					}
					_self.globalService.hidePopOver();
				})
				.on('click', function(d, i) {
					var event = d3.event;
					event.stopPropagation();
					if (!_self.isMultiSelect) {
						d3.select(this).select('.MyRect').attr('fill', tempSelectColor);
						if (d3.select(this).select('.MyRect').attr('fill') == '#333') {
							d3.selectAll('.MyRect').attr('fill', '#333');
							d3.select(this).select('.MyRect').attr('fill', 'steelblue');
							_self.singleMultiSelect['bar_name'] = bar_name[i]; ///222
							_self.singleMultiSelect['total_name'] = '';
							_self.doSingleData();
						} else if (d3.select(this).select('.MyRect').attr('fill') == 'steelblue') {
							d3.selectAll('.MyRect').attr('fill', '#333');
							d3.select(this).select('.MyRect').attr('fill', '#333');
							_self.singleMultiSelect['bar_name'] = ''; ///222
							_self.singleMultiSelect['total_name'] = '';
							_self.doSingleData();
						}
					} else {
						//多选
						d3.select(this).select('.MyRect').attr('fill', tempSelectColor);
						if (d3.select(this).select('.MyRect').attr('fill') == '#333') {
							//d3.select('.svg1').selectAll('.MyRect').attr('fill', '#333');
							d3.select(this).select('.MyRect').attr('fill', 'steelblue');
							_self.doubleMultiSelect['bar_name'] = selectName2(
								_self.doubleMultiSelect['bar_name'],
								bar_name[i]
							);
						} else if (d3.select(this).select('.MyRect').attr('fill') == 'steelblue') {
							//d3.select('.svg1').selectAll('.MyRect').attr('fill', '#333');
							d3.select(this).select('.MyRect').attr('fill', '#333');
							_self.doubleMultiSelect['bar_name'] = selectName2(
								_self.doubleMultiSelect['bar_name'],
								bar_name[i]
							);
						}
					}
				});

			rects1
				.append('rect')
				.attr('class', 'MyRect')
				.attr('transform', 'translate(' + padding1.left + ',' + padding1.top + ')')
				.attr('x', function(d, i) {
					return xScale1(bar_name[i]);
				})
				.attr('y', function(d, i) {
					return yScale1(d);
				})
				.attr('width', d3_rectWidth)
				.attr('height', function(d, i) {
					return height1 - padding1.bottom - padding1.top - yScale1(d);
				})
				.attr('fill', '#333')
				.attr('stroke-width', 10)
				.attr('stroke', '#333')
				.attr('stroke-opacity', 0);

			svg1
				.append('g')
				.attr('class', 'axis_x1')
				.attr('transform', 'translate(' + padding1.left + ',' + (height1 - padding1.bottom) + ')')
				.call(xAxis1);
			svg1
				.append('g')
				.attr('class', 'axis_y1')
				.attr('transform', 'translate(' + padding1.left + ',' + padding1.top + ')')
				.call(yAxis1);
		}

		// function selectName(sList,d) {
		// 	if (sList.length == 0) {
		// 		sList.push(d);
		// 	} else {
		// 		if(sList[0]==d){
		// 			sList.length=0;
		// 		}else{
		// 			sList.length=0;
		// 			sList.push(d)
		// 		}
		// 	}
		// 	return sList;
		// }

		function selectName2(sList, d) {
			if (sList.length == 0) {
				sList.push(d);
				sName[d] = true;
			} else {
				if (sName[d]) {
					for (let i = 0; i < sList.length; i++) {
						if (sList[i] == d) {
							sList.splice(i, 1);
							sName[d] = false;
						}
					}
				} else {
					sList.push(d);
					sName[d] = true;
				}
			}
			return sList;
		}

		function drawSvg2() {

			//let width2 = 320 - left_name_length - kong_name_right;
			//let width2 = 320 - left_name_length - kong_name_right - 100;//减小宽高
			//let width2 = 320 - left_name_length - kong_name_right - 100;//减小宽高
			let height2 = d3_height + padding2.top + padding2.bottom;

			let svg2 = d3
				.select('#svg')
				.append('svg')
				.attr('x', padding1.left - g_map_left)
				//.attr('y', '300')
				.attr('y', g_map_height)//减小宽高
				.attr('width', width2)
				.attr('height', height2)
				.attr('class', 'svg2');

			let xScale2 = d3.scaleLinear().domain([ 0, d3.max(total_value) ]).range([ width2 - padding2.right - padding2.left, 0 ]);

			let yScale2 = d3.scaleBand().domain(total_name).range([ d3_height, 0 ]);

			d3_yScale = yScale2;

			let xAxis2 = d3.axisBottom(xScale2).ticks(5);
			let yAxis2 = d3.axisRight(yScale2);

			let tempSelectColor = '';

			let rects2 = svg2
				.selectAll('MyRect2')
				.data(total_value)
				.enter()
				.append('g')
				.on('mouseover', function(d, i) {
					tempSelectColor = d3.select(this).select('.MyRect').attr('fill');
					//console.log(tempSelectColor);
					d3.select(this).select('.MyRect').attr('fill', '#3D4871');
					let tipText = `Group: ${total_name[i]}<br> Number:  ${d}`;
					_self.globalService.showPopOver(d3.event, tipText);
				})
				.on('mouseout', function(d, i) {
					if (d3.select(this).select('.MyRect').attr('fill') == '#3D4871') {
						d3.select(this).select('.MyRect').attr('fill', tempSelectColor);
					}
					_self.globalService.hidePopOver();
				})
				.on('click', function(d, i) {
					var event = d3.event;
					event.stopPropagation();
					if (!_self.isMultiSelect) {
						d3.select(this).select('.MyRect').attr('fill', tempSelectColor);
						if (d3.select(this).select('.MyRect').attr('fill') == '#333') {
							d3.selectAll('.MyRect').attr('fill', '#333');
							d3.select(this).select('.MyRect').attr('fill', 'steelblue');
							_self.singleMultiSelect['total_name'] = total_name[i]; ///222
							_self.singleMultiSelect['bar_name'] = '';
							_self.doSingleData();
						} else if (d3.select(this).select('.MyRect').attr('fill') == 'steelblue') {
							d3.selectAll('.MyRect').attr('fill', '#333');
							d3.select(this).select('.MyRect').attr('fill', '#333');
							_self.singleMultiSelect['total_name'] = ''; ///222
							_self.singleMultiSelect['bar_name'] = '';
							_self.doSingleData();
						}
					} else {
						//多选
						d3.select(this).select('.MyRect').attr('fill', tempSelectColor);
						if (d3.select(this).select('.MyRect').attr('fill') == '#333') {
							//d3.select('.svg2').selectAll('.MyRect').attr('fill', '#333');
							d3.select(this).select('.MyRect').attr('fill', 'steelblue');
							_self.doubleMultiSelect['total_name'] = selectName2(
								_self.doubleMultiSelect['total_name'],
								total_name[i]
							);
						} else if (d3.select(this).select('.MyRect').attr('fill') == 'steelblue') {
							//d3.select('.svg2').selectAll('.MyRect').attr('fill', '#333');
							d3.select(this).select('.MyRect').attr('fill', '#333');
							_self.doubleMultiSelect['total_name'] = selectName2(
								_self.doubleMultiSelect['total_name'],
								total_name[i]
							);
						}
					}
				});

			rects2
				.append('rect')
				.attr('class', 'MyRect')
				.attr('x', function(d, i) {
					return xScale2(d) + padding2.left;
				})
				.attr('y', function(d, i) {
					return yScale2(total_name[i]);
				})
				.attr('width', function(d, i) {
					return width2 - padding2.right - xScale2(d) - padding2.left;
				})
				.attr('height', function(d, i) {
					return d3_rectWidth;
				})
				.attr('fill', '#333')
				.attr('stroke-width', 10)
				.attr('stroke', '#333')
				.attr('stroke-opacity', 0);

			svg2
				.append('g')
				.attr('class', 'axis_x2')
				.attr('transform', 'translate(' + padding2.left + ',' + (height2 - padding2.bottom) + ')')
				.call(xAxis2)
				.selectAll('text')
				.attr('fontsize', '12')
				.style("text-anchor", "end")
				.attr("transform", "rotate(-60)")
				.attr("dx","-6")
				.attr("dy","0");
			svg2
				.append('g')
				.attr('class', 'axis_y2')
				.attr('transform', 'translate(' + (width2 - padding2.right) + ',' + padding2.top + ')')
				.call(yAxis2);
		}

		function drawSvgName() {
			let widthk = left_name_length + kong_name_right;
			let heightk = d3_height + padding2.top + padding2.bottom;

			let svgk = d3
				.select('#svg')
				.append('svg')
				//.attr('x', 320 - left_name_length - kong_name_right + padding1.left)
				//.attr('x', 320 - left_name_length - kong_name_right + padding1.left - 40)
				//.attr('x', 320 - left_name_length - kong_name_right + padding1.left - 100 - 30)//减小宽高   g_map_left
				//.attr('y', '300')
				.attr('x',width2+25)
				.attr('y', g_map_height)//减小宽高
				.attr('width', widthk)
				.attr('height', heightk)
				.attr('class', 'svgk');

			let yScalek = d3.scaleBand().domain(total_name).range([ d3_height, 0 ]);

			let yAxisk = d3.axisLeft(yScalek);

			let tempSelectColor = '';
			let textsk = svgk
				.selectAll('text')
				.data(total_name)
				.enter()
				.append('text')
				.attr('class', 'MyText')
				.attr('width', left_name_length)
				.attr('dx', function(d, i) {
					return 0;
				})
				.attr('dy', function(d, i) {
					return yScalek(total_name[i]) + d3_rectKong * 6;
				})
				.text(function(d, i) {
					return d;
				})
				.on('mouseover', function(d, i) {
					if (d3.select(this).style('fill') != 'red') {
						tempSelectColor = d3.select(this).style('fill');
						d3.select(this).style('fill', '#475FB1');
					}
				})
				.on('mouseout', function(d, i) {
					if (d3.select(this).style('fill') != 'red') {
						d3.select(this).style('fill', tempSelectColor);
					}
				})
				.on('click', function(d, i) {
					var event = d3.event;
					event.stopPropagation();
					sortName(d, d3.select(this));
				});
			svgk
				.append('g')
				.attr('class', 'axis_yk')
				.attr('transform', 'translate(' + 0 + ',' + padding2.top + ')')
				.call(yAxisk);
		}

		function sortName(d, that) {
			if (nameList.length == 0) {
				nameList.push(d);
				tempName[d] = true;
				that.style('fill', 'red');
			} else {
				if (tempName[d]) {
					for (let i = 0; i < nameList.length; i++) {
						if (nameList[i] == d) {
							nameList.splice(i, 1);
							tempName[d] = false;
							that.style('fill', 'black');
						}
					}
				} else {
					nameList.push(d);
					tempName[d] = true;
					that.style('fill', 'red');
				}
			}

			nameToCircle(nameList);
		}

		function drawSvg3() {
			let width3 = d3_width + padding1.left + padding1.right;
			let height3 = d3_height + padding2.top + padding2.bottom;

			let svg3 = d3
				.select('#svg')
				.append('svg')
				//.attr('x', '320')
				//.attr('x', '280')
				.attr('x', width2+30+left_name_length)//减小宽高 g_map_left
				//.attr('y', '300')
				.attr('y', g_map_height)//减小宽高
				.attr('width', width3)
				.attr('height', height3);

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
						x_axis: d3_xScale(bar_name[i]) + d3_rectWidth / 2,
						y_axis: d3_yScale(total_name[j]) + d3_rectWidth / 2,
						r: 5,
						flag: threeC(total_name[j], bar_name[i]) ? true : false,
						color: threeC(total_name[j], bar_name[i]) ? '#222' : '#C8C8C8',
						nameX: threeC(total_name[j], bar_name[i]) ? bar_name[i] : '',
						nameY: total_name[j],
						sort: sortC(bar_name[i])
					};
					jsonCircles.push(temp);
				}
			}

			drawCircle = jsonCircles;

			makeBaseCircle(jsonCircles, svg3); //造点 这时候包含点的颜色 基本圆

			drawLine(sortArr(jsonCircles, 'x_axis'), svg3, '#333'); //把x轴相同的分在一起 画线

			svg3.append('g').attr('class', 'axis_xCircle').attr('transform', 'translate(0,0)').call(xAxis3);
			svg3.append('g').attr('class', 'axis_yCircle').attr('transform', 'translate(0,0)').call(yAxis3);
		}

		//造点 这时候包含点的颜色 添加圆 基本圆
		function makeBaseCircle(arr, svg_t) {
			if (arr.length > 0) {

				let tempyList = sortArr(arr, 'y_axis');

				for (let i = 0; i < tempyList.length; i++) {
					svg_t
						.append('rect')
						.attr('class', 'MyRect4')
						.attr('x', 0)
						.attr('y', tempyList[i][0]['y_axis'] - d3_rectWidth / 2 - 1.5)
						.attr('width', d3_width + padding1.right)
						.attr('height', d3_rectWidth + 3)
						.attr('opacity', 0.7)
						.attr('fill', i % 2 == 0 ? '#DDD' : 'none')
						.on('click', function(d) {
							var event = d3.event;
							event.stopPropagation();
						});
				}


				svg_t
					.selectAll('.MyCircle')
					.data(arr)
					.enter()
					.append('circle')
					.attr('class', 'MyCircle')
					.attr('cx', function(d, i) {
						return d['x_axis'];
					})
					.attr('cy', function(d, i) {
						return d['y_axis'];
					})
					.attr('r', function(d, i) {
						return d['r'];
					})
					.style('fill', function(d) {
						return d.color;
					})
					.on('click', function(d) {
						var event = d3.event;
						event.stopPropagation();
					});



				// let tempList = sortArr(arr, 'x_axis');
				// for (let i = 0; i < tempList.length; i++) {
				// 	svg_t
				// 		.append('rect')
				// 		.attr('class', 'MyRect3')
				// 		.attr('x', tempList[i][0]['x_axis'] - d3_rectWidth / 2)
				// 		.attr('y', function(d, i) {
				// 			return 0;
				// 		})
				// 		.attr('width', d3_rectWidth)
				// 		.attr('height', function(d, i) {
				// 			return d3_height;
				// 		})
				// 		.attr('opacity', 0)
				// 		.attr('fill', '#87CEFA')
				// 		.on('mouseover', function(d, i) {
				// 			d3.select(this).attr('opacity', 0.5);
				// 		})
				// 		.on('mouseout', function(d) {
				// 			d3.select(this).attr('opacity', 0);
				// 		});
				// }
			}
		}

		function drawLine(targetGroup, svg_f, color) {
			let temp = [];
			let tempThatone = svg_f.append('g');
			tempThatTwo = tempThatone;

			let line = d3
				.line()
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
					.append('path')
					.attr('class', 'line')
					.attr('d', line(tempArr))
					.attr('stroke', '#333')
					.attr('stroke-width', 2);
			}

			var g = tempThatone
				.selectAll('.MyCircle2')
				.data(temp)
				.enter()
				.append('circle')
				.attr('class', 'MyCircle2')
				.attr('cx', function(d, i) {
					return d['x_axis'];
				})
				.attr('cy', function(d, i) {
					return d['y_axis'];
				})
				.attr('r', function(d, i) {
					return d['r'];
				})
				.style('fill', function(d) {
					return d.color;
				})
				.on('click', function(d) {
					var event = d3.event;
					event.stopPropagation();
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
					_t = [ arr[i] ];
				}
			}
			// 将最后的内容推出新数组
			_arr.push(_t);
			return _arr;
		}

		function threeC(lis1, lis2) {
			let m_flag = false;
			if (lis2.indexOf('∩') != -1) {
				lis2 = lis2.split('∩');
				for (let index = 0; index < lis2.length; index++) {
					if (lis2[index] == lis1) m_flag = true;
				}
			} else {
				if (lis1 == lis2) {
					m_flag = true;
				} else {
					m_flag = false;
				}
			}
			return m_flag;
		}

		function sortC(lis2) {
			return lis2.split('∩').sort();
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
			let tempdata = selectBaseCircle2(drawCircle, nameList.sort(), nameList.length);
			drawLine2(tempdata, tempThatTwo, 'red'); //把x轴相同的分在一起 画线
		}
		function selectBaseCircle2(arr, targetArr, num) {
			let tempA = [];
			for (let index = 0; index < arr.length; index++) {
				if (targetArr.toString() == arr[index].sort.toString()) {
					if (arr[index].flag) {
						arr[index].color = 'red';
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
					.append('path')
					.attr('class', 'line')
					.attr('d', line(targetGroup))
					.attr('stroke', color)
					.attr('stroke-width', 2);
			}

			tempCricle = svg_s
				.selectAll('.MyCircle3')
				.data(targetGroup)
				.enter()
				.append('circle')
				.attr('class', 'MyCircle3')
				.attr('cx', function(d, i) {
					return d['x_axis'];
				})
				.attr('cy', function(d, i) {
					return d['y_axis'];
				})
				.attr('r', function(d, i) {
					return d['r'] + 0.2;
				})
				.style('fill', function(d) {
					return d.color;
				})
				.on('click', function(d) {
					var event = d3.event;
					event.stopPropagation();
				});
		}

		function getBLen(str) {
			if (str == null) return 0;
			if (typeof str != 'string') {
				str += '';
			}
			return str.replace(/[^\x00-\xff]/g, '01').length;
		}

		function getNameLength(total_name) {
			//console.log(total_name)
			let oSvg = d3.select('#geneListTableSwitchChart_chart').append('svg');
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
