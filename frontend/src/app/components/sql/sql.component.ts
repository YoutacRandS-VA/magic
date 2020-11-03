
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SqlService } from 'src/app/services/sql-service';
import { FileService } from 'src/app/services/file-service';
import { TicketService } from 'src/app/services/ticket-service';
import { GetSaveFilenameDialogComponent } from './modals/get-save-filename';
import * as CodeMirror from 'codemirror';

// Helper class for SQL autocomplete
class Column {
  name: string;
}

// Helper class for SQL autocomplete
class Table {
  name: string;
  columns: Column[];
}

class Database {
  name: string;
  tables: Table[];
}

@Component({
  selector: 'app-sql',
  templateUrl: './sql.component.html',
  styleUrls: ['./sql.component.scss']
})
export class SqlComponent implements OnInit {

  public isFetching = false;
  public savedFiles = [];
  public selectedScript: string;
  public selectedFilename: string = null;
  public result: any = null;
  public databaseTypes = ['mysql', 'mssql', 'mssql-batch'];
  public selectedDatabaseType = 'mysql';
  public sqlText = '';
  public databases: Database[] = null;
  public selectedDatabase: Database = null;
  public hintOptions: any;
  public hasConnection = true;

  constructor(
    private sqlService: SqlService,
    private fileService: FileService,
    private ticketService: TicketService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog) { }

  ngOnInit() {
    this.selectedDatabaseType = this.ticketService.getDefaultDatabaseType();
    if (this.selectedDatabaseType !== null) {
      this.getDatabases();
    }
    this.getFiles();
  }

  getDatabases() {
    this.isFetching = true;
    const databaseType = this.selectedDatabaseType === 'mssql-batch' ? 'mssql' : this.selectedDatabaseType;
    this.sqlService.getDatabases(databaseType).subscribe(res => {
      this.databases = res.databases;
      if (this.databases.length > 0) {
        this.selectedDatabase = this.databases[0];
        this.initializeSqlHints();
      }
      this.isFetching = false;
      this.hasConnection = true;
    }, error => {
      this.showHttpError(error);
      this.isFetching = false;
      this.hasConnection = false;
    });
  }

  databaseChanged(e: MatSelectChange) {
    this.initializeSqlHints();
  }

  initializeSqlHints() {
    const tmpHints = {};
    this.selectedDatabase.tables.forEach(idx => {
      const columns = idx.columns.map(x => {
        return x.name;
      });
      tmpHints[idx.name] = columns;
    });
    this.hintOptions = {
      tables: tmpHints
    };
  }

  getFiles() {
    this.sqlService.getSavedFiles(this.selectedDatabaseType).subscribe(res => {
      if (res === null || res.length === 0) {
        this.savedFiles = [];
        return;
      }
      this.savedFiles = res
        .filter(x => x.endsWith('.sql'))
        .map(x => x.substr(x.lastIndexOf('/') + 1));
    });
  }

  databaseTypeChanged(e: MatSelectChange) {
    this.isFetching = true;
    this.getFiles();
    this.getDatabases();
  }

  fileChanged(e: MatSelectChange) {
    this.selectedFilename = this.selectedScript;
    this.fileService.getFileContent(`/misc/${this.selectedDatabaseType}/templates/${e.value}`).subscribe(res => {
      this.sqlText = res;
      this.selectedScript = null;
    });
  }

  getCodeMirrorOptions() {
    return {
      mode: 'text/x-mysql',
      indentWithTabs: true,
      smartIndent: true,
      lineNumbers: true,
      matchBrackets: true,
      autoFocus: true,
      extraKeys: {
        'Ctrl-Space': 'autocomplete'
      },
      hintOptions: this.hintOptions,
      theme: 'mbo',
      height: '250px',
    };
  }

  save() {
    const dialogRef = this.dialog.open(GetSaveFilenameDialogComponent, {
      width: '500px',
      data: {
        filename: this.selectedFilename,
        existingFiles: this.savedFiles,
      }
    });

    dialogRef.afterClosed().subscribe(filename => {
      if (filename !== undefined) {
        if (filename.indexOf('.') === -1) {
          filename = filename + '.sql';
        }
        this.sqlService.saveFile(this.selectedDatabaseType, filename, this.sqlText).subscribe(res => {
          this.showHttpSuccess('File successfully saved');
          this.getFiles();
        });
      }
    });
  }

  evaluate() {
    this.sqlService.evaluate(this.sqlText, this.selectedDatabaseType, this.selectedDatabase.name).subscribe((res) => {
      this.result = res;
      this.showHttpSuccess('SQL executed successfully');
    }, (error) => {
      this.showHttpError(error);
    });
  }

  showHttpError(error: any) {
    this.snackBar.open(error.error.message, 'Close', {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });
  }

  showHttpSuccess(msg: string) {
    this.snackBar.open(msg, 'Close', {
      duration: 2000,
    });
  }
}
