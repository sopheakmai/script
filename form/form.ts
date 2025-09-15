// deno-lint-ignore-file no-explicit-any

enum ActionType {
  CREATE = 'create',
  UPDATE = 'update',
  VIEW = 'view',
  DUPLICATE = 'duplicate',
}

enum EnumFieldType {
  TEXT = 'text',
  SELECT = 'select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  DATE = 'date',
  DATETIME = 'datetime',
  RANGE_DATE = 'range_date',
  NUMBER = 'number',
  TEXTAREA = 'textarea',
  SWITCH = 'switch',
  FILE = 'file',
  IMAGE = 'image',
  COLOR = 'color',
  PASSWORD = 'password',
  URL = 'url',
  EMAIL = 'email',
  PHONE = 'phone',
  MULTI_SELECT = 'multi_select',
}

// mode: 'create' | 'update' | 'view' | 'duplicate',

type TFrom = {
  context: {
    recordId: string | null,
    url: string
  },
  layout: {
    type: 'grid' | 'tab',
    columns: number, // default 12
    style: { gap: string } // default { gap: '16px' }
  },
  tab: Array<{
    order: number,
    title: string,
    fields: Array<{
      label: string,
      value: string,
      type: EnumFieldType,
      // for select, radio, checkbox, multi_select
      options?: Array<{ label: string, value: any, disabled?: boolean }>, 
      placeholder?: string, // default base on type
      defaultValue?: any, // default null
      layout?: {
        colSpan: number, // default 6
        rowSpan?: number
        align?: 'left' | 'center' | 'right'
      },
      visible?: boolean, // default true
      disabled?: boolean, // default false
      readOnly?: boolean, // default false
      events?: {
        onChange?: string, 
        onBlur?: string,
        onFocus?: string,
        [key: string]: any
      },
      validation?: {
        required?: boolean, // default false
        minLength?: number,
        maxLength?: number,
        minValue?: number,
        maxValue?: number,
        pattern?: string, // regex pattern as string
        customValidator?: string, // js code as string
      },
      [key: string]: any
    }>
  }>
}

export const form: TFrom = {
  "context": {
    "recordId": null,
    "url": "",
  },
  "layout": {
    "type": "grid",
    "columns": 12,
    "style": { "gap": "16px" }
  },
  "tab": [
    {
      "order": 1,
      "title": "General Title",
      "fields": [
        {
          "label": "name",
          "value": "name",
          "type": EnumFieldType.TEXT,
        }
      ]
    }
  ]
}
