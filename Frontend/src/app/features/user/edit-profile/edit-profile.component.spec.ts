import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { EditProfileComponent } from './edit-profile.component';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { User, UserRole } from '../../../shared/models/user.model';

describe('EditProfileComponent', () => {
  let component: EditProfileComponent;
  let fixture: ComponentFixture<EditProfileComponent>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let router: Router;

  const mockUser: User = {
    id: '123',
    email: 'test@example.com',
    emailConfirmed: true,
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+1234567890',
    profilePictureUrl: 'https://example.com/avatar.jpg',
    careerInterests: ['Software Development', 'Data Science'],
    careerGoals: 'Become a senior developer',
    registrationDate: new Date('2024-01-01'),
    isActive: true,
    roles: [UserRole.User],
    isMentor: false
  };

  beforeEach(async () => {
    mockUserService = jasmine.createSpyObj('UserService', ['getUserProfile', 'updateUserProfile']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    mockNotificationService = jasmine.createSpyObj('NotificationService', ['error', 'success', 'warning']);

    await TestBed.configureTestingModule({
      imports: [EditProfileComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditProfileComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form on init', () => {
    mockAuthService.getCurrentUser.and.returnValue({ id: '123' } as any);
    mockUserService.getUserProfile.and.returnValue(of(mockUser));

    fixture.detectChanges();

    expect(component.profileForm).toBeDefined();
    expect(component.profileForm.get('firstName')).toBeDefined();
    expect(component.profileForm.get('lastName')).toBeDefined();
  });

  it('should populate form with user data', () => {
    mockAuthService.getCurrentUser.and.returnValue({ id: '123' } as any);
    mockUserService.getUserProfile.and.returnValue(of(mockUser));

    fixture.detectChanges();

    expect(component.profileForm.get('firstName')?.value).toBe('John');
    expect(component.profileForm.get('lastName')?.value).toBe('Doe');
    expect(component.selectedInterests.size).toBe(2);
    expect(component.selectedInterests.has('Software Development')).toBe(true);
  });

  it('should toggle career interest selection', () => {
    component.toggleInterest('Software Development');
    expect(component.isInterestSelected('Software Development')).toBe(true);

    component.toggleInterest('Software Development');
    expect(component.isInterestSelected('Software Development')).toBe(false);
  });

  it('should validate required fields', () => {
    mockAuthService.getCurrentUser.and.returnValue({ id: '123' } as any);
    mockUserService.getUserProfile.and.returnValue(of(mockUser));

    fixture.detectChanges();

    const firstNameControl = component.profileForm.get('firstName');
    firstNameControl?.setValue('');
    expect(firstNameControl?.hasError('required')).toBe(true);

    firstNameControl?.setValue('J');
    expect(firstNameControl?.hasError('minlength')).toBe(true);

    firstNameControl?.setValue('John');
    expect(firstNameControl?.valid).toBe(true);
  });

  it('should submit form with valid data', () => {
    mockAuthService.getCurrentUser.and.returnValue({ id: '123' } as any);
    mockUserService.getUserProfile.and.returnValue(of(mockUser));
    mockUserService.updateUserProfile.and.returnValue(of(mockUser));

    fixture.detectChanges();

    spyOn(router, 'navigate');
    component.onSubmit();

    expect(mockUserService.updateUserProfile).toHaveBeenCalled();
  });

  it('should not submit form with invalid data', () => {
    mockAuthService.getCurrentUser.and.returnValue({ id: '123' } as any);
    mockUserService.getUserProfile.and.returnValue(of(mockUser));

    fixture.detectChanges();

    component.profileForm.get('firstName')?.setValue('');
    component.onSubmit();

    expect(mockUserService.updateUserProfile).not.toHaveBeenCalled();
    expect(mockNotificationService.warning).toHaveBeenCalled();
  });

  it('should handle update error', () => {
    mockAuthService.getCurrentUser.and.returnValue({ id: '123' } as any);
    mockUserService.getUserProfile.and.returnValue(of(mockUser));
    mockUserService.updateUserProfile.and.returnValue(throwError(() => new Error('API Error')));

    fixture.detectChanges();

    component.onSubmit();

    expect(mockNotificationService.error).toHaveBeenCalled();
    expect(component.saving).toBe(false);
  });

  it('should cancel with confirmation if form is dirty', () => {
    mockAuthService.getCurrentUser.and.returnValue({ id: '123' } as any);
    mockUserService.getUserProfile.and.returnValue(of(mockUser));

    fixture.detectChanges();

    component.profileForm.markAsDirty();
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(router, 'navigate');

    component.onCancel();

    expect(window.confirm).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/user/profile']);
  });

  it('should reset form to original values', () => {
    mockAuthService.getCurrentUser.and.returnValue({ id: '123' } as any);
    mockUserService.getUserProfile.and.returnValue(of(mockUser));

    fixture.detectChanges();

    component.profileForm.get('firstName')?.setValue('Changed');
    spyOn(window, 'confirm').and.returnValue(true);

    component.onReset();

    expect(component.profileForm.get('firstName')?.value).toBe('John');
  });
});
