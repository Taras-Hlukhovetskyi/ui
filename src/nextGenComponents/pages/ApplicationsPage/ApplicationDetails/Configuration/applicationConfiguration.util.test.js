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
import { describe, it, expect } from 'vitest'

import {
  getBasicSettingsItems,
  getResourcesItems,
  getBuildItems,
  getEnvironmentVariables,
  getLabelsData,
  getAnnotationsData,
  getVolumesData,
  getProbesData
} from './applicationConfiguration.util'

// ── Test data ─────────────────────────────────────────────────────────────────

const MOCK_APPLICATION = {
  description: 'My application description',
  preemption_mode: 'prevent',
  priority_class_name: 'igz-workload-medium',
  min_replicas: 1,
  max_replicas: 4,
  application_image: 'my-app/sidecar:latest',
  image: 'mlrun/mlrun',
  build: {
    baseImage: 'python:3.9',
    commands: ['pip install pandas', 'pip install numpy']
  },
  env: [
    { name: 'API_KEY', value: 'abc123' },
    { name: 'SECRET_VAR', valueFrom: { secretKeyRef: { key: 'accessKey', name: 'my-secret' } } }
  ],
  resources: {
    requests: { memory: '1Mi', cpu: '25m' },
    limits: { memory: '20Gi', cpu: '2', 'nvidia.com/gpu': '3' }
  },
  volumes: [
    { name: 'v3io', flexVolume: { driver: 'v3io/fuse' } }
  ],
  volume_mounts: [
    { name: 'v3io', mountPath: '/v3io', readOnly: false }
  ],
  labels: { owner: 'admin' },
  spec: {
    disable: false,
    serviceAccount: 'my-service-account',
    securityContext: { runAsUser: 1000, runAsGroup: 2000 },
    loggerSinks: [{ level: 'debug' }],
    minReplicas: 1,
    maxReplicas: 4,
    targetCPU: 75,
    scaleToZero: {
      scaleResources: [{ metricName: 'events', windowSize: '10m', threshold: 0 }]
    },
    build: {
      functionSourceCode: 'base64...',
      noBaseImagesPull: false,
      codeEntryType: 'sourceCode'
    },
    readinessProbe: {
      httpGet: { path: 'https://www.example.com/', port: 8080 },
      initialDelaySeconds: 20,
      periodSeconds: 15,
      failureThreshold: 40,
      timeoutSeconds: 12,
      terminationGracePeriodSeconds: 90
    },
    livenessProbe: {
      tcpSocket: { port: 8080 },
      initialDelaySeconds: 10,
      periodSeconds: 5
    },
    startupProbe: {
      grpc: { port: 9090 },
      initialDelaySeconds: 5
    }
  },
  nuclioFunc: {
    metadata: {
      labels: {
        'nuclio.io/project-name': 'default',
        'iguazio.com/username': 'admin'
      },
      annotations: {
        'kubectl.kubernetes.io/default-content': 'iris-streamlit-app-sidecar',
        'nuclio.io/generated_by': 'funcation generated from /mlrun/model_moni..'
      }
    },
    spec: {
      disable: false,
      description: 'Nuclio description',
      serviceAccount: 'my-service-account',
      securityContext: { runAsUser: 1000, runAsGroup: 2000 },
      loggerSinks: [{ level: 'debug' }],
      resources: {},
      minReplicas: 1,
      maxReplicas: 4,
      targetCPU: 75,
      scaleToZero: {
        scaleResources: [{ metricName: 'events', windowSize: '10m', threshold: 0 }]
      },
      build: {
        functionSourceCode: 'base64...',
        noBaseImagesPull: false,
        codeEntryType: 'sourceCode'
      },
      volumes: [
        {
          volume: { name: 'serving-conf', configMap: { name: 'Map_name_example' } },
          volumeMount: { name: 'serving-conf', mountPath: '/config', readOnly: true }
        }
      ],
      readinessProbe: {
        httpGet: { path: 'https://www.example.com/', port: 8080 },
        initialDelaySeconds: 20,
        periodSeconds: 15,
        failureThreshold: 40,
        timeoutSeconds: 12,
        terminationGracePeriodSeconds: 90
      },
      livenessProbe: {
        tcpSocket: { port: 8080 },
        initialDelaySeconds: 10,
        periodSeconds: 5
      },
      startupProbe: {
        grpc: { port: 9090 },
        initialDelaySeconds: 5
      }
    }
  },
  ui: {
    originalContent: {
      metadata: {
        annotations: {
          'kubectl.kubernetes.io/default-content': 'iris-streamlit-app-sidecar',
          'nuclio.io/generated_by': 'funcation generated from /mlrun/model_moni..'
        }
      },
      spec: {}
    }
  }
}

const MINIMAL_APPLICATION = {
  nuclioFunc: {},
  ui: { originalContent: { spec: {} } }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('applicationConfiguration.util', () => {
  describe('getBasicSettingsItems', () => {
    it('returns correct items for a fully populated application', () => {
      const items = getBasicSettingsItems(MOCK_APPLICATION)

      expect(items).toHaveLength(6)
      expect(items[0]).toEqual({ label: 'Enabled', value: 'Yes' })
      expect(items[1]).toEqual({ label: 'Description', value: 'My application description' })
      expect(items[2]).toEqual({ label: 'Service Account', value: 'my-service-account' })
      expect(items[3]).toEqual({ label: 'Run as user', value: '1000' })
      expect(items[4]).toEqual({ label: 'Run as group', value: '2000' })
      expect(items[5]).toEqual({ label: 'Logger level', value: 'Debug' })
    })

    it('returns "No" for Enabled when spec.disable is true', () => {
      const app = {
        ...MOCK_APPLICATION,
        spec: { ...MOCK_APPLICATION.spec, disable: true }
      }
      const items = getBasicSettingsItems(app)
      expect(items[0].value).toBe('No')
    })

    it('uses Nuclio disable when MLRun spec does not include disable', () => {
      const app = {
        ...MOCK_APPLICATION,
        spec: { serviceAccount: 'mlrun-service-account' },
        nuclioFunc: {
          spec: { disable: true }
        }
      }
      const items = getBasicSettingsItems(app)

      expect(items[0]).toEqual({ label: 'Enabled', value: 'No' })
    })

    it('prefers MLRun spec over enriched Nuclio spec', () => {
      const app = {
        ...MOCK_APPLICATION,
        spec: {
          disable: false,
          serviceAccount: 'mlrun-service-account',
          securityContext: { runAsUser: 3000, runAsGroup: 4000 },
          loggerSinks: [{ level: 'info' }]
        },
        nuclioFunc: {
          spec: {
            disable: true,
            serviceAccount: 'nuclio-service-account',
            securityContext: { runAsUser: 1000, runAsGroup: 2000 },
            loggerSinks: [{ level: 'debug' }]
          }
        }
      }
      const items = getBasicSettingsItems(app)

      expect(items[0]).toEqual({ label: 'Enabled', value: 'Yes' })
      expect(items[2]).toEqual({ label: 'Service Account', value: 'mlrun-service-account' })
      expect(items[3]).toEqual({ label: 'Run as user', value: '3000' })
      expect(items[4]).toEqual({ label: 'Run as group', value: '4000' })
      expect(items[5]).toEqual({ label: 'Logger level', value: 'Info' })
    })

    it('returns null values for missing fields', () => {
      const items = getBasicSettingsItems(MINIMAL_APPLICATION)

      expect(items[2].value).toBeNull()
      expect(items[3].value).toBeNull()
      expect(items[4].value).toBeNull()
      expect(items[5].value).toBeNull()
    })
  })

  describe('getResourcesItems', () => {
    it('returns correct items for a fully populated application', () => {
      const items = getResourcesItems(MOCK_APPLICATION)

      expect(items).toHaveLength(11)
      expect(items.find(i => i.label === 'Run on spot nodes').value).toBe('Prevent')
      expect(items.find(i => i.label === 'Pods priority').value).toBe('Medium')
      expect(items.find(i => i.label === 'Memory (request)').value).toBe('1Mi')
      expect(items.find(i => i.label === 'Memory (limit)').value).toBe('20Gi')
      expect(items.find(i => i.label === 'CPU (request)').value).toBe('25m')
      expect(items.find(i => i.label === 'CPU (limit)').value).toBe('2')
      expect(items.find(i => i.label === 'GPU (limit)').value).toBe('3')
      expect(items.find(i => i.label === 'Replicas (Min)').value).toBe('1')
      expect(items.find(i => i.label === 'Replicas (Max)').value).toBe('4')
      expect(items.find(i => i.label === 'Inactivity window').value).toBe('10m')
      expect(items.find(i => i.label === 'Target CPU').value).toBe('75%')
    })

    it('returns null values for missing resources', () => {
      const items = getResourcesItems(MINIMAL_APPLICATION)

      expect(items.find(i => i.label === 'Memory (request)').value).toBeNull()
      expect(items.find(i => i.label === 'GPU (limit)').value).toBeNull()
    })

    it('uses Nuclio target CPU when MLRun spec does not include target CPU', () => {
      const app = {
        ...MOCK_APPLICATION,
        spec: { ...MOCK_APPLICATION.spec, targetCPU: undefined },
        nuclioFunc: {
          spec: { targetCPU: 80 }
        }
      }

      const items = getResourcesItems(app)

      expect(items.find(i => i.label === 'Target CPU').value).toBe('80%')
    })

    it('prefers Application Runtime sidecar resources over reverse proxy resources', () => {
      const app = {
        ...MOCK_APPLICATION,
        resources: {
          requests: { memory: '10Mi', cpu: '10m' },
          limits: { memory: '100Mi', cpu: '100m' }
        },
        config: {
          'spec.sidecars': [
            {
              resources: {
                requests: { memory: '2Gi', cpu: '1' },
                limits: { memory: '4Gi', cpu: '2', 'nvidia.com/gpu': '1' }
              }
            }
          ]
        }
      }

      const items = getResourcesItems(app)

      expect(items.find(i => i.label === 'Memory (request)').value).toBe('2Gi')
      expect(items.find(i => i.label === 'Memory (limit)').value).toBe('4Gi')
      expect(items.find(i => i.label === 'CPU (request)').value).toBe('1')
      expect(items.find(i => i.label === 'CPU (limit)').value).toBe('2')
      expect(items.find(i => i.label === 'GPU (limit)').value).toBe('1')
    })

    it('reads Application Runtime sidecar resources from MLRun spec.config', () => {
      const app = {
        ...MOCK_APPLICATION,
        config: undefined,
        spec: {
          config: {
            'spec.sidecars': [
              {
                resources: {
                  requests: { memory: '3Gi', cpu: '1500m' },
                  limits: { memory: '6Gi', cpu: '3' }
                }
              }
            ]
          }
        }
      }

      const items = getResourcesItems(app)

      expect(items.find(i => i.label === 'Memory (request)').value).toBe('3Gi')
      expect(items.find(i => i.label === 'Memory (limit)').value).toBe('6Gi')
      expect(items.find(i => i.label === 'CPU (request)').value).toBe('1500m')
      expect(items.find(i => i.label === 'CPU (limit)').value).toBe('3')
    })
  })

  describe('getBuildItems', () => {
    it('returns correct items for a fully populated application', () => {
      const items = getBuildItems(MOCK_APPLICATION)

      expect(items).toHaveLength(4)
      expect(items[0]).toEqual({ label: 'Image name', value: 'my-app/sidecar:latest' })
      expect(items[1]).toEqual({ label: 'Base image', value: 'python:3.9' })
      expect(items[2]).toEqual({
        label: 'Build commands',
        value: 'pip install pandas\npip install numpy'
      })
    })

    it('prefers application_image over image for Image name', () => {
      const app = {
        ...MOCK_APPLICATION,
        application_image: 'sidecar-image:v2',
        image: 'proxy-image:v1'
      }
      const items = getBuildItems(app)
      expect(items[0]).toEqual({ label: 'Image name', value: 'sidecar-image:v2' })
    })

    it('falls back to image when application_image is empty', () => {
      const app = {
        ...MOCK_APPLICATION,
        application_image: '',
        image: 'fallback-image:v1'
      }
      const items = getBuildItems(app)
      expect(items[0]).toEqual({ label: 'Image name', value: 'fallback-image:v1' })
    })

    it('returns null for pull at runtime when field is not boolean', () => {
      const items = getBuildItems(MINIMAL_APPLICATION)
      expect(items[3].value).toBeNull()
    })

    it('returns "Yes" when noBaseImagesPull is false', () => {
      const app = {
        ...MINIMAL_APPLICATION,
        spec: {
          build: { noBaseImagesPull: false }
        }
      }
      const items = getBuildItems(app)
      expect(items[3].value).toBe('Yes')
    })
  })

  describe('getEnvironmentVariables', () => {
    it('returns env vars with correct types', () => {
      const result = getEnvironmentVariables(MOCK_APPLICATION)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ type: 'Value', key: 'API_KEY', value: 'abc123' })
      expect(result[1]).toEqual({
        type: 'Secret',
        key: 'SECRET_VAR',
        value: 'Secret key: accessKey, Secret name: my-secret'
      })
    })

    it('returns empty array when no env vars', () => {
      const result = getEnvironmentVariables(MINIMAL_APPLICATION)
      expect(result).toEqual([])
    })

    it('prefers Application Runtime sidecar env over reverse proxy env', () => {
      const app = {
        ...MOCK_APPLICATION,
        env: [{ name: 'REVERSE_PROXY_ENV', value: 'proxy' }],
        config: {
          'spec.sidecars': [
            {
              env: [{ name: 'SIDECAR_ENV', value: 'sidecar' }]
            }
          ]
        }
      }

      const result = getEnvironmentVariables(app)

      expect(result).toEqual([{ type: 'Value', key: 'SIDECAR_ENV', value: 'sidecar' }])
    })
  })

  describe('getLabelsData', () => {
    it('returns labels from MLRun data', () => {
      const result = getLabelsData(MOCK_APPLICATION)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({ key: 'owner', value: 'admin' })
    })

    it('does not fall back to Nuclio labels when MLRun labels are empty', () => {
      const result = getLabelsData({
        ...MOCK_APPLICATION,
        labels: {},
        nuclioFunc: {
          metadata: {
            labels: { 'nuclio.io/project-name': 'default' }
          }
        }
      })

      expect(result).toEqual([])
    })

    it('returns empty array when no labels', () => {
      const result = getLabelsData(MINIMAL_APPLICATION)
      expect(result).toEqual([])
    })
  })

  describe('getAnnotationsData', () => {
    it('returns annotations from MLRun metadata', () => {
      const result = getAnnotationsData(MOCK_APPLICATION)

      expect(result).toHaveLength(2)
      expect(result[0].key).toBe('kubectl.kubernetes.io/default-content')
      expect(result[1].key).toBe('nuclio.io/generated_by')
    })

    it('returns empty array when no annotations', () => {
      const result = getAnnotationsData(MINIMAL_APPLICATION)
      expect(result).toEqual([])
    })
  })

  describe('getVolumesData', () => {
    it('returns application volumes with details', () => {
      const result = getVolumesData(MOCK_APPLICATION)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('v3io')
      expect(result[0].type).toBe('Flex volume')
      expect(result[0].mountPath).toBe('/v3io')
      expect(result[0].readOnly).toBe('No')
      expect(result[0].details.Driver).toBe('v3io/fuse')
    })

    it('uses MLRun spec volumes when normalized application volumes are absent', () => {
      const app = {
        ...MOCK_APPLICATION,
        volumes: [],
        volume_mounts: [],
        spec: {
          ...MOCK_APPLICATION.spec,
          volumes: [
            {
              volume: { name: 'serving-conf', configMap: { name: 'Map_name_example' } },
              volumeMount: { name: 'serving-conf', mountPath: '/config', readOnly: true }
            }
          ]
        }
      }
      const result = getVolumesData(app)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('serving-conf')
      expect(result[0].type).toBe('Config map')
      expect(result[0].mountPath).toBe('/config')
      expect(result[0].readOnly).toBe('Yes')
      expect(result[0].details['Config map name']).toBe('Map_name_example')
    })

    it('prefers Application Runtime sidecar volume mounts over reverse proxy volume mounts', () => {
      const app = {
        ...MOCK_APPLICATION,
        volume_mounts: [{ name: 'v3io', mountPath: '/proxy', readOnly: true }],
        config: {
          'spec.sidecars': [
            {
              volumeMounts: [{ name: 'v3io', mountPath: '/sidecar', readOnly: false }]
            }
          ]
        }
      }
      const result = getVolumesData(app)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('v3io')
      expect(result[0].mountPath).toBe('/sidecar')
      expect(result[0].readOnly).toBe('No')
    })

    it('returns empty array when no volumes', () => {
      const result = getVolumesData(MINIMAL_APPLICATION)
      expect(result).toEqual([])
    })
  })

  describe('getProbesData', () => {
    it('returns all three probe types', () => {
      const result = getProbesData(MOCK_APPLICATION)

      expect(result).toHaveLength(3)
      expect(result[0].name).toBe('Readiness')
      expect(result[0].handlerType).toBe('HTTP')
      expect(result[1].name).toBe('Liveness')
      expect(result[1].handlerType).toBe('TCP')
      expect(result[2].name).toBe('Startup')
      expect(result[2].handlerType).toBe('gRPC')
    })

    it('prefers probes from MLRun spec over enriched Nuclio spec', () => {
      const app = {
        ...MOCK_APPLICATION,
        spec: {
          readinessProbe: {
            httpGet: { path: '/mlrun-health', port: 3000 },
            initialDelaySeconds: 7
          }
        },
        nuclioFunc: {
          spec: {
            readinessProbe: {
              httpGet: { path: '/nuclio-health', port: 8080 },
              initialDelaySeconds: 20
            }
          }
        }
      }
      const result = getProbesData(app)

      expect(result).toHaveLength(1)
      expect(result[0].details).toContainEqual({ label: 'HTTP path', value: '/mlrun-health' })
      expect(result[0].details).toContainEqual({ label: 'HTTP port', value: '3000' })
      expect(result[0].details).toContainEqual({ label: 'Initial delay seconds', value: '7' })
    })

    it('uses Nuclio probes when MLRun spec does not include probes', () => {
      const app = {
        ...MOCK_APPLICATION,
        spec: {},
        nuclioFunc: {
          spec: {
            readinessProbe: {
              httpGet: { path: '/nuclio-health', port: 8080 },
              initialDelaySeconds: 20
            }
          }
        }
      }
      const result = getProbesData(app)

      expect(result).toHaveLength(1)
      expect(result[0].details).toContainEqual({ label: 'HTTP path', value: '/nuclio-health' })
      expect(result[0].details).toContainEqual({ label: 'HTTP port', value: '8080' })
    })

    it('extracts probe details correctly', () => {
      const result = getProbesData(MOCK_APPLICATION)
      const readinessDetails = result[0].details

      expect(readinessDetails).toContainEqual({ label: 'Initial delay seconds', value: '20' })
      expect(readinessDetails).toContainEqual({ label: 'Period seconds', value: '15' })
      expect(readinessDetails).toContainEqual({ label: 'Failure threshold', value: '40' })
      expect(readinessDetails).toContainEqual({ label: 'Timeout seconds', value: '12' })
      expect(readinessDetails).toContainEqual({
        label: 'HTTP path',
        value: 'https://www.example.com/'
      })
    })

    it('extracts additional settings', () => {
      const result = getProbesData(MOCK_APPLICATION)
      const additionalSettings = result[0].additionalSettings

      expect(additionalSettings).toContainEqual({
        label: 'terminationGracePeriodSeconds',
        value: '90'
      })
    })

    it('returns empty array when no probes', () => {
      const result = getProbesData(MINIMAL_APPLICATION)
      expect(result).toEqual([])
    })
  })
})
