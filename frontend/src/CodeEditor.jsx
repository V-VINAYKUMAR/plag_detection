import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { oneDark } from '@codemirror/theme-one-dark'
import { cpp } from '@codemirror/lang-cpp'
import { java } from '@codemirror/lang-java'
import { python } from '@codemirror/lang-python'
import { javascript } from '@codemirror/lang-javascript'

const languages = {
  cpp,
  java,
  python,
  javascript,
}

export default function CodeEditor({ value, onChange, language = 'cpp' }) {
  const hostRef = useRef(null)
  const viewRef = useRef(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!hostRef.current) return

    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          closeBrackets(),
          bracketMatching(),
          indentOnInput(),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          keymap.of([...closeBracketsKeymap, ...defaultKeymap, indentWithTab]),
          oneDark,
          languages[language]?.() || cpp(),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString())
            }
          }),
          EditorView.theme({
            '&': {
              minHeight: '320px',
              fontSize: '14px',
              borderRadius: '10px',
              textAlign: 'left',
            },
            '.cm-scroller': {
              overflow: 'auto',
              fontFamily: 'SFMono-Regular, Consolas, monospace',
            },
            '.cm-content': {
              minHeight: '320px',
              padding: '12px 0',
            },
            '.cm-gutters': {
              borderRight: '1px solid #30363d',
            },
          }),
        ],
      }),
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [language])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    const currentValue = view.state.doc.toString()
    if (currentValue !== value) {
      view.dispatch({
        changes: { from: 0, to: currentValue.length, insert: value },
      })
    }
  }, [value])

  return (
    <div
      ref={hostRef}
      style={{
        marginTop: '16px',
        width: '100%',
        overflow: 'hidden',
        border: '1px solid #30363d',
        borderRadius: '10px',
        background: '#282c34',
      }}
    />
  )
}
