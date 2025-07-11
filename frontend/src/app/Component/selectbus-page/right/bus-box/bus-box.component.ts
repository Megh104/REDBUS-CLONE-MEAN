import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-bus-box',
  templateUrl: './bus-box.component.html',
  styleUrls: ['./bus-box.component.css']
})
export class BusBoxComponent implements OnInit {
  @Input() rating: number[] = [];
  @Input() operatorname: string = '';
  @Input() bustype: string = '';
  @Input() departuretime: string = '';
  @Input() reschedulable: number = 0;
  @Input() livetracking: number = 0;
  @Input() filledseats: any[] = [];
  @Input() routedetails: any;
  @Input() busid: string = '';
  @Input() bus: any = {
    departureTime: '',
    arrivalTime: '',
    availableSeats: 0,
    fare: 0
  };

  avgrating: number = 0;
  totalreview: number = 0;
  seatprivce: number = 0;
  bustypename: string = '';
  busdeparturetime: number = 0;
  busarrivaltime: number = 0;

  constructor() {}

  ngOnInit(): void {
    this.calculateRating();
    this.calculatePriceAndType();
    this.calculateTimes();
  }

  private calculateRating(): void {
    this.rating.forEach((item, index) => {
      this.avgrating += item;
    this.totalreview += index;
  });
    if (this.totalreview === 0) {
      this.totalreview = 1;
  }
    this.avgrating = this.avgrating / this.totalreview;
  }

  private calculatePriceAndType(): void {
    const duration = Math.floor(this.routedetails?.duration || 0);
    switch (this.bustype) {
      case 'standard':
        this.seatprivce = 50 * duration / 2;
        this.bustypename = 'standard';
        break;
      case 'sleeper':
        this.seatprivce = 100 * duration / 2;
        this.bustypename = 'sleeper';
        break;
      case 'A/C Seater':
        this.seatprivce = 125 * duration / 2;
        this.bustypename = 'A/C Seater';
        break;
      default:
        this.seatprivce = 75 * duration / 2;
        this.bustypename = 'Non - A/C';
  }
  }

  private calculateTimes(): void {
    const numericvalue = parseInt(this.departuretime, 10);
    this.busdeparturetime = numericvalue;
    this.busarrivaltime = (numericvalue + (this.routedetails?.duration || 0)) % 24;
  }

  viewSeats(): void {
    // Update bus information before viewing seats
    this.bus = {
      ...this.bus,
      departureTime: this.busdeparturetime,
      arrivalTime: this.busarrivaltime,
      fare: this.seatprivce
    };
    console.log('Viewing seats for bus:', this.bus);
}
}
