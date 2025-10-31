import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="container" style="padding:2rem; text-align:center">
      <h1>404 - Not Found</h1>
      <p>The page you are looking for doesn't exist.</p>
      <a routerLink="/">Go to Home</a>
    </section>
  `
})
export class NotFoundComponent {}
