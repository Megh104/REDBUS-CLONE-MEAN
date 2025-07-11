import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataserviceService } from '../../../service/dataservice.service';

interface SideFilterValues {
  livetracking: boolean;
  reschedulable: boolean;
  departuretime: { [key: string]: boolean };
  bustype: { [key: string]: boolean };
  arrivaltime: { [key: string]: boolean };
  amenities: { [key: string]: boolean };
}

@Component({
  selector: 'app-left',
  templateUrl: './left.component.html',
  styleUrls: ['./left.component.css']
})
export class LeftComponent implements OnInit, OnDestroy {
  isFiltersVisible = window.innerWidth > 768;
  sidefiltervalues: SideFilterValues;
  amenityIcon: { [key: string]: string } = {
    'Charging Point': 'power',
    'Movie': 'movie',
    'Reading Light': 'wb_incandescent',
    'Track My Bus': 'directions_bus'
  };

  private resizeListener: () => void;

  constructor(private dataservice: DataserviceService) {
    this.sidefiltervalues = { ...this.dataservice.sidefiltervalues };
    this.resizeListener = () => {
      this.isFiltersVisible = window.innerWidth > 768;
    };
  }

  ngOnInit(): void {
    // Handle initial visibility based on screen size
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy(): void {
    // Clean up event listener
    window.removeEventListener('resize', this.resizeListener);
  }

  toggleFilters(): void {
    this.isFiltersVisible = !this.isFiltersVisible;
  }

  getobjectkey(obj: { [key: string]: boolean }): string[] {
    return Object.keys(obj);
  }

  handlelivetrackingclick(): void {
    this.sidefiltervalues.livetracking = !this.sidefiltervalues.livetracking;
    this.updateFilters();
  }

  handlerescheduleclick(): void {
    this.sidefiltervalues.reschedulable = !this.sidefiltervalues.reschedulable;
    this.updateFilters();
  }

  handledeparturetimeclick(event: Event, key: string): void {
    const target = event.target as HTMLInputElement;
    this.sidefiltervalues.departuretime[key] = target.checked;
    this.updateFilters();
  }

  handlebustypeclick(event: Event, key: string): void {
    const target = event.target as HTMLInputElement;
    this.sidefiltervalues.bustype[key] = target.checked;
    this.updateFilters();
  }

  handlearivaltimeclick(event: Event, key: string): void {
    const target = event.target as HTMLInputElement;
    this.sidefiltervalues.arrivaltime[key] = target.checked;
    this.updateFilters();
  }

  private updateFilters(): void {
    this.dataservice.sidefiltervalues = { ...this.sidefiltervalues };
  }
}
