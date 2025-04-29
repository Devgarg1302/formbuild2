export interface FormElement {
    id: string;
    type: string;
    label: string;
    order: number;
    formId?: string;
    createdAt?: Date;
    // Database properties that can be null or undefined
    placeholder?: string | null;
    helpText?: string | null;
    required?: boolean | null;
    options?: string | null;
    min?: string | null;
    max?: string | null;
    step?: string | null;
    accept?: string | null;
  }