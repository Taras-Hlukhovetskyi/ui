import React, { useRef } from 'react'
import Prism from 'prismjs'
import PropTypes from 'prop-types'
import cancel from '../../images/cancel.png'
import './yamlmodal.scss'

const YamlModal = ({ convertedYaml }) => {
  const modal = useRef()
  const closeYamlModal = () => {
    modal.current.style.display = 'none'
  }
  const html =
    convertedYaml && Prism.highlight(convertedYaml, Prism.languages.yml, 'yml')
  return (
    <div className="yaml_modal" ref={modal} id="yaml_modal">
      <pre>
        <code dangerouslySetInnerHTML={{ __html: html }}></code>
        <button onClick={closeYamlModal}>
          <img src={cancel} alt="Cancel" />
        </button>
      </pre>
    </div>
  )
}

YamlModal.propTypes = {
  convertedYaml: PropTypes.string
}

export default YamlModal
