import {
    Component,
    OnInit,
    Input,
    ViewChild,
    TemplateRef,
    Output,
    EventEmitter,
    HostListener
} from "@angular/core";
import { AjaxService } from "../../super/service/ajaxService";
import { LoadingService } from "../../super/service/loadingService";

declare const $: any;

@Component({
    selector: "app-little-table",
    templateUrl: "./little-table.component.html",
    styles: []
})
export class LittleTableComponent implements OnInit {
    @Input() url: string;
    @Input() pageEntity: object;
    @Input() inRefreshShow: boolean = true;

    @Input() targetID: string;
    @Input() targetID2: string;
    @Input() targetID2_ID:string;
    @Input() targetID2Type:string;
    @Input() targetID2Species:string;

    @Input() targetURL: string;
    @Input() targetFlag: boolean = false;
    goTarget: string;

    @Input() type: string;

    @Output() drawTableEmit: EventEmitter<any> = new EventEmitter();

    @Input() fileName:any; //下载的表格名称

    //this.drawChartEmit.emit(data);

    isDisabled:boolean=false;

    tableError: string;

    isLoading: boolean = false;

    tableData: any[] = [];
    rows: any[] = [];
    thead: any[] = [];

    //scroll: any;
    scroll: any = { x: "0", y: "0" };

    targetID2Url:string;
    constructor(
        private ajaxService: AjaxService,
        private loadingService: LoadingService
    ) {}

    ngOnInit() {
        this.goTarget = this.targetURL;
        // if(this.targetFlag){
        //     this.goTarget = this.targetURL;
        // }else{
        //     //this.goTarget = this.targetURL + this.targetID;
        //     this.goTarget = this.targetURL;
        // }
        if(this.targetID2){
            this.targetID2Url = `${location.href.split('/report')[0]}/report/gene-detail/${sessionStorage.getItem('LCID')}/${this.targetID2Species}/${this.targetID2Type}/nosts/`;
        }
        this.getData();
    }

    getData() {
        this.isLoading = true;
        this.ajaxService
            .getDeferData({
                url: this.url,
                data: this.pageEntity
            })
            .subscribe(
                (data: any) => {
                    if (data.status == "0" && (data.data.length == 0 || $.isEmptyObject(data.data))) {
                        this.tableError = "nodata";
                    } else if (data.status == "-1") {
                        this.tableError = "error";
                    } else if (data.status == "-2") {
                        this.tableError = "dataOver";
                    } else {
                       this.tableError = "";
                       this.tableData = data.data;
                       this.rows = this.tableData["rows"];
                       this.thead = this.tableData["baseThead"];

                       if(this.rows.length * this.thead.length>1000000){
						    this.isDisabled=true;
					    }else{
                            this.isDisabled=false;
                        }

                       this.drawTableEmit.emit({
                            type:this.type,
                            data:data.data
                       });

                        if(this.tableData["rows"].length>5){
                            $(`#${this.targetID} .ant-table-body`).css("height", `200px`);
                            this.scroll["y"] = `200px`;
                        }else{
                            this.scroll = { x:"100%"}
                        }
                    }
                    this.isLoading = false;
                    //console.log(data)

                },
                error => {
                    this.tableError = error;
                    this.isLoading = false;
                }
            );
    }

    refresh() {
        this.getData();
    }

    down(){

    }
}
