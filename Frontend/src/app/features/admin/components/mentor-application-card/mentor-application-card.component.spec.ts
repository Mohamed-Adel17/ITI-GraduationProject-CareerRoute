import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MentorApplicationCardComponent } from './mentor-application-card.component';
import { MentorListItem } from '../../../../shared/models/mentor.model';

describe('MentorApplicationCardComponent', () => {
  let component: MentorApplicationCardComponent;
  let fixture: ComponentFixture<MentorApplicationCardComponent>;

  const mockApplication: MentorListItem = {
    id: 'mentor-1',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    email: 'john@example.com',
    profilePictureUrl: 'https://example.com/profile.jpg',
    bio: 'Experienced mentor with 10 years in software development. I specialize in React, Node.js, and cloud architecture. I have helped 50+ developers transition to senior roles.',
    expertiseTags: [
      { id: 1, name: 'React', categoryId: 1, categoryName: 'IT Careers', isActive: true },
      { id: 2, name: 'Node.js', categoryId: 1, categoryName: 'IT Careers', isActive: true }
    ],
    yearsOfExperience: 10,
    certifications: 'AWS Certified Solutions Architect',
    rate30Min: 50,
    rate60Min: 90,
    averageRating: 0,
    totalReviews: 0,
    totalSessionsCompleted: 0,
    isVerified: false,
    approvalStatus: 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: null,
    categories: [
      { id: 1, name: 'IT Careers', description: 'Tech career guidance', iconUrl: null, isActive: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: null }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MentorApplicationCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MentorApplicationCardComponent);
    component = fixture.componentInstance;
    component.application = mockApplication;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Bio truncation', () => {
    it('should truncate long bio', () => {
      expect(component.shouldTruncateBio).toBe(true);
      expect(component.truncatedBio.length).toBeLessThan(component.application.bio!.length);
      expect(component.truncatedBio).toContain('...');
    });

    it('should not truncate short bio', () => {
      component.application.bio = 'Short bio';
      expect(component.shouldTruncateBio).toBe(false);
      expect(component.truncatedBio).toBe('Short bio');
    });

    it('should toggle bio expansion', () => {
      expect(component.isBioExpanded).toBe(false);
      component.toggleBio();
      expect(component.isBioExpanded).toBe(true);
      component.toggleBio();
      expect(component.isBioExpanded).toBe(false);
    });
  });

  describe('Profile picture', () => {
    it('should return provided profile picture URL', () => {
      expect(component.profilePictureUrl).toBe('https://example.com/profile.jpg');
    });

    it('should return default avatar if no URL provided', () => {
      component.application.profilePictureUrl = null;
      expect(component.profilePictureUrl).toBe('assets/images/default-avatar.png');
    });
  });

  describe('Experience text', () => {
    it('should format years correctly (plural)', () => {
      component.application.yearsOfExperience = 10;
      expect(component.experienceText).toBe('10 years');
    });

    it('should format years correctly (singular)', () => {
      component.application.yearsOfExperience = 1;
      expect(component.experienceText).toBe('1 year');
    });

    it('should handle zero years', () => {
      component.application.yearsOfExperience = 0;
      expect(component.experienceText).toBe('Less than 1 year');
    });
  });

  describe('Application date', () => {
    it('should return "Today" for today\'s application', () => {
      component.application.createdAt = new Date().toISOString();
      expect(component.applicationDate).toBe('Today');
    });

    it('should return "Yesterday" for yesterday\'s application', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      component.application.createdAt = yesterday.toISOString();
      expect(component.applicationDate).toBe('Yesterday');
    });

    it('should return days ago for recent applications', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      component.application.createdAt = threeDaysAgo.toISOString();
      expect(component.applicationDate).toBe('3 days ago');
    });

    it('should return formatted date for old applications', () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      component.application.createdAt = tenDaysAgo.toISOString();
      expect(component.applicationDate).toBe(tenDaysAgo.toLocaleDateString());
    });

    it('should return "Unknown" for missing date', () => {
      component.application.createdAt = null as any;
      expect(component.applicationDate).toBe('Unknown');
    });
  });

  describe('Event emitters', () => {
    it('should emit approve event with mentor ID', () => {
      spyOn(component.approve, 'emit');
      component.onApproveClick();
      expect(component.approve.emit).toHaveBeenCalledWith('mentor-1');
    });

    it('should emit reject event with mentor ID', () => {
      spyOn(component.reject, 'emit');
      component.onRejectClick();
      expect(component.reject.emit).toHaveBeenCalledWith('mentor-1');
    });
  });
});
