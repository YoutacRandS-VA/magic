
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { MachineLearningTrainingService } from 'src/app/_general/services/machine-learning-training.service';
import { OpenAIService } from 'src/app/_general/services/openai.service';
import { MachineLearningEditSnippetComponent } from '../machine-learning-edit-snippet/machine-learning-edit-snippet.component';

/**
 * Helper component to administrate training data for OpenAI integration
 * and Machine Learning integration.
 */
@Component({
  selector: 'app-machine-learning-snippets',
  templateUrl: './machine-learning-snippets.component.html',
  styleUrls: ['./machine-learning-snippets.component.scss']
})
export class MachineLearningSnippetsComponent implements OnInit {

  type: string;

  types: string[] = null;
  dataSource: any[] = null;
  count: number = 0;
  filter: any = {
    limit: 10,
    offset: 0,
  };
  displayedColumns: string[] = [
    'prompt',
    'type',
    'pushed',
    'action',
  ];

  uploading: boolean = false;
  trainingFileModel: string = '';

  constructor(
    private dialog: MatDialog,
    private generalService: GeneralService,
    private openAIService: OpenAIService,
    private machineLearningTrainingService: MachineLearningTrainingService) { }

  ngOnInit() {

    if (this.type && this.type !== '') {
      this.filter['ml_training_snippets.type.eq'] = this.type;
    }
    this.generalService.showLoading();
    this.getTypes(true);
  }

  create() {

    if (this.types.length === 0) {
      this.generalService.showFeedback('You need to create at least one type first', 'errorMessage');
      return;
    }

    this.dialog
      .open(MachineLearningEditSnippetComponent, {
        width: '80vw',
        maxWidth: '850px',
        disableClose: true,
        data: {
          type: this.type,
        }
      })
      .afterClosed()
      .subscribe((result: any) => {

        if (result) {

          this.machineLearningTrainingService.ml_training_snippets_create(result).subscribe({
            next: () => {

              this.generalService.showFeedback('Snippet successfully created', 'successMessage');
              this.getTrainingData(true);
            },
            error: () => this.generalService.showFeedback('Something went wrong as we tried to create your snippet', 'errorMessage')
          });
        }
    });
  }

  showDetails(el: any) {

    this.dialog
      .open(MachineLearningEditSnippetComponent, {
        width: '80vw',
        maxWidth: '850px',
        disableClose: true,
        data: el,
      })
      .afterClosed()
      .subscribe((result: any) => {

        if (result) {
          if (result?.id) {

            this.machineLearningTrainingService.ml_training_snippets_update(result).subscribe({
              next: () => {

                this.generalService.showFeedback('Snippet updated successfully', 'successMessage');
                this.getTrainingData(false);
              },
              error: () => this.generalService.showFeedback('Something went wrong as we tried to update your snippet', 'errorMessage')
            });
          } else {

            this.machineLearningTrainingService.ml_training_snippets_create(result);
          }
        }
    });
  }

  delete(el: any) {

    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: 'Delete snippet',
        description_extra: 'Are you sure you want to delete this snippet?',
        action_btn: 'Delete',
        close_btn: 'Cancel',
        action_btn_color: 'warn',
        bold_description: true,
      }
    }).afterClosed().subscribe((result: string) => {
      if (result === 'confirm') {

        this.generalService.showLoading();
        this.machineLearningTrainingService.ml_training_snippets_delete(el.id).subscribe({
          next: () => {
    
            this.generalService.showFeedback('Snippet successfully deleted', 'successMessage');
            this.getTrainingData(true);
          },
          error: () => {

            this.generalService.hideLoading();
            this.generalService.showFeedback('Something went wrong as we tried to delete your snippet', 'errorMessage');
          }
        });
      }
    });
  }

  page(event: PageEvent) {

    this.filter.offset = event.pageIndex * event.pageSize;
    this.getTrainingData(false);
  }

  filterList(event: { searchKey: string, type?: string }) {

    this.filter = {
      limit: this.filter.limit,
      offset: 0,
    };
    if (event.searchKey) {
      this.filter['ml_training_snippets.prompt.like'] = '%' + event.searchKey + '%';
    }
    if (event.type) {
      this.filter['ml_training_snippets.type.eq'] = event.type;
    }
    this.getTrainingData(true);
  }

  getFile(event: any) {

    if (!event || !event.target.files || event.target.files.length === 0) {
      return;
    }

    this.uploading = true;

    const formData = new FormData();
    formData.append("file", event.target.files[0], event.target.files[0].name);
    formData.append("type", this.type);

    this.openAIService.uploadTrainingFile(formData).subscribe({
      next: () => {

        this.uploading = false;
        this.generalService.showFeedback('Training data successfully uploaded', 'successMessage');
        this.getTrainingData();

        // Giving user some time to register feedback.
        setTimeout(() => this.trainingFileModel = '', 2000);
      },
      error: (error: any) => {

        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
        this.generalService.hideLoading();
      }
    });
  }

  getFileName() {
    return this.trainingFileModel.split('\\').pop().split('/').pop();
  }

  startTraining() {

    this.generalService.showLoading();
    this.openAIService.start_training(this.type).subscribe({
      next: () => {

        this.generalService.hideLoading();
        this.generalService.showFeedback('Training successfully started', 'successMessage');
      },
      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
      }
    });
  }

  /*
   * Private helper methods.
   */

  private getTypes(getTrainingData: boolean = true) {

    this.machineLearningTrainingService.ml_types().subscribe({
      next: (types: any[]) => {

        types = types || [];

        this.types = types.map(x => x.type);

        if (getTrainingData) {
          this.getTrainingData();
          return;
        }

        this.generalService.hideLoading();
      },
      error: (error: any) => {

        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
        this.generalService.hideLoading();
      }
    });
  }

  private getTrainingData(count: boolean = true) {

    this.machineLearningTrainingService.ml_training_snippets(this.filter).subscribe({
      next: (result: any[]) => {

        this.dataSource = result || [];

        if (!count) {
          this.generalService.hideLoading();
          return;
        }

        const countFilter: any = {};
        for (const idx in this.filter) {
          if (idx !== 'limit' && idx !== 'offset') {
            countFilter[idx] = this.filter[idx];
          }
        }
    
        this.machineLearningTrainingService.ml_training_snippets_count(countFilter).subscribe({
          next: (result: any) => {

            this.count = result.count;
            this.generalService.hideLoading();
          },
          error: (error: any) => {

            this.generalService.showFeedback(error, 'errorMessage', 'Ok');
            this.generalService.hideLoading();
          }
        });
      },
      error: (error: any) => {

        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
        this.generalService.hideLoading();
      }
    });
  }
}
