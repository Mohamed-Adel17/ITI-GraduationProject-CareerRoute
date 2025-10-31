import { TestBed } from '@angular/core/testing';
import { NotificationService, NotificationType, NotificationPosition } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationService]
    });
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    // Clean up any remaining notifications
    service.dismissAll();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have empty notifications on initialization', () => {
      expect(service.getCount()).toBe(0);
      expect(service.getNotifications()).toEqual([]);
    });

    it('should have notifications$ observable', (done) => {
      service.notifications$.subscribe(notifications => {
        expect(notifications).toEqual([]);
        done();
      });
    });
  });

  describe('Configuration', () => {
    it('should allow configuration updates', () => {
      service.configure({
        duration: 10000,
        position: NotificationPosition.BottomLeft,
        dismissible: false,
        maxNotifications: 10
      });

      const id = service.success('Test message');
      const notifications = service.getNotifications();

      expect(notifications[0].duration).toBe(10000);
      expect(notifications[0].position).toBe(NotificationPosition.BottomLeft);
      expect(notifications[0].dismissible).toBe(false);
    });
  });

  describe('Success Notifications', () => {
    it('should create a success notification', (done) => {
      const message = 'Operation successful';

      service.notifications$.subscribe(notifications => {
        if (notifications.length > 0) {
          expect(notifications[0].type).toBe(NotificationType.Success);
          expect(notifications[0].message).toBe(message);
          expect(notifications[0].title).toBe('Success');
          done();
        }
      });

      service.success(message);
    });

    it('should create success notification with custom title', () => {
      const message = 'Profile saved';
      const title = 'Profile Update';

      service.success(message, title);
      const notifications = service.getNotifications();

      expect(notifications[0].title).toBe(title);
      expect(notifications[0].message).toBe(message);
    });

    it('should create success notification with custom duration', () => {
      const message = 'Quick success';
      const duration = 1000;

      service.success(message, undefined, duration);
      const notifications = service.getNotifications();

      expect(notifications[0].duration).toBe(duration);
    });

    it('should return notification ID', () => {
      const id = service.success('Test');
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
    });
  });

  describe('Error Notifications', () => {
    it('should create an error notification', () => {
      const message = 'Operation failed';

      service.error(message);
      const notifications = service.getNotifications();

      expect(notifications[0].type).toBe(NotificationType.Error);
      expect(notifications[0].message).toBe(message);
      expect(notifications[0].title).toBe('Error');
    });

    it('should create error notification with custom title', () => {
      const message = 'Invalid credentials';
      const title = 'Login Failed';

      service.error(message, title);
      const notifications = service.getNotifications();

      expect(notifications[0].title).toBe(title);
    });
  });

  describe('Warning Notifications', () => {
    it('should create a warning notification', () => {
      const message = 'Unsaved changes';

      service.warning(message);
      const notifications = service.getNotifications();

      expect(notifications[0].type).toBe(NotificationType.Warning);
      expect(notifications[0].message).toBe(message);
      expect(notifications[0].title).toBe('Warning');
    });
  });

  describe('Info Notifications', () => {
    it('should create an info notification', () => {
      const message = 'New features available';

      service.info(message);
      const notifications = service.getNotifications();

      expect(notifications[0].type).toBe(NotificationType.Info);
      expect(notifications[0].message).toBe(message);
      expect(notifications[0].title).toBe('Info');
    });
  });

  describe('Custom Notifications', () => {
    it('should create a custom notification with all options', () => {
      const options = {
        type: NotificationType.Warning,
        message: 'Custom notification',
        title: 'Custom Title',
        duration: 8000,
        position: NotificationPosition.BottomCenter,
        dismissible: false
      };

      service.show(options);
      const notifications = service.getNotifications();

      expect(notifications[0].type).toBe(options.type);
      expect(notifications[0].message).toBe(options.message);
      expect(notifications[0].title).toBe(options.title);
      expect(notifications[0].duration).toBe(options.duration);
      expect(notifications[0].position).toBe(options.position);
      expect(notifications[0].dismissible).toBe(options.dismissible);
    });

    it('should assign unique IDs to notifications', () => {
      const id1 = service.success('Message 1');
      const id2 = service.success('Message 2');

      expect(id1).not.toBe(id2);
    });

    it('should include timestamp', () => {
      const beforeTime = new Date();
      service.success('Test');
      const afterTime = new Date();

      const notifications = service.getNotifications();
      const timestamp = notifications[0].timestamp;

      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('Dismissal', () => {
    it('should dismiss notification by ID', () => {
      const id = service.success('Test message');
      expect(service.getCount()).toBe(1);

      service.dismiss(id);
      expect(service.getCount()).toBe(0);
    });

    it('should dismiss specific notification without affecting others', () => {
      const id1 = service.success('Message 1');
      const id2 = service.success('Message 2');
      const id3 = service.success('Message 3');

      expect(service.getCount()).toBe(3);

      service.dismiss(id2);
      expect(service.getCount()).toBe(2);

      const notifications = service.getNotifications();
      expect(notifications.find(n => n.id === id1)).toBeTruthy();
      expect(notifications.find(n => n.id === id2)).toBeUndefined();
      expect(notifications.find(n => n.id === id3)).toBeTruthy();
    });

    it('should dismiss all notifications', () => {
      service.success('Message 1');
      service.error('Message 2');
      service.warning('Message 3');

      expect(service.getCount()).toBe(3);

      service.dismissAll();
      expect(service.getCount()).toBe(0);
    });

    it('should handle dismissing non-existent notification gracefully', () => {
      service.success('Test');
      expect(service.getCount()).toBe(1);

      service.dismiss('non-existent-id');
      expect(service.getCount()).toBe(1); // Should still have the original notification
    });
  });

  describe('Auto-Dismissal', () => {
    it('should auto-dismiss notification after duration', (done) => {
      const duration = 100;
      service.success('Test message', undefined, duration);

      expect(service.getCount()).toBe(1);

      setTimeout(() => {
        expect(service.getCount()).toBe(0);
        done();
      }, duration + 50);
    });

    it('should not auto-dismiss when duration is 0', (done) => {
      service.show({
        type: NotificationType.Info,
        message: 'Persistent message',
        duration: 0
      });

      expect(service.getCount()).toBe(1);

      setTimeout(() => {
        expect(service.getCount()).toBe(1); // Should still be present
        done();
      }, 200);
    });

    it('should handle multiple notifications with different durations', (done) => {
      service.success('Quick', undefined, 100);
      service.success('Slow', undefined, 300);

      expect(service.getCount()).toBe(2);

      setTimeout(() => {
        expect(service.getCount()).toBe(1); // First should be dismissed
      }, 150);

      setTimeout(() => {
        expect(service.getCount()).toBe(0); // Both should be dismissed
        done();
      }, 350);
    });
  });

  describe('Max Notifications Limit', () => {
    it('should enforce max notifications limit', () => {
      service.configure({ maxNotifications: 3 });

      service.success('Message 1');
      service.success('Message 2');
      service.success('Message 3');
      service.success('Message 4');

      expect(service.getCount()).toBe(3);
    });

    it('should remove oldest notification when limit exceeded', () => {
      service.configure({ maxNotifications: 2 });

      const id1 = service.success('Message 1');
      const id2 = service.success('Message 2');
      const id3 = service.success('Message 3');

      expect(service.getCount()).toBe(2);

      const notifications = service.getNotifications();
      expect(notifications.find(n => n.id === id1)).toBeUndefined(); // First removed
      expect(notifications.find(n => n.id === id2)).toBeTruthy();
      expect(notifications.find(n => n.id === id3)).toBeTruthy();
    });
  });

  describe('Observable Stream', () => {
    it('should emit new notifications', (done) => {
      const emissions: any[] = [];

      service.notifications$.subscribe(notifications => {
        emissions.push([...notifications]);
        if (emissions.length === 3) {
          expect(emissions[0]).toEqual([]); // Initial empty state
          expect(emissions[1].length).toBe(1); // After first notification
          expect(emissions[2].length).toBe(2); // After second notification
          done();
        }
      });

      service.success('First');
      service.error('Second');
    });

    it('should emit when notification is dismissed', (done) => {
      const emissions: any[] = [];

      service.notifications$.subscribe(notifications => {
        emissions.push(notifications.length);
      });

      const id = service.success('Test');

      setTimeout(() => {
        service.dismiss(id);

        setTimeout(() => {
          expect(emissions).toEqual([0, 1, 0]);
          done();
        }, 10);
      }, 10);
    });
  });

  describe('Helper Methods', () => {
    it('should return correct notification count', () => {
      expect(service.getCount()).toBe(0);

      service.success('Test 1');
      expect(service.getCount()).toBe(1);

      service.error('Test 2');
      expect(service.getCount()).toBe(2);

      service.dismissAll();
      expect(service.getCount()).toBe(0);
    });

    it('should return all notifications', () => {
      service.success('Success message');
      service.error('Error message');

      const notifications = service.getNotifications();

      expect(notifications.length).toBe(2);
      expect(notifications[0].message).toBe('Success message');
      expect(notifications[1].message).toBe('Error message');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      service.success('');
      const notifications = service.getNotifications();

      expect(notifications[0].message).toBe('');
      expect(notifications.length).toBe(1);
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      service.success(longMessage);

      const notifications = service.getNotifications();
      expect(notifications[0].message).toBe(longMessage);
    });

    it('should handle special characters in messages', () => {
      const specialMessage = '<script>alert("XSS")</script>';
      service.success(specialMessage);

      const notifications = service.getNotifications();
      expect(notifications[0].message).toBe(specialMessage);
      // Note: XSS prevention should be handled in the component template
    });

    it('should handle rapid consecutive notifications', () => {
      for (let i = 0; i < 100; i++) {
        service.success(`Message ${i}`);
      }

      const count = service.getCount();
      expect(count).toBeLessThanOrEqual(5); // Default max is 5
    });
  });
});
