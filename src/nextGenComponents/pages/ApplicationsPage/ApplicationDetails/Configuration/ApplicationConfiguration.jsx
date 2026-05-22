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
import React, { useMemo } from 'react'

import VerticalTabsLayout from '../../../../shared/VerticalTabsLayout/VerticalTabsLayout'
import BasicSettingsSection from './BasicSettingsSection'
import ResourcesSection from './ResourcesSection'
import EnvironmentVariablesSection from './EnvironmentVariablesSection'
import LabelsSection from './LabelsSection'
import AnnotationsSection from './AnnotationsSection'
import VolumesSection from './VolumesSection'
import BuildSection from './BuildSection'
import ProbesSection from './ProbesSection'
import {
  CONFIGURATION_SECTION,
  CONFIGURATION_SECTIONS
} from './applicationConfiguration.constants'
import { applicationShape } from './applicationConfiguration.propTypes'

const SECTION_COMPONENTS = {
  [CONFIGURATION_SECTION.BASIC_SETTINGS]: BasicSettingsSection,
  [CONFIGURATION_SECTION.RESOURCES]: ResourcesSection,
  [CONFIGURATION_SECTION.ENVIRONMENT_VARIABLES]: EnvironmentVariablesSection,
  [CONFIGURATION_SECTION.LABELS]: LabelsSection,
  [CONFIGURATION_SECTION.ANNOTATIONS]: AnnotationsSection,
  [CONFIGURATION_SECTION.VOLUMES]: VolumesSection,
  [CONFIGURATION_SECTION.BUILD]: BuildSection,
  [CONFIGURATION_SECTION.PROBES]: ProbesSection
}

const ApplicationConfiguration = ({ application }) => {
  const sections = useMemo(() => {
    return CONFIGURATION_SECTIONS.map(section => ({
      ...section,
      component: SECTION_COMPONENTS[section.id],
      componentProps: { application }
    }))
  }, [application])

  return (
    <VerticalTabsLayout
      sections={sections}
      defaultSectionId={CONFIGURATION_SECTION.BASIC_SETTINGS}
    />
  )
}

ApplicationConfiguration.propTypes = {
  application: applicationShape.isRequired
}

export default ApplicationConfiguration
