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
import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { FileCode2 } from 'lucide-react'

import DetailsTabs from '../../../shared/DetailsTabs/DetailsTabs'
import ApplicationOverview from './ApplicationOverview'
import ApplicationBuildLogs from './ApplicationBuildLogs'
import ApplicationApiGateways from './ApplicationApiGateways'
import { toggleYaml } from '../../../../reducers/appReducer'
import {
  APPLICATION_DETAILS_TABS,
  APPLICATION_DETAILS_TAB,
  VIEW_YAML_LABEL
} from './applicationDetails.constants'

const ApplicationDetails = ({ application, activeTab, onTabChange, onClose, onRefresh }) => {
  const dispatch = useDispatch()

  // Tab components are closures over `application`. They are recreated only when
  // `application` changes, which is the correct time to remount the tab content.
  const tabsWithComponents = useMemo(() => {
    const OverviewTab = () => <ApplicationOverview application={application} />
    const BuildLogsTab = () => <ApplicationBuildLogs application={application} />
    const ApiGatewaysTab = () => <ApplicationApiGateways application={application} />

    return APPLICATION_DETAILS_TABS.map(tab => {
      if (tab.id === APPLICATION_DETAILS_TAB.OVERVIEW) return { ...tab, component: OverviewTab }
      if (tab.id === APPLICATION_DETAILS_TAB.BUILD_LOGS) return { ...tab, component: BuildLogsTab }
      if (tab.id === APPLICATION_DETAILS_TAB.API_GATEWAYS) return { ...tab, component: ApiGatewaysTab }
      return tab
    })
  }, [application])

  const handleViewYaml = useCallback(() => {
    dispatch(toggleYaml(application.ui?.originalContent))
  }, [application.ui?.originalContent, dispatch])

  const actionsMenu = useMemo(
    () => [
      {
        label: VIEW_YAML_LABEL,
        icon: <FileCode2 className="w-4 h-4" />,
        onClick: handleViewYaml
      }
    ],
    [handleViewYaml]
  )

  return (
    <DetailsTabs
      title={application.name}
      tabs={tabsWithComponents}
      activeTabId={activeTab}
      onTabChange={onTabChange}
      onClose={onClose}
      onRefresh={onRefresh}
      actionsMenu={actionsMenu}
    />
  )
}

ApplicationDetails.propTypes = {
  activeTab: PropTypes.string.isRequired,
  application: PropTypes.shape({
    name: PropTypes.string.isRequired,
    ui: PropTypes.shape({
      originalContent: PropTypes.object
    })
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onRefresh: PropTypes.func,
  onTabChange: PropTypes.func.isRequired
}

export default ApplicationDetails
