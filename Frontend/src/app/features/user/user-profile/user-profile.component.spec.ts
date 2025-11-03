import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { UserProfileComponent } from './user-profile.component';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { User, UserRole } from '../../../shared/models/user.model';

describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

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
    mockUserService = jasmine.createSpyObj('UserService', ['getUserProfile']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    mockNotificationService = jasmine.createSpyObj('NotificationService', ['error', 'success']);

    await TestBed.configureTestingModule({
      imports: [UserProfileComponent, RouterTestingModule],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user profile on init', () => {
    mockAuthService.getCurrentUser.and.returnValue({ id: '123' } as any);
    mockUserService.getUserProfile.and.returnValue(of(mockUser));

    fixture.detectChanges();

    expect(mockUserService.getUserProfile).toHaveBeenCalledWith('123');
    expect(component.user).toEqual(mockUser);
    expect(component.loading).toBe(false);
  });

  it('should handle error when loading profile fails', () => {
    mockAuthService.getCurrentUser.and.returnValue({ id: '123' } as any);
    mockUserService.getUserProfile.and.returnValue(throwError(() => new Error('API Error')));

    fixture.detectChanges();

    expect(component.error).toBe('Failed to load profile');
    expect(component.loading).toBe(false);
    expect(mockNotificationService.error).toHaveBeenCalled();
  });

  it('should return full name correctly', () => {
    component.user = mockUser;
    expect(component.getUserFullName()).toBe('John Doe');
  });

  it('should return initials correctly', () => {
    component.user = mockUser;
    expect(component.getUserInitials()).toBe('JD');
  });

  it('should check if user has profile picture', () => {
    component.user = mockUser;
    expect(component.hasProfilePicture()).toBe(true);

    component.user = { ...mockUser, profilePictureUrl: undefined };
    expect(component.hasProfilePicture()).toBe(false);
  });

  it('should check if user has career interests', () => {
    component.user = mockUser;
    expect(component.hasCareerInterests()).toBe(true);

    component.user = { ...mockUser, careerInterests: [] };
    expect(component.hasCareerInterests()).toBe(false);
  });

  it('should format registration date correctly', () => {
    component.user = mockUser;
    const formatted = component.getRegistrationDate();
    expect(formatted).toContain('2024');
    expect(formatted).toContain('January');
  });

  it('should refresh profile when refreshProfile is called', () => {
    mockAuthService.getCurrentUser.and.returnValue({ id: '123' } as any);
    mockUserService.getUserProfile.and.returnValue(of(mockUser));

    component.refreshProfile();

    expect(mockUserService.getUserProfile).toHaveBeenCalled();
  });
});
