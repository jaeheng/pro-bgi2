import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { MessageService } from 'src/app/super/service/messageService';
import { AjaxService } from 'src/app/super/service/ajaxService';
import { GlobalService } from 'src/app/super/service/globalService';
import { StoreService } from 'src/app/super/service/storeService';
import { PageModuleService } from 'src/app/super/service/pageModuleService';
import { TranslateService } from '@ngx-translate/core';
import { PromptService } from 'src/app/super/service/promptService';
import { Router, NavigationEnd } from '@angular/router';

declare const d3;

@Component({
  selector: 'app-gene-fusion',
  templateUrl: './gene-fusion.component.html',
  styles: []
})
export class GeneFusionComponent implements OnInit {

  // 表格高度相关
	@ViewChild('left') left;
	@ViewChild('right') right;
	@ViewChild('fusionChartTable') fusionChartTable;

  switch: string = 'right';
  
  tableUrl: string;
  chartUrl:string;
  tableChartEntity: object;


  rightImgUrl: string;
  imgEntity: string;

	// 默认收起模块描述
  expandModuleDesc: boolean = false;
  
  //设置
  isShowSetPanel:boolean=false;
	isShowGene:boolean=true;
	isShowColumn:boolean=true;

	constructor(
		private message: MessageService,
		private ajaxService: AjaxService,
		private globalService: GlobalService,
		private storeService: StoreService,
		public pageModuleService: PageModuleService,
		private translate: TranslateService,
		private promptService: PromptService,
		private router: Router
	) {
		// 订阅windowResize 重新计算表格滚动高度
		this.message.getResize().subscribe((res) => {
			if (res['message'] === 'resize') this.computedTableHeight();
		});

		// 每次切换路由计算表格高度
		this.router.events.subscribe((event) => {
			if (event instanceof NavigationEnd) this.computedTableHeight();
		});
		let browserLang = this.storeService.getLang();
		this.translate.use(browserLang);
	}

	ngOnInit() {
		this.chartUrl=`http://localhost:8086/fusion`;

	}

	drawRightImg(data){

	}

	rightHandlerRefresh(){
		
	}

	moduleDescChange() {
		this.expandModuleDesc = !this.expandModuleDesc;
		// 重新计算表格切换组件表格的滚动高度
		setTimeout(() => {
			this.fusionChartTable.scrollHeight();
		}, 30);
	}

	ngAfterViewInit() {
		setTimeout(() => {
			this.computedTableHeight();
		}, 30);
	}

	resize(event) {
		setTimeout(() => {
			this.computedTableHeight();
		}, 30);
  }
  
  // 切换左右布局 计算左右表格的滚动高度
  switchChange(status) {
    this.switch = status;
    setTimeout(() => {
      this.fusionChartTable.scrollHeight();
      this.computedTableHeight();
    }, 320);
  }

  computedTableHeight() {
		
  }

  handlerRefresh(){
	  this.fusionChartTable.reGetData();
  }

	showGene(){
		this.fusionChartTable.redraw();
	}

	showColumn(){
		this.fusionChartTable.redraw();
	}

	//画 circos 图
	drawChart(data) {
		var that=this;
		d3.selectAll("#fusionCircos svg").remove();
		//定义数据
		var outerRing = data.outRing;
		var lineData = data.lineData;

		var max_chrNameLength = d3.max(outerRing, function(d) {
			return d.name.length;
		})

		//定义容器宽高、边距
		var width = 600,
			height = 600,
			tick_margin = 38,
			outer_margin = max_chrNameLength * 8 + tick_margin,
			outer_padding = this.isShowColumn ? 10 : 20,
			outerRadius = Math.min(width, height) * 0.5 - outer_margin,
			innerRadius = outerRadius - outer_padding,

			column_h = 30,
			inner_margin = 5;

		var innerRadius1 = innerRadius - column_h - inner_margin,
			innerRadius2 = innerRadius1 - column_h - inner_margin,
			innerRadius3 = innerRadius2 - inner_margin - outer_padding;

		//外环颜色比例尺
		var colors = ["#3195BC", "#FF6666", "#009e71", "#DBBBAF", "#A7BBC3", "#FF9896", "#F4CA60", "#6F74A5", "#E57066", "#C49C94", "#3b9b99", "#FACA0C", "#F3C9DD", "#0BBCD6", "#BFB5D7", "#BEA1A5", "#0E38B1", "#A6CFE2", "#607a93", "#C7C6C4", "#DABAAE", "#DB9AAD", "#F1C3B8", "#EF3E4A", "#C0C2CE", "#EEC0DB", "#B6CAC0", "#C5BEAA", "#FDF06F", "#EDB5BD", "#17C37B", "#2C3979", "#1B1D1C", "#E88565", "#FFEFE5", "#F4C7EE", "#77EEDF", "#E57066", "#FBFE56", "#A7BBC3", "#3C485E", "#055A5B", "#178E96", "#D3E8E1", "#CBA0AA", "#9C9CDD", "#20AD65", "#E75153", "#4F3A4B", "#112378", "#A82B35", "#FEDCCC", "#00B28B", "#9357A9", "#C6D7C7", "#B1FDEB", "#BEF6E9", "#776EA7", "#EAEAEA", "#EF303B", "#1812D6", "#FFFDE7", "#D1E9E3", "#7DE0E6", "#3A745F", "#CE7182", "#340B0B", "#F8EBEE", "#002CFC", "#75FFC0", "#FB9B2A", "#FF8FA4", "#000000", "#083EA7", "#674B7C", "#19AAD1", "#12162D", "#121738", "#0C485E", "#FC3C2D", "#864BFF", "#EF5B09", "#97B8A3", "#FFD101", "#C26B6A", "#E3E3E3", "#FF4C06", "#CDFF06", "#0C485E", "#1F3B34", "#384D9D", "#E10000", "#F64A00", "#89937A", "#C39D63", "#00FDFF", "#B18AE0", "#96D0FF", "#3C225F", "#FF6B61", "#EEB200", "#F9F7E8", "#EED974", "#F0CF61", "#B7E3E4"];
		var colorScale = d3.scaleOrdinal()
			.domain(d3.range(outerRing.length))
			.range(colors);

		//svg
		var svg = d3.select("#fusionCircos").append('svg')
			.attr("width", width)
			.attr("height", height);

		//定义主容器
		var body_g = svg.append("g")
			.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

		//柱状图容器
		if(this.isShowColumn){
			var column1_g = body_g.append("g")
				.attr("class", "innerRing1");
	
			var column2_g = body_g.append("g")
				.attr("class", "innerRing2");
	
			var column3_g = body_g.append("g")
				.attr("class", "innerRing3");
		}

		//外环
		var outer_space = 8;
		var sum_chrlength = d3.sum(outerRing, function(d) {
			return d.length;
		})

		//周长比例尺
		var outerGirthScale = d3.scaleLinear().range([0, 2 * Math.PI * innerRadius - outer_space * outerRing.length]).domain([0, sum_chrlength]);

		//角度比例尺
		var outerAngleScale = d3.scaleLinear().range([0, 2 * Math.PI]).domain([0, 2 * Math.PI * innerRadius]);
		var spaceAngle = outerAngleScale(outer_space);

		//数据处理成画图数据结构
		var chartData = [];
		var StartBeforeAngle = 0,
			EndBeforeAngle = 0;

		var allColumn1 = [],
			allColumn2 = [],
			allColumn3 = [],
			allGeneName = [];

		for (var i = 0; i < outerRing.length; i++) {
			var d = outerRing[i];
			var each_angle = outerAngleScale(outerGirthScale(d.length));
			EndBeforeAngle += each_angle;
			StartBeforeAngle = EndBeforeAngle - each_angle;

			var startAngle = StartBeforeAngle + i * spaceAngle,
				endAngle = EndBeforeAngle + i * spaceAngle;

			var column1_len = d.column1.length,
				column2_len = d.column2.length,
				column3_len = d.column3.length,
				point_len = d.pointData.length;

			var column1_w = outerGirthScale(d.length) / column1_len,
				column2_w = outerGirthScale(d.length) / column2_len,
				column3_w = outerGirthScale(d.length) / column3_len;

			var posScale = d3.scaleLinear().range([0, (endAngle - startAngle) * 180 / Math.PI]).domain([0, d.maxPos]);

			chartData.push({
				"index": i,
				"value": d.length,
				"startAngle": startAngle,
				"endAngle": endAngle,
				"angle": (startAngle + endAngle) / 2,
				"name": d.name,
				"betweenGene": d.betweenGene,
				"withinGene": d.withinGene,
				"column1": [],
				"column2": [],
				"column3": [],
				"maxPos": d.maxPos,
				"pointData": []

			})

			if (column1_len) {
				for (var j = 0; j < column1_len; j++) {
					var column1_d = d.column1[j];
					allColumn1.push(column1_d);
					chartData[i].column1.push({
						"value": d.column1[j],
						"width": column1_w,
						"rotateAngle": j * ((each_angle * 180 / Math.PI) / column1_len) + startAngle * 180 / Math.PI
					})
				}
			}

			if (column2_len) {
				for (var j = 0; j < column2_len; j++) {
					var column2_d = d.column2[j];
					allColumn2.push(column2_d);
					chartData[i].column2.push({
						"value": d.column2[j],
						"width": column2_w,
						"rotateAngle": j * ((each_angle * 180 / Math.PI) / column2_len) + startAngle * 180 / Math.PI
					})
				}
			}

			if(column3_len){
				for (var j = 0; j < column3_len; j++) {
					var column3_d = d.column3[j];
					allColumn3.push(column3_d);
					chartData[i].column3.push({
						"value": d.column3[j],
						"width": column3_w,
						"rotateAngle": j * ((each_angle * 180 / Math.PI) / column3_len) + startAngle * 180 / Math.PI
					})
				}
			}

			if (point_len) {
				for (var j = 0; j < point_len; j++) {
					var point_d = d.pointData[j].name;
					allGeneName.push(point_d);
					chartData[i].pointData.push({
						"name": d.pointData[j].name,
						"pos": d.pointData[j].pos,
						"angle": startAngle * 180 / Math.PI + posScale(d.pointData[j].pos)
					})
				}
			}

		}

		//gene name
		var showTextLength = 10;
		var max_geneName_len = d3.max(allGeneName, function(d) {
				return d.length;
			})
			// var inner_padding = max_geneName_len * 6;
		var inner_padding = showTextLength * 6;
		if (!this.isShowGene) {
			inner_padding = 40;
		}
		var innerRadius4 = this.isShowColumn ? (innerRadius3 - inner_padding - inner_margin) : (innerRadius - inner_padding - inner_margin);
		var innerRadius5 = 10;
		var circle_r = 2;
		var gene_text_y = -(innerRadius4 + circle_r);

		if (lineData.length) {
			for (var i = 0; i < lineData.length; i++) {
				var upChr = lineData[i]['fusion_up_chr'];
				var dwChr = lineData[i]['fusion_dw_chr'];
				chartData.forEach(function(val, index) {
						//角度比例尺
						var line_posScale = d3.scaleLinear().range([0, (val.endAngle - val.startAngle) * 180 / Math.PI]).domain([0, val.maxPos]);
						// 点的角度转换成坐标值
						var startUp = degTOxy(line_posScale(lineData[i]["fusion_up_genome_pos"]) + (val.startAngle * 180 / Math.PI), innerRadius4);
						var startDw = degTOxy(line_posScale(lineData[i]["fusion_dw_genome_pos"]) + (val.startAngle * 180 / Math.PI), innerRadius4);
						//line start
						if (val.name == upChr) {
							lineData[i]['startAngel'] = line_posScale(lineData[i]["fusion_up_genome_pos"]) + (val.startAngle * 180 / Math.PI);
							lineData[i]['up_x'] = startUp.x;
							lineData[i]['up_y'] = startUp.y;
						}
						//line end
						if (val.name == dwChr) {
							lineData[i]['endAngel'] = line_posScale(lineData[i]["fusion_dw_genome_pos"]) + (val.startAngle * 180 / Math.PI);
							lineData[i]['dw_x'] = startDw.x;
							lineData[i]['dw_y'] = startDw.y;
						}
					})
					// line middle
				var middleAngel = lineData[i].startAngel + (lineData[i].endAngel - lineData[i].startAngel) / 2;
				var middleObj = degTOxy(middleAngel, innerRadius5);
				lineData[i]['x'] = middleObj.x;
				lineData[i]['y'] = middleObj.y;
			}
		}

		// 点的角度转换成坐标值
		function degTOxy(start, r) {
			var x, y;
			//1象限
			if (start > 0 && start <= 90) {
				x = Math.cos((90 - start) * Math.PI / 180) * r
				y = -Math.sin((90 - start) * Math.PI / 180) * r
			}
			// 2象限
			if (start > 270 && start <= 360) {
				y = -Math.cos((360 - start) * Math.PI / 180) * r
				x = -Math.sin((360 - start) * Math.PI / 180) * r
			}
			// 3象限
			if (start > 180 && start <= 270) {
				y = Math.cos((start - 180) * Math.PI / 180) * r
				x = -Math.sin((start - 180) * Math.PI / 180) * r
			}
			// 4象限
			if (start > 90 && start <= 180) {
				y = Math.cos((180 - start) * Math.PI / 180) * r
				x = Math.sin((180 - start) * Math.PI / 180) * r
			}

			return {
				x: x,
				y: y
			}
		}

		//outer ring scale
		var max_chrLength = d3.max(outerRing, function(d) {
			return d.length;
		})
		var powLen = max_chrLength.toString().length - 1;
		var tick_step = Math.pow(10, powLen);

		//scale of first column
		var max_column1_val = d3.max(allColumn1, function(d) {
			return d;
		})
		var yScale_column1 = d3.scaleLinear().range([0, column_h]).domain([0, max_column1_val]).clamp(true);

		//scale of second column
		var max_column2_val = d3.max(allColumn2, function(d) {
			return d;
		})
		var yScale_column2 = d3.scaleLinear().range([0, column_h]).domain([0, max_column2_val]).clamp(true);

		//scale of three column
		var max_column3_val = d3.max(allColumn3, function(d) {
			return d;
		})
		var min_column3_val = d3.min(allColumn3, function(d) {
			return d;
		})
		var colors_column3 = ["#CA7499", "#b21052"];
		var colorScale_column3 = d3.scaleLinear().range(colors_column3).domain([min_column3_val, max_column3_val]);

		drawOuterRing();

		//画外环
		function drawOuterRing() {
			//外弦
			var arc = d3.arc()
				.innerRadius(innerRadius)
				.outerRadius(outerRadius);

			//定义外弦容器
			var outRing_g = body_g.append("g")
				.attr("class", "outerRing");

			//画外弦
			var group = outRing_g.selectAll("g")
				.data(chartData)
				.enter()
				.append("g");
			//path
			group.append("path")
				.style("fill", function(d) {
					return colorScale(d.index);
				})
				.style("stroke", function(d) {
					return d3.rgb(colorScale(d.index)).darker();
				})
				.attr("d", arc)
				.on("mouseover", function(d) {
					var tipText = "";
					if (d.withinGene && d.betweenGene) {
						tipText = `染色体编号：${d.name}<br>染色体内融合基因对：<br>${d.withinGene}<br>染色体间融合基因对：<br>${d.betweenGene}`;
					}else if(d.withinGene) { 
					tipText = `染色体编号：${d.name}<br>染色体内融合基因对：<br>${d.withinGene}`;
					}else if(d.betweenGene){
					tipText = `染色体编号：${d.name}<br>染色体间融合基因对：<br>${d.betweenGene}`;
					}else{
					tipText=`染色体编号：${d.name}`;
					}
					that.globalService.showPopOver(d3.event, tipText);
				})
				.on("mouseout", function() {
				that.globalService.hidePopOver(); 
				});

			//text
			var text_y = -(outerRadius + tick_margin);
			group.append("text")
				.style("font-size", "12px")
				.style("font-weight", 600)
				.attr("dominant-baseline", "middle")
				.attr("y", text_y)
				.attr("transform", function(d) {
					var textAngle = d.angle * 180 / Math.PI;
					var eachTextLen = d.name.length * 7;
					if (textAngle >= 0 && textAngle <= 180) {
						d3.select(this).attr("text-anchor", "left");
						return "rotate(" + textAngle + ") rotate(-90,0 " + text_y + ")";
					} else {
						d3.select(this).attr("text-anchor", "middle");
						return "rotate(" + textAngle + ") rotate(90,0 " + text_y + ") translate(" + (-eachTextLen / 2) + ", 0)";
					}
				})
				.style("color", "#000000")
				.text(function(d) {
					return d.name;
				});

			//tick
			var formatValue = d3.formatPrefix(",.0", tick_step); // 外环刻度值显示形式
			var groupTick = group.selectAll(".group-tick")
				.data(function(d) {
					return groupTicks(d, tick_step);
				})
				.enter().append("g")
				.attr("class", "group-tick")
				.attr("transform", function(d) {
					return "rotate(" + (d.angle * 180 / Math.PI - 90) + ") translate(" + outerRadius + ",0)";
				});
			//tick line
			groupTick.append("line")
				.attr("x2", 6)
				.attr("stroke", "#000000");
			//tick text
			groupTick.filter(function(d) {
					return d.value % tick_step === 0;
				})
				.append("text")
				.style("font-size", "10px")
				.attr("x", 8)
				.attr("dy", ".35em")
				.attr("transform", function(d) {
					return d.angle > Math.PI ? "rotate(180) translate(-16)" : null;
				})
				.style("text-anchor", function(d) {
					return d.angle > Math.PI ? "end" : null;
				})
				.text(function(d) {
					return formatValue(d.value);
				});
		}

		if(this.isShowColumn){
			if (outerRing[0].column1.length) {
				//第一环柱状图
				var columnTipText1 = "SNP数目";
				drawColumn(column1_g, "column1", innerRadius1, yScale_column1, "#10afff", columnTipText1);
			}
	
			if (outerRing[0].column2.length) {
				//第二环柱状图
				var columnTipText2 = "InDel数目";
				drawColumn(column2_g, "column2", innerRadius2, yScale_column2, "#ffd226", columnTipText2);
			}
	
			//第三环柱状图
			drawColumn2();
		}

		//画第一、二环柱状图
		function drawColumn(container_g, type, radius, yScale_column, color, columnTipText) {
			var chartData_len = chartData.length;

			var rects_g = container_g.selectAll("rects_g")
				.data(chartData)
				.enter()
				.append("g")
				.on("mouseover", function() {
					that.globalService.showPopOver(d3.event, columnTipText);
				})
				.on("mouseout", function() {
					that.globalService.hidePopOver();
				});
			if (type == "column1") {
				rects_g.selectAll("rects")
					.data(function(data) {
						return data.column1;
					})
					.enter()
					.append("rect")
					.attr("width", function(d) {
						return d.width;
					})
					.attr("height", function(d) {
						return yScale_column(d.value);
					})
					.attr("y", function(d) {
						return -(radius + yScale_column(d.value));
					})
					.attr("transform", function(d, i) {
						return "rotate(" + d.rotateAngle + ")";
					})
					.attr("fill", color);
			} else if (type == "column2") {
				rects_g.selectAll("rects")
					.data(function(data) {
						return data.column2;
					})
					.enter()
					.append("rect")
					.attr("width", function(d) {
						return d.width;
					})
					.attr("height", function(d) {
						return yScale_column(d.value);
					})
					.attr("y", function(d) {
						return -(radius + yScale_column(d.value));
					})
					.attr("transform", function(d, i) {
						return "rotate(" + d.rotateAngle + ")";
					})
					.attr("fill", color);
			}
		}

		//画第三环柱状图
		function drawColumn2() {
			var threeRect_g = column3_g.selectAll("threeRect_g")
				.data(chartData)
				.enter()
				.append("g")
				.on("mouseover", function() {
					var columnTipText3 = "基因FPKM";
					that.globalService.showPopOver(d3.event, columnTipText3);
				})
				.on("mouseout", function() {
					that.globalService.hidePopOver();
				});
			threeRect_g.selectAll("threeRects")
				.data(function(data) {
					return data.column3;
				})
				.enter()
				.append("rect")
				.attr("width", function(d) {
					return d.width;
				})
				.attr("height", outer_padding)
				.attr("y", -(innerRadius3 + outer_padding))
				.attr("transform", function(d, i) {
					return "rotate(" + d.rotateAngle + ")";
				})
				.attr("fill", function(d) {
					return colorScale_column3(d.value);
				});
		}

		if (lineData.length) {
			//gene name
			drawGene();
			//line
			drawLine();
		}

		//画gene name
		function drawGene() {
			//gene容器
			var circle_g = body_g.append("g")
				.attr("class", "circle_g");

			var gene_g = circle_g
				.selectAll(".allGene")
				.data(chartData)
				.enter()
				.append("g")

			var point_g = gene_g.selectAll("g")
				.data(function(d) {
					return d.pointData;
				})
				.enter()
				.append("g");
			//circle
			point_g.append("circle")
				.attr("transform", function(d) {
					return "rotate(" + d.angle + ")";
				})
				.attr("r", circle_r)
				.attr("cy", -innerRadius4)
				.attr("fill", "#d62728")
				.on("mouseover", function(d) {
					d3.select(this).append("title")
						.text(d.name + "," + d.pos)
				})
				.on("mouseout", function() {
					d3.select(this).select("title").remove();
				});
			//text
			if (that.isShowGene) {
				point_g.append("text")
					.style("font-family", "Consolas, Monaco, monospace")
					.style("font-size", "10px")
					.attr("y", gene_text_y)
					.attr("transform", function(d) {
						return "rotate(" + d.angle + ") rotate(-90,0 " + gene_text_y + ")";
					})
					.text(function(d) {
						if (d.name.length <= showTextLength) {
							return d.name;
						} else {
							return d.name.substring(0, showTextLength) + "...";
						}
					});

			}

		}

		//画line
		function drawLine() {
			//line
			var line_g = body_g.append("g")
				.attr("class", "line_g");

			var path_g = line_g.selectAll(".allLine")
				.data(lineData)
				.enter()
				.append('g');

			path_g.append("path")
				.attr("d", function(d) {
					return "M" + d.up_x + " " + d.up_y + "Q" + d.x + " " + d.y + " " + d.dw_x + " " + d.dw_y;
				})
				.attr('fill', 'transparent')
				.style("cursor", "pointer")
				.attr('stroke', function(d) {
					if (d.fusion_up_chr === d.fusion_dw_chr) {
						return "green";
					} else {
						return "red";
					}
				})
				.attr("stroke-width", function(d) {
					if (d.fusion_dup_num == 1) {
						return d.fusion_dup_num;
					}
					if (d.fusion_dup_num > 1) {
						return 2;
					}
				})
				.on("mouseover", function(d) {
					var tipText2 = `5’端融合基因：${d.fusion_up_gene}, ${d.fusion_up_chr}：${d.fusion_up_genome_pos},${d.fusion_up_strand}<br>
						3’端融合基因：${d.fusion_dw_gene},${d.fusion_dw_chr}：${d.fusion_dw_genome_pos},${d.fusion_dw_strand}<br>
						比对到上下游基因的reads数：${d.fusion_span_reads_num}<br>
						比对到融合位点的reads数：${d.fusion_junc_reads_num}<br> 
						融合类型：${d.fusion_fusion_type}<br>
						对3’端读码框的影响：${d.fusion_frame_shift_flag} `;
					that.globalService.showPopOver(d3.event,tipText2);
				})
				.on("mouseout", function() {
					that.globalService.hidePopOver();
				})
				.on("click", function(d) {
					var link_id = d.fusion_link_id;
					this.imgEntity.IsExportReport = false;
					this.GetImage(link_id, "loading");
				})
		}

		//返回一个数组：[{value: 0, angle: 5.633991554422396},{value: 1000, angle: 5.694823407494192}]
		function groupTicks(d, step) {
			var k = (d.endAngle - d.startAngle) / d.value;
			return d3.range(0, d.value, step).map(function(val) { //d3.range(0, d.value, step)：[0,1000,2000,3000,……]
				return {
					value: val,
					angle: val * k + d.startAngle
				};
			});
		}

	}

	GetImage(){

	}

  
}
