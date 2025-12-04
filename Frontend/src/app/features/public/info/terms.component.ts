import { Component } from '@angular/core';
import { InfoPageComponent } from './info-page.component';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [InfoPageComponent],
  template: `<app-info-page [title]="title" [sections]="sections" [lastUpdated]="lastUpdated" />`
})
export class TermsComponent {
  title = 'Terms of Service';
  lastUpdated = 'December 2024';
  sections = [
    {
      title: '1. Acceptance of Terms',
      content: ['By accessing and using CareerRoute, you agree to be bound by these Terms of Service and all applicable laws and regulations.']
    },
    {
      title: '2. User Accounts',
      content: [
        'You are responsible for maintaining the confidentiality of your account credentials.',
        'You must provide accurate and complete information when creating an account.'
      ]
    },
    {
      title: '3. Mentorship Sessions',
      content: [
        'Sessions must be booked at least 24 hours in advance.',
        'Cancellations made less than 24 hours before a session may not be eligible for a refund.',
        'Both mentors and mentees are expected to conduct themselves professionally.'
      ]
    },
    {
      title: '4. Payments',
      content: [
        'All payments are processed securely through our payment partners.',
        'A 15% platform fee is applied to mentor earnings.',
        'Refunds are handled on a case-by-case basis.'
      ]
    },
    {
      title: '5. Intellectual Property',
      content: ['Session recordings and AI-generated summaries are owned by the participants and CareerRoute retains a license to store and process this content.']
    }
  ];
}
