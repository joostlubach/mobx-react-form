import { get, set } from 'lodash'
import { IObservableValue, IReactionDisposer, observable, reaction, runInAction, toJS } from 'mobx'
import { AnyConstructor } from 'ytil'
import { FormModel } from './types'

export function autoPersist<S>(model: FormModel, key: string, options?: AutoPersistOptions<S>) {
  const {storage, serializer} = (options ?? DEFAULT_OPTIONS) as AutoPersistOptions<unknown>

  $instances.set(model, {
    key,
    storage,
    serializer,
    status:   observable.box<PersistStatus>('idle'),
    disposer: null,
  })
}

/**
 * Clears all persisted form state in the given storage, e.g. upon logging out.
 */
export async function clearPersistedForms<S>(options?: AutoPersistOptions<S>) {
  const {storage} = (options ?? DEFAULT_OPTIONS) as AutoPersistOptions<unknown>
  await storage.clear()
}

export function persisted<T>(persistence?: FieldPersistence<T>) {
  return (_: unknown, context: ClassAccessorDecoratorContext<FormModel, T>) => {
    if (typeof context.name !== 'string') { return }
    const name = context.name

    context.addInitializer(function (this: FormModel) {
      registerPersistedField(this.constructor as AnyConstructor, name, persistence)
    })
  }
}

export function registerPersistedField(ctor: AnyConstructor, name: string, persistence?: FieldPersistence<any>) {
  const fields = $fields.get(ctor) ?? new Map<string, FieldPersistence<any>>()
  fields.set(name, persistence ?? {
    persist: model => get(model, name),
    restore: (model, value) => { set(model, name, value) },
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

  stopPersisting(instance)
  runInAction(() => instance.status.set('restoring'))

  try {
    const raw = await instance.storage.getItem(instance.key)
    if (raw != null) {
      applyState(model, instance.serializer.deserialize(raw))
    }
  } catch (error) {
    console.warn(`Could not restore persisted form state "${instance.key}"`, error)
  }

  instance.disposer = reaction(
    () => collectState(model),
    state => { instance.storage.setItem(instance.key, instance.serializer.serialize(state)) },
  )
  runInAction(() => instance.status.set('ready'))
}

export async function clearPersistedState(model: FormModel) {
  const instance = $instances.get(model)
  if (instance == null) { return }

  stopPersisting(instance)
  await instance.storage.removeItem(instance.key)
}

function stopPersisting(instance: PersistedInstance) {
  instance.disposer?.()
  instance.disposer = null
}

function collectState(model: FormModel): PersistedState {
  const state: PersistedState = {}
  for (const [name, persistence] of persistedFields(model)) {
    state[name] = toJS(persistence.persist(model))
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

const $fields = new WeakMap<AnyConstructor, Map<string, FieldPersistence<any>>>()
const $instances = new WeakMap<FormModel, PersistedInstance>()

export interface AutoPersistOptions<S> {
  storage:    PersistStorage<S>
  serializer: PersistSerializer<S>
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

export type PersistedState = Record<string, unknown>

type PersistStatus = 'idle' | 'restoring' | 'ready'

interface PersistedInstance {
  key:        string
  storage:    PersistStorage<unknown>
  serializer: PersistSerializer<unknown>
  status:     IObservableValue<PersistStatus>
  disposer:   IReactionDisposer | null
}

const LOCAL_STORAGE_PREFIX = 'mobx-react-form.'

const DEFAULT_OPTIONS: AutoPersistOptions<string> = {
  storage: {
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
  },
  serializer: {
    serialize:   state => JSON.stringify(state),
    deserialize: raw => JSON.parse(raw),
  },
}
