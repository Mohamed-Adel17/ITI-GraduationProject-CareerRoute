import { Component } from '@angular/core';
import { InfoPageComponent } from './info-page.component';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [InfoPageComponent],
  template: `<app-info-page [title]="title" [sections]="sections" [lastUpdated]="lastUpdated" />`
})
export class PrivacyComponent {
  title = 'Privacy Policy';
  lastUpdated = 'December 2024';
  sections = [
    {
      title: 'Information We Collect',
      content: [
        'Account information: name, email, phone number.',
        'Session data: recordings, transcripts, and AI-generated summaries.',
        'Payment information: processed securely by our payment partners.'
      ]
    },
    {
      title: 'How We Use Your Information',
      content: [
        'To provide and improve our mentorship services.',
        'To process payments and communicate with you.',
        'To generate AI transcripts and summaries of your sessions.'
      ]
    },
    {
      title: 'Data Security',
      content: ['We implement industry-standard security measures to protect your personal information. Session recordings are stored securely in encrypted cloud storage.']
    },
    {
      title: 'Your Rights',
      content: ['You can request access to, correction of, or deletion of your personal data by contacting us at support@careerroute.com.']
    }
  ];
}
