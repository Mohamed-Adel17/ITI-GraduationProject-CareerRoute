import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="container" style="padding:2rem; text-align:center">
      <h1>401 - Unauthorized</h1>
      <p>You don't have permission to view this page.</p>
      <a routerLink="/">Go to Home</a>
    </section>
  `
})
export class UnauthorizedComponent {}
