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
import React from 'react'
import { useSelector } from 'react-redux'
import { StatsCard } from 'igz-controls/nextGenComponents'

const ApplicationCounters = () => {
  const { summary, loading } = useSelector(store => store.applicationsStore)

  return (
    <div className="flex gap-5 mt-6">
      <StatsCard className="w-[164px] flex-none bg-white border rounded-lg shadow-[0px_3px_10px_rgba(0,0,0,0.07)]">
        <div className="p-5 flex flex-col h-full">
          <span className="text-[13px] font-medium text-slate-500 mb-1">Applications</span>
          <span className="text-[32px] font-semibold text-slate-900 leading-tight">
            {loading ? '...' : summary.total}
          </span>
        </div>
      </StatsCard>

      <StatsCard className="w-[420px] flex-none bg-white border rounded-lg shadow-[0px_3px_10px_rgba(0,0,0,0.07)]">
        <div className="p-5 flex flex-col h-full">
          <span className="text-[13px] font-medium text-slate-500 mb-3">Applications status</span>
          <div className="flex items-center gap-8 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[28px] font-semibold text-slate-900 leading-none">
                {loading ? '...' : summary.running}
              </span>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-sm text-slate-500">Running</span>
                <div className="w-2 h-2 rounded-full bg-status-running" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[28px] font-semibold text-slate-900 leading-none">
                {loading ? '...' : summary.failed}
              </span>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-sm text-slate-500">Failed</span>
                <div className="w-2 h-2 rounded-full bg-status-failed" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[28px] font-semibold text-slate-900 leading-none">
                {loading ? '...' : summary.building || 0}
              </span>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-sm text-slate-500">Deploying</span>
                <div className="w-2 h-2 rounded-full bg-status-deploying" />
              </div>
            </div>
          </div>
        </div>
      </StatsCard>
    </div>
  )
}

export default ApplicationCounters
