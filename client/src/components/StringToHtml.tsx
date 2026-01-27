import React from 'react'
import parse from "html-react-parser";
const StringToHtml = ({htmlString, classNameOnRoot, key}: {htmlString: string, classNameOnRoot?: string, key?: string}) => {
  return (
    <div className={classNameOnRoot} key={key}>
      {parse(htmlString)}
    </div>
  )
}

export default StringToHtml
