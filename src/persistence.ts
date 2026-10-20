import { get, set } from 'lodash'
import { IObservableValue, IReactionDisposer, observable, reaction, runInAction, toJS } from 'mobx'
import { AnyConstructor } from 'ytil'
import { FormModel } from './types'

export function autoPersistForm<S>(model: FormModel, key: string, storage: PersistStorage<S>, options: AutoPersistOptions<S> & {serializer: PersistSerializer<S>}): void
export function autoPersistForm(model: FormModel, key: string, storage: PersistStorage<string>, options?: AutoPersistOptions<string>): void
export function autoPersistForm<S>(model: FormModel, key: string, storage: PersistStorage<S>, options: AutoPersistOptions<S> = {}) {
  $instances.set(model, {
    key:      key,
    storage:  storage,
    options:  options,
    status:   observable.box<PersistStatus>('idle'),
    disposer: null,
  })
}

export function persist<T>(name: string, persistence?: FieldPersistence<T>): (tgt: unknown, context: ClassAccessorDecoratorContext<FormModel, T>) => void
export function persist<T>(persistence?: FieldPersistence<T>): (tgt: unknown, context: ClassAccessorDecoratorContext<FormModel, T>) => void
export function persist<T>(...args: any[]) {
  return (_: unknown, context: ClassAccessorDecoratorContext<FormModel, T>) => {
    const key = typeof args[0] === 'string' ? args.shift() : context.name
    const persistence = args.shift()
    if (typeof key !== 'string') { return }

    context.addInitializer(function (this: FormModel) {
      registerPersistedField(this.constructor as AnyConstructor, key, persistence)
    })
  }
}

export function registerPersistedField(ctor: AnyConstructor, key: string | symbol, persistence?: FieldPersistence<any>) {
  const fields = $fields.get(ctor) ?? new Map<string, FieldPersistence<any>>()
  fields.set(key, persistence ?? {
    persist: model => get(model, key),
    restore: (model, value) => { set(model, key, value) },
  })
  $fields.set(ctor, fields)
}

/**
 * Whether the model is persisted, but its persisted state hasn't been restored yet.
 */
export function isRestoringPersistedState(model: FormModel) {
  const instance = $instances.get(model)
  if (instance == null) { return false }

  return instance.status.get() !== 'ready'
}

export async function restorePersistedState(model: FormModel) {
  const instance = $instances.get(model)
  if (instance == null) { return }

  const serializer = instance.options.serializer ?? DEFAULT_SERIALIZER

  stopPersisting(instance)
  runInAction(() => instance.status.set('restoring'))
  
  try {
    const raw = await instance.storage.getItem(instance.key)
    if (raw != null) {
      applyState(model, serializer.deserialize(raw))
    }
  } catch (error) {
    console.warn(`Could not restore persisted form state "${instance.key}"`, error)
  }

  instance.disposer = reaction(
    () => collectState(model),
    state => { instance.storage.setItem(instance.key, serializer.serialize(state)) },
  )
  runInAction(() => instance.status.set('ready'))
}

export async function clearPersistedState(model: FormModel) {
  const instance = $instances.get(model)
  if (instance == null) { return }

  stopPersisting(instance)
  await instance.storage.removeItem(instance.key)
}

function stopPersisting<S>(instance: PersistInstance<S>) {
  instance.disposer?.()
  instance.disposer = null
}

function collectState(model: FormModel): PersistedState {
  const state: PersistedState = {}
  for (const [key, persistence] of persistedFields(model)) {
    state[key] = toJS(persistence.persist(model))
  }
  return state
}

function applyState(model: FormModel, state: unknown) {
  if (state == null || typeof state !== 'object') { return }

  const fields = new Map(persistedFields(model))
  runInAction(() => {
    for (const [name, value] of Object.entries(state)) {
      fields.get(name)?.restore(model, value)
    }
  })
}

function persistedFields(model: FormModel) {
  return $fields.get(model.constructor as AnyConstructor)?.entries() ?? []
}

const $fields = new WeakMap<AnyConstructor, Map<string | symbol, FieldPersistence<any>>>()
const $instances = new WeakMap<FormModel, PersistInstance<any>>()

export interface AutoPersistOptions<S> {
  serializer?: PersistSerializer<S>
}

export interface PersistStorage<S> {
  getItem(key: string): S | null | Promise<S | null>
  setItem(key: string, value: S): void | Promise<void>
  removeItem(key: string): void | Promise<void>
  clear(): void | Promise<void>
}

export interface PersistSerializer<S> {
  serialize(state: PersistedState): S
  deserialize(raw: S): unknown
}

export interface FieldPersistence<T> {
  persist: (model: object) => T
  restore: (model: object, value: T) => void
}

export type PersistedState = Record<string | symbol, unknown>

type PersistStatus = 'idle' | 'restoring' | 'ready'

interface PersistInstance<S> {
  key:        string
  storage:    PersistStorage<S>
  options:    AutoPersistOptions<S>
  status:     IObservableValue<PersistStatus>
  disposer:   IReactionDisposer | null
}

const LOCAL_STORAGE_PREFIX = 'mobx-react-form.'

export const localStorage: PersistStorage<string> = {
  getItem:    key => globalThis.localStorage?.getItem(`${LOCAL_STORAGE_PREFIX}${key}`) ?? null,
  setItem:    (key, value) => globalThis.localStorage?.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, value),
  removeItem: key => globalThis.localStorage?.removeItem(`${LOCAL_STORAGE_PREFIX}${key}`),
  clear:      () => {
    const storage = globalThis.localStorage
    if (storage == null) { return }

    const keys = Array.from({length: storage.length}, (_, index) => storage.key(index))
    for (const key of keys) {
      if (key?.startsWith(LOCAL_STORAGE_PREFIX)) {
        storage.removeItem(key)
      }
    }
  },
}

const DEFAULT_SERIALIZER: PersistSerializer<string> = {
  serialize:   state => JSON.stringify(state),
  deserialize: raw => JSON.parse(raw),
}
