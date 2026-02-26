import { some } from 'lodash'
import { action, computed, makeObservable, observable } from 'mobx'
import { bindMethods, objectEntries } from 'ytil'
import { SubmitResult } from './SubmitResult'
import { translateFormModelErrorPaths } from './errors'
import {
  AfterSubmitCallback,
  BeforeSubmitCallback,
  ChangeCallback,
  FormData,
  FormError,
  FormModel,
  FormOptions,
  isProxyModel,
} from './types'

export class FormHandle<M extends FormModel> {

  constructor(
    public readonly options: FormOptions = {},
  ) {
    makeObservable(this)
    bindMethods(this)
  }

  // #region Model

  @observable
  private accessor _model: M | null = null
  public get model() { return this._model }

  @action
  public setModel(model: M) {
    this._model = model
  }

  // #endregion

  // #region Data

  @action
  public setData(data: FormData<M>) {
    for (const [key, value] of objectEntries(data)) {
      this.setFieldValue(key, value)
    }
  }

  @action
  public setFieldValue(field: keyof FormData<M>, value: any) {
    if (this.model == null) { return }
    if (isProxyModel(this.model)) {
      this.model.setValue(field, value)
    } else {
      (this.model as any)[field] = value
    }
    this.setModified()
  }

  public getFieldValue<K extends keyof FormData<M>>(field: K): FormData<M>[K] {
    if (this.model == null) { return null as FormData<M>[K] }

    if (isProxyModel(this.model)) {
      return this.model.getValue(field) as FormData<M>[K]
    } else {
      return (this.model as any)[field]
    }
  }

  public onChangeFor<K extends keyof FormData<M>>(field: K): ChangeCallback<FormData<M>[K]> {
    return value => this.setFieldValue(field, value)
  }

  public reset() {
    this.model?.reset?.()
  }

  public commit() {
    this.model?.commit?.()

    if (this.options.autoSubmit) {
      this.submit()
    }
  }

  // #endregion

  // #region Errors

  @observable
  private accessor errors: FormError[] = []

  public get allErrors() {
    return this.errors
  }

  @computed
  public get invalid() {
    return this.errors.length > 0
  }

  public isInvalid(field: keyof FormData<M>) {
    return some(this.errors, error => error.field === field)
  }

  @action
  public errorsFor(field: keyof FormData<M> | null, includeChildren: boolean = false): FormError[] {
    return this.errors.filter(error => {
      if (error.field === field) { return true }
      if (includeChildren && error.field?.startsWith(`${String(field)}.`)) { return true }
      return false
    })
  }

  @action
  public addError(error: FormError) {
    this.errors = [
      ...this.errors,
      error,
    ]
  }

  @action
  public clearErrors(field?: keyof FormData<M>) {
    if (field == null) {
      this.errors = []
    } else {
      this.errors = this.errors.filter(error => error.field !== field)
    }
  }

  // #endregion

  // #region Flags

  @observable
  private accessor modified: boolean = false
  public get isModified() { return this.modified }

  @observable
  private accessor submitting: boolean = false
  public get isSubmitting() { return this.submitting }

  @action
  public setModified() {
    this.modified = true
  }

  @action
  public clearModified() {
    this.modified = false
  }

  @action
  private startSubmitting() {
    this.submitting = true
  }

  @action
  private stopSubmitting() {
    this.submitting = false
  }

  // #endregion

  // #region Callbacks

  private readonly beforeSubmitCallbacks = new Set<BeforeSubmitCallback<M>>()
  private readonly afterSubmitCallbacks = new Set<AfterSubmitCallback<M>>()

  public onBeforeSubmit(callback: BeforeSubmitCallback<M>): () => void {
    this.beforeSubmitCallbacks.add(callback)
    return () => {
      this.beforeSubmitCallbacks.delete(callback)
    }
  }

  public onAfterSubmit(callback: AfterSubmitCallback<M>): () => void {
    this.afterSubmitCallbacks.add(callback)
    return () => {
      this.afterSubmitCallbacks.delete(callback)
    }
  }

  private async invokeBeforeSubmit(): Promise<boolean> {
    for (const callback of this.beforeSubmitCallbacks) {
      const result = await callback(this)
      if (result === false) { return false }
    }
    return true
  }

  private async invokeAfterSubmit(result: SubmitResult) {
    for (const callback of this.afterSubmitCallbacks) {
      await callback(result, this)
    }
  }

  // #endregion

  // #region Submit

  public get maySubmit() {
    return this.model?.maySubmit ?? true
  }

  public async submit() {
    if (this.model == null) { return }
    if (!this.maySubmit) { return }

    const shouldContinue = await this.invokeBeforeSubmit()
    if (!shouldContinue) { return }

    this.startSubmitting()
    this.clearErrors()


    try {
      let result = await this.model.submit()
      if (result == null) { return }

      // Let the model allow some error path translations.
      result = translateFormModelErrorPaths(result, this.model)

      if (SubmitResult.isOk(result)) {
        this.clearModified()
        if (this.options.resetOnSuccess) {
          this.reset()
        }
      } else if (SubmitResult.isInvalid(result)) {
        this.errors = result.errors
      }

      await this.invokeAfterSubmit(result)

      return result
    } finally {
      this.stopSubmitting()
    }
  }

  @computed
  public get submitHandler() {
    return (event: React.FormEvent) => {
      event.preventDefault()
      this.submit()
    }
  }

  // #endregion
  
}