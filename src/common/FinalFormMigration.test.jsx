/*
Copyright 2019 Iguazio Systems Ltd.

Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.

In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/
import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createForm } from 'final-form'
import arrayMutators from 'final-form-arrays'
import { Form } from 'react-final-form'
import { FieldArray } from 'react-final-form-arrays'
import { describe, expect, it, vi } from 'vitest'

import { FormCheckBox, FormInput, FormRadio, FormToggle } from 'igz-controls/components'

const createTestForm = initialValues =>
  createForm({
    initialValues,
    mutators: arrayMutators,
    onSubmit: vi.fn()
  })

describe('Final Form migration integration', () => {
  it('renders a newly pushed nested FieldArray value through DRC FormInput', async () => {
    const form = createTestForm({ items: [] })

    render(
      <Form form={form}>
        {() => (
          <>
            <button
              onClick={() =>
                form.mutators.push('items', {
                  data: { name: 'preset-name' }
                })
              }
            >
              Add item
            </button>
            <FieldArray name="items">
              {({ fields }) =>
                fields.map(name => <FormInput key={name} label="Name" name={`${name}.data.name`} />)
              }
            </FieldArray>
          </>
        )}
      </Form>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Add item' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toHaveValue('preset-name')
    })
  })

  it('updates and removes the last FieldArray item without stale field state', async () => {
    const form = createTestForm({
      items: [{ data: { name: 'first' } }]
    })

    render(
      <Form form={form}>
        {() => (
          <FieldArray name="items">
            {({ fields }) => (
              <>
                {fields.map(name => (
                  <FormInput key={name} label="Name" name={`${name}.data.name`} />
                ))}
                <button onClick={() => fields.remove(0)}>Remove item</button>
              </>
            )}
          </FieldArray>
        )}
      </Form>
    )

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'updated' } })
    expect(screen.getByLabelText('Name')).toHaveValue('updated')

    fireEvent.click(screen.getByRole('button', { name: 'Remove item' }))

    await waitFor(() => {
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument()
      expect(form.getState().values.items).toEqual([])
    })
  })

  it('keeps DRC checkbox, radio, and toggle checked state synchronized', () => {
    const form = createTestForm({
      enabled: true,
      flags: ['alpha'],
      option: 'second'
    })

    render(
      <Form form={form}>
        {() => (
          <>
            <FormCheckBox label="Alpha" name="flags" value="alpha" />
            <FormCheckBox label="Beta" name="flags" value="beta" />
            <FormRadio label="First" name="option" value="first" />
            <FormRadio label="Second" name="option" value="second" />
            <FormToggle label="Enabled" name="enabled" />
          </>
        )}
      </Form>
    )

    const [alpha, beta] = screen.getAllByTestId('flags-form-checkbox')
    const first = screen.getByTestId('option-first-radio')
    const second = screen.getByTestId('option-second-radio')
    const toggle = screen.getByTestId('enabled-form-toggle')

    expect(alpha).toBeChecked()
    expect(beta).not.toBeChecked()
    expect(first).not.toBeChecked()
    expect(second).toBeChecked()
    expect(toggle).toBeChecked()

    fireEvent.click(beta)
    fireEvent.click(first)
    fireEvent.click(toggle)

    expect(form.getState().values).toEqual({
      enabled: false,
      flags: ['alpha', 'beta'],
      option: 'first'
    })
  })
})
