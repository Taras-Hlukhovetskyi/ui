/*
Copyright 2019 Iguazio Systems Ltd.

Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.

In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/
import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import { Tabs, TabsList, TabsTrigger, TabsContent, ScrollArea, Separator, cn } from 'igz-controls/nextGenComponents'

import CollapsibleSection from '../CollapsibleSection/CollapsibleSection'
import useContainerWidth from './useContainerWidth.hook'

const DESKTOP_BREAKPOINT = 900
const SIDEBAR_WIDTH = 'w-[220px]'
const CONTENT_MAX_WIDTH = 'max-w-[800px]'
const CONTAINER_MAX_WIDTH = 'max-w-[1100px]'
const SECTION_TITLE_MIN_HEIGHT = 'min-h-[42px]'

const VerticalTabsLayout = ({ sections, defaultSectionId, className = '' }) => {
  const [containerRef, isDesktop] = useContainerWidth(DESKTOP_BREAKPOINT)
  const initialSection = defaultSectionId || sections[0]?.id

  return (
    <div ref={containerRef} className="absolute inset-0 top-4 bottom-4" data-testid="vertical-tabs-container">
      {isDesktop === null ? null : isDesktop ? (
        <DesktopLayout
          sections={sections}
          defaultSectionId={initialSection}
          className={className}
        />
      ) : (
        <MobileLayout
          sections={sections}
          defaultSectionId={initialSection}
          className={className}
        />
      )}
    </div>
  )
}

const DesktopLayout = ({ sections, defaultSectionId, className }) => {
  const [activeSection, setActiveSection] = useState(defaultSectionId)

  const handleSectionChange = useCallback(sectionId => {
    setActiveSection(sectionId)
  }, [])

  return (
    <Tabs
      value={activeSection}
      onValueChange={handleSectionChange}
      orientation="vertical"
      className={cn(
        'flex flex-row h-full gap-6 overflow-hidden',
        CONTAINER_MAX_WIDTH,
        'bg-background border border-igz-gray-light rounded-lg p-5 shadow-card',
        className
      )}
      data-testid="vertical-tabs-layout"
    >
      <TabsList
        className={cn('flex flex-col items-stretch gap-0 shrink-0 border-b-0 h-full overflow-y-auto py-0', SIDEBAR_WIDTH)}
        data-testid="vertical-tabs-list"
      >
        {sections.map(section => (
          <TabsTrigger
            key={section.id}
            value={section.id}
            data-testid={`vertical-tab-${section.id}`}
            className={cn(
              'flex justify-start mr-0 w-full px-3 py-3 rounded text-body',
              'font-normal text-igz-primary after:hidden',
              'data-[state=active]:bg-igz-tab-active-bg data-[state=active]:text-igz-light-purple data-[state=active]:font-medium',
              'hover:text-igz-secondary hover:bg-igz-accent-hover',
              'first:px-3'
            )}
          >
            {section.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <Separator orientation="vertical" className="h-auto bg-igz-gray-light" />

      {sections.map(section => {
        const SectionComponent = section.component

        return (
          <TabsContent
            key={section.id}
            value={section.id}
            className="flex-1 overflow-hidden pt-0 m-0"
            data-testid={`vertical-tab-content-${section.id}`}
          >
            <ScrollArea className="h-full">
              <div className={cn('flex flex-col gap-2', CONTENT_MAX_WIDTH)}>
                <h2
                  className={cn('text-lg font-bold text-igz-primary flex items-center', SECTION_TITLE_MIN_HEIGHT)}
                  data-testid={`section-title-${section.id}`}
                >
                  {section.title || section.label}
                </h2>
                {SectionComponent ? <SectionComponent {...(section.componentProps || {})} /> : null}
              </div>
            </ScrollArea>
          </TabsContent>
        )
      })}
    </Tabs>
  )
}

const MobileLayout = ({ sections, defaultSectionId, className }) => {
  const openSectionId = defaultSectionId || sections[0]?.id

  return (
    <div
      className={cn('h-full', className)}
      data-testid="vertical-tabs-layout-mobile"
    >
      <ScrollArea className="h-full">
        <div className="flex flex-col gap-2 pr-4">
          {sections.map(section => {
            const SectionComponent = section.component

            return (
              <CollapsibleSection
                key={section.id}
                title={section.label}
                defaultOpen={section.id === openSectionId}
              >
                {SectionComponent ? <SectionComponent {...(section.componentProps || {})} /> : null}
              </CollapsibleSection>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

const sectionShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  title: PropTypes.string,
  component: PropTypes.elementType,
  componentProps: PropTypes.object
})

VerticalTabsLayout.propTypes = {
  className: PropTypes.string,
  defaultSectionId: PropTypes.string,
  sections: PropTypes.arrayOf(sectionShape).isRequired
}

DesktopLayout.propTypes = {
  className: PropTypes.string,
  defaultSectionId: PropTypes.string,
  sections: PropTypes.arrayOf(sectionShape).isRequired
}

MobileLayout.propTypes = {
  className: PropTypes.string,
  defaultSectionId: PropTypes.string,
  sections: PropTypes.arrayOf(sectionShape).isRequired
}

export default VerticalTabsLayout
