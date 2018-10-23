import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

declare const d4: any;

@Component({
    selector: "app-cxzk2",
    templateUrl: "./cxzk2.component.html"
})

export class cxzk2Component implements OnInit {
    @ViewChild('tableSwitchChart') tableSwitchChart;

    tableUrl: string;
    chartUrl: string;
    tableEntity: object = {
        "LCID": sessionStorage.getItem("LCID"),
        "sample": "",
        "compare": ""
    };

    sampleList: string[] = [];
    compareList: string[] = [];

    chart: any;
    isMultiSelect: boolean;
    selectedData:object[]=[];

    constructor(
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit() {
        this.isMultiSelect = false;
        this.tableUrl = "http://localhost:8086/tableSwitchChart";
        this.chartUrl = "http://localhost:8086/scatter";

        this.sampleList = ["HBRR1", "HBRR2", "HBRR3", "HBRR4", "uBRR1", "uBRR2", "uBRR3", "uBRR4"];
        this.compareList = ["com1", "com2", "com3", "com4", "compare1", "compare2", "compare3", "compare4"];

        this.tableEntity['sample'] = this.sampleList[0];
        this.tableEntity["compare"] = this.compareList[0];

    }

    onSelectChange1() {
        this.tableSwitchChart.SelectChange('sample', this.tableEntity["sample"]);
    }

    onSelectChange2() {
        this.tableSwitchChart.SelectChange('compare', this.tableEntity["compare"]);
    }

    drawChart(data) {
        let config: object = {
            chart: {
                title: "散点图",
                titleClick: function (event) {
                    var name = prompt("请输入需要修改的标题", "");
                    if (name) {
                        this.setChartTitle(name);
                        this.updateTitle();
                    }
                },
                enableChartSelect: true,
                // selectedModule:"",
                onselect: (d) => {
                    this.selectedData=d;
                    console.log(this.selectedData);
                },
                el: "#chartId222",
                type: "scatter",
                width: 1000,
                height: 400,
                radius: 3,
                hoverRadius: 6,
                custom: ["height", "weight", "gender"],
                data: data
            },
            axis: {
                x: {
                    title: "Height(CM)",
                    titleClick: function (event) {
                        var name = prompt("请输入需要修改的标题", "");
                        if (name) {
                            this.setXTitle(name);
                            this.updateTitle();
                        }
                    }
                },
                y: {
                    title: "Weight(KG)",
                    titleClick: function (event) {
                        var name = prompt("请输入需要修改的标题", "");
                        if (name) {
                            this.setYTitle(name);
                            this.updateTitle();
                        }
                    }
                }
            },
            legend: {
                show: true,
                position: "right",
                data: ["female", "male"]
            },
            tooltip: function (d) {
                return (
                    "<span>身高：" +
                    d.height +
                    "</span><br><span>体重：" +
                    d.weight +
                    "</span>"
                );
            }
        };

        this.chart = new d4().init(config);
    }

    //单、多选change
    multiSelectChange() {
        if (this.isMultiSelect) {
            this.chart.selectedModule = "multiple";
        } else {
            this.chart.selectedModule = "single";
        }
        this.chart.setChartSelectModule(this.chart.selectedModule);
    }

    //多选确定
    multipleConfirm(){
        console.log(this.selectedData);
    }

}

