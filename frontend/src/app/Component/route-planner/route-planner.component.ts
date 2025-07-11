import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as L from 'leaflet';
import 'leaflet-routing-machine';

interface Waypoint {
  location: string;
  coordinates: [number, number];
}

interface City {
  name: string;
  coordinates: [number, number];
}

interface SearchResult {
  name: string;
  coordinates: [number, number];
}

@Component({
  selector: 'app-route-planner',
  templateUrl: './route-planner.component.html',
  styleUrls: ['./route-planner.component.css']
})
export class RoutePlannerComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  map!: L.Map;
  routingControl: any;
  routeForm: FormGroup;
  waypoints: Waypoint[] = [];
  estimatedTime: string = '';
  estimatedDistance: string = '';
  searchResults: SearchResult[] = [];
  isSearching: boolean = false;
  markers: L.Marker[] = [];
  routeLayer: any = null;

  // Custom marker icon HTML for start point (green)
  private startMarkerStyles = `
    background-color: #4CAF50;
    width: 2rem;
    height: 2rem;
    display: block;
    position: relative;
    border-radius: 3rem 3rem 0;
    transform: rotate(45deg);
    border: 2px solid #FFFFFF;
    box-shadow: 0 0 4px rgba(0,0,0,0.3);
  `;

  // Custom marker icon HTML for end point (red)
  private endMarkerStyles = `
    background-color: #d84f57;
    width: 2rem;
    height: 2rem;
    display: block;
    position: relative;
    border-radius: 3rem 3rem 0;
    transform: rotate(45deg);
    border: 2px solid #FFFFFF;
    box-shadow: 0 0 4px rgba(0,0,0,0.3);
  `;

  private startIcon = L.divIcon({
    className: "custom-pin start-pin",
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    html: `<span style="${this.startMarkerStyles}" />`
  });

  private endIcon = L.divIcon({
    className: "custom-pin end-pin",
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    html: `<span style="${this.endMarkerStyles}" />`
  });

  // Popular Indian cities for quick selection
  popularCities: City[] = [
    { name: 'Mumbai', coordinates: [19.0760, 72.8777] },
    { name: 'Delhi', coordinates: [28.6139, 77.2090] },
    { name: 'Bangalore', coordinates: [12.9716, 77.5946] },
    { name: 'Chennai', coordinates: [13.0827, 80.2707] },
    { name: 'Kolkata', coordinates: [22.5726, 88.3639] },
    { name: 'Hyderabad', coordinates: [17.3850, 78.4867] },
    { name: 'Pune', coordinates: [18.5204, 73.8567] },
    { name: 'Ahmedabad', coordinates: [23.0225, 72.5714] }
  ];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.routeForm = this.fb.group({
      startPoint: ['', Validators.required],
      endPoint: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.initializeMap();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
    }
  }

  initializeMap() {
    // Initialize map centered on India
    this.map = L.map(this.mapContainer.nativeElement).setView([20.5937, 78.9629], 5);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Initialize routing control
    this.routingControl = L.Routing.control({
      waypoints: [],
      router: (L.Routing as any).osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'driving'
      }),
      lineOptions: {
        styles: [{ color: '#d84f57', weight: 4 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      routeWhileDragging: true,
      show: false,
      addWaypoints: false,
      fitSelectedRoutes: true
    }).addTo(this.map);

    // Listen for route calculation events
    this.routingControl.on('routesfound', (e: any) => {
      const routes = e.routes;
      if (routes && routes.length > 0) {
        const route = routes[0];
        this.estimatedDistance = this.formatDistance(route.summary.totalDistance);
        this.estimatedTime = this.formatDuration(route.summary.totalTime);
        
        // Fit the map to show the entire route
        if (route.coordinates && route.coordinates.length > 0) {
          const bounds = L.latLngBounds(route.coordinates);
          this.map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    });
  }

  // Clear existing markers
  private clearMarkers() {
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];
    if (this.routeLayer) {
      this.map.removeLayer(this.routeLayer);
      this.routeLayer = null;
    }
  }

  // Add a new marker
  private addMarker(coordinates: [number, number], popupText: string) {
    const isStartPoint = popupText.startsWith('Start:');
    const marker = L.marker([coordinates[0], coordinates[1]], { 
      icon: isStartPoint ? this.startIcon : this.endIcon,
      title: popupText
    })
      .bindPopup(popupText)
      .addTo(this.map);
    this.markers.push(marker);
    marker.openPopup();
  }

  async searchLocation(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 3) {
      this.searchResults = [];
      return [];
    }
    
    this.isSearching = true;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}, India&limit=5`
      );
      const data = await response.json();
      this.searchResults = data.map((item: any) => ({
        name: item.display_name,
        coordinates: [parseFloat(item.lat), parseFloat(item.lon)]
      }));
      return this.searchResults;
    } catch (error) {
      console.error('Error searching location:', error);
      this.snackBar.open('Error searching location. Please try again.', 'Close', {
        duration: 3000
      });
      return [];
    } finally {
      this.isSearching = false;
    }
  }

  selectLocation(location: SearchResult | City, type: 'start' | 'end') {
    const fieldName = type === 'start' ? 'startPoint' : 'endPoint';
    this.routeForm.patchValue({ [fieldName]: location.name });
    this.searchResults = []; // Clear search results

    // Update markers and calculate route
    if (type === 'start') {
      this.addMarker(location.coordinates, 'Start: ' + location.name);
    } else {
      this.addMarker(location.coordinates, 'End: ' + location.name);
    }

    // If both start and end points are set, calculate the route
    if (this.routeForm.valid) {
      this.updateRoute();
    }
  }

  addWaypoint() {
    this.waypoints.push({ location: '', coordinates: [0, 0] });
  }

  removeWaypoint(index: number) {
    this.waypoints.splice(index, 1);
    this.updateRoute();
  }

  async updateRoute() {
    if (!this.routeForm.valid) return;

    try {
      this.clearMarkers();
      const startPoint = this.routeForm.get('startPoint')?.value;
      const endPoint = this.routeForm.get('endPoint')?.value;

      // Get coordinates for start and end points
      const startResults = await this.searchLocation(startPoint);
      const endResults = await this.searchLocation(endPoint);

      if (startResults.length > 0 && endResults.length > 0) {
        const start = startResults[0];
        const end = endResults[0];

        // Add markers
        this.addMarker(start.coordinates, 'Start: ' + start.name);
        this.addMarker(end.coordinates, 'End: ' + end.name);

        // Create waypoints array
        const routeWaypoints = [
          L.latLng(start.coordinates[0], start.coordinates[1]),
          ...this.waypoints.filter(wp => wp.coordinates[0] !== 0).map(wp => 
            L.latLng(wp.coordinates[0], wp.coordinates[1])
          ),
          L.latLng(end.coordinates[0], end.coordinates[1])
        ];

        // Update routing control
        this.routingControl.setWaypoints(routeWaypoints);

        // Fit map to show all markers
        const bounds = L.latLngBounds([
          start.coordinates,
          end.coordinates,
          ...this.waypoints.filter(wp => wp.coordinates[0] !== 0).map(wp => wp.coordinates)
        ]);
        this.map.fitBounds(bounds, { padding: [50, 50] });

      } else {
        this.snackBar.open('Could not find one or more locations. Please try again.', 'Close', {
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      this.snackBar.open('Error calculating route. Please try again.', 'Close', {
        duration: 3000
      });
    }
  }

  selectPopularCity(city: City, type: 'start' | 'end') {
    this.selectLocation(city, type);
  }

  private formatDistance(meters: number): string {
    const km = meters / 1000;
    return km.toFixed(1) + ' km';
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  }
} 