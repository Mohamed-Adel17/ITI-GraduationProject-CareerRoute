import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NotFoundComponent } from './not-found.component';
import { By } from '@angular/platform-browser';

describe('NotFoundComponent', () => {
  let component: NotFoundComponent;
  let fixture: ComponentFixture<NotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display 404 error title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('h1');
    expect(heading?.textContent).toContain('404 - Not Found');
  });

  it('should display error message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const paragraph = compiled.querySelector('p');
    expect(paragraph?.textContent).toContain("The page you are looking for doesn't exist");
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
