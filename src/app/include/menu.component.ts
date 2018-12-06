import { PageModuleService } from './../super/service/pageModuleService';
import { Router } from "@angular/router";
import { GlobalService } from "../super/service/globalService";
import { Component, OnInit, Input, OnChanges, SimpleChanges } from "@angular/core";
import { StoreService } from '../super/service/storeService';
import { TranslateService } from "@ngx-translate/core";
@Component({
    selector: "app-menu",
    templateUrl: "./menu.component.html"
})
export class MenuComponent implements OnChanges {
    list: any[];
    expandItem: any = [];
    expand: boolean = false;
    timer: any = null;
    delayTimer:any = null;
    index: number = 0;
    moduleSwitch:true;

    @Input() menu: object[];
    @Input() geneSwitch:boolean = true;



    constructor(
        private router: Router,
        private globalService: GlobalService,
        public pageModuleService:PageModuleService,
        private storeService: StoreService,
        private translate: TranslateService
        ) {
            let browserLang = this.storeService.getLang();
            this.translate.use(browserLang);
        }

    ngOnChanges(changes: SimpleChanges) {
        if (changes["menu"].currentValue.length) {
            // 给所有的分类和页面加上active字段
            this.initMenuStatus();
            // 默认第0个激活
            changes["menu"].currentValue[0]["active"] = true;
            changes["menu"].currentValue[0]["children"][0]["active"] = true;
        }
    }

    // 初始化菜单状态
    initMenuStatus() {
        this.menu.forEach(val => {
            val["active"] = false;
            if (val["children"].length) {
                val["children"].forEach(v => {
                    v["active"] = false;
                });
            }
        });
    }

    moduleSwitchChange(status){
        this.pageModuleService.setModule(status?'gene':'iso');
    }

    rootMenuMouseEnter(){
        if(this.delayTimer) clearTimeout(this.delayTimer);
        this.delayTimer = setTimeout(()=>{
            this.expand = true;
            clearTimeout(this.delayTimer);
            this.delayTimer = null;
        },200)
    }

    rootMenuMouseLeave() {
        if(this.delayTimer) {
            clearTimeout(this.delayTimer);
            this.delayTimer = null;
        }
        clearTimeout(this.timer);
        this.timer = null;
        this.timer = setTimeout(() => {
            this.expand = false;
        }, 300);
    }

    menuMouseOver(menu, index) {
        if(this.delayTimer) return;
        if (this.timer) {
            clearTimeout(this.timer)
            this.timer = null;
        }
        this.index = index;
        this.expandItem = menu["children"];
    }

    subMenuMouseEnter() {
        if (this.timer) clearTimeout(this.timer);
    }

    subMenuMouseLeave() {
        this.expand = false;
    }

    jump(submenu) {
        this.initMenuStatus();
        submenu["active"] = true;
        this.menu[this.index]["active"] = true;
        this.router.navigateByUrl(`/report/mrna/${submenu["url"]}`);
        this.expand = false;
    }

    analysisFn() {
        let url = `${location.href.substring(
            0,
            location.href.indexOf("/report")
        )}/report/reanalysis/index`;
        window.open(url);
    }

    /**
     * @description 外部重置路由激活状态
     * @author Yangwd<277637411@qq.com>
     * @date 2018-11-27
     * @memberof MenuComponent
     */
    public _initRouteActiveStatus(){
        this.initMenuStatus();
    }
}
