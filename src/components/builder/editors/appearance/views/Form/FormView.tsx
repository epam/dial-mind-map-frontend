import { DialAlert } from '@epam/ai-dial-ui-kit';
import { useLocalStorageState } from 'ahooks';
import classNames from 'classnames';
import React from 'react';

import { FormSection } from './components/FormSection';
import { formSections } from './data/formSection';

export const FormView: React.FC = () => {
  const [isAlertVisible, setIsAlertVisible] = useLocalStorageState('isThemeAlertVisible', {
    defaultValue: true,
  });
  const onCloseAlert = () => {
    setIsAlertVisible(false);
  };

  return (
    <div className="relative mx-3 mb-3 flex h-full flex-col overflow-y-auto rounded bg-layer-3 pt-1 shadow-mindmap">
      {isAlertVisible && (
        <div className="flex w-full justify-start p-6">
          <DialAlert
            onClose={onCloseAlert}
            message="The settings will be applied for the theme currently selected in DIAL."
          />
        </div>
      )}
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
    </div>
  );
};
