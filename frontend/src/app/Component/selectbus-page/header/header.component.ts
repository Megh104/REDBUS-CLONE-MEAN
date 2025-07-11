import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  departure: string = '';
  arrival: string = '';
  date: string = '';
  filters = {
    ac: false,
    nonAc: false,
    sleeper: false,
    seater: false
  };

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.departure = params['departure'] || '';
      this.arrival = params['arrival'] || '';
      this.date = params['date'] || '';
    });
  }

  modifySearch() {
    // Implement search modification logic here
    console.log('Modifying search...');
  }
}
