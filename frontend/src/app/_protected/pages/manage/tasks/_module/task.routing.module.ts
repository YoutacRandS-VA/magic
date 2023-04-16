
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { TasksComponent } from '../tasks.component';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: TasksComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TaskRoutingModule { }
