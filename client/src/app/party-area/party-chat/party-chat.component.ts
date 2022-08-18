import { Component, OnInit, Input, ViewChild, AfterViewInit, OnDestroy, Output, EventEmitter } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { CookieService } from "../../services/cookie.service";
import { PartyService } from "../../services/party.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatCardModule } from "@angular/material/card";
import {
    PerfectScrollbarConfigInterface,
    PerfectScrollbarComponent,
    PerfectScrollbarDirective,
} from "ngx-perfect-scrollbar";

import * as moment from "moment/moment";

import { Subscription } from "rxjs";

import { SocketIOClient } from "socket.io-client";
import * as io from "socket.io-client";

import { environment } from "../../../environments/environment";
import { ChatService } from "../../services/chat.service";

import * as _ from "lodash";
import { QuillInitializeService } from "../../services/quill-initialize.service";
import "quill-mention";
import "quill-emoji";

@Component({
    selector: "app-party-chat",
    templateUrl: "./party-chat.component.html",
    styleUrls: ["./party-chat.component.css"],
})
export class PartyChatComponent implements OnInit, AfterViewInit, OnDestroy {
    subscription: any = new Subscription();

    @Input() partyId: any;
    @Input() otherParticipants: any = [];

    @Output() onChatResize = new EventEmitter<{ layoutDimensions: any }>();

    @ViewChild(PerfectScrollbarComponent)
    componentRef?: PerfectScrollbarComponent;
    @ViewChild(PerfectScrollbarDirective)
    directiveRef?: PerfectScrollbarDirective;

    public config: PerfectScrollbarConfigInterface = {};

    chatSocket: SocketIOClient.Socket;
    loadingChat: any;

    public chatForm: FormGroup;

    loggedInUserdId: any;

    chatHistory: any = [];

    chatAreaContainer: any = {
        header: 5,
        historyArea: 90,
        messsageArea: 10,
    };

    isChatAreaMinimised: any = false;

    //quill editor::

    chatText = "";
    hasFocus = false;

    quillConfig = {
        toolbar: ".toolbar",
        autoLink: true,
        mention: {
            allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
            mentionDenotationChars: ["@"],
            source: (searchTerm, renderList, mentionChar) => {
                let values;
                if (!this.otherParticipants.length) {
                    return;
                }
                if (mentionChar === "@") {
                    values = this.otherParticipants;
                }

                if (searchTerm.length === 0) {
                    renderList(values, searchTerm);
                } else {
                    const matches = [];
                    for (var i = 0; i < values.length; i++)
                        if (~values[i].value.toLowerCase().indexOf(searchTerm.toLowerCase())) matches.push(values[i]);
                    renderList(matches, searchTerm);
                }
            },
        },
        "emoji-toolbar": true,
        "emoji-textarea": false,
        "emoji-shortname": true,
    };

    constructor(
        private fb: FormBuilder,
        private cs: CookieService,
        private ps: PartyService,
        private _snackBar: MatSnackBar,
        private chatService: ChatService,
        private quillInitializeService: QuillInitializeService
    ) {
        this.loggedInUserdId = this.cs.getItem("_uid");
    }

    ngOnInit(): void {
        this.chatSocket = io.connect(environment.defaultSocketConnection + "/partyChat", {
            query: `partyId=${this.partyId}`,
        });

        this.chatForm = this.fb.group({
            message: [null, Validators.compose([Validators.required])],
            partyId: this.partyId,
            userId: this.loggedInUserdId,
            cAt: new Date().getTime(),
            userName: "",
        });

        this.loadingChat = true;
        let chatHistoryService = this.chatService
            .getChatHistory({ partyId: this.partyId })
            .subscribe((response: any) => {
                this.loadingChat = false;
                if (response.Success && response.data) {
                    this.chatHistory = this.chatHistory.concat(response.data);
                    this.chatHistory = _.sortBy(this.chatHistory, [
                        (chat) => {
                            return chat.cAt;
                        },
                    ]);
                    setTimeout(() => {
                        this.componentRef && this.componentRef.directiveRef.scrollToBottom();
                    }, 0);
                }
            });

        this.subscription.add(chatHistoryService);

        let userDetailsService = this.ps.getUserDetails({}).subscribe((response: any) => {
            if (response.Success && response.data) {
                this.chatForm.controls["userName"].setValue(response.data.fullName);
            }
        });

        this.subscription.add(userDetailsService);

        this.chatSocket.on("connect", () => {
            this.chatSocket.emit("CREATE_OR_JOIN_PARTY_CHAT_ROOM");
        });

        this.chatSocket.on("COPY_MESSAGE", (message) => {
            this.chatHistory.push(JSON.parse(message));

            setTimeout(() => {
                this.componentRef && this.componentRef.directiveRef.scrollToBottom();
            }, 0);
        });
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.toggleMessageScroll(true);
            this.componentRef && this.componentRef.directiveRef.scrollToBottom();
        }, 0);
    }

    sendChat() {
        if (this.chatText == "<p><br></p><p><br></p>" || !this.chatText) {
            this.chatText = "";
            this.openSnackBar(`Empty message can't be sent`, "", "", "center");
            return;
        }
        let enterCheckIndex = this.chatText.lastIndexOf("<p><br></p>");
        enterCheckIndex >= 0 && (this.chatText = this.chatText.substr(0, enterCheckIndex));

        this.chatForm.controls.message.setValue(this.chatText);
        this.chatForm.controls.cAt.setValue(new Date().getTime());
        this.chatHistory.push(this.chatForm.value);
        this.chatSocket.emit("SEND_MESSAGE", JSON.stringify(this.chatForm.value));
        this.chatForm.controls.message.reset();
        this.chatText = "";
        setTimeout(() => {
            this.componentRef && this.componentRef.directiveRef.scrollToBottom();
        }, 0);
    }

    openSnackBar(message: any, action: any, verticalPosition?: any, horizontalPosition?: any) {
        this._snackBar.open(message, action || "close", {
            duration: 2000,
            verticalPosition: verticalPosition || "bottom",
            horizontalPosition: horizontalPosition || "right",
        });
    }

    showUserName(userId, index) {
        if (index && userId == this.chatHistory[index - 1].userId) {
            return false;
        }
        return true;
    }

    showDate(createdDate, index) {
        createdDate = formatedDate(createdDate);
        let today = formatedDate(moment());
        let yesterday = formatedDate(moment().add(-1, "days"));
        if (index && createdDate == formatedDate(this.chatHistory[index - 1].cAt)) {
            return false;
        }
        if (today == createdDate) {
            return "TODAY";
        }
        if (yesterday == createdDate) {
            return "YESTERDAY";
        }
        return createdDate;

        function formatedDate(date) {
            return moment(date).format("L");
        }
    }

    quilEditorChange(editor: any) {
        if (editor.event == "text-change") {
            this.toggleMessageScroll(true);
            if (editor.text.length <= 50) {
                this.chatAreaContainer.historyArea = 90;
                this.chatAreaContainer.messsageArea = 10;
                return;
            }
            if (this.chatAreaContainer.messsageArea <= 25) {
                let cutOff = Math.round(editor.text.length / 100);
                this.chatAreaContainer.historyArea -= cutOff * 2;
                this.chatAreaContainer.messsageArea += cutOff * 2;
            } else {
                //allow scroll
                this.toggleMessageScroll(false);
            }
        }
    }

    toggleMessageScroll(status: any) {
        if (!this.chatAreaContainer.historyArea) {
            return;
        }
        let editor = document.getElementsByClassName("ql-editor");
        if (!status) {
            editor && editor[0] && editor[0].classList.remove("ql-editor-chat-area-no-scroll");
            return;
        }
        editor && editor[0] && editor[0].classList.add("ql-editor-chat-area-no-scroll");
    }

    toggleEmoji() {
        return document.getElementById("emoji-palette");
    }

    toggleChat() {
        if (!this.isChatAreaMinimised) {
            this.isChatAreaMinimised = true;
            this.chatAreaContainer = {
                header: 5,
                historyArea: 0,
                messsageArea: 0,
            };
            this.onChatResize.emit({
                layoutDimensions: { videoAreaLayout: 90, chatAreaLayout: 5 },
            });
        } else {
            this.isChatAreaMinimised = false;
            this.chatAreaContainer = {
                header: 5,
                historyArea: 90,
                messsageArea: 10,
            };
            this.onChatResize.emit({
                layoutDimensions: { videoAreaLayout: 50, chatAreaLayout: 45 },
            });
        }
    }

    ngOnDestroy() {
        this.chatSocket.close();
        this.subscription.unsubscribe();
    }
}
