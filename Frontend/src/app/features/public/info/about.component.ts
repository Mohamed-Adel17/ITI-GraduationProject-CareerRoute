import { Component } from '@angular/core';
import { InfoPageComponent } from './info-page.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [InfoPageComponent],
  template: `<app-info-page [title]="title" [sections]="sections" />`
})
export class AboutComponent {
  title = 'About CareerRoute';
  sections = [
    {
      content: [
        'CareerRoute is an AI-powered mentorship platform connecting students, graduates, and early professionals with experienced mentors for personalized career guidance.',
        'Our mission is to make quality mentorship accessible to everyone, regardless of their background or location.'
      ]
    },
    {
      title: 'What We Offer',
      content: [
        '1-on-1 video mentorship sessions with verified industry experts.',
        'AI-generated transcripts and summaries from every session.',
        'Session recordings for future reference.',
        'Flexible payment options including cards and mobile wallets.'
      ]
    },
    {
      title: 'Our Vision',
      content: [
        'We believe everyone deserves access to career guidance that can transform their professional journey. CareerRoute bridges the gap between aspiring professionals and experienced mentors.'
      ]
    }
  ];
}
