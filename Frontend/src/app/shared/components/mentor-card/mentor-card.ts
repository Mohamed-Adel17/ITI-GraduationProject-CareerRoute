import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Mentor, getMentorFullName, getExpertiseTags, getPriceRange } from '../../models/mentor.model';
import { RatingDisplay } from '../rating-display/rating-display';

@Component({
  selector: 'app-mentor-card',
  imports: [CommonModule, RatingDisplay],
  templateUrl: './mentor-card.html',
  styleUrl: './mentor-card.css'
})
export class MentorCard {
  @Input({ required: true }) mentor!: Mentor;
  @Input() maxBioLines: number = 3;
  @Input() showPrice: boolean = true;
  @Input() showSessionCount: boolean = true;

  @Output() mentorClick = new EventEmitter<Mentor>();

  get mentorFullName(): string {
    return getMentorFullName(this.mentor);
  }

  get expertiseTags(): string[] {
    return getExpertiseTags(this.mentor);
  }

  get professionalTitle(): string {
    // Use first expertise tag or years of experience as title
    if (this.expertiseTags.length > 0) {
      return this.expertiseTags[0];
    }

    const years = this.mentor.yearsOfExperience;
    if (years !== null && years > 0) {
      return `${years}+ years experience`;
    }

    return 'Professional Mentor';
  }

  get truncatedBio(): string {
    if (!this.mentor.bio) return 'No bio available';

    // Truncate based on max lines (approximate 100 chars per line)
    const maxChars = this.maxBioLines * 100;
    if (this.mentor.bio.length <= maxChars) {
      return this.mentor.bio;
    }

    return this.mentor.bio.substring(0, maxChars).trim() + '...';
  }

  get priceRange(): string {
    return getPriceRange(this.mentor);
  }

  get avatarUrl(): string {
    return this.mentor.profilePictureUrl || this.getDefaultAvatar();
  }

  get sessionCountText(): string {
    const count = this.mentor.totalSessionsCompleted;
    return `${count} ${count === 1 ? 'session' : 'sessions'}`;
  }

  private getDefaultAvatar(): string {
    // Generate a placeholder avatar with initials
    const initials = this.getInitials();
    // Return a data URL or path to default avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=random`;
  }

  private getInitials(): string {
    const firstName = this.mentor.firstName || '';
    const lastName = this.mentor.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'M';
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
