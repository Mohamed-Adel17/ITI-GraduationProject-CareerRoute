import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  socialLinks = [
    { name: 'LinkedIn', url: 'https://linkedin.com', icon: 'linkedin' },
    { name: 'Twitter', url: 'https://twitter.com', icon: 'twitter' },
    { name: 'Facebook', url: 'https://facebook.com', icon: 'facebook' }
  ];

  footerLinks = {
    platform: [
      { label: 'Browse Mentors', route: '/mentors' },
      { label: 'Categories', route: '/categories' },
      { label: 'How It Works', route: '/', fragment: 'how-it-works' }
    ],
    company: [
      { label: 'About Us', route: '/about' },
      { label: 'Contact', route: '/contact' },
      { label: 'Careers', route: '/careers' }
    ],
    support: [
      { label: 'Help Center', route: '/help' },
      { label: 'Terms of Service', route: '/terms' },
      { label: 'Privacy Policy', route: '/privacy' }
    ]
  };
}
