import { debounceTime } from 'rxjs/operators';
import { AjaxService } from './../../super/service/ajaxService';
import { StoreService } from './../../super/service/storeService';
import { Component, OnInit, ViewChild, ElementRef, QueryList, OnChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import config from '../../../config';
import { Subject } from 'rxjs';

@Component({
	selector: 'app-re-list',
	templateUrl: './re-list.component.html',
	styles: []
})
export class ReListComponent implements OnInit {
	analysisList: any[] = [];
	loading: boolean = false;
	tableEntity: object = {
		LCID: sessionStorage.getItem('LCID'),
		pageIndex: 1,
		pageSize: 9,
		searchContent: {
			label: null,
			timeStart: '',
			timeEnd: '',
			geneType: [],
			reanalysisType: [],
			status: []
		}
	};
	total: number = 0;
	error: string = '';
	panelVisible: boolean = false;

	getListObserver = new Subject<boolean>();

	label: string = '';
	src: any = {
		data: [{ name: '基因', key: 'gene', checked: false }, { name: '转录本', key: 'transcript', checked: false }],
		dateRange: [],
		category: [
			{ key: 'heatmap', name: '聚类重分析', checked: false, value: ['heatmapDiff', 'heatmapExpress', 'heatmapCustom'] },
			{ key: 'classification', name: '基因分类', checked: false, value: ['classification'] },
			{ key: 'enrichment', name: '基因富集', checked: false, value: ['enrichment'] },
			{ key: 'net', name: '蛋白网络互作', checked: false, value: ['net'] },
			{ key: 'line', name: '折线图', checked: false, value: ['line'] },
			{ key: 'kda', name: 'KDA', checked: false, value: ['kda'] },
			{ key: 'multiOmics', name: '多组学关联', checked: false, value: ['multiOmics'] },
			{ key: 'chiSquare', name: '卡方检测', checked: false, value: ['chiSquare'] },
			{ key: 'as', name: '可变剪切', checked: false, value: ['as'] },
			{ key: 'linkedNetwork', name: '关联网络图', checked: false, value: ['linkedNetwork'] },
			{ key: 'heatmapRelation', name: '关联聚类热图', checked: false, value: ['heatmapRelation'] }
		],
		status: [
			{ key: '1', name: '成功', checked: false },
			{ key: '0', name: '失败', checked: false },
			{ key: '-1', name: '进行中', checked: false }
		]
	};
	intervalTimer = null;

	//修改昵称和备注
	isTyping: boolean = false;//是否正在输入
	labelIsSave: boolean = false;
	@ViewChild('inputRemark') inputRemark: ElementRef;
	@ViewChild('inputNickname') inputNickname: ElementRef;

	constructor(
		private routes: ActivatedRoute,
		private router: Router,
		private storeService: StoreService,
		private translate: TranslateService,
		private ajaxService: AjaxService,
		private notify: NzNotificationService,
		private modalService: NzModalService
	) {
		let langs = ['zh', 'en'];
		this.translate.addLangs(langs);
		this.translate.setDefaultLang('zh');
		let curLang = localStorage.getItem('lang');
		if(langs.includes(curLang)){
			this.translate.use(curLang)
		}else{
			this.translate.use('zh')
		}
	}

	ngOnInit() {
		this.getAnalysisList();

		let observerObj;
		observerObj = this.getListObserver.pipe(debounceTime(300)).subscribe((loadingFlag) => {
			this.loading = loadingFlag;
			this.ajaxService
				.getDeferData({
					url: `${config['javaPath']}/reAnalysis/getReanalysisList`,
					data: this.tableEntity
				})
				.subscribe(
					(data) => {
						if (this.isTyping) return;
						if (data['status'] === '0') {
							this.analysisList = data['data']['list'];
							this.total = data['data']['sumCount'];
							this.error = '';
						} else {
							this.analysisList = [];
							this.total = 0;
							this.error = 'nodata';
						}
					},
					(err) => {
						this.total = 0;
						this.error = 'error';
						// 如果是可观察对象发出的token error 信息  就需要清空轮询定时器
						clearInterval(this.intervalTimer);
						observerObj.unsubscribe();
					},
					() => {
						this.loading = false;
					}
				);
		});

		this.intervalTimer = setInterval(() => {
			this.getList(false);
		}, config['getAnalysisListCountInterval']);
	}

	getList(loadingFlag: boolean = true) {
		this.getListObserver.next(loadingFlag);
	}

	getAnalysisList(loadingFlag: boolean = true) {
		this.loading = loadingFlag;
		this.ajaxService
			.getDeferData({
				url: `${config['javaPath']}/reAnalysis/getReanalysisList`,
				data: this.tableEntity
			})
			.subscribe(
				(data) => {
					if (data['status'] === '0') {
						this.analysisList = data['data']['list'];
						this.total = data['data']['sumCount'];
						this.error = '';
					} else {
						this.analysisList = [];
						this.total = 0;
						this.error = 'nodata';
					}
				},
				(err) => {
					this.total = 0;
					this.error = 'error';
					clearInterval(this.intervalTimer);
				},
				() => {
					this.loading = false;
				}
			);
	}

	toDetail(data) {
		//错误状态，不执行以下程序
		if (data.process == 0){
			this.modalService.error({
				'nzTitle':'id：'+ data['_id'],
				'nzContent': data['explains'],
				'nzClosable':false
				});
			if (!data['isCheck']) {
				data['isCheck'] = true;
				this.checkAnalysis(data['_id']);
			}
			return;
		}
		let type = '';
		if (data['reanalysisType'].indexOf('heatmap') != -1) {
			if (data['reanalysisType'] != 'heatmapRelation') {
				type = 'heatmap';
			} else {
				type = 'heatmapRelation';
			}
		} else {
			type = data['reanalysisType'];
		}

		let href = location.href.split('/report');

		if (!data['isCheck']) {
			data['isCheck'] = true;
			this.checkAnalysis(data['_id']);
		}

		if (type === 'classification' || type === 'enrichment') {
			window.open(
				`${href[0]}/report/reanalysis/re-${type}/${data['geneType']}/${data['_id']}/${data['version']}/${data['annotation']}/${data['isEdited']}`
			);
			// this.router.navigateByUrl(`/report/reanalysis/re-${type}/${data['geneType']}/${data['_id']}/${data['version']}/${data['annotation']}`);
		} else {
			window.open(
				`${href[0]}/report/reanalysis/re-${type}/${data['geneType']}/${data['_id']}/${data['version']}/${data['isEdited']}`
			);
			// this.router.navigateByUrl(`/report/reanalysis/re-${type}/${data['geneType']}/${data['_id']}/${data['version']}`);
		}
	}

	checkAnalysis(tid) {
		this.ajaxService.getDeferData({
			url: `${config['javaPath']}/reAnalysis/check`,
			data: {
				tid,
			}
		}).subscribe();
	}

	handleDelete(data) {
		this.ajaxService
			.getDeferData({
				url: `${config['javaPath']}/reAnalysis/deleteByTid`,
				data: {
					LCID: 'demo',
					tid: data['_id']
				}
			})
			.subscribe(
				(res) => {
					if (res['status'] == 0) {
						this.notify.success('Delete', `重分析任务 - ${data['nickname']} 删除成功`);
						this.tableEntity['pageIndex'] = 1;
						this.getList();
					} else {
						this.notify.warning('Delete', `重分析任务 - ${data['nickname']} 删除失败`);
					}
				},
				(error) => {
					console.log(error);
					this.notify.warning('Delete', `重分析任务 - ${data['nickname']} 删除失败`);
				}
			);
	}

	// 数据 类型 状态选择
	choose(item) {
		item['checked'] = !item['checked'];
	}

	search() {
		this.tableEntity['searchContent']['label'] = this.label;
		this.getList();
	}

	filter() {
		this.panelVisible = false;
		if (this.src['dateRange'].length) {
			this.tableEntity['searchContent']['timeStart'] = this.src['dateRange'][0];
			this.tableEntity['searchContent']['timeEnd'] = this.src['dateRange'][1];
		}
		this.tableEntity['searchContent']['reanalysisType'] = [];
		this.tableEntity['searchContent']['status'] = [];
		this.tableEntity['searchContent']['geneType'] = [];

		this.src['category'].forEach((v) => {
			if (v['checked']) this.tableEntity['searchContent']['reanalysisType'].push(...v['value']);
		});

		this.src['status'].forEach((v) => {
			if (v['checked']) this.tableEntity['searchContent']['status'].push(v['key']);
		});

		this.src['data'].forEach((v) => {
			if (v['checked']) this.tableEntity['searchContent']['geneType'].push(v['key']);
		});

		this.tableEntity['pageIndex'] = 1;
		this.getList();
	}

	reset() {
		this.src['dateRange'] = [];
		for (let name in this.src) {
			if (name !== 'dateRange') {
				this.src[name].forEach((v) => {
					v['checked'] = false;
				});
			}
		}

		this.tableEntity['searchContent']['timeStart'] = '';
		this.tableEntity['searchContent']['timeEnd'] = '';
		this.tableEntity['searchContent']['reanalysisType'] = [];
		this.tableEntity['searchContent']['status'] = [];
		this.tableEntity['searchContent']['geneType'] = [];
		this.tableEntity['pageIndex'] = 1;

		this.getList();
	}


	//备注修改
	updateRemarkCheck(data) {
		this.isTyping = true;
		this.analysisList.forEach(analysis => {
			analysis['isEditRemark'] = false;
		})
		data['isEditRemark'] = true;
		setTimeout(() => { this.inputRemark.nativeElement.focus(); });
	}
	//修改备注之后回车
	updateRemarkEnter(data, remark) {
		data.remark = remark.length > 100 ? remark.substring(0, 100) : remark;
		if (this.labelIsSave) return;
		this.updateRemark(data, remark);
	}
	//调用接口修改备注
	updateRemark(data, remark) {
		this.labelIsSave = true;
		//发送请求，修改备注
		this.ajaxService
			.getDeferData({
				url: `${config['javaPath']}/reAnalysis/remark`,
				data: {
					tid: data['_id'],
					remark: remark ? remark : ''
				}
			})
			.subscribe(
				(res) => {
					if (res['status'] == 0) {
						this.getList();
					}
					this.isTyping = false;
					this.labelIsSave = false;
				},
				(error) => {
					console.log(error);
					this.isTyping = false;
					this.labelIsSave = false;
				}
			);
	}

	//备注昵称
	updateNicknameCheck(data) {
		this.isTyping = true;
		this.analysisList.forEach(analysis => {
			analysis['isEditNickname'] = false;
		})
		data['isEditNickname'] = true;
		setTimeout(() => { this.inputNickname.nativeElement.focus(); });
	}
	//修改备注之后回车
	updateNicknameEnter(data, nickname) {
		data.nickname = nickname.length > 50 ? nickname.substring(0, 50) : nickname;
		if (this.labelIsSave) return;
		this.updateNickname(data, nickname);
	}
	//调用接口修改备注
	updateNickname(data, nickname) {
		this.labelIsSave = true;
		//发送请求，修改备注
		this.ajaxService
			.getDeferData({
				url: `${config['javaPath']}/reAnalysis/nickname`,
				data: {
					tid: data['_id'],
					nickname: nickname ? nickname : ''
				}
			})
			.subscribe(
				(res) => {
					if (res['status'] == 0) {
						this.getList();
					}
					this.isTyping = false;
					this.labelIsSave = false;
				},
				(error) => {
					console.log(error);
					this.isTyping = false;
					this.labelIsSave = false;
				}
			);
	}
}
