import { Component, OnInit, ElementRef, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-virtual-tour',
  template: `
    <div #rendererContainer style="width: 100%; height: 100vh; position: relative;">
      <div style="position: absolute; top: 10px; left: 10px; color: white; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 5px;">
        Use mouse to look around<br>
        Left click + drag to rotate<br>
        Right click + drag to pan<br>
        Scroll to zoom<br>
        Click on seats to see info
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class VirtualTourComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private textureLoader = new THREE.TextureLoader();
  private animationFrameId = 0;
  private resizeListener: (() => void) | null = null;
  private clickListener: ((event: MouseEvent) => void) | null = null;
  private cars: THREE.Mesh[] = [];

  private materials: {[key: string]: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial};
  private seatMeshes: { mesh: THREE.Mesh, seatNumber: number, isWindow: boolean }[] = [];

  constructor(private snackBar: MatSnackBar) {
    // Create procedural wood texture
    const woodTexture = this.createWoodTexture();

    // Initialize materials with textures and colors
    this.materials = {
      seat: new THREE.MeshStandardMaterial({
        color: 0x2244aa,
        roughness: 0.7,
        metalness: 0.1
      }),
      floor: new THREE.MeshStandardMaterial({
        map: woodTexture,
        roughness: 0.9,
        metalness: 0.1,
        color: 0x8B4513 // Dark wood color
      }),
      ceiling: new THREE.MeshStandardMaterial({
        map: woodTexture,
        roughness: 0.7,
        metalness: 0.1,
        color: 0xA0522D // Lighter wood color
      }),
      wall: new THREE.MeshStandardMaterial({
        map: woodTexture,
        roughness: 0.6,
        metalness: 0.2,
        color: 0x8B4513 // Dark wood color
      }),
      window: new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.2,
        transmission: 0.9,
        thickness: 0.05,
        roughness: 0.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        ior: 1.5, // Glass IOR
        reflectivity: 1.0,
        metalness: 0.0
      })
    };
  }

  private createWoodTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Create richer wood grain pattern
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#8B4513');
    gradient.addColorStop(0.2, '#A0522D');
    gradient.addColorStop(0.4, '#D2691E');
    gradient.addColorStop(0.6, '#8B4513');
    gradient.addColorStop(0.8, '#A0522D');
    gradient.addColorStop(1, '#D2691E');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add more detailed wood grain lines
    for (let i = 0; i < 100; i++) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${Math.random() * 50}, ${Math.random() * 20}, 0, ${Math.random() * 0.2})`;
      ctx.lineWidth = Math.random() * 3;
      const y = Math.random() * canvas.height;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(
        canvas.width / 3, y + Math.random() * 30 - 15,
        canvas.width * 2 / 3, y + Math.random() * 30 - 15,
        canvas.width, y + Math.random() * 30 - 15
      );
      ctx.stroke();
    }

    // Add wood knots
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = 5 + Math.random() * 15;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, '#3E1F0D');
      gradient.addColorStop(0.5, '#5C2E1A');
      gradient.addColorStop(1, 'rgba(139, 69, 19, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }

  ngOnInit() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
  }

  ngAfterViewInit() {
    this.initScene();
    this.createBusInterior();
    this.animate();
    
    // Add click listener
    this.clickListener = (event: MouseEvent) => this.onMouseClick(event);
    this.rendererContainer.nativeElement.addEventListener('click', this.clickListener);
  }

  private onMouseClick(event: MouseEvent) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects(
      this.seatMeshes.map(seatInfo => seatInfo.mesh)
    );

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      const seatInfo = this.seatMeshes.find(info => info.mesh === clickedMesh);
      
      if (seatInfo) {
        const seatType = seatInfo.isWindow ? 'Window Seat' : 'Aisle Seat';
        this.snackBar.open(
          `Seat ${seatInfo.seatNumber} - ${seatType}`, 
          'Close', 
          { duration: 2000 }
        );
      }
    }
  }

  private initScene() {
    if (!this.rendererContainer) {
      console.error('Renderer container not found');
      return;
    }

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 1.6, -3);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    // Enable controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI - 0.5;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 10;
    this.controls.target.set(0, 1.6, -2);
    this.controls.update();

    // Lighting
    this.setupLighting();

    // Handle window resize
    this.resizeListener = () => this.onWindowResize();
    window.addEventListener('resize', this.resizeListener, false);
  }

  private setupLighting() {
    // Ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // Main ceiling lights
    for (let i = -3; i <= 3; i += 1.5) {
      const ceilingLight = new THREE.SpotLight(0xffffff, 0.4);
      ceilingLight.position.set(0, 2.3, i);
      ceilingLight.angle = Math.PI / 4;
      ceilingLight.penumbra = 0.5;
      ceilingLight.decay = 2;
      ceilingLight.distance = 5;
      ceilingLight.castShadow = true;
      this.scene.add(ceilingLight);

      // Add light fixture visual
      const lightFixture = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.05, 0.2),
        new THREE.MeshStandardMaterial({ color: 0xeeeeee, emissive: 0xffffff, emissiveIntensity: 0.5 })
      );
      lightFixture.position.copy(ceilingLight.position);
      this.scene.add(lightFixture);
    }

    // Window lights (simulating daylight)
    const daylight = new THREE.DirectionalLight(0xd4ebf2, 0.8);
    daylight.position.set(0, 10, -10);
    this.scene.add(daylight);
  }

  private createPassingCars() {
    const carGeometry = new THREE.BoxGeometry(0.4, 0.3, 1); // Smaller cars for better scale
    const carColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
    
    for (let i = 0; i < 5; i++) {
      const carMaterial = new THREE.MeshStandardMaterial({ color: carColors[i] });
      const car = new THREE.Mesh(carGeometry, carMaterial);
      
      // Position cars to be visible only through the front window
      car.position.set(-1 + (i * 0.5), 1.8, -8 - (i * 2));
      this.scene.add(car);
      this.cars.push(car);
    }
  }

  private createBusInterior() {
    // Bus dimensions
    const busLength = 12;
    const busWidth = 2.5;
    const busHeight = 2.5;

    // Create floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(busWidth, busLength),
      this.materials['floor']
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    this.scene.add(floor);

    // Create ceiling
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(busWidth, busLength),
      this.materials['ceiling']
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = busHeight;
    this.scene.add(ceiling);

    // Create walls
    // Left wall with windows
    const leftWallLower = new THREE.Mesh(
      new THREE.PlaneGeometry(busLength, 0.8),
      this.materials['wall']
    );
    leftWallLower.position.set(-busWidth/2, 0.4, 0);
    leftWallLower.rotation.y = Math.PI / 2;
    this.scene.add(leftWallLower);

    const leftWallUpper = new THREE.Mesh(
      new THREE.PlaneGeometry(busLength, 0.7),
      this.materials['wall']
    );
    leftWallUpper.position.set(-busWidth/2, 2.15, 0);
    leftWallUpper.rotation.y = Math.PI / 2;
    this.scene.add(leftWallUpper);

    // Right wall with windows
    const rightWallLower = new THREE.Mesh(
      new THREE.PlaneGeometry(busLength, 0.8),
      this.materials['wall']
    );
    rightWallLower.position.set(busWidth/2, 0.4, 0);
    rightWallLower.rotation.y = -Math.PI / 2;
    this.scene.add(rightWallLower);

    const rightWallUpper = new THREE.Mesh(
      new THREE.PlaneGeometry(busLength, 0.7),
      this.materials['wall']
    );
    rightWallUpper.position.set(busWidth/2, 2.15, 0);
    rightWallUpper.rotation.y = -Math.PI / 2;
    this.scene.add(rightWallUpper);

    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(busWidth, busHeight),
      this.materials['wall']
    );
    backWall.position.set(0, busHeight/2, busLength/2);
    backWall.rotation.y = Math.PI;
    this.scene.add(backWall);

    // Front wall with window
    const frontWallLower = new THREE.Mesh(
      new THREE.PlaneGeometry(busWidth, 0.8),
      this.materials['wall']
    );
    frontWallLower.position.set(0, 0.4, -busLength/2);
    this.scene.add(frontWallLower);

    const frontWallUpper = new THREE.Mesh(
      new THREE.PlaneGeometry(busWidth, 0.5),
      this.materials['wall']
    );
    frontWallUpper.position.set(0, 2.25, -busLength/2);
    this.scene.add(frontWallUpper);

    const frontWallLeft = new THREE.Mesh(
      new THREE.PlaneGeometry(0.25, 1.2),
      this.materials['wall']
    );
    frontWallLeft.position.set(-busWidth/2 + 0.125, 1.8, -busLength/2);
    this.scene.add(frontWallLeft);

    const frontWallRight = new THREE.Mesh(
      new THREE.PlaneGeometry(0.25, 1.2),
      this.materials['wall']
    );
    frontWallRight.position.set(busWidth/2 - 0.125, 1.8, -busLength/2);
    this.scene.add(frontWallRight);

    // Windows
    // Front window
    const frontWindow = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 1.2),
      this.materials['window']
    );
    frontWindow.position.set(0, 1.8, -busLength/2 + 0.01);
    this.scene.add(frontWindow);

    // Side windows
    for (let i = -4; i <= 4; i += 1) {
      // Left side windows
      const leftWindow = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        this.materials['window']
      );
      leftWindow.position.set(-busWidth/2 + 0.01, 1.4, i * 1.2);
      leftWindow.rotation.y = Math.PI / 2;
      this.scene.add(leftWindow);

      // Right side windows
      const rightWindow = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        this.materials['window']
      );
      rightWindow.position.set(busWidth/2 - 0.01, 1.4, i * 1.2);
      rightWindow.rotation.y = -Math.PI / 2;
      this.scene.add(rightWindow);
    }

    // Create seats (40 seats in total - 10 rows of 4 seats)
    const seatWidth = 0.45;
    const seatDepth = 0.45;
    const seatHeight = 0.5;
    const backrestHeight = 0.8;
    const aisleWidth = 0.5;

    let seatNumber = 1;
    for (let row = 0; row < 10; row++) {
      const zPos = -5 + (row * 1.0);

      // Left window seats
      this.createSeat(-busWidth/2 + seatWidth/2, zPos, seatWidth, seatHeight, seatDepth, backrestHeight, seatNumber++, true);
      
      // Left aisle seats
      this.createSeat(-aisleWidth/2 - seatWidth/2, zPos, seatWidth, seatHeight, seatDepth, backrestHeight, seatNumber++, false);
      
      // Right aisle seats
      this.createSeat(aisleWidth/2 + seatWidth/2, zPos, seatWidth, seatHeight, seatDepth, backrestHeight, seatNumber++, false);
      
      // Right window seats
      this.createSeat(busWidth/2 - seatWidth/2, zPos, seatWidth, seatHeight, seatDepth, backrestHeight, seatNumber++, true);
    }
  }

  private createSeats(busWidth: number, busLength: number) {
    const seatWidth = 0.45;
    const seatHeight = 0.5;
    const seatDepth = 0.45;
    const backrestHeight = 0.7;
    
    let seatNumber = 1;
    // Create 8 rows of seats, 2 on each side
    for (let row = 0; row < 8; row++) {
      const zPos = -busLength/2 + 1 + row * 0.9;
      
      // Left side seats
      this.createSeat(-busWidth/2 + 0.4, zPos, seatWidth, seatHeight, seatDepth, backrestHeight, seatNumber++, true);
      this.createSeat(-busWidth/2 + 0.9, zPos, seatWidth, seatHeight, seatDepth, backrestHeight, seatNumber++, false);
      
      // Right side seats
      this.createSeat(busWidth/2 - 0.9, zPos, seatWidth, seatHeight, seatDepth, backrestHeight, seatNumber++, false);
      this.createSeat(busWidth/2 - 0.4, zPos, seatWidth, seatHeight, seatDepth, backrestHeight, seatNumber++, true);
    }
  }

  private createSeat(x: number, z: number, width: number, height: number, depth: number, backrestHeight: number, seatNumber: number, isWindow: boolean) {
    // Create seat base
    const seatBase = new THREE.Mesh(
      new THREE.BoxGeometry(width, height * 0.2, depth),
      this.materials['seat']
    );
    seatBase.position.set(x, height, z);
    this.scene.add(seatBase);
    this.seatMeshes.push({ mesh: seatBase, seatNumber, isWindow });

    // Create seat backrest
    const backrest = new THREE.Mesh(
      new THREE.BoxGeometry(width, backrestHeight, depth * 0.2),
      this.materials['seat']
    );
    backrest.position.set(x, height + backrestHeight/2, z + depth/2);
    this.scene.add(backrest);
    this.seatMeshes.push({ mesh: backrest, seatNumber, isWindow });

    // Add armrests
    const armrestGeometry = new THREE.BoxGeometry(depth * 0.1, backrestHeight * 0.6, depth);
    const leftArmrest = new THREE.Mesh(armrestGeometry, this.materials['seat']);
    leftArmrest.position.set(x - width/2 + depth * 0.05, height + backrestHeight * 0.3, z);
    this.scene.add(leftArmrest);
    this.seatMeshes.push({ mesh: leftArmrest, seatNumber, isWindow });

    const rightArmrest = new THREE.Mesh(armrestGeometry, this.materials['seat']);
    rightArmrest.position.set(x + width/2 - depth * 0.05, height + backrestHeight * 0.3, z);
    this.scene.add(rightArmrest);
    this.seatMeshes.push({ mesh: rightArmrest, seatNumber, isWindow });
  }

  private onWindowResize() {
    if (this.camera && this.renderer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  private animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Animate cars passing by
    this.cars.forEach((car, index) => {
      car.position.z += 0.03;
      if (car.position.z > -6) {
        car.position.z = -10;
        car.position.x = -1 + Math.random() * 2;
      }
    });

    this.controls.update(); // Enable smooth controls
    this.renderer.render(this.scene, this.camera);
  }

  ngOnDestroy() {
    if (this.renderer) {
      this.renderer.dispose();
      this.rendererContainer?.nativeElement?.removeChild(this.renderer.domElement);
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    // Clean up Three.js resources
    this.scene?.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
      }
      }
    });
  }
}