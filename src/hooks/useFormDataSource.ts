import React from 'react'
import { useRefMap } from 'react-util/hooks'
import { runInAction } from 'mobx'
import { FieldChangeCallback, FormData, FormDataKey, FormModel, isProxyModel } from '../types'

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

  const getFieldValue = React.useCallback(<K extends FormDataKey<M> & string>(name: K) => {
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
        dataSource.assign(data)
      } else {
        Object.assign(dataSource, data)
      }
    })

    setModified(modifiedRef.current = true)
  }, [dataSource, modifiedRef, setModified])

  const onChangeRefs = useRefMap<any, FieldChangeCallback<any>>([dataSource])

  const onChangeFor = React.useCallback(<K extends FormDataKey<M>>(name: K) => {
    let onChange = onChangeRefs.get(name)
    if (onChange != null) { return onChange }

    onChange = ((value: FormData<M>[K]) => {
      setData({[name]: value} as any)
      commit()
    }) as FieldChangeCallback<FormData<M>[K]>

    onChange.partial = ((value: FormData<M>[K]) => {
      setData({[name]: value} as any)
    })
    onChangeRefs.set(name, onChange)
    return onChange
  }, [commit, onChangeRefs, setData])


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