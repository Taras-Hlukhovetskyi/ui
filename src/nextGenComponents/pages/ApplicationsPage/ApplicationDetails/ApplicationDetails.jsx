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
import { toggleYaml } from '../../../../reducers/appReducer'
import {
  APPLICATION_DETAILS_TABS,
  APPLICATION_DETAILS_TAB
} from './applicationDetails.constants'

const ApplicationDetails = ({ application, activeTab, onTabChange, onClose, onRefresh }) => {
  const dispatch = useDispatch()

  const OverviewTab = useCallback(
    () => <ApplicationOverview application={application} />,
    [application]
  )

  const tabsWithComponents = useMemo(
    () =>
      APPLICATION_DETAILS_TABS.map(tab => ({
        ...tab,
        component: tab.id === APPLICATION_DETAILS_TAB.OVERVIEW ? OverviewTab : tab.component
      })),
    [OverviewTab]
  )

  const handleViewYaml = useCallback(() => {
    dispatch(toggleYaml(application.ui?.originalContent))
  }, [application.ui?.originalContent, dispatch])

  const actionsMenu = useMemo(
    () => [
      {
        label: 'View YAML',
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
