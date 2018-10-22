import { AjaxService } from "./../service/ajaxService";
import { Component, OnInit, Input } from "@angular/core";

@Component({
    selector: "app-grid-export",
    template: `<i class="anticon anticon-download" [nzTitle]="'tableButton.download' | translate" nz-tooltip (click)="download()"></i>`,
    styles: []
})
export class GridExportComponent implements OnInit {
    @Input()
    url: string;
    @Input()
    tableEntity: object;
    @Input()
    fileName: any;

    constructor(private ajaxService: AjaxService) {}

    ngOnInit() {}

    download() {
        this.tableEntity["isExport"] = true;
        this.tableEntity["fileName"] = this.fileName || '表格下载';

        this.ajaxService
            .getDeferData({
                url: this.url,
                data: this.tableEntity
            })
            .subscribe(
                data => {},
                error => {
                    console.log(error);
                }
            );
    }
}