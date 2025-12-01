import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    // Create mock router
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Trust Indicators', () => {
    it('should have trust indicators defined', () => {
      expect(component.trustIndicators).toBeDefined();
      expect(component.trustIndicators.mentors).toBe('1,000+');
      expect(component.trustIndicators.sessions).toBe('10,000+');
      expect(component.trustIndicators.rating).toBe('4.8');
      expect(component.trustIndicators.specializations).toBe('50+');
    });

    it('should display trust indicators in template', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('1,000+');
      expect(compiled.textContent).toContain('10,000+');
      expect(compiled.textContent).toContain('4.8');
      expect(compiled.textContent).toContain('50+');
    });
  });

  describe('Navigation', () => {
    it('should navigate to /mentors when browseMentors is called', () => {
      component.browseMentors();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/mentors']);
    });

    it('should navigate to /categories when exploreCategories is called', () => {
      component.exploreCategories();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/categories']);
    });

    it('should navigate to /user/apply-mentor when becomeMentor is called', () => {
      component.becomeMentor();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/user/apply-mentor']);
    });
  });

  describe('Template', () => {
    it('should render hero section with headline', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const h1 = compiled.querySelector('h1');
      expect(h1).toBeTruthy();
      expect(h1?.textContent).toContain('Find Your Perfect');
      expect(h1?.textContent).toContain('Career Mentor');
    });

    it('should render primary CTA button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button');
      const browseMentorsButton = Array.from(buttons).find(btn =>
        btn.textContent?.includes('Browse Mentors')
      );
      expect(browseMentorsButton).toBeTruthy();
    });

    it('should render secondary CTA button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button');
      const becomeMentorButton = Array.from(buttons).find(btn =>
        btn.textContent?.includes('Become a Mentor')
      );
      expect(becomeMentorButton).toBeTruthy();
    });

    it('should render background image', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const img = compiled.querySelector('img');
      expect(img).toBeTruthy();
      expect(img?.getAttribute('src')).toBe('/9.png');
      expect(img?.getAttribute('alt')).toContain('CareerRoute');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on primary CTA button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button');
      const browseMentorsButton = Array.from(buttons).find(btn =>
        btn.textContent?.includes('Browse Mentors')
      ) as HTMLButtonElement;
      expect(browseMentorsButton?.getAttribute('aria-label')).toBe('Browse all mentors');
    });

    it('should have aria-label on secondary CTA button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button');
      const becomeMentorButton = Array.from(buttons).find(btn =>
        btn.textContent?.includes('Become a Mentor')
      ) as HTMLButtonElement;
      expect(becomeMentorButton?.getAttribute('aria-label')).toBe('Apply to become a mentor');
    });

    it('should have alt text on background image', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const img = compiled.querySelector('img');
      expect(img?.getAttribute('alt')).toBeTruthy();
      expect(img?.getAttribute('alt')).toContain('Professional mentorship');
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive classes on hero section', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const heroSection = compiled.querySelector('.hero-section');
      expect(heroSection?.classList.contains('min-h-screen')).toBe(true);
    });

    it('should have responsive grid for trust indicators', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const trustIndicatorsGrid = compiled.querySelector('.grid.grid-cols-2.md\\:grid-cols-4');
      expect(trustIndicatorsGrid).toBeTruthy();
    });
  });
});
