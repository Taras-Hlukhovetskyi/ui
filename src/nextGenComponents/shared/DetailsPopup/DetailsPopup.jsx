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
import PropTypes from 'prop-types'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  Loader
} from 'igz-controls/nextGenComponents'

const DetailsPopup = ({ open, onClose, title, isLoading = false, children }) => {
  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent
        className="w-[80vw] max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        data-testid="details-popup"
        onOpenAutoFocus={event => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle data-testid="details-popup-title">{title}</DialogTitle>
        </DialogHeader>
        <DialogBody data-testid="details-popup-body">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <Loader />
            </div>
          ) : (
            children
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

DetailsPopup.propTypes = {
  children: PropTypes.node,
  isLoading: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired
}

export default DetailsPopup
