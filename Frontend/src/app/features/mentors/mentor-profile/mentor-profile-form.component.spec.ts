import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { MentorProfileFormComponent } from './mentor-profile-form.component';
import { MentorService } from '../../../core/services/mentor.service';
import { NotificationService } from '../../../core/services/notification.service';
import { 
  Mentor, 
  MentorApprovalStatus, 
  MentorCategory,
  MentorProfileUpdate,
  MentorApplication 
} from '../../../shared/models/mentor.model';

describe('MentorProfileFormComponent', () => {
  let component: MentorProfileFormComponent;
  let fixture: ComponentFixture<MentorProfileFormComponent>;
  let mentorService: jasmine.SpyObj<MentorService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  // Mock data
  const mockCategories: MentorCategory[] = [
    { id: 1, name: 'Software Development', description: 'Web and mobile development' },
    { id: 2, name: 'Data Science', description: 'ML, AI, and analytics' },
    { id: 3, name: 'DevOps', description: 'CI/CD and cloud infrastructure' }
  ];

  const mockMentor: Mentor = {
    id: '123',
    bio: 'Experienced software engineer with 10 years in the industry. Specialized in React, Node.js, and cloud architecture. Passionate about mentoring and helping others grow their careers.',
    expertiseTags: ['React', 'Node.js', 'AWS', 'Docker'],
    yearsOfExperience: 10,
    certifications: 'AWS Certified Solutions Architect',
    rate30Min: 50,
    rate60Min: 90,
    averageRating: 4.8,
    totalReviews: 25,
    totalSessionsCompleted: 100,
    isVerified: true,
    approvalStatus: MentorApprovalStatus.Approved,
    isAvailable: true,
    categoryIds: [1, 3]
  };

  beforeEach(async () => {
    const mentorServiceSpy = jasmine.createSpyObj('MentorService', [
      'applyToBecomeMentor',
      'updateMentorProfile'
    ]);

    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'success',
      'error',
      'warning',
      'info'
    ]);

    await TestBed.configureTestingModule({
      imports: [MentorProfileFormComponent, ReactiveFormsModule],
      providers: [
        { provide: MentorService, useValue: mentorServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    }).compileComponents();

    mentorService = TestBed.inject(MentorService) as jasmine.SpyObj<MentorService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

    fixture = TestBed.createComponent(MentorProfileFormComponent);
    component = fixture.componentInstance;
    component.categories = mockCategories;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize form with default values in create mode', () => {
      component.mode = 'create';
      fixture.detectChanges();

      expect(component.mentorForm).toBeDefined();
      expect(component.mentorForm.get('bio')?.value).toBe('');
      expect(component.mentorForm.get('rate30Min')?.value).toBe(component.MIN_PRICE);
      expect(component.mentorForm.get('isAvailable')?.value).toBe(true);
    });

    it('should populate form with mentor data in edit mode', () => {
      component.mode = 'edit';
      component.mentor = mockMentor;
      fixture.detectChanges();

      expect(component.mentorForm.get('bio')?.value).toBe(mockMentor.bio);
      expect(component.mentorForm.get('yearsOfExperience')?.value).toBe(mockMentor.yearsOfExperience);
      expect(component.mentorForm.get('rate30Min')?.value).toBe(mockMentor.rate30Min);
      expect(component.mentorForm.get('rate60Min')?.value).toBe(mockMentor.rate60Min);
    });

    it('should handle expertise tags as array', () => {
      component.mentor = mockMentor;
      fixture.detectChanges();

      const expertiseTags = component.mentorForm.get('expertiseTags')?.value;
      expect(expertiseTags).toContain('React');
      expect(expertiseTags).toContain('Node.js');
    });

    it('should handle expertise tags as string', () => {
      const mentorWithStringTags = { ...mockMentor, expertiseTags: 'React, Node.js, AWS' };
      component.mentor = mentorWithStringTags;
      fixture.detectChanges();

      const expertiseTags = component.mentorForm.get('expertiseTags')?.value;
      expect(expertiseTags).toBe('React, Node.js, AWS');
    });
  });

  describe('Bio Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require bio', () => {
      const bioControl = component.mentorForm.get('bio');
      bioControl?.setValue('');
      bioControl?.markAsTouched();

      expect(bioControl?.hasError('required')).toBe(true);
      expect(component.hasError('bio')).toBe(true);
    });

    it('should enforce minimum bio length', () => {
      const bioControl = component.mentorForm.get('bio');
      bioControl?.setValue('Too short');
      bioControl?.markAsTouched();

      expect(bioControl?.hasError('minlength')).toBe(true);
    });

    it('should enforce maximum bio length', () => {
      const bioControl = component.mentorForm.get('bio');
      const longBio = 'a'.repeat(component.MAX_BIO_LENGTH + 1);
      bioControl?.setValue(longBio);
      bioControl?.markAsTouched();

      expect(bioControl?.hasError('maxlength')).toBe(true);
    });

    it('should accept valid bio', () => {
      const bioControl = component.mentorForm.get('bio');
      const validBio = 'a'.repeat(component.MIN_BIO_LENGTH);
      bioControl?.setValue(validBio);

      expect(bioControl?.valid).toBe(true);
    });

    it('should calculate bio character count correctly', () => {
      const bio = 'Test bio content';
      component.mentorForm.get('bio')?.setValue(bio);

      expect(component.getBioCharCount()).toBe(bio.length);
    });

    it('should detect when bio is near limit', () => {
      const nearLimitBio = 'a'.repeat(component.MAX_BIO_LENGTH - 50);
      component.mentorForm.get('bio')?.setValue(nearLimitBio);

      expect(component.isBioNearLimit()).toBe(true);
    });
  });

  describe('Expertise Tags Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require expertise tags', () => {
      const tagsControl = component.mentorForm.get('expertiseTags');
      tagsControl?.setValue('');
      tagsControl?.markAsTouched();

      expect(component.hasError('expertiseTags')).toBe(true);
    });

    it('should require at least 2 tags', () => {
      const tagsControl = component.mentorForm.get('expertiseTags');
      tagsControl?.setValue('React');
      tagsControl?.markAsTouched();

      expect(tagsControl?.hasError('minTags')).toBe(true);
    });

    it('should accept valid tags', () => {
      const tagsControl = component.mentorForm.get('expertiseTags');
      tagsControl?.setValue('React, Node.js, AWS');

      expect(tagsControl?.valid).toBe(true);
    });

    it('should reject too many tags', () => {
      const tagsControl = component.mentorForm.get('expertiseTags');
      const manyTags = Array.from({ length: 25 }, (_, i) => `Tag${i}`).join(', ');
      tagsControl?.setValue(manyTags);

      expect(tagsControl?.hasError('maxTags')).toBe(true);
    });

    it('should parse expertise tags correctly', () => {
      component.mentorForm.get('expertiseTags')?.setValue('React, Node.js, AWS');
      const tags = component.getExpertiseTags();

      expect(tags).toEqual(['React', 'Node.js', 'AWS']);
    });

    it('should handle tags with extra spaces', () => {
      component.mentorForm.get('expertiseTags')?.setValue('  React  ,  Node.js  ,  AWS  ');
      const tags = component.getExpertiseTags();

      expect(tags).toEqual(['React', 'Node.js', 'AWS']);
    });
  });

  describe('Experience Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require years of experience', () => {
      const expControl = component.mentorForm.get('yearsOfExperience');
      expControl?.setValue(null);
      expControl?.markAsTouched();

      expect(expControl?.hasError('required')).toBe(true);
    });

    it('should enforce minimum experience', () => {
      const expControl = component.mentorForm.get('yearsOfExperience');
      expControl?.setValue(-1);

      expect(expControl?.hasError('min')).toBe(true);
    });

    it('should enforce maximum experience', () => {
      const expControl = component.mentorForm.get('yearsOfExperience');
      expControl?.setValue(51);

      expect(expControl?.hasError('max')).toBe(true);
    });

    it('should accept valid experience', () => {
      const expControl = component.mentorForm.get('yearsOfExperience');
      expControl?.setValue(10);

      expect(expControl?.valid).toBe(true);
    });
  });

  describe('Pricing Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require both rates', () => {
      const rate30Control = component.mentorForm.get('rate30Min');
      const rate60Control = component.mentorForm.get('rate60Min');

      rate30Control?.setValue(null);
      rate60Control?.setValue(null);

      expect(rate30Control?.hasError('required')).toBe(true);
      expect(rate60Control?.hasError('required')).toBe(true);
    });

    it('should enforce minimum price', () => {
      const rate30Control = component.mentorForm.get('rate30Min');
      rate30Control?.setValue(10);

      expect(rate30Control?.hasError('min')).toBe(true);
    });

    it('should enforce maximum price', () => {
      const rate30Control = component.mentorForm.get('rate30Min');
      rate30Control?.setValue(600);

      expect(rate30Control?.hasError('max')).toBe(true);
    });

    it('should validate that 60-min rate is higher than 30-min rate', () => {
      component.mentorForm.patchValue({
        rate30Min: 50,
        rate60Min: 40
      });

      const errors = component.getPricingErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('higher'))).toBe(true);
    });

    it('should calculate suggested 60-min rate', () => {
      component.mentorForm.get('rate30Min')?.setValue(50);
      const suggested = component.getSuggestedRate60Min();

      expect(suggested).toBe(90); // 50 * 1.8
    });

    it('should apply suggested rate', () => {
      component.mentorForm.get('rate30Min')?.setValue(50);
      component.applySuggestedRate();

      expect(component.mentorForm.get('rate60Min')?.value).toBe(90);
    });
  });

  describe('Category Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require at least one category', () => {
      const categoryControl = component.mentorForm.get('categoryIds');
      categoryControl?.setValue([]);
      categoryControl?.markAsTouched();

      expect(component.hasError('categoryIds')).toBe(true);
    });

    it('should toggle category selection', () => {
      component.toggleCategory(1);
      expect(component.isCategorySelected(1)).toBe(true);

      component.toggleCategory(1);
      expect(component.isCategorySelected(1)).toBe(false);
    });

    it('should allow multiple category selections', () => {
      component.toggleCategory(1);
      component.toggleCategory(2);
      component.toggleCategory(3);

      const categoryIds = component.mentorForm.get('categoryIds')?.value;
      expect(categoryIds).toEqual([1, 2, 3]);
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not submit invalid form', () => {
      spyOn(component.formSubmit, 'emit');
      component.onSubmit();

      expect(component.formSubmit.emit).not.toHaveBeenCalled();
      expect(notificationService.error).toHaveBeenCalled();
    });

    it('should emit form data on valid submission', () => {
      spyOn(component.formSubmit, 'emit');

      // Fill form with valid data
      component.mentorForm.patchValue({
        bio: 'a'.repeat(150),
        expertiseTags: 'React, Node.js, AWS',
        yearsOfExperience: 10,
        certifications: 'AWS Certified',
        rate30Min: 50,
        rate60Min: 90,
        categoryIds: [1, 2],
        isAvailable: true
      });

      component.onSubmit();

      expect(component.formSubmit.emit).toHaveBeenCalled();
      const emittedData = (component.formSubmit.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData.bio).toBeDefined();
      expect(emittedData.expertiseTags).toEqual(['React', 'Node.js', 'AWS']);
    });

    it('should set submitting state', () => {
      component.mentorForm.patchValue({
        bio: 'a'.repeat(150),
        expertiseTags: 'React, Node.js',
        yearsOfExperience: 10,
        rate30Min: 50,
        rate60Min: 90,
        categoryIds: [1]
      });

      component.onSubmit();
      expect(component.isSubmitting).toBe(true);
    });

    it('should convert expertise tags to array', () => {
      spyOn(component.formSubmit, 'emit');

      component.mentorForm.patchValue({
        bio: 'a'.repeat(150),
        expertiseTags: 'React, Node.js, AWS, Docker',
        yearsOfExperience: 10,
        rate30Min: 50,
        rate60Min: 90,
        categoryIds: [1]
      });

      component.onSubmit();

      const emittedData = (component.formSubmit.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(Array.isArray(emittedData.expertiseTags)).toBe(true);
      expect(emittedData.expertiseTags.length).toBe(4);
    });
  });

  describe('Form Cancellation', () => {
    it('should emit cancel event', () => {
      spyOn(component.formCancel, 'emit');
      component.onCancel();

      expect(component.formCancel.emit).toHaveBeenCalled();
    });
  });

  describe('Form Reset', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form to initial state', () => {
      // Fill form
      component.mentorForm.patchValue({
        bio: 'Test bio',
        expertiseTags: 'React, Node.js',
        yearsOfExperience: 10
      });

      // Reset
      component.resetForm();

      expect(component.mentorForm.get('bio')?.value).toBe('');
      expect(component.mentorForm.get('expertiseTags')?.value).toBe('');
      expect(component.mentorForm.get('yearsOfExperience')?.value).toBe(0);
    });

    it('should reset submitting state', () => {
      component.isSubmitting = true;
      component.resetForm();

      expect(component.isSubmitting).toBe(false);
    });
  });

  describe('Error Messages', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return appropriate error message for bio', () => {
      const bioControl = component.mentorForm.get('bio');
      bioControl?.setValue('');
      bioControl?.markAsTouched();

      const message = component.getErrorMessage('bio');
      expect(message).toContain('required');
    });

    it('should return appropriate error message for expertise tags', () => {
      const tagsControl = component.mentorForm.get('expertiseTags');
      tagsControl?.setValue('React');
      tagsControl?.markAsTouched();

      const message = component.getErrorMessage('expertiseTags');
      expect(message).toContain('at least');
    });

    it('should return appropriate error message for rates', () => {
      const rateControl = component.mentorForm.get('rate30Min');
      rateControl?.setValue(10);
      rateControl?.markAsTouched();

      const message = component.getErrorMessage('rate30Min');
      expect(message).toContain('Minimum');
    });
  });

  describe('Helper Methods', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should get form control by name', () => {
      const control = component.getControl('bio');
      expect(control).toBeDefined();
      expect(control).toBe(component.mentorForm.get('bio'));
    });

    it('should check if field has error', () => {
      const bioControl = component.mentorForm.get('bio');
      bioControl?.setValue('');
      bioControl?.markAsTouched();

      expect(component.hasError('bio')).toBe(true);
      expect(component.hasError('bio', 'required')).toBe(true);
    });

    it('should set submitting state externally', () => {
      component.setSubmitting(true);
      expect(component.isSubmitting).toBe(true);

      component.setSubmitting(false);
      expect(component.isSubmitting).toBe(false);
    });
  });

  describe('Rendering', () => {
    it('should display create mode title', () => {
      component.mode = 'create';
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const title = compiled.querySelector('h2');
      expect(title?.textContent).toContain('Apply to Become a Mentor');
    });

    it('should display edit mode title', () => {
      component.mode = 'edit';
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const title = compiled.querySelector('h2');
      expect(title?.textContent).toContain('Edit Mentor Profile');
    });

    it('should render all form fields', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('#bio')).toBeTruthy();
      expect(compiled.querySelector('#expertiseTags')).toBeTruthy();
      expect(compiled.querySelector('#yearsOfExperience')).toBeTruthy();
      expect(compiled.querySelector('#rate30Min')).toBeTruthy();
      expect(compiled.querySelector('#rate60Min')).toBeTruthy();
    });

    it('should render category options', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const categoryButtons = compiled.querySelectorAll('button[type="button"]');
      
      // Should have at least the category buttons
      expect(categoryButtons.length).toBeGreaterThan(0);
    });

    it('should show availability checkbox in edit mode', () => {
      component.mode = 'edit';
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const availabilityCheckbox = compiled.querySelector('input[formControlName="isAvailable"]');
      expect(availabilityCheckbox).toBeTruthy();
    });

    it('should not show availability checkbox in create mode', () => {
      component.mode = 'create';
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const availabilityCheckbox = compiled.querySelector('input[formControlName="isAvailable"]');
      expect(availabilityCheckbox).toBeFalsy();
    });
  });
});
