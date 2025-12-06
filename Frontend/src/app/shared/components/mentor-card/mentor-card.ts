import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Mentor, getMentorFullName, getExpertiseTags, getPriceRange } from '../../models/mentor.model';

@Component({
  selector: 'app-mentor-card',
  imports: [CommonModule],
  templateUrl: './mentor-card.html',
  styleUrl: './mentor-card.css'
})
export class MentorCard implements AfterViewInit {
  @Input({ required: true }) mentor!: Mentor;
  @Input() maxBioLines: number = 2;
  @Input() showPrice: boolean = true;
  @Input() showSessionCount: boolean = true;

  @Output() mentorClick = new EventEmitter<Mentor>();

  @ViewChild('tagsContainer') tagsContainer!: ElementRef<HTMLDivElement>;

  visibleTagCount = 3;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.calculateVisibleTags(), 0);
  }

  private calculateVisibleTags(): void {
    const container = this.tagsContainer?.nativeElement;
    if (!container) return;

    const tags = container.querySelectorAll('.tag');
    const counterEl = container.querySelector('.tag-counter') as HTMLElement;
    const containerWidth = container.offsetWidth;
    const counterWidth = 45; // reserve space for +N
    
    // First pass: show all, measure
    tags.forEach((tag: Element) => {
      (tag as HTMLElement).style.display = 'inline-flex';
    });

    let usedWidth = 0;
    let count = 0;
    const totalTags = this.expertiseTags.length;

    tags.forEach((tag: Element, i: number) => {
      const tagEl = tag as HTMLElement;
      const tagWidth = tagEl.offsetWidth + 6; // include gap
      const needsCounter = (i < totalTags - 1);
      const availableWidth = containerWidth - (needsCounter ? counterWidth : 0);
      
      if (usedWidth + tagWidth <= availableWidth) {
        usedWidth += tagWidth;
        count++;
      } else {
        tagEl.style.display = 'none';
      }
    });

    this.visibleTagCount = count;
    this.cdr.detectChanges();
  }

  get hiddenCount(): number {
    return Math.max(0, this.expertiseTags.length - this.visibleTagCount);
  }

  get mentorFullName(): string {
    return getMentorFullName(this.mentor);
  }

  get expertiseTags(): string[] {
    return getExpertiseTags(this.mentor);
  }

  get initials(): string {
    const firstName = this.mentor.firstName || '';
    const lastName = this.mentor.lastName || '';
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return firstName.substring(0, 2).toUpperCase() || 'M';
  }

  get placeholderImage(): string {
    const hash = this.mentor.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `https://xsgames.co/randomusers/avatar.php?g=pixel&key=${hash}`;
  }

  get avatarGradient(): string {
    const gradients = [
      'from-indigo-500 to-purple-600',
      'from-pink-500 to-rose-500',
      'from-cyan-500 to-blue-500',
      'from-emerald-500 to-teal-500',
      'from-orange-500 to-amber-500',
      'from-violet-500 to-purple-500',
      'from-blue-500 to-indigo-500',
      'from-teal-500 to-cyan-500',
    ];
    const hash = (this.mentor.firstName + this.mentor.lastName).split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  }

  get expertiseText(): string {
    if (this.expertiseTags.length === 0) return 'Professional Mentor';
    return this.expertiseTags.slice(0, 3).join(' • ');
  }

  get experienceText(): string {
    const years = this.mentor.yearsOfExperience;
    if (!years || years === 0) return 'New mentor';
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }

  get truncatedBio(): string {
    if (!this.mentor.bio) return 'No bio available';
    const maxChars = this.maxBioLines * 80;
    if (this.mentor.bio.length <= maxChars) return this.mentor.bio;
    return this.mentor.bio.substring(0, maxChars).trim() + '...';
  }

  get priceRange(): string {
    return getPriceRange(this.mentor);
  }

  onCardClick(): void {
    this.mentorClick.emit(this.mentor);
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onCardClick();
    }
  }
}
