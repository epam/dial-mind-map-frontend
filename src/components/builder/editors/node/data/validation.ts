import * as Yup from 'yup';

import { NodeStatus } from '@/types/graph';

import type { FormValues } from '../hooks/useNodeEditorForm';

export const validationSchema = Yup.object<FormValues>().shape({
  label: Yup.string().required('Label is required'),
  icon: Yup.string().optional(),
  details: Yup.string().optional(),
  status: Yup.mixed<NodeStatus>().oneOf(Object.values(NodeStatus), 'Invalid status').optional(),
  neon: Yup.boolean().optional(),

  questions: Yup.array()
    .of(
      Yup.object().shape({
        text: Yup.string().required('Question cannot be empty'),
      }),
    )
    .ensure()
    .required(),
}) as Yup.ObjectSchema<FormValues>;
