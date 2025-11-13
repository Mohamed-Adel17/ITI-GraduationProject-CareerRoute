import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;
  let compiled: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
    compiled = fixture.debugElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Pagination Calculation', () => {
    it('should calculate total pages correctly', () => {
      component.totalItems = 100;
      component.pageSize = 10;
      component.ngOnChanges({});
      expect(component.totalPages).toBe(10);
    });

    it('should handle non-divisible total items', () => {
      component.totalItems = 95;
      component.pageSize = 10;
      component.ngOnChanges({});
      expect(component.totalPages).toBe(10);
    });

    it('should calculate start and end items correctly', () => {
      component.totalItems = 100;
      component.pageSize = 10;
      component.currentPage = 2;
      component.ngOnChanges({});
      expect(component.startItem).toBe(11);
      expect(component.endItem).toBe(20);
    });

    it('should handle last page with fewer items', () => {
      component.totalItems = 95;
      component.pageSize = 10;
      component.currentPage = 10;
      component.ngOnChanges({});
      expect(component.startItem).toBe(91);
      expect(component.endItem).toBe(95);
    });

    it('should handle zero items', () => {
      component.totalItems = 0;
      component.pageSize = 10;
      component.currentPage = 1;
      component.ngOnChanges({});
      expect(component.totalPages).toBe(0);
      expect(component.startItem).toBe(0);
      expect(component.endItem).toBe(0);
    });
  });

  describe('Visible Pages Calculation', () => {
    it('should show all pages when total is small', () => {
      component.totalItems = 50;
      component.pageSize = 10;
      component.currentPage = 1;
      component.maxVisiblePages = 5;
      component.ngOnChanges({});
      expect(component.visiblePages).toEqual([1, 2, 3, 4, 5]);
    });

    it('should show ellipsis for large page counts', () => {
      component.totalItems = 200;
      component.pageSize = 10;
      component.currentPage = 1;
      component.maxVisiblePages = 5;
      component.ngOnChanges({});
      expect(component.visiblePages).toContain('...');
      expect(component.visiblePages[0]).toBe(1);
      expect(component.visiblePages[component.visiblePages.length - 1]).toBe(20);
    });

    it('should show pages around current page', () => {
      component.totalItems = 200;
      component.pageSize = 10;
      component.currentPage = 10;
      component.maxVisiblePages = 5;
      component.ngOnChanges({});
      expect(component.visiblePages).toContain(10);
      expect(component.visiblePages).toContain(1);
      expect(component.visiblePages).toContain(20);
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      component.totalItems = 100;
      component.pageSize = 10;
      component.currentPage = 5;
      component.ngOnChanges({});
    });

    it('should navigate to next page', () => {
      spyOn(component.pageChange, 'emit');
      component.nextPage();
      expect(component.currentPage).toBe(6);
      expect(component.pageChange.emit).toHaveBeenCalledWith(6);
    });

    it('should navigate to previous page', () => {
      spyOn(component.pageChange, 'emit');
      component.previousPage();
      expect(component.currentPage).toBe(4);
      expect(component.pageChange.emit).toHaveBeenCalledWith(4);
    });

    it('should navigate to specific page', () => {
      spyOn(component.pageChange, 'emit');
      component.goToPage(8);
      expect(component.currentPage).toBe(8);
      expect(component.pageChange.emit).toHaveBeenCalledWith(8);
    });

    it('should not navigate beyond last page', () => {
      component.currentPage = 10;
      component.ngOnChanges({});
      const initialPage = component.currentPage;
      component.nextPage();
      expect(component.currentPage).toBe(initialPage);
    });

    it('should not navigate before first page', () => {
      component.currentPage = 1;
      component.ngOnChanges({});
      const initialPage = component.currentPage;
      component.previousPage();
      expect(component.currentPage).toBe(initialPage);
    });

    it('should not navigate to invalid page', () => {
      spyOn(component.pageChange, 'emit');
      component.goToPage(0);
      expect(component.pageChange.emit).not.toHaveBeenCalled();
      component.goToPage(100);
      expect(component.pageChange.emit).not.toHaveBeenCalled();
    });
  });

  describe('Page Size Change', () => {
    beforeEach(() => {
      component.totalItems = 100;
      component.pageSize = 10;
      component.currentPage = 3;
      component.ngOnChanges({});
    });

    it('should emit page size change event', () => {
      spyOn(component.pageSizeChange, 'emit');
      const event = { target: { value: '20' } } as any;
      component.onPageSizeChange(event);
      expect(component.pageSizeChange.emit).toHaveBeenCalledWith(20);
    });

    it('should adjust current page when page size increases', () => {
      // Currently on page 3 (items 21-30)
      // After changing to pageSize 20, should be on page 2 (items 21-40)
      spyOn(component.pageChange, 'emit');
      const event = { target: { value: '20' } } as any;
      component.onPageSizeChange(event);
      expect(component.currentPage).toBe(2);
      expect(component.pageChange.emit).toHaveBeenCalledWith(2);
    });

    it('should adjust current page when page size decreases', () => {
      component.currentPage = 2;
      component.pageSize = 20;
      component.ngOnChanges({});
      // Currently on page 2 (items 21-40)
      // After changing to pageSize 10, should be on page 3 (items 21-30)
      spyOn(component.pageChange, 'emit');
      const event = { target: { value: '10' } } as any;
      component.onPageSizeChange(event);
      expect(component.currentPage).toBe(3);
    });
  });

  describe('Helper Methods', () => {
    beforeEach(() => {
      component.totalItems = 100;
      component.pageSize = 10;
      component.currentPage = 5;
      component.ngOnChanges({});
    });

    it('should check if has previous page', () => {
      expect(component.hasPreviousPage()).toBe(true);
      component.currentPage = 1;
      component.ngOnChanges({});
      expect(component.hasPreviousPage()).toBe(false);
    });

    it('should check if has next page', () => {
      expect(component.hasNextPage()).toBe(true);
      component.currentPage = 10;
      component.ngOnChanges({});
      expect(component.hasNextPage()).toBe(false);
    });

    it('should identify current page', () => {
      expect(component.isCurrentPage(5)).toBe(true);
      expect(component.isCurrentPage(3)).toBe(false);
      expect(component.isCurrentPage('...')).toBe(false);
    });

    it('should identify ellipsis', () => {
      expect(component.isEllipsis('...')).toBe(true);
      expect(component.isEllipsis(5)).toBe(false);
    });

    it('should track by page correctly', () => {
      expect(component.trackByPage(0, 1)).toBe(1);
      expect(component.trackByPage(0, '...')).toBe('ellipsis-0');
    });
  });

  describe('Template Rendering', () => {
    it('should render pagination controls when totalPages > 1', () => {
      component.totalItems = 100;
      component.pageSize = 10;
      component.currentPage = 1;
      component.ngOnChanges({});
      fixture.detectChanges();

      const nav = compiled.query(By.css('nav[aria-label="Pagination"]'));
      expect(nav).toBeTruthy();
    });

    it('should not render pagination controls when totalPages <= 1', () => {
      component.totalItems = 5;
      component.pageSize = 10;
      component.currentPage = 1;
      component.ngOnChanges({});
      fixture.detectChanges();

      const nav = compiled.query(By.css('nav[aria-label="Pagination"]'));
      expect(nav).toBeFalsy();
    });

    it('should show items info', () => {
      component.totalItems = 100;
      component.pageSize = 10;
      component.currentPage = 2;
      component.ngOnChanges({});
      fixture.detectChanges();

      const infoText = compiled.nativeElement.textContent;
      expect(infoText).toContain('Showing');
      expect(infoText).toContain('11');
      expect(infoText).toContain('20');
      expect(infoText).toContain('100');
    });

    it('should show page size selector when enabled', () => {
      component.totalItems = 100;
      component.pageSize = 10;
      component.showPageSizeSelector = true;
      component.ngOnChanges({});
      fixture.detectChanges();

      const select = compiled.query(By.css('select#page-size-select'));
      expect(select).toBeTruthy();
    });

    it('should hide page size selector when disabled', () => {
      component.totalItems = 100;
      component.pageSize = 10;
      component.showPageSizeSelector = false;
      component.ngOnChanges({});
      fixture.detectChanges();

      const select = compiled.query(By.css('select#page-size-select'));
      expect(select).toBeFalsy();
    });

    it('should disable previous button on first page', () => {
      component.totalItems = 100;
      component.pageSize = 10;
      component.currentPage = 1;
      component.ngOnChanges({});
      fixture.detectChanges();

      const buttons = compiled.queryAll(By.css('button'));
      const prevButton = buttons[0];
      expect(prevButton.nativeElement.disabled).toBe(true);
    });

    it('should disable next button on last page', () => {
      component.totalItems = 100;
      component.pageSize = 10;
      component.currentPage = 10;
      component.ngOnChanges({});
      fixture.detectChanges();

      const buttons = compiled.queryAll(By.css('button'));
      const nextButton = buttons[buttons.length - 1];
      expect(nextButton.nativeElement.disabled).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single item', () => {
      component.totalItems = 1;
      component.pageSize = 10;
      component.currentPage = 1;
      component.ngOnChanges({});
      expect(component.totalPages).toBe(1);
      expect(component.startItem).toBe(1);
      expect(component.endItem).toBe(1);
    });

    it('should handle page size larger than total items', () => {
      component.totalItems = 5;
      component.pageSize = 100;
      component.currentPage = 1;
      component.ngOnChanges({});
      expect(component.totalPages).toBe(1);
      expect(component.startItem).toBe(1);
      expect(component.endItem).toBe(5);
    });

    it('should correct invalid current page', () => {
      component.totalItems = 100;
      component.pageSize = 10;
      component.currentPage = 50; // Invalid, should be max 10
      component.ngOnChanges({});
      expect(component.currentPage).toBe(10);
    });

    it('should handle negative current page', () => {
      component.totalItems = 100;
      component.pageSize = 10;
      component.currentPage = -1;
      component.ngOnChanges({});
      expect(component.currentPage).toBe(1);
    });
  });
});
