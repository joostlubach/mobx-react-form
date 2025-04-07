import { runInAction } from 'mobx'
import React from 'react'
import { objectEntries } from 'ytil'
import { ChangeCallbackWithPartial, FormData, FormModel, isProxyModel } from '../types'
import { makeChangeCallbackWithPartial } from './useChangeCallback'

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

  const modifiedRef = React.useRef(modified)

  //------
  // Data & errors ref

  const getFieldValue = React.useCallback(<K extends keyof FormData<M>>(name: K) => {
    if (isProxyModel(dataSource) && !dataSource.hasOwnProperty(name)) {
      return dataSource.getValue(name)
    } else {
      return dataSource[name]
    }
  }, [dataSource])

  // To access the data in the submit function, use a ref instead of a state to prevent
  // having to recreate the submit function each time. That would counter the whole optimization
  // argument of hooks.
  const setData = React.useCallback((data: FormData<M>) => {
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


  const onChangeFor = React.useMemo(() => {
    const cache = new Map<string | symbol | number, ChangeCallbackWithPartial<any>>()

    return <K extends keyof FormData<M>>(name: K) => {
      const existing = cache.get(name)
      if (existing != null) { return existing }

      const onChange = makeChangeCallbackWithPartial((update, partial) => {
        const prevValue = getFieldValue(name)
        const nextValue = update(prevValue)
        if (nextValue === prevValue) { return }
        if (nextValue === undefined) { return }

        if (isProxyModel(dataSource) && !dataSource.hasOwnProperty(name)) {
          dataSource.setValue(name, nextValue)
        } else {
          dataSource[name] = nextValue
        }

        if (partial) {
          commit()
        }
      })
      cache.set(name, onChange)
      return onChange
    }
  }, [commit, dataSource, getFieldValue])


  return {
    dataSource,
    setData,
    getFieldValue,
    onChangeFor,
  }
}

export interface FormDataSourceUpstream {
  modified:    boolean
  setModified: (modified: boolean) => any
  commit:      () => any
}