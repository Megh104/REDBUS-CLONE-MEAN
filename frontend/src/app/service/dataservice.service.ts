import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Route } from '../model/routes.model';

interface SideFilterValues {
  livetracking: boolean;
  reschedulable: boolean;
  departuretime: { [key: string]: boolean };
  bustype: { [key: string]: boolean };
  arrivaltime: { [key: string]: boolean };
  amenities: { [key: string]: boolean };
}

@Injectable({
  providedIn: 'root'
})
export class DataserviceService {
  private datasource = new BehaviorSubject<any>(null);
  currentdata = this.datasource.asObservable();
  private passdetails = new BehaviorSubject<any>(null);
  passdata = this.passdetails.asObservable();

  sidefiltervalues: SideFilterValues = {
    livetracking: false,
    reschedulable: false,
    departuretime: {
      'before 6 am': false,
      '6 am to 12 pm': false,
      '12 pm to 6 pm': false,
      'after 6 pm': false
    },
    bustype: {
      'Seater': false,
      'Sleeper': false,
      'AC': false,
      'Non AC': false
    },
    arrivaltime: {
      'before 6 am': false,
      '6 am to 12 pm': false,
      '12 pm to 6 pm': false,
      'after 6 pm': false
    },
    amenities: {
      'Charging Point': false,
      'Movie': false,
      'Reading Light': false,
      'Track My Bus': false
    }
  };

  constructor() { }

  sendobj(obj: any) {
    this.datasource.next(obj);
  }

  passobj(obj: any) {
    this.passdetails.next(obj);
  }

  updateSideFilters(filters: Partial<SideFilterValues>) {
    this.sidefiltervalues = { ...this.sidefiltervalues, ...filters };
  }
}
