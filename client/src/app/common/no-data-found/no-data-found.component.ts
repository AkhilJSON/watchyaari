import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";

@Component({
    selector: "app-show-message",
    templateUrl: "./no-data-found.component.html",
    styleUrls: ["./no-data-found.component.css"],
})
export class NoDataFoundComponent implements OnInit {
    @Input() public maxHeight = "500px";
    @Input() public message = "No data found!";
    @Input() public className = "";
    @Input() public showHomePageNavigation = false;
    @Input() public actionLabel = "";

    @Output() onCloseOtherPartySessions = new EventEmitter<{
        closeOtherSessions: any;
    }>();

    constructor() {}

    ngOnInit(): void {}

    reloadPage(event: any) {
        event.preventDefault();
        window.location.reload();
    }

    goback() {
        window.location.href = "";
    }

    closeOtherPartySessions() {
        this.onCloseOtherPartySessions.emit({ closeOtherSessions: true });
    }
}
