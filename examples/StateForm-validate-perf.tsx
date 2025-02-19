/* eslint-disable react/prop-types */

import React from 'react';
import Form, { FormInstance } from '../src/';
import Input from './components/Input';
import LabelField from './components/LabelField';
import { ValidateMessages } from '../src/interface';

const myMessages: ValidateMessages = {
  default: '${name} 看起来怪怪的……',
  required: '你需要一个 ${name}',
  types: {
    number: '嗨，这个 ${name} 不是一个合格的 ${type}',
  },
  enum: '${name} 不在 ${enum} 中呢',
  whitespace: '${name} 不可以是空的啦',
  pattern: {
    mismatch: '${name} 并不符合格式：${pattern}',
  },
};

export default class Demo extends React.Component {
  private form: FormInstance;

  public setForm = (form: FormInstance) => {
    this.form = form;
  };

  public onFinish = (values: { password: string }) => {
    console.log('Finish:', values);
  };

  public render() {
    return (
      <div>
        <h3>High Perf Validate Form</h3>
        <Form
          ref={this.setForm}
          style={{ padding: 16 }}
          onFinish={this.onFinish}
          validateMessages={myMessages}
        >
          <LabelField name="password" rules={[{ required: true }]}>
            <Input placeholder="password" />
          </LabelField>

          <LabelField
            name="password2"
            dependencies={['password']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                async validator(_, value) {
                  if (getFieldValue('password') !== value) {
                    return Promise.reject('password2 is not same as password');
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input placeholder="password 2" />
          </LabelField>

          <LabelField
            name="field"
            label="Full of rules"
            rules={[
              { required: true },
              { required: true, message: <h1>我是 ReactNode</h1> },
              { type: 'number' },
              { type: 'enum', enum: ['aaa', 'bbb'] },
              { type: 'date' },
              { whitespace: true },
              { pattern: /^\w{3}$/ },
            ]}
          >
            <Input />
          </LabelField>

          <button type="submit">Submit</button>
          <button
            type="button"
            onClick={() => {
              this.form.resetFields();
            }}
          >
            Reset
          </button>
        </Form>
      </div>
    );
  }
}
