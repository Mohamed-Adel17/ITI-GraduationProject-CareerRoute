import { Component } from '@angular/core';
import { InfoPageComponent } from './info-page.component';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [InfoPageComponent],
  template: `<app-info-page [title]="title" [sections]="sections" />`
})
export class HelpComponent {
  title = 'Help Center';
  sections = [
    {
      title: 'Getting Started',
      content: [
        'Create an account and verify your email address.',
        'Browse mentors by category or search for specific expertise.',
        'Book a session by selecting an available time slot.',
        'Complete payment to confirm your booking.'
      ]
    },
    {
      title: 'Session FAQs',
      content: [
        'Sessions are conducted via Zoom. You\'ll receive a meeting link via email.',
        'Sessions are automatically recorded and transcribed using AI.',
        'You can access recordings and summaries from your dashboard after the session.'
      ]
    },
    {
      title: 'Payment Issues',
      content: [
        'We accept credit/debit cards, Vodafone Cash, and Orange Money.',
        'If your payment fails, please try again or use a different payment method.',
        'For refund requests, contact support@careerroute.com.'
      ]
    },
    {
      title: 'Need More Help?',
      content: ['Contact us at support@careerroute.com and we\'ll get back to you within 24-48 hours.']
    }
  ];
}
