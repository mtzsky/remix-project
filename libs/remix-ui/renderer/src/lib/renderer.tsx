import React, { useEffect, useState } from 'react' //eslint-disable-line
import './renderer.css'
interface RendererProps {
  message: any;
  opt?: any,
  plugin: any,
  config: any
}

export const Renderer = ({ message, opt = {}, plugin, config }: RendererProps) => {
  const [messageText, setMessageText] = useState(null)
  const [editorOptions, setEditorOptions] = useState({
    useSpan: false,
    type: ''
  })
  const [classList] = useState(opt.type === 'error' ? 'alert alert-danger' : 'alert alert-warning')
  const [close, setClose] = useState(false)

  useEffect(() => {
    if (!message) return
    let text

    if (typeof message === 'string') {
      text = message
    } else if (message.innerText) {
      text = message.innerText
    }

    // ^ e.g:
    // browser/gm.sol: Warning: Source file does not specify required compiler version! Consider adding "pragma solidity ^0.6.12
    // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v3.2.0/contracts/introspection/IERC1820Registry.sol:3:1: ParserError: Source file requires different compiler version (current compiler is 0.7.4+commit.3f05b770.Emscripten.clang) - note that nightly builds are considered to be strictly less than the released version
    let positionDetails = getPositionDetails(text)
    const options = opt

    if (!positionDetails.errFile || (opt.errorType && opt.errorType === positionDetails.errFile)) {
      // Updated error reported includes '-->' before file details
      const errorDetails = text.split('-->')
      // errorDetails[1] will have file details
      if (errorDetails.length > 1) positionDetails = getPositionDetails(errorDetails[1])
    }
    options.errLine = positionDetails.errLine
    options.errCol = positionDetails.errCol
    options.errFile = positionDetails.errFile.trim()

    if (!opt.noAnnotations && opt.errFile) {
      addAnnotation(opt.errFile, {
        row: opt.errLine,
        column: opt.errCol,
        text: text,
        type: opt.type
      })
    }

    setMessageText(text)
    setEditorOptions(options)
    setClose(false)
  }, [message])

  const getPositionDetails = (msg: any) => {
    const result = { } as Record<string, number | string>

    // To handle some compiler warning without location like SPDX license warning etc
    if (!msg.includes(':')) return { errLine: -1, errCol: -1, errFile: msg }

    // extract line / column
    let pos = msg.match(/^(.*?):([0-9]*?):([0-9]*?)?/)
    result.errLine = pos ? parseInt(pos[2]) - 1 : -1
    result.errCol = pos ? parseInt(pos[3]) : -1

    // extract file
    pos = msg.match(/^(https:.*?|http:.*?|.*?):/)
    result.errFile = pos ? pos[1] : ''
    return result
  }

  const addAnnotation = (file, error) => {
    if (file === config.get('currentFile')) {
      plugin.call('editor', 'addAnnotation', error, file)
    }
  }

  const handlePointToErrorOnClick = (location, fileName) => {
    plugin.call('editor', 'discardHighlight')
    plugin.call('editor', 'highlight', location, fileName)
  }

  const handleClose = () => {
    setClose(true)
  }

  return (
    <>
      {
        messageText && !close && (
          <div className={`sol ${editorOptions.type} ${classList}`} data-id={opt.errFile} onClick={() => handlePointToErrorOnClick(opt.location, opt.fileName)}>
            { editorOptions.useSpan ? <span> { messageText } </span> : <pre><span>{ messageText }</span></pre> }
            <div className="close" data-id="renderer" onClick={handleClose}>
              <i className="fas fa-times"></i>
            </div>
          </div>)
      }
    </>
  )
}
