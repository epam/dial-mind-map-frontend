import classNames from 'classnames';
import React, { useMemo } from 'react';

import Loader from '@/components/common/Loader';
import { AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderSelector } from '@/store/builder/hooks';

import { FormSection } from './components/FormSection';
import { formSections } from './data/formSection';

export const FormView: React.FC = () => {
  const isResetThemeInProgress = useBuilderSelector(AppearanceSelectors.selectIsResetThemeInProgress);
  const isExportInProgress = useBuilderSelector(AppearanceSelectors.selectIsExportInProgress);
  const isImportInProgress = useBuilderSelector(AppearanceSelectors.selectIsImportInProgress);

  const isLoading = useMemo(() => {
    return isResetThemeInProgress || isExportInProgress || isImportInProgress;
  }, [isResetThemeInProgress, isExportInProgress, isImportInProgress]);

  return (
    <div className="relative mx-3 mb-3 flex h-full flex-col overflow-y-auto rounded bg-layer-3 pt-1 shadow-mindmap">
      {formSections.map((section, index) => (
        <div key={section.id}>
          <FormSection
            title={section.title}
            withBorder={index + 1 < formSections.length && !section.subSections?.length}
            wrapperClassName={section.wrapperClassName}
            className={classNames(!section.component && 'pb-0 lg:pb-0 gap-0')}
          >
            {section.component}
          </FormSection>
          {section.subSections && (
            <div className="border-b border-primary">
              {section.subSections.map((subSection, subSectionIndex) => (
                <FormSection
                  key={subSection.id}
                  title={subSection.title}
                  className={classNames(subSectionIndex === 0 && 'pt-4 lg:pt-4')}
                  Icon={subSection.Icon}
                  titleClassName="!min-w-[174px] !font-medium"
                  wrapperClassName={subSection.wrapperClassName}
                >
                  {subSection.component}
                </FormSection>
              ))}
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <Loader containerClassName="fixed inset-0 z-10 flex size-full items-center justify-center bg-layer-2 opacity-75" />
      )}
    </div>
  );
};
