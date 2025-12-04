import { Component } from '@angular/core';
import { InfoPageComponent } from './info-page.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [InfoPageComponent],
  template: `<app-info-page [title]="title" [sections]="sections" />`
})
export class ContactComponent {
  title = 'Contact Us';
  sections = [
    {
      content: [
        'We\'d love to hear from you! Whether you have questions, feedback, or need support, our team is here to help.'
      ]
    },
    {
      title: 'Email',
      content: ['support@careerroute.com']
    },
    {
      title: 'Response Time',
      content: ['We typically respond within 24-48 business hours.']
    },
    {
      title: 'For Mentors',
      content: ['If you\'re interested in becoming a mentor, please register and submit your application through our platform.']
    }
  ];
}
