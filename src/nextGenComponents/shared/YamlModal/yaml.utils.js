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

/**
 * Post-processes a YAML string produced by `yaml.dump` to match MLRun/kubectl
 * display conventions:
 *  - Collapses list-item line breaks so each item stays on one line.
 *  - Normalises quote styles: double-quoted values → single-quoted, then
 *    single-quoted values → double-quoted (net effect: consistent double-quote
 *    style for values and keys, collapsed '' escape sequences).
 *
 * NOTE: The regexes operate on simple single-line scalars. Multiline or
 * heavily-quoted values may not be transformed correctly; add a unit test
 * before extending this function.
 *
 * @param {string} data - Raw YAML string from `yaml.dump`.
 * @returns {string} Formatted YAML string.
 */
export const getValidYaml = data => {
  const replacer = (captureGroup1, captureGroup2) => {
    return captureGroup1 + captureGroup2.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  }

  return data
    .replace(/(\s*-)\s*\n\s+/g, '$1 ')
    .replace(/(:\s)"(.+)"$/g, "$1'$2'")
    .replace(/(:\s)"{2}/g, "$1''")
    .replace(/([^\\"])("+)/g, replacer)
    .replace(/'(.+)'(:)/g, '"$1"$2')
    .replace(/(:\s)'(.+)'/g, '$1"$2"')
    .replace(/(:\s)'{2}/g, '$1""')
    .replace(/'{2}/g, "'")
}
