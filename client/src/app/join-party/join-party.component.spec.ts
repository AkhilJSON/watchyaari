import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { JoinPartyComponent } from "./join-party.component";

describe("JoinPartyComponent", () => {
    let component: JoinPartyComponent;
    let fixture: ComponentFixture<JoinPartyComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [JoinPartyComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(JoinPartyComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
