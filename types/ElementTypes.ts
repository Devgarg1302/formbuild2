
export interface ElementType {
  type: string;
  icon: string;
  label: string;
  description?: string;
}

export const ELEMENT_TYPES: ElementType[] = [
  {
    type: 'text',
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    label: 'Text Input',
    description: 'Single line text input field',
  },
  {
    type: 'email',
    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    label: 'Email Input',
    description: 'Email address input with validation',
  },
  {
    type: 'number',
    icon: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14',
    label: 'Number Input',
    description: 'Numeric value input field',
  },
  {
    type: 'textarea',
    icon: 'M4 6h16M4 12h16M4 18h7',
    label: 'Text Area',
    description: 'Multi-line text input field',
  },
  {
    type: 'select',
    icon: 'M8 9l4-4 4 4m0 6l-4 4-4-4',
    label: 'Dropdown',
    description: 'Select one option from a dropdown list',
  },
  {
    type: 'radio',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    label: 'Radio Buttons',
    description: 'Select one option from multiple choices',
  },
  {
    type: 'checkbox',
    icon: 'M5 13l4 4L19 7',
    label: 'Checkboxes',
    description: 'Select multiple options from choices',
  },
  {
    type: 'date',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    label: 'Date Picker',
    description: 'Select a date from a calendar',
  },
  {
    type: 'subform',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    label: 'Nested Form',
    description: 'Embed another form within this form',
  },
  {
    type: 'file',
    icon: 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13',
    label: 'File Upload',
    description: 'Upload images, PDFs, and other files',
  },
  {
    type: 'image',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    label: 'Image Upload',
    description: 'Upload and preview images only',
  },
]; 