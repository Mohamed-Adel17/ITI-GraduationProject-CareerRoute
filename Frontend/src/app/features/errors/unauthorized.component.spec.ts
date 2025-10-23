import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { UnauthorizedComponent } from './unauthorized.component';
import { By } from '@angular/platform-browser';

describe('UnauthorizedComponent', () => {
  let component: UnauthorizedComponent;
  let fixture: ComponentFixture<UnauthorizedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnauthorizedComponent, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(UnauthorizedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display 401 error title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('h1');
    expect(heading?.textContent).toContain('401 - Unauthorized');
  });

  it('should display error message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const paragraph = compiled.querySelector('p');
    expect(paragraph?.textContent).toContain("You don't have permission to view this page");
  });

  it('should have a link to home page', () => {
    const linkElement = fixture.debugElement.query(By.css('a[routerLink]'));
    expect(linkElement).toBeTruthy();
    expect(linkElement.nativeElement.textContent).toBe('Go to Home');
    expect(linkElement.nativeElement.getAttribute('routerLink')).toBe('/');
  });

  it('should render within a container section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('section.container');
    expect(section).toBeTruthy();
  });
});
