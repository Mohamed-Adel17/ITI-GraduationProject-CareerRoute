import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationComponent } from './notification.component';
import { NotificationService, NotificationType, NotificationPosition } from '../../../core/services/notification.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('NotificationComponent', () => {
  let component: NotificationComponent;
  let fixture: ComponentFixture<NotificationComponent>;
  let notificationService: NotificationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationComponent, BrowserAnimationsModule],
      providers: [NotificationService]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationComponent);
    component = fixture.componentInstance;
    notificationService = TestBed.inject(NotificationService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should subscribe to notification service on init', () => {
    expect(component.notifications).toBeDefined();
  });

  it('should receive notifications from service', () => {
    const testMessage = 'Test notification';
    notificationService.success(testMessage);

    expect(component.notifications.length).toBeGreaterThan(0);
    expect(component.notifications[0].message).toBe(testMessage);
  });

  it('should dismiss notification when dismiss is called', () => {
    const id = notificationService.success('Test');
    expect(component.notifications.length).toBe(1);

    component.dismiss(id);
    expect(component.notifications.length).toBe(0);
  });

  it('should get correct CSS class for notification type', () => {
    expect(component.getNotificationClass(NotificationType.Success)).toBe('notification-success');
    expect(component.getNotificationClass(NotificationType.Error)).toBe('notification-error');
    expect(component.getNotificationClass(NotificationType.Warning)).toBe('notification-warning');
    expect(component.getNotificationClass(NotificationType.Info)).toBe('notification-info');
  });

  it('should get correct icon for notification type', () => {
    expect(component.getNotificationIcon(NotificationType.Success)).toBe('bi bi-check-circle-fill');
    expect(component.getNotificationIcon(NotificationType.Error)).toBe('bi bi-exclamation-circle-fill');
    expect(component.getNotificationIcon(NotificationType.Warning)).toBe('bi bi-exclamation-triangle-fill');
    expect(component.getNotificationIcon(NotificationType.Info)).toBe('bi bi-info-circle-fill');
  });

  it('should get correct position class', () => {
    expect(component.getPositionClass(NotificationPosition.TopRight)).toBe('notification-container-top-right');
    expect(component.getPositionClass(NotificationPosition.BottomLeft)).toBe('notification-container-bottom-left');
  });

  it('should group notifications by position', () => {
    notificationService.show({
      type: NotificationType.Success,
      message: 'Top right',
      position: NotificationPosition.TopRight
    });

    notificationService.show({
      type: NotificationType.Info,
      message: 'Bottom left',
      position: NotificationPosition.BottomLeft
    });

    const grouped = component.getNotificationsByPosition();
    expect(grouped.size).toBe(2);
    expect(grouped.get(NotificationPosition.TopRight)?.length).toBe(1);
    expect(grouped.get(NotificationPosition.BottomLeft)?.length).toBe(1);
  });

  it('should unsubscribe on destroy', () => {
    const subscription = component['subscription'];
    expect(subscription).toBeDefined();

    component.ngOnDestroy();
    expect(subscription?.closed).toBe(true);
  });
});
