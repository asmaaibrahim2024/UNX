export class HasUnsavedChanges {
  constructor({
    tabName,
    isSaved,
    backup,
    tabStates
  }) {
    this.tabName = tabName;
    this.isSaved = isSaved;
    this.backup = backup;
    this.tabStates = tabStates;
  }
}
