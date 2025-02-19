import AsyncValidator from 'async-validator';
import * as React from 'react';
import warning from 'warning';
import {
  FieldError,
  InternalNamePath,
  ValidateOptions,
  ValidateMessages,
  RuleObject,
  Rule,
  StoreValue,
} from '../interface';
import NameMap from './NameMap';
import { containsNamePath, getNamePath, setValues } from './valueUtil';
import { defaultValidateMessages } from './messages';

/**
 * Replace with template.
 *   `I'm ${name}` + { name: 'bamboo' } = I'm bamboo
 */
function replaceMessage(template: string, kv: Record<string, string>): string {
  return template.replace(/\$\{\w+\}/g, (str: string) => {
    const key = str.slice(2, -1);
    return kv[key];
  });
}

/**
 * We use `async-validator` to validate rules. So have to hot replace the message with validator.
 * { required: '${name} is required' } => { required: () => 'field is required' }
 */
function convertMessages(
  messages: ValidateMessages,
  name: string,
  rule: RuleObject,
): ValidateMessages {
  const kv = {
    ...(rule as Record<string, string | number>),
    name,
    enum: (rule.enum || []).join(', '),
  };

  const replaceFunc = (template: string, additionalKV?: Record<string, string>) => {
    if (!template) return null;
    return () => replaceMessage(template, { ...kv, ...additionalKV });
  };

  /* eslint-disable no-param-reassign */
  type Template =
    | {
        [name: string]: string | (() => string) | { [name: string]: Template };
      }
    | string;

  function fillTemplate(source: Template, target: Template = {}) {
    Object.keys(source).forEach(ruleName => {
      const value = source[ruleName];
      if (typeof value === 'string') {
        target[ruleName] = replaceFunc(value);
      } else if (value && typeof value === 'object') {
        target[ruleName] = {};
        fillTemplate(value, target[ruleName]);
      } else {
        target[ruleName] = value;
      }
    });

    return target;
  }
  /* eslint-enable */

  return fillTemplate(setValues({}, defaultValidateMessages, messages)) as ValidateMessages;
}

async function validateRule(
  name: string,
  value: StoreValue,
  rule: RuleObject,
  options: ValidateOptions,
): Promise<string[]> {
  const cloneRule = { ...rule };
  // We should special handle array validate
  let subRuleField: RuleObject = null;
  if (cloneRule && cloneRule.type === 'array' && cloneRule.defaultField) {
    subRuleField = cloneRule.defaultField;
    delete cloneRule.defaultField;
  }

  const validator = new AsyncValidator({
    [name]: [cloneRule],
  });

  const messages: ValidateMessages = convertMessages(options.validateMessages, name, cloneRule);
  validator.messages(messages);

  let result = [];

  try {
    await Promise.resolve(validator.validate({ [name]: value }, { ...options }));
  } catch (errObj) {
    if (errObj.errors) {
      result = errObj.errors.map(({ message }, index) =>
        // Wrap ReactNode with `key`
        (React.isValidElement(message)
          ? React.cloneElement(message, { key: `error_${index}` })
          : message),
      );
    } else {
      result = [(messages.default as (() => string))()];
    }
  }

  if (!result.length && subRuleField) {
    const subResults: string[][] = await Promise.all(
      (value as StoreValue[]).map((subValue: StoreValue, i: number) =>
        validateRule(`${name}.${i}`, subValue, subRuleField, options),
      ),
    );

    return subResults.reduce((prev, errors) => [...prev, ...errors], []);
  }

  return result;
}

/**
 * We use `async-validator` to validate the value.
 * But only check one value in a time to avoid namePath validate issue.
 */
export function validateRules(
  namePath: InternalNamePath,
  value: StoreValue,
  rules: RuleObject[],
  options: ValidateOptions,
) {
  const name = namePath.join('.');

  // Fill rule with context
  const filledRules: RuleObject[] = rules.map(currentRule => {
    const originValidatorFunc = currentRule.validator;

    if (!originValidatorFunc) {
      return currentRule;
    }
    return {
      ...currentRule,
      validator(rule: Rule, val: StoreValue, callback: (error?: string) => void) {
        let hasPromise = false;

        // Wrap callback only accept when promise not provided
        const wrappedCallback = (...args: string[]) => {
          // Wait a tick to make sure return type is a promise
          Promise.resolve().then(() => {
            warning(
              !hasPromise,
              'Your validator function has already return a promise. `callback` will be ignored.',
            );

            if (!hasPromise) {
              callback(...args);
            }
          });
        };

        // Get promise
        const promise = originValidatorFunc(rule, val, wrappedCallback);
        hasPromise =
          promise && typeof promise.then === 'function' && typeof promise.catch === 'function';

        /**
         * 1. Use promise as the first priority.
         * 2. If promise not exist, use callback with warning instead
         */
        warning(hasPromise, '`callback` is deprecated. Please return a promise instead.');

        if (hasPromise) {
          (promise as Promise<void>)
            .then(() => {
              callback();
            })
            .catch(err => {
              callback(err);
            });
        }
      },
    };
  });

  const summaryPromise: Promise<string[]> = Promise.all(
    filledRules.map(rule => validateRule(name, value, rule, options)),
  ).then((errorsList: string[][]): string[] | Promise<string[]> => {
    const errors: string[] = [].concat(...errorsList);

    if (!errors.length) {
      return [];
    }

    return Promise.reject<string[]>(errors);
  });

  // Internal catch error to avoid console error log.
  summaryPromise.catch(e => e);

  return summaryPromise;
}

/**
 * Convert `NameMap<string[]>` into `[{ name, errors }]` format.
 */
function nameMapToErrorList(nameMap: NameMap<string[]>): FieldError[] {
  return nameMap.map(({ key, value }) => ({
    name: key,
    errors: value,
  }));
}

export class ErrorCache {
  private cache: NameMap<string[]> = new NameMap();

  public updateError = (fieldErrors: FieldError[]) => {
    this.cache = this.cache.clone();
    fieldErrors.forEach(({ name, errors }) => {
      this.cache.set(name, errors);
    });
  };

  public getFieldsError = (namePathList?: InternalNamePath[]): FieldError[] => {
    const fullErrors: FieldError[] = nameMapToErrorList(this.cache);

    return !namePathList
      ? fullErrors
      : fullErrors.filter(({ name }) => {
          const errorNamePath = getNamePath(name);
          return containsNamePath(namePathList, errorNamePath);
        });
  };

  public resetField = (namePath: InternalNamePath) => {
    this.cache.delete(namePath);
  };
}
