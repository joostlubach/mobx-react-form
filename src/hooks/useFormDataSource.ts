import { runInAction } from 'mobx'
import React from 'react'
import { FieldChangeCallback, FormData, FormModel, isProxyModel } from '../types'

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
    if (isProxyModel(dataSource)) {
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
        dataSource.assign((data as any))
      } else {
        Object.assign(dataSource, data)
      }
    })

    setModified(modifiedRef.current = true)
  }, [dataSource, modifiedRef, setModified])


  const onChangeFor = React.useMemo(() => {
    const cache = new Map<string | symbol | number, FieldChangeCallback<any>>()

    return <K extends keyof FormData<M>>(name: K) => {
      let onChange = cache.get(name)
      if (onChange != null) { return onChange }

      onChange = ((value: FormData<M>[K]) => {
        setData({[name]: value} as any)
        commit()
      }) as FieldChangeCallback<FormData<M>[K]>

      onChange.partial = ((value: FormData<M>[K]) => {
        setData({[name]: value} as any)
      })
      cache.set(name, onChange)
      return onChange
    }
  }, [commit, setData])


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