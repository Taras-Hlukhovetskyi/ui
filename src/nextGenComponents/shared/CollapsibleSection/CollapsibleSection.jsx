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
import { ChevronRight } from 'lucide-react'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  cn
} from 'igz-controls/nextGenComponents'

const CollapsibleSection = ({ title, defaultOpen = false, children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const handleOpenChange = useCallback(open => {
    setIsOpen(open)
  }, [])

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={handleOpenChange}
      className={cn(
        'bg-background border border-igz-gray-light rounded overflow-hidden',
        className
      )}
    >
      <CollapsibleTrigger
        className="flex items-center gap-0.5 w-full h-14 pl-2 text-left cursor-pointer hover:bg-igz-accent-hover"
        data-testid={`collapsible-trigger-${title}`}
      >
        <div className="flex items-center p-1 rounded-full shrink-0">
          <ChevronRight
            className={cn(
              'w-4 h-4 text-igz-primary transition-transform duration-200',
              isOpen && 'rotate-90'
            )}
          />
        </div>
        <span
          className={cn(
            'text-body text-igz-primary',
            isOpen ? 'font-semibold' : 'font-normal'
          )}
        >
          {title}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent data-testid={`collapsible-content-${title}`}>
        <div className="pl-6 pr-5 pb-6">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

CollapsibleSection.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  defaultOpen: PropTypes.bool,
  title: PropTypes.string.isRequired
}

export default CollapsibleSection
