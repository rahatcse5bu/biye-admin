// TODO: shows SVG through <img>, where browsers never run scripts or event handlers inside it.
export const svgToImgSrc = (svg: string): string => {
  let markup = (svg || '').trim()
  if (!/<svg[\s>]/i.test(markup)) {
    markup = `<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`
  } else if (!/<svg[^>]*\sxmlns=/i.test(markup)) {
    markup = markup.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"')
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
}
