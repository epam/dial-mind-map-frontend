import { yupResolver } from '@hookform/resolvers/yup';
import { useCallback, useEffect } from 'react';
import { Path, PathValue, useForm } from 'react-hook-form';

import { BuilderActions } from '@/store/builder/builder/builder.reducers';
import { CompletionSelectors } from '@/store/builder/completion/completion.selectors';
import { GraphSelectors } from '@/store/builder/graph/graph.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { NodeStatus } from '@/types/graph';

import { validationSchema } from '../data/validation';

export interface QuestionItem {
  text: string;
}
export interface FormValues {
  label: string;
  questions: QuestionItem[];
  icon?: string;
  details?: string;
  status?: NodeStatus;
  neon?: boolean;
}

export const useNodeEditorForm = () => {
  const dispatch = useBuilderDispatch();
  const focusNode = useBuilderSelector(GraphSelectors.selectFocusNode);
  const isMessageStreaming = useBuilderSelector(CompletionSelectors.selectIsMessageStreaming);
  const streamingContent = useBuilderSelector(CompletionSelectors.selectStreamingContent);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      label: focusNode.label,
      icon: focusNode.icon ?? '',
      details: focusNode.details ?? '',
      status: focusNode.status,
      neon: focusNode.neon ?? false,
      questions: (focusNode.questions ?? []).filter(Boolean).map(q => ({ text: q })),
    },
    resolver: yupResolver(validationSchema),
  });

  useEffect(() => {
    if (focusNode) {
      setValue('label', focusNode.label ?? '');
      setValue('icon', focusNode.icon ?? '');
      setValue('details', isMessageStreaming && streamingContent !== null ? streamingContent : focusNode.details);
      setValue('status', focusNode.status ?? NodeStatus.Draft);
      setValue('neon', focusNode.neon ?? false);
      setValue(
        'questions',
        (focusNode.questions ?? []).filter(Boolean).map(q => ({ text: q })),
      );
    }
  }, [focusNode, setValue, isMessageStreaming, streamingContent]);

  const onSubmit = useCallback(
    (data: FormValues) => {
      const questionsStrings = (data.questions ? data.questions.map(item => item.text) : focusNode.questions) ?? [];

      if (questionsStrings.length === 0) {
        questionsStrings.push('');
      }

      dispatch(
        BuilderActions.updateNode({
          ...focusNode,
          ...data,
          questions: questionsStrings,
        }),
      );
    },
    [dispatch, focusNode],
  );

  const handleBlur = useCallback(
    <TFieldName extends Path<FormValues>>(field: TFieldName, value: PathValue<FormValues, TFieldName>) => {
      if (isMessageStreaming) return;
      setValue(field, value, { shouldValidate: true });
      handleSubmit(onSubmit)();
    },
    [focusNode, isMessageStreaming, dispatch, handleSubmit, setValue],
  );

  return { control, register, errors, handleBlur, focusNode, isMessageStreaming, getValues, setValue };
};
