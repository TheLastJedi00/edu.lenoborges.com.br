import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  let component: ConfirmDialog;
  let fixture: ComponentFixture<ConfirmDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialog],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('emite confirmed ao clicar em confirmar', () => {
    let confirmedCalled = false;
    component.confirmed.subscribe(() => {
      confirmedCalled = true;
    });

    component.confirm();
    expect(confirmedCalled).toBeTrue();
  });

  it('emite cancelled ao clicar em cancelar', () => {
    let cancelledCalled = false;
    component.cancelled.subscribe(() => {
      cancelledCalled = true;
    });

    component.cancel();
    expect(cancelledCalled).toBeTrue();
  });

  it('emite cancelled no fechamento nativo sem confirmação prévia', () => {
    let cancelledCalled = false;
    component.cancelled.subscribe(() => {
      cancelledCalled = true;
    });

    component.onNativeClose();
    expect(cancelledCalled).toBeTrue();
  });
});
