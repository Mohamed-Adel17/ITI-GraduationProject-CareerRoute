import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeslotService } from '../../../core/services/timeslot.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TimeSlot, CreateTimeSlot, formatSlotTime, formatSlotDuration } from '../../../shared/models/timeslot.model';
import { CreateSlotDialogComponent } from './create-slot-dialog/create-slot-dialog';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  slots: TimeSlot[];
}

@Component({
  selector: 'app-manage-availability',
  standalone: true,
  imports: [CommonModule, CreateSlotDialogComponent],
  templateUrl: './manage-availability.html',
  styleUrl: './manage-availability.css'
})
export class ManageAvailabilityComponent implements OnInit {
  currentDate: Date = new Date();
  currentMonth: number = this.currentDate.getMonth();
  currentYear: number = this.currentDate.getFullYear();
  calendarDays: CalendarDay[] = [];

  timeSlots: TimeSlot[] = [];
  loading: boolean = false;
  error: string = '';

  showCreateDialog: boolean = false;
  creatingSlot: boolean = false;

  selectedSlot: TimeSlot | null = null;
  showDeleteConfirm: boolean = false;
  deletingSlot: boolean = false;

  mentorId: string = '';

  constructor(
    private timeslotService: TimeslotService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.id) {
      this.mentorId = user.id;
      this.loadTimeSlots();
    }
  }

  loadTimeSlots(): void {
    this.loading = true;
    this.error = '';

    // Calculate date range for current month view
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);

    this.timeslotService.getMentorSlots(this.mentorId, {
      startDate: firstDay.toISOString(),
      endDate: lastDay.toISOString(),
      page: 1,
      pageSize: 1000 // Set a large page size to get all slots for the month
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.timeSlots = response.data.timeSlots;
          this.generateCalendar();
        }
        this.loading = false;
      },
      error: (err) => {
        // 404 means no slots found - this is OK, just show empty calendar
        if (err.status === 404) {
          this.timeSlots = [];
          this.generateCalendar();
          this.loading = false;
        } else {
          // Other errors are actual failures
          this.error = 'Failed to load time slots';
          this.notificationService.error('Failed to load your availability');
          this.loading = false;
        }
      }
    });
  }

  generateCalendar(): void {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const firstDayOfWeek = firstDay.getDay();

    this.calendarDays = [];

    // Add previous month's days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(firstDay);
      date.setDate(date.getDate() - i - 1);
      this.calendarDays.push(this.createCalendarDay(date, false));
    }

    // Add current month's days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      this.calendarDays.push(this.createCalendarDay(date, true));
    }

    // Add next month's days to complete the grid
    const remainingDays = 42 - this.calendarDays.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(this.currentYear, this.currentMonth + 1, day);
      this.calendarDays.push(this.createCalendarDay(date, false));
    }
  }

  /**
   * Normalizes a datetime string to ensure it's treated as UTC
   * Backend sometimes returns datetime without 'Z' suffix
   */
  private normalizeUtcDateTime(dateTimeString: string): string {
    if (dateTimeString.endsWith('Z') || dateTimeString.includes('+') || dateTimeString.match(/.*-\d{2}:\d{2}$/)) {
      return dateTimeString;
    }
    return dateTimeString + 'Z';
  }

  createCalendarDay(date: Date, isCurrentMonth: boolean): CalendarDay {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    // Filter slots for this day
    const daySlots = this.timeSlots.filter(slot => {
      // Normalize the datetime string to ensure it's treated as UTC
      const slotDate = new Date(this.normalizeUtcDateTime(slot.startDateTime));
      return slotDate.toDateString() === date.toDateString();
    });

    return {
      date,
      dayNumber: date.getDate(),
      isCurrentMonth,
      isToday,
      slots: daySlots
    };
  }

  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.loadTimeSlots();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.loadTimeSlots();
  }

  getMonthName(): string {
    return new Date(this.currentYear, this.currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  openCreateDialog(): void {
    this.showCreateDialog = true;
  }

  closeCreateDialog(): void {
    this.showCreateDialog = false;
  }

  handleCreateSlot(slot: CreateTimeSlot): void {
    this.creatingSlot = true;

    this.timeslotService.createSlot(this.mentorId, slot).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success('Time slot created successfully');
          this.closeCreateDialog();
          this.loadTimeSlots();
        }
        this.creatingSlot = false;
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Failed to create time slot';
        this.notificationService.error(errorMsg);
        this.creatingSlot = false;
      }
    });
  }

  openDeleteConfirm(slot: TimeSlot): void {
    if (slot.isBooked) {
      this.notificationService.warning('Cannot delete a booked time slot');
      return;
    }
    this.selectedSlot = slot;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.selectedSlot = null;
  }

  confirmDelete(): void {
    if (!this.selectedSlot) return;

    this.deletingSlot = true;

    this.timeslotService.deleteSlot(this.mentorId, this.selectedSlot.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success('Time slot deleted successfully');
          this.closeDeleteConfirm();
          this.loadTimeSlots();
        }
        this.deletingSlot = false;
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Failed to delete time slot';
        this.notificationService.error(errorMsg);
        this.deletingSlot = false;
      }
    });
  }

  formatTime(slot: TimeSlot): string {
    return formatSlotTime(slot);
  }

  formatDuration(minutes: number): string {
    return formatSlotDuration(minutes);
  }

  getSlotStatusClass(slot: TimeSlot): string {
    return slot.isBooked ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700' : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700';
  }

  getSlotStatusText(slot: TimeSlot): string {
    return slot.isBooked ? 'Booked' : 'Available';
  }
}
