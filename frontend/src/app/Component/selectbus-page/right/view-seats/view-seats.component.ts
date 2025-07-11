import { Component, OnInit, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { VirtualTourComponent } from './virtual-tour/virtual-tour.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-view-seats',
  templateUrl: './view-seats.component.html',
  styleUrls: ['./view-seats.component.css']
})
export class ViewSeatsComponent implements OnInit {
  @Input() filledseats: number[] = [];
  @Input() seatprice: number = 0;
  @Input() routedetails: any;
  @Input() busid: string = '';
  @Input() busarrivaltime: string = '';
  @Input() busdeparturetime: string = '';
  @Input() operatorname: string = '';

  selectedseats: number[] = [];
  showBookingForm: boolean = false;

  constructor(private dialog: MatDialog, private router: Router) {}

  ngOnInit(): void {}

  generatearray(n: number): number[] {
    return Array(n).fill(0).map((x, i) => i + 1);
  }

  handleselectedseats(seatno: number) {
    const index = this.selectedseats.indexOf(seatno);
    if (index === -1) {
      this.selectedseats.push(seatno);
    } else {
      this.selectedseats.splice(index, 1);
    }
  }

  proceedToBook() {
    if (this.selectedseats.length === 0) {
      // Show error message or alert
      alert('Please select at least one seat');
      return;
    }
    this.showBookingForm = true;
  }

  backToSeats() {
    this.showBookingForm = false;
  }

  toggleVirtualTour() {
    const dialogRef = this.dialog.open(VirtualTourComponent, {
      width: '100%',
      height: '90vh',
      maxWidth: '100vw',
      panelClass: 'virtual-tour-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Virtual tour closed');
    });
  }

  continue() {
    if (this.selectedseats.length === 0) {
      alert('Please select at least one seat');
      return;
    }

    // Navigate to payment page with selected seats
    this.router.navigate(['/payment'], {
      queryParams: {
        selectedseat: this.selectedseats.join(','),
        seatprice: this.seatprice,
        busid: this.busid,
        busarrivaltime: this.busarrivaltime,
        busdeparturetime: this.busdeparturetime,
        operatorname: this.operatorname
      }
    });
  }
}
