import { StoreService } from './../service/storeService';
import { AjaxService } from './../service/ajaxService';
import { ToolsService } from './../service/toolsService';
import { Component, OnInit, Input, Output, OnChanges, SimpleChanges, EventEmitter } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd';
import config from '../../../config';
declare const $: any;
@Component({
	selector: 'app-tools',
	templateUrl: './tools.component.html',
	styles: []
})
export class ToolsComponent implements OnInit {
	// heatmap goRich keggRich goClass keggClass line net

	/*
        "heatmaprelation""关联聚类"
        "heatmapexpress""表达量聚类"
        "heatmapdiff" "差异聚类"
        "multiOmics" "多组学关联"
        "net" 普通网络图
        "netrelation" "关联网络图"
    */

	/*
        聚类，富集，KDA 需要生信重分析
    */

	toolList: object[] = [
		{
			type: 'heatmap',
			name: '聚类重分析',
			needReanalysis: false,
			desc: '横轴表示取log2后的差异倍数，即log2FoldChange。纵轴表示基因，默认配色下，色块的颜色越红表达量越高，颜色越蓝，表达量越低。'
		},
		{
			type: 'goRich',
			name: 'GO富集分析',
			desc:
				'Gene Ontology 分为分子功能（molecular function）、细胞组分（cellular component）和生物过程（biological process）三大功能类。根据差异基因检测结果进行功能分类。每个大类下有各个层级的子类别。下图是所选基因集的GO注释分类结果。'
		},
		{
			type: 'keggRich',
			name: 'kegg富集',
			desc:
				'将基因参与的KEGG代谢通路分为7个分支：细胞过程(Cellular Processes)、环境信息处理(Environmental Information Processing)、遗传信息处理(Genetic Information Processing)、人类疾病（Human Disease）（仅限动物）、代谢(Metabolism)、有机系统(Organismal Systems)、药物开发（Drug Development）。每一分支下进一步分类统计。下图是所选基因集的KEGG Pathway注释分类结果。'
		},
		{
			type: 'goClass',
			name: 'GO分类',
			desc:
				'Gene Ontology 分为分子功能（molecular function）、细胞组分（cellular component）和生物过程（biological process）三大功能类。根据差异基因检测结果进行功能分类。每个大类下有各个层级的子类别。下图是所选基因集的GO注释分类结果。'
		},
		{
			type: 'keggClass',
			name: 'KEGG分类',
			desc:
				'将基因参与的KEGG代谢通路分为7个分支：细胞过程(Cellular Processes)、环境信息处理(Environmental Information Processing)、遗传信息处理(Genetic Information Processing)、人类疾病（Human Disease）（仅限动物）、代谢(Metabolism)、有机系统(Organismal Systems)、药物开发（Drug Development）。每一分支下进一步分类统计。下图是所选基因集的KEGG Pathway注释分类结果。'
		},
		{
			type: 'net',
			name: '蛋白网络互作用',
			desc: '图中的每个点代表一个基因，连线表示这两个基因间有互作关系。点的大小和颜色都表示互作连接数，点越大，连接数越多。颜色由蓝色到红色渐变，越红表示连接数越多。'
		},
		{ type: 'line', name: '折线图', desc: '以折线图方式呈现数据' },
		{ type: 'KDA', name: 'KDA', desc: 'kda' },
		{ type: 'multiOmics', name: '多组学关联', desc: '多组学' },
		{ type: 'kaFun', name: '卡方检测', desc: '卡方' },
		{ type: 'relativeSplice', name: '可变剪切', desc: '可变剪切' },
		{ type: 'relaticeNet', name: '关联网络图', desc: '关联网络图' },
		{ type: 'relativeHeatmap', name: '关联聚类热图', desc: '关联聚类热图' },
		{ type: 'reanalysisList', name: '查看重分析列表', desc: '查看重分析列表' }
	];
	desc: string = '';
	title: String = '';

	// 聚类参数
	expressData: any[] = [];
	expressUpload: any = [];
	expressSelect: any[] = [];
	expressError: any = false;

	diffData: any[] = [];
	diffUpload: any = [];
	diffSelect: any[] = [];
	diffError: any = false;

	customData: any[] = [];
	customUpload: any[] = [];
	customSelect: any[] = [];
	customError: any = false;

	geneType: any[] = [];
	geneTypeError: any = false;
	selectGeneType: any[] = [];

	stand:string = '';
	standList:any[] = [];

	// 多组学参数
	multiOmicsData: any[] = [];
	multiOmicsSelect: any[] = [];
	multiOmicsError: any = false;

	// 折线图参数
	lineGroupData: object[] = [];
	lineSampleData: object[] = [];
	lineGroupSelect: object[] = [];
	lineSampleSelect: object[] = [];
	lineGroupError: boolean = false;
	lineSampleError: boolean = false;
	lineCustomData:object[] =[];
	lineCustomSelect:object[] = [];
	lineCustomError:boolean = false;

	//卡方图参数
	geneNum: number;
	kaFunDataName: string;
	kaFunStatistics: any[] = [];
	kaFunStatisticsName: string;
	kaFunGroupData: object[] = [];
	kaFunGroupSelect: object[] = [];
	kaFunGroupError: boolean = false;

	// 当前选择的重分析类型
	selectType: string = '';
	childVisible: boolean = false;
	isSubmitReanalysis: boolean = false; // 是否在提交重分析任务

	constructor(
		public toolsService: ToolsService,
		private ajaxService: AjaxService,
		private storeService: StoreService,
		private notify: NzNotificationService
	) {}

	ngOnInit() {
		this.init();
	}

	init() {
		this.desc = '';
		this.title = '';
		// 初始化聚类参数
		this.expressData = [];
		this.expressUpload = [];
		this.expressSelect = [];
		this.expressError = false;

		this.diffData = [];
		this.diffUpload = [];
		this.diffSelect = [];
		this.diffError = false;

		this.customData = [];
		this.customUpload = [];
		this.customSelect = [];
		this.customError = false;

		this.geneType = [];
		this.selectGeneType = [];
		this.geneTypeError = false;

		this.stand = '';
		this.standList = [];

		// 多组学参数
		this.multiOmicsData = [];
		this.multiOmicsSelect = [];
		this.multiOmicsError = true;

		// 折线图参数
		this.lineGroupData = [];
		this.lineSampleData = [];
		this.lineGroupSelect = [];
		this.lineSampleSelect = [];
		this.lineGroupError = false;
		this.lineSampleError = false;
		this.lineCustomError = false;
		this.lineCustomData = [];
		this.lineCustomSelect = [];

		//卡方检验
		this.geneNum = 1;
		this.kaFunDataName = '';
		this.kaFunGroupData = [];
		this.kaFunGroupSelect = [];
		this.kaFunGroupError = false;

		// 页面参数
		this.selectType = '';
		this.childVisible = false;
		this.isSubmitReanalysis = false;
	}

	close() {
		this.toolsService['visible'] = false;
		this.init();
	}

	handlerMouseOver(tool) {
		this.title = tool['name'];
		this.desc = tool['desc'];
	}

	selectParams(type) {
		this.init();
		if(type=="relativeSplice"){
			this.relativeSpliceConfirm();
		}else{
			this['get' + type + 'Params']();
			this.selectType = type;
			this.childVisible = true;
		}
	}

	/**
     * @description 聚类的参数选择
     * @author Yangwd<277637411@qq.com>
     * @date 2018-11-27
     * @param {*} target 当前点击的对象
     * @param {*} selected 当前分类选中的数据集合
     * @param {*} type 当前分类类型  用于设置错误信息
     * @returns
     * @memberof ToolsComponent
     */
	handlerHeatmapSelect(target, selected, type) {
		// 选中变为不选中
		if (target['checked']) {
			target['checked'] = false;
			let index = this.findIndex(target['name'], selected, 'name');
			if (index != -1) selected.splice(index, 1);
			this[`${type}Error`] = false;
		} else {
			// 不选中变为选中
			// 最多选择20个
			if (selected.length >= 20) {
				this[`${type}Error`] = 'maxover';
				return;
			}
			this[`${type}Error`] = false;
			target['checked'] = true;
			selected.push(target);
		}

		if (!selected.length) this[`${type}Error`] = 'nodata';
	}

	// 基因分类选择 默认不选 最多选两个
	handlerGeneSelect(geneType) {
		// 选中变未选中
		if (geneType['checked']) {
			geneType['checked'] = false;
			let index = this.findIndex(geneType['name'], this.selectGeneType, 'name');
			if (index != -1) this.selectGeneType.splice(index, 1);
			this.geneTypeError = false;
		} else {
			// 未选中变选中
			if (this.selectGeneType.length >= 2) {
				this.geneTypeError = true;
				setTimeout(() => {
					this.geneTypeError = false;
				}, 2000);
				return;
			}
			this.geneTypeError = false;
			geneType['checked'] = true;
			this.selectGeneType.push(geneType);
		}
	}

	// 聚类取消
	cancel() {
		this.selectType = '';
		this.childVisible = false;
	}

	findIndex(x, arr, key) {
		return arr.findIndex((val, index) => {
			return x === val[key];
		});
	}

	getheatmapParams() {
		this.ajaxService
			.getDeferData({
				url: `${config['javaPath']}/cluster/heatmapConfig`,
				data: {
					LCID: sessionStorage.getItem('LCID'),
					geneType: this.toolsService.get('tableEntity')['geneType'],
					species: this.toolsService.get('tableEntity')['species'],
					version: this.storeService.getStore('version'),
					baseThead: this.toolsService.get('baseThead')
				}
			})
			.subscribe(
				(data) => {
					if (data['status'] == '0') {
						let res = data['data'];
						this.expressData = res['expression'].map((val) => {
								val['checked'] = false;
								return val;
							})

						if (this.expressData.length) {
							this.expressData[0]['checked'] = true;
							this.expressSelect = [ this.expressData[0] ];
						}
						this.expressUpload = res['exp_user'];
						 
						
						this.diffData = res['diff'].map((val) => {
							val['checked'] = false;
							return val
						});
						if (this.diffData.length) {
							this.diffData[0]['checked'] = true;
							this.diffSelect = [ this.diffData[0] ];
						}
						this.diffUpload = res['dif_user'];

						this.geneType = res['verticalDefault'];
						this.geneType.forEach((val) => {
							val['checked'] = false;
						});

						this.customData = res['customData'].map(val=>{
							val['checked'] = false;
							return val;
						});
						if(this.customData.length) {
							this.customData[0]['checked'] = true;
							this.customSelect = [this.customData[0]];
						}
						
						this.standList = res['standardization'];
						this.stand = this.standList[0];
					}
				},
				(err) => console.log(err)
			);
	}

	// 提交聚类重分析  需要生信重分析 需要1 不需要2
	heatmapConfirm(type) {
		// this.isSubmitReanalysis = true;
		// let tempChooseList = this[`${type}Select`].map((val) => {
		// 	let temp = {};
		// 	temp[val['category']] = val['name'];
		// 	return temp;
		// });

		this.ajaxService
			.getDeferData({
				data: {
					LCID: sessionStorage.getItem('LCID'),
					reanalysisType: `heatmap${type}`,
					needReanalysis: 1,
					// chooseType: [ this.switchType(type) ],
					chooseList: this[`${type}Select`],
					verticalDefault: this.selectGeneType,
					...this.toolsService.get('tableEntity'),
					geneType: this.toolsService.get('tableEntity')['geneType'],
					species: this.toolsService.get('tableEntity')['species'],
					version: this.storeService.getStore('version'),
				},
				url: this.toolsService.get('tableUrl')
			})
			.subscribe(
				(data) => {
					if (data['status'] === '0') {
						this.selectType = '';
						this.childVisible = false;
						this.toolsService.hide();
						this.notify.blank('tips：', '聚类重分析提交成功', {
							nzStyle: { width: '200px' },
							nzDuration: 2000
						});
					} else {
						this.notify.blank('tips：', '重分析提交失败，请重试', {
							nzStyle: { width: '200px' },
							nzDuration: 2000
						});
					}
				},
				(err) => {
					this.notify.blank('tips：', '重分析提交失败，请重试', {
						nzStyle: { width: '200px' },
						nzDuration: 2000
					});
				},
				() => {
					this.isSubmitReanalysis = false;
				}
			);
	}

	switchType(type) {
		switch (type) {
			case 'express':
				return 'expression';
			default:
				return type;
		}
	}

	// 获取多组学参数
	getmultiOmicsParams() {
		this.ajaxService
			.getDeferData({
				data: {
					LCID: sessionStorage.getItem('LCID'),
					geneType: this.toolsService.get('tableEntity')['geneType'],
					species: this.toolsService.get('tableEntity')['species'],
					version: this.storeService.getStore('version'),
					baseThead: this.toolsService.get('baseThead')
				},
				url: `${config['javaPath']}/multiOmics/config`
			})
			.subscribe(
				(data) => {
					if (data['status'] === '0') {
						if (data['data'].length) {
							this.multiOmicsData = data['data'];
						} else {
							this.multiOmicsData = [];
						}
					} else {
						this.multiOmicsData = [];
					}
				},
				(err) => {
					this.multiOmicsData = [];
				}
			);
	}

	multiOmicsClick(item) {
		item['checked'] = !item['checked'];
		let index = this.multiOmicsSelect.findIndex((val, index) => {
			return val['key'] === item['key'];
		});
		if (item['checked']) {
			if (index == -1) this.multiOmicsSelect.push(item);
		} else {
			if (index != -1) this.multiOmicsSelect.splice(index, 1);
		}

		this.multiOmicsError = !this.multiOmicsSelect.length;
	}

	multiOmicsConfirm(type) {
		this.isSubmitReanalysis = true;
		let newWindow = window.open(`${window.location.href.split('report')[0]}report/reanalysis/loading`);
		this.ajaxService
			.getDeferData({
				data: {
					LCID: sessionStorage.getItem('LCID'),
					reanalysisType: type,
					needReanalysis: 2,
					classInfo: this.multiOmicsSelect,
					...this.toolsService.get('tableEntity')
				},
				url: this.toolsService.get('tableUrl')
			})
			.subscribe(
				(data) => {
					if (data['status'] === '0') {
						if (data['data'].length) {
							let href = `${window.location.href.split(
								'report'
							)[0]}report/reanalysis/re-multiOmics/${this.toolsService.get('geneType')}/${data[
								'data'
							][0]}/${this.storeService.getStore('version')}`;
							newWindow.location.href = href;
						} else {
							this.notify.blank('tips：', '重分析提交失败，请重试', {
								nzStyle: { width: '200px' },
								nzDuration: 2000
							});
						}
						this.selectType = '';
						this.childVisible = false;
						this.toolsService.hide();
					} else {
						this.notify.blank('tips：', '重分析提交失败，请重试', {
							nzStyle: { width: '200px' },
							nzDuration: 2000
						});
					}
				},
				(err) => {
					this.notify.blank('tips：', '重分析提交失败，请重试', {
						nzStyle: { width: '200px' },
						nzDuration: 2000
					});
				},
				() => {
					this.isSubmitReanalysis = false;
				}
			);
	}

	// go富集
	getgoRichParams() {
		console.log('gorich');
	}
	// kegg富集
	getkeggRichParams() {
		console.log('keggrich');
	}
	// go分类
	getgoClassParams() {
		console.log('goclass');
	}

	// kegg分类
	getkeggClassParams() {
		console.log('keggclass');
	}

	getkaFunParams() {
		this.ajaxService
			.getDeferData({
				url: `${config['javaPath']}/chiSquare/config`,
				data: {
					LCID: sessionStorage.getItem('LCID'),
					geneType: this.toolsService.get('tableEntity')['geneType'],
					species: this.toolsService.get('tableEntity')['species'],
					version: this.storeService.getStore('version'),
					baseThead: this.toolsService.get('baseThead'),
					geneNum: this.toolsService.get('geneCount')
				}
			})
			.subscribe(
				(data) => {
					if (data['status'] === '0') {
						if (data['data']) {
							this.kaFunGroupSelect.length = 0;

                            let m_list = data['data']['Classification'].map((v,index)=>{
                                // let status = index?false:true;
								// if(status)
								// this.kaFunGroupSelect.push({
								// 	name:v.name,
								// 	key:v.key,
								// 	category:v.category,
								// 	checked:true
								// });
                                // return {
								// 	name:v.name,
								// 	key:v.key,
								// 	category:v.category,
								// 	checked:status
								// };
								this.kaFunGroupSelect.push({
									name:v.name,
									key:v.key,
									category:v.category,
									checked:true
								});
                                return {
									name:v.name,
									key:v.key,
									category:v.category,
									checked:true
								};
                            });

							this.kaFunDataName = data['data']['Data']; //data Name
							this.kaFunStatistics = data['data']['Statistics'];

							this.kaFunStatisticsName = this.kaFunStatistics.length?this.kaFunStatistics[0]:"";
							this.kaFunGroupData = m_list;
						} else {
							this.initKaFunData();
						}
					} else {
						this.initKaFunData();
					}
				},
				(err) => {
					this.initKaFunData();
				}
			);
	}

	initKaFunData() {
		this.kaFunGroupData.length = 0;
		this.kaFunGroupSelect.length = 0;
	}

	// 卡方图参数选择
	kaFunClick(item) {
		let temp = this.kaFunGroupSelect;

		item['checked'] = !item['checked'];
		let index = temp.findIndex((val, index) => {
			return val['name'] === item['name'];
		});

		if (item['checked']) {
			if (index == -1) temp.push(item);
		} else {
			if (index != -1) temp.splice(index, 1);
		}

		this.kaFunGroupError = !this.kaFunGroupData.length;
		console.log(this.kaFunGroupSelect);
	}

	onkaFunChange(value:any):void{
		console.log(value)
	}

	kaFunConfirm(reanalysisType) {
		if(this.kaFunGroupSelect.length<2){
			this.notify.blank('tips：', '请至少选择2个', {
				nzStyle: { width: '200px' },
				nzDuration: 2000
			});
			return;
		}
		this.isSubmitReanalysis = true;
		let newWindow = window.open(`${window.location.href.split('report')[0]}report/reanalysis/loading`);
		this.ajaxService
			.getDeferData({
				data: {
					LCID: sessionStorage.getItem('LCID'),
					reanalysisType: reanalysisType,
					needReanalysis: 2,
					version:this.storeService.getStore('version'),
					geneType:this.toolsService.get('tableEntity')['geneType'],
					species:this.storeService.getStore('genome'),
					statisticData:this.kaFunDataName,
					statisticMethod:this.kaFunStatisticsName,
					classification: this.kaFunGroupSelect,
					...this.toolsService.get('tableEntity')
				},
				url: this.toolsService.get('tableUrl')
			})
			.subscribe(
				(data) => {
					if (data['status'] === '0') {
						if (data['data'].length) {
							let href = `${window.location.href.split(
								'report'
							)[0]}report/reanalysis/re-${reanalysisType}/${this.toolsService.get('geneType')}/${data[
								'data'
							][0]}/${this.storeService.getStore('version')}`;
							newWindow.location.href = href;
						} else {
							this.notify.blank('tips：', '重分析提交失败，请重试', {
								nzStyle: { width: '200px' },
								nzDuration: 2000
							});
						}
						this.selectType = '';
						this.childVisible = false;
						this.toolsService.hide();
					} else {
						this.notify.blank('tips：', '重分析提交失败，请重试', {
							nzStyle: { width: '200px' },
							nzDuration: 2000
						});
					}
				},
				(err) => {
					this.notify.blank('tips：', '重分析提交失败，请重试', {
						nzStyle: { width: '200px' },
						nzDuration: 2000
					});
				},
				() => {
					this.isSubmitReanalysis = false;
				}
			);
	}

	// 折线图
	getlineParams() {
		// 获取折线图参数
		this.ajaxService
			.getDeferData({
				data: {
					LCID: sessionStorage.getItem('LCID'),
					geneType: this.toolsService.get('tableEntity')['geneType'],
					species: this.toolsService.get('tableEntity')['species'],
					version: this.storeService.getStore('version'),
					baseThead: this.toolsService.get('baseThead')
				},
				url: `${config['javaPath']}/line/config`
			})
			.subscribe(
				(data) => {
					if (data['status'] === '0') {
						if (data['data']) {
							this.lineGroupSelect.length = 0;
							this.lineSampleSelect.length = 0;

							let group = data['data']['group'].map((v, index) => {
								let status = index ? false : true;
								v['checked'] = status;
								if (status) this.lineGroupSelect.push(v);
								return v;
							});

							let sample = data['data']['sample'].map((v, index) => {
								let status = index ? false : true;
								v['checked'] = status;
								if (status) this.lineSampleSelect.push(v);
								return v;
							});

							let custom = data['data']['userDefData'].map((v,index)=>{
								let status = index ? false : true;
								v['checked'] = status;
								if (status) this.lineCustomSelect.push(v);
								return v;
							})

							this.lineCustomData  = custom;
							this.lineGroupData = group;
							this.lineSampleData = sample;

							this.lineGroupError = !this.lineGroupSelect.length;
							this.lineSampleError = !this.lineSampleSelect.length;
							this.lineCustomError = !this.lineCustomSelect.length;
						} else {
							this.initLineData();
						}
					} else {
						this.initLineData();
					}
				},
				(err) => {
					this.initLineData();
				}
			);
	}

	initLineData() {
		this.lineCustomData.length = 0;
		this.lineCustomSelect.length = 0;
		this.lineGroupData.length = 0;
		this.lineSampleData.length = 0;
		this.lineGroupSelect.length = 0;
		this.lineSampleSelect.length = 0;
	}

	// 折线图参数选择
	lineClick(type, item) {
		let temp = null;
		switch (type) {
			case 'group':
				temp = this.lineGroupSelect;
				break;
			case 'sample':
				temp = this.lineSampleSelect;
				break;
			case 'custom':
				temp = this.lineCustomSelect;
				break;
		}

		item['checked'] = !item['checked'];
		let index = temp.findIndex((val, index) => {
			return val['name'] === item['name'];
		});

		if (item['checked']) {
			if (index == -1) temp.push(item);
		} else {
			if (index != -1) temp.splice(index, 1);
		}

		this.lineGroupError = !this.lineGroupSelect.length;
		this.lineSampleError = !this.lineSampleSelect.length;
		this.lineCustomError = !this.lineCustomSelect.length;
	}

	// 提交折线图重分析
	lineConfirm(reanalysisType, selectType) {
		this.isSubmitReanalysis = true;
		let tempSelect = null;
		switch (selectType) {
			case 'group':
				tempSelect = this.lineGroupSelect;
				break;
			case 'sample':
				tempSelect = this.lineSampleSelect;
				break;
			case 'custom':
				tempSelect = this.lineCustomSelect;
				break;
		}

		// let tempChooseList = tempSelect.map((val) => {
		// 	let temp = {};
		// 	temp[val['category']] = val['name'];
		// 	return temp;
		// });

        let newWindow = window.open(`${window.location.href.split('report')[0]}report/reanalysis/loading`);
		this.ajaxService
			.getDeferData({
				data: {
					reanalysisType: reanalysisType,
					needReanalysis: 2,
					// chooseType: [ 'expression' ],
					chooseList: tempSelect,
					...this.toolsService.get('tableEntity')
				},
				url: this.toolsService.get('tableUrl')
			})
			.subscribe(
				(data) => {
					if (data['status'] === '0') {
                        if(data['data'].length){
                            let href = `${window.location.href.split(
								'report'
							)[0]}report/reanalysis/re-line/${this.toolsService.get('geneType')}/${data[
								'data'
							][0]}/${this.storeService.getStore('version')}`;
							newWindow.location.href = href;
                        }else{
                            this.notify.blank('tips：', '重分析提交失败，请重试', {
                                nzStyle: { width: '200px' },
                                nzDuration: 2000
                            });
                        }
						this.selectType = '';
						this.childVisible = false;
						this.toolsService.hide();
					} else {
						this.notify.blank('tips：', '重分析提交失败，请重试', {
							nzStyle: { width: '200px' },
							nzDuration: 2000
						});
					}
				},
				(err) => {
					this.notify.blank('tips：', '重分析提交失败，请重试', {
						nzStyle: { width: '200px' },
						nzDuration: 2000
					});
				},
				() => {
					this.isSubmitReanalysis = false;
				}
			);
	}

	//可变剪切提交
	relativeSpliceConfirm(){
		this.isSubmitReanalysis = true;
		let newWindow = window.open(`${window.location.href.split('report')[0]}report/reanalysis/loading`);
		this.ajaxService
			.getDeferData({
				data: {
					LCID: sessionStorage.getItem('LCID'),
					reanalysisType: "as",
					needReanalysis: 2,
					version: this.storeService.getStore('version'),
					geneType: this.toolsService.get('tableEntity')['geneType'],
					species: this.storeService.getStore('genome'),
					...this.toolsService.get('tableEntity')
				},
				url: this.toolsService.get('tableUrl')
			})
			.subscribe(
				(data) => {
					if (data['status'] === '0') {
                        if(data['data'].length){
                            let href = `${window.location.href.split(
								'report'
							)[0]}report/reanalysis/re-as/${this.toolsService.get('geneType')}/${data[
								'data'
							][0]}/${this.storeService.getStore('version')}`;
							newWindow.location.href = href;
                        }else{
                            this.notify.blank('tips：', '重分析提交失败，请重试', {
                                nzStyle: { width: '200px' },
                                nzDuration: 2000
                            });
                        }
						this.selectType = '';
						this.childVisible = false;
						this.toolsService.hide();
					} else {
						this.notify.blank('tips：', '重分析提交失败，请重试', {
							nzStyle: { width: '200px' },
							nzDuration: 2000
						});
					}
				},
				(err) => {
					this.notify.blank('tips：', '重分析提交失败，请重试', {
						nzStyle: { width: '200px' },
						nzDuration: 2000
					});
				},
				() => {
					this.isSubmitReanalysis = false;
				}
			);
	}


	// 网路图
	getnetParams() {
		console.log('net');
	}

	getreanalysisParams() {
		console.log('reanalysis');
	}

	handlerChildClose() {
		if (!this.isSubmitReanalysis) {
			this.selectType = '';
			this.childVisible = false;
		}
	}
}
