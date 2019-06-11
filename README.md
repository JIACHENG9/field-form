# rc-field-form

React Performance First Form Component.

[![NPM version][npm-image]][npm-url]
[![build status][circleci-image]][circleci-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![node version][node-image]][node-url]
[![npm download][download-image]][download-url]

[npm-image]: http://img.shields.io/npm/v/rc-field-form.svg?style=flat-square
[npm-url]: http://npmjs.org/package/rc-field-form
[circleci-image]: https://img.shields.io/circleci/build/github/react-component/field-form/master.svg?style=flat-square
[circleci-url]: https://circleci.com/gh/react-component/field-form/tree/master
[coveralls-image]: https://img.shields.io/codecov/c/github/react-component/field-form/master.svg?style=flat-square
[coveralls-url]: https://codecov.io/gh/react-component/field-form
[node-image]: https://img.shields.io/badge/node.js-%3E=_6.0-green.svg?style=flat-square
[node-url]: http://nodejs.org/download/
[download-image]: https://img.shields.io/npm/dm/rc-field-form.svg?style=flat-square
[download-url]: https://npmjs.org/package/rc-field-form

## Development

```bash
npm install
npm start
open http://localhost:9001/
```

## Feature

- Support react.js and even react-native
- Validate fields with [async-validator](https://github.com/yiminghe/async-validator/)

## Install

[![rc-field-form](https://nodei.co/npm/rc-field-form.png)](https://npmjs.org/package/rc-field-form)

## Usage

```js
import Form, { Field } from 'rc-field-form';

<StateForm
  onFinish={values => {
    console.log('Finish:', values);
  }}
>
  <Field name="username">
    <Input placeholder="Username" />
  </Field>
  <Field name="password">
    <Input placeholder="Password" />
  </Field>

  <button>Submit</button>
</StateForm>;

export default Demo;
```

# API

We use typescript to create the Type definition. You can view directly in IDE.
But you can still check the type definition [here](https://github.com/react-component/field-form/blob/master/src/interface.ts).

## Form

| Prop             | Description                                        | Type                                  | Default          |
| ---------------- | -------------------------------------------------- | ------------------------------------- | ---------------- |
| fields           | Control Form fields status. Only use when in Redux | [FieldData](#fielddata)[]             | -                |
| form             | Set form instance created by `useForm`             | [FormInstance](#useform)              | `Form.useForm()` |
| initialValues    | Initial value of Form                              | Object                                | -                |
| validateMessages | Set validate message template                      | [ValidateMessages](#validatemessages) | -                |
| onFieldsChange   | Trigger when any value of Field changed            | (changedFields, allFields): void      | -                |
| onValuesChange   | Trigger when any value of Field changed            | (changedValues, values): void         | -                |

## Field

| Prop            | Description                             | Type                              | Default  |
| --------------- | --------------------------------------- | --------------------------------- | -------- |
| name            | Field name path                         | [NamePath](#namepath)[]           | -        |
| rules           | Validate rules                          | [Rule](#rule)[]                   | -        |
| shouldUpdate    | Check if Field should update            | (prevValues, nextValues): boolean | -        |
| trigger         | Collect value update by event trigger   | string                            | onChange |
| validateTrigger | Config trigger point with rule validate | string \| string[]                | onChange |

## List

| Prop     | Description                     | Type                                                                                                  | Default |
| -------- | ------------------------------- | ----------------------------------------------------------------------------------------------------- | ------- |
| name     | List field name path            | [NamePath](#namepath)[]                                                                               | -       |
| children | Render props for listing fields | (fields: { name: [NamePath](#namepath) }[], operations: [ListOperations](#listoperations)): ReactNode | -       |

## useForm

Form component default create an form instance by `Form.useForm`.
But you can create it and pass to Form also.
This allow you to call some function on the form instance.

```jsx
const Demo = () => {
  const [form] = Form.useForm();
  return <Form form={form} />;
};
```

For class component user, you can use `ref` to get form instance:

```jsx
class Demo extends React.Component {
  setRef = form => {
    // Form instance here
  };

  render() {
    return <Form ref={this.setRef} />;
  }
}
```

| Prop              | Description                                | Type                                                                       |
| ----------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| getFieldValue     | Get field value by name path               | (name: [NamePath](#namepath)) => any                                       |
| getFieldsValue    | Get list of field values by name path list | (nameList?: [NamePath](#namepath)[]) => any                                |
| getFieldError     | Get field errors by name path              | (name: [NamePath](#namepath)) => string[]                                  |
| getFieldsError    | Get list of field errors by name path list | (nameList?: [NamePath](#namepath)[]) => FieldError[]                       |
| isFieldsTouched   | Check if list of fields are touched        | (nameList?: [NamePath](#namepath)[]) => boolean                            |
| isFieldTouched    | Check if a field is touched                | (name: [NamePath](#namepath)) => boolean                                   |
| isFieldValidating | Check if a field is validating             | (name: [NamePath](#namepath)) => boolean                                   |
| resetFields       | Reset fields status                        | (fields?: [NamePath](#namepath)[]) => void                                 |
| setFields         | Set fields status                          | (fields: FieldData[]) => void                                              |
| setFieldsValue    | Set fields value                           | (values) => void                                                           |
| validateFields    | Trigger fields to validate                 | (nameList?: [NamePath](#namepath)[], options?: ValidateOptions) => Promise |

## Interface

### NamePath

| Type                                     |
| ---------------------------------------- |
| string \| number \| (string \| number)[] |

### FieldData

| Prop       | Type                                     |
| ---------- | ---------------------------------------- |
| touched    | boolean                                  |
| validating | boolean                                  |
| errors     | string[]                                 |
| name       | string \| number \| (string \| number)[] |
| value      | any                                      |

### Rule

| Prop            | Type                                                                                 |
| --------------- | ------------------------------------------------------------------------------------ |
| enum            | any[]                                                                                |
| len             | number                                                                               |
| max             | number                                                                               |
| message         | string                                                                               |
| min             | number                                                                               |
| pattern         | RegExp                                                                               |
| required        | boolean                                                                              |
| transform       | (value) => any                                                                       |
| type            | string                                                                               |
| validator       | ([rule](#rule), value, callback: (error?: string) => void, [form](#useform)) => void |
| whitespace      | boolean                                                                              |
| validateTrigger | string \| string[]                                                                   |

### ListOperations

| Prop   | Type                    |
| ------ | ----------------------- |
| add    | () => void              |
| remove | (index: number) => void |

### ValidateMessages

Please ref

| Prop     | Type |
| -------- | ---- |
| required |      |
