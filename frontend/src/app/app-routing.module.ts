import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LandingPageComponent } from './Component/landing-page/landing-page.component';
import { SelectbusPageComponent } from './Component/selectbus-page/selectbus-page.component';
import { PaymentPageComponent } from './Component/payment-page/payment-page.component';
import { ProfilePageComponent } from './Component/profile-page/profile-page.component';
import { RoutePlannerComponent } from './Component/route-planner/route-planner.component';

const routes: Routes = [
  {path: '',component:LandingPageComponent},
  {path: 'select-bus',component:SelectbusPageComponent},
  {path:'payment',component:PaymentPageComponent},
  {path:'profile',component:ProfilePageComponent},
  { path: 'route-planner', component: RoutePlannerComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    TranslateModule.forChild()
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
