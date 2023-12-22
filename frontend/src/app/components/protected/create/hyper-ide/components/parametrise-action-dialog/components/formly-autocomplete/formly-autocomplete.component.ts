
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, map, startWith } from 'rxjs';

// Application specific imports

/**
 * Formly SQL extension field.
 */
@Component({
  selector: 'app-formly-autocomplete',
  template: `
<mat-form-field class="w-100 standalone-field mb-4">
  <mat-label>{{field.props.label}}</mat-label>
  <input type="text"
    [id]="field.key"
    [placeholder]="field.props.label"
    matInput
    [formControl]="formControl"
    [matAutocomplete]="auto">
  <mat-autocomplete #auto="matAutocomplete">
    <mat-option
      *ngFor="let option of filteredOptions | async;"
      [value]="option.value">{{option.label}}</mat-option>
  </mat-autocomplete>
</mat-form-field>
`,
  styleUrls: ['./formly-autocomplete.scss']
})
export class FormlyAutocompleteComponent extends FieldType<FieldTypeConfig> implements OnInit {

  filteredOptions: Observable<string[]>;

  constructor() {

    super();
  }

  ngOnInit() {

    this.filteredOptions = this.formControl.valueChanges.pipe(
      startWith(this.model[<string>this.field.key]),
      map(value => this._filter(value || '')),
    );
    this.formControl.setValue(this.field.model[<string>this.field.key]);
    this.formControl.valueChanges.subscribe((val: string) => {
      this.model[<string>this.field.key] = val;
    });
  }

  /*
   * Private helper methods.
   */

  private _filter(value: string): any[] {

    const filterValue = value.toLowerCase();
    return (<any[]>this.field.props.options).filter(option => option.label.toLowerCase().includes(filterValue));
  }
}
