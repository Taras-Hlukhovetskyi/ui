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
import { GATEWAY_RELATIONSHIP, NUCLIO_OWNER_LABEL } from './applicationDetails.constants'

export const buildGatewayEndpoint = gateway => {
  const host = gateway.spec?.host ?? ''
  const path = gateway.spec?.path ?? ''

  if (!host) return ''

  return path ? `${host}/${path}` : host
}

export const buildMatchNames = (projectName, functionName, functionTag) => {
  const names = new Set()

  names.add(`${projectName}/${functionName}`)
  names.add(`${projectName}-${functionName}`)
  names.add(functionName)

  if (functionTag) {
    names.add(`${projectName}/${functionName}:${functionTag}`)
    names.add(`${projectName}-${functionName}:${functionTag}`)
    names.add(`${functionName}:${functionTag}`)
  }

  return names
}

export const filterGatewaysByFunction = (gateways, projectName, functionName, functionTag) => {
  const matchNames = buildMatchNames(projectName, functionName, functionTag)

  return gateways.reduce((result, gateway) => {
    const upstreams = gateway.spec?.upstreams ?? []
    const matchingUpstream = upstreams.find(upstream => {
      const upstreamName = upstream.nucliofunction?.name ?? ''

      if (matchNames.has(upstreamName)) return true

      const nameWithoutTag = upstreamName.split(':')[0]
      return nameWithoutTag !== upstreamName && matchNames.has(nameWithoutTag)
    })

    if (matchingUpstream) {
      result.push({
        ...gateway,
        relationship: matchingUpstream.percentage
          ? GATEWAY_RELATIONSHIP.INDIRECT
          : GATEWAY_RELATIONSHIP.DIRECT,
        matchedUpstream: matchingUpstream
      })
    }

    return result
  }, [])
}

export const filterApiGatewaysBySearchFields = (gateways, filters) => {
  const nameFilter = filters.name?.toLowerCase() ?? ''
  const ownerFilter = filters.owner?.toLowerCase() ?? ''
  const authModeFilter = filters.authenticationMode ?? ''

  return gateways.filter(gateway => {
    if (nameFilter && !gateway.metadata?.name?.toLowerCase().includes(nameFilter)) {
      return false
    }

    if (ownerFilter && !gateway.metadata?.labels?.[NUCLIO_OWNER_LABEL]?.toLowerCase().includes(ownerFilter)) {
      return false
    }

    if (authModeFilter && gateway.spec?.authenticationMode !== authModeFilter) {
      return false
    }

    return true
  })
}
