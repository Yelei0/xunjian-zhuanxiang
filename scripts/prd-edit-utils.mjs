function lineStartIndexes(text) {
  const starts = [0]
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '\n') starts.push(i + 1)
  }
  return starts
}

function indexForLine(starts, line) {
  return starts[Math.max(0, Math.min(line, starts.length - 1))]
}

function findPageRange(lines, page) {
  let currentHeading = -1

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim()
    if (/^##\s+/.test(trimmed)) {
      currentHeading = i
      continue
    }

    const match = trimmed.match(/^\*\*页面\*\*[：:]\s*(\S+)/)
    if (match?.[1] === page && currentHeading >= 0) {
      let endLine = lines.length
      for (let j = i + 1; j < lines.length; j += 1) {
        if (/^##\s+/.test(lines[j].trim())) {
          endLine = j
          break
        }
      }
      return { startLine: currentHeading, endLine }
    }
  }

  throw new Error(`PRD page not found: ${page}`)
}

function findSectionRange(lines, pageRange, title) {
  if (Number.isInteger(title)) {
    let seen = 0
    for (let i = pageRange.startLine + 1; i < pageRange.endLine; i += 1) {
      const trimmed = lines[i].trim()
      if (!/^###\s+/.test(trimmed) || /^###\s+\[\d+\]\s+/.test(trimmed)) continue
      if (seen !== title) {
        seen += 1
        continue
      }

      let endLine = pageRange.endLine
      for (let j = i + 1; j < pageRange.endLine; j += 1) {
        if (/^###\s+/.test(lines[j].trim())) {
          endLine = j
          break
        }
      }

      return { headingLine: i, contentStartLine: i + 1, endLine }
    }

    throw new Error(`PRD section not found: ${title}`)
  }

  const expected = `### ${title}`
  for (let i = pageRange.startLine + 1; i < pageRange.endLine; i += 1) {
    if (lines[i].trim() !== expected) continue

    let endLine = pageRange.endLine
    for (let j = i + 1; j < pageRange.endLine; j += 1) {
      if (/^###\s+/.test(lines[j].trim())) {
        endLine = j
        break
      }
    }

    return { headingLine: i, contentStartLine: i + 1, endLine }
  }

  throw new Error(`PRD section not found: ${title}`)
}

function findRequirementRange(lines, pageRange, reqId) {
  const matcher = new RegExp(`^###\\s+\\[${reqId}\\]\\s+`)
  for (let i = pageRange.startLine + 1; i < pageRange.endLine; i += 1) {
    if (!matcher.test(lines[i].trim())) continue

    let endLine = pageRange.endLine
    for (let j = i + 1; j < pageRange.endLine; j += 1) {
      if (/^###\s+/.test(lines[j].trim())) {
        endLine = j
        break
      }
    }

    return { headingLine: i, contentStartLine: i + 1, endLine }
  }

  throw new Error(`PRD requirement not found: ${reqId}`)
}

function normalizeContent(content) {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
}

export function updatePrdBlock(markdown, input) {
  const lines = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const starts = lineStartIndexes(markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n'))
  const pageRange = findPageRange(lines, input.page)
  const range = input.kind === 'section'
    ? findSectionRange(lines, pageRange, Number.isInteger(input.sectionIndex) ? input.sectionIndex : input.title)
    : findRequirementRange(lines, pageRange, input.reqId)

  const normalized = normalizeContent(input.content)
  const replacement = normalized ? `\n${normalized}\n\n` : '\n\n'
  const normalizedMarkdown = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const start = indexForLine(starts, range.contentStartLine)
  const end = indexForLine(starts, range.endLine)

  return `${normalizedMarkdown.slice(0, start)}${replacement}${normalizedMarkdown.slice(end)}`
}
