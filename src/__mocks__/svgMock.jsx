import React from 'react'

const SvgMock = React.forwardRef((props, ref) => <svg ref={ref} {...props} />)
SvgMock.displayName = 'SvgMock'
export default SvgMock
