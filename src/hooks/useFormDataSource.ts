import { runInAction } from 'mobx'
import { useCallback, useMemo, useRef } from 'react'
import { objectEntries } from 'ytil'
import { ChangeCallback, FormData, FormModel, isProxyModel } from '../types'

//------
// useForm hook

export function useFormDataSource<M extends FormModel>(
  dataSource: any,
  upstream:   FormDataSourceUpstream,
) {
  const {
    modified,
    setModified,
    commit,
  } = upstream

  const modifiedRef = useRef(modified)

  //------
  // Data & errors ref

  const getFieldValue = useCallback(<K extends keyof FormData<M>>(name: K) => {
    if (isProxyModel(dataSource) && !dataSource.hasOwnProperty(name)) {
      return dataSource.getValue(name)
    } else {
      return dataSource[name]
    }
  }, [dataSource])

  // To access the data in the submit function, use a ref instead of a state to prevent
  // having to recreate the submit function each time. That would counter the whole optimization
  // argument of hooks.
  const setData = useCallback((data: FormData<M>) => {
    runInAction(() => {
      if (isProxyModel(dataSource)) {
        for (const [name, value] of objectEntries(data)) {
          if (dataSource.hasOwnProperty(name)) {
            Object.assign(dataSource, {[name]: value})
          } else {
            dataSource.setValue(name, value)
          }
        }
      } else {
        Object.assign(dataSource, data)
      }
    })

    setModified(modifiedRef.current = true)
  }, [dataSource, modifiedRef, setModified])


  const onChangeFor = useMemo(() => {
    const cache = new Map<string | symbol | number, ChangeCallback<any>>()

    return <K extends keyof FormData<M>>(name: K) => {
      const existing = cache.get(name)
      if (existing != null) { return existing }

      const onChange = (nextValue: FormData<M>[K]) => {
        const prevValue = getFieldValue(name)
        if (nextValue === prevValue) { return }

        runInAction(() => {
          if (isProxyModel(dataSource) && !dataSource.hasOwnProperty(name)) {
            dataSource.setValue(name, nextValue)
          } else {
            dataSource[name] = nextValue
          }
        })
        setModified(modifiedRef.current = true)
      }
      cache.set(name, onChange)
      return onChange
    }
  }, [dataSource, getFieldValue, setModified])

  const onCommit = commit

  return {
    dataSource,
    setData,
    getFieldValue,
    onChangeFor,
    onCommit,
  }
}

export interface FormDataSourceUpstream {
  modified:    boolean
  setModified: (modified: boolean) => void
  commit:      () => void
}